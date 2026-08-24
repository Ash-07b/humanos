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
      default: '08:00 AM',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Medication', medicationSchema);
