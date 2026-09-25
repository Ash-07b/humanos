const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
    },
    frequency: {
      type: String,
      trim: true,
      default: 'Daily',
    },
    streak: {
      type: Number,
      default: 0,
      min: [0, 'Streak cannot be negative'],
    },
    completedToday: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: '⚡',
    },
    color: {
      type: String,
      default: '#6366F1',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Habit', habitSchema);

