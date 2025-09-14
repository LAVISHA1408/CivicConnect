const Message = require('../models/Message');
const User = require('../models/User');
const Report = require('../models/Report');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

// @desc    Get user's messages
// @route   GET /api/messages
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    isRead,
    messageType,
    priority
  } = req.query;

  // Build query
  let query = {
    $or: [
      { sender: req.user._id },
      { recipient: req.user._id }
    ],
    isDeleted: false
  };

  if (isRead !== undefined) query.isRead = isRead === 'true';
  if (messageType) query.messageType = messageType;
  if (priority) query.priority = priority;

  // Pagination
  const { skip, limit: limitNum } = paginate(parseInt(page), parseInt(limit));

  // Execute query
  const messages = await Message.find(query)
    .populate('sender', 'name email avatar role')
    .populate('recipient', 'name email avatar role')
    .populate('relatedReport', 'reportId title status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Get total count
  const total = await Message.countDocuments(query);

  // Build pagination metadata
  const pagination = buildPaginationMeta(parseInt(page), parseInt(limit), total);

  // Get unread count
  const unreadCount = await Message.getUnreadCount(req.user._id);

  res.json({
    success: true,
    data: {
      messages,
      pagination,
      unreadCount
    }
  });
});

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Private
const getMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id)
    .populate('sender', 'name email avatar role')
    .populate('recipient', 'name email avatar role')
    .populate('relatedReport', 'reportId title status');

  if (!message) {
    throw new AppError('Message not found', 404);
  }

  // Check if user is sender or recipient
  const isSender = message.sender._id.toString() === req.user._id.toString();
  const isRecipient = message.recipient._id.toString() === req.user._id.toString();

  if (!isSender && !isRecipient) {
    throw new AppError('Not authorized to view this message', 403);
  }

  // Mark as read if user is recipient
  if (isRecipient && !message.isRead) {
    await message.markAsRead();
  }

  res.json({
    success: true,
    data: { message }
  });
});

// @desc    Send message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const {
    recipient,
    subject,
    content,
    relatedReport,
    priority = 'normal',
    messageType = 'general'
  } = req.body;

  // Verify recipient exists
  const recipientUser = await User.findById(recipient);
  if (!recipientUser) {
    throw new AppError('Recipient not found', 404);
  }

  // Verify related report if provided
  if (relatedReport) {
    const report = await Report.findById(relatedReport);
    if (!report) {
      throw new AppError('Related report not found', 404);
    }
  }

  // Create message
  const message = await Message.create({
    sender: req.user._id,
    recipient,
    subject,
    content,
    relatedReport,
    priority,
    messageType
  });

  // Populate message
  await message.populate([
    { path: 'sender', select: 'name email avatar role' },
    { path: 'recipient', select: 'name email avatar role' },
    { path: 'relatedReport', select: 'reportId title status' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: { message }
  });
});

// @desc    Reply to message
// @route   POST /api/messages/:id/reply
// @access  Private
const replyToMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const originalMessage = await Message.findById(req.params.id);
  if (!originalMessage) {
    throw new AppError('Original message not found', 404);
  }

  // Check if user is recipient of original message
  const isRecipient = originalMessage.recipient._id.toString() === req.user._id.toString();
  if (!isRecipient) {
    throw new AppError('Not authorized to reply to this message', 403);
  }

  // Create reply
  const reply = await Message.create({
    sender: req.user._id,
    recipient: originalMessage.sender,
    subject: `Re: ${originalMessage.subject}`,
    content,
    relatedReport: originalMessage.relatedReport,
    priority: originalMessage.priority,
    messageType: originalMessage.messageType,
    replyTo: originalMessage._id
  });

  // Populate reply
  await reply.populate([
    { path: 'sender', select: 'name email avatar role' },
    { path: 'recipient', select: 'name email avatar role' },
    { path: 'relatedReport', select: 'reportId title status' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Reply sent successfully',
    data: { message: reply }
  });
});

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  // Check if user is recipient
  if (message.recipient._id.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to mark this message as read', 403);
  }

  await message.markAsRead();

  res.json({
    success: true,
    message: 'Message marked as read'
  });
});

// @desc    Archive message
// @route   PUT /api/messages/:id/archive
// @access  Private
const archiveMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  // Check if user is sender or recipient
  const isSender = message.sender._id.toString() === req.user._id.toString();
  const isRecipient = message.recipient._id.toString() === req.user._id.toString();

  if (!isSender && !isRecipient) {
    throw new AppError('Not authorized to archive this message', 403);
  }

  await message.archive();

  res.json({
    success: true,
    message: 'Message archived successfully'
  });
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  // Check if user is sender or recipient
  const isSender = message.sender._id.toString() === req.user._id.toString();
  const isRecipient = message.recipient._id.toString() === req.user._id.toString();

  if (!isSender && !isRecipient) {
    throw new AppError('Not authorized to delete this message', 403);
  }

  await message.softDelete();

  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
});

// @desc    Get conversation between two users
// @route   GET /api/messages/conversation/:userId
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;

  // Verify other user exists
  const otherUser = await User.findById(userId);
  if (!otherUser) {
    throw new AppError('User not found', 404);
  }

  const messages = await Message.getConversation(req.user._id, userId, parseInt(limit));

  res.json({
    success: true,
    data: {
      messages,
      otherUser: {
        id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        avatar: otherUser.avatar,
        role: otherUser.role
      }
    }
  });
});

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Message.getUnreadCount(req.user._id);

  res.json({
    success: true,
    data: { unreadCount }
  });
});

// @desc    Send message to admin (for citizens)
// @route   POST /api/messages/admin
// @access  Private
const sendMessageToAdmin = asyncHandler(async (req, res) => {
  const {
    subject,
    content,
    relatedReport,
    priority = 'normal'
  } = req.body;

  // Find an admin user to send message to
  const admin = await User.findOne({ role: 'admin', isActive: true });
  if (!admin) {
    throw new AppError('No admin available to receive messages', 404);
  }

  // Verify related report if provided
  if (relatedReport) {
    const report = await Report.findById(relatedReport);
    if (!report) {
      throw new AppError('Related report not found', 404);
    }
  }

  // Create message
  const message = await Message.create({
    sender: req.user._id,
    recipient: admin._id,
    subject,
    content,
    relatedReport,
    priority,
    messageType: 'general'
  });

  // Populate message
  await message.populate([
    { path: 'sender', select: 'name email avatar role' },
    { path: 'recipient', select: 'name email avatar role' },
    { path: 'relatedReport', select: 'reportId title status' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Message sent to admin successfully',
    data: { message }
  });
});

module.exports = {
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
};
