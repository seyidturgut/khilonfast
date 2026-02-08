import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me')
};

export const productsAPI = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    getByKey: (key) => api.get(`/products/key/${key}`)
};

export const ordersAPI = {
    create: (data) => api.post('/orders', data),
    getById: (id) => api.get(`/orders/${id}`),
    getUserOrders: (userId) => api.get(`/orders/user/${userId}`)
};

export const paymentAPI = {
    initiate: (data) => api.post('/payment/initiate', data),
    getStatus: (orderId) => api.get(`/payment/status/${orderId}`)
};

export default api;
