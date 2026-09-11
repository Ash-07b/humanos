const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
    },
    frequency: {
      type: String,
      trim: true,
      default: 'Once daily',
    },
    reminderTime: {
      type: String,
      trim: true,
      default: '',
    },
    reminderTimes: [
      {
        type: String,
        trim: true,
      },
    ],
    startDate: {
      type: String,
      default: 'Today',
    },
    endDate: {
      type: String,
      default: 'Ongoing',
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Paused', 'ACTIVE', 'COMPLETED', 'PAUSED'],
      default: 'Active',
    },
    instructions: {
      type: String,
      trim: true,
      default: 'Take as prescribed',
    },
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

module.exports = mongoose.model('Medication', medicationSchema);

