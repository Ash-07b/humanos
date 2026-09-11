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
    category: {
      type: String,
      trim: true,
      default: 'Work',
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'Low', 'Medium', 'High', 'Urgent'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'Pending', 'In Progress', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid task status',
      },
      default: 'PENDING',
    },
    startTime: {
      type: String,
      default: '',
    },
    endTime: {
      type: String,
      default: '',
    },
    dueDate: {
      type: String,
      default: 'Today',
    },
    dueTime: {
      type: String,
      default: '10:00 AM',
    },
    reminder: {
      type: Boolean,
      default: true,
    },
    completedAt: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.done = ret.status === 'COMPLETED' || ret.status === 'Completed';
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.done = ret.status === 'COMPLETED' || ret.status === 'Completed';
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Task', taskSchema);
