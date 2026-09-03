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
import {
  CalendarDays,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  X,
  Sparkles,
  MapPin,
  Clock,
  Trash2,
} from 'lucide-react-native';
import BottomNavigation from '../../components/BottomNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../../services/api';
import { getToken } from '../../services/storage';

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
  const { theme, isDarkMode } = useTheme();

  const today = new Date();
  const todayYMD = formatYMD(today);

  const [activeTab, setActiveTab] = useState('calendar');
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'agenda'

  // Modal & Notice & Delete State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState('');

  // Form State for creating/editing events
  const [eventTitle, setEventTitle] = useState('');
  const [eventDateStr, setEventDateStr] = useState(todayYMD);
  const [eventStartTime, setEventStartTime] = useState('10:00 AM');
  const [eventEndTime, setEventEndTime] = useState('11:30 AM');
  const [eventTag, setEventTag] = useState('Deep Work');
  const [eventReminder, setEventReminder] = useState(true);
  const [eventLocation, setEventLocation] = useState('');

  // Events State (dynamically bound to database user)
  const [events, setEvents] = useState(user?.events || []);

  // Fetch calendar events from backend API
  const loadEventsFromApi = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetchCalendarEvents({}, token);
      if (res && res.success && Array.isArray(res.events)) {
        setEvents(res.events);
      }
    } catch (e) {
      console.log('Error fetching events from API:', e);
    }
  };

  // Load events on mount
  React.useEffect(() => {
    loadEventsFromApi();
  }, []);

  // Sync state whenever user data changes from database
  React.useEffect(() => {
    if (user && user.events && events.length === 0) {
      setEvents(user.events || []);
    }
  }, [user]);

  const showNotice = (msg) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(''), 2600);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEventsFromApi();
      showNotice('Calendar synced with all devices');
    } catch (e) {
      console.log('Error refreshing calendar events:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onNavigateTab) onNavigateTab(tabId);
    else if (navigation) {
      if (tabId === 'dashboard') navigation.navigate('Dashboard');
      else if (tabId === 'tasks') navigation.navigate('Tasks');
      else if (tabId === 'goals') navigation.navigate('Goals');
      else if (tabId === 'health') navigation.navigate('Health');
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

  const getColorForTag = (tag) => {
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
  };

  // Open Create / Edit Modal
  const openCreateModal = (presetDate = null, eventToEdit = null) => {
    if (eventToEdit) {
      setEditingEvent(eventToEdit);
      setEventTitle(eventToEdit.title || '');
      setEventDateStr(eventToEdit.dateString || todayYMD);
      setEventStartTime(eventToEdit.startTime || '10:00 AM');
      setEventEndTime(eventToEdit.endTime || '11:30 AM');
      setEventTag(eventToEdit.tag || 'Deep Work');
      setEventReminder(eventToEdit.reminder !== undefined ? Boolean(eventToEdit.reminder) : true);
      setEventLocation(eventToEdit.location || '');
    } else {
      setEditingEvent(null);
      const targetDate = presetDate || selectedDate;
      setEventDateStr(formatYMD(targetDate));
      setEventTitle('');
      setEventStartTime('10:00 AM');
      setEventEndTime('11:30 AM');
      setEventTag('Deep Work');
      setEventReminder(true);
      setEventLocation('');
    }
    setCreateModalVisible(true);
  };

  // Save or Update Event
  const handleSaveEvent = async () => {
    if (!eventTitle.trim()) {
      showNotice('Please enter an event title');
      return;
    }
    if (!eventDateStr.trim()) {
      showNotice('Please provide a valid date');
      return;
    }

    const payload = {
      title: eventTitle.trim(),
      dateString: eventDateStr.trim(),
      startTime: eventStartTime.trim() || '10:00 AM',
      endTime: eventEndTime.trim() || '11:30 AM',
      time: `${eventStartTime.trim() || '10:00 AM'} - ${eventEndTime.trim() || '11:30 AM'}`,
      tag: eventTag,
      color: getColorForTag(eventTag),
      reminder: eventReminder,
      location: eventLocation.trim() || 'Scheduled Block',
    };

    try {
      const token = await getToken();
      if (editingEvent) {
        const idToUpdate = editingEvent.id || editingEvent._id;
        setEvents((prev) =>
          prev.map((e) => ((e.id === idToUpdate || e._id === idToUpdate) ? { ...e, ...payload } : e))
        );
        showNotice('Event updated for ' + eventDateStr);

        if (token) {
          const res = await updateCalendarEvent(idToUpdate, payload, token);
          if (res && res.success && res.event) {
            setEvents((prev) =>
              prev.map((e) => ((e.id === idToUpdate || e._id === idToUpdate) ? res.event : e))
            );
          }
        }
      } else {
        const tempEv = {
          id: Date.now().toString(),
          ...payload,
        };
        setEvents((prev) => [...prev, tempEv]);
        showNotice('Event scheduled for ' + eventDateStr);

        if (token) {
          const res = await createCalendarEvent(payload, token);
          if (res && res.success && res.event) {
            setEvents((prev) =>
              prev.map((e) => (e.id === tempEv.id ? res.event : e))
            );
          }
        }
      }
    } catch (e) {
      console.log('Error saving event:', e);
      showNotice('Saved event locally');
    }

    setCreateModalVisible(false);
    setEditingEvent(null);
  };

  // Delete event confirmation
  const confirmDeleteEvent = (ev) => {
    setEventToDelete(ev);
    setDeleteModalVisible(true);
  };

  const executeDeleteEvent = async () => {
    if (!eventToDelete) return;
    const targetId = eventToDelete.id || eventToDelete._id;

    setEvents((prev) => prev.filter((e) => (e.id !== targetId && e._id !== targetId)));
    showNotice('Event removed from schedule');
    setDeleteModalVisible(false);
    setEventToDelete(null);

    try {
      const token = await getToken();
      if (token) {
        await deleteCalendarEvent(targetId, token);
      }
    } catch (e) {
      console.log('Error deleting event on server:', e);
    }
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
    <View style={[styles.mainWrapper, { backgroundColor: theme.colors.pageBg }]}>
      {!!noticeMessage && (
        <View style={styles.noticeToast}>
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
          <Text style={styles.noticeText}>{noticeMessage}</Text>
        </View>
      )}

      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: theme.colors.appBg }]}
        contentContainerStyle={[styles.scrollContentContainer, { backgroundColor: theme.colors.pageBg }]}
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
              <Plus size={13} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.quickAddBtnText}>Event</Text>
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
                <ChevronLeft size={16} color="#C7D2FE" strokeWidth={2.4} />
              </Pressable>

              <Pressable
                onPress={nextMonth}
                style={({ pressed }) => [
                  styles.monthNavBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <ChevronRight size={16} color="#C7D2FE" strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>

          {/* Glowing Ambient Orbs */}
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
        </View>

        {/* ==================== 2. MAIN SHEET ==================== */}
        <View style={[styles.sheetContent, { backgroundColor: theme.colors.pageBg }]}>
          {/* View Mode Toggle */}
          <View style={[styles.viewToggleRow, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
            <Pressable
              onPress={() => setViewMode('month')}
              style={[
                styles.viewToggleBtn,
                viewMode === 'month' && [styles.viewToggleBtnActive, { backgroundColor: theme.colors.cardBg }],
                isWeb && styles.webPointer,
              ]}
            >
              <CalendarDays
                size={14}
                color={viewMode === 'month' ? (isDarkMode ? '#818CF8' : '#4F46E5') : theme.colors.textMuted}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.viewToggleText,
                  { color: theme.colors.textMuted },
                  viewMode === 'month' && [styles.viewToggleTextActive, { color: theme.colors.textPrimary }],
                ]}
              >
                Month View
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('agenda')}
              style={[
                styles.viewToggleBtn,
                viewMode === 'agenda' && [styles.viewToggleBtnActive, { backgroundColor: theme.colors.cardBg }],
                isWeb && styles.webPointer,
              ]}
            >
              <ListTodo
                size={14}
                color={viewMode === 'agenda' ? (isDarkMode ? '#818CF8' : '#4F46E5') : theme.colors.textMuted}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.viewToggleText,
                  { color: theme.colors.textMuted },
                  viewMode === 'agenda' && [styles.viewToggleTextActive, { color: theme.colors.textPrimary }],
                ]}
              >
                Future Agenda ({futureEvents.length})
              </Text>
            </Pressable>
          </View>

          {viewMode === 'month' ? (
            <>
              {/* Full Month Calendar Grid Card */}
              <View style={[styles.calendarCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
                {/* Day Labels (Sun, Mon, Tue, etc.) */}
                <View style={styles.weekDayLabelsRow}>
                  {WEEK_DAYS.map((wd) => (
                    <Text key={wd} style={[styles.weekDayLabelText, { color: theme.colors.textMuted }]}>
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
                            { color: theme.colors.textPrimary },
                            !cell.isCurrentMonth && [styles.dayCellNumFaded, { color: theme.colors.textMuted }],
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
              <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionSubTitle}>
                      {selectedYMD === todayYMD ? 'TODAY’S SCHEDULE' : 'SELECTED DATE'}
                    </Text>
                    <Text style={[styles.sectionMainTitle, { color: theme.colors.textPrimary }]}>
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
                    <Plus size={12} color="#4F46E5" strokeWidth={2.5} />
                    <Text style={styles.addDayEventText}>Add</Text>
                  </Pressable>
                </View>

                {selectedDayEvents.length === 0 ? (
                  <View style={[styles.emptyDayBox, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                    <Sparkles size={36} color="#94A3B8" strokeWidth={1.5} />
                    <Text style={[styles.emptyDayTitle, { color: theme.colors.textPrimary }]}>Open Focus Time</Text>
                    <Text style={[styles.emptyDayDesc, { color: theme.colors.textSecondary }]}>
                      No commitments scheduled on this date. Perfect for deep uninterrupted flow.
                    </Text>
                    <Pressable
                      onPress={() => openCreateModal(selectedDate)}
                      style={styles.emptyDayActionBtn}
                    >
                      <Plus size={13} color="#4F46E5" strokeWidth={2.5} />
                      <Text style={styles.emptyDayActionText}>Schedule an Event</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.eventsList}>
                    {selectedDayEvents.map((ev) => (
                      <Pressable
                        key={ev.id || ev._id}
                        onPress={() => openCreateModal(null, ev)}
                        style={({ pressed }) => [
                          styles.eventCard,
                          { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                          isWeb && styles.webPointer,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <View style={[styles.eventStripe, { backgroundColor: ev.color }]} />
                        <View style={styles.eventBody}>
                          <View style={styles.eventTopRow}>
                            <View style={styles.eventTagBadge}>
                              <Text style={styles.eventTagText}>{ev.tag}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={[styles.eventTimeText, { color: theme.colors.textMuted }]}>{ev.time}</Text>
                              <Pressable
                                onPress={(e) => {
                                  e?.stopPropagation?.();
                                  confirmDeleteEvent(ev);
                                }}
                                hitSlop={8}
                                style={{ padding: 2 }}
                              >
                                <X size={14} color="#94A3B8" strokeWidth={2.2} />
                              </Pressable>
                            </View>
                          </View>
                          <Text style={[styles.eventTitle, { color: theme.colors.textPrimary }]}>{ev.title}</Text>
                          {!!ev.location && (
                            <View style={styles.eventLocationRow}>
                              <MapPin size={12} color="#64748B" strokeWidth={2.2} />
                              <Text style={[styles.eventLocationText, { color: theme.colors.textSecondary }]}>{ev.location}</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : (
            /* Future Agenda View */
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionSubTitle}>FORWARD TIMELINE</Text>
                  <Text style={[styles.sectionMainTitle, { color: theme.colors.textPrimary }]}>All Upcoming & Future Events</Text>
                </View>
              </View>

              <View style={styles.eventsList}>
                {futureEvents.map((ev) => {
                  const evDate = new Date((ev.dateString || todayYMD) + 'T00:00:00');
                  return (
                    <Pressable
                      key={ev.id || ev._id}
                      onPress={() => openCreateModal(null, ev)}
                      style={({ pressed }) => [
                        styles.futureEventCard,
                        { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                        isWeb && styles.webPointer,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <View style={[styles.futureDateBadge, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF', borderColor: theme.colors.border }]}>
                        <Text style={[styles.futureMonthText, { color: isDarkMode ? '#C7D2FE' : '#4F46E5' }]}>
                          {evDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </Text>
                        <Text style={[styles.futureDayNumText, { color: theme.colors.textPrimary }]}>{evDate.getDate()}</Text>
                        <Text style={[styles.futureYearText, { color: theme.colors.textMuted }]}>{evDate.getFullYear()}</Text>
                      </View>

                      <View style={styles.futureEventBody}>
                        <View style={styles.eventTopRow}>
                          <View style={styles.eventTagBadge}>
                            <Text style={styles.eventTagText}>{ev.tag}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.eventTimeText, { color: theme.colors.textMuted }]}>{ev.time}</Text>
                            <Pressable
                              onPress={(e) => {
                                e?.stopPropagation?.();
                                confirmDeleteEvent(ev);
                              }}
                              hitSlop={8}
                              style={{ padding: 2 }}
                            >
                              <X size={14} color="#94A3B8" strokeWidth={2.2} />
                            </Pressable>
                          </View>
                        </View>
                        <Text style={[styles.eventTitle, { color: theme.colors.textPrimary }]}>{ev.title}</Text>
                        {!!ev.location && (
                          <View style={styles.eventLocationRow}>
                            <MapPin size={12} color="#64748B" strokeWidth={2.2} />
                            <Text style={[styles.eventLocationText, { color: theme.colors.textSecondary }]}>{ev.location}</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* ==================== 3. CREATE / EDIT EVENT MODAL ==================== */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCreateModalVisible(false);
          setEditingEvent(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>
                  {editingEvent ? 'UPDATE EVENT' : 'SCHEDULE EVENT'}
                </Text>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                  {editingEvent ? 'Edit Event' : 'Add Future Event'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setCreateModalVisible(false);
                  setEditingEvent(null);
                }}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Event Title */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Event Title *</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                  placeholder="e.g. Quarterly Product Strategy Review"
                  placeholderTextColor="#94A3B8"
                  value={eventTitle}
                  onChangeText={setEventTitle}
                  autoFocus
                />
              </View>

              {/* Date Input */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Event Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                  placeholder="YYYY-MM-DD (e.g. 2026-09-15)"
                  placeholderTextColor="#94A3B8"
                  value={eventDateStr}
                  onChangeText={setEventDateStr}
                />
              </View>

              {/* Quick Date Presets */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Quick Date Presets</Text>
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
                        { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                        eventDateStr === preset.date && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: theme.colors.textSecondary },
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
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Start Time</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                    placeholder="10:00 AM"
                    placeholderTextColor="#94A3B8"
                    value={eventStartTime}
                    onChangeText={setEventStartTime}
                  />
                </View>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>End Time</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                    placeholder="11:30 AM"
                    placeholderTextColor="#94A3B8"
                    value={eventEndTime}
                    onChangeText={setEventEndTime}
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Location / Link (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                  placeholder="e.g. Conference Room / Zoom link"
                  placeholderTextColor="#94A3B8"
                  value={eventLocation}
                  onChangeText={setEventLocation}
                />
              </View>

              {/* Tag / Category */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Category</Text>
                <View style={styles.chipRow}>
                  {tags.map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setEventTag(t)}
                      style={[
                        styles.chip,
                        { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                        eventTag === t && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: theme.colors.textSecondary },
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
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Push Notification</Text>
                  <Text style={[styles.reminderSubText, { color: theme.colors.textMuted }]}>Alert 15 minutes before event starts</Text>
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
                onPress={() => {
                  setCreateModalVisible(false);
                  setEditingEvent(null);
                }}
                style={[styles.modalCancelBtn, { backgroundColor: theme.colors.cardAltBg }]}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveEvent}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitText}>
                  {editingEvent ? 'Update Event' : 'Save to Calendar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== 4. DELETE EVENT CONFIRMATION MODAL ==================== */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border, maxWidth: 360 }]}>
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Trash2 size={24} color="#EF4444" strokeWidth={2.2} />
              </View>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary, textAlign: 'center' }]}>Delete Event?</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                Are you sure you want to remove "{eventToDelete?.title}" from your schedule?
              </Text>
            </View>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.modalCancelBtn, { backgroundColor: theme.colors.cardAltBg }]}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={executeDeleteEvent}
                style={[styles.modalSubmitBtn, { backgroundColor: '#EF4444' }]}
              >
                <Text style={styles.modalSubmitText}>Delete</Text>
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.appBg }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.colors.statusBarStyle} backgroundColor={theme.colors.appBg} />
      {isDesktop ? (
        <View style={[styles.desktopOuterContainer, { backgroundColor: theme.colors.desktopBg }]}>
          <View style={[styles.desktopShell, { backgroundColor: theme.colors.appBg, borderColor: theme.colors.borderDark }]}>
            {appContent}
          </View>
        </View>
      ) : (
        appContent
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainWrapper: { flex: 1 },
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
  scrollContainer: { flex: 1 },
  scrollContentContainer: { flexGrow: 1, paddingBottom: 24 },

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  eventLocationText: {
    color: '#64748B',
    fontSize: 11,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
