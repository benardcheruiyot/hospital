const { TelemedicineSession, Patient, Doctor, User, Appointment } = require('../models');
const ApiError = require('../utils/ApiError');

const parseNotes = (notes) => {
  if (!notes) return {};

  try {
    const parsed = JSON.parse(notes);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return { legacyNotes: notes };
  }
};

const includes = [
  { model: Patient, include: [{ model: User, attributes: ['firstName', 'lastName'] }] },
  { model: Doctor, include: [{ model: User, attributes: ['firstName', 'lastName'] }] },
  { model: Appointment },
];

const resolveActorIds = async (user) => {
  if (user.role === 'admin') {
    return { patientId: null, doctorId: null };
  }

  if (user.role === 'patient') {
    const patient = await Patient.findOne({ where: { userId: user.id } });
    return { patientId: patient?.id || null, doctorId: null };
  }

  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ where: { userId: user.id } });
    return { patientId: null, doctorId: doctor?.id || null };
  }

  return { patientId: null, doctorId: null };
};

const assertSessionAccess = (session, user, actorIds) => {
  if (user.role === 'admin') return;

  if (user.role === 'patient' && session.patientId === actorIds.patientId) return;
  if (user.role === 'doctor' && session.doctorId === actorIds.doctorId) return;

  throw new ApiError(403, 'You do not have access to this telemedicine session');
};

const findAuthorizedSession = async (req, extraInclude = includes) => {
  const session = await TelemedicineSession.findOne({
    where: { roomCode: req.params.roomCode },
    include: extraInclude,
  });
  if (!session) throw new ApiError(404, 'Telemedicine session not found');

  const actorIds = await resolveActorIds(req.user);
  assertSessionAccess(session, req.user, actorIds);
  return session;
};

// GET /api/telemedicine/sessions
const listSessions = async (req, res) => {
  const where = {};
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ where: { userId: req.user.id } });
    if (!patient) return res.json({ success: true, data: [] });
    where.patientId = patient.id;
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
    if (!doctor) return res.json({ success: true, data: [] });
    where.doctorId = doctor.id;
  }

  const sessions = await TelemedicineSession.findAll({ where, include: includes });
  res.json({ success: true, data: sessions });
};

// GET /api/telemedicine/sessions/:roomCode
const getSessionByRoomCode = async (req, res) => {
  const session = await findAuthorizedSession(req);
  res.json({ success: true, data: session });
};

// PATCH /api/telemedicine/sessions/:roomCode/start
const startSession = async (req, res) => {
  const session = await findAuthorizedSession(req, []);
  session.status = 'active';
  session.startedAt = new Date();
  await session.save();
  res.json({ success: true, data: session });
};

// PATCH /api/telemedicine/sessions/:roomCode/end
const endSession = async (req, res) => {
  const session = await findAuthorizedSession(req, []);
  session.status = 'ended';
  session.endedAt = new Date();
  await session.save();
  res.json({ success: true, data: session });
};

// PATCH /api/telemedicine/sessions/:roomCode/summary
const updateSessionSummary = async (req, res) => {
  const session = await findAuthorizedSession(req, [{ model: Appointment }]);

  const appointment = session.Appointment;
  if (!appointment) throw new ApiError(404, 'Linked appointment not found');

  const currentNotes = parseNotes(appointment.notes);
  appointment.notes = JSON.stringify({
    ...currentNotes,
    consultationSummary: req.body.consultationSummary || '',
    followUpDirectives: req.body.followUpDirectives || '',
    prescriptionNotes: req.body.prescriptionNotes || '',
    lastUpdatedAt: new Date().toISOString(),
  });
  await appointment.save();

  const updated = await TelemedicineSession.findOne({
    where: { roomCode: req.params.roomCode },
    include: includes,
  });

  res.json({ success: true, data: updated });
};

module.exports = {
  listSessions,
  getSessionByRoomCode,
  startSession,
  endSession,
  updateSessionSummary,
};
