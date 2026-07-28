import api from './api';

export const registerUser = (payload) => api.post('/auth/register', payload).then((r) => r.data);
export const loginUser = (payload) => api.post('/auth/login', payload).then((r) => r.data);
export const googleAuth = (payload) => api.post('/auth/google', payload).then((r) => r.data);
export const fetchCurrentUser = () => api.get('/auth/me').then((r) => r.data);
