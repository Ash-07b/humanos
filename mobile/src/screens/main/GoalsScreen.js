import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
  StatusBar,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Briefcase,
  GraduationCap,
  WalletCards,
  HeartPulse,
  UserRound,
  Target,
  Search,
  X,
  Plus,
  Check,
  Flame,
  MoreVertical,
  Calendar,
  Sparkles,
  Eye,
  TrendingUp,
  Flag,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react-native';
import BottomNavigation from '../../components/BottomNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import {
  fetchAiGoalRecommendation,
  fetchGoals,
  createGoal,
  updateGoal,
  updateGoalProgress,
  completeGoal,
  addGoalMilestone,
  toggleGoalMilestone,
  deleteGoal,
} from '../../services/api';
import { getToken } from '../../services/storage';

export default function GoalsScreen({ user, onLogout, onNavigateTab, navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isWeb = Platform.OS === 'web';
  const { theme, isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState('goals');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [targetOptionGoal, setTargetOptionGoal] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [editProgressModalVisible, setEditProgressModalVisible] = useState(false);
  const [newProgressValue, setNewProgressValue] = useState(0);
  const [addMilestoneModalVisible, setAddMilestoneModalVisible] = useState(false);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  // Add Goal Form State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Career');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState('Medium');
  const [newGoalObjectives, setNewGoalObjectives] = useState([]);
  const [newObjectiveInput, setNewObjectiveInput] = useState('');
  const [formError, setFormError] = useState('');

  // Calendar Modal State
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const handleAddObjectiveToForm = () => {
    if (!newObjectiveInput.trim()) return;
    setNewGoalObjectives((prev) => [...prev, newObjectiveInput.trim()]);
    setNewObjectiveInput('');
  };

  const handleRemoveObjectiveFromForm = (idx) => {
    setNewGoalObjectives((prev) => prev.filter((_, i) => i !== idx));
  };

  const [goals, setGoals] = useState(user?.goals || []);
  const [completedGoals, setCompletedGoals] = useState(user?.completedGoals || []);
  const supportingHabits = user?.habits || [];

  // Live AI Goal Review State
  const [aiReviewText, setAiReviewText] = useState(
    user?.aiGoalReview || "You're making steady progress on your goals. Your strongest area this week is Learning."
  );
  const [aiReviewLoading, setAiReviewLoading] = useState(false);

  // Fetch goals from backend API
  const loadGoalsFromApi = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetchGoals({}, token);
      if (res && res.success) {
        if (Array.isArray(res.goals)) {
          setGoals(res.goals);
        }
        if (Array.isArray(res.completedGoals)) {
          setCompletedGoals(res.completedGoals);
        }
      }
    } catch (err) {
      console.log('Error fetching goals from API:', err);
    }
  };

  // Load goals on mount
  React.useEffect(() => {
    loadGoalsFromApi();
  }, []);

  // Sync state whenever user data changes from database
  React.useEffect(() => {
    if (user) {
      if (user.goals && user.goals.length > 0 && goals.length === 0) {
        setGoals(user.goals);
      }
      if (user.completedGoals && user.completedGoals.length > 0 && completedGoals.length === 0) {
        setCompletedGoals(user.completedGoals);
      }
    }
  }, [user]);

  const categories = ['All', 'Personal', 'Health', 'Career', 'Learning', 'Finance'];
  const formCategories = ['Personal', 'Health', 'Career', 'Learning', 'Finance', 'Other'];
  const priorities = ['Low', 'Medium', 'High'];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadGoalsFromApi();
      showToast('Goals synchronized');
    } catch (e) {
      console.log('Error refreshing goals:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerateAiReview = async () => {
    setAiReviewLoading(true);
    try {
      const activeGoalsData = goals.map((g) => ({
        title: g.title,
        progress: g.progress || 0,
        category: g.category || 'General',
      }));

      const payload = {
        totalGoals: goals.length,
        completedGoals: completedGoals.length,
        activeGoals: activeGoalsData,
        currentProgress: overallProgress,
        categories: [...new Set(goals.map((g) => g.category || 'General'))],
      };

      const token = await getToken();
      const res = await fetchAiGoalRecommendation(payload, token);

      if (res && res.success && res.recommendation) {
        setAiReviewText(res.recommendation);
        showToast(res.source && res.source.startsWith('ollama') ? 'Goal Strategy reviewed by Ollama' : 'Goal Strategy synthesized');
      } else {
        throw new Error(res?.message || 'Empty response');
      }
    } catch (err) {
      console.log('AI Goal fallback review:', err.message);
      setAiReviewText(
        `Maintaining steady momentum with ${overallProgress}% overall goal progress. Focus on advancing your primary milestone today.`
      );
      showToast('AI goal review updated');
    } finally {
      setAiReviewLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onNavigateTab) {
      onNavigateTab(tabId);
    } else if (navigation) {
      if (tabId === 'dashboard') navigation.navigate('Dashboard');
      else if (tabId === 'tasks') navigation.navigate('Tasks');
      else if (tabId === 'health') navigation.navigate('Health');
      else if (tabId === 'profile') navigation.navigate('Profile');
      else if (tabId === 'finance') navigation.navigate('Finance');
    }
  };

  // Calculations
  const totalGoalsCount = goals.length + completedGoals.length;
  const completedCount = completedGoals.length;
  const currentStreak =
    user?.activeStreak ??
    (supportingHabits.length
      ? Math.max(...supportingHabits.map((h) => h.streak || 0), 0)
      : 0);

  const totalProgressSum =
    goals.reduce((acc, g) => acc + (g.progress || 0), 0) + completedGoals.length * 100;
  const overallProgress = totalGoalsCount > 0 ? Math.round(totalProgressSum / totalGoalsCount) : 0;

  // Filtered Goals
  const filteredGoals = goals.filter((g) => {
    const title = g?.title ? String(g.title).toLowerCase() : '';
    const desc = g?.description ? String(g.description).toLowerCase() : '';
    const cat = g?.category ? String(g.category).toLowerCase() : '';
    const q = searchQuery ? searchQuery.toLowerCase().trim() : '';

    const matchesCat = selectedCategory === 'All' || cat === selectedCategory.toLowerCase();
    const matchesSearch = !q || title.includes(q) || desc.includes(q) || cat.includes(q);
    return matchesCat && matchesSearch;
  });

  // Add Goal Handler
  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) {
      setFormError('Please enter a goal title.');
      return;
    }

    const customMilestones = newGoalObjectives
      .map((o) => (typeof o === 'string' ? o.trim() : ''))
      .filter(Boolean)
      .map((text, idx) => ({ id: `m_${Date.now()}_${idx}`, text, completed: false }));

    const payload = {
      title: newGoalTitle.trim(),
      description: newGoalDesc.trim() || 'No description provided.',
      category: newGoalCategory,
      progress: 0,
      targetDate: newGoalTargetDate.trim() || 'Ongoing',
      priority: newGoalPriority,
      status: 'Active',
      milestones: customMilestones.length > 0 ? customMilestones : [
        { text: 'Initial scoping & plan', completed: false },
        { text: 'Execution phase 1', completed: false },
      ],
    };

    try {
      const token = await getToken();
      if (token) {
        const res = await createGoal(payload, token);
        if (res && res.success && res.goal) {
          setGoals((prev) => [res.goal, ...prev]);
          showToast(`Created "${res.goal.title}"`);
        } else {
          // Fallback local creation
          const fallback = {
            id: `g_${Date.now()}`,
            ...payload,
            createdDate: 'Today',
            progressHistory: [{ date: 'Today', progress: 0, note: 'Goal initialized' }],
          };
          setGoals((prev) => [fallback, ...prev]);
          showToast(`Created "${fallback.title}"`);
        }
      } else {
        const fallback = {
          id: `g_${Date.now()}`,
          ...payload,
          createdDate: 'Today',
          progressHistory: [{ date: 'Today', progress: 0, note: 'Goal initialized' }],
        };
        setGoals((prev) => [fallback, ...prev]);
        showToast(`Created "${fallback.title}"`);
      }
    } catch (e) {
      console.log('Error creating goal:', e);
      showToast('Failed to create goal on server');
    }

    setNewGoalTitle('');
    setNewGoalDesc('');
    setNewGoalTargetDate('');
    setNewGoalObjectives([]);
    setNewObjectiveInput('');
    setFormError('');
    setAddModalVisible(false);
  };

  // Update Goal Progress Handler (Supports Reopening Completed Goals if marked by mistake)
  const handleUpdateProgress = async (goalId, newProgress) => {
    const numericProgress = Math.min(100, Math.max(0, parseInt(newProgress, 10) || 0));

    // Check if the goal is currently in completedGoals or active goals
    const isCurrentlyCompleted = completedGoals.some((g) => (g.id === goalId || g._id === goalId));
    const isCurrentlyActive = goals.some((g) => (g.id === goalId || g._id === goalId));

    if (numericProgress >= 100) {
      if (isCurrentlyActive) {
        const target = goals.find((g) => (g.id === goalId || g._id === goalId));
        if (target) {
          setGoals((prev) => prev.filter((g) => (g.id !== goalId && g._id !== goalId)));
          const completedItem = {
            ...target,
            id: target.id || target._id,
            title: target.title,
            category: target.category,
            completedDate: target.completedDate || 'Today',
            progress: 100,
            status: 'Completed',
          };
          setCompletedGoals((prev) => [completedItem, ...prev]);
          if (selectedGoal && (selectedGoal.id === goalId || selectedGoal._id === goalId)) {
            setSelectedGoal(completedItem);
          }
          setEditProgressModalVisible(false);
          showToast(`🎉 Goal "${target.title}" Completed!`);
        }
      } else if (isCurrentlyCompleted) {
        setCompletedGoals((prev) =>
          prev.map((g) => (g.id === goalId || g._id === goalId ? { ...g, progress: 100, status: 'Completed' } : g))
        );
        setEditProgressModalVisible(false);
        showToast(`Goal marked as 100% Completed`);
      }
    } else {
      // numericProgress < 100
      if (isCurrentlyCompleted) {
        // Was completed by mistake - reopen and move back to active goals!
        const target = completedGoals.find((g) => (g.id === goalId || g._id === goalId));
        if (target) {
          setCompletedGoals((prev) => prev.filter((g) => (g.id !== goalId && g._id !== goalId)));
          const reopenedItem = {
            ...target,
            id: target.id || target._id,
            progress: numericProgress,
            status: 'Active',
            progressHistory: [
              { date: 'Today', progress: numericProgress, note: `Reopened at ${numericProgress}%` },
              ...(target.progressHistory || []),
            ],
          };
          setGoals((prev) => [reopenedItem, ...prev]);
          if (selectedGoal && (selectedGoal.id === goalId || selectedGoal._id === goalId)) {
            setSelectedGoal(reopenedItem);
          }
          setEditProgressModalVisible(false);
          showToast(`Reopened "${target.title}" at ${numericProgress}%`);
        }
      } else {
        // Active goal progress update
        setGoals((prev) =>
          prev.map((g) => {
            if (g.id === goalId || g._id === goalId) {
              const updatedHistory = [
                { date: 'Today', progress: numericProgress, note: `Updated to ${numericProgress}%` },
                ...(g.progressHistory || []),
              ];
              return {
                ...g,
                progress: numericProgress,
                progressHistory: updatedHistory,
              };
            }
            return g;
          })
        );
        if (selectedGoal && (selectedGoal.id === goalId || selectedGoal._id === goalId)) {
          setSelectedGoal((prev) => ({
            ...prev,
            progress: numericProgress,
            progressHistory: [
              { date: 'Today', progress: numericProgress, note: `Updated to ${numericProgress}%` },
              ...(prev.progressHistory || []),
            ],
          }));
        }
        setEditProgressModalVisible(false);
        showToast(`Progress updated to ${numericProgress}%`);
      }
    }

    try {
      const token = await getToken();
      if (token) {
        await updateGoalProgress(goalId, numericProgress, `Updated to ${numericProgress}%`, token);
      }
    } catch (e) {
      console.log('Error updating goal progress on server:', e);
    }
  };

  // Toggle Milestone
  const handleToggleMilestone = async (goalId, milestoneId) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId || g._id === goalId) {
          const updatedMilestones = (g.milestones || []).map((m) =>
            (m.id === milestoneId || m._id === milestoneId) ? { ...m, completed: !m.completed } : m
          );
          return { ...g, milestones: updatedMilestones };
        }
        return g;
      })
    );

    if (selectedGoal && (selectedGoal.id === goalId || selectedGoal._id === goalId)) {
      setSelectedGoal((prev) => ({
        ...prev,
        milestones: (prev.milestones || []).map((m) =>
          (m.id === milestoneId || m._id === milestoneId) ? { ...m, completed: !m.completed } : m
        ),
      }));
    }

    try {
      const token = await getToken();
      if (token) {
        await toggleGoalMilestone(goalId, milestoneId, token);
      }
    } catch (e) {
      console.log('Error toggling milestone on server:', e);
    }
  };

  // Add Milestone to Goal
  const handleAddMilestone = async () => {
    if (!newMilestoneText.trim() || !selectedGoal) return;
    const textToAdd = newMilestoneText.trim();
    const newM = {
      id: `m_${Date.now()}`,
      text: textToAdd,
      completed: false,
    };

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === selectedGoal.id || g._id === selectedGoal._id) {
          return { ...g, milestones: [...(g.milestones || []), newM] };
        }
        return g;
      })
    );

    setSelectedGoal((prev) => ({
      ...prev,
      milestones: [...(prev.milestones || []), newM],
    }));

    setNewMilestoneText('');
    setAddMilestoneModalVisible(false);
    showToast('Milestone added');

    try {
      const token = await getToken();
      if (token) {
        const res = await addGoalMilestone(selectedGoal.id || selectedGoal._id, textToAdd, token);
        if (res && res.success && res.goal) {
          setGoals((prev) =>
            prev.map((g) => ((g.id === res.goal.id || g._id === res.goal._id) ? res.goal : g))
          );
          setSelectedGoal(res.goal);
        }
      }
    } catch (e) {
      console.log('Error adding milestone on server:', e);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    const idToDelete = goalToDelete.id || goalToDelete._id;

    setGoals((prev) => prev.filter((g) => (g.id !== idToDelete && g._id !== idToDelete)));
    setCompletedGoals((prev) => prev.filter((g) => (g.id !== idToDelete && g._id !== idToDelete)));

    if (selectedGoal && (selectedGoal.id === idToDelete || selectedGoal._id === idToDelete)) {
      setDetailsModalVisible(false);
    }
    setDeleteModalVisible(false);
    const deletedTitle = goalToDelete.title;
    setGoalToDelete(null);
    showToast(`Deleted "${deletedTitle}"`);

    try {
      const token = await getToken();
      if (token) {
        await deleteGoal(idToDelete, token);
      }
    } catch (e) {
      console.log('Error deleting goal on server:', e);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { bg: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', text: '#EF4444', border: isDarkMode ? 'rgba(239, 68, 68, 0.4)' : '#FECACA' };
      case 'medium':
        return { bg: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7', text: '#F59E0B', border: isDarkMode ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A' };
      case 'low':
      default:
        return { bg: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF', text: isDarkMode ? '#A5B4FC' : '#4F46E5', border: isDarkMode ? 'rgba(99, 102, 241, 0.35)' : '#C7D2FE' };
    }
  };

  const getCategoryIconComponent = (category) => {
    switch (category?.toLowerCase()) {
      case 'career':
        return Briefcase;
      case 'learning':
        return GraduationCap;
      case 'finance':
        return WalletCards;
      case 'health':
        return HeartPulse;
      case 'personal':
        return UserRound;
      default:
        return Target;
    }
  };

  const appContent = (
    <View style={[styles.mainWrapper, { backgroundColor: theme.colors.pageBg }]}>
      {/* Toast Notice */}
      {!!toastMessage && (
        <View style={styles.toastNotice}>
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
          <Text style={styles.toastText}>{toastMessage}</Text>
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
              <Text style={styles.headerKicker}>ASPIRATIONS & MILESTONES</Text>
              <Text style={styles.headerTitle}>Goals</Text>
              <Text style={styles.headerSubtitle}>
                Turn your intentions into progress.
              </Text>
            </View>

            <View style={styles.headerActionBtnRow}>
              <Pressable
                onPress={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) setSearchQuery('');
                }}
                style={({ pressed }) => [
                  styles.headerActionBtn,
                  showSearch && styles.headerActionBtnActive,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
                hitSlop={8}
              >
                {showSearch ? (
                  <X size={18} color="#94A3B8" strokeWidth={2.2} />
                ) : (
                  <Search size={18} color="#94A3B8" strokeWidth={2.2} />
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setNewGoalTitle('');
                  setNewGoalDesc('');
                  setFormError('');
                  setAddModalVisible(true);
                }}
                style={({ pressed }) => [
                  styles.headerAddBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.headerAddBtnText}>Add Goal</Text>
              </Pressable>
            </View>
          </View>

          {/* Search Bar Input */}
          {showSearch && (
            <View style={[styles.searchBarContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
              <Search size={15} color={isDarkMode ? '#94A3B8' : '#64748B'} strokeWidth={2.2} />
              <TextInput
                style={[styles.searchInput, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }, isWeb && styles.webOutlineNone]}
                placeholder="Search goals by title or description..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {!!searchQuery && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6} style={{ padding: 4 }}>
                  <X size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} strokeWidth={2.2} />
                </Pressable>
              )}
            </View>
          )}

          {/* Background Ambient Orbs */}
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
        </View>

        {/* ==================== MAIN CONTENT SHEET ==================== */}
        <View style={[styles.sheetContent, { backgroundColor: theme.colors.pageBg }]}>
          {/* ==================== 2. OVERVIEW SUMMARY CARD ==================== */}
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.overviewHeaderRow}>
              <View>
                <Text style={[styles.overviewKicker, { color: isDarkMode ? '#818CF8' : '#4F46E5' }]}>PROGRESS PULSE</Text>
                <Text style={[styles.overviewTitle, { color: theme.colors.textPrimary }]}>Overall Goals Execution</Text>
              </View>
              <View style={[styles.progressBadge, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF', borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.4)' : '#C7D2FE' }]}>
                <Text style={[styles.progressBadgeText, { color: isDarkMode ? '#A5B4FC' : '#4F46E5' }]}>{overallProgress}%</Text>
              </View>
            </View>

            {/* Single Main Horizontal Progress Bar */}
            <View style={[styles.progressBarTrack, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.18)' : '#EEF2FF' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.max(6, Math.min(100, overallProgress))}%`,
                    backgroundColor: isDarkMode ? '#818CF8' : '#4F46E5',
                  },
                ]}
              />
            </View>

            <View style={styles.overviewStatsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                  {completedCount} / {totalGoalsCount}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Goals Completed</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.statBox}>
                <View style={styles.streakValRow}>
                  <Flame size={14} color="#F59E0B" strokeWidth={2.4} />
                  <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{currentStreak} days</Text>
                </View>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Current Streak</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{goals.length} Active</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>In Motion</Text>
              </View>
            </View>
          </View>

          {/* ==================== 3. CATEGORIES FILTER ==================== */}
          <View style={styles.categoriesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContent}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const IconComponent = cat !== 'All' ? getCategoryIconComponent(cat) : null;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      isSelected ? styles.categoryChipSelected : [styles.categoryChipUnselected, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }],
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    {IconComponent && (
                      <IconComponent
                        size={13}
                        color={isSelected ? '#FFFFFF' : (isDarkMode ? '#818CF8' : '#4F46E5')}
                        strokeWidth={2.2}
                      />
                    )}
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected
                          ? styles.categoryChipTextSelected
                          : [styles.categoryChipTextUnselected, { color: theme.colors.textSecondary }],
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ==================== 4. ACTIVE GOALS ==================== */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionSub}>FOCUSED OBJECTIVES</Text>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Active Goals</Text>
            </View>
            <Text style={[styles.sectionCounterBadge, { backgroundColor: theme.colors.cardAltBg, color: theme.colors.textSecondary }]}>
              {filteredGoals.length} goals
            </Text>
          </View>

          {filteredGoals.length === 0 ? (
            <View style={[styles.emptyStateCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
              <Target size={36} color="#94A3B8" strokeWidth={1.5} />
              <Text style={[styles.emptyStateHeading, { color: theme.colors.textPrimary }]}>
                {selectedCategory === 'All' ? 'No goals yet' : 'No goals in this category'}
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                Start with something meaningful and track your progress along the way.
              </Text>
              <Pressable
                onPress={() => {
                  setNewGoalCategory(selectedCategory === 'All' ? 'Career' : selectedCategory);
                  setNewGoalTitle('');
                  setNewGoalDesc('');
                  setFormError('');
                  setAddModalVisible(true);
                }}
                style={({ pressed }) => [
                  styles.emptyStateBtn,
                  { backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center', gap: 6 },
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Plus size={15} color="#FFFFFF" strokeWidth={2.6} />
                <Text style={[styles.emptyStateBtnText, { color: '#FFFFFF', fontWeight: '800' }]}>Create Goal</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.goalsList}>
              {filteredGoals.map((goal) => {
                const pColor = getPriorityColor(goal.priority);
                const completedMilestones = (goal.milestones || []).filter((m) => m.completed).length;
                const totalMilestones = (goal.milestones || []).length;
                const CatIcon = getCategoryIconComponent(goal.category);

                return (
                  <Pressable
                    key={goal.id}
                    onPress={() => {
                      setSelectedGoal(goal);
                      setDetailsModalVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.goalCard,
                      { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border },
                      isWeb && styles.webPointer,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={styles.goalCardTopRow}>
                      <View style={styles.goalTitleCol}>
                        <Text style={[styles.goalTitleText, { color: theme.colors.textPrimary }]}>{goal.title}</Text>
                        <View style={styles.goalBadgesRow}>
                          <View style={[styles.categoryBadge, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                            <CatIcon size={11} color={isDarkMode ? '#818CF8' : '#4F46E5'} strokeWidth={2.2} />
                            <Text style={[styles.categoryBadgeText, { color: theme.colors.textSecondary }]}>{goal.category}</Text>
                          </View>

                          <View
                            style={[
                              styles.priorityBadge,
                              { backgroundColor: pColor.bg, borderColor: pColor.border },
                            ]}
                          >
                            <Text style={[styles.priorityBadgeText, { color: pColor.text }]}>
                              {goal.priority}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setTargetOptionGoal(goal);
                          setOptionsModalVisible(true);
                        }}
                        style={styles.optionsDotBtn}
                        hitSlop={8}
                      >
                        <MoreVertical size={16} color="#64748B" strokeWidth={2.2} />
                      </Pressable>
                    </View>

                    {/* Progress Summary Info Row */}
                    <View style={styles.goalProgressSection}>
                      <View style={styles.progressInfoRow}>
                        <View style={[styles.goalProgressPill, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}>
                          <Text style={[styles.progressPercentLabel, { color: isDarkMode ? '#A5B4FC' : '#4F46E5' }]}>
                            {goal.progress}% Completed
                          </Text>
                        </View>
                        {totalMilestones > 0 && (
                          <Text style={[styles.milestoneMiniText, { color: theme.colors.textSecondary }]}>
                            {completedMilestones}/{totalMilestones} milestones
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Footer Info */}
                    <View style={[styles.goalCardFooter, { borderTopColor: theme.colors.border }]}>
                      <View style={styles.targetDateRow}>
                        <Calendar size={11} color="#64748B" strokeWidth={2.2} />
                        <Text style={[styles.targetDateText, { color: theme.colors.textSecondary }]}>Target: {goal.targetDate}</Text>
                      </View>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setTargetOptionGoal(goal);
                          setNewProgressValue(goal.progress);
                          setEditProgressModalVisible(true);
                        }}
                        style={[styles.quickUpdateBtn, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}
                      >
                        <Text style={styles.quickUpdateText}>Update %</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ==================== 10. HABITS CONNECTION ==================== */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionSub}>DAILY MOMENTUM</Text>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Supporting Habits</Text>
              </View>
            </View>
            <Text style={[styles.habitsExplainer, { color: theme.colors.textSecondary }]}>
              Small habits help you reach your bigger goals.
            </Text>

            <View style={styles.habitsGrid}>
              {supportingHabits.map((habit) => (
                <View key={habit.id} style={[styles.habitCard, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                  <View style={[styles.habitIconWrap, { backgroundColor: `${habit.color}18` }]}>
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                  </View>
                  <View style={styles.habitContent}>
                    <Text style={[styles.habitName, { color: theme.colors.textPrimary }]}>{habit.name}</Text>
                    <Text style={[styles.habitFreq, { color: theme.colors.textSecondary }]}>{habit.frequency}</Text>
                  </View>
                  <View style={styles.habitActiveDot} />
                </View>
              ))}
            </View>
          </View>

          {/* ==================== 11. GOAL INSIGHTS (AI CARD) ==================== */}
          <View
            style={[
              styles.insightCard,
              {
                backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.12)' : '#F5F3FF',
                borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.18)',
              },
            ]}
          >
            <View style={styles.insightHeaderRow}>
              <View style={styles.insightBadge}>
                <Sparkles size={12} color="#6366F1" strokeWidth={2.2} />
                <Text style={styles.insightBadgeText}>AI GOALS BRIEFING</Text>
              </View>
              <Pressable
                onPress={handleGenerateAiReview}
                disabled={aiReviewLoading}
                style={({ pressed }) => [
                  styles.insightRefreshBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={[styles.insightRefreshText, { color: isDarkMode ? '#A5B4FC' : '#4F46E5' }]}>
                  {aiReviewLoading ? 'Analyzing...' : '✦ Refresh'}
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.insightBody, { color: theme.colors.textPrimary }]}>
              "{aiReviewText}"
            </Text>
          </View>

          {/* ==================== 8. COMPLETED GOALS ==================== */}
          {completedGoals.length > 0 && (
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionSub}>VICTORIES & ACHIEVEMENTS</Text>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Completed Goals</Text>
                </View>
                <View style={[styles.completedBadge, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}>
                  <Text style={[styles.completedBadgeText, { color: isDarkMode ? '#A5B4FC' : '#4F46E5' }]}>
                    {completedGoals.length} finished
                  </Text>
                </View>
              </View>

              <View style={styles.completedList}>
                {completedGoals.map((cg) => (
                  <Pressable
                    key={cg.id || cg._id}
                    onPress={() => {
                      setSelectedGoal(cg);
                      setDetailsModalVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.completedGoalCard,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <View style={[styles.completedCheckCircle, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}>
                      <Check size={11} color={isDarkMode ? '#818CF8' : '#4F46E5'} strokeWidth={3} />
                    </View>
                    <View style={styles.completedGoalBody}>
                      <Text style={[styles.completedGoalTitle, { color: theme.colors.textPrimary }]}>{cg.title}</Text>
                      <Text style={[styles.completedGoalSub, { color: theme.colors.textSecondary }]}>
                        100% • Completed {cg.completedDate || 'Recently'} • {cg.category}
                      </Text>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setTargetOptionGoal(cg);
                        setNewProgressValue(100);
                        setEditProgressModalVisible(true);
                      }}
                      style={({ pressed }) => [
                        styles.reopenGoalBtn,
                        { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border },
                        isWeb && styles.webPointer,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <RotateCcw size={11} color={isDarkMode ? '#818CF8' : '#4F46E5'} strokeWidth={2.2} />
                      <Text style={[styles.reopenGoalText, { color: isDarkMode ? '#818CF8' : '#4F46E5' }]}>Edit %</Text>
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Floating Create Goal Action */}
          <Pressable
            onPress={() => {
              setNewGoalTitle('');
              setNewGoalDesc('');
              setFormError('');
              setAddModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.floatingAddGoalBtn,
              { backgroundColor: '#4F46E5' },
              isWeb && styles.webPointer,
              pressed && styles.pressedOpacity,
            ]}
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.6} />
            <Text style={[styles.floatingAddGoalText, { color: '#FFFFFF' }]}>Create Goal</Text>
          </Pressable>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* ==================== 5. GOAL DETAILS MODAL ==================== */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheetCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={[styles.modalHeaderRow, { borderBottomColor: theme.colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalKicker}>GOAL SPECIFICATION</Text>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                  {selectedGoal?.title}
                </Text>
              </View>
              <Pressable
                onPress={() => setDetailsModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: theme.colors.cardAltBg }]}
                hitSlop={8}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedGoal && (
                <>
                  {/* Meta Chips Row */}
                  <View style={styles.detailMetaRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                      {(() => {
                        const CatIcon = getCategoryIconComponent(selectedGoal.category);
                        return <CatIcon size={11} color={isDarkMode ? '#818CF8' : '#4F46E5'} strokeWidth={2.2} />;
                      })()}
                      <Text style={[styles.categoryBadgeText, { color: theme.colors.textSecondary }]}>
                        {selectedGoal.category}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor: getPriorityColor(selectedGoal.priority).bg,
                          borderColor: getPriorityColor(selectedGoal.priority).border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityBadgeText,
                          { color: getPriorityColor(selectedGoal.priority).text },
                        ]}
                      >
                        Priority: {selectedGoal.priority}
                      </Text>
                    </View>

                    <View style={[styles.dateMetaBadge, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                      <Calendar size={11} color="#64748B" strokeWidth={2.2} />
                      <Text style={[styles.dateMetaText, { color: theme.colors.textSecondary }]}>
                        Target: {selectedGoal.targetDate}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={[styles.detailBlock, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                    <Text style={[styles.detailBlockLabel, { color: theme.colors.textPrimary }]}>Description</Text>
                    <Text style={[styles.detailBlockBody, { color: theme.colors.textSecondary }]}>{selectedGoal.description}</Text>
                  </View>

                  {/* Current Progress & Update Progress Button */}
                  <View style={[styles.detailBlock, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                    <View style={styles.progressHeaderRow}>
                      <Text style={[styles.detailBlockLabel, { color: theme.colors.textPrimary }]}>Current Progress</Text>
                      <Text style={[styles.detailProgressPercent, { color: isDarkMode ? '#818CF8' : '#4F46E5' }]}>
                        {selectedGoal.progress}%
                      </Text>
                    </View>

                    <View style={[styles.detailProgressTrack, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.18)' : '#EEF2FF' }]}>
                      <View
                        style={[
                          styles.detailProgressFill,
                          {
                            width: `${selectedGoal.progress}%`,
                            backgroundColor: isDarkMode ? '#818CF8' : '#4F46E5',
                          },
                        ]}
                      />
                    </View>

                    <Pressable
                      onPress={() => {
                        setTargetOptionGoal(selectedGoal);
                        setNewProgressValue(selectedGoal.progress);
                        setEditProgressModalVisible(true);
                      }}
                      style={({ pressed }) => [
                        styles.updateProgressPrimaryBtn,
                        isWeb && styles.webPointer,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <Text style={styles.updateProgressPrimaryText}>
                        Update Progress
                      </Text>
                    </Pressable>
                  </View>

                  {/* Milestones Checklist */}
                  <View style={[styles.detailBlock, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={[styles.detailBlockLabel, { color: theme.colors.textPrimary }]}>Milestones</Text>
                      <Pressable
                        onPress={() => {
                          setNewMilestoneText('');
                          setAddMilestoneModalVisible(true);
                        }}
                        style={[styles.addMilestoneSmallBtn, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}
                      >
                        <Text style={styles.addMilestoneSmallText}>+ Milestone</Text>
                      </Pressable>
                    </View>

                    <View style={styles.milestonesList}>
                      {(selectedGoal.milestones || []).map((m) => (
                        <Pressable
                          key={m.id}
                          onPress={() => handleToggleMilestone(selectedGoal.id, m.id)}
                          style={[styles.milestoneItemRow, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}
                        >
                          <View
                            style={[
                              styles.milestoneCheckbox,
                              m.completed && styles.milestoneCheckboxActive,
                            ]}
                          >
                            {m.completed && (
                              <Check size={10} color="#FFFFFF" strokeWidth={3} />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.milestoneText,
                              { color: theme.colors.textPrimary },
                              m.completed && styles.milestoneTextCompleted,
                            ]}
                          >
                            {m.text}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Progress History */}
                  <View style={[styles.detailBlock, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                    <Text style={[styles.detailBlockLabel, { color: theme.colors.textPrimary }]}>Progress History</Text>
                    <View style={styles.historyList}>
                      {(selectedGoal.progressHistory || []).map((h, idx) => (
                        <View key={idx} style={styles.historyItem}>
                          <View style={styles.historyDot} />
                          <View style={styles.historyContent}>
                            <View style={styles.historyHeader}>
                              <Text style={[styles.historyDate, { color: theme.colors.textPrimary }]}>{h.date}</Text>
                              <Text style={styles.historyPercent}>{h.progress}%</Text>
                            </View>
                            <Text style={[styles.historyNote, { color: theme.colors.textSecondary }]}>{h.note}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Created Date */}
                  <Text style={styles.createdDateFooter}>
                    Created: {selectedGoal.createdDate}
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== 6. CREATE GOAL MODAL ==================== */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheetCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={[styles.modalHeaderRow, { borderBottomColor: theme.colors.border }]}>
              <View>
                <Text style={styles.modalKicker}>NEW OBJECTIVE</Text>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Create New Goal</Text>
              </View>
              <Pressable
                onPress={() => setAddModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: theme.colors.cardAltBg }]}
                hitSlop={8}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Form Validation Alert */}
              {!!formError && (
                <View style={styles.formErrorBanner}>
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              )}

              {/* Goal Title */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.textPrimary }]}>Goal Title *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                  placeholder="e.g. Master React Native Architecture"
                  placeholderTextColor="#94A3B8"
                  value={newGoalTitle}
                  onChangeText={(val) => {
                    setNewGoalTitle(val);
                    if (formError) setFormError('');
                  }}
                  autoFocus
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.textPrimary }]}>Description</Text>
                <Text style={[styles.formHelperText, { color: theme.colors.textMuted }]}>
                  Describe what this goal is about and what you want to achieve.
                </Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                  placeholder="Explain what you want to accomplish, why it matters, and key details..."
                  placeholderTextColor="#94A3B8"
                  value={newGoalDesc}
                  onChangeText={setNewGoalDesc}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.textPrimary }]}>Category</Text>
                <View style={styles.chipsWrapRow}>
                  {formCategories.map((cat) => {
                    const CatIcon = getCategoryIconComponent(cat);
                    const isCatSelected = newGoalCategory === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setNewGoalCategory(cat)}
                        style={[
                          styles.formChip,
                          { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                          isCatSelected && styles.formChipActive,
                        ]}
                      >
                        <CatIcon
                          size={12}
                          color={isCatSelected ? '#FFFFFF' : (isDarkMode ? '#818CF8' : '#4F46E5')}
                          strokeWidth={2.2}
                        />
                        <Text
                          style={[
                            styles.formChipText,
                            { color: theme.colors.textSecondary },
                            isCatSelected && styles.formChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Target Date with Calendar Picker */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.textPrimary }]}>Target Date</Text>
                <View style={styles.inputWithIconRow}>
                  <TextInput
                    style={[
                      styles.formInput,
                      styles.inputWithIcon,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                      isWeb && styles.webOutlineNone,
                    ]}
                    placeholder="Select or enter target date (e.g. 2026-12-31)"
                    placeholderTextColor="#94A3B8"
                    value={newGoalTargetDate}
                    onChangeText={setNewGoalTargetDate}
                  />
                  <Pressable
                    onPress={() => {
                      setCalendarViewDate(new Date());
                      setCalendarModalVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.calendarTriggerIconBtn,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Calendar size={17} color="#4F46E5" strokeWidth={2.2} />
                  </Pressable>
                </View>

                {/* Quick Target Date Presets */}
                <View style={styles.miniPresetRow}>
                  <Pressable
                    onPress={() => {
                      const inMonth = new Date();
                      inMonth.setDate(inMonth.getDate() + 30);
                      setNewGoalTargetDate(inMonth.toISOString().split('T')[0]);
                    }}
                    style={[styles.miniPresetBtn, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}
                  >
                    <Text style={[styles.miniPresetText, { color: theme.colors.textSecondary }]}>+1 Month</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const inQuarter = new Date();
                      inQuarter.setDate(inQuarter.getDate() + 90);
                      setNewGoalTargetDate(inQuarter.toISOString().split('T')[0]);
                    }}
                    style={[styles.miniPresetBtn, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}
                  >
                    <Text style={[styles.miniPresetText, { color: theme.colors.textSecondary }]}>+3 Months</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const endOfYear = new Date(new Date().getFullYear(), 11, 31);
                      setNewGoalTargetDate(endOfYear.toISOString().split('T')[0]);
                    }}
                    style={[styles.miniPresetBtn, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}
                  >
                    <Text style={[styles.miniPresetText, { color: theme.colors.textSecondary }]}>End of Year</Text>
                  </Pressable>
                </View>
              </View>

              {/* Objectives & Key Milestones to achieve the goal */}
              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.formLabel, { color: theme.colors.textPrimary, marginBottom: 0 }]}>
                    Objectives & Key Steps {newGoalObjectives.length > 0 ? `(${newGoalObjectives.length})` : ''}
                  </Text>
                </View>
                <Text style={[styles.formHelperText, { color: theme.colors.textMuted }]}>
                  Add actionable milestones to track your progress toward this goal.
                </Text>

                {/* Add objective input row */}
                <View style={styles.addObjectiveInputRow}>
                  <TextInput
                    style={[
                      styles.formInput,
                      styles.inputWithIcon,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                      isWeb && styles.webOutlineNone,
                    ]}
                    placeholder="e.g. Complete chapter 1 & practice exercises"
                    placeholderTextColor="#94A3B8"
                    value={newObjectiveInput}
                    onChangeText={setNewObjectiveInput}
                    onSubmitEditing={handleAddObjectiveToForm}
                    returnKeyType="done"
                  />
                  <Pressable
                    onPress={handleAddObjectiveToForm}
                    style={({ pressed }) => [
                      styles.addObjectiveBtn,
                      { backgroundColor: '#4F46E5' },
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.addObjectiveBtnText}>Add</Text>
                  </Pressable>
                </View>

                {/* List of added objectives */}
                {newGoalObjectives.length > 0 && (
                  <View style={styles.addedObjectivesList}>
                    {newGoalObjectives.map((objText, oIdx) => (
                      <View
                        key={`obj-${oIdx}`}
                        style={[
                          styles.addedObjectiveItem,
                          { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                        ]}
                      >
                        <View style={styles.objectiveIndexCircle}>
                          <Text style={styles.objectiveIndexText}>{oIdx + 1}</Text>
                        </View>
                        <Text style={[styles.addedObjectiveText, { color: theme.colors.textPrimary }]}>
                          {objText}
                        </Text>
                        <Pressable
                          onPress={() => handleRemoveObjectiveFromForm(oIdx)}
                          style={styles.removeObjectiveBtn}
                          hitSlop={6}
                        >
                          <X size={14} color="#94A3B8" strokeWidth={2.2} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Priority */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.textPrimary }]}>Priority</Text>
                <View style={styles.prioritySelectorRow}>
                  {priorities.map((p) => {
                    const isSelected = newGoalPriority === p;
                    const col = getPriorityColor(p);
                    return (
                      <Pressable
                        key={p}
                        onPress={() => setNewGoalPriority(p)}
                        style={[
                          styles.prioritySelectBtn,
                          { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                          isSelected && { backgroundColor: col.bg, borderColor: col.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.prioritySelectText,
                            { color: theme.colors.textSecondary },
                            isSelected && { color: col.text, fontWeight: '800' },
                          ]}
                        >
                          {p}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionButtonsRow}>
              <Pressable
                onPress={() => setAddModalVisible(false)}
                style={[styles.modalCancelBtn, { backgroundColor: theme.colors.cardAltBg }]}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleCreateGoal}
                style={[styles.modalSubmitLimeBtn, { backgroundColor: '#4F46E5' }]}
              >
                <Text style={[styles.modalSubmitLimeText, { color: '#FFFFFF', fontWeight: '800' }]}>Create Goal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== 6B. CALENDAR PICKER MODAL ==================== */}
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.calendarModalCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            {/* Calendar Header */}
            <View style={styles.calendarHeaderRow}>
              <View>
                <Text style={styles.modalKicker}>TARGET DEADLINE</Text>
                <Text style={[styles.calendarModalTitle, { color: theme.colors.textPrimary }]}>
                  Select Completion Date
                </Text>
              </View>
              <Pressable
                onPress={() => setCalendarModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
              </Pressable>
            </View>

            {/* Month & Year Navigation */}
            {(() => {
              const currentYear = calendarViewDate.getFullYear();
              const currentMonth = calendarViewDate.getMonth();
              const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ];
              const monthName = monthNames[currentMonth];

              const handlePrevMonth = () => {
                setCalendarViewDate(new Date(currentYear, currentMonth - 1, 1));
              };

              const handleNextMonth = () => {
                setCalendarViewDate(new Date(currentYear, currentMonth + 1, 1));
              };

              const days = [];
              const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
              const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

              for (let i = firstDayIndex - 1; i >= 0; i--) {
                const d = new Date(currentYear, currentMonth - 1, prevMonthDays - i);
                days.push({ dayNum: prevMonthDays - i, isCurrentMonth: false, date: d });
              }
              for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(currentYear, currentMonth, i);
                days.push({ dayNum: i, isCurrentMonth: true, date: d });
              }
              const remaining = (7 - (days.length % 7)) % 7;
              for (let i = 1; i <= remaining; i++) {
                const d = new Date(currentYear, currentMonth + 1, i);
                days.push({ dayNum: i, isCurrentMonth: false, date: d });
              }

              const todayStr = new Date().toISOString().split('T')[0];

              return (
                <View style={styles.calendarBody}>
                  <View style={styles.monthNavRow}>
                    <Pressable
                      onPress={handlePrevMonth}
                      style={({ pressed }) => [
                        styles.monthNavBtn,
                        { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                        isWeb && styles.webPointer,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <ChevronLeft size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
                    </Pressable>

                    <Text style={[styles.monthNavTitle, { color: theme.colors.textPrimary }]}>
                      {monthName} {currentYear}
                    </Text>

                    <Pressable
                      onPress={handleNextMonth}
                      style={({ pressed }) => [
                        styles.monthNavBtn,
                        { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                        isWeb && styles.webPointer,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <ChevronRight size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
                    </Pressable>
                  </View>

                  {/* Day Names Row */}
                  <View style={styles.weekDaysHeaderRow}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
                      <Text key={wd} style={[styles.weekDayHeaderCell, { color: theme.colors.textMuted }]}>
                        {wd}
                      </Text>
                    ))}
                  </View>

                  {/* Days Grid */}
                  <View style={styles.daysGrid}>
                    {days.map((item, dIdx) => {
                      const dateIso = item.date.toISOString().split('T')[0];
                      const isToday = dateIso === todayStr;
                      const isSelected = newGoalTargetDate === dateIso;

                      return (
                        <Pressable
                          key={`cal-${dIdx}`}
                          onPress={() => {
                            setNewGoalTargetDate(dateIso);
                            setCalendarModalVisible(false);
                          }}
                          style={({ pressed }) => [
                            styles.dayCell,
                            isSelected && styles.dayCellSelected,
                            isToday && !isSelected && styles.dayCellToday,
                            isWeb && styles.webPointer,
                            pressed && styles.pressedOpacity,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayCellText,
                              { color: item.isCurrentMonth ? theme.colors.textPrimary : theme.colors.textMuted },
                              !item.isCurrentMonth && { opacity: 0.4 },
                              isSelected && styles.dayCellTextSelected,
                              isToday && !isSelected && styles.dayCellTextToday,
                            ]}
                          >
                            {item.dayNum}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Quick Preset Action Chips */}
                  <View style={styles.calendarQuickActions}>
                    <Pressable
                      onPress={() => {
                        const inMonth = new Date();
                        inMonth.setDate(inMonth.getDate() + 30);
                        setNewGoalTargetDate(inMonth.toISOString().split('T')[0]);
                        setCalendarModalVisible(false);
                      }}
                      style={[styles.calQuickChip, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}
                    >
                      <Text style={[styles.calQuickChipText, { color: theme.colors.textPrimary }]}>In 1 Month</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const inQuarter = new Date();
                        inQuarter.setDate(inQuarter.getDate() + 90);
                        setNewGoalTargetDate(inQuarter.toISOString().split('T')[0]);
                        setCalendarModalVisible(false);
                      }}
                      style={[styles.calQuickChip, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}
                    >
                      <Text style={[styles.calQuickChipText, { color: theme.colors.textPrimary }]}>In 3 Months</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const endOfYear = new Date(new Date().getFullYear(), 11, 31);
                        setNewGoalTargetDate(endOfYear.toISOString().split('T')[0]);
                        setCalendarModalVisible(false);
                      }}
                      style={[styles.calQuickChip, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}
                    >
                      <Text style={[styles.calQuickChipText, { color: '#4F46E5' }]}>End of Year</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ==================== 7. EDIT PROGRESS MODAL ==================== */}
      <Modal
        visible={editProgressModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProgressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editProgressCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <Text style={[styles.editProgressTitle, { color: theme.colors.textPrimary }]}>Update Goal Progress</Text>
            <Text style={[styles.editProgressSub, { color: theme.colors.textSecondary }]}>
              {targetOptionGoal?.title}
            </Text>

            <View style={[styles.progressNumberBox, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF', borderColor: theme.colors.border }]}>
              <Text style={styles.progressBigNumber}>{newProgressValue}%</Text>
            </View>

            {/* Quick Percentage Presets */}
            <View style={styles.percentPresetsRow}>
              {[10, 25, 50, 75, 90, 100].map((pct) => (
                <Pressable
                  key={pct}
                  onPress={() => setNewProgressValue(pct)}
                  style={[
                    styles.presetBtn,
                    { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                    newProgressValue === pct && styles.presetBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      { color: theme.colors.textSecondary },
                      newProgressValue === pct && styles.presetBtnTextActive,
                    ]}
                  >
                    {pct}%
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.customInputRow}>
              <Text style={[styles.customInputLabel, { color: theme.colors.textSecondary }]}>Custom %:</Text>
              <TextInput
                style={[styles.customProgressInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                keyboardType="numeric"
                value={String(newProgressValue)}
                onChangeText={(v) => setNewProgressValue(parseInt(v, 10) || 0)}
              />
            </View>

            <View style={styles.modalActionButtonsRow}>
              <Pressable
                onPress={() => setEditProgressModalVisible(false)}
                style={[styles.modalCancelBtn, { backgroundColor: theme.colors.cardAltBg }]}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  targetOptionGoal &&
                  handleUpdateProgress(targetOptionGoal.id, newProgressValue)
                }
                style={styles.modalSubmitPrimaryBtn}
              >
                <Text style={styles.modalSubmitPrimaryText}>Save Progress</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== 13. OPTIONS MENU MODAL ==================== */}
      <Modal
        visible={optionsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={[styles.optionsMenuCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <Text style={[styles.optionsMenuHeader, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]} numberOfLines={1}>
              {targetOptionGoal?.title}
            </Text>

            <Pressable
              onPress={() => {
                setOptionsModalVisible(false);
                if (targetOptionGoal) {
                  setSelectedGoal(targetOptionGoal);
                  setDetailsModalVisible(true);
                }
              }}
              style={styles.optionMenuItem}
            >
              <Eye size={18} color={isDarkMode ? '#818CF8' : '#4F46E5'} strokeWidth={2.2} />
              <Text style={[styles.optionMenuLabel, { color: theme.colors.textPrimary }]}>View Details</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setOptionsModalVisible(false);
                if (targetOptionGoal) {
                  setNewProgressValue(targetOptionGoal.progress);
                  setEditProgressModalVisible(true);
                }
              }}
              style={styles.optionMenuItem}
            >
              <TrendingUp size={18} color={isDarkMode ? '#818CF8' : '#4F46E5'} strokeWidth={2.2} />
              <Text style={[styles.optionMenuLabel, { color: theme.colors.textPrimary }]}>Update Progress</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setOptionsModalVisible(false);
                if (targetOptionGoal) {
                  setSelectedGoal(targetOptionGoal);
                  setNewMilestoneText('');
                  setAddMilestoneModalVisible(true);
                }
              }}
              style={styles.optionMenuItem}
            >
              <Flag size={18} color={isDarkMode ? '#818CF8' : '#4F46E5'} strokeWidth={2.2} />
              <Text style={[styles.optionMenuLabel, { color: theme.colors.textPrimary }]}>Add Milestone</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                setOptionsModalVisible(false);
                if (targetOptionGoal) {
                  const targetId = targetOptionGoal.id || targetOptionGoal._id;
                  setGoals((prev) => prev.filter((g) => (g.id !== targetId && g._id !== targetId)));
                  showToast(`Archived "${targetOptionGoal?.title}"`);
                  try {
                    const token = await getToken();
                    if (token) {
                      await updateGoal(targetId, { status: 'Archived' }, token);
                    }
                  } catch (e) {
                    console.log('Error archiving goal on server:', e);
                  }
                }
              }}
              style={styles.optionMenuItem}
            >
              <Archive size={18} color="#64748B" strokeWidth={2.2} />
              <Text style={[styles.optionMenuLabel, { color: theme.colors.textPrimary }]}>Archive Goal</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setOptionsModalVisible(false);
                setGoalToDelete(targetOptionGoal);
                setDeleteModalVisible(true);
              }}
              style={[styles.optionMenuItem, styles.optionMenuItemDanger]}
            >
              <Trash2 size={18} color="#EF4444" strokeWidth={2.2} />
              <Text style={styles.optionMenuLabelDanger}>Delete Goal</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ==================== 13. DELETE CONFIRMATION MODAL ==================== */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteConfirmCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.deleteWarningIconBox}>
              <Trash2 size={24} color="#EF4444" strokeWidth={2.2} />
            </View>
            <Text style={[styles.deleteModalTitle, { color: theme.colors.textPrimary }]}>Delete Goal?</Text>
            <Text style={[styles.deleteModalMessage, { color: theme.colors.textSecondary }]}>
              Are you sure you want to delete this goal?
            </Text>

            <View style={styles.deleteActionButtonsRow}>
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.deleteCancelBtn, { backgroundColor: theme.colors.cardAltBg }]}
              >
                <Text style={[styles.deleteCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteGoal}
                style={styles.deleteExecuteBtn}
              >
                <Text style={styles.deleteExecuteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== ADD MILESTONE MODAL ==================== */}
      <Modal
        visible={addMilestoneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMilestoneModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.smallFormCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <Text style={[styles.smallFormTitle, { color: theme.colors.textPrimary }]}>Add Milestone</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
              placeholder="e.g. Finish prototype testing"
              placeholderTextColor="#94A3B8"
              value={newMilestoneText}
              onChangeText={setNewMilestoneText}
              autoFocus
            />

            <View style={styles.modalActionButtonsRow}>
              <Pressable
                onPress={() => setAddMilestoneModalVisible(false)}
                style={[styles.modalCancelBtn, { backgroundColor: theme.colors.cardAltBg }]}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleAddMilestone}
                style={styles.modalSubmitPrimaryBtn}
              >
                <Text style={styles.modalSubmitPrimaryText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#0A0E1A',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  /* 1. HEADER */
  headerHero: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
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
  headerActionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerActionBtnActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  headerActionIcon: {
    fontSize: 15,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5', // HumanOS signature primary indigo
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 3,
  },
  searchIconLead: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13.5,
  },
  searchClearBtn: {
    color: '#94A3B8',
    fontSize: 13,
    paddingHorizontal: 4,
  },

  orbLarge: {
    position: 'absolute',
    right: -70,
    top: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#4338CA',
    opacity: 0.35,
  },
  orbSmall: {
    position: 'absolute',
    right: 60,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    opacity: 0.45,
  },

  /* 2. MAIN SHEET */
  sheetContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  /* 2. GOAL OVERVIEW */
  overviewCard: {
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
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  overviewKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  overviewTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadgeText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  overviewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  streakValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  /* 3. CATEGORIES SECTION */
  categoriesSection: {
    marginBottom: 16,
  },
  categoriesScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryChipSelected: {
    backgroundColor: '#4F46E5', // HumanOS signature indigo blue
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryChipUnselected: {
    backgroundColor: '#FFFFFF', // White/Cream appearance
    borderColor: '#E2E8F0',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF', // White text
  },
  categoryChipTextUnselected: {
    color: '#475569',
  },

  /* 4. ACTIVE GOALS SECTION */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionSub: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  sectionCounterBadge: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  goalsList: {
    gap: 12,
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalTitleCol: {
    flex: 1,
    paddingRight: 8,
  },
  goalTitleText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  goalBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  optionsDotBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  optionsDotText: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '900',
  },
  goalProgressSection: {
    marginBottom: 12,
  },
  goalProgressPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercentLabel: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  milestoneMiniText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  goalProgressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  targetDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetDateText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  floatingAddGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  quickUpdateBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickUpdateText: {
    color: '#4F46E5',
    fontSize: 11.5,
    fontWeight: '800',
  },

  /* 10. SUPPORTING HABITS */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  habitsExplainer: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 12,
  },
  habitsGrid: {
    gap: 8,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  habitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  habitIcon: {
    fontSize: 16,
  },
  habitContent: {
    flex: 1,
  },
  habitName: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '700',
  },
  habitFreq: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 2,
  },
  habitActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },

  /* 11. GOAL INSIGHTS (AI CARD) */
  insightCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  insightBadgeText: {
    color: '#6366F1',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  insightRefreshBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  insightRefreshText: {
    fontSize: 11,
    fontWeight: '700',
  },
  insightBody: {
    fontSize: 12.5,
    lineHeight: 18,
    fontStyle: 'italic',
    width: '100%',
    flexShrink: 1,
  },

  /* 8. COMPLETED GOALS */
  completedBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  completedBadgeText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  completedList: {
    gap: 8,
  },
  completedGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    opacity: 0.88,
  },
  completedCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  completedCheckMark: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '900',
  },
  completedGoalBody: {
    flex: 1,
  },
  completedGoalTitle: {
    color: '#334155',
    fontSize: 13.5,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  completedGoalSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  reopenGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginLeft: 6,
  },
  reopenGoalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },

  /* Floating Add Goal Button */
  floatingAddGoalBtn: {
    backgroundColor: '#D6EF90', // Lime Accent
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D6EF90',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  floatingAddGoalText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* EMPTY STATE */
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  emptyStateEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyStateHeading: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    color: '#64748B',
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 240,
    lineHeight: 17,
  },
  emptyStateBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* MODALS */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  modalHeaderRow: {
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
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
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

  detailMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  dateMetaBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateMetaText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  detailBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  detailBlockLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  detailBlockBody: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailProgressPercent: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '800',
  },
  detailProgressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  detailProgressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  updateProgressPrimaryBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  updateProgressPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  addMilestoneSmallBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addMilestoneSmallText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '800',
  },
  milestonesList: {
    gap: 8,
  },
  milestoneItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  milestoneCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  milestoneCheckboxActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  milestoneCheckIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  milestoneText: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  milestoneTextCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginTop: 5,
    marginRight: 10,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyDate: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  historyPercent: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
  },
  historyNote: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 1,
  },
  createdDateFooter: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },

  /* FORM STYLES */
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  formHelperText: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  formTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWithIcon: {
    flex: 1,
  },
  calendarTriggerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  miniPresetRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  miniPresetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniPresetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  addObjectiveInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addObjectiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
  },
  addObjectiveBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  addedObjectivesList: {
    marginTop: 8,
    gap: 6,
  },
  addedObjectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  objectiveIndexCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectiveIndexText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#4F46E5',
  },
  addedObjectiveText: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
  },
  removeObjectiveBtn: {
    padding: 2,
  },
  formErrorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  formErrorText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  chipsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  formChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  formChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  formChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prioritySelectBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prioritySelectText: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '600',
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
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
  modalSubmitLimeBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#D6EF90', // HumanOS Lime
    shadowColor: '#D6EF90',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSubmitLimeText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  modalSubmitPrimaryBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
  },
  modalSubmitPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* CALENDAR MODAL */
  calendarModalCard: {
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
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  calendarModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  calendarBody: {
    marginTop: 4,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  weekDaysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayHeaderCell: {
    width: 34,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#4F46E5',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },
  dayCellText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayCellTextToday: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  calendarQuickActions: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calQuickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calQuickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  /* EDIT PROGRESS CARD */
  editProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 20,
    marginBottom: 'auto',
    marginTop: 'auto',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  editProgressTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  editProgressSub: {
    color: '#64748B',
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  progressNumberBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  progressBigNumber: {
    color: '#4F46E5',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  percentPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 14,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  presetBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  presetBtnTextActive: {
    color: '#FFFFFF',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  customInputLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  customProgressInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 60,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* OPTIONS MENU MODAL */
  optionsMenuCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  optionsMenuHeader: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  optionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionMenuIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
  },
  optionMenuLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  optionMenuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    marginTop: 4,
  },
  optionMenuLabelDanger: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },

  /* DELETE CONFIRMATION */
  deleteConfirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  deleteWarningIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteWarningIcon: {
    fontSize: 22,
  },
  deleteModalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  deleteModalMessage: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  deleteCancelText: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  deleteExecuteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  deleteExecuteText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* SMALL FORM */
  smallFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  smallFormTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },

  /* TOAST */
  toastNotice: {
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
  toastText: {
    color: '#E0E7FF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
