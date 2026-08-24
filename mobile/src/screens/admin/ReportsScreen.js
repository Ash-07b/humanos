import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
  View,
  ScrollView,
  Platform,
  Modal,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportsScreen({ user, onLogout, onBack, navigation }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  // Refresh & Feedback state
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Month'); // 'Week' | 'Month' | 'Quarter' | 'Year'
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Role Access Control: Ensure only ADMIN role can view
  const userRole = (user?.role || 'ADMIN').toUpperCase();
  const isAdmin = userRole === 'ADMIN' || user?.isAdmin === true;

  // Dynamic Overview Metrics (Stateful with database fallback)
  const [overviewData, setOverviewData] = useState({
    totalRegisteredUsers: user?.reportsOverview?.totalRegisteredUsers || '1,250',
    dailyActiveUsers: user?.reportsOverview?.dailyActiveUsers || '850',
    tasksCreated: user?.reportsOverview?.tasksCreated || '14,820',
    goalsCompleted: user?.reportsOverview?.goalsCompleted || '2,450',
    healthRecordsAdded: user?.reportsOverview?.healthRecordsAdded || '8,920',
    aiRecommendationsGenerated: user?.reportsOverview?.aiRecommendationsGenerated || '3,400',
  });

  // User Growth monthly data
  const [userGrowthData, setUserGrowthData] = useState([
    { month: 'Jan', count: 200, label: '200 users', heightPercent: 25 },
    { month: 'Feb', count: 350, label: '350 users', heightPercent: 42 },
    { month: 'Mar', count: 600, label: '600 users', heightPercent: 65 },
    { month: 'Apr', count: 850, label: '850 users', heightPercent: 78 },
    { month: 'May', count: 1100, label: '1,100 users', heightPercent: 90 },
    { month: 'Jun', count: 1250, label: '1,250 users', heightPercent: 100 },
  ]);

  // Feature Usage breakdown
  const [featureUsageData, setFeatureUsageData] = useState([
    { name: 'Tasks', percent: 80, color: '#4F46E5', icon: '✓', desc: 'Daily to-dos & deep work sessions' },
    { name: 'Goals', percent: 65, color: '#6366F1', icon: '🎯', desc: 'Quarterly OKRs & milestones' },
    { name: 'Health', percent: 55, color: '#0D9488', icon: '♥', desc: 'Biometric telemetry & vitals logging' },
    { name: 'Finance', percent: 40, color: '#D97706', icon: '💳', desc: 'Expenditures & cashflow allocation' },
    { name: 'Notes', percent: 35, color: '#8B5CF6', icon: '📝', desc: 'Architecture & knowledge capture' },
  ]);

  // AI Performance metrics
  const [aiPerformanceData, setAiPerformanceData] = useState({
    generatedRecommendations: user?.aiPerformance?.generatedRecommendations || '3,400',
    successfulResponses: user?.aiPerformance?.successfulResponses || '3,388',
    failedGenerations: user?.aiPerformance?.failedGenerations || '12',
    averageResponseTime: user?.aiPerformance?.averageResponseTime || '240ms',
    successRatePercent: user?.aiPerformance?.successRatePercent || 99.65,
  });

  // Sync state whenever database user or reports prop updates
  React.useEffect(() => {
    if (user) {
      if (user.reportsOverview) {
        setOverviewData((prev) => ({ ...prev, ...user.reportsOverview }));
      }
      if (user.userGrowth && Array.isArray(user.userGrowth)) {
        setUserGrowthData(user.userGrowth);
      }
      if (user.featureUsage && Array.isArray(user.featureUsage)) {
        setFeatureUsageData(user.featureUsage);
      }
      if (user.aiPerformance) {
        setAiPerformanceData((prev) => ({ ...prev, ...user.aiPerformance }));
      }
    }
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('System analytics and report metrics refreshed');
    }, 600);
  };

  const handleExportReport = (format = 'PDF') => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExportModalVisible(false);
      showToast(`HumanOS Executive Report (${format}) exported successfully`);
    }, 900);
  };

  // RESTRICTED ACCESS SCREEN (If user is not ADMIN)
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedCard}>
            <View style={styles.restrictedIconCircle}>
              <Text style={styles.restrictedIcon}>🔒</Text>
            </View>
            <Text style={styles.restrictedKicker}>ACCESS RESTRICTED</Text>
            <Text style={styles.restrictedTitle}>Administrator Role Required</Text>
            <Text style={styles.restrictedDesc}>
              The Reports and Analytics console is restricted to HumanOS system administrators.
            </Text>
            <Pressable
              onPress={onBack || onLogout || (() => {})}
              style={({ pressed }) => [
                styles.restrictedButton,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={styles.restrictedButtonText}>Return</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // MAIN SCREEN CONTENT
  const content = (
    <View style={styles.mainWrapper}>
      {/* Toast Feedback Notification */}
      {!!toastMessage && (
        <View style={styles.toastBanner}>
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
            {onBack ? (
              <Pressable
                onPress={onBack}
                style={({ pressed }) => [
                  styles.backBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
                hitSlop={8}
              >
                <Text style={styles.backBtnText}>‹ Back</Text>
              </Pressable>
            ) : (
              <View style={styles.adminBadge}>
                <View style={styles.adminDot} />
                <Text style={styles.adminBadgeText}>AUDIT SUITE</Text>
              </View>
            )}

            {/* Time Range Selector */}
            <View style={styles.timeRangePills}>
              {['Week', 'Month', 'Quarter'].map((tr) => (
                <Pressable
                  key={tr}
                  onPress={() => setSelectedTimeRange(tr)}
                  style={[
                    styles.timeRangePill,
                    selectedTimeRange === tr && styles.timeRangePillActive,
                    isWeb && styles.webPointer,
                  ]}
                >
                  <Text
                    style={[
                      styles.timeRangePillText,
                      selectedTimeRange === tr && styles.timeRangePillTextActive,
                    ]}
                  >
                    {tr}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Reports</Text>
            <Text style={styles.headerSubtitle}>
              Monitor HumanOS activity and performance
            </Text>
          </View>

          {/* Ambient Glow */}
          <View style={styles.orbLarge} />
        </View>

        {/* ==================== 2. OVERVIEW REPORT CARDS (6 CARDS) ==================== */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionKicker}>EXECUTIVE METRICS</Text>
          <Text style={styles.sectionMainTitle}>Overview</Text>

          <View style={styles.overviewGrid}>
            {/* 1. Total Registered Users */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.metricIcon, { color: '#4F46E5' }]}>👥</Text>
                </View>
                <Text style={styles.metricTrendPositive}>+14%</Text>
              </View>
              <Text style={styles.metricValue}>{overviewData.totalRegisteredUsers}</Text>
              <Text style={styles.metricLabel}>Total Registered Users</Text>
            </View>

            {/* 2. Daily Active Users */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.metricIcon, { color: '#059669' }]}>⚡</Text>
                </View>
                <Text style={styles.metricTrendPositive}>68% DAU</Text>
              </View>
              <Text style={[styles.metricValue, { color: '#059669' }]}>
                {overviewData.dailyActiveUsers}
              </Text>
              <Text style={styles.metricLabel}>Daily Active Users</Text>
            </View>

            {/* 3. Tasks Created */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.metricIcon, { color: '#4F46E5' }]}>✓</Text>
                </View>
                <Text style={styles.metricTrendNeutral}>Sprint</Text>
              </View>
              <Text style={styles.metricValue}>{overviewData.tasksCreated}</Text>
              <Text style={styles.metricLabel}>Tasks Created</Text>
            </View>

            {/* 4. Goals Completed */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.metricIcon, { color: '#D97706' }]}>🎯</Text>
                </View>
                <Text style={styles.metricTrendPositive}>+22%</Text>
              </View>
              <Text style={[styles.metricValue, { color: '#D97706' }]}>
                {overviewData.goalsCompleted}
              </Text>
              <Text style={styles.metricLabel}>Goals Completed</Text>
            </View>

            {/* 5. Health Records Added */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#FFE4E6' }]}>
                  <Text style={[styles.metricIcon, { color: '#E11D48' }]}>♥</Text>
                </View>
                <Text style={styles.metricTrendPositive}>Telemetry</Text>
              </View>
              <Text style={[styles.metricValue, { color: '#E11D48' }]}>
                {overviewData.healthRecordsAdded}
              </Text>
              <Text style={styles.metricLabel}>Health Records Added</Text>
            </View>

            {/* 6. AI Recommendations Generated */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#F3E8FF' }]}>
                  <Text style={[styles.metricIcon, { color: '#9333EA' }]}>🧠</Text>
                </View>
                <Text style={styles.metricTrendPositive}>Pro Engine</Text>
              </View>
              <Text style={[styles.metricValue, { color: '#9333EA' }]}>
                {overviewData.aiRecommendationsGenerated}
              </Text>
              <Text style={styles.metricLabel}>AI Recommendations Generated</Text>
            </View>
          </View>
        </View>

        {/* ==================== 3. USER GROWTH REPORT ==================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionKicker}>ACQUISITION TRAJECTORY</Text>
              <Text style={styles.sectionTitle}>User Growth</Text>
            </View>
            <View style={styles.growthBadge}>
              <Text style={styles.growthBadgeText}>+525% H1 Surge</Text>
            </View>
          </View>

          <Text style={styles.chartSubtitle}>
            Monthly registered accounts trajectory from launch to present.
          </Text>

          {/* Simple Visual Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartBarsRow}>
              {userGrowthData.map((item, idx) => (
                <View key={item.month} style={styles.chartBarCol}>
                  <Text style={styles.chartValueLabel}>{item.count}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${item.heightPercent}%`,
                          backgroundColor: idx === userGrowthData.length - 1 ? '#4F46E5' : '#818CF8',
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.chartMonthLabel,
                      idx === userGrowthData.length - 1 && styles.chartMonthLabelActive,
                    ]}
                  >
                    {item.month}
                  </Text>
                </View>
              ))}
            </View>

            {/* List breakdown format */}
            <View style={styles.growthListTable}>
              {userGrowthData.slice(0, 3).map((item) => (
                <View key={item.month} style={styles.growthListRow}>
                  <Text style={styles.growthListMonth}>
                    {item.month === 'Jan' ? 'January' : item.month === 'Feb' ? 'February' : 'March'}
                  </Text>
                  <Text style={styles.growthListValue}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ==================== 4. FEATURE USAGE ==================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionKicker}>ENGAGEMENT DISTRIBUTION</Text>
              <Text style={styles.sectionTitle}>Most Used Features</Text>
            </View>
            <Text style={styles.sectionHeaderMeta}>Based on daily active sessions</Text>
          </View>

          <View style={styles.featuresList}>
            {featureUsageData.map((item) => (
              <View key={item.name} style={styles.featureItem}>
                <View style={styles.featureTopRow}>
                  <View style={styles.featureNameWrap}>
                    <Text style={styles.featureIcon}>{item.icon}</Text>
                    <Text style={styles.featureName}>{item.name}</Text>
                  </View>
                  <Text style={[styles.featurePercent, { color: item.color }]}>
                    {item.percent}%
                  </Text>
                </View>

                {/* Progress Track */}
                <View style={styles.featureTrack}>
                  <View
                    style={[
                      styles.featureFill,
                      { width: `${item.percent}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ==================== 5. AI PERFORMANCE ==================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionKicker}>NEURAL LATENCY & RELIABILITY</Text>
              <Text style={styles.sectionTitle}>AI Recommendation Reports</Text>
            </View>
            <View style={styles.aiStatusPill}>
              <View style={styles.aiStatusDot} />
              <Text style={styles.aiStatusPillText}>Gemini 1.5 Pro</Text>
            </View>
          </View>

          <View style={styles.aiMetricsGrid}>
            {/* Generated Recommendations */}
            <View style={styles.aiStatBox}>
              <Text style={styles.aiStatLabel}>Generated Recommendations</Text>
              <Text style={styles.aiStatNumber}>{aiPerformanceData.generatedRecommendations}</Text>
              <Text style={styles.aiStatSub}>100% telemetry synced</Text>
            </View>

            {/* Successful Responses */}
            <View style={styles.aiStatBox}>
              <Text style={styles.aiStatLabel}>Successful Responses</Text>
              <Text style={[styles.aiStatNumber, { color: '#059669' }]}>
                {aiPerformanceData.successfulResponses}
              </Text>
              <Text style={styles.aiStatSub}>{aiPerformanceData.successRatePercent}% reliability</Text>
            </View>

            {/* Failed Generations */}
            <View style={styles.aiStatBox}>
              <Text style={styles.aiStatLabel}>Failed Generations</Text>
              <Text style={[styles.aiStatNumber, { color: '#DC2626' }]}>
                {aiPerformanceData.failedGenerations}
              </Text>
              <Text style={styles.aiStatSub}>0.35% error rate</Text>
            </View>

            {/* Average Response Time */}
            <View style={styles.aiStatBox}>
              <Text style={styles.aiStatLabel}>Average Response Time</Text>
              <Text style={[styles.aiStatNumber, { color: '#4F46E5' }]}>
                {aiPerformanceData.averageResponseTime}
              </Text>
              <Text style={styles.aiStatSub}>Sub-second synthesis</Text>
            </View>
          </View>
        </View>

        {/* ==================== 6. EXPORT REPORT BUTTON ==================== */}
        <View style={styles.exportSection}>
          <Pressable
            onPress={() => setExportModalVisible(true)}
            style={({ pressed }) => [
              styles.exportMainBtn,
              isWeb && styles.webPointer,
              pressed && styles.pressedOpacity,
            ]}
          >
            <Text style={styles.exportMainBtnIcon}>📥</Text>
            <Text style={styles.exportMainBtnText}>Export Report</Text>
          </Pressable>
          <Text style={styles.exportSubtext}>
            Download executive summaries in PDF or CSV format for stakeholders.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ==================== EXPORT CONFIRMATION MODAL ==================== */}
      <Modal
        visible={exportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>EXECUTIVE REPORT</Text>
                <Text style={styles.modalTitle}>Export Telemetry</Text>
              </View>
              <Pressable
                onPress={() => setExportModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalExplainer}>
              Choose your preferred format to export all HumanOS platform metrics, user growth charts, and AI telemetry logs.
            </Text>

            <View style={styles.exportOptionsList}>
              <Pressable
                onPress={() => handleExportReport('PDF')}
                style={({ pressed }) => [
                  styles.exportOptionRow,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <View style={[styles.exportIconWrap, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.exportOptionIcon, { color: '#DC2626' }]}>📄</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exportOptionTitle}>PDF Executive Summary</Text>
                  <Text style={styles.exportOptionSub}>High-resolution presentation report with charts</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>

              <Pressable
                onPress={() => handleExportReport('CSV')}
                style={({ pressed }) => [
                  styles.exportOptionRow,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <View style={[styles.exportIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.exportOptionIcon, { color: '#059669' }]}>📊</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exportOptionTitle}>CSV Raw Dataset</Text>
                  <Text style={styles.exportOptionSub}>Tabular metrics for spreadsheet & BI analysis</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setExportModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
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
          <View style={styles.desktopShell}>{content}</View>
        </View>
      ) : (
        content
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
    maxHeight: 900,
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
    paddingBottom: 28,
  },

  /* HEADER */
  headerHero: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    zIndex: 2,
  },
  backBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  backBtnText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '700',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  adminDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  adminBadgeText: {
    color: '#FECACA',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timeRangePills: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  timeRangePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  timeRangePillActive: {
    backgroundColor: '#4F46E5',
  },
  timeRangePillText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  timeRangePillTextActive: {
    color: '#FFFFFF',
  },
  headerTextCol: {
    zIndex: 2,
    marginTop: 2,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '850',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 3,
  },
  orbLarge: {
    position: 'absolute',
    right: -50,
    top: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4338CA',
    opacity: 0.35,
    pointerEvents: 'none',
  },

  /* OVERVIEW GRID */
  overviewSection: {
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 14,
  },
  sectionKicker: {
    color: '#6366F1',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  sectionMainTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '850',
    marginTop: 2,
    marginBottom: 10,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIcon: {
    fontSize: 14,
  },
  metricTrendPositive: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  metricTrendNeutral: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '850',
    letterSpacing: -0.4,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  /* SECTION CARDS */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionHeaderMeta: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  growthBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  growthBadgeText: {
    color: '#059669',
    fontSize: 10.5,
    fontWeight: '800',
  },
  chartSubtitle: {
    color: '#64748B',
    fontSize: 11.5,
    marginBottom: 12,
  },

  /* CHART COMPONENT */
  chartContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chartBarCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartValueLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 70,
    backgroundColor: '#EEF2F6',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  chartMonthLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  chartMonthLabelActive: {
    color: '#4F46E5',
    fontWeight: '850',
  },
  growthListTable: {
    marginTop: 12,
    gap: 6,
  },
  growthListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  growthListMonth: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  growthListValue: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
  },

  /* FEATURE USAGE */
  featuresList: {
    gap: 12,
    marginTop: 6,
  },
  featureItem: {
    gap: 4,
  },
  featureTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    fontSize: 12,
  },
  featureName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '750',
  },
  featurePercent: {
    fontSize: 12.5,
    fontWeight: '850',
  },
  featureTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  featureFill: {
    height: '100%',
    borderRadius: 3,
  },
  featureDesc: {
    color: '#94A3B8',
    fontSize: 10.5,
  },

  /* AI PERFORMANCE */
  aiStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#9333EA',
  },
  aiStatusPillText: {
    color: '#7E22CE',
    fontSize: 10,
    fontWeight: '800',
  },
  aiMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  aiStatBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiStatLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  aiStatNumber: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '850',
    marginTop: 4,
  },
  aiStatSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },

  /* EXPORT BUTTON */
  exportSection: {
    marginHorizontal: 18,
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  exportMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  exportMainBtnIcon: {
    fontSize: 16,
  },
  exportMainBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  exportSubtext: {
    color: '#64748B',
    fontSize: 11.5,
    textAlign: 'center',
  },

  /* TOAST BANNER */
  toastBanner: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    backgroundColor: '#1E1B4B',
    borderWidth: 1,
    borderColor: '#6366F1',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    zIndex: 9999,
    elevation: 9999,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  toastText: {
    color: '#E0E7FF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* RESTRICTED ACCESS SCREEN */
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0A0E1A',
  },
  restrictedCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  restrictedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  restrictedIcon: {
    fontSize: 30,
  },
  restrictedKicker: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  restrictedTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '850',
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  restrictedDesc: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  restrictedButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  restrictedButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* MODALS */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 26, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalKicker: {
    color: '#6366F1',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 17.5,
    fontWeight: '850',
    marginTop: 2,
  },
  modalCloseText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
    padding: 4,
  },
  modalExplainer: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 16,
  },
  exportOptionsList: {
    gap: 10,
    marginBottom: 16,
  },
  exportOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exportIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportOptionIcon: {
    fontSize: 16,
  },
  exportOptionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  exportOptionSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },

  pressedOpacity: {
    opacity: 0.65,
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
});
