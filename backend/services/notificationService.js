const Notification = require('../models/Notification');

/**
 * Service to generate reminders and notifications from various HumanOS modules
 */
const notificationService = {
  /**
   * Create a notification record for a user
   */
  async createNotification({ userId, title, message, type = 'INFO', relatedEntityId = null, scheduledTime = null }) {
    try {
      if (!userId || !title || !message) return null;

      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        relatedEntityId,
        scheduledTime,
        read: false,
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification in service:', error.message);
      return null;
    }
  },

  /**
   * Trigger notification for task start reminder
   */
  async triggerTaskReminder(userId, task) {
    if (!task) return null;
    const timeWindow = task.startTime && task.endTime
      ? `${task.startTime} – ${task.endTime}`
      : (task.startTime || task.dueTime || 'Now');
    const categoryInfo = task.category ? ` • Category: ${task.category}` : '';

    return await this.createNotification({
      userId,
      title: `Task Starting: ${task.title}`,
      message: `Scheduled time: ${timeWindow}${categoryInfo}`,
      type: 'TASK_REMINDER',
      relatedEntityId: task._id || task.id,
      scheduledTime: task.startTime || task.dueTime || null,
    });
  },

  /**
   * Trigger notification for calendar event reminder
   */
  async triggerEventReminder(userId, event) {
    if (!event) return null;
    return await this.createNotification({
      userId,
      title: `Event Reminder: ${event.title}`,
      message: `Scheduled on ${event.dateString || 'today'} from ${event.time || '10:00 AM'}${event.location ? ` at ${event.location}` : ''}`,
      type: 'CALENDAR_REMINDER',
      relatedEntityId: event._id || event.id,
    });
  },

  /**
   * Trigger notification for medication reminder
   */
  async triggerMedicationReminder(userId, medication) {
    if (!medication) return null;
    
    let timeDisplay = '';
    if (Array.isArray(medication.reminderTimes) && medication.reminderTimes.filter(Boolean).length > 0) {
      timeDisplay = medication.reminderTimes.filter(Boolean).join(', ');
    } else if (medication.reminderTime) {
      timeDisplay = medication.reminderTime;
    } else {
      timeDisplay = 'As prescribed';
    }

    const instructionsText = medication.instructions ? ` • ${medication.instructions}` : '';

    return await this.createNotification({
      userId,
      title: `Medication Reminder: ${medication.name}`,
      message: `Dosage: ${medication.dosage} • Time: ${timeDisplay} (${medication.frequency || 'Daily'})${instructionsText}`,
      type: 'MEDICATION_REMINDER',
      relatedEntityId: medication._id || medication.id,
      scheduledTime: medication.reminderTime || (Array.isArray(medication.reminderTimes) ? medication.reminderTimes[0] : null),
    });
  },
};

module.exports = notificationService;
