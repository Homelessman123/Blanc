import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
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

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// API endpoints
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (email: string, password: string, name: string) =>
        api.post('/auth/register', { email, password, name }),
    getCurrentUser: () => api.get('/auth/me'),
};

export const contestAPI = {
    getAll: () => api.get('/contests'),
    getById: (id: string) => api.get(`/contests/${id}`),
    create: (data: any) => api.post('/contests', data),
    update: (id: string, data: any) => api.put(`/contests/${id}`, data),
    delete: (id: string) => api.delete(`/contests/${id}`),
    participate: (id: string) => api.post(`/contests/${id}/participate`),
};

export const productAPI = {
    getAll: () => api.get('/products'),
    getById: (id: string) => api.get(`/products/${id}`),
    create: (data: any) => api.post('/products', data),
    update: (id: string, data: any) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
    getByContest: (contestId: string) => api.get(`/products/contest/${contestId}`),
};

export const cartAPI = {
    get: () => api.get('/cart'),
    addItem: (productId: string, quantity: number) =>
        api.post('/cart/items', { productId, quantity }),
    updateItem: (productId: string, quantity: number) =>
        api.put('/cart/items', { productId, quantity }),
    removeItem: (productId: string) =>
        api.delete(`/cart/items/${productId}`),
    clear: () => api.delete('/cart'),
};

export const orderAPI = {
    getAll: () => api.get('/orders'),
    getById: (id: string) => api.get(`/orders/${id}`),
    create: (data: any) => api.post('/orders', data),
    updateStatus: (id: string, status: string) =>
        api.put(`/orders/${id}/status`, { status }),
};

export const walletAPI = {
    getBalance: () => api.get('/wallet/balance'),
    requestPayout: (amount: number) =>
        api.post('/wallet/payout', { amount }),
    getTransactions: () => api.get('/wallet/transactions'),
    getPayoutRequests: () => api.get('/wallet/payouts'),
};
