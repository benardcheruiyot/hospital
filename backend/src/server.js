require('dotenv').config();
const http = require('http');
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
      firstName: 'Dr. Sam',
      lastName: 'Kibet',
      email: 'doctor@hospital-platform.local',
      phone: '+254700111111',
      passwordHash: defaultPassword,
      role: 'doctor',
      isActive: true,
    });
  } else {
    await doctorUser.update({
      firstName: 'Dr. Sam',
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

  const refreshedDoctor = await db.Doctor.findOne({ where: { userId: refreshedDoctorUser.id } });
  await db.DoctorAvailability.findOrCreate({
    where: { doctorId: refreshedDoctor.id },
    defaults: {
      doctorId: refreshedDoctor.id,
      availableDays: JSON.stringify([1, 2, 3, 4, 5]),
      startHour: 9,
      endHour: 17,
      slotMinutes: 30,
      isActive: true,
    },
  });

  const seededAdmin = await db.User.findOne({ where: { email: 'admin@hospital-platform.local' } });
  const seededPatient = await db.User.findOne({ where: { email: 'patient@hospital-platform.local' } });
  const seededDoctor = await db.User.findOne({ where: { email: 'doctor@hospital-platform.local' } });

  console.log('Demo accounts ready:', {
    admin: seededAdmin.email,
    patient: seededPatient.email,
    doctor: seededDoctor.email,
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

    if (process.env.NODE_ENV !== 'production') {
      // Convenience for local development only; use migrations in production.
      await sequelize.sync();
      console.log('Models synchronized with the database.');
      await ensureDemoAccounts();
    }

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
