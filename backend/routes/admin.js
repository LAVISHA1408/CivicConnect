const express = require('express');
const {
  getDashboardStats,
  getAllReports,
  updateReportStatus,
  assignReport,
  getAllUsers,
  updateUserStatus,
  getAnalytics,
  generateAnalytics,
  getAllMessages,
  getAllContacts,
  respondToContact
} = require('../controllers/adminController');

const {
  validateObjectId,
  validatePagination,
  validateSearch,
  handleValidationErrors
} = require('../middleware/validation');

const { protect, authorize } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));
router.use(adminLimiter);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Reports management
router.get('/reports', validatePagination, validateSearch, handleValidationErrors, getAllReports);
router.put('/reports/:id/status', validateObjectId, handleValidationErrors, updateReportStatus);
router.put('/reports/:id/assign', validateObjectId, handleValidationErrors, assignReport);

// Users management
router.get('/users', validatePagination, validateSearch, handleValidationErrors, getAllUsers);
router.put('/users/:id/status', validateObjectId, handleValidationErrors, updateUserStatus);

// Analytics
router.get('/analytics', getAnalytics);
router.post('/analytics/generate', generateAnalytics);

// Messages management
router.get('/messages', validatePagination, handleValidationErrors, getAllMessages);

// Contacts management
router.get('/contacts', validatePagination, handleValidationErrors, getAllContacts);
router.post('/contacts/:id/respond', validateObjectId, handleValidationErrors, respondToContact);

module.exports = router;
