import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connect error:', err.message);
  });

  socket.on('reconnect_attempt', (attempt) => {
    console.info(`Socket reconnect attempt ${attempt}`);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
