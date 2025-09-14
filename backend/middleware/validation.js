const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
exports.validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['citizen', 'admin'])
    .withMessage('Role must be either citizen or admin')
];

// Login validation rules
exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Report validation rules
exports.validateReport = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .isIn(['pothole', 'streetlight', 'trash', 'graffiti', 'other'])
    .withMessage('Category must be one of: pothole, streetlight, trash, graffiti, other'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of [longitude, latitude]'),
  
  body('location.coordinates.*')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Coordinates must be valid longitude/latitude values'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  
  body('department')
    .optional()
    .isIn(['Public Works', 'Sanitation', 'Transportation', 'Parks & Recreation', 'Other'])
    .withMessage('Department must be one of the valid departments'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Each tag cannot exceed 20 characters'),
  
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean value')
];

// Report update validation rules
exports.validateReportUpdate = [
  body('status')
    .optional()
    .isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be one of: pending, acknowledged, in_progress, resolved, closed'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Assigned user must be a valid user ID'),
  
  body('department')
    .optional()
    .isIn(['Public Works', 'Sanitation', 'Transportation', 'Parks & Recreation', 'Other'])
    .withMessage('Department must be one of the valid departments'),
  
  body('estimatedResolution')
    .optional()
    .isISO8601()
    .withMessage('Estimated resolution must be a valid date'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Each tag cannot exceed 20 characters')
];

// Comment validation rules
exports.validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
];

// Message validation rules
exports.validateMessage = [
  body('recipient')
    .isMongoId()
    .withMessage('Recipient must be a valid user ID'),
  
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message content must be between 10 and 2000 characters'),
  
  body('relatedReport')
    .optional()
    .isMongoId()
    .withMessage('Related report must be a valid report ID'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high'])
    .withMessage('Priority must be one of: low, normal, high'),
  
  body('messageType')
    .optional()
    .isIn(['general', 'report_update', 'status_change', 'admin_notification'])
    .withMessage('Message type must be one of the valid types')
];

// Contact form validation rules
exports.validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  
  body('category')
    .optional()
    .isIn(['general', 'support', 'feedback', 'bug_report', 'feature_request', 'partnership'])
    .withMessage('Category must be one of the valid categories')
];

// Contact response validation rules
exports.validateContactResponse = [
  body('content')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Response content must be between 10 and 2000 characters')
];

// ID parameter validation
exports.validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Pagination validation
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'votes', '-votes', 'status', 'priority'])
    .withMessage('Invalid sort field')
];

// Search validation
exports.validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('category')
    .optional()
    .isIn(['pothole', 'streetlight', 'trash', 'graffiti', 'other'])
    .withMessage('Invalid category filter'),
  
  query('status')
    .optional()
    .isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'closed'])
    .withMessage('Invalid status filter'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority filter'),
  
  query('department')
    .optional()
    .isIn(['Public Works', 'Sanitation', 'Transportation', 'Parks & Recreation', 'Other'])
    .withMessage('Invalid department filter')
];

// Date range validation
exports.validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

// Custom validation for date range
exports.validateDateRangeLogic = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }
    
    // Check if date range is not too large (e.g., more than 1 year)
    const diffInDays = (end - start) / (1000 * 60 * 60 * 24);
    if (diffInDays > 365) {
      return res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 365 days'
      });
    }
  }
  
  next();
};
