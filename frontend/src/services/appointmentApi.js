import api from './api';

export const createAppointment = (payload) =>
  api.post('/appointments', payload).then((r) => r.data);
export const listAppointments = (params) =>
  api.get('/appointments', { params }).then((r) => r.data);
export const rescheduleAppointment = (id, scheduledAt) =>
  api.patch(`/appointments/${id}/reschedule`, { scheduledAt }).then((r) => r.data);
export const cancelAppointment = (id) =>
  api.patch(`/appointments/${id}/cancel`).then((r) => r.data);
export const checkInAppointment = (id) =>
  api.patch(`/appointments/${id}/check-in`).then((r) => r.data);
export const updateAppointmentStatus = (id, status) =>
  api.patch(`/appointments/${id}/status`, { status }).then((r) => r.data);
