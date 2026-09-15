import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { getToken } from '../services/storage';
import {
  fetchActiveReminders,
  completeReminder,
  snoozeReminder,
} from '../services/api';
import { parseScheduledDateTime, isReminderDue, getMsUntilDue } from '../utils/timeHelper';

const ReminderContext = createContext({
  activeReminders: [],
  currentReminder: null,
  totalReminders: 0,
  currentReminderIndex: 0,
  modalVisible: false,
  isCompleting: false,
  isSnoozing: false,
  toastNotice: '',
  checkReminders: () => {},
  markReminderCompleted: () => {},
  snoozeActiveReminder: () => {},
  openReminderDetails: () => {},
  dismissModal: () => {},
});

/**
 * Gentle web audio chime for reminder alerts
 */
const playReminderChime = () => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        // Two-tone friendly chime (D5 -> A5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.setValueAtTime(880.0, now + 0.12); // A5

        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.5);
      }
    }
  } catch (e) {
    // Silent fail if audio autoplay is restricted
  }
};

export const ReminderProvider = ({ children, user, onNavigateTab }) => {
  const [activeReminders, setActiveReminders] = useState([]);
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [toastNotice, setToastNotice] = useState('');

  const lastAlertedIdRef = useRef(null);
  const isCheckingRef = useRef(false);
  const scheduledTimersRef = useRef([]);

  const showToast = (msg) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(''), 3000);
  };

  /**
   * Clear any active scheduled timers
   */
  const clearScheduledTimers = () => {
    if (Array.isArray(scheduledTimersRef.current)) {
      scheduledTimersRef.current.forEach((t) => clearTimeout(t));
    }
    scheduledTimersRef.current = [];
  };

  /**
   * Fetch active reminders from backend and arm exact-time triggers
   */
  const checkReminders = useCallback(async (forced = false) => {
    if (isCheckingRef.current && !forced) return;
    isCheckingRef.current = true;

    try {
      const token = await getToken();
      if (!token) {
        setActiveReminders([]);
        setModalVisible(false);
        clearScheduledTimers();
        return;
      }

      const res = await fetchActiveReminders(token);
      if (res && res.success) {
        const now = new Date();
        const rawDueList = Array.isArray(res.reminders) ? res.reminders : [];
        const rawUpcomingList = Array.isArray(res.upcomingReminders) ? res.upcomingReminders : [];

        // 1. Filter reminders that are DUE RIGHT NOW
        const dueList = rawDueList.filter((r) => {
          if (!r || r.completed) return false;
          const timeCandidate = r.taskDetails?.startTime || r.taskDetails?.dueTime || r.scheduledTime;
          const dateCandidate = r.taskDetails?.dueDate || 'Today';
          return isReminderDue(timeCandidate, dateCandidate, now);
        });

        // 2. Clear old timers and arm exact-second timers for upcoming items
        clearScheduledTimers();

        const allPotentialUpcoming = [...rawUpcomingList, ...rawDueList];
        allPotentialUpcoming.forEach((item) => {
          if (!item || item.completed) return;
          const timeCandidate = item.taskDetails?.startTime || item.taskDetails?.dueTime || item.scheduledTime;
          const dateCandidate = item.taskDetails?.dueDate || 'Today';
          const msWait = getMsUntilDue(timeCandidate, dateCandidate, now);

          // If scheduled within next 2 hours, arm exact timer
          if (msWait > 0 && msWait <= 7200000) {
            const timer = setTimeout(() => {
              checkReminders(true);
            }, msWait + 200); // 200ms padding to guarantee target second is reached
            scheduledTimersRef.current.push(timer);
          }
        });

        // 3. Update active reminders state
        setActiveReminders(dueList);

        if (dueList.length > 0) {
          const topReminder = dueList[0];
          const topId = topReminder._id || topReminder.id;

          // Open modal popup ONLY if this is a newly arrived reminder or an exact timer trigger
          if (lastAlertedIdRef.current !== topId || forced) {
            setModalVisible(true);
            setCurrentReminderIndex(0);
            playReminderChime();
            lastAlertedIdRef.current = topId;
          }
        } else {
          // No reminders currently due
          setModalVisible(false);
          lastAlertedIdRef.current = null;
        }
      }
    } catch (error) {
      console.log('Error checking active reminders:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  /**
   * Initial check and periodic polling (every 5 seconds)
   */
  useEffect(() => {
    if (!user) {
      setActiveReminders([]);
      setModalVisible(false);
      clearScheduledTimers();
      return;
    }

    // Immediate check
    checkReminders(true);

    // Active polling interval (5 seconds for ultra-precise on-time delivery)
    const interval = setInterval(() => {
      checkReminders();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearScheduledTimers();
    };
  }, [user, checkReminders]);

  /**
   * Mark the active reminder as completed
   */
  const markReminderCompleted = async (reminderToComplete) => {
    const target = reminderToComplete || activeReminders[currentReminderIndex];
    if (!target) return;

    const id = target._id || target.id;
    setIsCompleting(true);

    try {
      const token = await getToken();
      if (token) {
        await completeReminder(id, token);
      }

      showToast(`✓ Completed: "${target.title || 'Task'}"`);

      // Remove from active list
      setActiveReminders((prev) => {
        const nextList = prev.filter((r) => (r._id || r.id) !== id);
        if (nextList.length === 0) {
          setModalVisible(false);
          lastAlertedIdRef.current = null;
        } else {
          setCurrentReminderIndex(0);
        }
        return nextList;
      });

      // Refresh schedule
      setTimeout(() => checkReminders(true), 500);
    } catch (e) {
      console.log('Error completing reminder:', e);
      showToast('Error updating status');
    } finally {
      setIsCompleting(false);
    }
  };

  /**
   * Snooze the active reminder
   */
  const snoozeActiveReminder = async (reminderToSnooze, minutes = 2) => {
    const target = reminderToSnooze || activeReminders[currentReminderIndex];
    if (!target) return;

    const id = target._id || target.id;
    setIsSnoozing(true);

    try {
      const token = await getToken();
      if (token) {
        await snoozeReminder(id, minutes, token);
      }

      showToast(`⏰ Snoozed for ${minutes} min${minutes > 1 ? 's' : ''}`);

      // Temporarily remove from current visible list
      setActiveReminders((prev) => {
        const nextList = prev.filter((r) => (r._id || r.id) !== id);
        if (nextList.length === 0) {
          setModalVisible(false);
          lastAlertedIdRef.current = null;
        } else {
          setCurrentReminderIndex(0);
        }
        return nextList;
      });

      // Arm snooze wake timer
      const snoozeTimer = setTimeout(() => {
        checkReminders(true);
      }, minutes * 60 * 1000);
      scheduledTimersRef.current.push(snoozeTimer);
    } catch (e) {
      console.log('Error snoozing reminder:', e);
    } finally {
      setIsSnoozing(false);
    }
  };

  /**
   * Navigate directly to the task / details
   */
  const openReminderDetails = (reminder) => {
    const target = reminder || activeReminders[currentReminderIndex];
    if (!target) return;

    // Snooze for 2 mins so it doesn't immediately block the screen while navigating
    snoozeActiveReminder(target, 2);

    if (onNavigateTab) {
      if (target.type === 'MEDICATION_REMINDER') {
        onNavigateTab('health');
      } else if (target.type === 'CALENDAR_REMINDER') {
        onNavigateTab('calendar');
      } else if (target.type === 'GOAL_REMINDER') {
        onNavigateTab('goals');
      } else {
        onNavigateTab('tasks');
      }
    }
  };

  const dismissModal = () => {
    // Default snooze for 2 minutes if user dismisses
    const current = activeReminders[currentReminderIndex];
    if (current) {
      snoozeActiveReminder(current, 2);
    } else {
      setModalVisible(false);
    }
  };

  const currentReminder = activeReminders[currentReminderIndex] || null;

  return (
    <ReminderContext.Provider
      value={{
        activeReminders,
        currentReminder,
        currentReminderIndex,
        totalReminders: activeReminders.length,
        modalVisible,
        isCompleting,
        isSnoozing,
        toastNotice,
        checkReminders,
        markReminderCompleted,
        snoozeActiveReminder,
        openReminderDetails,
        dismissModal,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => useContext(ReminderContext);
