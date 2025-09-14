const express = require('express');
const {
  getMessages,
  getMessage,
  sendMessage,
  replyToMessage,
  markAsRead,
  archiveMessage,
  deleteMessage,
  getConversation,
  getUnreadCount,
  sendMessageToAdmin
} = require('../controllers/messageController');

const {
  validateMessage,
  validateObjectId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation');

const { protect } = require('../middleware/auth');

const router = express.Router();

// All message routes require authentication
router.use(protect);

// Get user's messages
router.get('/', validatePagination, handleValidationErrors, getMessages);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Send message to admin (for citizens)
router.post('/admin', validateMessage, handleValidationErrors, sendMessageToAdmin);

// Get conversation between two users
router.get('/conversation/:userId', validateObjectId, handleValidationErrors, getConversation);

// Message management
router.get('/:id', validateObjectId, handleValidationErrors, getMessage);
router.post('/', validateMessage, handleValidationErrors, sendMessage);
router.post('/:id/reply', validateObjectId, handleValidationErrors, replyToMessage);
router.put('/:id/read', validateObjectId, handleValidationErrors, markAsRead);
router.put('/:id/archive', validateObjectId, handleValidationErrors, archiveMessage);
router.delete('/:id', validateObjectId, handleValidationErrors, deleteMessage);

module.exports = router;
