const mongoose = require('mongoose');
const Habit = require('../models/Habit');

/**
 * @desc    Create a new habit for authenticated user
 * @route   POST /api/habits
 * @access  Private (Protected by JWT)
 */
exports.createHabit = async (req, res) => {
  try {
    const { name, frequency, icon, color, streak, completedToday } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Habit name is required',
      });
    }

    const habit = await Habit.create({
      userId: req.user._id,
      name: name.trim(),
      frequency: frequency ? frequency.trim() : 'Daily',
      icon: icon || '⚡',
      color: color || '#6366F1',
      streak: typeof streak === 'number' ? Math.max(0, streak) : 0,
      completedToday: completedToday === true,
    });

    return res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      habit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating habit',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all habits belonging to authenticated user
 * @route   GET /api/habits
 * @access  Private (Protected by JWT)
 */
exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: habits.length,
      habits,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching habits',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single habit by ID
 * @route   GET /api/habits/:id
 * @access  Private (Protected by JWT)
 */
exports.getHabitById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid habit ID format',
      });
    }

    const habit = await Habit.findOne({ _id: id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    return res.status(200).json({
      success: true,
      habit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching habit',
      error: error.message,
    });
  }
};

/**
 * @desc    Update habit by ID
 * @route   PUT /api/habits/:id
 * @access  Private (Protected by JWT)
 */
exports.updateHabit = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid habit ID format',
      });
    }

    const habit = await Habit.findOne({ _id: id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    const allowedFields = ['name', 'frequency', 'icon', 'color', 'streak', 'completedToday'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        habit[field] = req.body[field];
      }
    });

    await habit.save();

    return res.status(200).json({
      success: true,
      message: 'Habit updated successfully',
      habit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating habit',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle habit completed state & adjust streak
 * @route   PATCH /api/habits/:id/toggle
 * @access  Private (Protected by JWT)
 */
exports.toggleHabit = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid habit ID format',
      });
    }

    const habit = await Habit.findOne({ _id: id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    habit.completedToday = !habit.completedToday;
    if (habit.completedToday) {
      habit.streak = (habit.streak || 0) + 1;
    } else {
      habit.streak = Math.max(0, (habit.streak || 1) - 1);
    }

    await habit.save();

    return res.status(200).json({
      success: true,
      message: `Habit marked as ${habit.completedToday ? 'completed' : 'pending'}`,
      habit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error toggling habit',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete habit by ID
 * @route   DELETE /api/habits/:id
 * @access  Private (Protected by JWT)
 */
exports.deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid habit ID format',
      });
    }

    const habit = await Habit.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Habit deleted successfully',
      deletedId: id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting habit',
      error: error.message,
    });
  }
};
