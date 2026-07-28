const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');

const router = Router();

router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['patient']).withMessage('Self-registration is only available for patients'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('portal').optional().isIn(['patient', 'staff', 'admin']).withMessage('Portal must be patient, staff, or admin'),
  ],
  validate,
  authController.login
);

router.post(
  '/google',
  [
    body('idToken').trim().notEmpty().withMessage('Google ID token is required'),
    body('portal').optional().isIn(['patient', 'staff']).withMessage('Portal must be patient or staff'),
  ],
  validate,
  authController.google
);

router.get('/me', authenticate, authController.me);

module.exports = router;
