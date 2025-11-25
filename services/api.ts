import axios from 'axios';
import { AuthEvents } from '../utils/authEvents';

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
        const status = error.response?.status;
        const requestUrl: string = error.config?.url || '';

        const isAuthAttempt =
            requestUrl.includes('/auth/login') ||
            requestUrl.includes('/auth/register');

        if (status === 401 && !isAuthAttempt) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            AuthEvents.logout();

            if (typeof window !== 'undefined') {
                const hashTarget = '#/login';
                if (window.location.hash !== hashTarget) {
                    window.location.hash = hashTarget;
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;

// API endpoints
export const authAPI = {
    checkEmail: (email: string) =>
        api.post('/auth/check-email', { email }),
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (email: string, password: string, name: string, location?: string | null) =>
        api.post('/auth/register', { email, password, name, location }),
    getCurrentUser: () => api.get('/auth/me'),
    requestPasswordReset: (email: string) =>
        api.post('/auth/password-reset/request', { email }),
    verifyPasswordReset: (email: string, otp: string) =>
        api.post('/auth/password-reset/verify', { email, otp }),
    completePasswordReset: (payload: { email: string; otp: string; newPassword: string; token?: string }) =>
        api.post('/auth/password-reset/complete', payload),
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
    getReviews: (productId: string) => api.get(`/products/${productId}/reviews`),
    addReview: (
        productId: string,
        payload: { rating: number; comment?: string; reviewerName?: string; reviewerId?: string }
    ) => api.post(`/products/${productId}/reviews`, payload),
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

export const userAPI = {
    updateProfile: (data: any) => api.put('/auth/profile', data),
    savePreferences: (userId: string, interests: string[], talents: string[], futureMajor?: string) =>
        api.post('/auth/preferences', { userId, interests, talents, futureMajor }),
    getRegistrations: () => api.get('/users/registrations'),
    getCalendarEvents: (startDate?: string, endDate?: string) =>
        api.get('/users/calendar-events', { params: { startDate, endDate } }),
    addCalendarEvent: (payload: { title: string; description?: string; startDate: string; endDate: string; type?: string }) =>
        api.post('/users/calendar-events', payload),
    getStreak: () => api.get('/users/streak'),
    searchUsers: (query: string) => api.get('/users/search', { params: { query } }),
};

export const communityAPI = {
    getTeamPosts: (params?: { search?: string; tag?: string; status?: string; page?: number; pageSize?: number }) =>
        api.get('/community/team-posts', { params }),
    getTeamPostById: (id: string) => api.get(`/community/team-posts/${id}`),
    joinTeam: (id: string) => api.post(`/community/team-posts/${id}/join`),
    createTeamPost: (payload: any) => api.post('/community/team-posts', payload),
    updateTeamPost: (id: string, payload: any) => api.put(`/community/team-posts/${id}`, payload),
};

export const uploadAPI = {
    uploadGif: (file: File, setAsProfile: boolean = false) => {
        const formData = new FormData();
        formData.append('gif', file);
        formData.append('setAsProfile', setAsProfile.toString());
        return api.post('/upload/gif', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    getUserGifs: () => api.get('/upload/gifs'),
    deleteGif: (filename: string) => api.delete(`/upload/gif/${filename}`),
};

export const adminAPI = {
    getUsers: (params?: { search?: string; role?: 'USER' | 'ADMIN'; page?: number; pageSize?: number }) =>
        api.get('/auth/users', { params }),
    updateUserRole: (userId: string, role: 'USER' | 'ADMIN') =>
        api.patch(`/auth/users/${userId}/role`, { role }),
    deleteUser: (userId: string) => api.delete(`/auth/users/${userId}`),
    updateTeamPostStatus: (teamId: string, status: string) =>
        api.patch(`/community/team-posts/${teamId}/status`, { status }),
    deleteTeamPost: (teamId: string) => api.delete(`/community/team-posts/${teamId}`),
    getAuditLogs: (params?: { page?: number; pageSize?: number }) =>
        api.get('/admin/audit-logs', { params }),
};
