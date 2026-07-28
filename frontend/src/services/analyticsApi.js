import api from './api';

export const getOverview = () => api.get('/analytics/overview').then((r) => r.data);
export const getAppointmentsByDay = (days = 14) =>
  api.get('/analytics/appointments-by-day', { params: { days } }).then((r) => r.data);
export const getAppointmentsByStatus = () =>
  api.get('/analytics/appointments-by-status').then((r) => r.data);
export const getAppointmentsByDoctor = () =>
  api.get('/analytics/appointments-by-doctor').then((r) => r.data);
