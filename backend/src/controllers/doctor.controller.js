const { Op } = require('sequelize');
const { Doctor, User, DoctorAvailability, Appointment } = require('../models');
const ApiError = require('../utils/ApiError');

const DEFAULT_AVAILABILITY = {
  availableDays: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 17,
  slotMinutes: 30,
  isActive: true,
};

const normalizeDays = (value) => {
  if (!Array.isArray(value)) return DEFAULT_AVAILABILITY.availableDays;

  const normalized = value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6);

  return normalized.length ? [...new Set(normalized)].sort((a, b) => a - b) : DEFAULT_AVAILABILITY.availableDays;
};

const parseStoredDays = (storedDays) => {
  if (!storedDays) return DEFAULT_AVAILABILITY.availableDays;
  try {
    return normalizeDays(JSON.parse(storedDays));
  } catch {
    return DEFAULT_AVAILABILITY.availableDays;
  }
};

const availabilityToResponse = (availability) => {
  if (!availability) return { ...DEFAULT_AVAILABILITY };

  return {
    availableDays: parseStoredDays(availability.availableDays),
    startHour: availability.startHour,
    endHour: availability.endHour,
    slotMinutes: availability.slotMinutes,
    isActive: availability.isActive,
  };
};

// POST /api/doctors
const createDoctor = async (req, res) => {
  const { firstName, lastName, email, password, phone, specialty } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'A user with that email already exists');
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone: phone || null,
    role: 'doctor',
    passwordHash: password,
  });

  const doctor = await Doctor.create({
    userId: user.id,
    specialty: specialty || 'General Practice',
  });

  await DoctorAvailability.create({
    doctorId: doctor.id,
    availableDays: JSON.stringify(DEFAULT_AVAILABILITY.availableDays),
    startHour: DEFAULT_AVAILABILITY.startHour,
    endHour: DEFAULT_AVAILABILITY.endHour,
    slotMinutes: DEFAULT_AVAILABILITY.slotMinutes,
    isActive: DEFAULT_AVAILABILITY.isActive,
  });

  const createdDoctor = await Doctor.findByPk(doctor.id, {
    include: [
      { model: User, attributes: ['firstName', 'lastName', 'email', 'phone'] },
      { model: DoctorAvailability, attributes: ['availableDays', 'startHour', 'endHour', 'slotMinutes', 'isActive'] },
    ],
  });

  res.status(201).json({ success: true, message: 'Doctor account created', data: createdDoctor });
};

// GET /api/doctors
const listDoctors = async (req, res) => {
  const { specialty } = req.query;
  const where = specialty ? { specialty } : {};

  const doctors = await Doctor.findAll({
    where,
    include: [
      { model: User, attributes: ['firstName', 'lastName', 'email'] },
      {
        model: DoctorAvailability,
        attributes: ['availableDays', 'startHour', 'endHour', 'slotMinutes', 'isActive'],
        required: false,
      },
    ],
  });

  const mapped = doctors.map((doctor) => {
    const plain = doctor.toJSON();
    plain.availability = availabilityToResponse(plain.DoctorAvailability || null);
    delete plain.DoctorAvailability;
    return plain;
  });

  res.json({ success: true, data: mapped });
};

// GET /api/doctors/credentials
const listDoctorCredentials = async (req, res) => {
  const doctors = await User.findAll({
    where: { role: 'doctor' },
    include: [{ model: Doctor, attributes: ['specialty'] }],
    order: [['createdAt', 'ASC']],
  });

  const defaultPassword = 'ChangeMe123!';
  const credentials = await Promise.all(
    doctors.map(async (user) => {
      const hasDefaultPassword = await user.validatePassword(defaultPassword);
      return {
        id: user.id,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
        phone: user.phone || null,
        specialty: user.Doctor?.specialty || 'General Practice',
        isActive: user.isActive,
        loginPassword: hasDefaultPassword ? defaultPassword : 'Password changed',
        createdAt: user.createdAt,
      };
    })
  );

  res.json({ success: true, data: credentials });
};

// GET /api/doctors/specialties
const listSpecialties = async (req, res) => {
  // Group by specialty to get distinct values
  const rows = await Doctor.findAll({
    attributes: ['specialty'],
    group: ['specialty'],
    order: [['specialty', 'ASC']],
  });

  const specialties = rows.map((r) => (r.specialty || 'General Practice'));
  // Deduplicate and normalize
  const unique = Array.from(new Set(specialties)).map((s) => (s || 'General Practice'));
  res.json({ success: true, data: unique.sort() });
};

