const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Health record type is required'],
      trim: true,
      enum: {
        values: [
          'Heart Rate',
          'Blood Pressure',
          'Weight',
          'Temperature',
          'Blood Oxygen',
          'Sleep',
          'Steps',
          'Other',
        ],
        message: '{VALUE} is not a valid health record type',
      },
      default: 'Heart Rate',
    },
    value: {
      type: String,
      required: [true, 'Measurement value is required'],
      trim: true,
    },
    unit: {
      type: String,
      trim: true,
      default: 'bpm',
    },
    date: {
      type: String,
      default: 'Today',
    },
    time: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    dateTime: {
      type: String,
      default: function () {
        return `${this.date || 'Today'} • ${this.time || '09:00 AM'}`;
      },
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    recordedAt: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model('HealthRecord', healthRecordSchema);

