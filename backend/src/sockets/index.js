const { verifyToken } = require('../utils/jwt');

/**
 * Registers all Socket.IO event handlers.
 * Handles:
 *  - authenticated presence rooms (per-user room for direct messaging)
 *  - WebRTC signaling for telemedicine video sessions (join/offer/answer/ice-candidate/leave)
 */
function registerSocketHandlers(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyToken(token);
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);

    // ---- Telemedicine / WebRTC signaling ----
    socket.on('telemedicine:join', ({ roomCode }) => {
      socket.join(`room:${roomCode}`);
      socket.to(`room:${roomCode}`).emit('telemedicine:peer-joined', { userId });
    });

    socket.on('telemedicine:signal', ({ roomCode, signal }) => {
      socket.to(`room:${roomCode}`).emit('telemedicine:signal', { userId, signal });
    });

    socket.on('telemedicine:leave', ({ roomCode }) => {
      socket.leave(`room:${roomCode}`);
      socket.to(`room:${roomCode}`).emit('telemedicine:peer-left', { userId });
    });

    // ---- Secure messaging typing indicators ----
    socket.on('message:typing', ({ recipientId }) => {
      io.to(`user:${recipientId}`).emit('message:typing', { senderId: userId });
    });

    socket.on('disconnect', () => {
      // Presence cleanup could be extended here (e.g. broadcasting offline status)
    });
  });
}

module.exports = registerSocketHandlers;
