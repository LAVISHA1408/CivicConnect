const express = require('express');
const {
  register,
  sendOTP,
  verifyOTPAndRegister,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  deleteAccount
} = require('../controllers/authController');

const {
  validateUser,
  validateLogin,
  handleValidationErrors
} = require('../middleware/validation');

const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// Public routes
router.post('/send-otp', authLimiter, sendOTP);
router.post('/verify-otp', authLimiter, verifyOTPAndRegister);
router.post('/register', authLimiter, validateUser, handleValidationErrors, register);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password', authLimiter, resetPassword);

// Protected routes
router.use(protect); // All routes below this middleware are protected

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);
router.delete('/account', deleteAccount);

module.exports = router;
