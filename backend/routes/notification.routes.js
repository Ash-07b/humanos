const express = require('express');
const router = express.Router();
const {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getActiveReminders,
  completeReminder,
  snoozeReminder,
} = require('../controllers/notification.controllers');
const { protect } = require('../middleware/authMiddleware');

// All notification routes are protected with JWT
router.use(protect);

router.route('/')
  .post(createNotification)
  .get(getNotifications)
  .delete(clearAllNotifications);

router.route('/active-reminders')
  .get(getActiveReminders);

router.route('/unread-count')
  .get(getUnreadCount);

router.route('/mark-all-read')
  .patch(markAllAsRead);

router.route('/:id')
  .delete(deleteNotification);

router.route('/:id/complete')
  .patch(completeReminder);

router.route('/:id/snooze')
  .patch(snoozeReminder);

router.route('/:id/read')
  .patch(markAsRead);

router.route('/:id/unread')
  .patch(markAsUnread);

module.exports = router;
