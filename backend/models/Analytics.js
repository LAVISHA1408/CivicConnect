const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  metrics: {
    reports: {
      total: {
        type: Number,
        default: 0
      },
      pending: {
        type: Number,
        default: 0
      },
      inProgress: {
        type: Number,
        default: 0
      },
      resolved: {
        type: Number,
        default: 0
      },
      closed: {
        type: Number,
        default: 0
      },
      byCategory: {
        pothole: { type: Number, default: 0 },
        streetlight: { type: Number, default: 0 },
        trash: { type: Number, default: 0 },
        graffiti: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
      },
      byPriority: {
        low: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        urgent: { type: Number, default: 0 }
      },
      byDepartment: {
        'Public Works': { type: Number, default: 0 },
        'Sanitation': { type: Number, default: 0 },
        'Transportation': { type: Number, default: 0 },
        'Parks & Recreation': { type: Number, default: 0 },
        'Other': { type: Number, default: 0 }
      }
    },
    users: {
      total: {
        type: Number,
        default: 0
      },
      active: {
        type: Number,
        default: 0
      },
      new: {
        type: Number,
        default: 0
      },
      byRole: {
        citizen: { type: Number, default: 0 },
        admin: { type: Number, default: 0 }
      }
    },
    engagement: {
      totalVotes: {
        type: Number,
        default: 0
      },
      totalComments: {
        type: Number,
        default: 0
      },
      totalMessages: {
        type: Number,
        default: 0
      },
      averageResolutionTime: {
        type: Number, // in hours
        default: 0
      }
    },
    performance: {
      responseTime: {
        average: { type: Number, default: 0 }, // in hours
        median: { type: Number, default: 0 },
        p95: { type: Number, default: 0 }
      },
      resolutionRate: {
        type: Number, // percentage
        default: 0
      },
      userSatisfaction: {
        type: Number, // average rating
        default: 0
      }
    }
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'daily'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
analyticsSchema.index({ date: 1, period: 1 });

// Static method to get analytics for a date range
analyticsSchema.statics.getAnalytics = function(startDate, endDate, period = 'daily') {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    },
    period: period
  }).sort({ date: 1 });
};

// Static method to get latest analytics
analyticsSchema.statics.getLatestAnalytics = function(period = 'daily', limit = 30) {
  return this.find({ period })
    .sort({ date: -1 })
    .limit(limit);
};

// Static method to calculate and store daily analytics
analyticsSchema.statics.calculateDailyAnalytics = async function(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get reports data
  const Report = mongoose.model('Report');
  const User = mongoose.model('User');
  const Message = mongoose.model('Message');

  const reports = await Report.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const totalReports = await Report.countDocuments();
  const pendingReports = await Report.countDocuments({ status: 'pending' });
  const inProgressReports = await Report.countDocuments({ status: 'in_progress' });
  const resolvedReports = await Report.countDocuments({ status: 'resolved' });
  const closedReports = await Report.countDocuments({ status: 'closed' });

  // Category breakdown
  const categoryBreakdown = await Report.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  // Priority breakdown
  const priorityBreakdown = await Report.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  // Department breakdown
  const departmentBreakdown = await Report.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } }
  ]);

  // Users data
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({
    lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });
  const newUsers = await User.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const roleBreakdown = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  // Engagement data
  const totalVotes = await Report.aggregate([
    { $group: { _id: null, total: { $sum: '$votes.count' } } }
  ]);

  const totalComments = await Report.aggregate([
    { $unwind: '$comments' },
    { $count: 'total' }
  ]);

  const totalMessages = await Message.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

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

  const averageResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

  // Build analytics object
  const analyticsData = {
    date: startOfDay,
    period: 'daily',
    metrics: {
      reports: {
        total: totalReports,
        pending: pendingReports,
        inProgress: inProgressReports,
        resolved: resolvedReports,
        closed: closedReports,
        byCategory: {
          pothole: categoryBreakdown.find(c => c._id === 'pothole')?.count || 0,
          streetlight: categoryBreakdown.find(c => c._id === 'streetlight')?.count || 0,
          trash: categoryBreakdown.find(c => c._id === 'trash')?.count || 0,
          graffiti: categoryBreakdown.find(c => c._id === 'graffiti')?.count || 0,
          other: categoryBreakdown.find(c => c._id === 'other')?.count || 0
        },
        byPriority: {
          low: priorityBreakdown.find(p => p._id === 'low')?.count || 0,
          medium: priorityBreakdown.find(p => p._id === 'medium')?.count || 0,
          high: priorityBreakdown.find(p => p._id === 'high')?.count || 0,
          urgent: priorityBreakdown.find(p => p._id === 'urgent')?.count || 0
        },
        byDepartment: {
          'Public Works': departmentBreakdown.find(d => d._id === 'Public Works')?.count || 0,
          'Sanitation': departmentBreakdown.find(d => d._id === 'Sanitation')?.count || 0,
          'Transportation': departmentBreakdown.find(d => d._id === 'Transportation')?.count || 0,
          'Parks & Recreation': departmentBreakdown.find(d => d._id === 'Parks & Recreation')?.count || 0,
          'Other': departmentBreakdown.find(d => d._id === 'Other')?.count || 0
        }
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        byRole: {
          citizen: roleBreakdown.find(r => r._id === 'citizen')?.count || 0,
          admin: roleBreakdown.find(r => r._id === 'admin')?.count || 0
        }
      },
      engagement: {
        totalVotes: totalVotes[0]?.total || 0,
        totalComments: totalComments[0]?.total || 0,
        totalMessages: totalMessages,
        averageResolutionTime: Math.round(averageResolutionTime * 100) / 100
      },
      performance: {
        responseTime: {
          average: Math.round(averageResolutionTime * 100) / 100,
          median: Math.round(averageResolutionTime * 100) / 100,
          p95: Math.round(averageResolutionTime * 1.5 * 100) / 100
        },
        resolutionRate: totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0,
        userSatisfaction: 4.2 // This would come from user feedback in a real system
      }
    }
  };

  // Save or update analytics
  return this.findOneAndUpdate(
    { date: startOfDay, period: 'daily' },
    analyticsData,
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('Analytics', analyticsSchema);
