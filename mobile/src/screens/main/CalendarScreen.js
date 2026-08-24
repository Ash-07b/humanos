import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ScrollView,
  Platform,
  Modal,
  Switch,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/BottomNavigation';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatYMD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function CalendarScreen({ user, onLogout, onNavigateTab, navigation }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  const today = new Date();
  const todayYMD = formatYMD(today);

  const [activeTab, setActiveTab] = useState('calendar');
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'agenda'

  // Modal & Notice
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

  // Form State for creating events
  const [eventTitle, setEventTitle] = useState('');
  const [eventDateStr, setEventDateStr] = useState(todayYMD);
  const [eventStartTime, setEventStartTime] = useState('10:00 AM');
  const [eventEndTime, setEventEndTime] = useState('11:30 AM');
  const [eventTag, setEventTag] = useState('Deep Work');
  const [eventReminder, setEventReminder] = useState(true);
  const [eventLocation, setEventLocation] = useState('');

  // Events State (dynamically bound to database user)
  const [events, setEvents] = useState(user?.events || []);

  // Sync state whenever user data changes from database
  React.useEffect(() => {
    if (user && user.events) {
      setEvents(user.events || []);
    }
  }, [user]);

  const showNotice = (msg) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(''), 2600);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showNotice('Calendar synced with all devices');
    }, 600);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onNavigateTab) onNavigateTab(tabId);
    else if (navigation) {
      if (tabId === 'dashboard') navigation.navigate('Dashboard');
      else if (tabId === 'tasks') navigation.navigate('Tasks');
      else if (tabId === 'finance') navigation.navigate('Finance');
      else if (tabId === 'notes') navigation.navigate('Notes');
      else if (tabId === 'profile') navigation.navigate('Profile');
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const n = new Date();
    setCurrentMonthDate(new Date(n.getFullYear(), n.getMonth(), 1));
    setSelectedDate(n);
    setEventDateStr(formatYMD(n));
  };

  // Create Event
  const openCreateModal = (presetDate) => {
    const targetDate = presetDate || selectedDate;
    setEventDateStr(formatYMD(targetDate));
    setEventTitle('');
    setEventStartTime('10:00 AM');
    setEventEndTime('11:30 AM');
    setCreateModalVisible(true);
  };

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) {
      showNotice('Please enter an event title');
      return;
    }
    if (!eventDateStr.trim()) {
      showNotice('Please provide a valid date');
      return;
    }

    const newEv = {
      id: Date.now().toString(),
      dateString: eventDateStr.trim(),
      title: eventTitle.trim(),
      time: `${eventStartTime} - ${eventEndTime}`,
      tag: eventTag,
      color: eventTag === 'Health' ? '#059669' : eventTag === 'Finance' ? '#D97706' : '#4F46E5',
      reminder: eventReminder,
      location: eventLocation.trim() || 'Scheduled Block',
    };

    setEvents((prev) => [...prev, newEv]);
    setCreateModalVisible(false);
    showNotice('Event scheduled for ' + eventDateStr);
  };

  // Build Calendar Matrix for current displayed month
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Trailing previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
    calendarDays.push({
      date: prevDate,
      dayNum: daysInPrevMonth - i,
      isCurrentMonth: false,
      ymd: formatYMD(prevDate),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    calendarDays.push({
      date: curDate,
      dayNum: d,
      isCurrentMonth: true,
      ymd: formatYMD(curDate),
    });
  }

  // Trailing next month days to complete 35 or 42 grid cells
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let n = 1; n <= remaining; n++) {
    const nextDate = new Date(year, month + 1, n);
    calendarDays.push({
      date: nextDate,
      dayNum: n,
      isCurrentMonth: false,
      ymd: formatYMD(nextDate),
    });
  }

  const selectedYMD = formatYMD(selectedDate);
  const selectedDayEvents = events.filter((e) => e.dateString === selectedYMD);

  // Future events sorted chronologically
  const futureEvents = events
    .filter((e) => e.dateString >= todayYMD)
    .sort((a, b) => a.dateString.localeCompare(b.dateString));

  const tags = ['Deep Work', 'Strategy', 'Meeting', 'Milestone', 'Health', 'Finance', 'Personal'];

  const appContent = (
    <View style={styles.mainWrapper}>
      {!!noticeMessage && (
        <View style={styles.noticeToast}>
          <Text style={styles.noticeText}>✓ {noticeMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#4F46E5', '#6366F1']}
          />
        }
      >
        {/* ==================== 1. HEADER ==================== */}
        <View style={styles.headerHero}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerKicker}>EXECUTIVE SCHEDULE</Text>
              <Text style={styles.headerTitle}>Calendar</Text>
              <Text style={styles.headerSubtitle}>Plan future milestones, agenda & time blocks.</Text>
            </View>

            <Pressable
              onPress={() => openCreateModal(selectedDate)}
              style={({ pressed }) => [
                styles.quickAddBtn,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={styles.quickAddBtnText}>+ Event</Text>
            </Pressable>
          </View>

          {/* Month Navigator Header */}
          <View style={styles.monthHeaderRow}>
            <View style={styles.monthTitleWrapper}>
              <Text style={styles.monthTitleText}>
                {MONTH_NAMES[month]} {year}
              </Text>
              <Pressable
                onPress={goToToday}
                style={({ pressed }) => [
                  styles.todayBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.todayBtnText}>Today</Text>
              </Pressable>
            </View>

            <View style={styles.monthNavBtns}>
              <Pressable
                onPress={prevMonth}
                style={({ pressed }) => [
                  styles.monthNavBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.monthNavText}>‹</Text>
              </Pressable>

              <Pressable
                onPress={nextMonth}
                style={({ pressed }) => [
                  styles.monthNavBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.monthNavText}>›</Text>
              </Pressable>
            </View>
          </View>

          {/* Glowing Ambient Orbs */}
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
        </View>

        {/* ==================== 2. MAIN SHEET ==================== */}
        <View style={styles.sheetContent}>
          {/* View Mode Toggle */}
          <View style={styles.viewToggleRow}>
            <Pressable
              onPress={() => setViewMode('month')}
              style={[styles.viewToggleBtn, viewMode === 'month' && styles.viewToggleBtnActive]}
            >
              <Text style={[styles.viewToggleText, viewMode === 'month' && styles.viewToggleTextActive]}>
                🗓️ Month View
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('agenda')}
              style={[styles.viewToggleBtn, viewMode === 'agenda' && styles.viewToggleBtnActive]}
            >
              <Text style={[styles.viewToggleText, viewMode === 'agenda' && styles.viewToggleTextActive]}>
                📋 Future Agenda ({futureEvents.length})
              </Text>
            </Pressable>
          </View>

          {viewMode === 'month' ? (
            <>
              {/* Full Month Calendar Grid Card */}
              <View style={styles.calendarCard}>
                {/* Day Labels (Sun, Mon, Tue, etc.) */}
                <View style={styles.weekDayLabelsRow}>
                  {WEEK_DAYS.map((wd) => (
                    <Text key={wd} style={styles.weekDayLabelText}>
                      {wd}
                    </Text>
                  ))}
                </View>

                {/* Days Matrix */}
                <View style={styles.daysGrid}>
                  {calendarDays.map((cell, idx) => {
                    const isSelected = cell.ymd === selectedYMD;
                    const isToday = cell.ymd === todayYMD;
                    const hasEvents = events.some((e) => e.dateString === cell.ymd);

                    return (
                      <Pressable
                        key={idx}
                        onPress={() => {
                          setSelectedDate(cell.date);
                          setEventDateStr(cell.ymd);
                        }}
                        style={({ pressed }) => [
                          styles.dayCell,
                          isSelected && styles.dayCellSelected,
                          pressed && styles.pressedOpacity,
                          isWeb && styles.webPointer,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayCellNum,
                            !cell.isCurrentMonth && styles.dayCellNumFaded,
                            isToday && !isSelected && styles.dayCellNumToday,
                            isSelected && styles.dayCellNumSelected,
                          ]}
                        >
                          {cell.dayNum}
                        </Text>

                        {/* Events Indicator Dot */}
                        {hasEvents && (
                          <View
                            style={[
                              styles.eventDot,
                              isSelected && styles.eventDotSelected,
                            ]}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Selected Day Agenda Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionSubTitle}>
                      {selectedYMD === todayYMD ? 'TODAY’S SCHEDULE' : 'SELECTED DATE'}
                    </Text>
                    <Text style={styles.sectionMainTitle}>
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => openCreateModal(selectedDate)}
                    style={({ pressed }) => [
                      styles.addDayEventBtn,
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Text style={styles.addDayEventText}>+ Add</Text>
                  </Pressable>
                </View>

                {selectedDayEvents.length === 0 ? (
                  <View style={styles.emptyDayBox}>
                    <Text style={styles.emptyDayIcon}>✨</Text>
                    <Text style={styles.emptyDayTitle}>Open Focus Time</Text>
                    <Text style={styles.emptyDayDesc}>
                      No commitments scheduled on this date. Perfect for deep uninterrupted flow.
                    </Text>
                    <Pressable
                      onPress={() => openCreateModal(selectedDate)}
                      style={styles.emptyDayActionBtn}
                    >
                      <Text style={styles.emptyDayActionText}>+ Schedule an Event</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.eventsList}>
                    {selectedDayEvents.map((ev) => (
                      <View key={ev.id} style={styles.eventCard}>
                        <View style={[styles.eventStripe, { backgroundColor: ev.color }]} />
                        <View style={styles.eventBody}>
                          <View style={styles.eventTopRow}>
                            <View style={styles.eventTagBadge}>
                              <Text style={styles.eventTagText}>{ev.tag}</Text>
                            </View>
                            <Text style={styles.eventTimeText}>{ev.time}</Text>
                          </View>
                          <Text style={styles.eventTitle}>{ev.title}</Text>
                          {!!ev.location && (
                            <Text style={styles.eventLocationText}>📍 {ev.location}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : (
            /* Future Agenda View */
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionSubTitle}>FORWARD TIMELINE</Text>
                  <Text style={styles.sectionMainTitle}>All Upcoming & Future Events</Text>
                </View>
              </View>

              <View style={styles.eventsList}>
                {futureEvents.map((ev) => {
                  const evDate = new Date(ev.dateString + 'T00:00:00');
                  return (
                    <View key={ev.id} style={styles.futureEventCard}>
                      <View style={styles.futureDateBadge}>
                        <Text style={styles.futureMonthText}>
                          {evDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </Text>
                        <Text style={styles.futureDayNumText}>{evDate.getDate()}</Text>
                        <Text style={styles.futureYearText}>{evDate.getFullYear()}</Text>
                      </View>

                      <View style={styles.futureEventBody}>
                        <View style={styles.eventTopRow}>
                          <View style={styles.eventTagBadge}>
                            <Text style={styles.eventTagText}>{ev.tag}</Text>
                          </View>
                          <Text style={styles.eventTimeText}>{ev.time}</Text>
                        </View>
                        <Text style={styles.eventTitle}>{ev.title}</Text>
                        {!!ev.location && (
                          <Text style={styles.eventLocationText}>📍 {ev.location}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* ==================== 3. CREATE EVENT MODAL ==================== */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>SCHEDULE EVENT</Text>
                <Text style={styles.modalTitle}>Add Future Event</Text>
              </View>
              <Pressable
                onPress={() => setCreateModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Event Title */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Event Title *</Text>
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone]}
                  placeholder="e.g. Quarterly Product Strategy Review"
                  placeholderTextColor="#94A3B8"
                  value={eventTitle}
                  onChangeText={setEventTitle}
                  autoFocus
                />
              </View>

              {/* Date Input */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Event Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone]}
                  placeholder="YYYY-MM-DD (e.g. 2026-09-15)"
                  placeholderTextColor="#94A3B8"
                  value={eventDateStr}
                  onChangeText={setEventDateStr}
                />
              </View>

              {/* Quick Date Presets */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Quick Date Presets</Text>
                <View style={styles.chipRow}>
                  {[
                    { label: 'Today', date: todayYMD },
                    { label: 'Tomorrow', date: formatYMD(new Date(today.getTime() + 86400000)) },
                    { label: '+1 Week', date: formatYMD(new Date(today.getTime() + 7 * 86400000)) },
                    { label: '+1 Month', date: formatYMD(new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())) },
                    { label: '+3 Months', date: formatYMD(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())) },
                  ].map((preset) => (
                    <Pressable
                      key={preset.label}
                      onPress={() => setEventDateStr(preset.date)}
                      style={[
                        styles.chip,
                        eventDateStr === preset.date && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          eventDateStr === preset.date && styles.chipTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Time Slots */}
              <View style={styles.timeRowGroup}>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={styles.modalInputLabel}>Start Time</Text>
                  <TextInput
                    style={[styles.modalInput, isWeb && styles.webOutlineNone]}
                    placeholder="10:00 AM"
                    placeholderTextColor="#94A3B8"
                    value={eventStartTime}
                    onChangeText={setEventStartTime}
                  />
                </View>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={styles.modalInputLabel}>End Time</Text>
                  <TextInput
                    style={[styles.modalInput, isWeb && styles.webOutlineNone]}
                    placeholder="11:30 AM"
                    placeholderTextColor="#94A3B8"
                    value={eventEndTime}
                    onChangeText={setEventEndTime}
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Location / Link (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone]}
                  placeholder="e.g. Conference Room / Zoom link"
                  placeholderTextColor="#94A3B8"
                  value={eventLocation}
                  onChangeText={setEventLocation}
                />
              </View>

              {/* Tag / Category */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Category</Text>
                <View style={styles.chipRow}>
                  {tags.map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setEventTag(t)}
                      style={[styles.chip, eventTag === t && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          eventTag === t && styles.chipTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Reminder Toggle */}
              <View style={styles.reminderRow}>
                <View>
                  <Text style={styles.modalInputLabel}>Push Notification</Text>
                  <Text style={styles.reminderSubText}>Alert 15 minutes before event starts</Text>
                </View>
                <Switch
                  value={eventReminder}
                  onValueChange={setEventReminder}
                  trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setCreateModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveEvent}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitText}>Save to Calendar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabPress={handleTabChange} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      {isDesktop ? (
        <View style={styles.desktopOuterContainer}>
          <View style={styles.desktopShell}>{appContent}</View>
        </View>
      ) : (
        appContent
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0E1A' },
  mainWrapper: { flex: 1, backgroundColor: '#0A0E1A' },
  desktopOuterContainer: {
    flex: 1,
    backgroundColor: '#05070D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  desktopShell: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    maxHeight: 880,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    backgroundColor: '#0A0E1A',
  },
  scrollContainer: { flex: 1, backgroundColor: '#0A0E1A' },
  scrollContentContainer: { flexGrow: 1, backgroundColor: '#F8FAFC', paddingBottom: 24 },

  /* 1. HEADER */
  headerHero: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  headerKicker: {
    color: '#818CF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    maxWidth: 240,
  },
  quickAddBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  quickAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Month Navigator Header */
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    zIndex: 2,
  },
  monthTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthTitleText: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  todayBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#818CF8',
  },
  todayBtnText: {
    color: '#EEF2FF',
    fontSize: 11,
    fontWeight: '700',
  },
  monthNavBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  monthNavText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginTop: -2,
  },

  /* Ambient Orbs */
  orbLarge: {
    position: 'absolute',
    right: -80,
    top: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#4338CA',
    opacity: 0.35,
  },
  orbSmall: {
    position: 'absolute',
    right: 50,
    bottom: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    opacity: 0.6,
  },

  /* 2. MAIN SHEET */
  sheetContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  /* View Mode Toggle */
  viewToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 3,
    borderRadius: 14,
    marginBottom: 16,
  },
  viewToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  viewToggleText: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '700',
  },
  viewToggleTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },

  /* Calendar Grid Card */
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  weekDayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  weekDayLabelText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    position: 'relative',
    marginVertical: 1,
  },
  dayCellSelected: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellNum: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  dayCellNumFaded: {
    color: '#CBD5E1',
  },
  dayCellNumToday: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  dayCellNumSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
    position: 'absolute',
    bottom: 5,
  },
  eventDotSelected: {
    backgroundColor: '#FFFFFF',
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionSubTitle: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionMainTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  addDayEventBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  addDayEventText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
  },

  emptyDayBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  emptyDayIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyDayTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyDayDesc: {
    color: '#64748B',
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    maxWidth: 260,
    lineHeight: 17,
  },
  emptyDayActionBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  emptyDayActionText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  eventsList: {
    gap: 10,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  eventStripe: {
    width: 5,
  },
  eventBody: {
    flex: 1,
    padding: 12,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTagBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eventTagText: {
    color: '#4F46E5',
    fontSize: 10.5,
    fontWeight: '700',
  },
  eventTimeText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '600',
  },
  eventTitle: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '700',
  },
  eventLocationText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },

  /* Future Event Cards in Agenda View */
  futureEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  futureDateBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 54,
    marginRight: 12,
  },
  futureMonthText: {
    color: '#818CF8',
    fontSize: 9.5,
    fontWeight: '800',
  },
  futureDayNumText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  futureYearText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
  },
  futureEventBody: {
    flex: 1,
  },

  /* 3. MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalKicker: {
    color: '#6366F1',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800',
  },
  modalScroll: {
    maxHeight: 460,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  modalInputLabel: {
    color: '#1E293B',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  timeRowGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  reminderSubText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Toast Notice */
  noticeToast: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    backgroundColor: '#1E1B4B',
    borderWidth: 1,
    borderColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 999,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  noticeText: {
    color: '#E0E7FF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  pressedOpacity: { opacity: 0.7 },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
