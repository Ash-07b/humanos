const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: [true, 'Goal ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Milestone', milestoneSchema);
