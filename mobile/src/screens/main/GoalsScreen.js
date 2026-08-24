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
import BottomNavigation from '../../components/BottomNavigation';

export default function GoalsScreen({ user, onLogout, onNavigateTab, navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isWeb = Platform.OS === 'web';

  const [activeTab, setActiveTab] = useState('goals');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('Dec 31');
  const [newGoalPriority, setNewGoalPriority] = useState('Medium');
  const [formError, setFormError] = useState('');

  // Goals Data (dynamically bound to database user)
  const [goals, setGoals] = useState(user?.goals || []);
  const [completedGoals, setCompletedGoals] = useState(user?.completedGoals || []);
  const supportingHabits = user?.habits || [];

  // Sync state whenever user data changes from database
  React.useEffect(() => {
    if (user) {
      if (user.goals) {
        setGoals(user.goals || []);
      }
      if (user.completedGoals) {
        setCompletedGoals(user.completedGoals || []);
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

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Goals synchronized');
    }, 600);
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
  const currentStreak = 12;

  const totalProgressSum =
    goals.reduce((acc, g) => acc + g.progress, 0) + completedGoals.length * 100;
  const overallProgress = totalGoalsCount > 0 ? Math.round(totalProgressSum / totalGoalsCount) : 0;

  // Filtered Goals
  const filteredGoals = goals.filter((g) => {
    const matchesCat = selectedCategory === 'All' || g.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Add Goal Handler
  const handleCreateGoal = () => {
    if (!newGoalTitle.trim()) {
      setFormError('Please enter a goal title.');
      return;
    }

    const created = {
      id: `g_${Date.now()}`,
      title: newGoalTitle.trim(),
      description: newGoalDesc.trim() || 'No description provided.',
      category: newGoalCategory,
      progress: 0,
      targetDate: newGoalTargetDate.trim() || 'Ongoing',
      priority: newGoalPriority,
      status: 'Active',
      createdDate: 'Today',
      progressHistory: [{ date: 'Today', progress: 0, note: 'Goal initialized' }],
      milestones: [
        { id: `m_${Date.now()}_1`, text: 'Initial scoping & plan', completed: false },
        { id: `m_${Date.now()}_2`, text: 'Execution phase 1', completed: false },
      ],
    };

    setGoals((prev) => [created, ...prev]);
    setNewGoalTitle('');
    setNewGoalDesc('');
    setFormError('');
    setAddModalVisible(false);
    showToast(`Created "${created.title}"`);
  };

  // Update Goal Progress Handler
  const handleUpdateProgress = (goalId, newProgress) => {
    const numericProgress = Math.min(100, Math.max(0, parseInt(newProgress, 10) || 0));

    if (numericProgress >= 100) {
      const target = goals.find((g) => g.id === goalId);
      if (target) {
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
        setCompletedGoals((prev) => [
          {
            id: target.id,
            title: target.title,
            category: target.category,
            completedDate: 'Today',
            progress: 100,
          },
          ...prev,
        ]);
        if (selectedGoal && selectedGoal.id === goalId) {
          setDetailsModalVisible(false);
        }
        setEditProgressModalVisible(false);
        showToast(`🎉 Goal "${target.title}" Completed!`);
        return;
      }
    }

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
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

    if (selectedGoal && selectedGoal.id === goalId) {
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
  };

  // Toggle Milestone
  const handleToggleMilestone = (goalId, milestoneId) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updatedMilestones = (g.milestones || []).map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          );
          return { ...g, milestones: updatedMilestones };
        }
        return g;
      })
    );

    if (selectedGoal && selectedGoal.id === goalId) {
      setSelectedGoal((prev) => ({
        ...prev,
        milestones: (prev.milestones || []).map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        ),
      }));
    }
  };

  // Add Milestone to Goal
  const handleAddMilestone = () => {
    if (!newMilestoneText.trim() || !selectedGoal) return;
    const newM = {
      id: `m_${Date.now()}`,
      text: newMilestoneText.trim(),
      completed: false,
    };

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === selectedGoal.id) {
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
  };

  // Delete Goal
  const handleDeleteGoal = () => {
    if (!goalToDelete) return;
    setGoals((prev) => prev.filter((g) => g.id !== goalToDelete.id));
    if (selectedGoal && selectedGoal.id === goalToDelete.id) {
      setDetailsModalVisible(false);
    }
    setDeleteModalVisible(false);
    setGoalToDelete(null);
    showToast('Goal deleted');
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
      case 'medium':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'low':
      default:
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'career':
        return '💼';
      case 'learning':
        return '📚';
      case 'finance':
        return '💰';
      case 'health':
        return '♥';
      case 'personal':
        return '🌱';
      default:
        return '🎯';
    }
  };

  const appContent = (
    <View style={styles.mainWrapper}>
      {/* Toast Notice */}
      {!!toastMessage && (
        <View style={styles.toastNotice}>
          <Text style={styles.toastText}>✓ {toastMessage}</Text>
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
              <Text style={styles.headerKicker}>ASPIRATIONS & MILESTONES</Text>
              <Text style={styles.headerTitle}>Goals</Text>
              <Text style={styles.headerSubtitle}>
                Turn your intentions into progress.
              </Text>
            </View>

            <View style={styles.headerActionBtnRow}>
              <Pressable
                onPress={() => setShowSearch(!showSearch)}
                style={({ pressed }) => [
                  styles.headerActionBtn,
                  showSearch && styles.headerActionBtnActive,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
                hitSlop={8}
              >
                <Text style={styles.headerActionIcon}>🔍</Text>
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
                <Text style={styles.headerAddBtnText}>+ Add</Text>
              </Pressable>
            </View>
          </View>

          {/* Search Bar Input */}
          {showSearch && (
            <View style={styles.searchBarContainer}>
              <Text style={styles.searchIconLead}>🔍</Text>
              <TextInput
                style={[styles.searchInput, isWeb && styles.webOutlineNone]}
                placeholder="Search goals by title..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {!!searchQuery && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                  <Text style={styles.searchClearBtn}>✕</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Background Ambient Orbs */}
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
        </View>

        {/* ==================== 2. MAIN SHEET ==================== */}
        <View style={styles.sheetContent}>
          {/* ==================== 2. GOAL OVERVIEW ==================== */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewTopRow}>
              <View>
                <Text style={styles.overviewKicker}>MACRO PROGRESSION</Text>
                <Text style={styles.overviewTitle}>My Progress</Text>
              </View>
              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeText}>{overallProgress}%</Text>
              </View>
            </View>

            {/* Horizontal Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.max(6, Math.min(100, overallProgress))}%` },
                ]}
              />
            </View>

            <View style={styles.overviewStatsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {completedCount} / {totalGoalsCount}
                </Text>
                <Text style={styles.statLabel}>Goals Completed</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statValue}>🔥 {currentStreak} days</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statValue}>{goals.length} Active</Text>
                <Text style={styles.statLabel}>In Motion</Text>
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
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      isSelected ? styles.categoryChipSelected : styles.categoryChipUnselected,
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected
                          ? styles.categoryChipTextSelected
                          : styles.categoryChipTextUnselected,
                      ]}
                    >
                      {cat !== 'All' ? `${getCategoryIcon(cat)} ` : ''}{cat}
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
              <Text style={styles.sectionTitle}>Active Goals</Text>
            </View>
            <Text style={styles.sectionCounterBadge}>{filteredGoals.length} goals</Text>
          </View>

          {filteredGoals.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateEmoji}>🎯</Text>
              <Text style={styles.emptyStateHeading}>
                {selectedCategory === 'All' ? 'No goals yet' : 'No goals in this category'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
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
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.emptyStateBtnText}>+ Create Goal</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.goalsList}>
              {filteredGoals.map((goal) => {
                const pColor = getPriorityColor(goal.priority);
                const completedMilestones = (goal.milestones || []).filter((m) => m.completed).length;
                const totalMilestones = (goal.milestones || []).length;

                return (
                  <Pressable
                    key={goal.id}
                    onPress={() => {
                      setSelectedGoal(goal);
                      setDetailsModalVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.goalCard,
                      isWeb && styles.webPointer,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={styles.goalCardTopRow}>
                      <View style={styles.goalTitleCol}>
                        <Text style={styles.goalTitleText}>{goal.title}</Text>
                        <View style={styles.goalBadgesRow}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>
                              {getCategoryIcon(goal.category)} {goal.category}
                            </Text>
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
                        <Text style={styles.optionsDotText}>⋮</Text>
                      </Pressable>
                    </View>

                    {/* Progress Percentage & Track */}
                    <View style={styles.goalProgressSection}>
                      <View style={styles.progressInfoRow}>
                        <Text style={styles.progressPercentLabel}>
                          {goal.progress}% completed
                        </Text>
                        {totalMilestones > 0 && (
                          <Text style={styles.milestoneMiniText}>
                            {completedMilestones}/{totalMilestones} milestones
                          </Text>
                        )}
                      </View>

                      <View style={styles.goalProgressBarTrack}>
                        <View
                          style={[
                            styles.goalProgressBarFill,
                            {
                              width: `${Math.max(5, Math.min(100, goal.progress))}%`,
                              backgroundColor: goal.progress >= 75 ? '#059669' : '#4F46E5',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Footer Info */}
                    <View style={styles.goalCardFooter}>
                      <Text style={styles.targetDateText}>
                        🗓 Target: {goal.targetDate}
                      </Text>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setTargetOptionGoal(goal);
                          setNewProgressValue(goal.progress);
                          setEditProgressModalVisible(true);
                        }}
                        style={styles.quickUpdateBtn}
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
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionSub}>DAILY MOMENTUM</Text>
                <Text style={styles.sectionTitle}>Supporting Habits</Text>
              </View>
            </View>
            <Text style={styles.habitsExplainer}>
              Small habits help you reach your bigger goals.
            </Text>

            <View style={styles.habitsGrid}>
              {supportingHabits.map((habit) => (
                <View key={habit.id} style={styles.habitCard}>
                  <View style={[styles.habitIconWrap, { backgroundColor: `${habit.color}18` }]}>
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                  </View>
                  <View style={styles.habitContent}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <Text style={styles.habitFreq}>{habit.frequency}</Text>
                  </View>
                  <View style={styles.habitActiveDot} />
                </View>
              ))}
            </View>
          </View>

          {/* ==================== 11. GOAL INSIGHTS (AI CARD) ==================== */}
          <View style={styles.insightCard}>
            <View style={styles.insightHeaderRow}>
              <View style={styles.insightBadge}>
                <Text style={styles.insightSparkle}>✨</Text>
                <Text style={styles.insightBadgeText}>INTELLIGENT REVIEW</Text>
              </View>
            </View>
            <Text style={styles.insightTitle}>Your Progress</Text>
            <Text style={styles.insightBody}>
              "You're making steady progress on your goals. Your strongest area this week is Learning."
            </Text>
          </View>

          {/* ==================== 8. COMPLETED GOALS ==================== */}
          {completedGoals.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionSub}>VICTORIES & ACHIEVEMENTS</Text>
                  <Text style={styles.sectionTitle}>Completed Goals</Text>
                </View>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>
                    {completedGoals.length} finished
                  </Text>
                </View>
              </View>

              <View style={styles.completedList}>
                {completedGoals.map((cg) => (
                  <View key={cg.id} style={styles.completedGoalCard}>
                    <View style={styles.completedCheckCircle}>
                      <Text style={styles.completedCheckMark}>✓</Text>
                    </View>
                    <View style={styles.completedGoalBody}>
                      <Text style={styles.completedGoalTitle}>{cg.title}</Text>
                      <Text style={styles.completedGoalSub}>
                        100% • Completed {cg.completedDate} • {cg.category}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Floating Add Goal Action */}
          <Pressable
            onPress={() => {
              setNewGoalTitle('');
              setNewGoalDesc('');
              setFormError('');
              setAddModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.floatingAddGoalBtn,
              isWeb && styles.webPointer,
              pressed && styles.pressedOpacity,
            ]}
          >
            <Text style={styles.floatingAddGoalText}>+ Add Goal</Text>
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
          <View style={styles.modalSheetCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalKicker}>GOAL SPECIFICATION</Text>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {selectedGoal?.title}
                </Text>
              </View>
              <Pressable
                onPress={() => setDetailsModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedGoal && (
                <>
                  {/* Meta Chips Row */}
                  <View style={styles.detailMetaRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {getCategoryIcon(selectedGoal.category)} {selectedGoal.category}
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

                    <View style={styles.dateMetaBadge}>
                      <Text style={styles.dateMetaText}>
                        Target: {selectedGoal.targetDate}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailBlockLabel}>Description</Text>
                    <Text style={styles.detailBlockBody}>{selectedGoal.description}</Text>
                  </View>

                  {/* Current Progress & Update Progress Button */}
                  <View style={styles.detailBlock}>
                    <View style={styles.progressHeaderRow}>
                      <Text style={styles.detailBlockLabel}>Current Progress</Text>
                      <Text style={styles.detailProgressPercent}>
                        {selectedGoal.progress}%
                      </Text>
                    </View>

                    <View style={styles.detailProgressTrack}>
                      <View
                        style={[
                          styles.detailProgressFill,
                          { width: `${selectedGoal.progress}%` },
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
                  <View style={styles.detailBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.detailBlockLabel}>Milestones</Text>
                      <Pressable
                        onPress={() => {
                          setNewMilestoneText('');
                          setAddMilestoneModalVisible(true);
                        }}
                        style={styles.addMilestoneSmallBtn}
                      >
                        <Text style={styles.addMilestoneSmallText}>+ Milestone</Text>
                      </Pressable>
                    </View>

                    <View style={styles.milestonesList}>
                      {(selectedGoal.milestones || []).map((m) => (
                        <Pressable
                          key={m.id}
                          onPress={() => handleToggleMilestone(selectedGoal.id, m.id)}
                          style={styles.milestoneItemRow}
                        >
                          <View
                            style={[
                              styles.milestoneCheckbox,
                              m.completed && styles.milestoneCheckboxActive,
                            ]}
                          >
                            {m.completed && (
                              <Text style={styles.milestoneCheckIcon}>✓</Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.milestoneText,
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
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailBlockLabel}>Progress History</Text>
                    <View style={styles.historyList}>
                      {(selectedGoal.progressHistory || []).map((h, idx) => (
                        <View key={idx} style={styles.historyItem}>
                          <View style={styles.historyDot} />
                          <View style={styles.historyContent}>
                            <View style={styles.historyHeader}>
                              <Text style={styles.historyDate}>{h.date}</Text>
                              <Text style={styles.historyPercent}>{h.progress}%</Text>
                            </View>
                            <Text style={styles.historyNote}>{h.note}</Text>
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
          <View style={styles.modalSheetCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalKicker}>NEW OBJECTIVE</Text>
                <Text style={styles.modalTitle}>Create New Goal</Text>
              </View>
              <Pressable
                onPress={() => setAddModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={styles.formLabel}>Goal Title *</Text>
                <TextInput
                  style={[styles.formInput, isWeb && styles.webOutlineNone]}
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
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, isWeb && styles.webOutlineNone]}
                  placeholder="What does success look like?"
                  placeholderTextColor="#94A3B8"
                  value={newGoalDesc}
                  onChangeText={setNewGoalDesc}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.chipsWrapRow}>
                  {formCategories.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setNewGoalCategory(cat)}
                      style={[
                        styles.formChip,
                        newGoalCategory === cat && styles.formChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.formChipText,
                          newGoalCategory === cat && styles.formChipTextActive,
                        ]}
                      >
                        {getCategoryIcon(cat)} {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Target Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Target Date</Text>
                <TextInput
                  style={[styles.formInput, isWeb && styles.webOutlineNone]}
                  placeholder="e.g. December 31 or Q4 2026"
                  placeholderTextColor="#94A3B8"
                  value={newGoalTargetDate}
                  onChangeText={setNewGoalTargetDate}
                />
              </View>

              {/* Priority */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
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
                          isSelected && { backgroundColor: col.bg, borderColor: col.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.prioritySelectText,
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
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleCreateGoal}
                style={styles.modalSubmitLimeBtn}
              >
                <Text style={styles.modalSubmitLimeText}>Create Goal</Text>
              </Pressable>
            </View>
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
          <View style={styles.editProgressCard}>
            <Text style={styles.editProgressTitle}>Update Goal Progress</Text>
            <Text style={styles.editProgressSub}>
              {targetOptionGoal?.title}
            </Text>

            <View style={styles.progressNumberBox}>
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
                    newProgressValue === pct && styles.presetBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      newProgressValue === pct && styles.presetBtnTextActive,
                    ]}
                  >
                    {pct}%
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.customInputRow}>
              <Text style={styles.customInputLabel}>Custom %:</Text>
              <TextInput
                style={styles.customProgressInput}
                keyboardType="numeric"
                value={String(newProgressValue)}
                onChangeText={(v) => setNewProgressValue(parseInt(v, 10) || 0)}
              />
            </View>

            <View style={styles.modalActionButtonsRow}>
              <Pressable
                onPress={() => setEditProgressModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
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
          <View style={styles.optionsMenuCard}>
            <Text style={styles.optionsMenuHeader} numberOfLines={1}>
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
              <Text style={styles.optionMenuIcon}>👁️</Text>
              <Text style={styles.optionMenuLabel}>View Details</Text>
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
              <Text style={styles.optionMenuIcon}>📊</Text>
              <Text style={styles.optionMenuLabel}>Update Progress</Text>
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
              <Text style={styles.optionMenuIcon}>🚩</Text>
              <Text style={styles.optionMenuLabel}>Add Milestone</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setOptionsModalVisible(false);
                showToast(`Archived "${targetOptionGoal?.title}"`);
              }}
              style={styles.optionMenuItem}
            >
              <Text style={styles.optionMenuIcon}>📦</Text>
              <Text style={styles.optionMenuLabel}>Archive Goal</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setOptionsModalVisible(false);
                setGoalToDelete(targetOptionGoal);
                setDeleteModalVisible(true);
              }}
              style={[styles.optionMenuItem, styles.optionMenuItemDanger]}
            >
              <Text style={styles.optionMenuIcon}>🗑️</Text>
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
          <View style={styles.deleteConfirmCard}>
            <View style={styles.deleteWarningIconBox}>
              <Text style={styles.deleteWarningIcon}>🗑️</Text>
            </View>
            <Text style={styles.deleteModalTitle}>Delete Goal?</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete this goal?
            </Text>

            <View style={styles.deleteActionButtonsRow}>
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                style={styles.deleteCancelBtn}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
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
          <View style={styles.smallFormCard}>
            <Text style={styles.smallFormTitle}>Add Milestone</Text>
            <TextInput
              style={[styles.formInput, isWeb && styles.webOutlineNone]}
              placeholder="e.g. Finish prototype testing"
              placeholderTextColor="#94A3B8"
              value={newMilestoneText}
              onChangeText={setNewMilestoneText}
              autoFocus
            />

            <View style={styles.modalActionButtonsRow}>
              <Pressable
                onPress={() => setAddMilestoneModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
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
    backgroundColor: '#F8FAFC',
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
    borderRadius: 19,
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
    backgroundColor: '#D6EF90', // HumanOS Lime Accent
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    shadowColor: '#D6EF90',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAddBtnText: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '800',
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
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  overviewKicker: {
    color: '#059669', // Dark Green
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  overviewTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: '#DCFCE7', // Light green
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  progressBadgeText: {
    color: '#059669', // Dark green
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#DCFCE7', // Light green track
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669', // Dark green progress
    borderRadius: 5,
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
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryChipSelected: {
    backgroundColor: '#183D30', // Dark green background
    borderColor: '#183D30',
    shadowColor: '#183D30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressPercentLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  milestoneMiniText: {
    color: '#64748B',
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
  targetDateText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: '#10B981',
  },

  /* 11. GOAL INSIGHTS (AI CARD) */
  insightCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    gap: 4,
  },
  insightSparkle: {
    fontSize: 11,
  },
  insightBadgeText: {
    color: '#C7D2FE',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  insightTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  insightBody: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },

  /* 8. COMPLETED GOALS */
  completedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  completedBadgeText: {
    color: '#059669',
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
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  completedCheckMark: {
    color: '#059669',
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
    backgroundColor: '#D6EF90',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyStateBtnText: {
    color: '#0F172A',
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
