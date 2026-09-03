const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

/**
 * @desc    Create a new transaction (Income or Expense)
 * @route   POST /api/finance
 * @access  Private (Protected by JWT)
 */
exports.createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Transaction title is required',
      });
    }

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return res.status(400).json({
        success: false,
        message: 'Valid transaction amount is required',
      });
    }

    const parsedAmount = Math.abs(Number(amount));
    if (parsedAmount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction amount must be greater than 0',
      });
    }

    let normalizedType = 'Expense';
    if (type && typeof type === 'string') {
      const lower = type.trim().toLowerCase();
      if (lower === 'income') {
        normalizedType = 'Income';
      } else if (lower === 'expense') {
        normalizedType = 'Expense';
      }
    } else if (Number(amount) > 0) {
      normalizedType = 'Income';
    }

    const signedAmount = normalizedType === 'Expense' ? -parsedAmount : parsedAmount;

    const transaction = await Transaction.create({
      userId: req.user._id,
      title: title.trim(),
      amount: signedAmount,
      type: normalizedType,
      category: category ? category.trim() : 'Operations',
      date: date ? String(date).trim() : 'Just now',
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction logged successfully',
      transaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating transaction',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all transactions for authenticated user with calculated totals
 * @route   GET /api/finance
 * @access  Private (Protected by JWT)
 */
exports.getTransactions = async (req, res) => {
  try {
    const { type, category, search } = req.query;
    const query = { userId: req.user._id };

    if (type && type.toLowerCase() !== 'all') {
      const lower = type.toLowerCase();
      if (lower === 'income') query.type = new RegExp('^income$', 'i');
      if (lower === 'expense' || lower === 'expenses') query.type = new RegExp('^expense$', 'i');
    }

    if (category && category.toLowerCase() !== 'all') {
      query.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const transactions = await Transaction.find(query).sort({ createdAt: -1 });

    // Aggregate user-wide financial statistics
    const allUserTx = await Transaction.find({ userId: req.user._id });
    const totalIncome = allUserTx
      .filter((t) => t.amount > 0 || (t.type && t.type.toLowerCase() === 'income'))
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const totalExpense = allUserTx
      .filter((t) => t.amount < 0 || (t.type && t.type.toLowerCase() === 'expense'))
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    return res.status(200).json({
      success: true,
      count: transactions.length,
      stats: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
      },
      transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving transactions',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single transaction by ID
 * @route   GET /api/finance/:id
 * @access  Private (Protected by JWT)
 */
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID format',
      });
    }

    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving transaction',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a transaction
 * @route   PUT /api/finance/:id
 * @access  Private (Protected by JWT)
 */
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID format',
      });
    }

    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized',
      });
    }

    const { title, amount, type, category, date } = req.body;

    if (title !== undefined) transaction.title = title.trim();
    if (category !== undefined) transaction.category = category.trim();
    if (date !== undefined) transaction.date = String(date).trim();

    let targetType = transaction.type;
    if (type !== undefined) {
      const lower = String(type).trim().toLowerCase();
      targetType = lower === 'income' ? 'Income' : 'Expense';
      transaction.type = targetType;
    }

    if (amount !== undefined) {
      const parsedAmount = Math.abs(Number(amount));
      transaction.amount = targetType === 'Expense' ? -parsedAmount : parsedAmount;
    } else if (type !== undefined) {
      // Amount didn't change but type did
      const currentAbs = Math.abs(transaction.amount);
      transaction.amount = targetType === 'Expense' ? -currentAbs : currentAbs;
    }

    const updated = await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating transaction',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a transaction
 * @route   DELETE /api/finance/:id
 * @access  Private (Protected by JWT)
 */
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID format',
      });
    }

    const transaction = await Transaction.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting transaction',
      error: error.message,
    });
  }
};
