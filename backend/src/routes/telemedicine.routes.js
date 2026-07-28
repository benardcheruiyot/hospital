const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const telemedicineController = require('../controllers/telemedicine.controller');

const router = Router();

router.use(authenticate);

router.get('/sessions', telemedicineController.listSessions);
router.get('/sessions/:roomCode', telemedicineController.getSessionByRoomCode);
router.patch('/sessions/:roomCode/start', telemedicineController.startSession);
router.patch('/sessions/:roomCode/end', telemedicineController.endSession);
router.patch(
	'/sessions/:roomCode/summary',
	authorize('doctor', 'admin'),
	[
		body('consultationSummary').optional().isString(),
		body('followUpDirectives').optional().isString(),
		body('prescriptionNotes').optional().isString(),
	],
	validate,
	telemedicineController.updateSessionSummary
);

module.exports = router;