// DELETE /api/doctors/:id
const deactivateDoctor = async (req, res) => {
  const doctorUser = await User.findOne({
    where: { id: req.params.id, role: 'doctor' },
    include: [{ model: Doctor }],
  });

  if (!doctorUser) {
    throw new ApiError(404, 'Doctor account not found');
  }

  doctorUser.isActive = false;
  await doctorUser.save();

  if (doctorUser.Doctor) {
    await DoctorAvailability.update({ isActive: false }, { where: { doctorId: doctorUser.Doctor.id } });
    doctorUser.Doctor.isAvailableForTelemedicine = false;
    await doctorUser.Doctor.save();
  }

  res.json({ success: true, message: 'Doctor account deactivated' });
};

// PUT /api/doctors/:id/restore
const restoreDoctor = async (req, res) => {
  const doctorUser = await User.findOne({
    where: { id: req.params.id, role: 'doctor' },
    include: [{ model: Doctor }],
  });

  if (!doctorUser) {
    throw new ApiError(404, 'Doctor account not found');
  }

  doctorUser.isActive = true;
  await doctorUser.save();

  if (doctorUser.Doctor) {
    await DoctorAvailability.update({ isActive: true }, { where: { doctorId: doctorUser.Doctor.id } });
    doctorUser.Doctor.isAvailableForTelemedicine = true;
    await doctorUser.Doctor.save();
  }

  res.json({ success: true, message: 'Doctor account restored' });
};

// PUT /api/doctors/restore-inactive
const restoreAllInactiveDoctors = async (req, res) => {
  const inactiveDoctorUsers = await User.findAll({
    where: { role: 'doctor', isActive: false },
    include: [{ model: Doctor }],
  });

  if (!inactiveDoctorUsers.length) {
    return res.json({ success: true, message: 'No inactive doctor accounts found to restore', restoredCount: 0 });
  }

  const doctorIds = inactiveDoctorUsers
    .map((user) => user.Doctor?.id)
    .filter((id) => Number.isInteger(id));

  await User.update({ isActive: true }, { where: { role: 'doctor', isActive: false } });

  if (doctorIds.length) {
    await DoctorAvailability.update({ isActive: true }, { where: { doctorId: { [Op.in]: doctorIds } } });
    await Doctor.update({ isAvailableForTelemedicine: true }, { where: { id: { [Op.in]: doctorIds } } });
  }

  res.json({
    success: true,
    message: `Restored ${inactiveDoctorUsers.length} inactive doctor account${inactiveDoctorUsers.length === 1 ? '' : 's'}.`,
    restoredCount: inactiveDoctorUsers.length,
  });
};

// GET /api/doctors/:id
const getDoctorById = async (req, res) => {
  const doctor = await Doctor.findByPk(req.params.id, {
    include: [{ model: User, attributes: ['firstName', 'lastName', 'email', 'phone'] }],
  });
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  res.json({ success: true, data: doctor });
};

// GET /api/doctors/me
const getMyProfile = async (req, res) => {
  const doctor = await Doctor.findOne({
    where: { userId: req.user.id },
    include: [{ model: User, attributes: ['firstName', 'lastName', 'email', 'phone'] }],
  });

  if (!doctor) throw new ApiError(404, 'Doctor profile not found');
  res.json({ success: true, data: doctor });
};

// PUT /api/doctors/me
const updateMyProfile = async (req, res) => {
  const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const fields = ['specialty', 'licenseNumber', 'department', 'bio', 'isAvailableForTelemedicine'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) doctor[field] = req.body[field];
  });

  await doctor.save();
  const refreshed = await Doctor.findByPk(doctor.id, {
    include: [{ model: User, attributes: ['firstName', 'lastName', 'email', 'phone'] }],
  });
  res.json({ success: true, message: 'Doctor profile updated', data: refreshed });
};

// GET /api/doctors/me/availability
const getMyAvailability = async (req, res) => {
  const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const availability = await DoctorAvailability.findOne({ where: { doctorId: doctor.id } });
  res.json({ success: true, data: availabilityToResponse(availability) });
};

