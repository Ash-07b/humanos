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
import BottomNavigation from '../../components/BottomNavigation';

export default function TasksScreen({ user, onLogout, onNavigateTab, navigation }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  // Active Tab for navigation
  const [activeTab, setActiveTab] = useState('tasks');

  // Search State
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Filters: 'All' | 'Today' | 'Upcoming' | 'Completed'
  const [activeFilter, setActiveFilter] = useState('Today');
  const [priorityFilter, setPriorityFilter] = useState(null); // null | 'High' | 'Medium' | 'Low'

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Notice feedback tooltip
  const [noticeMessage, setNoticeMessage] = useState('');

  // Form State for Task Creation & Editing
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('Today');
  const [taskDueTime, setTaskDueTime] = useState('10:00 AM');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskCategory, setTaskCategory] = useState('Work');
  const [taskReminder, setTaskReminder] = useState(true);
  const [titleError, setTitleError] = useState('');

  // Tasks state (dynamically bound to database user)
  const [tasks, setTasks] = useState(user?.tasks || []);

  // Sync state whenever user data changes from database
  React.useEffect(() => {
    if (user && user.tasks) {
      setTasks(user.tasks || []);
    }
  }, [user]);

  const showNotice = (msg) => {
    setNoticeMessage(msg);
    setTimeout(() => {
      setNoticeMessage('');
    }, 2800);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showNotice('Tasks synchronized');
    }, 600);
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

  // Toggle completion
  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nowDone = !t.done;
          const timeString = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          return {
            ...t,
            done: nowDone,
            completedAt: nowDone ? timeString : null,
          };
        }
        return t;
      })
    );
  };

  // Delete Task with Confirmation Alert
  const confirmDeleteTask = (task) => {
    setOptionsModalVisible(false);
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete Task?\n\nAre you sure you want to delete "${task.title}"?`)) {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        showNotice('Task deleted');
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
            onPress: () => {
              setTasks((prev) => prev.filter((t) => t.id !== task.id));
              showNotice('Task deleted');
            },
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
    setTaskDueDate('Today');
    setTaskDueTime('10:00 AM');
    setTaskPriority('Medium');
    setTaskCategory('Work');
    setTaskReminder(true);
    setTitleError('');
    setCreateModalVisible(true);
  };

  // Submit New Task
  const handleCreateTask = () => {
    if (!taskTitle.trim()) {
      setTitleError('Please enter a task title.');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      dueDate: taskDueDate,
      dueTime: taskDueTime,
      priority: taskPriority,
      category: taskCategory,
      done: false,
      reminder: taskReminder,
      completedAt: null,
    };
    setTasks((prev) => [newTask, ...prev]);
    setCreateModalVisible(false);
    showNotice('Task added successfully');
  };

  // Open Edit Modal
  const openEditModal = (task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskDueDate(task.dueDate || 'Today');
    setTaskDueTime(task.dueTime || '10:00 AM');
    setTaskPriority(task.priority || 'Medium');
    setTaskCategory(task.category || 'Work');
    setTaskReminder(task.reminder ?? true);
    setTitleError('');
    setOptionsModalVisible(false);
    setEditModalVisible(true);
  };

  // Save Edited Task
  const handleSaveEditTask = () => {
    if (!taskTitle.trim()) {
      setTitleError('Please enter a task title.');
      return;
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id
          ? {
              ...t,
              title: taskTitle.trim(),
              description: taskDescription.trim(),
              dueDate: taskDueDate,
              dueTime: taskDueTime,
              priority: taskPriority,
              category: taskCategory,
              reminder: taskReminder,
            }
          : t
      )
    );
    setEditModalVisible(false);
    showNotice('Task updated');
  };

  // Quick Reschedule
  const handleReschedule = (task, newDate) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, dueDate: newDate } : t))
    );
    setOptionsModalVisible(false);
    showNotice(`Rescheduled to ${newDate}`);
  };

  // Quick Priority Change
  const handleChangePriority = (task, newPriority) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, priority: newPriority } : t))
    );
    setOptionsModalVisible(false);
    showNotice(`Priority set to ${newPriority}`);
  };

  // Computed Progress Stats
  const todayTasks = tasks.filter((t) => t.dueDate === 'Today');
  const totalTodayCount = todayTasks.length;
  const completedTodayCount = todayTasks.filter((t) => t.done).length;
  const progressPercent =
    totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  // Priority Breakdown Counts (Uncompleted)
  const highPriorityCount = tasks.filter((t) => !t.done && t.priority === 'High').length;
  const mediumPriorityCount = tasks.filter((t) => !t.done && t.priority === 'Medium').length;
  const lowPriorityCount = tasks.filter((t) => !t.done && t.priority === 'Low').length;

  // Motivational message
  const getMotivationalMessage = () => {
    if (progressPercent === 100 && totalTodayCount > 0) {
      return "Phenomenal! All today's tasks completed.";
    }
    if (progressPercent >= 50) {
      return "You're making good progress. Keep going.";
    }
    if (progressPercent > 0) {
      return 'Great momentum starting your day.';
    }
    return 'Ready to take on your key priorities today?';
  };

  // Filtering Logic
  const getFilteredTasks = () => {
    let list = [...tasks];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q)
      );
    }

    // Priority filter (if selected)
    if (priorityFilter) {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // Tab filter
    if (activeFilter === 'Today') {
      list = list.filter((t) => t.dueDate === 'Today');
    } else if (activeFilter === 'Upcoming') {
      list = list.filter((t) => t.dueDate !== 'Today' && !t.done);
    } else if (activeFilter === 'Completed') {
      list = list.filter((t) => t.done);
    }

    return list;
  };

  const filteredTasks = getFilteredTasks();

  // Upcoming subset for secondary section (when in All or Today view)
  const upcomingTasks = tasks.filter((t) => t.dueDate !== 'Today' && !t.done);

  // Recently completed subset
  const recentlyCompletedTasks = tasks.filter((t) => t.done);

  const filterOptions = ['All', 'Today', 'Upcoming', 'Completed'];
  const priorityOptions = ['High', 'Medium', 'Low'];
  const categoryOptions = ['Work', 'Personal', 'Health', 'Study', 'Finance', 'Other'];
  const dateOptions = ['Today', 'Tomorrow', 'Friday', 'Next Week'];
  const timeOptions = ['09:00 AM', '10:00 AM', '12:30 PM', '03:00 PM', '05:00 PM', '07:00 PM'];

  const appContent = (
    <View style={styles.mainWrapper}>
      {/* Toast Notice */}
      {!!noticeMessage && (
        <View style={styles.noticeToast}>
          <Text style={styles.noticeText}>✓ {noticeMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
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
              <Text style={styles.headerSubtitle}>Stay focused on what matters today.</Text>
            </View>

            <View style={styles.headerActionRow}>
              <Pressable
                onPress={() => {
                  setSearchVisible(!searchVisible);
                  if (searchVisible) setSearchQuery('');
                }}
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  searchVisible && styles.headerIconBtnActive,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.headerIconText}>{searchVisible ? '✕' : '🔍'}</Text>
              </Pressable>

              <Pressable
                onPress={() => showNotice('Notifications are synced')}
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.headerIconText}>🔔</Text>
                <View style={styles.notificationDot} />
              </Pressable>
            </View>
          </View>

          {/* Dynamic Date display */}
          <View style={styles.dateRow}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>{getFormattedDate()}</Text>
            </View>
          </View>

          {/* Inline Search Bar (Toggled) */}
          {searchVisible && (
            <View style={styles.searchBarContainer}>
              <Text style={styles.searchInnerIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, isWeb && styles.webOutlineNone]}
                placeholder="Search tasks by title or category..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {!!searchQuery && (
                <Pressable onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
                  <Text style={styles.searchClearText}>✕</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Glowing Ambient Accent Orbs */}
          <View style={styles.orbGreen} />
          <View style={styles.orbBlue} />
        </View>

        {/* ==================== MAIN CONTENT SHEET ==================== */}
        <View style={styles.sheetContent}>
          {/* ==================== 2. DAILY TASK SUMMARY ==================== */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.summaryKicker}>DAILY DISCIPLINE</Text>
                <Text style={styles.summaryTitle}>Today's Progress</Text>
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
              <Text style={styles.summaryCountText}>
                <Text style={styles.summaryCountBold}>{completedTodayCount}</Text> of{' '}
                <Text style={styles.summaryCountBold}>{totalTodayCount}</Text> tasks completed
              </Text>
              <Text style={styles.summaryMotivationalText}>{getMotivationalMessage()}</Text>
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
                      isSelected ? styles.filterPillActive : styles.filterPillInactive,
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        isSelected ? styles.filterPillTextActive : styles.filterPillTextInactive,
                      ]}
                    >
                      {filter}
                    </Text>
                    {filter === 'Today' && (
                      <View
                        style={[
                          styles.pillBadge,
                          isSelected ? styles.pillBadgeActive : styles.pillBadgeInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillBadgeText,
                            isSelected ? styles.pillBadgeTextActive : styles.pillBadgeTextInactive,
                          ]}
                        >
                          {totalTodayCount}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ==================== 4. PRIORITY SUMMARY ==================== */}
          <View style={styles.prioritySection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionSubTitle}>PRIORITY BREAKDOWN</Text>
              {priorityFilter && (
                <Pressable
                  onPress={() => setPriorityFilter(null)}
                  style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
                >
                  <Text style={styles.clearFilterText}>Clear priority filter ✕</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.priorityGrid}>
              <Pressable
                onPress={() => setPriorityFilter(priorityFilter === 'High' ? null : 'High')}
                style={({ pressed }) => [
                  styles.priorityCard,
                  priorityFilter === 'High' && styles.priorityCardActive,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <View style={styles.priorityCardLeft}>
                  <View style={[styles.priorityIndicatorDot, styles.dotHigh]} />
                  <Text style={styles.priorityLabel}>High Priority</Text>
                </View>
                <Text style={[styles.priorityCount, styles.countHigh]}>{highPriorityCount}</Text>
              </Pressable>

              <Pressable
                onPress={() => setPriorityFilter(priorityFilter === 'Medium' ? null : 'Medium')}
                style={({ pressed }) => [
                  styles.priorityCard,
                  priorityFilter === 'Medium' && styles.priorityCardActive,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <View style={styles.priorityCardLeft}>
                  <View style={[styles.priorityIndicatorDot, styles.dotMedium]} />
                  <Text style={styles.priorityLabel}>Medium</Text>
                </View>
                <Text style={[styles.priorityCount, styles.countMedium]}>{mediumPriorityCount}</Text>
              </Pressable>

              <Pressable
                onPress={() => setPriorityFilter(priorityFilter === 'Low' ? null : 'Low')}
                style={({ pressed }) => [
                  styles.priorityCard,
                  priorityFilter === 'Low' && styles.priorityCardActive,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <View style={styles.priorityCardLeft}>
                  <View style={[styles.priorityIndicatorDot, styles.dotLow]} />
                  <Text style={styles.priorityLabel}>Low</Text>
                </View>
                <Text style={[styles.priorityCount, styles.countLow]}>{lowPriorityCount}</Text>
              </Pressable>
            </View>
          </View>

          {/* ==================== 5. TASK LIST ==================== */}
          <View style={styles.taskListSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionSubTitle}>ACTIVE QUEUE</Text>
                <Text style={styles.sectionMainTitle}>
                  {activeFilter === 'Today'
                    ? "Today's Tasks"
                    : activeFilter === 'Upcoming'
                    ? 'Upcoming Tasks'
                    : activeFilter === 'Completed'
                    ? 'Completed Tasks'
                    : 'All Tasks'}
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
                <Text style={styles.quickAddHeaderText}>+ Add Task</Text>
              </Pressable>
            </View>

            {/* Empty State */}
            {filteredTasks.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <View style={styles.emptyStateIconCircle}>
                  <Text style={styles.emptyStateIcon}>✨</Text>
                </View>
                <Text style={styles.emptyStateTitle}>No tasks here</Text>
                <Text style={styles.emptyStateDesc}>You're all caught up.</Text>
                <Pressable
                  onPress={openCreateModal}
                  style={({ pressed }) => [
                    styles.emptyStateActionBtn,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.emptyStateActionText}>+ Add Task</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.tasksListContainer}>
                {filteredTasks.map((task) => {
                  const isHigh = task.priority === 'High';
                  const isMed = task.priority === 'Medium';
                  return (
                    <View
                      key={task.id}
                      style={[styles.taskCard, task.done && styles.taskCardCompleted]}
                    >
                      {/* Checkbox (Functional) */}
                      <Pressable
                        onPress={() => toggleTask(task.id)}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.checkboxContainer,
                          task.done && styles.checkboxContainerActive,
                          isWeb && styles.webPointer,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        {task.done && <Text style={styles.checkboxCheckmark}>✓</Text>}
                      </Pressable>

                      {/* Main Task Content */}
                      <Pressable
                        onPress={() => toggleTask(task.id)}
                        style={({ pressed }) => [
                          styles.taskBody,
                          isWeb && styles.webPointer,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <Text
                          style={[styles.taskTitleText, task.done && styles.taskTitleTextDone]}
                          numberOfLines={2}
                        >
                          {task.title}
                        </Text>

                        {!!task.description && (
                          <Text
                            style={[
                              styles.taskDescriptionText,
                              task.done && styles.taskDescriptionTextDone,
                            ]}
                            numberOfLines={1}
                          >
                            {task.description}
                          </Text>
                        )}

                        <View style={styles.taskMetaRow}>
                          <Text style={styles.taskTimeBadge}>⏱ {task.dueTime}</Text>

                          <View
                            style={[
                              styles.priorityBadge,
                              isHigh
                                ? styles.badgeHigh
                                : isMed
                                ? styles.badgeMedium
                                : styles.badgeLow,
                            ]}
                          >
                            <Text
                              style={[
                                styles.priorityBadgeText,
                                isHigh
                                ? styles.badgeTextHigh
                                : isMed
                                ? styles.badgeTextMedium
                                : styles.badgeTextLow,
                              ]}
                            >
                              {task.priority}
                            </Text>
                          </View>

                          {!!task.category && (
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{task.category}</Text>
                            </View>
                          )}

                          {task.dueDate !== 'Today' && (
                            <View style={styles.dueDateBadge}>
                              <Text style={styles.dueDateBadgeText}>📅 {task.dueDate}</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>

                      {/* Three-Dot Options Button */}
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
                        <Text style={styles.threeDotText}>⋮</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* ==================== 9. UPCOMING TASKS (Visible in Today/All View) ==================== */}
          {(activeFilter === 'Today' || activeFilter === 'All') && upcomingTasks.length > 0 && (
            <View style={styles.upcomingSection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionSubTitle}>FORWARD PLANNING</Text>
                  <Text style={styles.sectionMainTitle}>Upcoming</Text>
                </View>
              </View>

              <View style={styles.upcomingList}>
                {upcomingTasks.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.upcomingCard}>
                    <View style={styles.upcomingDateColumn}>
                      <Text style={styles.upcomingDateLabel}>{item.dueDate}</Text>
                      <Text style={styles.upcomingTimeLabel}>{item.dueTime}</Text>
                    </View>

                    <View style={styles.upcomingContentColumn}>
                      <Text style={styles.upcomingTaskTitle}>{item.title}</Text>
                      <View style={styles.upcomingMetaRow}>
                        <Text style={styles.upcomingCategoryText}>{item.category || 'Task'}</Text>
                        <Text style={styles.upcomingDot}>•</Text>
                        <Text
                          style={[
                            styles.upcomingPriorityText,
                            item.priority === 'High' ? styles.badgeTextHigh : styles.badgeTextMedium,
                          ]}
                        >
                          {item.priority} Priority
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => toggleTask(item.id)}
                      style={({ pressed }) => [
                        styles.upcomingCheckBtn,
                        isWeb && styles.webPointer,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <Text style={styles.upcomingCheckText}>✓</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ==================== 10. RECENTLY COMPLETED ==================== */}
          {(activeFilter === 'Today' || activeFilter === 'All') && recentlyCompletedTasks.length > 0 && (
            <View style={styles.completedSection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionSubTitle}>ACCOMPLISHED</Text>
                  <Text style={styles.sectionMainTitle}>Recently Completed</Text>
                </View>
              </View>

              <View style={styles.completedList}>
                {recentlyCompletedTasks.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.completedCard}>
                    <View style={styles.completedCheckIconCircle}>
                      <Text style={styles.completedCheckMark}>✓</Text>
                    </View>
                    <View style={styles.completedTextWrapper}>
                      <Text style={styles.completedTaskTitle}>{item.title}</Text>
                      <Text style={styles.completedTimeText}>
                        Completed {item.completedAt ? `at ${item.completedAt}` : 'today'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Extra spacing for BottomNavigation */}
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* ==================== 7. FLOATING ACTION BUTTON ==================== */}
      <Pressable
        onPress={openCreateModal}
        style={({ pressed }) => [
          styles.fabButton,
          isWeb && styles.webPointer,
          pressed && styles.fabPressed,
        ]}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabLabel}>Add Task</Text>
      </Pressable>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabPress={handleTabChange} />

      {/* ==================== 8. CREATE TASK MODAL ==================== */}
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
                <Text style={styles.modalKicker}>NEW ITEM</Text>
                <Text style={styles.modalTitle}>Create New Task</Text>
              </View>
              <Pressable
                onPress={() => setCreateModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Task Title */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>
                  Task Title <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    !!titleError && styles.modalInputError,
                    isWeb && styles.webOutlineNone,
                  ]}
                  placeholder="Enter task title..."
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
                <Text style={styles.modalInputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea, isWeb && styles.webOutlineNone]}
                  placeholder="Add notes, deliverables or links..."
                  placeholderTextColor="#94A3B8"
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Due Date Selector */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Due Date</Text>
                <View style={styles.modalChipRow}>
                  {dateOptions.map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setTaskDueDate(d)}
                      style={[styles.modalChip, taskDueDate === d && styles.modalChipActive]}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          taskDueDate === d && styles.modalChipTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Due Time Selector */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Due Time</Text>
                <View style={styles.modalChipRow}>
                  {timeOptions.map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setTaskDueTime(t)}
                      style={[styles.modalChip, taskDueTime === t && styles.modalChipActive]}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          taskDueTime === t && styles.modalChipTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Priority Selector */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Priority</Text>
                <View style={styles.prioritySelectorRow}>
                  {priorityOptions.map((p) => {
                    const isSelected = taskPriority === p;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => setTaskPriority(p)}
                        style={[
                          styles.prioritySelectBtn,
                          isSelected && styles.prioritySelectBtnActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.prioritySelectDot,
                            p === 'High'
                              ? styles.dotHigh
                              : p === 'Medium'
                              ? styles.dotMedium
                              : styles.dotLow,
                          ]}
                        />
                        <Text
                          style={[
                            styles.prioritySelectText,
                            isSelected && styles.prioritySelectTextActive,
                          ]}
                        >
                          {p}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Category Selector */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Category</Text>
                <View style={styles.modalChipRow}>
                  {categoryOptions.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setTaskCategory(c)}
                      style={[styles.modalChip, taskCategory === c && styles.modalChipActive]}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          taskCategory === c && styles.modalChipTextActive,
                        ]}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Reminder Switch */}
              <View style={styles.reminderRow}>
                <View>
                  <Text style={styles.modalInputLabel}>Reminder Notification</Text>
                  <Text style={styles.reminderSubText}>Alert before task due time</Text>
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
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleCreateTask}
                  style={({ pressed }) => [
                    styles.modalSubmitBtn,
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

      {/* ==================== 12. TASK OPTIONS SHEET ==================== */}
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
          <View style={styles.optionsSheet}>
            <View style={styles.optionsHandle} />
            <Text style={styles.optionsTaskTitle} numberOfLines={1}>
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
                <Text style={styles.optionIcon}>✏️</Text>
                <Text style={styles.optionLabel}>Edit Task</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  handleChangePriority(
                    selectedTask,
                    selectedTask?.priority === 'High'
                      ? 'Medium'
                      : selectedTask?.priority === 'Medium'
                      ? 'Low'
                      : 'High'
                  )
                }
                style={({ pressed }) => [
                  styles.optionRow,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.optionIcon}>⚡</Text>
                <Text style={styles.optionLabel}>
                  Change Priority (Current: {selectedTask?.priority})
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  handleReschedule(
                    selectedTask,
                    selectedTask?.dueDate === 'Today' ? 'Tomorrow' : 'Today'
                  )
                }
                style={({ pressed }) => [
                  styles.optionRow,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.optionIcon}>📅</Text>
                <Text style={styles.optionLabel}>
                  Reschedule (To {selectedTask?.dueDate === 'Today' ? 'Tomorrow' : 'Today'})
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
                <Text style={styles.optionIcon}>🗑️</Text>
                <Text style={styles.optionLabelDestructive}>Delete Task</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setOptionsModalVisible(false)}
              style={({ pressed }) => [
                styles.optionsCancelBtn,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={styles.optionsCancelText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ==================== EDIT TASK MODAL ==================== */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>MODIFY TASK</Text>
                <Text style={styles.modalTitle}>Edit Task Details</Text>
              </View>
              <Pressable
                onPress={() => setEditModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Task Title</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    !!titleError && styles.modalInputError,
                    isWeb && styles.webOutlineNone,
                  ]}
                  value={taskTitle}
                  onChangeText={(text) => {
                    setTaskTitle(text);
                    if (titleError) setTitleError('');
                  }}
                />
                {!!titleError && <Text style={styles.modalErrorText}>{titleError}</Text>}
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea, isWeb && styles.webOutlineNone]}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Due Date</Text>
                <View style={styles.modalChipRow}>
                  {dateOptions.map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setTaskDueDate(d)}
                      style={[styles.modalChip, taskDueDate === d && styles.modalChipActive]}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          taskDueDate === d && styles.modalChipTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Priority</Text>
                <View style={styles.prioritySelectorRow}>
                  {priorityOptions.map((p) => {
                    const isSelected = taskPriority === p;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => setTaskPriority(p)}
                        style={[
                          styles.prioritySelectBtn,
                          isSelected && styles.prioritySelectBtnActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.prioritySelectDot,
                            p === 'High'
                              ? styles.dotHigh
                              : p === 'Medium'
                              ? styles.dotMedium
                              : styles.dotLow,
                          ]}
                        />
                        <Text
                          style={[
                            styles.prioritySelectText,
                            isSelected && styles.prioritySelectTextActive,
                          ]}
                        >
                          {p}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalActionsRow}>
                <Pressable
                  onPress={() => setEditModalVisible(false)}
                  style={({ pressed }) => [
                    styles.modalCancelBtn,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveEditTask}
                  style={({ pressed }) => [
                    styles.modalSubmitBtn,
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
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    position: 'relative',
  },
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
    borderColor: 'rgba(16, 185, 129, 0.25)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 12,
    backgroundColor: '#0A0E1A',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  scrollContentContainer: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    paddingBottom: 24,
  },

  /* 1. HEADER HERO */
  headerHero: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
    overflow: 'hidden',
    position: 'relative',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  headerIconBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
    borderColor: '#818CF8',
  },
  headerIconText: {
    fontSize: 16,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },

  dateRow: {
    marginTop: 18,
    zIndex: 2,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    gap: 6,
  },
  dateIcon: {
    fontSize: 13,
  },
  dateText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#818CF8',
    zIndex: 2,
    height: 44,
  },
  searchInnerIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13.5,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },

  orbGreen: {
    backgroundColor: '#4338CA',
    borderRadius: 160,
    height: 220,
    opacity: 0.35,
    position: 'absolute',
    right: -80,
    top: -20,
    width: 220,
  },
  orbBlue: {
    backgroundColor: '#0284C7',
    borderRadius: 50,
    bottom: 10,
    height: 20,
    opacity: 0.6,
    position: 'absolute',
    right: 60,
    width: 20,
  },

  /* MAIN SHEET */
  sheetContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  /* 2. DAILY TASK SUMMARY CARD */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  progressPercentBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  progressPercentText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '800',
  },

  progressBarTrack: {
    height: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
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
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryCountText: {
    color: '#475569',
    fontSize: 12.5,
  },
  summaryCountBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryMotivationalText: {
    color: '#4F46E5',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* 3. TASK FILTERS */
  filtersScrollWrapper: {
    marginBottom: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.5)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#F8FAFC',
  },
  filterPillTextInactive: {
    color: '#475569',
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pillBadgeActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  pillBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pillBadgeTextActive: {
    color: '#A5B4FC',
  },
  pillBadgeTextInactive: {
    color: '#64748B',
  },

  /* 4. PRIORITY SECTION */
  prioritySection: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionSubTitle: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionMainTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  clearFilterText: {
    color: '#4F46E5',
    fontSize: 11.5,
    fontWeight: '700',
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  priorityCardActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  priorityCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  priorityIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotHigh: { backgroundColor: '#EF4444' },
  dotMedium: { backgroundColor: '#F59E0B' },
  dotLow: { backgroundColor: '#6366F1' },
  priorityLabel: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  priorityCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  countHigh: { color: '#DC2626' },
  countMedium: { color: '#D97706' },
  countLow: { color: '#4F46E5' },

  /* 5. TASK LIST */
  taskListSection: {
    marginBottom: 20,
  },
  quickAddHeaderBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickAddHeaderText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
  },
  tasksListContainer: {
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  taskCardCompleted: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.8,
  },

  checkboxContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxContainerActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  taskBody: {
    flex: 1,
  },
  taskTitleText: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  taskTitleTextDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  taskDescriptionText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  taskDescriptionTextDone: {
    color: '#CBD5E1',
    textDecorationLine: 'line-through',
  },

  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  taskTimeBadge: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },

  priorityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeHigh: { backgroundColor: '#FEE2E2' },
  badgeMedium: { backgroundColor: '#FEF3C7' },
  badgeLow: { backgroundColor: '#EEF2FF' },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextHigh: { color: '#B91C1C' },
  badgeTextMedium: { color: '#B45309' },
  badgeTextLow: { color: '#4F46E5' },

  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },

  dueDateBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dueDateBadgeText: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '700',
  },

  threeDotBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  threeDotText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '800',
  },

  /* 9. UPCOMING SECTION */
  upcomingSection: {
    marginBottom: 20,
  },
  upcomingList: {
    gap: 8,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  upcomingDateColumn: {
    minWidth: 72,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: 8,
    marginRight: 10,
  },
  upcomingDateLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  upcomingTimeLabel: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  upcomingContentColumn: {
    flex: 1,
  },
  upcomingTaskTitle: {
    color: '#1E293B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  upcomingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  upcomingCategoryText: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '600',
  },
  upcomingDot: {
    color: '#CBD5E1',
    fontSize: 10,
  },
  upcomingPriorityText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  upcomingCheckBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  upcomingCheckText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },

  /* 10. COMPLETED SECTION */
  completedSection: {
    marginBottom: 16,
  },
  completedList: {
    gap: 8,
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  completedCheckIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#818CF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  completedCheckMark: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
  },
  completedTextWrapper: {
    flex: 1,
  },
  completedTaskTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  completedTimeText: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 1,
  },

  /* 11. EMPTY STATE */
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  emptyStateIcon: {
    fontSize: 24,
  },
  emptyStateTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  emptyStateDesc: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  emptyStateActionBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateActionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* 7. FLOATING ACTION BUTTON */
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 84,
    backgroundColor: '#4F46E5', // HumanOS signature primary indigo
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    gap: 6,
    zIndex: 99,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: -1,
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* MODALS */
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
    maxHeight: 480,
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
    fontSize: 14,
    color: '#0F172A',
  },
  modalInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  modalTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalErrorText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 4,
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
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  modalChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  modalChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  prioritySelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prioritySelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  prioritySelectBtnActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  prioritySelectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  prioritySelectText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  prioritySelectTextActive: {
    color: '#4F46E5',
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
    marginBottom: 20,
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
    paddingBottom: 16,
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

  /* 12. TASK OPTIONS BOTTOM SHEET */
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
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
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
  optionIcon: {
    fontSize: 16,
  },
  optionLabel: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  optionLabelDestructive: {
    color: '#DC2626',
    fontSize: 14,
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
    fontSize: 13.5,
    fontWeight: '700',
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
