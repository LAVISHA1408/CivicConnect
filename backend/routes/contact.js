const express = require('express');
const {
  submitContact,
  getContactStats,
  getAllContacts,
  getContact,
  updateContactStatus,
  assignContact,
  respondToContact,
  addNoteToContact,
  deleteContact
} = require('../controllers/contactController');

const {
  validateContact,
  validateContactResponse,
  validateObjectId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation');

const { protect, authorize } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// Public routes
router.post('/', contactLimiter, validateContact, handleValidationErrors, submitContact);

// Admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getContactStats);
router.get('/admin', validatePagination, handleValidationErrors, getAllContacts);
router.get('/:id', validateObjectId, handleValidationErrors, getContact);
router.put('/:id/status', validateObjectId, handleValidationErrors, updateContactStatus);
router.put('/:id/assign', validateObjectId, handleValidationErrors, assignContact);
router.post('/:id/respond', validateObjectId, validateContactResponse, handleValidationErrors, respondToContact);
router.post('/:id/notes', validateObjectId, handleValidationErrors, addNoteToContact);
router.delete('/:id', validateObjectId, handleValidationErrors, deleteContact);

module.exports = router;
