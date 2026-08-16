import api from './api';

export const createDoctor = (payload) => api.post('/doctors', payload).then((r) => r.data);
export const listDoctors = (params) => api.get('/doctors', { params }).then((r) => r.data);
export const listDoctorCredentials = () => api.get('/doctors/credentials').then((r) => r.data);
export const listSpecialties = () => api.get('/doctors/specialties').then((r) => r.data);
export const deleteDoctor = (doctorId) => api.delete(`/doctors/${doctorId}`).then((r) => r.data);
export const restoreDoctor = (doctorId) => api.put(`/doctors/${doctorId}/restore`).then((r) => r.data);
export const restoreAllInactiveDoctors = () => api.put('/doctors/restore-inactive').then((r) => r.data);
export const getMyDoctorProfile = () => api.get('/doctors/me').then((r) => r.data);
export const updateMyDoctorProfile = (payload) => api.put('/doctors/me', payload).then((r) => r.data);
export const getMyDoctorAvailability = () => api.get('/doctors/me/availability').then((r) => r.data);
export const updateMyDoctorAvailability = (payload) =>
	api.put('/doctors/me/availability', payload).then((r) => r.data);
export const getDoctorAvailability = (doctorId) =>
	api.get(`/doctors/${doctorId}/availability`).then((r) => r.data);
export const getDoctorAvailableSlots = (doctorId, params) =>
	api.get(`/doctors/${doctorId}/available-slots`, { params }).then((r) => r.data);
