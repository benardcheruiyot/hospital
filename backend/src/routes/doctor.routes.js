const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const doctorController = require('../controllers/doctor.controller');

const router = Router();

router.use(authenticate);
router.post(
  '/',
  authorize('admin'),
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('specialty').optional().trim(),
  ],
  validate,
  doctorController.createDoctor
);

router.get('/me/availability', authorize('doctor'), doctorController.getMyAvailability);
router.put(
	'/me/availability',
	authorize('doctor'),
	[
		body('availableDays').optional().isArray(),
		body('startHour').optional().isInt({ min: 0, max: 23 }),
		body('endHour').optional().isInt({ min: 1, max: 24 }),
		body('slotMinutes').optional().isInt({ min: 1, max: 180 }),
		body('isActive').optional().isBoolean(),
	],
	validate,
	doctorController.updateMyAvailability
);
router.get('/me', authorize('doctor'), doctorController.getMyProfile);
router.put('/me', authorize('doctor'), doctorController.updateMyProfile);
router.get('/', doctorController.listDoctors);
router.get('/:id/available-slots', doctorController.getDoctorAvailableSlots);
router.get('/:id/availability', doctorController.getDoctorAvailability);
router.get('/:id', doctorController.getDoctorById);

module.exports = router;
