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
      default: 'General',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.AIHistory || mongoose.model('AIHistory', aiHistorySchema);
