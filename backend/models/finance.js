const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Transaction title is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['INCOME', 'EXPENSE'],
        message: '{VALUE} is not a valid transaction type. Allowed values are INCOME, EXPENSE',
      },
      uppercase: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
