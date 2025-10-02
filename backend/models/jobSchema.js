const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['applied', 'interview', 'offer', 'rejected', 'withdrawn'],
      message: 'Status must be one of: applied, interview, offer, rejected, withdrawn'
    },
    default: 'applied'
  },
  dateApplied: {
    type: Date,
    required: [true, 'Application date is required']
  },
  salary: {
    type: Number,
    min: [0, 'Salary cannot be negative'],
    max: [10000000, 'Salary seems too high']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  jobUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Please enter a valid URL'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  contacts: [{
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Contact name cannot exceed 50 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    role: {
      type: String,
      trim: true,
      maxlength: [50, 'Role cannot exceed 50 characters']
    }
  }],
  interviews: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person', 'technical', 'final'],
      required: true
    },
    interviewer: {
      type: String,
      trim: true,
      maxlength: [100, 'Interviewer name cannot exceed 100 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Interview notes cannot exceed 500 characters']
    },
    outcome: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'cancelled'],
      default: 'pending'
    }
  }],
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Document name cannot exceed 100 characters']
    },
    type: {
      type: String,
      enum: ['resume', 'cover_letter', 'portfolio', 'certificate', 'other'],
      required: true
    },
    url: {
      type: String,
      trim: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  reminders: [{
    date: {
      type: Date,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Reminder message cannot exceed 200 characters']
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ user: 1, status: 1 });
jobSchema.index({ user: 1, dateApplied: -1 });
jobSchema.index({ user: 1, company: 1 });
jobSchema.index({ user: 1, isArchived: 1 });

// Update lastUpdated before saving
jobSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Virtual for days since application
jobSchema.virtual('daysSinceApplication').get(function() {
  const today = new Date();
  const diffTime = Math.abs(today - this.dateApplied);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method to get user's job statistics
jobSchema.statics.getUserStats = async function(userId) {
  try {
    const stats = await this.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId), isArchived: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    
    return {
      total,
      ...statusCounts,
      successRate: total > 0 ? ((statusCounts.offer / total) * 100).toFixed(1) : 0,
      interviewRate: total > 0 ? (((statusCounts.interview + statusCounts.offer) / total) * 100).toFixed(1) : 0
    };
  } catch (error) {
    throw new Error('Error calculating user statistics');
  }
};

// Instance method to check if job is overdue for follow-up
jobSchema.methods.isOverdueForFollowUp = function() {
  const daysSinceApplication = this.daysSinceApplication;
  const status = this.status;
  
  if (status === 'applied' && daysSinceApplication > 14) return true;
  if (status === 'interview' && daysSinceApplication > 7) return true;
  
  return false;
};

module.exports = mongoose.model('Job', jobSchema);