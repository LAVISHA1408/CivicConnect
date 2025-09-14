const Report = require('../models/Report');
const User = require('../models/User');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Analytics = require('../models/Analytics');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { paginate, buildPaginationMeta, buildSort } = require('../utils/helpers');
const { sendReportStatusUpdateEmail } = require('../utils/email');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get report statistics
  const totalReports = await Report.countDocuments();
  const pendingReports = await Report.countDocuments({ status: 'pending' });
  const inProgressReports = await Report.countDocuments({ status: 'in_progress' });
  const resolvedReports = await Report.countDocuments({ status: 'resolved' });
  const closedReports = await Report.countDocuments({ status: 'closed' });

  // Get today's reports
  const todayReports = await Report.countDocuments({
    createdAt: { $gte: startOfDay }
  });

  // Get this week's reports
  const weekReports = await Report.countDocuments({
    createdAt: { $gte: startOfWeek }
  });

  // Get this month's reports
  const monthReports = await Report.countDocuments({
    createdAt: { $gte: startOfMonth }
  });

  // Get user statistics
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({
    lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });
  const newUsersToday = await User.countDocuments({
    createdAt: { $gte: startOfDay }
  });

  // Get message statistics
  const unreadMessages = await Message.getUnreadCount();
  const totalMessages = await Message.countDocuments();

  // Get contact form statistics
  const unreadContacts = await Contact.getUnreadCount();
  const totalContacts = await Contact.countDocuments();

  // Get category breakdown
  const categoryBreakdown = await Report.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Get priority breakdown
  const priorityBreakdown = await Report.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Get department breakdown
  const departmentBreakdown = await Report.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Get recent reports
  const recentReports = await Report.find()
    .populate('reporter', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get top voted reports
  const topVotedReports = await Report.find()
    .populate('reporter', 'name email')
    .sort({ 'votes.count': -1 })
    .limit(5);

  // Calculate resolution rate
  const resolutionRate = totalReports > 0 ? 
    Math.round((resolvedReports / totalReports) * 100) : 0;

  // Calculate average resolution time
  const resolvedReportsWithTime = await Report.find({
    status: 'resolved',
    actualResolution: { $exists: true }
  });

  let totalResolutionTime = 0;
  let resolvedCount = 0;

  resolvedReportsWithTime.forEach(report => {
    if (report.actualResolution && report.createdAt) {
      const resolutionTime = (report.actualResolution - report.createdAt) / (1000 * 60 * 60); // hours
      totalResolutionTime += resolutionTime;
      resolvedCount++;
    }
  });

  const averageResolutionTime = resolvedCount > 0 ? 
    Math.round(totalResolutionTime / resolvedCount) : 0;

  res.json({
    success: true,
    data: {
      reports: {
        total: totalReports,
        pending: pendingReports,
        inProgress: inProgressReports,
        resolved: resolvedReports,
        closed: closedReports,
        today: todayReports,
        thisWeek: weekReports,
        thisMonth: monthReports,
        resolutionRate,
        averageResolutionTime
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday
      },
      messages: {
        total: totalMessages,
        unread: unreadMessages
      },
      contacts: {
        total: totalContacts,
        unread: unreadContacts
      },
      breakdowns: {
        categories: categoryBreakdown,
        priorities: priorityBreakdown,
        departments: departmentBreakdown
      },
      recentReports,
      topVotedReports
    }
  });
});

// @desc    Get all reports for admin
// @route   GET /api/admin/reports
// @access  Private/Admin
const getAllReports = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt',
    sortOrder = 'desc',
    category,
    status,
    priority,
    department,
    search,
    assignedTo
  } = req.query;

  // Build query
  let query = {};

  // Add filters
  if (category) query.category = category;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (department) query.department = department;
  if (assignedTo) query.assignedTo = assignedTo;

  // Add search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { reportId: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort
  const sortObj = buildSort(sort, sortOrder);

  // Pagination
  const { skip, limit: limitNum } = paginate(parseInt(page), parseInt(limit));

  // Execute query
  const reports = await Report.find(query)
    .populate('reporter', 'name email avatar')
    .populate('assignedTo', 'name email')
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  // Get total count
  const total = await Report.countDocuments(query);

  // Build pagination metadata
  const pagination = buildPaginationMeta(parseInt(page), parseInt(limit), total);

  res.json({
    success: true,
    data: {
      reports,
      pagination
    }
  });
});

