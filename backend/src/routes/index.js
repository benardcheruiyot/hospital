const { Router } = require('express');

const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const doctorRoutes = require('./doctor.routes');
const appointmentRoutes = require('./appointment.routes');
const messageRoutes = require('./message.routes');
const telemedicineRoutes = require('./telemedicine.routes');
const analyticsRoutes = require('./analytics.routes');

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/messages', messageRoutes);
router.use('/telemedicine', telemedicineRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
