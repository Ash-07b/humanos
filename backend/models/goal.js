const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    },
    text: {
      type: String,
      required: [true, 'Milestone text is required'],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const progressHistorySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      default: () => 'Today',
    },
    progress: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'Career',
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be less than 0'],
      max: [100, 'Progress cannot exceed 100'],
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'Low', 'Medium', 'High'],
        message: '{VALUE} is not a valid goal priority',
      },
      default: 'Medium',
    },
    targetDate: {
      type: String,
      default: 'Dec 31',
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Completed', 'Archived', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
        message: '{VALUE} is not a valid goal status',
      },
      default: 'Active',
    },
    createdDate: {
      type: String,
      default: () => 'Today',
    },
    completedDate: {
      type: String,
      default: null,
    },
    progressHistory: [progressHistorySchema],
    milestones: [milestoneSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Goal', goalSchema);
