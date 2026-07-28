const { Op } = require('sequelize');
const { Appointment, Patient, Doctor, User, TelemedicineSession, DoctorAvailability } = require('../models');
const ApiError = require('../utils/ApiError');
const { generateRoomCode } = require('../services/telemedicine.service');

const DEFAULT_AVAILABILITY = {
  availableDays: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 17,
  slotMinutes: 30,
  isActive: true,
};

const appointmentIncludes = [
  {
    model: Patient,
    include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }],
  },
  {
    model: Doctor,
    include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }],
  },
  {
    model: TelemedicineSession,
    attributes: ['id', 'roomCode', 'status', 'startedAt', 'endedAt'],
  },
];

const getCurrentPatient = async (userId) => {
  const patient = await Patient.findOne({ where: { userId } });
  if (!patient) throw new ApiError(404, 'Complete your patient registration first');
  return patient;
};

const assertPatientRegistrationReady = (patient) => {
  if (patient.registrationStatus !== 'verified') {
    throw new ApiError(409, 'Complete and verify your registration profile before this action.');
  }
};

const getCurrentDoctor = async (userId) => {
  const doctor = await Doctor.findOne({ where: { userId } });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');
  return doctor;
};

const assertAppointmentAccess = async (user, appointment) => {
  if (user.role === 'admin') return;

  if (user.role === 'patient') {
    const patient = await getCurrentPatient(user.id);
    if (appointment.patientId !== patient.id) {
      throw new ApiError(403, 'You do not have access to this appointment');
    }
    return;
  }

  if (user.role === 'doctor') {
    const doctor = await getCurrentDoctor(user.id);
    if (appointment.doctorId !== doctor.id) {
      throw new ApiError(403, 'You do not have access to this appointment');
    }
  }
};

const assertFutureAppointment = (appointment) => {
  if (new Date(appointment.scheduledAt).getTime() <= Date.now()) {
    throw new ApiError(409, 'Only future appointments can be modified');
  }
};

const parseAvailableDays = (stored) => {
  if (!stored) return DEFAULT_AVAILABILITY.availableDays;
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map((item) => Number(item)).filter((item) => Number.isInteger(item)) : DEFAULT_AVAILABILITY.availableDays;
  } catch {
    return DEFAULT_AVAILABILITY.availableDays;
  }
};

const getAvailabilityForDoctor = async (doctorId) => {
  const availability = await DoctorAvailability.findOne({ where: { doctorId } });
  if (!availability) return { ...DEFAULT_AVAILABILITY };

  return {
    availableDays: parseAvailableDays(availability.availableDays),
    startHour: availability.startHour,
    endHour: availability.endHour,
    slotMinutes: availability.slotMinutes,
    isActive: availability.isActive,
  };
};

const assertDoctorAvailability = (scheduledDate, availability) => {
  if (!availability.isActive) {
    throw new ApiError(409, 'Selected doctor is currently not available for new appointments.');
  }

  const day = scheduledDate.getDay();
  if (!availability.availableDays.includes(day)) {
    throw new ApiError(409, 'Selected doctor is not available on that day. Please choose another day.');
  }

  const totalMinutes = scheduledDate.getHours() * 60 + scheduledDate.getMinutes();
  const startMinutes = availability.startHour * 60;
  const endMinutes = availability.endHour * 60;
  if (totalMinutes < startMinutes || totalMinutes >= endMinutes) {
    throw new ApiError(409, 'Selected time is outside the doctor availability window.');
  }

  if ((totalMinutes - startMinutes) % availability.slotMinutes !== 0) {
    throw new ApiError(409, `Please choose a time aligned to ${availability.slotMinutes}-minute slots.`);
  }
};

// POST /api/appointments  (patient schedules an appointment)
const createAppointment = async (req, res) => {
  const patient = await getCurrentPatient(req.user.id);
  assertPatientRegistrationReady(patient);

  const { doctorId, scheduledAt, durationMinutes, type, reason } = req.body;
  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) {
    throw new ApiError(422, 'scheduledAt must be a valid date');
  }

  const doctor = await Doctor.findByPk(doctorId);
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const availability = await getAvailabilityForDoctor(doctorId);
  assertDoctorAvailability(scheduledDate, availability);

  // Basic conflict check
  const conflict = await Appointment.findOne({
    where: {
      doctorId,
      status: { [Op.in]: ['scheduled', 'confirmed'] },
      scheduledAt,
    },
  });
  if (conflict) throw new ApiError(409, 'This time slot is already booked for the selected doctor');

  const appointment = await Appointment.create({
    patientId: patient.id,
    doctorId,
    scheduledAt: scheduledDate,
    durationMinutes: durationMinutes || 30,
    type: type || 'in_person',
    reason,
  });

  if (appointment.type === 'telemedicine') {
    await TelemedicineSession.create({
      appointmentId: appointment.id,
      patientId: patient.id,
      doctorId,
      roomCode: generateRoomCode(),
    });
  }

  res.status(201).json({ success: true, message: 'Appointment scheduled', data: appointment });
};

