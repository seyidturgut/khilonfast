import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Simple Frontend Cache
const frontendCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Cache handling for GET requests
        if (config.method === 'get') {
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
        if (response.config.method === 'get' && response.status === 200) {
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
    getMe: () => api.get('/auth/me')
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

export const paymentAPI = {
    initiate: (data: ApiPayload) => api.post('/payment/initiate', data),
    getStatus: (orderId: IdParam) => api.get(`/payment/status/${orderId}`)
};

export default api;
