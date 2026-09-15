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
  Alert,
  Modal,
  Switch,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  X,
  Bell,
  CalendarDays,
  Check,
  Sparkles,
  Clock,
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
} from 'lucide-react-native';
import BottomNavigation from '../../components/BottomNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import { useReminders } from '../../contexts/ReminderContext';
import {
  createTask,
  fetchTasks,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  fetchAiTaskRecommendation,
} from '../../services/api';
import { getToken } from '../../services/storage';

export default function TasksScreen({ user, onLogout, onNavigateTab, navigation }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const { theme, isDarkMode } = useTheme();
  const { checkReminders } = useReminders();

  // Active Tab for navigation
  const [activeTab, setActiveTab] = useState('tasks');

  // Search State
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Filters: 'All' | 'Active' | 'Completed' | 'Work' | 'Personal' | 'Health'
  const [activeFilter, setActiveFilter] = useState('All');

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Interactive Clock / Time Picker Modal State
  const [timePickerModalVisible, setTimePickerModalVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState('start'); // 'start' | 'end'
  const [pickerHour, setPickerHour] = useState(9);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerPeriod, setPickerPeriod] = useState('AM'); // 'AM' | 'PM'
  const [pickerMode, setPickerMode] = useState('hour'); // 'hour' | 'minute'

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Notice feedback tooltip
  const [noticeMessage, setNoticeMessage] = useState('');

  // Form State for Task Creation
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStartTime, setTaskStartTime] = useState('');
  const [taskEndTime, setTaskEndTime] = useState('');
  const [taskCategory, setTaskCategory] = useState('Work');
  const [taskReminder, setTaskReminder] = useState(true);
  const [titleError, setTitleError] = useState('');

  // Dedicated Form State for Task Editing
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskStartTime, setEditTaskStartTime] = useState('');
  const [editTaskEndTime, setEditTaskEndTime] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState('Work');
  const [editTaskReminder, setEditTaskReminder] = useState(true);
  const [editTitleError, setEditTitleError] = useState('');
  const [timePickerContext, setTimePickerContext] = useState('create'); // 'create' | 'edit'

  // Tasks state (dynamically bound to backend API and database user)
  const [tasks, setTasks] = useState(user?.tasks || []);

  // Fetch tasks from backend for authenticated user
  const loadTasks = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetchTasks({}, token);
      if (res && res.success && Array.isArray(res.tasks)) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.log('[HumanOS Tasks] Error loading tasks:', err.message);
    }
  };

  // Fetch notifications from backend
  const loadNotifications = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetchNotifications({}, token);
      if (res && res.success && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        setUnreadNotificationCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.log('[HumanOS Notifications] Error loading:', err.message);
    }
  };

  // Initial load and sync on mount / user change
  React.useEffect(() => {
    loadTasks();
    loadNotifications();
  }, []);

  React.useEffect(() => {
    if (user && Array.isArray(user.tasks) && user.tasks.length > 0 && tasks.length === 0) {
      setTasks(user.tasks);
    }
  }, [user]);

  const showNotice = (msg) => {
    setNoticeMessage(msg);
    setTimeout(() => {
      setNoticeMessage('');
    }, 2800);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTasks(), loadNotifications()]);
    setRefreshing(false);
    showNotice('Tasks & reminders synced');
  };

  const handleMarkNotificationRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n))
    );
    setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
    try {
      const token = await getToken();
      if (token) await markNotificationAsRead(id, token);
    } catch (e) {
      console.log('Error marking notification read:', e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotificationCount(0);
    showNotice('All notifications marked as read');
    try {
      const token = await getToken();
      if (token) await markAllNotificationsAsRead(token);
    } catch (e) {
      console.log('Error marking all read:', e);
    }
  };

  const handleDeleteNotification = async (id) => {
    const target = notifications.find((n) => n.id === id || n._id === id);
    if (target && !target.read) {
      setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id && n._id !== id));
    showNotice('Notification dismissed');
    try {
      const token = await getToken();
      if (token) await deleteNotification(id, token);
    } catch (e) {
      console.log('Error deleting notification:', e);
    }
  };

  // Helper to parse 24-hour or 12-hour time string into { hour, minute }
  const parseTimeString = (str) => {
    if (!str || typeof str !== 'string' || !str.trim()) {
      const now = new Date();
      return { hour: now.getHours(), minute: now.getMinutes() };
    }
    const raw = str.trim();
    // 12-hour with AM/PM e.g. "07:30 PM"
    const match12 = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (match12 && match12[3]) {
      let hr = parseInt(match12[1], 10) || 0;
      const min = parseInt(match12[2], 10) || 0;
      const ampm = match12[3].toLowerCase();
      if (ampm === 'pm' && hr < 12) hr += 12;
      if (ampm === 'am' && hr === 12) hr = 0;
      return { hour: Math.min(23, Math.max(0, hr)), minute: Math.min(59, Math.max(0, min)) };
    }
    // 24-hour e.g. "19:30" or "09:00"
    const parts = raw.split(':');
    const hr = parseInt(parts[0], 10) || 0;
    const min = parseInt(parts[1], 10) || 0;
    return { hour: Math.min(23, Math.max(0, hr)), minute: Math.min(59, Math.max(0, min)) };
  };

  // Open Clock / Time Picker Modal
  const handleOpenTimePicker = (target, context = 'create') => {
    setTimePickerTarget(target);
    setTimePickerContext(context);
    const timeVal = context === 'edit'
      ? (target === 'start' ? editTaskStartTime : editTaskEndTime)
      : (target === 'start' ? taskStartTime : taskEndTime);
    const parsed = parseTimeString(timeVal);
    setPickerHour(parsed.hour);
    setPickerMinute(parsed.minute);
    setPickerMode('hour');
    setTimePickerModalVisible(true);
  };

  // Apply selected 24-Hour time from Clock Modal
  const handleApplyTimePicker = () => {
    const formatted = `${String(pickerHour).padStart(2, '0')}:${String(pickerMinute).padStart(2, '0')}`;
    if (timePickerContext === 'edit') {
      if (timePickerTarget === 'start') {
        setEditTaskStartTime(formatted);
      } else {
        setEditTaskEndTime(formatted);
      }
    } else {
      if (timePickerTarget === 'start') {
        setTaskStartTime(formatted);
      } else {
        setTaskEndTime(formatted);
      }
    }
    setTimePickerModalVisible(false);
  };

  // AI Productivity Briefing State
  const [aiTaskBriefing, setAiTaskBriefing] = useState('');
  const [aiTaskLoading, setAiTaskLoading] = useState(false);

  const handleGenerateAiTaskBriefing = async () => {
    setAiTaskLoading(true);
    try {
      const token = await getToken();
      const payload = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.done || t.status === 'COMPLETED').length,
        pendingTasks: tasks.filter((t) => !t.done && t.status !== 'COMPLETED').map((t) => t.title),
      };
      const res = await fetchAiTaskRecommendation(payload, token);
      if (res && res.success && res.recommendation) {
        setAiTaskBriefing(res.recommendation);
        showNotice(res.source && res.source.startsWith('ollama') ? 'AI Briefing generated by Ollama' : 'AI Briefing updated');
      } else {
        throw new Error(res?.message || 'Empty response');
      }
    } catch (e) {
      console.log('AI Task briefing error:', e.message);
      setAiTaskBriefing('Focus on completing your scheduled time blocks with deep concentration.');
      showNotice('AI briefing updated');
    } finally {
      setAiTaskLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onNavigateTab) {
      onNavigateTab(tabId);
    } else if (navigation) {
      if (tabId === 'dashboard') navigation.navigate('Dashboard');
      else if (tabId === 'profile') navigation.navigate('Profile');
    }
  };

  // Dynamic Date string formatting
  const getFormattedDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Toggle completion with backend persistence & immediate undo support
  const toggleTask = async (id) => {
    const targetId = id;
    let nowDone = false;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => {
        const taskId = t._id || t.id;
        if (taskId === targetId) {
          nowDone = !t.done;
          const timeString = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          return {
            ...t,
            done: nowDone,
            status: nowDone ? 'COMPLETED' : 'PENDING',
            completedAt: nowDone ? timeString : null,
          };
        }
        return t;
      })
    );

    showNotice(nowDone ? 'Task marked as completed' : 'Task restored to active list');

    try {
      const token = await getToken();
      if (token) {
        const res = await toggleTaskComplete(targetId, token);
        if (res && res.success && res.task) {
          setTasks((prev) =>
            prev.map((t) => ((t._id || t.id) === targetId ? res.task : t))
          );
        }
      }
      checkReminders?.();
    } catch (err) {
      console.log('[HumanOS Tasks] Error toggling task:', err.message);
    }
  };

  // Delete Task with Confirmation Alert & backend persistence
  const executeDeleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => (t._id || t.id) !== taskId));
    showNotice('Task deleted');

    try {
      const token = await getToken();
      if (token) {
        await deleteTask(taskId, token);
      }
      checkReminders?.();
    } catch (err) {
      console.log('[HumanOS Tasks] Error deleting task:', err.message);
    }
  };

  const confirmDeleteTask = (task) => {
    const taskId = task._id || task.id;
    setOptionsModalVisible(false);
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete Task?\n\nAre you sure you want to delete "${task.title}"?`)) {
        executeDeleteTask(taskId);
      }
    } else {
      Alert.alert(
        'Delete Task?',
        `Are you sure you want to delete "${task.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => executeDeleteTask(taskId),
          },
        ],
        { cancelable: true }
      );
    }
  };

  // Clear all completed tasks at once
  const handleClearAllCompleted = () => {
    const completedList = tasks.filter((t) => t.done || t.status === 'COMPLETED');
    if (completedList.length === 0) return;

    const performClear = async () => {
      const completedIds = completedList.map((t) => t._id || t.id);
      setTasks((prev) => prev.filter((t) => !completedIds.includes(t._id || t.id)));
      showNotice(`${completedList.length} completed task(s) cleared`);
      try {
        const token = await getToken();
        if (token) {
          await Promise.all(completedIds.map((id) => deleteTask(id, token)));
        }
        checkReminders?.();
      } catch (err) {
        console.log('[HumanOS Tasks] Error clearing completed tasks:', err.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Clear All Completed Tasks?\n\nAre you sure you want to permanently delete ${completedList.length} completed task(s)?`)) {
        performClear();
      }
    } else {
      Alert.alert(
        'Clear Completed Tasks?',
        `Are you sure you want to delete ${completedList.length} completed task(s)?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear All',
            style: 'destructive',
            onPress: performClear,
          },
        ],
        { cancelable: true }
      );
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskStartTime('');
    setTaskEndTime('');
    setTaskCategory('Work');
    setTaskReminder(true);
    setTitleError('');
    setCreateModalVisible(true);
  };

  // Submit New Task to Backend (with start/end times and start reminder)
  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      setTitleError('Please enter a task title.');
      return;
    }

    const payload = {
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      startTime: taskStartTime.trim(),
      endTime: taskEndTime.trim(),
      dueTime: taskStartTime.trim() || '',
      category: taskCategory,
      reminder: taskReminder,
      status: 'PENDING',
      done: false,
    };

    try {
      const token = await getToken();
      if (token) {
        const res = await createTask(payload, token);
        if (res && res.success && res.task) {
          setTasks((prev) => [res.task, ...prev]);
          setCreateModalVisible(false);
          showNotice('Task created with start reminder');
          loadNotifications();
          checkReminders?.(true);
          return;
        }
      }
    } catch (err) {
      console.log('[HumanOS Tasks] Error creating task on backend:', err.message);
    }

    // Fallback if offline
    const newTask = {
      id: `task_${Date.now()}`,
      ...payload,
      completedAt: null,
    };
    setTasks((prev) => [newTask, ...prev]);
    setCreateModalVisible(false);
    showNotice('Task added successfully');
    checkReminders?.(true);
  };

  // Open Edit Modal
  const openEditModal = (task) => {
    if (!task) return;
    setSelectedTask(task);
    setEditTaskTitle(task.title || '');
    setEditTaskDescription(task.description || '');
    setEditTaskStartTime(task.startTime || task.dueTime || '');
    setEditTaskEndTime(task.endTime || '');
    setEditTaskCategory(task.category || 'Work');
    setEditTaskReminder(task.reminder ?? true);
    setEditTitleError('');
    setOptionsModalVisible(false);
    // Short timeout to let options modal backdrop dismiss cleanly on web and mobile
    setTimeout(() => {
      setEditModalVisible(true);
    }, 60);
  };

  // Save Edited Task to Backend
  const handleSaveEditTask = async () => {
    if (!editTaskTitle.trim()) {
      setEditTitleError('Please enter a task title.');
      return;
    }

    if (!selectedTask) return;
    const taskId = selectedTask._id || selectedTask.id;
    const updatePayload = {
      title: editTaskTitle.trim(),
      description: editTaskDescription.trim(),
      startTime: editTaskStartTime.trim(),
      endTime: editTaskEndTime.trim(),
      dueTime: editTaskStartTime.trim() || '',
      category: editTaskCategory,
      reminder: editTaskReminder,
    };

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        (t._id || t.id) === taskId
          ? { ...t, ...updatePayload }
          : t
      )
    );
    setEditModalVisible(false);
    showNotice('Task updated');

    try {
      const token = await getToken();
      if (token) {
        const res = await updateTask(taskId, updatePayload, token);
        if (res && res.success && res.task) {
          setTasks((prev) =>
            prev.map((t) => ((t._id || t.id) === taskId ? res.task : t))
          );
        }
      }
      checkReminders?.();
    } catch (err) {
      console.log('[HumanOS Tasks] Error updating task on backend:', err.message);
    }
  };

  // Computed Progress Stats
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.done || t.status === 'COMPLETED').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Motivational message
  const getMotivationalMessage = () => {
    if (progressPercent === 100 && totalCount > 0) {
      return 'Phenomenal! All scheduled tasks completed.';
    }
    if (progressPercent >= 50) {
      return "You're making great progress. Keep moving forward.";
    }
    if (progressPercent > 0) {
      return 'Solid start. Knock out the next time block.';
    }
    return 'Ready to take on your scheduled task blocks?';
  };

  // Filtering Logic
  const getFilteredTasks = () => {
    let list = [...tasks];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const title = (t?.title || '').toLowerCase();
        const desc = (t?.description || '').toLowerCase();
        const cat = (t?.category || '').toLowerCase();
        const start = (t?.startTime || '').toLowerCase();
        const end = (t?.endTime || '').toLowerCase();
        const due = (t?.dueTime || '').toLowerCase();
        const status = (t?.status || '').toLowerCase();
        const doneStr = t?.done ? 'completed done' : 'pending active';
        return (
          title.includes(q) ||
          desc.includes(q) ||
          cat.includes(q) ||
          start.includes(q) ||
          end.includes(q) ||
          due.includes(q) ||
          status.includes(q) ||
          doneStr.includes(q)
        );
      });
    }

    // Tab filter
    if (activeFilter === 'Active') {
      list = list.filter((t) => !t.done && t.status !== 'COMPLETED');
    } else if (activeFilter === 'Completed') {
      list = list.filter((t) => t.done || t.status === 'COMPLETED');
    } else if (activeFilter !== 'All') {
      list = list.filter((t) => t.category?.toLowerCase() === activeFilter.toLowerCase());
    }

    return list;
  };

  const filteredTasks = getFilteredTasks();
  const recentlyCompletedTasks = tasks.filter((t) => t.done || t.status === 'COMPLETED');

  const filterOptions = ['All', 'Active', 'Completed', 'Work', 'Personal', 'Health', 'Study'];
  const categoryOptions = ['Work', 'Personal', 'Health', 'Study', 'Finance', 'Other'];

  const appContent = (
    <View style={[styles.mainWrapper, { backgroundColor: theme.colors.pageBg }]}>
      {/* Toast Notice */}
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
        keyboardShouldPersistTaps="handled"
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
              <Text style={styles.headerKicker}>HUMANOS EXECUTION</Text>
              <Text style={styles.headerTitle}>Tasks</Text>
              <Text style={styles.headerSubtitle}>Scheduled time blocks & actionable steps.</Text>
            </View>

            <View style={styles.headerActionRow}>
              <Pressable
                onPress={() => {
                  setNotificationsModalVisible(true);
                  loadNotifications();
                }}
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Bell size={18} color="#94A3B8" strokeWidth={2.2} />
                {unreadNotificationCount > 0 && <View style={styles.notificationDot} />}
              </Pressable>
            </View>
          </View>

          {/* Dynamic Date display */}
          <View style={styles.dateRow}>
            <View style={styles.dateBadge}>
              <CalendarDays size={13} color="#818CF8" strokeWidth={2.2} />
              <Text style={styles.dateText}>{getFormattedDate()}</Text>
            </View>
          </View>

          {/* Search Bar - Permanently Visible & Fully Interactive */}
          <View style={[styles.searchBarContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <Search size={15} color={isDarkMode ? '#94A3B8' : '#64748B'} strokeWidth={2.2} />
            <TextInput
              style={[styles.searchInput, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }, isWeb && styles.webOutlineNone]}
              placeholder="Search tasks by title, category, time, or status..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {!!searchQuery && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6} style={styles.searchClearBtn}>
                <X size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} strokeWidth={2.2} />
              </Pressable>
            )}
          </View>

          {/* Glowing Ambient Accent Orbs */}
          <View style={styles.orbGreen} />
          <View style={styles.orbBlue} />
        </View>

        {/* ==================== MAIN CONTENT SHEET ==================== */}
        <View style={[styles.sheetContent, { backgroundColor: theme.colors.pageBg }]}>
          {/* ==================== 2. DAILY TASK SUMMARY ==================== */}
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.summaryKicker}>DAILY DISCIPLINE</Text>
                <Text style={[styles.summaryTitle, { color: theme.colors.textPrimary }]}>Task Completion</Text>
              </View>
              <View style={styles.progressPercentBadge}>
                <Text style={styles.progressPercentText}>{progressPercent}%</Text>
              </View>
            </View>

            {/* Horizontal Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.max(4, Math.min(100, progressPercent))}%` },
                ]}
              />
            </View>

            <View style={styles.summaryFooterRow}>
              <Text style={[styles.summaryCountText, { color: theme.colors.textSecondary }]}>
                <Text style={[styles.summaryCountBold, { color: theme.colors.textPrimary }]}>{completedCount}</Text> of{' '}
                <Text style={[styles.summaryCountBold, { color: theme.colors.textPrimary }]}>{totalCount}</Text> tasks completed
              </Text>
              <Text style={styles.summaryMotivationalText}>{getMotivationalMessage()}</Text>
            </View>

            {/* AI Productivity Briefing */}
            <View
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: isDarkMode ? '#334155' : '#F1F5F9',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} color="#6366F1" strokeWidth={2.5} />
                  <Text style={{ color: '#4F46E5', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.1 }}>
                    AI PRODUCTIVITY BRIEFING
                  </Text>
                </View>
                <Pressable
                  onPress={handleGenerateAiTaskBriefing}
                  disabled={aiTaskLoading}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF',
                    },
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={{ color: '#4F46E5', fontSize: 10.5, fontWeight: '700' }}>
                    {aiTaskLoading ? 'Analyzing...' : (aiTaskBriefing ? 'Refresh' : 'Get Briefing')}
                  </Text>
                </Pressable>
              </View>
              {!!aiTaskBriefing && (
                <Text style={{ color: isDarkMode ? '#E0E7FF' : '#1E293B', fontSize: 12, lineHeight: 17, marginTop: 4 }}>
                  {aiTaskBriefing}
                </Text>
              )}
            </View>
          </View>

          {/* ==================== 3. TASK FILTERS ==================== */}
          <View style={styles.filtersScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {filterOptions.map((filter) => {
                const isSelected = activeFilter === filter;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setActiveFilter(filter)}
                    style={({ pressed }) => [
                      styles.filterPill,
                      isSelected ? styles.filterPillActive : [styles.filterPillInactive, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }],
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        isSelected ? styles.filterPillTextActive : [styles.filterPillTextInactive, { color: theme.colors.textSecondary }],
                      ]}
                    >
                      {filter}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ==================== 4. TASK LIST ==================== */}
          <View style={styles.taskListSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionSubTitle}>SCHEDULED TASKS</Text>
                <Text style={[styles.sectionMainTitle, { color: theme.colors.textPrimary }]}>
                  {activeFilter === 'Active'
                    ? 'Active Tasks'
                    : activeFilter === 'Completed'
                      ? 'Completed Tasks'
                      : activeFilter === 'All'
                        ? 'All Tasks'
                        : `${activeFilter} Tasks`}
                </Text>
              </View>
              <Pressable
                onPress={openCreateModal}
                style={({ pressed }) => [
                  styles.quickAddHeaderBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Plus size={13} color="#6366F1" strokeWidth={2.5} />
                <Text style={styles.quickAddHeaderText}>Add Task</Text>
              </Pressable>
            </View>

            {/* Empty State */}
            {filteredTasks.length === 0 ? (
              <View style={[styles.emptyStateBox, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
                <View style={styles.emptyStateIconCircle}>
                  {searchQuery.trim() ? (
                    <Search size={22} color="#6366F1" strokeWidth={2.2} />
                  ) : (
                    <Sparkles size={24} color="#6366F1" strokeWidth={2} />
                  )}
                </View>
                <Text style={[styles.emptyStateTitle, { color: theme.colors.textPrimary }]}>
                  {searchQuery.trim() ? 'No matching tasks found' : 'No tasks in this list'}
                </Text>
                <Text style={[styles.emptyStateDesc, { color: theme.colors.textSecondary }]}>
                  {searchQuery.trim()
                    ? `No tasks match "${searchQuery}". Try a different search term or category.`
                    : 'Add a new task with start and end times.'}
                </Text>
                {searchQuery.trim() ? (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    style={({ pressed }) => [
                      styles.emptyStateActionBtn,
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <X size={13} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.emptyStateActionText}>Clear Search</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={openCreateModal}
                    style={({ pressed }) => [
                      styles.emptyStateActionBtn,
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Plus size={13} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.emptyStateActionText}>Add Task</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.tasksListContainer}>
                {filteredTasks.map((task) => {
                  const taskId = task._id || task.id;
                  const isDone = task.done || task.status === 'COMPLETED';
                  const hasTime = !!(task.startTime || task.dueTime || task.endTime);
                  const timeDisplay = task.startTime && task.endTime
                    ? `${task.startTime} – ${task.endTime}`
                    : (task.startTime || task.dueTime || task.endTime || '');

                  return (
                    <View
                      key={taskId}
                      style={[
                        styles.taskCard,
                        { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border },
                        isDone && [styles.taskCardCompleted, { backgroundColor: theme.colors.cardAltBg }],
                      ]}
                    >
                      {/* Checkbox (Click to toggle complete / undo) */}
                      <Pressable
                        onPress={() => toggleTask(taskId)}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.checkboxContainer,
                          isDone && styles.checkboxContainerActive,
                          isWeb && styles.webPointer,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        {isDone && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                      </Pressable>

                      {/* Main Task Content */}
                      <Pressable
                        onPress={() => toggleTask(taskId)}
                        style={({ pressed }) => [
                          styles.taskBody,
                          isWeb && styles.webPointer,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskTitleText,
                            { color: theme.colors.textPrimary },
                            isDone && styles.taskTitleTextDone,
                          ]}
                          numberOfLines={2}
                        >
                          {task.title}
                        </Text>

                        {!!task.description && (
                          <Text
                            style={[
                              styles.taskDescriptionText,
                              isDone && styles.taskDescriptionTextDone,
                            ]}
                            numberOfLines={1}
                          >
                            {task.description}
                          </Text>
                        )}

                        <View style={styles.taskMetaRow}>
                          {hasTime && (
                            <View style={styles.timeBadgeRow}>
                              <Clock size={11} color="#6366F1" strokeWidth={2.2} />
                              <Text style={styles.taskTimeBadge}>{timeDisplay}</Text>
                            </View>
                          )}

                          {!!task.category && (
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{task.category}</Text>
                            </View>
                          )}

                          {isDone && (
                            <Text style={styles.completedTimestampText}>
                              Done {task.completedAt ? `• ${task.completedAt}` : ''}
                            </Text>
                          )}
                        </View>
                      </Pressable>

                      {/* If Completed: Quick Undo, Edit & Delete Buttons for mistake recovery & cleanup */}
                      {isDone ? (
                        <View style={styles.quickCompletedActions}>
                          <Pressable
                            onPress={() => toggleTask(taskId)}
                            style={({ pressed }) => [
                              styles.undoMiniBtn,
                              { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' },
                              isWeb && styles.webPointer,
                              pressed && styles.pressedOpacity,
                            ]}
                          >
                            <RotateCcw size={11} color="#4F46E5" strokeWidth={2.4} />
                            <Text style={styles.undoMiniText}>Undo</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => openEditModal(task)}
                            style={({ pressed }) => [
                              styles.editMiniBtn,
                              { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                              isWeb && styles.webPointer,
                              pressed && styles.pressedOpacity,
                            ]}
                          >
                            <Pencil size={11} color="#64748B" strokeWidth={2.2} />
                          </Pressable>

                          <Pressable
                            onPress={() => confirmDeleteTask(task)}
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.deleteMiniBtn,
                              { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2', borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FECACA' },
                              isWeb && styles.webPointer,
                              pressed && styles.pressedOpacity,
                            ]}
                          >
                            <Trash2 size={11} color="#EF4444" strokeWidth={2.4} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => {
                            setSelectedTask(task);
                            setOptionsModalVisible(true);
                          }}
                          hitSlop={10}
                          style={({ pressed }) => [
                            styles.threeDotBtn,
                            isWeb && styles.webPointer,
                            pressed && styles.pressedOpacity,
                          ]}
                        >
                          <MoreVertical size={16} color="#64748B" strokeWidth={2.2} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* ==================== 5. COMPLETED TASKS (Visible in All view when there are completed tasks) ==================== */}
          {activeFilter === 'All' && recentlyCompletedTasks.length > 0 && (
            <View style={styles.completedSection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionSubTitle}>COMPLETED LOG</Text>
                  <Text style={[styles.sectionMainTitle, { color: theme.colors.textPrimary }]}>Completed Tasks</Text>
                </View>
                <Pressable
                  onPress={handleClearAllCompleted}
                  style={({ pressed }) => [
                    styles.clearCompletedHeaderBtn,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Trash2 size={12} color="#EF4444" strokeWidth={2.2} />
                  <Text style={styles.clearCompletedHeaderText}>Clear All</Text>
                </Pressable>
              </View>

              <View style={styles.completedList}>
                {recentlyCompletedTasks.slice(0, 5).map((item) => {
                  const itemId = item._id || item.id;
                  return (
                    <View key={itemId} style={[styles.completedCard, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                      <View style={styles.completedCheckIconCircle}>
                        <Check size={12} color="#10B981" strokeWidth={3} />
                      </View>
                      <View style={styles.completedTextWrapper}>
                        <Text style={[styles.completedTaskTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
                        <Text style={styles.completedTimeText}>
                          {item.startTime || item.dueTime || 'Scheduled'} – {item.endTime || 'End'} {item.completedAt ? `• Completed at ${item.completedAt}` : ''}
                        </Text>
                      </View>

                      {/* Undo / Edit / Delete Buttons for Mistake recovery & Cleanup */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Pressable
                          onPress={() => toggleTask(itemId)}
                          style={({ pressed }) => [
                            styles.undoMiniBtn,
                            { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' },
                            isWeb && styles.webPointer,
                            pressed && styles.pressedOpacity,
                          ]}
                        >
                          <RotateCcw size={11} color="#4F46E5" strokeWidth={2.4} />
                          <Text style={styles.undoMiniText}>Undo</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => openEditModal(item)}
                          style={({ pressed }) => [
                            styles.editMiniBtn,
                            { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border },
                            isWeb && styles.webPointer,
                            pressed && styles.pressedOpacity,
                          ]}
                        >
                          <Pencil size={11} color="#64748B" strokeWidth={2.2} />
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDeleteTask(item)}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.deleteMiniBtn,
                            { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2', borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FECACA' },
                            isWeb && styles.webPointer,
                            pressed && styles.pressedOpacity,
                          ]}
                        >
                          <Trash2 size={11} color="#EF4444" strokeWidth={2.4} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Spacing for BottomNavigation */}
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabPress={handleTabChange} />

      {/* ==================== 6. CREATE TASK MODAL ==================== */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <View>
                <Text style={styles.modalKicker}>NEW TASK</Text>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Create New Task</Text>
              </View>
              <Pressable
                onPress={() => setCreateModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  { backgroundColor: theme.colors.cardAltBg },
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Task Title */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary }]}>
                  Task Title <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                    !!titleError && styles.modalInputError,
                    isWeb && styles.webOutlineNone,
                  ]}
                  placeholder="What needs to be done?"
                  placeholderTextColor="#94A3B8"
                  value={taskTitle}
                  onChangeText={(text) => {
                    setTaskTitle(text);
                    if (titleError) setTitleError('');
                  }}
                  autoFocus
                />
                {!!titleError && <Text style={styles.modalErrorText}>{titleError}</Text>}
              </View>

              {/* Description */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary }]}>Description (Optional)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    styles.modalTextArea,
                    { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                    isWeb && styles.webOutlineNone,
                  ]}
                  placeholder="Add details, notes, or specific checklist..."
                  placeholderTextColor="#94A3B8"
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Start Time with Clock Picker Trigger */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary }]}>Start Time (24h)</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={[
                      styles.modalInput,
                      styles.timeInputFlex,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                      isWeb && styles.webOutlineNone,
                    ]}
                    value={taskStartTime}
                    onChangeText={setTaskStartTime}
                    placeholder="e.g. 19:30 or 08:00"
                    placeholderTextColor="#94A3B8"
                  />
                  <Pressable
                    onPress={() => handleOpenTimePicker('start')}
                    style={({ pressed }) => [
                      styles.clockIconBtn,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Clock size={17} color="#4F46E5" strokeWidth={2.2} />
                  </Pressable>
                </View>
              </View>

              {/* End Time with Clock Picker Trigger */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary }]}>End Time (24h)</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={[
                      styles.modalInput,
                      styles.timeInputFlex,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                      isWeb && styles.webOutlineNone,
                    ]}
                    value={taskEndTime}
                    onChangeText={setTaskEndTime}
                    placeholder="e.g. 20:30 or 09:00"
                    placeholderTextColor="#94A3B8"
                  />
                  <Pressable
                    onPress={() => handleOpenTimePicker('end')}
                    style={({ pressed }) => [
                      styles.clockIconBtn,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Clock size={17} color="#4F46E5" strokeWidth={2.2} />
                  </Pressable>
                </View>
              </View>

              {/* Category Selector */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary }]}>Category</Text>
                <View style={styles.modalChipRow}>
                  {categoryOptions.map((c) => {
                    const isCatSelected = taskCategory === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setTaskCategory(c)}
                        style={[
                          styles.modalChip,
                          { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                          isCatSelected && styles.modalChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalChipText,
                            { color: theme.colors.textSecondary },
                            isCatSelected && styles.modalChipTextActive,
                          ]}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Task Start Reminder Notification Switch */}
              <View style={[styles.reminderRow, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary, marginBottom: 2 }]}>
                    Start Notification
                  </Text>
                  <Text style={[styles.reminderSubText, { color: theme.colors.textSecondary }]}>
                    Receive an alert when this task is scheduled to start
                  </Text>
                </View>
                <Switch
                  value={taskReminder}
                  onValueChange={setTaskReminder}
                  trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <Pressable
                  onPress={() => setCreateModalVisible(false)}
                  style={({ pressed }) => [
                    styles.modalCancelBtn,
                    { backgroundColor: theme.colors.cardAltBg },
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleCreateTask}
                  style={({ pressed }) => [
                    styles.modalSubmitBtn,
                    { backgroundColor: '#4F46E5' },
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.modalSubmitText}>Create Task</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== 7. TASK OPTIONS SHEET ==================== */}
      <Modal
        visible={optionsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <Pressable
          style={styles.optionsModalOverlay}
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={[styles.optionsSheet, { backgroundColor: theme.colors.cardBg }]}>
            <View style={styles.optionsHandle} />
            <Text style={[styles.optionsTaskTitle, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]} numberOfLines={1}>
              {selectedTask?.title}
            </Text>

            <View style={styles.optionsList}>
              <Pressable
                onPress={() => openEditModal(selectedTask)}
                style={({ pressed }) => [
                  styles.optionRow,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Pencil size={18} color="#4F46E5" strokeWidth={2.2} />
                <Text style={[styles.optionLabel, { color: theme.colors.textPrimary }]}>Edit Task</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setOptionsModalVisible(false);
                  if (selectedTask) toggleTask(selectedTask._id || selectedTask.id);
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <RotateCcw size={18} color="#4F46E5" strokeWidth={2.2} />
                <Text style={[styles.optionLabel, { color: theme.colors.textPrimary }]}>
                  {selectedTask?.done ? 'Mark as Pending' : 'Mark as Completed'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => confirmDeleteTask(selectedTask)}
                style={({ pressed }) => [
                  styles.optionRow,
                  styles.optionRowDestructive,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Trash2 size={18} color="#EF4444" strokeWidth={2.2} />
                <Text style={styles.optionLabelDestructive}>Delete Task</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setOptionsModalVisible(false)}
              style={({ pressed }) => [
                styles.optionsCancelBtn,
                { backgroundColor: theme.colors.cardAltBg },
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={[styles.optionsCancelText, { color: theme.colors.textSecondary }]}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ==================== 8. EDIT TASK MODAL ==================== */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <View>
                <Text style={styles.modalKicker}>MODIFY TASK</Text>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Edit Task Details</Text>
              </View>
              <Pressable
                onPress={() => setEditModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  { backgroundColor: theme.colors.cardAltBg },
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary }]}>Task Title *</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                    !!editTitleError && styles.modalInputError,
                    isWeb && styles.webOutlineNone,
                  ]}
                  value={editTaskTitle}
                  onChangeText={(text) => {
                    setEditTaskTitle(text);
                    if (editTitleError) setEditTitleError('');
                  }}
                  placeholder="e.g. Complete quarterly report"
                  placeholderTextColor="#94A3B8"
                />
                {!!editTitleError && <Text style={styles.modalErrorText}>{editTitleError}</Text>}
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary }]}>Description</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    styles.modalTextArea,
                    { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                    isWeb && styles.webOutlineNone,
                  ]}
                  value={editTaskDescription}
                  onChangeText={setEditTaskDescription}
                  placeholder="Task description / notes..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Start Time with Clock Picker */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary }]}>Start Time (24h)</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={[
                      styles.modalInput,
                      styles.timeInputFlex,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                      isWeb && styles.webOutlineNone,
                    ]}
                    value={editTaskStartTime}
                    onChangeText={setEditTaskStartTime}
                    placeholder="e.g. 19:30 or 08:00"
                    placeholderTextColor="#94A3B8"
                  />
                  <Pressable
                    onPress={() => handleOpenTimePicker('start', 'edit')}
                    style={({ pressed }) => [
                      styles.clockIconBtn,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Clock size={17} color="#4F46E5" strokeWidth={2.2} />
                  </Pressable>
                </View>
              </View>

              {/* End Time with Clock Picker */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary }]}>End Time (24h)</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={[
                      styles.modalInput,
                      styles.timeInputFlex,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                      isWeb && styles.webOutlineNone,
                    ]}
                    value={editTaskEndTime}
                    onChangeText={setEditTaskEndTime}
                    placeholder="e.g. 20:30 or 09:00"
                    placeholderTextColor="#94A3B8"
                  />
                  <Pressable
                    onPress={() => handleOpenTimePicker('end', 'edit')}
                    style={({ pressed }) => [
                      styles.clockIconBtn,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Clock size={17} color="#4F46E5" strokeWidth={2.2} />
                  </Pressable>
                </View>
              </View>

              {/* Category */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary }]}>Category</Text>
                <View style={styles.modalChipRow}>
                  {categoryOptions.map((c) => {
                    const isCatSelected = editTaskCategory === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setEditTaskCategory(c)}
                        style={[
                          styles.modalChip,
                          { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                          isCatSelected && styles.modalChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalChipText,
                            { color: theme.colors.textSecondary },
                            isCatSelected && styles.modalChipTextActive,
                          ]}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Reminder Switch */}
              <View style={[styles.reminderRow, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textPrimary, marginBottom: 2 }]}>
                    Start Notification
                  </Text>
                  <Text style={[styles.reminderSubText, { color: theme.colors.textSecondary }]}>
                    Receive an alert when this task starts
                  </Text>
                </View>
                <Switch
                  value={editTaskReminder}
                  onValueChange={setEditTaskReminder}
                  trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.modalActionsRow}>
                <Pressable
                  onPress={() => setEditModalVisible(false)}
                  style={({ pressed }) => [
                    styles.modalCancelBtn,
                    { backgroundColor: theme.colors.cardAltBg },
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveEditTask}
                  style={({ pressed }) => [
                    styles.modalSubmitBtn,
                    { backgroundColor: '#4F46E5' },
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.modalSubmitText}>Save Changes</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== 9. INTERACTIVE CLOCK / TIME PICKER MODAL (Rendered On Top) ==================== */}
      <Modal
        visible={timePickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { zIndex: 99999 }]}>
          <View style={[styles.timePickerModalCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border, zIndex: 100000, elevation: 20 }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <View>
                <Text style={styles.modalKicker}>24-HOUR CLOCK PICKER</Text>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                  {timePickerTarget === 'start' ? 'Select Start Time' : 'Select End Time'}
                </Text>
              </View>
              <Pressable
                onPress={() => setTimePickerModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: theme.colors.cardAltBg }]}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
              </Pressable>
            </View>

            {/* Digital 24-Hour Readout */}
            <View style={styles.clockDigitalDisplay}>
              <View style={styles.clockDigitsRow}>
                <Pressable
                  onPress={() => setPickerMode('hour')}
                  style={[
                    styles.clockDigitBox,
                    { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                    pickerMode === 'hour' && styles.clockDigitBoxActive,
                  ]}
                >
                  <Text style={[styles.clockDigitText, { color: theme.colors.textPrimary }, pickerMode === 'hour' && styles.clockDigitTextActive]}>
                    {String(pickerHour).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.clockDigitSub, { color: theme.colors.textMuted }, pickerMode === 'hour' && styles.clockDigitSubActive]}>
                    HOUR (24h)
                  </Text>
                </Pressable>

                <Text style={[styles.clockColon, { color: theme.colors.textPrimary }]}>:</Text>

                <Pressable
                  onPress={() => setPickerMode('minute')}
                  style={[
                    styles.clockDigitBox,
                    { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                    pickerMode === 'minute' && styles.clockDigitBoxActive,
                  ]}
                >
                  <Text style={[styles.clockDigitText, { color: theme.colors.textPrimary }, pickerMode === 'minute' && styles.clockDigitTextActive]}>
                    {String(pickerMinute).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.clockDigitSub, { color: theme.colors.textMuted }, pickerMode === 'minute' && styles.clockDigitSubActive]}>
                    MIN
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Mode Selector Tabs */}
            <View style={styles.clockModeTabsRow}>
              <Pressable
                onPress={() => setPickerMode('hour')}
                style={[styles.clockModeTab, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }, pickerMode === 'hour' && styles.clockModeTabActive]}
              >
                <Text style={[styles.clockModeTabText, { color: theme.colors.textSecondary }, pickerMode === 'hour' && styles.clockModeTabTextActive]}>
                  Hours (00 - 23)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPickerMode('minute')}
                style={[styles.clockModeTab, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }, pickerMode === 'minute' && styles.clockModeTabActive]}
              >
                <Text style={[styles.clockModeTabText, { color: theme.colors.textSecondary }, pickerMode === 'minute' && styles.clockModeTabTextActive]}>
                  Minutes (00 - 55)
                </Text>
              </Pressable>
            </View>

            {/* Clock Grid */}
            {pickerMode === 'hour' ? (
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 10.5, fontWeight: '700', color: theme.colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Morning & Daytime (00 - 11)
                </Text>
                <View style={styles.clockGrid}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hr) => {
                    const isSelected = pickerHour === hr;
                    return (
                      <Pressable
                        key={`hr-${hr}`}
                        onPress={() => {
                          setPickerHour(hr);
                          setPickerMode('minute');
                        }}
                        style={({ pressed }) => [
                          styles.clockCell,
                          { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                          isSelected && styles.clockCellSelected,
                          isWeb && styles.webPointer,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <Text style={[styles.clockCellText, { color: theme.colors.textPrimary }, isSelected && styles.clockCellTextSelected]}>
                          {String(hr).padStart(2, '0')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={{ fontSize: 10.5, fontWeight: '700', color: theme.colors.textMuted, marginTop: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Afternoon & Night (12 - 23)
                </Text>
                <View style={styles.clockGrid}>
                  {[12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((hr) => {
                    const isSelected = pickerHour === hr;
                    return (
                      <Pressable
                        key={`hr-${hr}`}
                        onPress={() => {
                          setPickerHour(hr);
                          setPickerMode('minute');
                        }}
                        style={({ pressed }) => [
                          styles.clockCell,
                          { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                          isSelected && styles.clockCellSelected,
                          isWeb && styles.webPointer,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <Text style={[styles.clockCellText, { color: theme.colors.textPrimary }, isSelected && styles.clockCellTextSelected]}>
                          {String(hr).padStart(2, '0')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            ) : (
              <View>
                <View style={styles.clockGrid}>
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => {
                    const isSelected = pickerMinute === min;
                    return (
                      <Pressable
                        key={`min-${min}`}
                        onPress={() => setPickerMinute(min)}
                        style={({ pressed }) => [
                          styles.clockCell,
                          { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                          isSelected && styles.clockCellSelected,
                          isWeb && styles.webPointer,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <Text style={[styles.clockCellText, { color: theme.colors.textPrimary }, isSelected && styles.clockCellTextSelected]}>
                          {String(min).padStart(2, '0')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Fine minute adjustment */}
                <View style={styles.minuteAdjustRow}>
                  <Pressable
                    onPress={() => setPickerMinute((prev) => (prev > 0 ? prev - 1 : 59))}
                    style={[styles.minuteAdjustBtn, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}
                  >
                    <Text style={[styles.minuteAdjustBtnText, { color: theme.colors.textPrimary }]}>-1 Min</Text>
                  </Pressable>
                  <Text style={[styles.minuteAdjustLabel, { color: theme.colors.textMuted }]}>
                    Exact: {String(pickerMinute).padStart(2, '0')}m
                  </Text>
                  <Pressable
                    onPress={() => setPickerMinute((prev) => (prev < 59 ? prev + 1 : 0))}
                    style={[styles.minuteAdjustBtn, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}
                  >
                    <Text style={[styles.minuteAdjustBtnText, { color: theme.colors.textPrimary }]}>+1 Min</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Quick Preset Time Chips */}
            <View style={styles.clockQuickPresetsRow}>
              {['08:00', '09:30', '12:00', '14:00', '17:30', '19:00', '20:00', '21:30'].map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => {
                    const parsed = parseTimeString(preset);
                    setPickerHour(parsed.hour);
                    setPickerMinute(parsed.minute);
                  }}
                  style={[styles.clockPresetChip, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}
                >
                  <Text style={[styles.clockPresetChipText, { color: theme.colors.textSecondary }]}>{preset}</Text>
                </Pressable>
              ))}
            </View>

            {/* Modal Actions */}
            <View style={styles.clockActionsRow}>
              <Pressable
                onPress={() => setTimePickerModalVisible(false)}
                style={[styles.modalCancelBtn, { backgroundColor: theme.colors.cardAltBg }]}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleApplyTimePicker}
                style={[styles.modalSubmitBtn, { backgroundColor: '#4F46E5' }]}
              >
                <Text style={styles.modalSubmitText}>Set Time</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== 10. NOTIFICATIONS MODAL ==================== */}
      <Modal
        visible={notificationsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.cardBg, maxHeight: 560, borderColor: theme.colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <View>
                <Text style={styles.modalKicker}>NOTIFICATIONS & REMINDERS</Text>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Activity Feed</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {unreadNotificationCount > 0 && (
                  <Pressable
                    onPress={handleMarkAllNotificationsRead}
                    style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                  >
                    <Text style={{ color: '#4F46E5', fontSize: 11.5, fontWeight: '700' }}>Mark all read</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => setNotificationsModalVisible(false)}
                  style={({ pressed }) => [
                    styles.modalCloseBtn,
                    { backgroundColor: theme.colors.cardAltBg },
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <X size={18} color="#94A3B8" strokeWidth={2.2} />
                </Pressable>
              </View>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Bell size={28} color="#94A3B8" strokeWidth={1.5} />
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 8 }}>
                    No notifications yet
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                    Task and schedule reminders will appear here.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8, paddingBottom: 16 }}>
                  {notifications.map((item) => {
                    const itemId = item._id || item.id;
                    return (
                      <Pressable
                        key={itemId}
                        onPress={() => !item.read && handleMarkNotificationRead(itemId)}
                        style={[
                          styles.notificationCard,
                          { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                          !item.read && { borderColor: '#818CF8', backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#F5F3FF' },
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={[styles.notificationTitle, { color: theme.colors.textPrimary }, !item.read && { fontWeight: '800', color: '#4F46E5' }]}>
                              {item.title}
                            </Text>
                            <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>
                              {item.message}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleDeleteNotification(itemId)}
                            style={{ padding: 4 }}
                          >
                            <X size={13} color="#94A3B8" strokeWidth={2.2} />
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  desktopOuterContainer: {
    flex: 1,
    backgroundColor: '#05070B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopShell: {
    width: '100%',
    maxWidth: 480,
    height: '100%',
    maxHeight: 920,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  scrollContentContainer: {
    paddingBottom: 90,
    backgroundColor: '#F8FAFC',
  },

  /* HEADER */
  headerHero: {
    backgroundColor: '#090D16',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerKicker: {
    color: '#818CF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12.5,
    marginTop: 2,
  },
  headerActionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  headerIconBtnActive: {
    backgroundColor: '#312E81',
    borderColor: '#6366F1',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  dateRow: {
    marginTop: 14,
    flexDirection: 'row',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  dateText: {
    color: '#E0E7FF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    padding: 0,
  },
  searchClearBtn: {
    padding: 2,
  },
  orbGreen: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(214, 239, 144, 0.08)',
  },
  orbBlue: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },

  /* SHEET CONTENT */
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#F8FAFC',
  },

  /* SUMMARY CARD */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryKicker: {
    color: '#6366F1',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  summaryTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  progressPercentBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressPercentText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  summaryFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCountText: {
    color: '#64748B',
    fontSize: 11.5,
  },
  summaryCountBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryMotivationalText: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },

  /* FILTERS */
  filtersScrollWrapper: {
    marginBottom: 14,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: '#64748B',
  },

  /* TASK LIST SECTION */
  taskListSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  sectionSubTitle: {
    color: '#6366F1',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  sectionMainTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  quickAddHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  quickAddHeaderText: {
    color: '#4F46E5',
    fontSize: 11.5,
    fontWeight: '800',
  },
  tasksListContainer: {
    gap: 8,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  taskCardCompleted: {
    backgroundColor: '#F8FAFC',
    opacity: 0.88,
  },
  checkboxContainer: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxContainerActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  taskBody: {
    flex: 1,
    paddingRight: 6,
  },
  taskTitleText: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '700',
  },
  taskTitleTextDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  taskDescriptionText: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 2,
  },
  taskDescriptionTextDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  timeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.09)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskTimeBadge: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '600',
  },
  completedTimestampText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '700',
  },
  threeDotBtn: {
    padding: 6,
  },
  quickCompletedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  undoMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  undoMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  editMiniBtn: {
    padding: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteMiniBtn: {
    padding: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearCompletedHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  clearCompletedHeaderText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },

  /* EMPTY STATE */
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyStateTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyStateDesc: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  emptyStateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emptyStateActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* COMPLETED SECTION */
  completedSection: {
    marginTop: 8,
  },
  completedList: {
    gap: 6,
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  completedCheckIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  completedTextWrapper: {
    flex: 1,
    paddingRight: 6,
  },
  completedTaskTitle: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  completedTimeText: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 1,
  },

  /* MODALS */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
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
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
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
  modalScroll: {
    maxHeight: 460,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  modalInputLabel: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
  },
  modalInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  modalErrorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  modalTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInputFlex: {
    flex: 1,
  },
  clockIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  modalChipText: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: '600',
  },
  modalChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    marginBottom: 16,
  },
  reminderSubText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 6,
    paddingBottom: 16,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* CLOCK & TIME PICKER MODAL STYLES */
  timePickerModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 'auto',
    marginTop: 'auto',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 380,
    alignSelf: 'center',
    width: '92%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clockDigitalDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  clockDigitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockDigitBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 58,
  },
  clockDigitBoxActive: {
    borderColor: '#4F46E5',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  clockDigitText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  clockDigitTextActive: {
    color: '#4F46E5',
  },
  clockDigitSub: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 1,
  },
  clockDigitSubActive: {
    color: '#4F46E5',
  },
  clockColon: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  clockAmPmContainer: {
    flexDirection: 'column',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  clockAmPmBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    alignItems: 'center',
  },
  clockAmPmBtnActive: {
    backgroundColor: '#4F46E5',
  },
  clockAmPmText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  clockAmPmTextActive: {
    color: '#FFFFFF',
  },
  clockModeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  clockModeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clockModeTabActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  clockModeTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  clockModeTabTextActive: {
    color: '#FFFFFF',
  },
  clockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 6,
    marginBottom: 8,
  },
  clockCell: {
    width: 44,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockCellSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  clockCellText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  clockCellTextSelected: {
    color: '#FFFFFF',
  },
  minuteAdjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  minuteAdjustBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  minuteAdjustBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  minuteAdjustLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  clockQuickPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  clockPresetChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clockPresetChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  clockActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },

  /* TASK OPTIONS SHEET */
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  optionsHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  optionsTaskTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionsList: {
    gap: 4,
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
  },
  optionRowDestructive: {
    backgroundColor: '#FEF2F2',
  },
  optionLabel: {
    color: '#1E293B',
    fontSize: 13.5,
    fontWeight: '600',
  },
  optionLabelDestructive: {
    color: '#DC2626',
    fontSize: 13.5,
    fontWeight: '700',
  },
  optionsCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  optionsCancelText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },

  /* NOTIFICATIONS CARD */
  notificationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },

  /* TOAST NOTICE */
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

  pressedOpacity: {
    opacity: 0.7,
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