// GET /api/appointments  (role-aware listing)
const listAppointments = async (req, res) => {
  const { status, from, to } = req.query;
  const where = {};
  if (status) where.status = status;
  if (from || to) {
    where.scheduledAt = {};
    if (from) where.scheduledAt[Op.gte] = new Date(from);
    if (to) where.scheduledAt[Op.lte] = new Date(to);
  }

  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ where: { userId: req.user.id } });
    if (!patient) return res.json({ success: true, data: [] });
    where.patientId = patient.id;
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
    if (!doctor) return res.json({ success: true, data: [] });
    where.doctorId = doctor.id;
  }

  const appointments = await Appointment.findAll({
    where,
    include: appointmentIncludes,
    order: [['scheduledAt', 'ASC']],
  });

  res.json({ success: true, data: appointments });
};

// GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
  const appointment = await Appointment.findByPk(req.params.id, { include: appointmentIncludes });
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  await assertAppointmentAccess(req.user, appointment);
  res.json({ success: true, data: appointment });
};

// PATCH /api/appointments/:id/status
const updateAppointmentStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
  if (!allowed.includes(status)) throw new ApiError(422, 'Invalid status value');

  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  await assertAppointmentAccess(req.user, appointment);

  appointment.status = status;
  if (status === 'completed') appointment.completedAt = new Date();
  await appointment.save();

  res.json({ success: true, message: 'Appointment status updated', data: appointment });
};

// PATCH /api/appointments/:id/reschedule
const rescheduleAppointment = async (req, res) => {
  const patient = await getCurrentPatient(req.user.id);
  const { scheduledAt } = req.body;

  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.patientId !== patient.id) {
    throw new ApiError(403, 'You cannot reschedule this appointment');
  }
  if (!['scheduled', 'confirmed'].includes(appointment.status)) {
    throw new ApiError(409, 'Only scheduled or confirmed appointments can be rescheduled');
  }

  assertFutureAppointment(appointment);

  const conflict = await Appointment.findOne({
    where: {
      id: { [Op.ne]: appointment.id },
      doctorId: appointment.doctorId,
      status: { [Op.in]: ['scheduled', 'confirmed'] },
      scheduledAt,
    },
  });
  if (conflict) throw new ApiError(409, 'This time slot is already booked for the selected doctor');

  appointment.scheduledAt = scheduledAt;
  appointment.status = 'scheduled';
  appointment.checkedInAt = null;
  await appointment.save();

  const reloaded = await Appointment.findByPk(appointment.id, { include: appointmentIncludes });
  res.json({ success: true, message: 'Appointment rescheduled', data: reloaded });
};

// PATCH /api/appointments/:id/cancel
const cancelAppointment = async (req, res) => {
  const patient = await getCurrentPatient(req.user.id);
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.patientId !== patient.id) {
    throw new ApiError(403, 'You cannot cancel this appointment');
  }
  if (!['scheduled', 'confirmed'].includes(appointment.status)) {
    throw new ApiError(409, 'Only scheduled or confirmed appointments can be cancelled');
  }

  assertFutureAppointment(appointment);

  appointment.status = 'cancelled';
  await appointment.save();

  if (appointment.type === 'telemedicine') {
    await TelemedicineSession.update(
      { status: 'cancelled' },
      { where: { appointmentId: appointment.id } }
    );
  }

  const reloaded = await Appointment.findByPk(appointment.id, { include: appointmentIncludes });
  res.json({ success: true, message: 'Appointment cancelled', data: reloaded });
};

// PATCH /api/appointments/:id/check-in
const checkInAppointment = async (req, res) => {
  const patient = await getCurrentPatient(req.user.id);
  assertPatientRegistrationReady(patient);
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.patientId !== patient.id) {
    throw new ApiError(403, 'You cannot check in to this appointment');
  }
  if (!['scheduled', 'confirmed'].includes(appointment.status)) {
    throw new ApiError(409, 'This appointment cannot be checked in');
  }

  appointment.checkedInAt = new Date();
  appointment.status = 'confirmed';
  await appointment.save();

  const reloaded = await Appointment.findByPk(appointment.id, { include: appointmentIncludes });
  res.json({ success: true, message: 'Checked in successfully', data: reloaded });
};

module.exports = {
  createAppointment,
  listAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  checkInAppointment,
};