// PUT /api/doctors/me/availability
const updateMyAvailability = async (req, res) => {
  const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const [availability] = await DoctorAvailability.findOrCreate({
    where: { doctorId: doctor.id },
    defaults: {
      doctorId: doctor.id,
      availableDays: JSON.stringify(DEFAULT_AVAILABILITY.availableDays),
      startHour: DEFAULT_AVAILABILITY.startHour,
      endHour: DEFAULT_AVAILABILITY.endHour,
      slotMinutes: DEFAULT_AVAILABILITY.slotMinutes,
      isActive: DEFAULT_AVAILABILITY.isActive,
    },
  });

  const availableDays = normalizeDays(req.body.availableDays ?? parseStoredDays(availability.availableDays));
  const startHour = req.body.startHour !== undefined ? Number(req.body.startHour) : availability.startHour;
  const endHour = req.body.endHour !== undefined ? Number(req.body.endHour) : availability.endHour;
  const slotMinutes = req.body.slotMinutes !== undefined ? Number(req.body.slotMinutes) : availability.slotMinutes;
  const isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : availability.isActive;

  if (!Number.isInteger(startHour) || !Number.isInteger(endHour) || startHour < 0 || endHour > 24 || startHour >= endHour) {
    throw new ApiError(422, 'Invalid availability hours. Use whole-hour values with startHour < endHour.');
  }

  if (!Number.isInteger(slotMinutes) || slotMinutes <= 0 || slotMinutes > 180) {
    throw new ApiError(422, 'slotMinutes must be a positive integer between 1 and 180.');
  }

  availability.availableDays = JSON.stringify(availableDays);
  availability.startHour = startHour;
  availability.endHour = endHour;
  availability.slotMinutes = slotMinutes;
  availability.isActive = isActive;
  await availability.save();

  res.json({ success: true, message: 'Doctor availability updated', data: availabilityToResponse(availability) });
};

// GET /api/doctors/:id/availability
const getDoctorAvailability = async (req, res) => {
  const doctor = await Doctor.findByPk(req.params.id, {
    include: [{ model: User, attributes: ['firstName', 'lastName'] }],
  });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const availability = await DoctorAvailability.findOne({ where: { doctorId: doctor.id } });
  res.json({
    success: true,
    data: {
      doctorId: doctor.id,
      doctorName: `Dr. ${doctor.User?.firstName || ''} ${doctor.User?.lastName || ''}`.trim(),
      ...availabilityToResponse(availability),
    },
  });
};

// GET /api/doctors/:id/available-slots
const getDoctorAvailableSlots = async (req, res) => {
  const doctor = await Doctor.findByPk(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const availability = await DoctorAvailability.findOne({ where: { doctorId: doctor.id } });
  const profile = availabilityToResponse(availability);

  if (!profile.isActive) {
    return res.json({ success: true, data: { doctorId: doctor.id, slots: [] } });
  }

  const daysAheadRaw = Number(req.query.daysAhead);
  const daysAhead = Number.isInteger(daysAheadRaw)
    ? Math.min(Math.max(daysAheadRaw, 1), 30)
    : 14;

  const now = new Date();
  const endWindow = new Date(now);
  endWindow.setDate(endWindow.getDate() + daysAhead);

  const existing = await Appointment.findAll({
    where: {
      doctorId: doctor.id,
      status: { [Op.in]: ['scheduled', 'confirmed'] },
      scheduledAt: {
        [Op.gte]: now,
        [Op.lte]: endWindow,
      },
    },
    attributes: ['scheduledAt'],
    raw: true,
  });

  const occupied = new Set(existing.map((item) => new Date(item.scheduledAt).getTime()));

  const slots = [];
  for (let dayOffset = 0; dayOffset <= daysAhead && slots.length < 40; dayOffset += 1) {
    const currentDay = new Date(now);
    currentDay.setHours(0, 0, 0, 0);
    currentDay.setDate(currentDay.getDate() + dayOffset);

    if (!profile.availableDays.includes(currentDay.getDay())) continue;

    const startMinutes = profile.startHour * 60;
    const endMinutes = profile.endHour * 60;
    for (let minute = startMinutes; minute < endMinutes && slots.length < 40; minute += profile.slotMinutes) {
      const slotDate = new Date(currentDay);
      slotDate.setHours(0, minute, 0, 0);

      if (slotDate <= now) continue;
      if (occupied.has(slotDate.getTime())) continue;

      slots.push({
        iso: slotDate.toISOString(),
        label: slotDate.toLocaleString(),
      });
    }
  }

  res.json({ success: true, data: { doctorId: doctor.id, slots } });
};

module.exports = {
  createDoctor,
  listDoctors,
  listDoctorCredentials,
  listSpecialties,
  deactivateDoctor,
  restoreDoctor,
  restoreAllInactiveDoctors,
  getDoctorById,
  getMyProfile,
  updateMyProfile,
  getMyAvailability,
  updateMyAvailability,
  getDoctorAvailability,
  getDoctorAvailableSlots,
};
