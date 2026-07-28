const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
    const adminId = uuidv4();
    const patientId = uuidv4();
    const doctorUserId = uuidv4();
    const doctorProfileId = uuidv4();

    const defaultUsers = [
      {
        id: adminId,
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@hospital-platform.local',
        phone: null,
        passwordHash,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: patientId,
        firstName: 'Patient',
        lastName: 'Demo',
        email: 'patient@hospital-platform.local',
        phone: '+254700000000',
        passwordHash,
        role: 'patient',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: doctorUserId,
        firstName: 'Dr. Sam',
        lastName: 'Kibet',
        email: 'doctor@hospital-platform.local',
        phone: '+254700111111',
        passwordHash,
        role: 'doctor',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('users', defaultUsers);

    await queryInterface.bulkInsert('patients', [
      {
        id: uuidv4(),
        userId: patientId,
        dateOfBirth: '1995-01-15',
        gender: 'female',
        nationalId: '1234567890',
        address: 'Nairobi, Kenya',
        emergencyContactName: 'Jane Demo',
        emergencyContactPhone: '+254700111111',
        bloodGroup: 'O+',
        allergies: 'None',
        registrationStatus: 'verified',
        consentGiven: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('doctors', [
      {
        id: doctorProfileId,
        userId: doctorUserId,
        specialty: 'General Practice',
        licenseNumber: 'DOC-1001',
        department: 'Primary Care',
        bio: 'Demo clinician for local appointment and telemedicine testing.',
        isAvailableForTelemedicine: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('doctor_availabilities', [
      {
        id: uuidv4(),
        doctorId: doctorProfileId,
        availableDays: JSON.stringify([1, 2, 3, 4, 5]),
        startHour: 9,
        endHour: 17,
        slotMinutes: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', {
      email: { [Op.in]: ['admin@hospital-platform.local', 'patient@hospital-platform.local', 'doctor@hospital-platform.local'] },
    });
  },
};
