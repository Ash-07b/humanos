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
        values: ['Income', 'Expense', 'INCOME', 'EXPENSE'],
        message: '{VALUE} is not a valid transaction type. Allowed values are Income, Expense',
      },
      default: 'Expense',
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
    },
    category: {
      type: String,
      trim: true,
      default: 'Operations',
    },
    date: {
      type: String,
      default: 'Just now',
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

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

