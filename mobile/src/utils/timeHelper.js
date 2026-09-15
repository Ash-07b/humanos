/**
 * Time Helper Utility for HumanOS Reminders & Scheduling (Mobile Frontend)
 */

/**
 * Parse time string (e.g. "08:30 PM", "8:30 pm", "14:00", "2:00 PM") and optional date
 * into a Date object representing the exact scheduled moment.
 *
 * @param {string|Date} timeStr - Time string or full ISO/Date
 * @param {string|Date} dateStr - Optional date string ("Today", "Tomorrow", "YYYY-MM-DD")
 * @returns {Date|null} - Calculated target Date object or null
 */
export function parseScheduledDateTime(timeStr, dateStr = 'Today') {
  if (!timeStr && !dateStr) return null;

  if (timeStr instanceof Date && !isNaN(timeStr.getTime())) {
    return timeStr;
  }

  if (typeof timeStr === 'string') {
    const directDate = new Date(timeStr);
    if (!isNaN(directDate.getTime()) && (timeStr.includes('T') || timeStr.includes('-') || timeStr.includes('/'))) {
      return directDate;
    }
  }

  const targetDate = new Date();

  // 1. Process Date component
  if (dateStr) {
    if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
      targetDate.setFullYear(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
    } else if (typeof dateStr === 'string') {
      const lower = dateStr.trim().toLowerCase();
      if (lower === 'today' || lower === 'just now' || lower === 'now') {
        // keep current date
      } else if (lower === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (lower === 'yesterday') {
        targetDate.setDate(targetDate.getDate() - 1);
      } else {
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          targetDate.setFullYear(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
        }
      }
    }
  }

  // 2. Process Time component
  if (timeStr && typeof timeStr === 'string' && timeStr.trim()) {
    const raw = timeStr.trim();
    const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = match[3] ? parseInt(match[3], 10) : 0;
      const ampm = match[4] ? match[4].toLowerCase() : null;

      if (ampm === 'pm' && hours < 12) {
        hours += 12;
      } else if (ampm === 'am' && hours === 12) {
        hours = 0;
      }

      targetDate.setHours(hours, minutes, seconds, 0);
      return targetDate;
    }
  }

  return null;
}

/**
 * Checks if a scheduled item is due now (i.e. targetDate <= now)
 *
 * @param {string|Date} timeStr - Time string
 * @param {string|Date} dateStr - Optional date string
 * @param {Date} [now] - Reference time (default: new Date())
 * @returns {boolean} - True if scheduled moment has arrived or passed
 */
export function isReminderDue(timeStr, dateStr = 'Today', now = new Date()) {
  const targetDate = parseScheduledDateTime(timeStr, dateStr);
  if (!targetDate) return false;

  return targetDate.getTime() <= now.getTime();
}

/**
 * Calculates remaining milliseconds until reminder is due.
 *
 * @param {string|Date} timeStr
 * @param {string|Date} dateStr
 * @param {Date} [now]
 * @returns {number} - Milliseconds until due (<= 0 if already due)
 */
export function getMsUntilDue(timeStr, dateStr = 'Today', now = new Date()) {
  const targetDate = parseScheduledDateTime(timeStr, dateStr);
  if (!targetDate) return 0;

  return targetDate.getTime() - now.getTime();
}
