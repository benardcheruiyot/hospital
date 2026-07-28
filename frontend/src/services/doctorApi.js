import api from './api';

export const createDoctor = (payload) => api.post('/doctors', payload).then((r) => r.data);
export const listDoctors = (params) => api.get('/doctors', { params }).then((r) => r.data);
export const getMyDoctorProfile = () => api.get('/doctors/me').then((r) => r.data);
export const updateMyDoctorProfile = (payload) => api.put('/doctors/me', payload).then((r) => r.data);
export const getMyDoctorAvailability = () => api.get('/doctors/me/availability').then((r) => r.data);
export const updateMyDoctorAvailability = (payload) =>
	api.put('/doctors/me/availability', payload).then((r) => r.data);
export const getDoctorAvailability = (doctorId) =>
	api.get(`/doctors/${doctorId}/availability`).then((r) => r.data);
export const getDoctorAvailableSlots = (doctorId, params) =>
	api.get(`/doctors/${doctorId}/available-slots`, { params }).then((r) => r.data);
