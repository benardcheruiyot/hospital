const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

const router = Router();

router.use(authenticate, authorize('admin', 'doctor'));

router.get('/overview', analyticsController.getOverview);
router.get('/appointments-by-day', analyticsController.getAppointmentsByDay);
router.get('/appointments-by-status', analyticsController.getAppointmentsByStatus);
router.get('/appointments-by-doctor', analyticsController.getAppointmentsByDoctor);

module.exports = router;
