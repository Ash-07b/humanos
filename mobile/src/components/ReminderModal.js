import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Bell,
  X,
  Check,
  Clock,
  Pill,
  Calendar,
} from 'lucide-react-native';
import { useReminders } from '../contexts/ReminderContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ReminderModal() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const { theme, isDarkMode } = useTheme();

  const {
    modalVisible,
    currentReminder,
    totalReminders,
    currentReminderIndex,
    isCompleting,
    isSnoozing,
    toastNotice,
    markReminderCompleted,
    dismissModal,
  } = useReminders();

  if (!modalVisible || !currentReminder) {
    return null;
  }

  const title = currentReminder.title || 'Task Reminder';
  const message = currentReminder.message || 'It is time for your scheduled reminder.';
  const type = currentReminder.type || 'TASK_REMINDER';
  const taskDetails = currentReminder.taskDetails || null;

  const isMedication = type === 'MEDICATION_REMINDER';
  const isCalendar = type === 'CALENDAR_REMINDER';

  const timeInfo = taskDetails?.startTime
    ? `${taskDetails.startTime}${taskDetails.endTime ? ` – ${taskDetails.endTime}` : ''}`
    : currentReminder.scheduledTime
    ? String(currentReminder.scheduledTime)
    : '';

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={dismissModal}
    >
      <View style={styles.overlay}>
        {/* Toast feedback notice */}
        {!!toastNotice && (
          <View style={styles.toastNotice}>
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
            <Text style={styles.toastText}>{toastNotice}</Text>
          </View>
        )}

        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFDF5',
              borderColor: isDarkMode ? '#334155' : '#F1E8D9',
              maxWidth: isDesktop ? 400 : '88%',
            },
          ]}
        >
          {/* Top Left Floating Golden Bell with Exclamation Badge */}
          <View style={styles.floatingBellWrapper}>
            <View style={styles.bellShape}>
              <Bell size={28} color="#D97706" fill="#FBBF24" strokeWidth={2} />
              {/* Exclamation Badge on Bell */}
              <View style={styles.exclamationBadge}>
                <Text style={styles.exclamationText}>!</Text>
              </View>
            </View>
          </View>

          {/* Top Right Circular Red Close Button */}
          <Pressable
            onPress={dismissModal}
            disabled={isCompleting || isSnoozing}
            style={({ pressed }) => [
              styles.redCloseBtn,
              isWeb && styles.webPointer,
              pressed && styles.pressedOpacity,
            ]}
            hitSlop={10}
          >
            <X size={13} color="#FFFFFF" strokeWidth={3} />
          </Pressable>

          {/* Main Card Content */}
          <View style={styles.cardContent}>
            {/* Header Title */}
            <Text style={[styles.mainTitle, { color: theme.colors.textPrimary }]}>
              Reminder
            </Text>

            {/* Task / Reminder Subject Title */}
            {!!title && title !== 'Reminder' && (
              <Text style={[styles.reminderSubject, { color: isDarkMode ? '#E2E8F0' : '#334155' }]} numberOfLines={2}>
                {title}
              </Text>
            )}

            {/* Subtitle / Message Text */}
            <Text style={[styles.messageText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]} numberOfLines={3}>
              {message}
            </Text>

            {/* Optional Time / Category Pill if available */}
            {!!timeInfo && (
              <View
                style={[
                  styles.timeBadge,
                  {
                    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                  },
                ]}
              >
                {isMedication ? (
                  <Pill size={11} color="#059669" strokeWidth={2.4} />
                ) : isCalendar ? (
                  <Calendar size={11} color="#0284C7" strokeWidth={2.4} />
                ) : (
                  <Clock size={11} color="#D97706" strokeWidth={2.4} />
                )}
                <Text style={[styles.timeBadgeText, { color: isDarkMode ? '#A5B4FC' : '#B45309' }]}>
                  {timeInfo}
                </Text>
              </View>
            )}

            {/* Multi-reminder Counter */}
            {totalReminders > 1 && (
              <Text style={[styles.counterText, { color: theme.colors.textMuted }]}>
                {currentReminderIndex + 1} of {totalReminders} reminders
              </Text>
            )}
          </View>

          {/* Bottom Segmented Action Buttons ("Got it" | "Close") */}
          <View
            style={[
              styles.actionsRow,
              { borderTopColor: isDarkMode ? '#334155' : '#EAE4D8' },
            ]}
          >
            {/* Left Button: Got it (Green) */}
            <Pressable
              onPress={() => markReminderCompleted(currentReminder)}
              disabled={isCompleting || isSnoozing}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnLeft,
                isWeb && styles.webPointer,
                pressed && styles.pressedAction,
              ]}
            >
              {isCompleting ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <Text style={styles.gotItText}>Got it</Text>
              )}
            </Pressable>

            {/* Vertical Divider Line */}
            <View
              style={[
                styles.verticalDivider,
                { backgroundColor: isDarkMode ? '#334155' : '#EAE4D8' },
              ]}
            />

            {/* Right Button: Close (Red) */}
            <Pressable
              onPress={dismissModal}
              disabled={isCompleting || isSnoozing}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnRight,
                isWeb && styles.webPointer,
                pressed && styles.pressedAction,
              ]}
            >
              {isSnoozing ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.closeText}>Close</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  cardContainer: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'visible',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },

  /* Floating Golden Bell on Top-Left */
  floatingBellWrapper: {
    position: 'absolute',
    top: -18,
    left: -14,
    zIndex: 10,
  },
  bellShape: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  exclamationBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exclamationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },

  /* Circular Red Close Button on Top-Right */
  redCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Card Center Content */
  cardContent: {
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 6,
  },
  reminderSubject: {
    fontSize: 14.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 10,
  },
  timeBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  counterText: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 8,
  },

  /* Bottom Actions Grid */
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: 52,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  actionBtnLeft: {
    borderBottomLeftRadius: 24,
  },
  actionBtnRight: {
    borderBottomRightRadius: 24,
  },
  verticalDivider: {
    width: 1,
    height: '100%',
  },
  gotItText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  /* Feedback Toast */
  toastNotice: {
    position: 'absolute',
    top: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 999999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  pressedOpacity: {
    opacity: 0.75,
  },
  pressedAction: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
});
