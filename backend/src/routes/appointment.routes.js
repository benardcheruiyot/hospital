const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const appointmentController = require('../controllers/appointment.controller');

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('patient'),
  [
    body('doctorId').isUUID().withMessage('A valid doctorId is required'),
    body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid date'),
    body('type').optional().isIn(['in_person', 'telemedicine']),
  ],
  validate,
  appointmentController.createAppointment
);

router.get('/', appointmentController.listAppointments);
router.get('/:id', appointmentController.getAppointmentById);

router.patch(
  '/:id/reschedule',
  authorize('patient'),
  [body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid date')],
  validate,
  appointmentController.rescheduleAppointment
);

router.patch('/:id/cancel', authorize('patient'), appointmentController.cancelAppointment);
router.patch('/:id/check-in', authorize('patient'), appointmentController.checkInAppointment);

router.patch(
  '/:id/status',
  authorize('doctor', 'admin'),
  appointmentController.updateAppointmentStatus
);

module.exports = router;
