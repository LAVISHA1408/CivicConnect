const Report = require('../models/Report');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { paginate, buildPaginationMeta, buildSort, buildSearchQuery } = require('../utils/helpers');
const { getFileUrl } = require('../middleware/upload');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Public
const getReports = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'createdAt',
    sortOrder = 'desc',
    category,
    status,
    priority,
    department,
    search,
    near,
    radius = 10 // in kilometers
  } = req.query;

  // Build query
  let query = { isPublic: true };

  // Add filters
  if (category) query.category = category;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (department) query.department = department;

  // Add search
  if (search) {
    const searchQuery = buildSearchQuery(search, ['title', 'description', 'tags']);
    query = { ...query, ...searchQuery };
  }

  // Add location filter
  if (near) {
    const [lng, lat] = near.split(',').map(Number);
    if (lng && lat) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius * 1000 // Convert to meters
        }
      };
    }
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

  // Format response
  const formattedReports = reports.map(report => ({
    id: report._id,
    reportId: report.reportId,
    title: report.title,
    description: report.description,
    category: report.category,
    status: report.status,
    priority: report.priority,
    location: {
      coordinates: report.location.coordinates,
      address: report.location.address
    },
    images: report.images.map(img => ({
      url: getFileUrl(req, img.url),
      filename: img.filename
    })),
    reporter: {
      id: report.reporter._id,
      name: report.reporter.name,
      email: report.reporter.email,
      avatar: report.reporter.avatar
    },
    assignedTo: report.assignedTo ? {
      id: report.assignedTo._id,
      name: report.assignedTo.name,
      email: report.assignedTo.email
    } : null,
    department: report.department,
    votes: {
      count: report.votes.count,
      hasVoted: req.user ? report.votes.voters.includes(req.user._id) : false
    },
    comments: report.comments.length,
    tags: report.tags,
    estimatedResolution: report.estimatedResolution,
    actualResolution: report.actualResolution,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  }));

  res.json({
    success: true,
    data: {
      reports: formattedReports,
      pagination
    }
  });
});

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Public
const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('reporter', 'name email avatar')
    .populate('assignedTo', 'name email')
    .populate('comments.user', 'name email avatar role');

  if (!report) {
    throw new AppError('Report not found', 404);
  }

  // Check if user can view this report
  if (!report.isPublic && req.user?.role !== 'admin' && report.reporter._id.toString() !== req.user?._id.toString()) {
    throw new AppError('Not authorized to view this report', 403);
  }

  const formattedReport = {
    id: report._id,
    reportId: report.reportId,
    title: report.title,
    description: report.description,
    category: report.category,
    status: report.status,
    priority: report.priority,
    location: {
      coordinates: report.location.coordinates,
      address: report.location.address
    },
    images: report.images.map(img => ({
      url: getFileUrl(req, img.url),
      filename: img.filename
    })),
    reporter: {
      id: report.reporter._id,
      name: report.reporter.name,
      email: report.reporter.email,
      avatar: report.reporter.avatar
    },
    assignedTo: report.assignedTo ? {
      id: report.assignedTo._id,
      name: report.assignedTo.name,
      email: report.assignedTo.email
    } : null,
    department: report.department,
    votes: {
      count: report.votes.count,
      hasVoted: req.user ? report.votes.voters.includes(req.user._id) : false
    },
    comments: report.comments.map(comment => ({
      id: comment._id,
      content: comment.content,
      isAdmin: comment.isAdmin,
      user: {
        id: comment.user._id,
        name: comment.user.name,
        email: comment.user.email,
        avatar: comment.user.avatar,
        role: comment.user.role
      },
      createdAt: comment.createdAt
    })),
    tags: report.tags,
    estimatedResolution: report.estimatedResolution,
    actualResolution: report.actualResolution,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  };

  res.json({
    success: true,
    data: { report: formattedReport }
  });
});

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
const createReport = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    priority = 'medium',
    location,
    department = 'Other',
    tags = [],
    isAnonymous = false
  } = req.body;

  // Validate location
  if (!location || !location.coordinates || location.coordinates.length !== 2) {
    throw new AppError('Valid location coordinates are required', 400);
  }

  // Create report
  const report = await Report.create({
    title,
    description,
    category,
    priority,
    location: {
      type: 'Point',
      coordinates: location.coordinates,
      address: location.address
    },
    department,
    tags,
    reporter: req.user._id,
    isAnonymous,
    images: req.files ? req.files.map(file => ({
      url: file.path,
      filename: file.filename
    })) : []
  });

  // Populate reporter info
  await report.populate('reporter', 'name email avatar');

  const formattedReport = {
    id: report._id,
    reportId: report.reportId,
    title: report.title,
    description: report.description,
    category: report.category,
    status: report.status,
    priority: report.priority,
    location: {
      coordinates: report.location.coordinates,
      address: report.location.address
    },
    images: report.images.map(img => ({
      url: getFileUrl(req, img.url),
      filename: img.filename
    })),
    reporter: {
      id: report.reporter._id,
      name: report.reporter.name,
      email: report.reporter.email,
      avatar: report.reporter.avatar
    },
    department: report.department,
    votes: {
      count: report.votes.count,
      hasVoted: false
    },
    tags: report.tags,
    createdAt: report.createdAt
  };

  res.status(201).json({
    success: true,
    message: 'Report created successfully',
    data: { report: formattedReport }
  });
});

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
const updateReport = asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    assignedTo,
    department,
    estimatedResolution,
    tags
  } = req.body;

  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  // Check authorization
  const isOwner = report.reporter.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('Not authorized to update this report', 403);
  }

  // Update fields
  const updateData = {};
  if (status && isAdmin) updateData.status = status;
  if (priority && isAdmin) updateData.priority = priority;
  if (assignedTo && isAdmin) updateData.assignedTo = assignedTo;
  if (department && isAdmin) updateData.department = department;
  if (estimatedResolution && isAdmin) updateData.estimatedResolution = estimatedResolution;
  if (tags && isAdmin) updateData.tags = tags;

  // Update report
  const updatedReport = await Report.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('reporter', 'name email avatar')
   .populate('assignedTo', 'name email');

  res.json({
    success: true,
    message: 'Report updated successfully',
    data: { report: updatedReport }
  });
});

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  // Check authorization
  const isOwner = report.reporter.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('Not authorized to delete this report', 403);
  }

  await Report.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Report deleted successfully'
  });
});

