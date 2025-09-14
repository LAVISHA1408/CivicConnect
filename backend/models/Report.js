const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['pothole', 'streetlight', 'trash', 'graffiti', 'other'],
    lowercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required']
    },
    address: {
      type: String,
      trim: true
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  department: {
    type: String,
    enum: ['Public Works', 'Sanitation', 'Transportation', 'Parks & Recreation', 'Other'],
    default: 'Other'
  },
  votes: {
    count: {
      type: Number,
      default: 0
    },
    voters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  estimatedResolution: {
    type: Date
  },
  actualResolution: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ 'votes.count': -1 });

// Generate unique report ID before saving
reportSchema.pre('save', async function(next) {
  if (!this.reportId) {
    const count = await this.constructor.countDocuments();
    this.reportId = `RC-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Update reporter's report count
reportSchema.post('save', async function(doc) {
  if (doc.isNew) {
    await mongoose.model('User').findByIdAndUpdate(
      doc.reporter,
      { $inc: { reportsCount: 1 } }
    );
  }
});

// Virtual for vote percentage (if needed for analytics)
reportSchema.virtual('votePercentage').get(function() {
  // This could be used for analytics
  return this.votes.count;
});

// Method to add vote
reportSchema.methods.addVote = function(userId) {
  if (!this.votes.voters.includes(userId)) {
    this.votes.voters.push(userId);
    this.votes.count += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove vote
reportSchema.methods.removeVote = function(userId) {
  const voterIndex = this.votes.voters.indexOf(userId);
  if (voterIndex > -1) {
    this.votes.voters.splice(voterIndex, 1);
    this.votes.count -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to update status
reportSchema.methods.updateStatus = function(newStatus, adminId) {
  this.status = newStatus;
  
  if (newStatus === 'resolved' || newStatus === 'closed') {
    this.actualResolution = new Date();
  }
  
  // Add admin comment for status change
  this.comments.push({
    user: adminId,
    content: `Status updated to: ${newStatus}`,
    isAdmin: true
  });
  
  return this.save();
};

module.exports = mongoose.model('Report', reportSchema);
