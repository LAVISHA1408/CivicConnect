const Contact = require('../models/Contact');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { sendContactConfirmationEmail } = require('../utils/email');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
const submitContact = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    subject,
    message,
    category = 'general'
  } = req.body;

  // Create contact record
  const contact = await Contact.create({
    name,
    email,
    subject,
    message,
    category,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send confirmation email
  try {
    await sendContactConfirmationEmail(contact);
  } catch (error) {
    console.error('Failed to send contact confirmation email:', error);
    // Don't fail the request if email fails
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for contacting us. We will get back to you soon.',
    data: { contact }
  });
});

// @desc    Get contact statistics (for admin)
// @route   GET /api/contact/stats
// @access  Private/Admin
const getContactStats = asyncHandler(async (req, res) => {
  const stats = await Contact.getContactStats();

  res.json({
    success: true,
    data: { stats: stats[0] || {} }
  });
});

// @desc    Get all contacts (for admin)
// @route   GET /api/contact/admin
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

// @desc    Get single contact (for admin)
// @route   GET /api/contact/:id
// @access  Private/Admin
const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('response.respondedBy', 'name email')
    .populate('notes.addedBy', 'name email');

  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  // Mark as read
  if (!contact.isRead) {
    await contact.markAsRead();
  }

  res.json({
    success: true,
    data: { contact }
  });
});

// @desc    Update contact status (for admin)
// @route   PUT /api/contact/:id/status
// @access  Private/Admin
const updateContactStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  await contact.updateStatus(status, req.user._id);

  res.json({
    success: true,
    message: 'Contact status updated successfully',
    data: { contact }
  });
});

// @desc    Assign contact (for admin)
// @route   PUT /api/contact/:id/assign
// @access  Private/Admin
const assignContact = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;

  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  contact.assignedTo = assignedTo;
  await contact.save();

  res.json({
    success: true,
    message: 'Contact assigned successfully',
    data: { contact }
  });
});

// @desc    Respond to contact (for admin)
// @route   POST /api/contact/:id/respond
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

// @desc    Add note to contact (for admin)
// @route   POST /api/contact/:id/notes
// @access  Private/Admin
const addNoteToContact = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  await contact.addNote(content, req.user._id);

  res.json({
    success: true,
    message: 'Note added successfully',
    data: { contact }
  });
});

// @desc    Delete contact (for admin)
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  await Contact.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Contact deleted successfully'
  });
});

module.exports = {
  submitContact,
  getContactStats,
  getAllContacts,
  getContact,
  updateContactStatus,
  assignContact,
  respondToContact,
  addNoteToContact,
  deleteContact
};
