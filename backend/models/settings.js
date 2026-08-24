const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    enableAiRecommendations: {
      type: Boolean,
      default: true,
    },
    enableNotifications: {
      type: Boolean,
      default: true,
    },
    enableHealthTracking: {
      type: Boolean,
      default: true,
    },
    enableFinanceModule: {
      type: Boolean,
      default: true,
    },
    twoFactorAuth: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
