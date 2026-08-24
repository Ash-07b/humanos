const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'MEDIUM',
      uppercase: true,
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        message: '{VALUE} is not a valid task status',
      },
      default: 'PENDING',
      uppercase: true,
    },
    dueDate: {
      type: Date,
    },
    reminder: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);
