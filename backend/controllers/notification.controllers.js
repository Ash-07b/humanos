const mongoose = require('mongoose');
const Notification = require('../models/Notification');

/**
 * @desc    Create a new notification
 * @route   POST /api/notifications
 * @access  Private (Protected by JWT)
 */
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type, relatedEntityId, scheduledTime } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Notification title is required',
      });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Notification message is required',
      });
    }

    const notification = await Notification.create({
      userId: req.user._id,
      title: title.trim(),
      message: message.trim(),
      type: type || 'INFO',
      relatedEntityId: relatedEntityId && mongoose.Types.ObjectId.isValid(relatedEntityId) ? relatedEntityId : null,
      scheduledTime: scheduledTime ? String(scheduledTime).trim() : null,
      read: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating notification',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all notifications for authenticated user
 * @route   GET /api/notifications
 * @access  Private (Protected by JWT)
 */
exports.getNotifications = async (req, res) => {
  try {
    const { read, type, limit } = req.query;
    const query = { userId: req.user._id };

    if (read !== undefined) {
      query.read = read === 'true' || read === true;
    }

    if (type) {
      query.type = type;
    }

    const maxLimit = limit ? parseInt(limit, 10) : 50;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(maxLimit);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving notifications',
      error: error.message,
    });
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private (Protected by JWT)
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching unread notification count',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private (Protected by JWT)
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { read: true },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized',
      });
    }

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      unreadCount,
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error marking notification as read',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark a single notification as unread
 * @route   PATCH /api/notifications/:id/unread
 * @access  Private (Protected by JWT)
 */
exports.markAsUnread = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { read: false },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized',
      });
    }

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as unread',
      unreadCount,
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error marking notification as unread',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark all notifications for authenticated user as read
 * @route   PATCH /api/notifications/mark-all-read
 * @access  Private (Protected by JWT)
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error marking all notifications as read',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (Protected by JWT)
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized',
      });
    }

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      unreadCount,
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting notification',
      error: error.message,
    });
  }
};

/**
 * @desc    Clear all notifications for user
 * @route   DELETE /api/notifications
 * @access  Private (Protected by JWT)
 */
exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });

    return res.status(200).json({
      success: true,
      message: 'All notifications cleared successfully',
      unreadCount: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error clearing notifications',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all active / pending reminders that require user action (popups)
 * @route   GET /api/notifications/active-reminders
 * @access  Private (Protected by JWT)
 */
exports.getActiveReminders = async (req, res) => {
  try {
    const now = new Date();
    const Task = require('../models/Task');
    const notificationService = require('../services/notificationService');
    const { isReminderDue, getMsUntilDue, parseScheduledDateTime } = require('../utils/timeHelper');

    // 1. Check if there are any pending tasks with reminder=true and a scheduled time that don't have a notification yet
    const pendingTasks = await Task.find({
      userId: req.user._id,
      status: { $in: ['PENDING', 'Pending', 'IN_PROGRESS', 'In Progress'] },
      reminder: true,
      $or: [
        { startTime: { $exists: true, $ne: '' } },
        { dueTime: { $exists: true, $ne: '' } },
      ],
    });

    for (const task of pendingTasks) {
      await notificationService.triggerTaskReminder(req.user._id, task);
    }

    // 2. Query all uncompleted notifications that are not currently snoozed
    const activeNotifications = await Notification.find({
      userId: req.user._id,
      completed: { $ne: true },
      $or: [
        { snoozedUntil: null },
        { snoozedUntil: { $lte: now } },
      ],
    }).sort({ createdAt: -1 });

    // 3. Cross-validate with related task status and schedule time
    const dueReminders = [];
    const upcomingReminders = [];

    for (const notif of activeNotifications) {
      let taskDetails = null;
      let scheduledTimeCandidate = notif.scheduledTime;
      let scheduledDateCandidate = 'Today';

      if (notif.relatedEntityId && (notif.type === 'TASK_REMINDER' || !notif.type || notif.type === 'INFO')) {
        const relatedTask = await Task.findOne({ _id: notif.relatedEntityId, userId: req.user._id });
        if (relatedTask) {
          if (relatedTask.status === 'COMPLETED' || relatedTask.status === 'Completed') {
            notif.completed = true;
            notif.read = true;
            await notif.save();
            continue;
          }

          taskDetails = {
            id: relatedTask._id,
            title: relatedTask.title,
            category: relatedTask.category,
            priority: relatedTask.priority,
            startTime: relatedTask.startTime,
            endTime: relatedTask.endTime,
            dueTime: relatedTask.dueTime,
            dueDate: relatedTask.dueDate,
          };

          scheduledTimeCandidate = relatedTask.startTime || relatedTask.dueTime || notif.scheduledTime;
          scheduledDateCandidate = relatedTask.dueDate || 'Today';
        }
      }

      notif._doc.taskDetails = taskDetails;

      // Calculate target Date and whether the reminder is due right now
      const targetDate = parseScheduledDateTime(scheduledTimeCandidate, scheduledDateCandidate);
      const isDue = targetDate ? targetDate.getTime() <= now.getTime() : false;
      const msUntilDue = targetDate ? targetDate.getTime() - now.getTime() : 0;

      notif._doc.scheduledMoment = targetDate ? targetDate.toISOString() : null;
      notif._doc.msUntilDue = msUntilDue;
      notif._doc.isDue = isDue;

      if (isDue && targetDate) {
        dueReminders.push(notif);
      } else if (targetDate) {
        upcomingReminders.push(notif);
      }
    }

    return res.status(200).json({
      success: true,
      count: dueReminders.length,
      reminders: dueReminders,
      upcomingCount: upcomingReminders.length,
      upcomingReminders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving active reminders',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark reminder and underlying task/medication as completed (stops repeating)
 * @route   PATCH /api/notifications/:id/complete
 * @access  Private (Protected by JWT)
 */
exports.completeReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const Task = require('../models/Task');

    let notification = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      notification = await Notification.findOne({ _id: id, userId: req.user._id });
    }

    let relatedTaskId = notification?.relatedEntityId || (mongoose.Types.ObjectId.isValid(id) ? id : null);

    // Update the notification
    if (notification) {
      notification.completed = true;
      notification.read = true;
      notification.snoozedUntil = null;
      await notification.save();
    }

    // If there is an associated Task, mark the task as COMPLETED
    let updatedTask = null;
    if (relatedTaskId) {
      updatedTask = await Task.findOneAndUpdate(
        { _id: relatedTaskId, userId: req.user._id },
        {
          status: 'COMPLETED',
          completedAt: new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
        },
        { returnDocument: 'after' }
      );

      // Clean up any other notifications pointing to this task
      await Notification.updateMany(
        { userId: req.user._id, relatedEntityId: relatedTaskId },
        { $set: { completed: true, read: true, snoozedUntil: null } }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Task and reminder marked as completed successfully',
      notification,
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error completing reminder',
      error: error.message,
    });
  }
};

/**
 * @desc    Snooze an active reminder for a given number of minutes
 * @route   PATCH /api/notifications/:id/snooze
 * @access  Private (Protected by JWT)
 */
exports.snoozeReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { snoozeMinutes = 2 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
      });
    }

    const minutes = Math.max(1, parseInt(snoozeMinutes, 10) || 2);
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        snoozedUntil,
        lastAlertedAt: new Date(),
      },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Reminder notification not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Reminder snoozed for ${minutes} minute(s). It will alert again if still uncompleted.`,
      snoozedUntil,
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error snoozing reminder',
      error: error.message,
    });
  }
};
