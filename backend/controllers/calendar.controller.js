const mongoose = require('mongoose');
const CalendarEvent = require('../models/CalendarEvent');

/**
 * Helper to compute color from tag
 */
function getColorForTag(tag) {
  switch (tag) {
    case 'Health':
      return '#059669';
    case 'Finance':
      return '#D97706';
    case 'Meeting':
      return '#0284C7';
    case 'Strategy':
      return '#8B5CF6';
    case 'Milestone':
      return '#EC4899';
    case 'Personal':
      return '#10B981';
    case 'Deep Work':
    default:
      return '#4F46E5';
  }
}

/**
 * @desc    Create a new calendar event
 * @route   POST /api/calendar
 * @access  Private (Protected by JWT)
 */
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      dateString,
      date,
      startTime,
      endTime,
      time,
      tag,
      color,
      location,
      reminder,
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event title is required',
      });
    }

    const resolvedDateStr = dateString ? dateString.trim() : (date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

    const resolvedStartTime = startTime ? startTime.trim() : '10:00 AM';
    const resolvedEndTime = endTime ? endTime.trim() : '11:30 AM';
    const resolvedTime = time ? time.trim() : `${resolvedStartTime} - ${resolvedEndTime}`;
    const resolvedTag = tag ? tag.trim() : 'Deep Work';
    const resolvedColor = color || getColorForTag(resolvedTag);

    const event = await CalendarEvent.create({
      userId: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      dateString: resolvedDateStr,
      date: date ? new Date(date) : new Date(resolvedDateStr + 'T00:00:00.000Z'),
      startTime: resolvedStartTime,
      endTime: resolvedEndTime,
      time: resolvedTime,
      tag: resolvedTag,
      color: resolvedColor,
      location: location ? location.trim() : 'Scheduled Block',
      reminder: reminder !== undefined ? Boolean(reminder) : true,
    });

    if (event.reminder) {
      const notificationService = require('../services/notificationService');
      await notificationService.triggerEventReminder(req.user._id, event);
    }

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating calendar event',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all calendar events for authenticated user
 * @route   GET /api/calendar
 * @access  Private (Protected by JWT)
 */
exports.getEvents = async (req, res) => {
  try {
    const { dateString, tag, startDate, endDate, month } = req.query;
    const query = { userId: req.user._id };

    if (dateString) {
      query.dateString = dateString.trim();
    } else if (startDate && endDate) {
      query.dateString = { $gte: startDate.trim(), $lte: endDate.trim() };
    } else if (month) {
      // e.g. "2026-09"
      query.dateString = new RegExp(`^${month.trim()}`);
    }

    if (tag && tag.toLowerCase() !== 'all') {
      query.tag = new RegExp(`^${tag.trim()}$`, 'i');
    }

    const events = await CalendarEvent.find(query).sort({ dateString: 1, startTime: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching calendar events',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single calendar event by ID
 * @route   GET /api/calendar/:id
 * @access  Private (Protected by JWT)
 */
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
      });
    }

    const event = await CalendarEvent.findOne({ _id: id, userId: req.user._id });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving calendar event',
      error: error.message,
    });
  }
};

/**
 * @desc    Update calendar event
 * @route   PUT /api/calendar/:id
 * @access  Private (Protected by JWT)
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
      });
    }

    const event = await CalendarEvent.findOne({ _id: id, userId: req.user._id });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or unauthorized',
      });
    }

    const {
      title,
      description,
      dateString,
      date,
      startTime,
      endTime,
      time,
      tag,
      color,
      location,
      reminder,
    } = req.body;

    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (dateString !== undefined) {
      event.dateString = dateString.trim();
      event.date = new Date(dateString.trim() + 'T00:00:00.000Z');
    }
    if (date !== undefined) event.date = new Date(date);
    if (startTime !== undefined) event.startTime = startTime.trim();
    if (endTime !== undefined) event.endTime = endTime.trim();

    if (time !== undefined) {
      event.time = time.trim();
    } else if (startTime !== undefined || endTime !== undefined) {
      event.time = `${event.startTime || '10:00 AM'} - ${event.endTime || '11:30 AM'}`;
    }

    if (tag !== undefined) {
      event.tag = tag.trim();
      if (!color) {
        event.color = getColorForTag(tag.trim());
      }
    }
    if (color !== undefined) event.color = color;
    if (location !== undefined) event.location = location.trim();
    if (reminder !== undefined) event.reminder = Boolean(reminder);

    const updatedEvent = await event.save();

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating calendar event',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete calendar event
 * @route   DELETE /api/calendar/:id
 * @access  Private (Protected by JWT)
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
      });
    }

    const event = await CalendarEvent.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting calendar event',
      error: error.message,
    });
  }
};