// @desc    Update report status
// @route   PUT /api/admin/reports/:id/status
// @access  Private/Admin
const updateReportStatus = asyncHandler(async (req, res) => {
  const { status, comment } = req.body;

  const report = await Report.findById(req.params.id)
    .populate('reporter', 'name email');

  if (!report) {
    throw new AppError('Report not found', 404);
  }

  // Update status
  await report.updateStatus(status, req.user._id);

  // Add comment if provided
  if (comment) {
    report.comments.push({
      user: req.user._id,
      content: comment,
      isAdmin: true
    });
    await report.save();
  }

  // Send email notification to reporter
  try {
    await sendReportStatusUpdateEmail(report.reporter, report);
  } catch (error) {
    console.error('Failed to send status update email:', error);
  }

  res.json({
    success: true,
    message: 'Report status updated successfully',
    data: { report }
  });
});

// @desc    Assign report to admin
// @route   PUT /api/admin/reports/:id/assign
// @access  Private/Admin
const assignReport = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;

  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  // Verify assigned user is admin
  const assignedUser = await User.findById(assignedTo);
  if (!assignedUser || assignedUser.role !== 'admin') {
    throw new AppError('Can only assign to admin users', 400);
  }

  report.assignedTo = assignedTo;
  await report.save();

  res.json({
    success: true,
    message: 'Report assigned successfully',
    data: { report }
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role,
    search,
    isActive
  } = req.query;

  // Build query
  let query = {};

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  // Add search
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Pagination
  const { skip, limit: limitNum } = paginate(parseInt(page), parseInt(limit));

  // Execute query
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Get total count
  const total = await User.countDocuments(query);

  // Build pagination metadata
  const pagination = buildPaginationMeta(parseInt(page), parseInt(limit), total);

  res.json({
    success: true,
    data: {
      users,
      pagination
    }
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  user.isActive = isActive;
  await user.save();

  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: { user }
  });
});

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = asyncHandler(async (req, res) => {
  const { period = 'daily', startDate, endDate } = req.query;

  let analytics;

  if (startDate && endDate) {
    analytics = await Analytics.getAnalytics(new Date(startDate), new Date(endDate), period);
  } else {
    analytics = await Analytics.getLatestAnalytics(period, 30);
  }

  res.json({
    success: true,
    data: { analytics }
  });
});

// @desc    Generate analytics
// @route   POST /api/admin/analytics/generate
// @access  Private/Admin
const generateAnalytics = asyncHandler(async (req, res) => {
  const { date } = req.body;
  
  const analytics = await Analytics.calculateDailyAnalytics(date ? new Date(date) : new Date());

  res.json({
    success: true,
    message: 'Analytics generated successfully',
    data: { analytics }
  });
});

// @desc    Get all messages
// @route   GET /api/admin/messages
// @access  Private/Admin
const getAllMessages = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    isRead,
    messageType,
    priority
  } = req.query;

  // Build query
  let query = {};

  if (isRead !== undefined) query.isRead = isRead === 'true';
  if (messageType) query.messageType = messageType;
  if (priority) query.priority = priority;

  // Pagination
  const { skip, limit: limitNum } = paginate(parseInt(page), parseInt(limit));

  // Execute query
  const messages = await Message.find(query)
    .populate('sender', 'name email avatar')
    .populate('recipient', 'name email avatar')
    .populate('relatedReport', 'reportId title status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Get total count
  const total = await Message.countDocuments(query);

  // Build pagination metadata
  const pagination = buildPaginationMeta(parseInt(page), parseInt(limit), total);

  res.json({
    success: true,
    data: {
      messages,
      pagination
    }
  });
});

// @desc    Get all contacts
// @route   GET /api/admin/contacts
// @access  Private/Admin
const getAllContacts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    category,
    priority,
    isRead
  } = req.query;

  // Build query
  let query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (isRead !== undefined) query.isRead = isRead === 'true';

  // Pagination
  const { skip, limit: limitNum } = paginate(parseInt(page), parseInt(limit));

  // Execute query
  const contacts = await Contact.find(query)
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Get total count
  const total = await Contact.countDocuments(query);

  // Build pagination metadata
  const pagination = buildPaginationMeta(parseInt(page), parseInt(limit), total);

  res.json({
    success: true,
    data: {
      contacts,
      pagination
    }
  });
});

// @desc    Respond to contact
// @route   POST /api/admin/contacts/:id/respond
// @access  Private/Admin
const respondToContact = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  await contact.addResponse(content, req.user._id);

  res.json({
    success: true,
    message: 'Response sent successfully',
    data: { contact }
  });
});

module.exports = {
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
};
