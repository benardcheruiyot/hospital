import api from './api';

export const getMyPatientProfile = () => api.get('/patients/me').then((r) => r.data);
export const updateMyPatientProfile = (payload) =>
  api.put('/patients/me', payload).then((r) => r.data);
export const listPatients = (params) => api.get('/patients', { params }).then((r) => r.data);
