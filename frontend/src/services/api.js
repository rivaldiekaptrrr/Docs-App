import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
// Base backend URL without /api suffix, for serving static files like uploads
const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

// Helper to resolve image URLs - handles both relative paths and absolute URLs
export const getImageUrl = (url) => {
    if (!url) return '';
    // Already an absolute URL
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Relative path like /uploads/errors/image.png
    return `${BACKEND_URL}${url}`;
};

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
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

// Handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API methods
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me')
};

export const projectsAPI = {
    getAll: (params) => api.get('/projects', { params }),
    getById: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`)
};

export const projectMembersAPI = {
    getMembers: (projectId) => api.get(`/project-members/${projectId}/members`),
    addMember: (projectId, data) => api.post(`/project-members/${projectId}/members`, data),
    removeMember: (projectId, userId) => api.delete(`/project-members/${projectId}/members/${userId}`),
    checkAccess: (projectId) => api.get(`/project-members/${projectId}/check-access`)
};

export const documentationAPI = {
    getByProject: (projectId) => api.get(`/documentation/project/${projectId}`),
    getById: (id) => api.get(`/documentation/${id}`),
    create: (data) => api.post('/documentation', data),
    update: (id, data) => api.put(`/documentation/${id}`, data),
    delete: (id) => api.delete(`/documentation/${id}`)
};

export const logbookAPI = {
    getAll: (params) => api.get('/logbook', { params }),
    getById: (id) => api.get(`/logbook/${id}`),
    create: (data) => api.post('/logbook', data),
    update: (id, data) => api.put(`/logbook/${id}`, data),
    delete: (id) => api.delete(`/logbook/${id}`)
};

export const errorsAPI = {
    getAll: (params) => api.get('/errors', { params }),
    getById: (id) => api.get(`/errors/${id}`),
    create: (data) => api.post('/errors', data),
    update: (id, data) => api.put(`/errors/${id}`, data),
    updateStatus: (id, status) => api.patch(`/errors/${id}/status`, { status }),
    delete: (id) => api.delete(`/errors/${id}`)
};

export const uploadAPI = {
    uploadImage: (file, type = 'general') => {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('image', file);
        return api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    uploadImages: (files, type = 'general') => {
        const formData = new FormData();
        formData.append('type', type);
        files.forEach(file => formData.append('images', file));
        return api.post('/upload/images', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    uploadBase64: (base64Data, type = 'general', filename = 'pasted-image') => {
        return api.post('/upload/base64', { image: base64Data, type, filename });
    }
};


// Admin APIs
export const usersAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    resetPassword: (id, new_password) => api.post(`/users/${id}/reset-password`, { new_password })
};

export const activityAPI = {
    getAll: (params) => api.get('/activity', { params }),
    getStats: (days = 30) => api.get('/activity/stats', { params: { days } }),
    getActions: () => api.get('/activity/actions')
};

export const settingsAPI = {
    getAll: () => api.get('/settings'),
    getByKey: (key) => api.get(`/settings/${key}`),
    update: (key, value) => api.put(`/settings/${key}`, { setting_value: value }),
    bulkUpdate: (settings) => api.post('/settings/bulk-update', { settings })
};

export default api;
