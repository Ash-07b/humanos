const mongoose = require('mongoose');

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
      default: 'General',
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
        values: ['LOW', 'MEDIUM', 'HIGH'],
        message: '{VALUE} is not a valid goal priority',
      },
      default: 'MEDIUM',
      uppercase: true,
    },
    targetDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: {
        values: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
        message: '{VALUE} is not a valid goal status',
      },
      default: 'IN_PROGRESS',
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Goal', goalSchema);
