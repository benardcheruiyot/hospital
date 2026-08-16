const db = require('../src/models');

async function seedAdmin() {
  try {
    await db.sequelize.sync();

    const adminEmail = 'admin@hospital-platform.local';
    const patientEmail = 'patient@hospital-platform.local';
    const doctorEmail = 'doctor@hospital-platform.local';

    const existingAdmin = await db.User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      await db.User.create({
        firstName: 'System',
        lastName: 'Administrator',
        email: adminEmail,
        passwordHash: 'ChangeMe123!',
        role: 'admin',
        isActive: true,
      });
      console.log('Default admin created:', adminEmail);
    } else {
      console.log('Default admin already exists:', adminEmail);
    }

    const existingPatient = await db.User.findOne({ where: { email: patientEmail } });
    if (!existingPatient) {
      const patient = await db.User.create({
        firstName: 'Patient',
        lastName: 'Demo',
        email: patientEmail,
        phone: '+254700000000',
        passwordHash: 'ChangeMe123!',
        role: 'patient',
        isActive: true,
      });

      await db.Patient.create({
        userId: patient.id,
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

      console.log('Default patient created:', patientEmail);
    } else {
      const existingPatientProfile = await db.Patient.findOne({ where: { userId: existingPatient.id } });
      if (!existingPatientProfile) {
        await db.Patient.create({
          userId: existingPatient.id,
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
        existingPatientProfile.dateOfBirth = existingPatientProfile.dateOfBirth || '1995-01-15';
        existingPatientProfile.gender = existingPatientProfile.gender || 'female';
        existingPatientProfile.nationalId = existingPatientProfile.nationalId || '1234567890';
        existingPatientProfile.address = existingPatientProfile.address || 'Nairobi, Kenya';
        existingPatientProfile.emergencyContactName = existingPatientProfile.emergencyContactName || 'Jane Demo';
        existingPatientProfile.emergencyContactPhone = existingPatientProfile.emergencyContactPhone || '+254700111111';
        existingPatientProfile.bloodGroup = existingPatientProfile.bloodGroup || 'O+';
        existingPatientProfile.allergies = existingPatientProfile.allergies || 'None';
        existingPatientProfile.registrationStatus = 'verified';
        existingPatientProfile.consentGiven = true;
        await existingPatientProfile.save();
      }
      console.log('Default patient already exists:', patientEmail);
    }

    const existingDoctor = await db.User.findOne({ where: { email: doctorEmail } });
    if (!existingDoctor) {
      const doctor = await db.User.create({
        firstName: 'Samuel',
        lastName: 'Kibet',
        email: doctorEmail,
        phone: '+254700111111',
        passwordHash: 'ChangeMe123!',
        role: 'doctor',
        isActive: true,
      });

      const doctorProfile = await db.Doctor.create({
        userId: doctor.id,
        specialty: 'General Practice',
        licenseNumber: 'DOC-1001',
        department: 'Primary Care',
        bio: 'Demo clinician for local appointment and telemedicine testing.',
        isAvailableForTelemedicine: true,
      });

      await db.DoctorAvailability.create({
        doctorId: doctorProfile.id,
        availableDays: JSON.stringify([1, 2, 3, 4, 5]),
        startHour: 9,
        endHour: 17,
        slotMinutes: 30,
        isActive: true,
      });

      console.log('Default doctor created:', doctorEmail);
    } else {
      let doctorProfile = await db.Doctor.findOne({ where: { userId: existingDoctor.id } });
      if (!doctorProfile) {
        doctorProfile = await db.Doctor.create({
          userId: existingDoctor.id,
          specialty: 'General Practice',
          licenseNumber: 'DOC-1001',
          department: 'Primary Care',
          bio: 'Demo clinician for local appointment and telemedicine testing.',
          isAvailableForTelemedicine: true,
        });
      }

      const existingDoctorAvailability = await db.DoctorAvailability.findOne({ where: { doctorId: doctorProfile.id } });
      if (!existingDoctorAvailability) {
        await db.DoctorAvailability.create({
          doctorId: doctorProfile.id,
          availableDays: JSON.stringify([1, 2, 3, 4, 5]),
          startHour: 9,
          endHour: 17,
          slotMinutes: 30,
          isActive: true,
        });
      }

      console.log('Default doctor already exists:', doctorEmail);
    }

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedAdmin();
