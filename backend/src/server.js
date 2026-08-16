require('dotenv').config();
const http = require('http');
const { Op } = require('sequelize');
const { Server } = require('socket.io');

const app = require('./app');
const sequelize = require('./config/database');
const registerSocketHandlers = require('./sockets');
const db = require('./models');

const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  return /^(http|https):\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
};

async function ensureDemoAccounts() {
  const defaultPassword = 'ChangeMe123!';

  const admin = await db.User.findOne({ where: { email: 'admin@hospital-platform.local' } });
  if (!admin) {
    await db.User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@hospital-platform.local',
      phone: null,
      passwordHash: defaultPassword,
      role: 'admin',
      isActive: true,
    });
  } else {
    await admin.update({
      firstName: 'System',
      lastName: 'Administrator',
      phone: null,
      passwordHash: defaultPassword,
      role: 'admin',
      isActive: true,
    });
  }

  const patient = await db.User.findOne({ where: { email: 'patient@hospital-platform.local' } });
  if (!patient) {
    await db.User.create({
      firstName: 'Patient',
      lastName: 'Demo',
      email: 'patient@hospital-platform.local',
      phone: '+254700000000',
      passwordHash: defaultPassword,
      role: 'patient',
      isActive: true,
    });
  } else {
    await patient.update({
      firstName: 'Patient',
      lastName: 'Demo',
      phone: '+254700000000',
      passwordHash: defaultPassword,
      role: 'patient',
      isActive: true,
    });
  }

  const patientRecord = await db.Patient.findOne({ where: { userId: patient?.id || (await db.User.findOne({ where: { email: 'patient@hospital-platform.local' } }))?.id } });
  if (!patientRecord) {
    const currentPatient = await db.User.findOne({ where: { email: 'patient@hospital-platform.local' } });
    await db.Patient.create({
      userId: currentPatient.id,
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
    });
  } else {
    await patientRecord.update({
      dateOfBirth: patientRecord.dateOfBirth || '1995-01-15',
      gender: patientRecord.gender || 'female',
      nationalId: patientRecord.nationalId || '1234567890',
      address: patientRecord.address || 'Nairobi, Kenya',
      emergencyContactName: patientRecord.emergencyContactName || 'Jane Demo',
      emergencyContactPhone: patientRecord.emergencyContactPhone || '+254700111111',
      bloodGroup: patientRecord.bloodGroup || 'O+',
      allergies: patientRecord.allergies || 'None',
      registrationStatus: 'verified',
      consentGiven: true,
    });
  }

  const doctorUser = await db.User.findOne({ where: { email: 'doctor@hospital-platform.local' } });
  if (!doctorUser) {
    await db.User.create({
      firstName: 'Samuel',
      lastName: 'Kibet',
      email: 'doctor@hospital-platform.local',
      phone: '+254700111111',
      passwordHash: defaultPassword,
      role: 'doctor',
      isActive: true,
    });
  } else {
    await doctorUser.update({
      firstName: 'Samuel',
      lastName: 'Kibet',
      phone: '+254700111111',
      passwordHash: defaultPassword,
      role: 'doctor',
      isActive: true,
    });
  }

  const refreshedDoctorUser = await db.User.findOne({ where: { email: 'doctor@hospital-platform.local' } });
  const doctor = await db.Doctor.findOne({ where: { userId: refreshedDoctorUser.id } });
  if (!doctor) {
    await db.Doctor.create({
      userId: refreshedDoctorUser.id,
      specialty: 'General Practice',
      licenseNumber: 'DOC-1001',
      department: 'Primary Care',
      bio: 'Demo clinician for local appointment and telemedicine testing.',
      isAvailableForTelemedicine: true,
    });
  } else {
    await doctor.update({
      specialty: doctor.specialty || 'General Practice',
      licenseNumber: doctor.licenseNumber || 'DOC-1001',
      department: doctor.department || 'Primary Care',
      bio: doctor.bio || 'Demo clinician for local appointment and telemedicine testing.',
      isAvailableForTelemedicine: true,
    });
  }

  const availabilityPresets = [
    { availableDays: [0, 1], startHour: 8, endHour: 12, slotMinutes: 30 },
    { availableDays: [0, 2], startHour: 9, endHour: 13, slotMinutes: 30 },
    { availableDays: [0, 3], startHour: 10, endHour: 16, slotMinutes: 20 },
    { availableDays: [0, 4], startHour: 11, endHour: 15, slotMinutes: 30 },
    { availableDays: [0, 5], startHour: 9, endHour: 17, slotMinutes: 30 },
    { availableDays: [0, 6], startHour: 12, endHour: 18, slotMinutes: 20 },
    { availableDays: [1, 2], startHour: 8, endHour: 14, slotMinutes: 30 },
    { availableDays: [1, 3], startHour: 10, endHour: 16, slotMinutes: 30 },
    { availableDays: [1, 4], startHour: 13, endHour: 19, slotMinutes: 30 },
    { availableDays: [1, 5], startHour: 9, endHour: 15, slotMinutes: 20 },
    { availableDays: [1, 6], startHour: 11, endHour: 17, slotMinutes: 25 },
    { availableDays: [2, 3], startHour: 8, endHour: 12, slotMinutes: 30 },
    { availableDays: [2, 4], startHour: 10, endHour: 15, slotMinutes: 30 },
    { availableDays: [2, 5], startHour: 11, endHour: 16, slotMinutes: 20 },
    { availableDays: [2, 6], startHour: 12, endHour: 18, slotMinutes: 30 },
    { availableDays: [3, 4], startHour: 9, endHour: 14, slotMinutes: 30 },
    { availableDays: [3, 5], startHour: 8, endHour: 12, slotMinutes: 20 },
    { availableDays: [3, 6], startHour: 13, endHour: 18, slotMinutes: 30 },
    { availableDays: [4, 5], startHour: 10, endHour: 16, slotMinutes: 20 },
    { availableDays: [4, 6], startHour: 9, endHour: 15, slotMinutes: 30 },
    { availableDays: [5, 6], startHour: 11, endHour: 17, slotMinutes: 20 },
    { availableDays: [0, 1, 2], startHour: 8, endHour: 14, slotMinutes: 30 },
    { availableDays: [1, 2, 3], startHour: 10, endHour: 16, slotMinutes: 20 },
    { availableDays: [2, 3, 4], startHour: 12, endHour: 18, slotMinutes: 30 },
    { availableDays: [3, 4, 5], startHour: 9, endHour: 15, slotMinutes: 30 },
    { availableDays: [4, 5, 6], startHour: 8, endHour: 12, slotMinutes: 20 },
    { availableDays: [0, 2, 4], startHour: 11, endHour: 17, slotMinutes: 30 },
    { availableDays: [1, 3, 5], startHour: 9, endHour: 16, slotMinutes: 25 },
    { availableDays: [2, 4, 6], startHour: 10, endHour: 18, slotMinutes: 30 },
    { availableDays: [0, 3, 6], startHour: 8, endHour: 13, slotMinutes: 20 },
    { availableDays: [1, 4, 6], startHour: 10, endHour: 13, slotMinutes: 15 },
    { availableDays: [0, 1, 3], startHour: 9, endHour: 14, slotMinutes: 20 },
  ];

  const getAvailabilityForDoctorIndex = (index) => {
    const preset = availabilityPresets[index % availabilityPresets.length];
    return {
      availableDays: preset.availableDays,
      startHour: preset.startHour,
      endHour: preset.endHour,
      slotMinutes: preset.slotMinutes,
      isActive: true,
    };
  };

  const refreshedDoctor = await db.Doctor.findOne({ where: { userId: refreshedDoctorUser.id } });
  const defaultDoctorAvailability = getAvailabilityForDoctorIndex(0);
  const [existingDoctorAvailability, doctorAvailabilityCreated] = await db.DoctorAvailability.findOrCreate({
    where: { doctorId: refreshedDoctor.id },
    defaults: {
      doctorId: refreshedDoctor.id,
      availableDays: JSON.stringify(defaultDoctorAvailability.availableDays),
      startHour: defaultDoctorAvailability.startHour,
      endHour: defaultDoctorAvailability.endHour,
      slotMinutes: defaultDoctorAvailability.slotMinutes,
      isActive: true,
    },
  });

  if (!doctorAvailabilityCreated) {
    await existingDoctorAvailability.update({
      availableDays: JSON.stringify(defaultDoctorAvailability.availableDays),
      startHour: defaultDoctorAvailability.startHour,
      endHour: defaultDoctorAvailability.endHour,
      slotMinutes: defaultDoctorAvailability.slotMinutes,
      isActive: true,
    });
  }

  const seededDoctors = [
    {
      specialty: 'Allergy & Immunology',
      firstName: 'Amina',
      lastName: 'Mwangi',
      email: 'doctor1@hospital-platform.local',
      phone: '+25470011001',
      licenseNumber: 'DOC-1001',
      department: 'Allergy & Immunology',
      bio: 'Experienced allergist providing personalized care for immune and allergy conditions.',
    },
    {
      specialty: 'Anesthesiology',
      firstName: 'Peter',
      lastName: 'Kamau',
      email: 'doctor2@hospital-platform.local',
      phone: '+25470011002',
      licenseNumber: 'DOC-1002',
      department: 'Anesthesiology',
      bio: 'Skilled anesthesiologist focused on patient safety and comfort during surgical care.',
    },
    {
      specialty: 'Emergency Medicine',
      firstName: 'Grace',
      lastName: 'Njeri',
      email: 'doctor3@hospital-platform.local',
      phone: '+25470011003',
      licenseNumber: 'DOC-1003',
      department: 'Emergency Medicine',
      bio: 'Emergency physician experienced in urgent care, trauma, and fast-paced medical response.',
    },
    {
      specialty: 'Geriatrics',
      firstName: 'Joseph',
      lastName: 'Otieno',
      email: 'doctor4@hospital-platform.local',
      phone: '+25470011004',
      licenseNumber: 'DOC-1004',
      department: 'Geriatrics',
      bio: 'Geriatric specialist dedicated to compassionate care for older adults.',
    },
    {
      specialty: 'Internal Medicine',
      firstName: 'Faith',
      lastName: 'Odhiambo',
      email: 'doctor5@hospital-platform.local',
      phone: '+25470011005',
      licenseNumber: 'DOC-1005',
      department: 'Internal Medicine',
      bio: 'Internal medicine physician providing comprehensive adult healthcare.',
    },
    {
      specialty: 'Nuclear Medicine',
      firstName: 'Samuel',
      lastName: 'Karemu',
      email: 'doctor6@hospital-platform.local',
      phone: '+25470011006',
      licenseNumber: 'DOC-1006',
      department: 'Nuclear Medicine',
      bio: 'Nuclear medicine specialist offering advanced diagnostic imaging services.',
    },
    {
      specialty: 'Preventive Medicine',
      firstName: 'Esther',
      lastName: 'Wanjiru',
      email: 'doctor7@hospital-platform.local',
      phone: '+25470011007',
      licenseNumber: 'DOC-1007',
      department: 'Preventive Medicine',
      bio: 'Preventive care physician focused on wellness and long-term health outcomes.',
    },
    {
      specialty: 'Radiology',
      firstName: 'David',
      lastName: 'Kimani',
      email: 'doctor8@hospital-platform.local',
      phone: '+25470011008',
      licenseNumber: 'DOC-1008',
      department: 'Radiology',
      bio: 'Radiologist experienced in diagnostic imaging and interventional procedures.',
    },
    {
      specialty: 'Sports Medicine',
      firstName: 'Susan',
      lastName: 'Achieng',
      email: 'doctor9@hospital-platform.local',
      phone: '+25470011009',
      licenseNumber: 'DOC-1009',
      department: 'Sports Medicine',
      bio: 'Sports medicine physician specializing in athletic injury recovery and performance.',
    },
    {
      specialty: 'Addiction Medicine',
      firstName: 'Michael',
      lastName: 'Mutua',
      email: 'doctor10@hospital-platform.local',
      phone: '+25470011010',
      licenseNumber: 'DOC-1010',
      department: 'Addiction Medicine',
      bio: 'Addiction specialist helping patients overcome substance dependence safely.',
    },
    {
      specialty: 'Clinical Pharmacology',
      firstName: 'Mary',
      lastName: 'Wanjiru',
      email: 'doctor11@hospital-platform.local',
      phone: '+25470011011',
      licenseNumber: 'DOC-1011',
      department: 'Clinical Pharmacology',
      bio: 'Clinical pharmacologist advising on medication safety and dosing strategies.',
    },
    {
      specialty: 'Palliative Care',
      firstName: 'Jane',
      lastName: 'Karanja',
      email: 'doctor12@hospital-platform.local',
      phone: '+25470011012',
      licenseNumber: 'DOC-1012',
      department: 'Palliative Care',
      bio: 'Palliative care physician committed to comfort and quality of life for patients.',
    },
    {
      specialty: 'Sleep Medicine',
      firstName: 'Daniel',
      lastName: 'Ouma',
      email: 'doctor13@hospital-platform.local',
      phone: '+25470011013',
      licenseNumber: 'DOC-1013',
      department: 'Sleep Medicine',
      bio: 'Sleep specialist diagnosing and treating sleep disorders for better health.',
    },
    {
      specialty: 'Medical Genetics',
      firstName: 'Carol',
      lastName: 'Njeri',
      email: 'doctor14@hospital-platform.local',
      phone: '+25470011014',
      licenseNumber: 'DOC-1014',
      department: 'Medical Genetics',
      bio: 'Genetic counselor providing personalized guidance on hereditary conditions.',
    },
    {
      specialty: 'Occupational Medicine',
      firstName: 'Robert',
      lastName: 'Mwangi',
      email: 'doctor15@hospital-platform.local',
      phone: '+25470011015',
      licenseNumber: 'DOC-1015',
      department: 'Occupational Medicine',
      bio: 'Occupational health physician focused on workplace safety and return-to-work care.',
    },
    {
      specialty: 'Interventional Radiology',
      firstName: 'Nancy',
      lastName: 'Wangari',
      email: 'doctor16@hospital-platform.local',
      phone: '+25470011016',
      licenseNumber: 'DOC-1016',
      department: 'Interventional Radiology',
      bio: 'Interventional radiologist providing minimally invasive image-guided treatments.',
    },
    {
      specialty: 'Vascular Surgery',
      firstName: 'Charles',
      lastName: 'Njoroge',
      email: 'doctor17@hospital-platform.local',
      phone: '+25470011017',
      licenseNumber: 'DOC-1017',
      department: 'Vascular Surgery',
      bio: 'Vascular surgeon treating circulatory system conditions and vascular disorders.',
    },
    {
      specialty: 'Plastic Surgery',
      firstName: 'Diana',
      lastName: 'Chebet',
      email: 'doctor18@hospital-platform.local',
      phone: '+25470011018',
      licenseNumber: 'DOC-1018',
      department: 'Plastic Surgery',
      bio: 'Plastic surgeon skilled in both reconstructive and cosmetic procedures.',
    },
    {
      specialty: 'General Surgery',
      firstName: 'Peter',
      lastName: 'Korir',
      email: 'doctor19@hospital-platform.local',
      phone: '+25470011019',
      licenseNumber: 'DOC-1019',
      department: 'General Surgery',
      bio: 'General surgeon experienced in a wide range of surgical specialties.',
    },
    {
      specialty: 'Cardiothoracic Surgery',
      firstName: 'Michael',
      lastName: 'Ndegwa',
      email: 'doctor20@hospital-platform.local',
      phone: '+25470011020',
      licenseNumber: 'DOC-1020',
      department: 'Cardiothoracic Surgery',
      bio: 'Cardiothoracic surgeon specializing in heart and lung operations.',
    },
    {
      specialty: 'Pediatric Surgery',
      firstName: 'Alice',
      lastName: 'Chepkoech',
      email: 'doctor21@hospital-platform.local',
      phone: '+25470011021',
      licenseNumber: 'DOC-1021',
      department: 'Pediatric Surgery',
      bio: 'Pediatric surgeon caring for surgical needs of infants and children.',
    },
    {
      specialty: 'Neurosurgery',
      firstName: 'James',
      lastName: 'Kiptoo',
      email: 'doctor22@hospital-platform.local',
      phone: '+25470011022',
      licenseNumber: 'DOC-1022',
      department: 'Neurosurgery',
      bio: 'Neurosurgeon treating complex brain and spine conditions.',
    },
    {
      specialty: 'Endocrine Surgery',
      firstName: 'Sharon',
      lastName: 'Bett',
      email: 'doctor23@hospital-platform.local',
      phone: '+25470011023',
      licenseNumber: 'DOC-1023',
      department: 'Endocrine Surgery',
      bio: 'Endocrine surgeon specializing in thyroid, parathyroid and adrenal care.',
    },
    {
      specialty: 'Colorectal Surgery',
      firstName: 'Patrick',
      lastName: 'Sitienei',
      email: 'doctor24@hospital-platform.local',
      phone: '+25470011024',
      licenseNumber: 'DOC-1024',
      department: 'Colorectal Surgery',
      bio: 'Colorectal surgeon focusing on digestive tract and bowel conditions.',
    },
    {
      specialty: 'Transplant Surgery',
      firstName: 'Ruth',
      lastName: 'Wanjiru',
      email: 'doctor25@hospital-platform.local',
      phone: '+25470011025',
      licenseNumber: 'DOC-1025',
      department: 'Transplant Surgery',
      bio: 'Transplant surgeon experienced in organ transplant preparation and recovery.',
    },
    {
      specialty: 'Critical Care',
      firstName: 'Kevin',
      lastName: 'Odhiambo',
      email: 'doctor26@hospital-platform.local',
      phone: '+25470011026',
      licenseNumber: 'DOC-1026',
      department: 'Critical Care',
      bio: 'Critical care physician providing complex support for seriously ill patients.',
    },
    {
      specialty: 'Rehabilitation Medicine',
      firstName: 'Josephine',
      lastName: 'Kimani',
      email: 'doctor27@hospital-platform.local',
      phone: '+25470011027',
      licenseNumber: 'DOC-1027',
      department: 'Rehabilitation Medicine',
      bio: 'Rehabilitation physician helping patients recover strength and independence.',
    },
    {
      specialty: 'Hospital Medicine',
      firstName: 'Bernard',
      lastName: 'Ouma',
      email: 'doctor28@hospital-platform.local',
      phone: '+25470011028',
      licenseNumber: 'DOC-1028',
      department: 'Hospital Medicine',
      bio: 'Hospitalist with broad experience coordinating inpatient medical care.',
    },
    {
      specialty: 'Dermatopathology',
      firstName: 'Lydia',
      lastName: 'Njeri',
      email: 'doctor29@hospital-platform.local',
      phone: '+25470011029',
      licenseNumber: 'DOC-1029',
      department: 'Dermatopathology',
      bio: 'Dermatopathologist diagnosing skin diseases with precision and care.',
    },
    {
      specialty: 'Genetic Counseling',
      firstName: 'Mercy',
      lastName: 'Wambui',
      email: 'doctor30@hospital-platform.local',
      phone: '+25470011030',
      licenseNumber: 'DOC-1030',
      department: 'Genetic Counseling',
      bio: 'Genetics counselor offering support and guidance on inherited conditions.',
    },
  ];

  const uniqueSpecialistSpecialties = [...new Set(seededDoctors.map((doc) => doc.specialty))];
  const validSeedSpecialties = ['General Practice', ...uniqueSpecialistSpecialties];
  const seededDoctorEmails = seededDoctors.map((doctor) => doctor.email);

  const invalidDoctorRecords = await db.Doctor.findAll({
    include: [
      {
        model: db.User,
        where: {
          email: { [Op.in]: seededDoctorEmails },
        },
        attributes: ['email'],
      },
    ],
    where: {
      specialty: {
        [Op.notIn]: validSeedSpecialties,
      },
    },
  });

  for (const doctorRecord of invalidDoctorRecords) {
    await doctorRecord.update({ specialty: 'General Practice' });
  }

  for (const doctorSeed of seededDoctors) {
    const { specialty, email, firstName, lastName, phone, licenseNumber, department, bio } = doctorSeed;
    const existingUser = await db.User.findOne({ where: { email } });

    let doctorUser = existingUser;
    if (!doctorUser) {
      doctorUser = await db.User.create({
        firstName,
        lastName,
        email,
        phone,
        passwordHash: defaultPassword,
        role: 'doctor',
        isActive: true,
      });
    } else {
      await doctorUser.update({
        firstName,
        lastName,
        phone,
        passwordHash: defaultPassword,
        role: 'doctor',
        isActive: true,
      });
    }

    const existingDoctor = await db.Doctor.findOne({ where: { userId: doctorUser.id } });
    let doctorProfile;
    if (!existingDoctor) {
      doctorProfile = await db.Doctor.create({
        userId: doctorUser.id,
        specialty,
        licenseNumber,
        department,
        bio,
        isAvailableForTelemedicine: true,
      });
    } else {
      doctorProfile = await existingDoctor.update({
        specialty,
        licenseNumber: existingDoctor.licenseNumber || licenseNumber,
        department: existingDoctor.department || department,
        bio: existingDoctor.bio || bio,
        isAvailableForTelemedicine: true,
      });
    }

    const doctorIndex = seededDoctors.findIndex((doc) => doc.email === email);
    const doctorAvailability = getAvailabilityForDoctorIndex(doctorIndex >= 0 ? doctorIndex + 1 : 0);
    const existingDoctorAvailability = await db.DoctorAvailability.findOne({ where: { doctorId: doctorProfile.id } });
    if (existingDoctorAvailability) {
      await existingDoctorAvailability.update({
        availableDays: JSON.stringify(doctorAvailability.availableDays),
        startHour: doctorAvailability.startHour,
        endHour: doctorAvailability.endHour,
        slotMinutes: doctorAvailability.slotMinutes,
        isActive: true,
      });
    } else {
      await db.DoctorAvailability.create({
        doctorId: doctorProfile.id,
        availableDays: JSON.stringify(doctorAvailability.availableDays),
        startHour: doctorAvailability.startHour,
        endHour: doctorAvailability.endHour,
        slotMinutes: doctorAvailability.slotMinutes,
        isActive: true,
      });
    }
  }

  const currentDoctorEmails = [...seededDoctors.map((doctor) => doctor.email), 'doctor@hospital-platform.local'];
  const obsoleteDoctorUsers = await db.User.findAll({
    where: {
      role: 'doctor',
      email: {
        [Op.like]: 'doctor%@hospital-platform.local',
      },
    },
  });

  for (const obsoleteUser of obsoleteDoctorUsers) {
    if (!currentDoctorEmails.includes(obsoleteUser.email)) {
      const obsoleteProfile = await db.Doctor.findOne({ where: { userId: obsoleteUser.id } });
      if (obsoleteProfile) {
        await db.DoctorAvailability.destroy({ where: { doctorId: obsoleteProfile.id } });
        await obsoleteProfile.destroy();
      }
      await obsoleteUser.destroy();
    }
  }

  const seededAdmin = await db.User.findOne({ where: { email: 'admin@hospital-platform.local' } });
  const seededPatient = await db.User.findOne({ where: { email: 'patient@hospital-platform.local' } });
  const seededDoctor = await db.User.findOne({ where: { email: 'doctor@hospital-platform.local' } });

  console.log('Demo accounts ready:', {
    admin: seededAdmin.email,
    patient: seededPatient.email,
    doctor: seededDoctor.email,
    seededSpecialists: seededDoctors.length,
  });
}

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

registerSocketHandlers(io);
app.set('io', io);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.sync();
    console.log('Models synchronized with the database.');
    await ensureDemoAccounts();

    server.listen(PORT, () => {
      console.log(`Hospital platform API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to start the server:', err);
    process.exit(1);
  }
}

start();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});
