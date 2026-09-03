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
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
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
