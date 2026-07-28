const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token missing');
  }

  const token = header.split(' ')[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findByPk(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User no longer exists or is inactive');
  }

  req.user = user;
  next();
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    throw new ApiError(403, 'You do not have permission to perform this action');
  }
  next();
};

module.exports = { authenticate, authorize };
