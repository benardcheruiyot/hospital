import api from './api';

export const listTelemedicineSessions = () =>
  api.get('/telemedicine/sessions').then((r) => r.data);
export const getSessionByRoomCode = (roomCode) =>
  api.get(`/telemedicine/sessions/${roomCode}`).then((r) => r.data);
export const startTelemedicineSession = (roomCode) =>
  api.patch(`/telemedicine/sessions/${roomCode}/start`).then((r) => r.data);
export const endTelemedicineSession = (roomCode) =>
  api.patch(`/telemedicine/sessions/${roomCode}/end`).then((r) => r.data);
export const saveTelemedicineSummary = (roomCode, payload) =>
  api.patch(`/telemedicine/sessions/${roomCode}/summary`, payload).then((r) => r.data);
