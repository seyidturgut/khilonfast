import axios from 'axios';
import { API_BASE_URL, logApiTarget } from '../config/api';

logApiTarget();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Simple Frontend Cache
const frontendCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Kullanıcıya/oturuma bağlı cevaplar cache'lenmemeli — yoksa kullanıcı değişince
// önceki kullanıcının verisi geri okunur (ör. admin → user geçişinde admin paneli açılır).
const NON_CACHEABLE_PATTERNS = [
    /^\/auth\//,
    /^\/profile/,
    /^\/orders/,
    /^\/payment\//,
    /^\/admin\//,
    /^\/onboarding-form/,
    /^\/company/,
    // Ürün fiyatları admin tarafından güncellenebildiği için 5 dk cache çok uzun;
    // bunun yerine her isteği taze çekiyoruz (backend zaten kendi node-cache'ini admin write'larında flush ediyor).
    /^\/products/,
    /^\/coupons/
];

const isCacheable = (url?: string) => {
    if (!url) return false;
    return !NON_CACHEABLE_PATTERNS.some((re) => re.test(url));
};

/**
 * Cache'i sıfırla. Login / logout / activateToken sırasında çağrılır ki bir önceki
 * oturumun verisi yeni oturuma sızmasın.
 */
export const clearApiCache = () => {
    frontendCache.clear();
};

// Build-time prerender (puppeteer) sırasında API isteklerini hemen boş cevapla short-circuit et —
// aksi halde axios sonsuza kadar bekler ve prerender timeout olur.
const isPrerendering = typeof window !== 'undefined' && (window as any).__PRERENDER__ === true;

// Add token to requests
api.interceptors.request.use(
    (config) => {
        if (isPrerendering) {
            // Tüm istekleri boş cevap döndür, network'e çıkma
            config.adapter = () => Promise.resolve({
                data: {},
                status: 200,
                statusText: 'OK (prerender stub)',
                headers: config.headers,
                config,
                request: {}
            });
            return config;
        }
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Cache handling for GET requests (kullanıcıya özel endpointler hariç)
        if (config.method === 'get' && isCacheable(config.url)) {
            const cacheKey = config.url + JSON.stringify(config.params || {});
            const cachedValue = frontendCache.get(cacheKey);

            if (cachedValue && (Date.now() - cachedValue.timestamp < CACHE_TTL)) {
                // Return cached data
                config.adapter = () => {
                    return Promise.resolve({
                        data: cachedValue.data,
                        status: 200,
                        statusText: 'OK',
                        headers: config.headers,
                        config: config,
                        request: {}
                    });
                };
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor to save successful GET responses to cache
api.interceptors.response.use(
    (response) => {
        if (
            response.config.method === 'get' &&
            response.status === 200 &&
            isCacheable(response.config.url)
        ) {
            const cacheKey = response.config.url + JSON.stringify(response.config.params || {});
            frontendCache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
            });
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// API Functions
type ApiPayload = Record<string, any>;
type IdParam = number | string;

export const authAPI = {
    register: (data: ApiPayload) => api.post('/auth/register', data),
    login: (data: ApiPayload) => api.post('/auth/login', data),
    google: (data: ApiPayload) => api.post('/auth/google', data),
    getMe: () => api.get('/auth/me'),
    setPassword: (password: string) => api.post('/auth/set-password', { password })
};

export const productsAPI = {
    getAll: () => api.get('/products'),
    getById: (id: IdParam) => api.get(`/products/${id}`),
    getByKey: (key: IdParam) => api.get(`/products/key/${key}`)
};

export const ordersAPI = {
    create: (data: ApiPayload) => api.post('/orders', data),
    getById: (id: IdParam) => api.get(`/orders/${id}`),
    getUserOrders: (userId: IdParam) => api.get(`/orders/user/${userId}`)
};

export const couponAPI = {
    validate: (data: ApiPayload) => api.post('/coupons/validate', data)
};

export const paymentAPI = {
    initiate: (data: ApiPayload) => api.post('/payment/initiate', data),
    bankTransfer: (data: ApiPayload) => api.post('/payment/bank-transfer', data),
    getStatus: (orderId: IdParam) => api.get(`/payment/status/${orderId}`),
    getSavedCards: () => api.get('/payment/cards'),
    deleteSavedCard: (cardId: IdParam) => api.delete(`/payment/cards/${cardId}`),
    setDefaultCard: (cardId: IdParam) => api.patch(`/payment/cards/${cardId}/default`, {}),
    getBankAccounts: () => api.get('/payment/bank-accounts')
};

export const adminBankAccountsAPI = {
    list: () => api.get('/admin/bank-accounts'),
    create: (data: ApiPayload) => api.post('/admin/bank-accounts', data),
    update: (id: IdParam, data: ApiPayload) => api.put(`/admin/bank-accounts/${id}`, data),
    delete: (id: IdParam) => api.delete(`/admin/bank-accounts/${id}`)
};

export const emailAutomationAPI = {
    logEvent: (data: ApiPayload) => api.post('/email-automation/event', data),
    getSequences: () => api.get('/admin/email-sequences'),
    updateSequence: (id: IdParam, data: ApiPayload) => api.put(`/admin/email-sequences/${id}`, data),
    updateStep: (id: IdParam, data: ApiPayload) => api.put(`/admin/email-sequence-steps/${id}`, data),
    getQueue: (params?: ApiPayload) => api.get('/admin/email-queue', { params }),
    getStats: () => api.get('/admin/email-stats')
};

export default api;
