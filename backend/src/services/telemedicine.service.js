const crypto = require('crypto');

// Generates a short, URL-safe room code for a telemedicine session
const generateRoomCode = () => crypto.randomBytes(6).toString('hex');

module.exports = { generateRoomCode };
