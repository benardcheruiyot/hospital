const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const patientController = require('../controllers/patient.controller');

const router = Router();

router.use(authenticate);

router.get('/me', authorize('patient'), patientController.getMyProfile);
router.put('/me', authorize('patient'), patientController.updateMyProfile);

router.get('/', authorize('doctor', 'admin'), patientController.listPatients);
router.get('/:id', authorize('doctor', 'admin'), patientController.getPatientById);

module.exports = router;
