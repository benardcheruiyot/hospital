const { Patient, User } = require('../models');
const ApiError = require('../utils/ApiError');

// GET /api/patients/me
const getMyProfile = async (req, res) => {
  const patient = await Patient.findOne({
    where: { userId: req.user.id },
    include: [{ model: User, attributes: ['firstName', 'lastName', 'email', 'phone'] }],
  });
  if (!patient) throw new ApiError(404, 'Patient profile not found');
  res.json({ success: true, data: patient });
};

// PUT /api/patients/me  (complete/update intake form)
const updateMyProfile = async (req, res) => {
  const patient = await Patient.findOne({ where: { userId: req.user.id } });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const fields = [
    'dateOfBirth',
    'gender',
    'nationalId',
    'address',
    'emergencyContactName',
    'emergencyContactPhone',
    'bloodGroup',
    'allergies',
    'consentGiven',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) patient[field] = req.body[field];
  });

  // Registration is considered verified only after core identity, emergency,
  // and consent fields are complete.
  if (
    patient.dateOfBirth &&
    patient.nationalId &&
    patient.address &&
    patient.emergencyContactName &&
    patient.emergencyContactPhone &&
    patient.consentGiven
  ) {
    patient.registrationStatus = 'verified';
  } else {
    patient.registrationStatus = 'incomplete';
  }

  await patient.save();
  res.json({ success: true, message: 'Patient profile updated', data: patient });
};

// GET /api/patients  (admin/doctor - list all patients)
const listPatients = async (req, res) => {
  const { status } = req.query;
  const where = status ? { registrationStatus: status } : {};

  const patients = await Patient.findAll({
    where,
    include: [{ model: User, attributes: ['firstName', 'lastName', 'email', 'phone'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: patients });
};

// GET /api/patients/:id
const getPatientById = async (req, res) => {
  const patient = await Patient.findByPk(req.params.id, {
    include: [{ model: User, attributes: ['firstName', 'lastName', 'email', 'phone'] }],
  });
  if (!patient) throw new ApiError(404, 'Patient not found');
  res.json({ success: true, data: patient });
};

module.exports = { getMyProfile, updateMyProfile, listPatients, getPatientById };
