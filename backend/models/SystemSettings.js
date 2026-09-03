const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      default: 'HumanOS Executive Suite',
      trim: true,
    },
    appVersion: {
      type: String,
      default: '1.0.0',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowClientRegistration: {
      type: Boolean,
      default: true,
    },
    aiModel: {
      type: String,
      default: 'llama3.2',
    },
    aiProvider: {
      type: String,
      default: 'Local Ollama Engine (http://127.0.0.1:11434)',
    },
    aiEnabled: {
      type: Boolean,
      default: true,
    },
    defaultCurrency: {
      type: String,
      default: 'XAF',
    },
    telemetryRetentionDays: {
      type: Number,
      default: 365,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.SystemSettings || mongoose.model('SystemSettings', systemSettingsSchema);
