const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const messageController = require('../controllers/message.controller');

const router = Router();

router.use(authenticate);
router.use(authorize('patient'));

const attachmentValidation = body('attachment')
  .optional({ nullable: true })
  .custom((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value !== 'object') {
      throw new Error('attachment must be an object');
    }
    if (!value.name || !value.dataUrl) {
      throw new Error('attachment must include name and dataUrl');
    }
    return true;
  });

router.post(
  '/',
  [
    body('body').trim().notEmpty().withMessage('Message body cannot be empty'),
    body('category').optional().isString(),
    attachmentValidation,
  ],
  validate,
  messageController.sendMessage
);

router.get('/unread-count', messageController.getUnreadCount);
router.get('/inbox', messageController.getInbox);
router.get('/thread', messageController.getThread);
router.patch('/thread/read', messageController.markThreadAsRead);
router.patch('/:id/read', messageController.markAsRead);

module.exports = router;
