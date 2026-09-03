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
    dateString: {
      type: String,
      required: [true, 'Event date string (YYYY-MM-DD) is required'],
      index: true,
      trim: true,
    },
    date: {
      type: Date,
      default: function () {
        if (this.dateString) {
          return new Date(this.dateString + 'T00:00:00.000Z');
        }
        return new Date();
      },
    },
    startTime: {
      type: String,
      trim: true,
      default: '10:00 AM',
    },
    endTime: {
      type: String,
      trim: true,
      default: '11:30 AM',
    },
    time: {
      type: String,
      trim: true,
      default: function () {
        return `${this.startTime || '10:00 AM'} - ${this.endTime || '11:30 AM'}`;
      },
    },
    tag: {
      type: String,
      trim: true,
      enum: {
        values: [
          'Deep Work',
          'Strategy',
          'Meeting',
          'Milestone',
          'Health',
          'Finance',
          'Personal',
          'Other',
        ],
        message: '{VALUE} is not a valid event tag',
      },
      default: 'Deep Work',
    },
    color: {
      type: String,
      trim: true,
      default: function () {
        switch (this.tag) {
          case 'Health':
            return '#059669';
          case 'Finance':
            return '#D97706';
          case 'Meeting':
            return '#0284C7';
          case 'Strategy':
            return '#8B5CF6';
          case 'Milestone':
            return '#EC4899';
          case 'Personal':
            return '#10B981';
          case 'Deep Work':
          default:
            return '#4F46E5';
        }
      },
    },
    location: {
      type: String,
      trim: true,
      default: 'Scheduled Block',
    },
    reminder: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);

