import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
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
