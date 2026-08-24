const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true,
    },
    startTime: {
      type: String,
      trim: true,
      default: '',
    },
    endTime: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
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

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