// @desc    Vote on report
// @route   POST /api/reports/:id/vote
// @access  Private
const voteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  const hasVoted = report.votes.voters.includes(req.user._id);
  
  if (hasVoted) {
    // Remove vote
    await report.removeVote(req.user._id);
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { votesGiven: report._id }
    });
  } else {
    // Add vote
    await report.addVote(req.user._id);
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { votesGiven: report._id }
    });
  }

  // Get updated report
  const updatedReport = await Report.findById(req.params.id);

  res.json({
    success: true,
    message: hasVoted ? 'Vote removed successfully' : 'Vote added successfully',
    data: {
      votes: {
        count: updatedReport.votes.count,
        hasVoted: !hasVoted
      }
    }
  });
});

// @desc    Add comment to report
// @route   POST /api/reports/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  // Add comment
  report.comments.push({
    user: req.user._id,
    content,
    isAdmin: req.user.role === 'admin'
  });

  await report.save();

  // Populate comment
  await report.populate('comments.user', 'name email avatar role');

  const newComment = report.comments[report.comments.length - 1];

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: {
      comment: {
        id: newComment._id,
        content: newComment.content,
        isAdmin: newComment.isAdmin,
        user: {
          id: newComment.user._id,
          name: newComment.user.name,
          email: newComment.user.email,
          avatar: newComment.user.avatar,
          role: newComment.user.role
        },
        createdAt: newComment.createdAt
      }
    }
  });
});

// @desc    Get user's reports
// @route   GET /api/reports/user/my-reports
// @access  Private
const getMyReports = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    category
  } = req.query;

  // Build query
  let query = { reporter: req.user._id };
  if (status) query.status = status;
  if (category) query.category = category;

  // Pagination
  const { skip, limit: limitNum } = paginate(parseInt(page), parseInt(limit));

  // Execute query
  const reports = await Report.find(query)
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
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

module.exports = {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  voteReport,
  addComment,
  getMyReports
};
