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
  useWindowDimensions,
  Image,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Target,
  Flame,
  Zap,
  Sparkles,
  BatteryCharging,
  Brain,
  ListTodo,
  Repeat,
  FileText,
  CalendarDays,
  ArrowRight,
  Plus,
  X,
  Check,
  UserRound,
} from 'lucide-react-native';
import BottomNavigation from '../../components/BottomNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchAiGeneralAssistant, fetchUserProfile } from '../../services/api';
import { getToken, saveUser } from '../../services/storage';
import Logo from '../../components/Logo';

export default function DashboardScreen({ user, onLogout, onNavigateTab, onUpdateUser }) {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const { theme, isDarkMode } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMood, setSelectedMood] = useState('High Focus');
  const [newTaskText, setNewTaskText] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  // Live AI Executive Briefing State
  const [aiBriefingText, setAiBriefingText] = useState(
    'Prioritize clearing your high-leverage intentions before noon. Maintain structured recovery intervals between deep work blocks.'
  );
  const [aiBriefingLoading, setAiBriefingLoading] = useState(false);

  // Safe user fallbacks for personal assistant profile
  const displayName =
    user?.fullName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'User');
  const userAvatar = user?.profilePic || user?.profilePicture || user?.avatar || null;
  const userEmail = user?.email || '';

  const isCustomImage = (val) => {
    return (
      typeof val === 'string' &&
      (val.startsWith('http://') ||
        val.startsWith('https://') ||
        val.startsWith('data:') ||
        val.startsWith('file:') ||
        val.startsWith('blob:') ||
        val.startsWith('ph://') ||
        val.startsWith('content://') ||
        val.includes('localhost:'))
    );
  };

  // Tasks & habits state (dynamically bound to database user)
  const [tasks, setTasks] = useState(user?.tasks || user?.intentions || []);
  const [habits, setHabits] = useState(user?.habits || []);

  // Sync state whenever user data changes from database
  React.useEffect(() => {
    if (user) {
      if (user.tasks || user.intentions) {
        setTasks(user.tasks || user.intentions || []);
      }
      if (user.habits) {
        setHabits(user.habits || []);
      }
    }
  }, [user]);

  const moodOptions = [
    { label: 'High Focus', icon: Zap },
    { label: 'Execution', icon: Target },
    { label: 'Clarity', icon: Sparkles },
    { label: 'Recharge', icon: BatteryCharging },
    { label: 'Analytical', icon: Brain },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const token = await getToken();
      if (token) {
        const res = await fetchUserProfile(token);
        if (res && res.success && res.user) {
          const updated = {
            ...(user || {}),
            ...res.user,
            profilePic: res.user.profilePicture || res.user.profilePic || (user && (user.profilePic || user.profilePicture)) || '⚡',
            profilePicture: res.user.profilePicture || res.user.profilePic,
          };
          await saveUser(updated);
          if (onUpdateUser) {
            onUpdateUser(updated);
          }
        }
      }
    } catch (e) {
      console.log('Error refreshing user profile:', e);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 400);
    }
  };

  const handleRefreshAiBriefing = async () => {
    setAiBriefingLoading(true);
    try {
      const token = await getToken();
      const payload = {
        prompt: `Give a 2-sentence morning executive productivity briefing for user ${displayName}. Current focus: ${selectedMood}. Tasks pending: ${tasks.filter(t => !t.done).length}.`,
        module: 'Dashboard',
        context: {
          mood: selectedMood,
          pendingTasks: tasks.filter(t => !t.done).map(t => t.text || t.title),
          habitsCount: habits.length,
        }
      };
      const res = await fetchAiGeneralAssistant(payload, token);
      if (res && res.success && res.reply) {
        setAiBriefingText(res.reply);
      }
    } catch (e) {
      console.log('AI Briefing fallback:', e.message);
    } finally {
      setAiBriefingLoading(false);
    }
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const toggleHabit = (id) => {
    setHabits((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              completedToday: !item.completedToday,
              streak: !item.completedToday ? item.streak + 1 : Math.max(0, item.streak - 1),
            }
          : item
      )
    );
  };

  const handleAddNewTask = () => {
    if (!newTaskText.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      title: newTaskText.trim(),
      category: 'Task',
      done: false,
      time: 'Today',
    };
    setTasks((prev) => [newItem, ...prev]);
    setNewTaskText('');
    setShowAddTask(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onNavigateTab) {
      onNavigateTab(tabId);
    }
  };

  // Compute live progress stats safely
  const completedTasksCount = tasks.filter((i) => i.done).length;
  const totalTasksCount = tasks.length;
  const taskProgressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const completedHabitsCount = habits.filter((h) => h.completedToday).length;

  const appContent = (
    <View style={[styles.mainWrapper, { backgroundColor: theme.colors.pageBg }]}>
      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: theme.colors.appBg }]}
        contentContainerStyle={[styles.scrollContentContainer, { backgroundColor: theme.colors.pageBg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#4F46E5']}
          />
        }
      >
        {/* Top Hero Section: Executive Command Center with Background Image */}
        <ImageBackground
          source={require('../../assets/header-bg.jpg')}
          style={styles.heroSection}
          imageStyle={styles.heroBackgroundImage}
          resizeMode="cover"
        >
          {/* Subtle Ambient Overlay for optimal contrast & depth */}
          <View style={styles.heroOverlay} />

          {/* Top Brand Bar */}
          <View style={styles.topBrandBar}>
            <Logo size={24} textSize={15} textColor="#E0E7FF" />
            <View style={styles.liveSystemPill}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveSystemText}>System Active</Text>
            </View>
          </View>

          {/* Header Row */}
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => onNavigateTab && onNavigateTab('profile')}
              style={({ pressed }) => [
                styles.userProfileInfo,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={styles.avatarCircle}>
                {isCustomImage(userAvatar) ? (
                  <Image source={{ uri: userAvatar }} style={styles.avatarCustomImg} resizeMode="cover" />
                ) : userAvatar && typeof userAvatar === 'string' && userAvatar.trim().length > 0 ? (
                  <Text style={styles.avatarText}>{userAvatar}</Text>
                ) : (
                  <UserRound size={22} color="#818CF8" strokeWidth={2} />
                )}
              </View>
              <View>
                <Text style={styles.greetingKicker}>ASSISTANT COMMAND CENTER</Text>
                <Text style={styles.greetingName}>{displayName}</Text>
              </View>
            </Pressable>

            <View style={styles.headerActionRow}>
              {onLogout && (
                <Pressable
                  onPress={onLogout}
                  style={({ pressed }) => [
                    styles.logoutButton,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.logoutText}>Sign Out</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Today's Overview Banner */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View style={styles.badgePulse}>
                <View style={styles.pulseDot} />
                <Text style={styles.badgeText}>OPERATING STATUS</Text>
              </View>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <Text style={styles.overviewTitle}>
              {completedTasksCount === totalTasksCount && totalTasksCount > 0
                ? 'All mission priorities cleared. Peak operational state.'
                : `${totalTasksCount - completedTasksCount} priority actions scheduled for today`}
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.max(8, taskProgressPercent)}%` }]} />
            </View>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressStatText}>
                {completedTasksCount} of {totalTasksCount} targets accomplished
              </Text>
              <Text style={styles.progressPercentageText}>{taskProgressPercent}%</Text>
            </View>
          </View>

          {/* Glowing Orbs */}
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
        </ImageBackground>

        {/* Main Content Body */}
        <View style={[styles.contentBody, { backgroundColor: theme.colors.pageBg }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.handle }]} />

          {/* Metrics Quick Strip */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
              <View style={styles.metricIconWrap}>
                <Target size={18} color="#4F46E5" strokeWidth={2.2} />
              </View>
              <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>{taskProgressPercent}%</Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Daily Execution</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
              <View style={[styles.metricIconWrap, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                <Flame size={18} color="#D97706" strokeWidth={2.2} />
              </View>
              <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>{completedHabitsCount}/{habits.length}</Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Habit Loops</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
              <View style={[styles.metricIconWrap, { backgroundColor: isDarkMode ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE' }]}>
                <Zap size={18} color="#0284C7" strokeWidth={2.2} />
              </View>
              <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>Level 1</Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Mastery Level</Text>
            </View>
          </View>

          {/* Executive AI Briefing Card */}
          <View style={[styles.aiBriefingCard, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#F5F3FF', borderColor: theme.colors.border }]}>
            <View style={styles.aiBriefingHeader}>
              <View style={styles.aiBriefingBadge}>
                <Sparkles size={13} color="#6366F1" strokeWidth={2.2} />
                <Text style={styles.aiBriefingBadgeText}>AI EXECUTIVE BRIEFING</Text>
              </View>
              <Pressable
                onPress={handleRefreshAiBriefing}
                disabled={aiBriefingLoading}
                style={({ pressed }) => [
                  styles.aiBriefingBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={[styles.aiBriefingBtnText, { color: isDarkMode ? '#A5B4FC' : '#4F46E5' }]}>
                  {aiBriefingLoading ? 'Synthesizing...' : '✦ Refresh'}
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.aiBriefingBody, { color: theme.colors.textPrimary }]}>
              "{aiBriefingText}"
            </Text>
          </View>

          {/* State of Mind & Focus Mode */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionSub}>ENERGY & FOCUS MODE</Text>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Current Operating State</Text>
              </View>
              <View style={styles.currentMoodBadge}>
                {(() => {
                  const currentMoodObj = moodOptions.find((m) => m.label === selectedMood) || moodOptions[0];
                  const MoodIconComponent = currentMoodObj.icon;
                  return <MoodIconComponent size={16} color="#4F46E5" strokeWidth={2.2} />;
                })()}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodScrollRow}
            >
              {moodOptions.map((mood) => {
                const isSelected = selectedMood === mood.label;
                const MoodIcon = mood.icon;
                return (
                  <Pressable
                    key={mood.label}
                    onPress={() => setSelectedMood(mood.label)}
                    style={({ pressed }) => [
                      styles.moodPill,
                      isSelected && styles.moodPillActive,
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <MoodIcon
                      size={14}
                      color={isSelected ? '#FFFFFF' : '#64748B'}
                      strokeWidth={2.2}
                    />
                    <Text style={[styles.moodPillText, isSelected && styles.moodPillTextActive]}>
                      {mood.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Today's Tasks Section */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionSub}>PRIORITY QUEUE</Text>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Today's Tasks</Text>
              </View>
              <Pressable
                onPress={() => setShowAddTask(!showAddTask)}
                style={({ pressed }) => [
                  styles.addButton,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                {showAddTask ? (
                  <X size={14} color="#6366F1" strokeWidth={2.4} />
                ) : (
                  <Plus size={14} color="#6366F1" strokeWidth={2.4} />
                )}
                <Text style={styles.addButtonText}>{showAddTask ? 'Close' : 'Add Task'}</Text>
              </Pressable>
            </View>

            {/* Inline Quick Add Task */}
            {showAddTask && (
              <View style={[styles.addTaskBox, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.taskInput, { color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                  placeholder="What task do you need to complete?"
                  placeholderTextColor="#94A3B8"
                  value={newTaskText}
                  onChangeText={setNewTaskText}
                  onSubmitEditing={handleAddNewTask}
                  returnKeyType="done"
                  autoFocus
                />
                <Pressable
                  onPress={handleAddNewTask}
                  style={({ pressed }) => [
                    styles.saveTaskButton,
                    isWeb && styles.webPointer,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.saveTaskButtonText}>Add Task</Text>
                </Pressable>
              </View>
            )}

            {/* List or Empty State */}
            {tasks.length === 0 ? (
              <View style={[styles.emptyStateBox, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                <ListTodo size={36} color="#94A3B8" strokeWidth={1.5} />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.textPrimary }]}>Task queue is currently clear</Text>
                <Text style={[styles.emptyStateDesc, { color: theme.colors.textSecondary }]}>
                  Add key tasks to let your assistant keep your daily priorities on track.
                </Text>
                <Pressable
                  onPress={() => setShowAddTask(true)}
                  style={({ pressed }) => [
                    styles.emptyStateButton,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.emptyStateButtonText}>+ Add First Task</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.taskList}>
                {tasks.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleTask(item.id)}
                    style={({ pressed }) => [
                      styles.taskItem,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                      item.done && styles.taskItemDone,
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <View style={[styles.checkbox, item.done && styles.checkboxActive]}>
                      {item.done && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <View style={styles.taskTextWrapper}>
                      <Text style={[styles.taskTitle, { color: theme.colors.textPrimary }, item.done && styles.taskTitleDone]}>
                        {item.title}
                      </Text>
                      <View style={styles.taskMetaRow}>
                        <Text style={styles.taskCategoryBadge}>{item.category || 'Task'}</Text>
                        <Text style={[styles.taskTimeText, { color: theme.colors.textMuted }]}>• {item.time || 'Today'}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Daily Habit Loops Tracker */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionSub}>SYSTEM CONSISTENCY</Text>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Core Habits & Routines</Text>
              </View>
              <View style={styles.habitScoreBadge}>
                <Text style={styles.habitScoreText}>
                  {completedHabitsCount}/{habits.length} Complete
                </Text>
              </View>
            </View>

            {habits.length === 0 ? (
              <View style={[styles.emptyStateBox, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                <Repeat size={36} color="#94A3B8" strokeWidth={1.5} />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.textPrimary }]}>No habits tracked yet</Text>
                <Text style={[styles.emptyStateDesc, { color: theme.colors.textSecondary }]}>
                  Habits logged in your Goals & Habits tab will automatically appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.habitsGrid}>
                {habits.map((habit) => (
                  <Pressable
                    key={habit.id}
                    onPress={() => toggleHabit(habit.id)}
                    style={({ pressed }) => [
                      styles.habitCard,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                      habit.completedToday && styles.habitCardCompleted,
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <View style={styles.habitCardTop}>
                      <Zap size={18} color="#6366F1" strokeWidth={2} />
                      <View
                        style={[
                          styles.habitCheckCircle,
                          habit.completedToday && styles.habitCheckCircleActive,
                        ]}
                      >
                        {habit.completedToday ? (
                          <Check size={11} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                          <Plus size={11} color="#64748B" strokeWidth={3} />
                        )}
                      </View>
                    </View>
                    <Text style={[styles.habitName, { color: theme.colors.textPrimary }]}>{habit.name}</Text>
                    <View style={styles.habitStreakRow}>
                      <Flame size={12} color="#D97706" strokeWidth={2.4} />
                      <Text style={[styles.habitStreak, { color: theme.colors.textSecondary }]}>{habit.streak || 0}d streak</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Connected Management Modules */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <Text style={styles.sectionSub}>CONNECTED LIFE MODULES</Text>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Assistant Hub</Text>

            <View style={styles.moduleRow}>
              <Pressable
                onPress={() => handleTabChange('goals')}
                style={({ pressed }) => [
                  styles.moduleCard,
                  { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                  isWeb && styles.webPointer,
                  pressed && styles.buttonPressed,
                ]}
              >
                <View style={styles.moduleCardHeader}>
                  <Target size={20} color="#4F46E5" strokeWidth={2.2} />
                  <ArrowRight size={15} color="#94A3B8" strokeWidth={2.4} />
                </View>
                <Text style={[styles.moduleTitle, { color: theme.colors.textPrimary }]}>Goals & Milestones</Text>
                <Text style={[styles.moduleStatus, { color: theme.colors.textSecondary }]}>Intentions & progress tracker</Text>
              </Pressable>

              <Pressable
                onPress={() => handleTabChange('notes')}
                style={({ pressed }) => [
                  styles.moduleCard,
                  { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                  isWeb && styles.webPointer,
                  pressed && styles.buttonPressed,
                ]}
              >
                <View style={styles.moduleCardHeader}>
                  <FileText size={20} color="#4F46E5" strokeWidth={2.2} />
                  <ArrowRight size={15} color="#94A3B8" strokeWidth={2.4} />
                </View>
                <Text style={[styles.moduleTitle, { color: theme.colors.textPrimary }]}>Notes & Knowledge</Text>
                <Text style={[styles.moduleStatus, { color: theme.colors.textSecondary }]}>Quick capture & references</Text>
              </Pressable>
            </View>

            <View style={styles.moduleRow}>
              <Pressable
                onPress={() => handleTabChange('calendar')}
                style={({ pressed }) => [
                  styles.moduleCard,
                  { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                  isWeb && styles.webPointer,
                  pressed && styles.buttonPressed,
                ]}
              >
                <View style={styles.moduleCardHeader}>
                  <CalendarDays size={20} color="#4F46E5" strokeWidth={2.2} />
                  <ArrowRight size={15} color="#94A3B8" strokeWidth={2.4} />
                </View>
                <Text style={[styles.moduleTitle, { color: theme.colors.textPrimary }]}>Calendar & Agenda</Text>
                <Text style={[styles.moduleStatus, { color: theme.colors.textSecondary }]}>Focus blocks & schedule</Text>
              </Pressable>

              <Pressable
                onPress={() => handleTabChange('tasks')}
                style={({ pressed }) => [
                  styles.moduleCard,
                  { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                  isWeb && styles.webPointer,
                  pressed && styles.buttonPressed,
                ]}
              >
                <View style={styles.moduleCardHeader}>
                  <ListTodo size={20} color="#4F46E5" strokeWidth={2.2} />
                  <ArrowRight size={15} color="#94A3B8" strokeWidth={2.4} />
                </View>
                <Text style={[styles.moduleTitle, { color: theme.colors.textPrimary }]}>Tasks & OKRs</Text>
                <Text style={[styles.moduleStatus, { color: theme.colors.textSecondary }]}>Priority queue & execution</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 16 }} />
        </View>
      </ScrollView>

      {/* Bottom Floating Navigation */}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: '#0A0E1A',
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
    borderColor: 'rgba(99, 102, 241, 0.25)',
    shadowColor: '#4F46E5',
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
  },
  heroSection: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBackgroundImage: {
    opacity: 0.42,
    transform: [{ scale: 1.05 }],
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  topBrandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    zIndex: 2,
  },
  liveSystemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  liveSystemText: {
    color: '#6EE7B7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    zIndex: 2,
  },
  userProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.8,
    borderColor: '#818CF8',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  avatarCustomImg: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  avatarText: {
    fontSize: 20,
  },
  greetingKicker: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  greetingName: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  logoutText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '700',
  },
  overviewCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.88)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    zIndex: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818CF8',
  },
  badgeText: {
    color: '#C7D2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dateText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  overviewTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    lineHeight: 22,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStatText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '500',
  },
  progressPercentageText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '800',
  },
  orbLarge: {
    position: 'absolute',
    right: -80,
    top: 10,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#4338CA',
    opacity: 0.35,
    pointerEvents: 'none',
  },
  orbSmall: {
    position: 'absolute',
    left: -40,
    bottom: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#0284C7',
    opacity: 0.3,
    pointerEvents: 'none',
  },
  contentBody: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    marginTop: -16,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    height: 4,
    marginBottom: 16,
    width: 36,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricIcon: {
    fontSize: 16,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  aiBriefingCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  aiBriefingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiBriefingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiBriefingBadgeText: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  aiBriefingBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiBriefingBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  aiBriefingBody: {
    fontSize: 13,
    lineHeight: 18.5,
    fontStyle: 'italic',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionSub: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  currentMoodBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodScrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moodPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  moodPillText: {
    color: '#334155',
    fontSize: 12.5,
    fontWeight: '600',
  },
  moodPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  habitStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  addTaskBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    padding: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  taskInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  saveTaskButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  taskList: {
    gap: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskItemDone: {
    backgroundColor: '#F1F5F9',
    opacity: 0.75,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.8,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  taskTextWrapper: {
    flex: 1,
  },
  taskTitle: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '600',
  },
  taskTitleDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  taskCategoryBadge: {
    color: '#4338CA',
    fontSize: 10.5,
    fontWeight: '700',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskTimeText: {
    color: '#64748B',
    fontSize: 11,
  },
  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  emptyStateEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyStateTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateDesc: {
    color: '#64748B',
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 14,
    maxWidth: 260,
    lineHeight: 17,
  },
  emptyStateButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  habitScoreBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  habitScoreText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '700',
  },
  habitsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  habitCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  habitCardCompleted: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  habitCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitIcon: {
    fontSize: 20,
  },
  habitCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCheckCircleActive: {
    backgroundColor: '#4F46E5',
  },
  habitCheckMark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  habitPlus: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  habitName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  habitStreak: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
  },
  moduleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  moduleCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  moduleIcon: {
    fontSize: 18,
  },
  moduleArrow: {
    color: '#818CF8',
    fontSize: 14,
    fontWeight: '800',
  },
  moduleTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  moduleStatus: {
    color: '#64748B',
    fontSize: 11,
  },
  pressedOpacity: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
