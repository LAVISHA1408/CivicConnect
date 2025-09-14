const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateToken, createTokenPayload } = require('../utils/jwt');
const { sendWelcomeEmail, sendPasswordResetEmail, sendOTPEmail } = require('../utils/email');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Send OTP for registration
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  // Generate OTP
  const otpCode = OTP.generateOTP();

  // Delete any existing OTP for this email
  await OTP.deleteMany({ email, type: 'registration' });

  // Create new OTP
  const otp = await OTP.create({
    email,
    otp: otpCode,
    type: 'registration'
  });

  // Send OTP email
  try {
    await sendOTPEmail(email, otpCode, 'registration');
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new AppError('Failed to send OTP email', 500);
  }

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully to your email',
    data: {
      email,
      expiresIn: 10 * 60 * 1000 // 10 minutes in milliseconds
    }
  });
});

// @desc    Verify OTP and register user
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTPAndRegister = asyncHandler(async (req, res) => {
  const { name, email, password, otp } = req.body;

  if (!name || !email || !password || !otp) {
    throw new AppError('All fields are required', 400);
  }

  // Find OTP record
  const otpRecord = await OTP.findOne({ 
    email, 
    type: 'registration',
    isUsed: false 
  });

  if (!otpRecord) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  // Verify OTP
  try {
    otpRecord.verifyOTP(otp);
  } catch (error) {
    throw new AppError(error.message, 400);
  }

  // Check if user already exists (double check)
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: 'citizen',
    isEmailVerified: true
  });

  // Generate token
  const token = generateToken(createTokenPayload(user));

  // Send welcome email
  try {
    await sendWelcomeEmail(user);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }

  res.status(201).json({
    success: true,
    message: 'User registered and email verified successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        reportsCount: user.reportsCount,
        isEmailVerified: user.isEmailVerified
      },
      token
    }
  });
});

// @desc    Register user (legacy endpoint - now redirects to OTP flow)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  throw new AppError('Please use the OTP verification flow. Send OTP first, then verify.', 400);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account has been deactivated', 401);
  }

  // Update last login
  await user.updateLastLogin();

  // Generate token
  const token = generateToken(createTokenPayload(user));

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        reportsCount: user.reportsCount,
        lastLogin: user.lastLogin
      },
      token
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        reportsCount: user.reportsCount,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      throw new AppError('Email is already taken', 400);
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { name, email },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        reportsCount: user.reportsCount
      }
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Get user with password
  const user = await User.findById(userId).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No user found with this email', 404);
  }

  // Generate reset token
  const resetToken = generateToken({ id: user._id, type: 'password_reset' });

  // Send reset email
  try {
    await sendPasswordResetEmail(user, resetToken);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new AppError('Failed to send reset email', 500);
  }

  res.json({
    success: true,
    message: 'Password reset email sent successfully'
  });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'password_reset') {
    throw new AppError('Invalid reset token', 400);
  }

  // Get user
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update password
  user.password = password;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // In a JWT-based system, logout is typically handled on the client side
  // by removing the token from storage. However, you could implement
  // a token blacklist here if needed.

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Soft delete - deactivate account
  await User.findByIdAndUpdate(userId, { isActive: false });

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

module.exports = {
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
};
