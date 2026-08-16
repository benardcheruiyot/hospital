const { User, Patient } = require('../models');
const { signToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

// POST /api/auth/register
const register = async (req, res) => {
  const { firstName, lastName, email, password, phone, dateOfBirth, gender } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    role: 'patient',
    passwordHash: password,
  });

  await Patient.create({
    userId: user.id,
    dateOfBirth: dateOfBirth || null,
    gender: gender || null,
    registrationStatus: 'pending',
  });

  const token = signToken({ id: user.id, role: user.role });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user: user.toSafeJSON(), token },
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password, portal } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.validatePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated');
  }

  if (portal === 'patient' && user.role !== 'patient') {
    throw new ApiError(403, 'Use the staff portal for this account');
  }

  if (portal === 'staff' && user.role === 'patient') {
    throw new ApiError(403, 'Use the patient portal for this account');
  }

  if (portal === 'admin' && user.role !== 'admin') {
    throw new ApiError(403, 'Use the patient or staff portal for this account');
  }

  const token = signToken({ id: user.id, role: user.role });

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: user.toSafeJSON(), token },
  });
};

const verifyGoogleToken = async (idToken) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(500, 'Google authentication is not configured on the server');
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) {
    throw new ApiError(401, 'Unable to verify Google token');
  }

  const payload = await response.json();
  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(401, 'Invalid Google client ID');
  }
  if (!payload.email_verified) {
    throw new ApiError(401, 'Google email is not verified');
  }
  return payload;
};

const google = async (req, res) => {
  const { idToken, portal } = req.body;
  const tokenPayload = await verifyGoogleToken(idToken);

  const email = tokenPayload.email;
  const firstName = tokenPayload.given_name || 'Google';
  const lastName = tokenPayload.family_name || 'User';
  const requestedPortal = portal === 'staff' ? 'staff' : 'patient';

  const existing = await User.findOne({ where: { email } });
  let user = existing;

  if (user) {
    if (requestedPortal === 'patient' && user.role !== 'patient') {
      throw new ApiError(403, 'Use the staff portal for this account');
    }
    if (requestedPortal === 'staff' && user.role === 'patient') {
      throw new ApiError(403, 'Use the patient portal for this account');
    }
  } else {
    if (requestedPortal === 'staff') {
      throw new ApiError(
        403,
        'Staff accounts must be created by an administrator before signing in.'
      );
    }

    user = await User.create({
      firstName,
      lastName,
      email,
      phone: null,
      role: 'patient',
      passwordHash: Math.random().toString(36).slice(2) + Date.now(),
    });

    await Patient.create({
      userId: user.id,
      dateOfBirth: null,
      gender: null,
      registrationStatus: 'pending',
    });
  }

  const token = signToken({ id: user.id, role: user.role });

  res.json({
    success: true,
    message: 'Google sign-in successful',
    data: { user: user.toSafeJSON(), token },
  });
};

// GET /api/auth/me
const me = async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
};

module.exports = { register, login, google, me };
