const express = require('express');
const {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  voteReport,
  addComment,
  getMyReports
} = require('../controllers/reportController');

const {
  validateReport,
  validateReportUpdate,
  validateComment,
  validateObjectId,
  validatePagination,
  validateSearch,
  handleValidationErrors
} = require('../middleware/validation');

const { protect, optionalAuth, checkOwnership } = require('../middleware/auth');
const { reportLimiter, voteLimiter } = require('../middleware/rateLimiting');
const { uploadReportImages, handleUploadError } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');
const Report = require('../models/Report');

const router = express.Router();

// Public routes
router.get('/', validatePagination, validateSearch, handleValidationErrors, optionalAuth, getReports);
router.get('/:id', validateObjectId, handleValidationErrors, optionalAuth, getReport);

// Protected routes
router.use(protect); // All routes below this middleware are protected

// Report creation with file upload
router.post('/', 
  reportLimiter,
  uploadReportImages,
  handleUploadError,
  validateReport,
  handleValidationErrors,
  createReport
);

// User's own reports
router.get('/user/my-reports', validatePagination, handleValidationErrors, getMyReports);

// Report management (owner or admin)
router.put('/:id', 
  validateObjectId,
  validateReportUpdate,
  handleValidationErrors,
  checkOwnership(Report),
  updateReport
);

router.delete('/:id', 
  validateObjectId,
  handleValidationErrors,
  checkOwnership(Report),
  deleteReport
);

// Voting
router.post('/:id/vote', 
  validateObjectId,
  handleValidationErrors,
  voteLimiter,
  voteReport
);

// Comments
router.post('/:id/comments', 
  validateObjectId,
  validateComment,
  handleValidationErrors,
  addComment
);

module.exports = router;
