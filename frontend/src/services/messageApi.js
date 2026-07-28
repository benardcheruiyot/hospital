import api from './api';

export const getInbox = () => api.get('/messages/inbox').then((r) => r.data);
export const getUnreadCount = () => api.get('/messages/unread-count').then((r) => r.data);
export const getThread = () => api.get('/messages/thread').then((r) => r.data);
export const sendMessage = (payload) => api.post('/messages', payload).then((r) => r.data);
export const markThreadAsRead = () => api.patch('/messages/thread/read').then((r) => r.data);
export const markMessageAsRead = (id) => api.patch(`/messages/${id}/read`).then((r) => r.data);
