const mongoose = require('mongoose');
const Task = require('../models/Task');

/**
 * @desc    Create a new task for authenticated user
 * @route   POST /api/tasks
 * @access  Private (Protected by JWT)
 */
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, category, startTime, endTime, dueDate, dueTime, reminder, status, done } = req.body;

    // Validation: Title is required
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    let initialStatus = 'PENDING';
    let completedAt = null;

    if (done === true || status === 'COMPLETED' || status === 'Completed') {
      initialStatus = 'COMPLETED';
      completedAt = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    const task = await Task.create({
      userId: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'Work',
      priority: priority || 'MEDIUM',
      status: initialStatus,
      startTime: startTime ? startTime.trim() : '',
      endTime: endTime ? endTime.trim() : '',
      dueDate: dueDate || 'Today',
      dueTime: dueTime || startTime || '',
      reminder: reminder ?? true,
      completedAt,
    });

    if (task.reminder) {
      const notificationService = require('../services/notificationService');
      await notificationService.triggerTaskReminder(req.user._id, task);
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating task',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all tasks belonging to authenticated user
 * @route   GET /api/tasks
 * @access  Private (Protected by JWT)
 */
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, category, dueDate } = req.query;

    const query = { userId: req.user._id };

    if (status) {
      if (status.toUpperCase() === 'COMPLETED') {
        query.status = { $in: ['COMPLETED', 'Completed'] };
      } else if (status.toUpperCase() === 'PENDING') {
        query.status = { $in: ['PENDING', 'Pending', 'IN_PROGRESS', 'In Progress'] };
      } else {
        query.status = status;
      }
    }

    if (priority) {
      query.priority = new RegExp(`^${priority}$`, 'i');
    }

    if (category) {
      query.category = new RegExp(`^${category}$`, 'i');
    }

    if (dueDate) {
      query.dueDate = dueDate;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching tasks',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a single task by ID (Authenticated user only)
 * @route   GET /api/tasks/:id
 * @access  Private (Protected by JWT)
 */
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    // Must match both ID and authenticated userId for strict isolation
    const task = await Task.findOne({ _id: id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving task',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a task (Authenticated user only)
 * @route   PUT /api/tasks/:id
 * @access  Private (Protected by JWT)
 */
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, category, startTime, endTime, dueDate, dueTime, reminder, status, done } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    // Verify ownership
    const task = await Task.findOne({ _id: id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task title cannot be empty',
        });
      }
      task.title = title.trim();
    }

    if (description !== undefined) task.description = description.trim();
    if (category !== undefined) task.category = category.trim();
    if (priority !== undefined) task.priority = priority;
    if (startTime !== undefined) task.startTime = startTime;
    if (endTime !== undefined) task.endTime = endTime;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (dueTime !== undefined) task.dueTime = dueTime;
    if (reminder !== undefined) task.reminder = reminder;

    if (done !== undefined) {
      if (done) {
        task.status = 'COMPLETED';
        task.completedAt = task.completedAt || new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } else {
        task.status = 'PENDING';
        task.completedAt = null;
      }
    } else if (status !== undefined) {
      task.status = status;
      if (status === 'COMPLETED' || status === 'Completed') {
        task.completedAt = task.completedAt || new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } else {
        task.completedAt = null;
      }
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating task',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a task (Authenticated user only)
 * @route   DELETE /api/tasks/:id
 * @access  Private (Protected by JWT)
 */
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    // Atomically find and delete only if owned by req.user._id
    const task = await Task.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting task',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle or update completion status of a task
 * @route   PATCH /api/tasks/:id/toggle
 * @access  Private (Protected by JWT)
 */
exports.toggleTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findOne({ _id: id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const isCurrentlyDone = task.status === 'COMPLETED' || task.status === 'Completed';

    if (isCurrentlyDone) {
      task.status = 'PENDING';
      task.completedAt = null;
    } else {
      task.status = 'COMPLETED';
      task.completedAt = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: task.status === 'COMPLETED' ? 'Task marked as completed' : 'Task marked as pending',
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error toggling task status',
      error: error.message,
    });
  }
};
