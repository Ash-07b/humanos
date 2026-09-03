const mongoose = require('mongoose');

const aiHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Recommendation text is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'Health',
      index: true,
    },
    source: {
      type: String,
      default: 'AI Service',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.recommendation = ret.text;
        ret.date = ret.createdAt ? new Date(ret.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) : 'Today';
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.recommendation = ret.text;
        ret.date = ret.createdAt ? new Date(ret.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) : 'Today';
        return ret;
      },
    },
  }
);

module.exports = mongoose.models.AIHistory || mongoose.model('AIHistory', aiHistorySchema);

