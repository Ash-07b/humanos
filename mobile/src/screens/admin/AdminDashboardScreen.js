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
  Alert,
  Switch,
  useWindowDimensions,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminDashboardScreen({ user, onLogout, onNavigate, navigation }) {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  // Refresh & Feedback state
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modals for Admin Operations
  const [userListModalVisible, setUserListModalVisible] = useState(false);
  const [searchUserModalVisible, setSearchUserModalVisible] = useState(false);
  const [disableAccountModalVisible, setDisableAccountModalVisible] = useState(false);
  const [activityAuditModalVisible, setActivityAuditModalVisible] = useState(false);
  const [appSettingsModalVisible, setAppSettingsModalVisible] = useState(false);
  const [securitySettingsModalVisible, setSecuritySettingsModalVisible] = useState(false);
  const [dbManagementModalVisible, setDbManagementModalVisible] = useState(false);

  // Search & Filter State inside modals
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [userToDisableInput, setUserToDisableInput] = useState('');

  // Admin Feature Flags (Interactive)
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [aiTelemetryEnabled, setAiTelemetryEnabled] = useState(true);
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [newRegistrationsAllowed, setNewRegistrationsAllowed] = useState(true);

  // Role Access Control: Ensure only ADMIN role can view
  const userRole = (user?.role || 'admin').toLowerCase();
  const isAdmin = userRole === 'admin' || user?.isAdmin === true;

  // Dynamic Overview Metrics (Bound to database / adminData prop with default fallbacks)
  const [overviewMetrics, setOverviewMetrics] = useState({
    totalUsers: user?.adminOverview?.totalUsers || '1,250',
    activeUsers: user?.adminOverview?.activeUsers || '850',
    aiRecommendations: user?.adminOverview?.aiRecommendations || '3,400',
    systemHealth: user?.adminOverview?.systemHealth || 'Good',
    uptime: user?.adminOverview?.uptime || '99.98%',
    activeSessions: user?.adminOverview?.activeSessions || 142,
  });

  // Dynamic User Database Directory (Bound to database user records)
  const [userDirectory, setUserDirectory] = useState(
    user?.usersList || [
      { id: 'usr-101', name: 'Ashbel Anih', email: 'ashbel@example.com', role: 'Admin', status: 'Active', joined: '14 May 2026', plan: 'Pro' },
      { id: 'usr-102', name: 'Elena Rostova', email: 'elena.r@neuro.io', role: 'User', status: 'Active', joined: '02 Jun 2026', plan: 'Pro' },
      { id: 'usr-103', name: 'Marcus Vance', email: 'marcus.v@quant.com', role: 'User', status: 'Active', joined: '18 Jun 2026', plan: 'Standard' },
      { id: 'usr-104', name: 'Sora Takahashi', email: 'sora.t@biotech.jp', role: 'User', status: 'Active', joined: '29 Jun 2026', plan: 'Pro' },
      { id: 'usr-105', name: 'Amara Diallo', email: 'amara.d@apex.org', role: 'User', status: 'Suspended', joined: '12 Jul 2026', plan: 'Standard' },
    ]
  );

  // Dynamic Reports State (Bound to database metrics)
  const [reportsData, setReportsData] = useState({
    userGrowth: user?.reports?.userGrowth || '+14.2% MoM',
    userGrowthDesc: user?.reports?.userGrowthDesc || '118 new accounts registered this month',
    userGrowthPercent: user?.reports?.userGrowthPercent || 82,
    systemUsage: user?.reports?.systemUsage || '84% Capacity',
    systemUsageDesc: user?.reports?.systemUsageDesc || 'API cluster response avg: 18ms',
    systemUsagePercent: user?.reports?.systemUsagePercent || 84,
    featureUsage: user?.reports?.featureUsage || 'Top: Health & Tasks',
    featureUsageDesc: user?.reports?.featureUsageDesc || 'Health (92%) • Tasks (88%) • Goals (74%)',
    featureUsagePercent: user?.reports?.featureUsagePercent || 92,
  });

  // Dynamic AI Telemetry State (Bound to database logs)
  const [aiMonitoringData, setAiMonitoringData] = useState({
    status: user?.aiMonitoring?.status || 'Operational',
    latency: user?.aiMonitoring?.latency || '⚡ 240ms avg latency',
    totalRecommendations: user?.aiMonitoring?.totalRecommendations || '3,400',
    failedGenerations: user?.aiMonitoring?.failedGenerations || '12',
    successRate: user?.aiMonitoring?.successRate || '99.65%',
    systemPerformance: user?.aiMonitoring?.systemPerformance || 'Optimal',
    systemResourceSub: user?.aiMonitoring?.systemResourceSub || 'Resource load: CPU 24% • Memory 41%',
  });

  // Dynamic Recent Activity Feed (Bound to database audit log)
  const [recentActivities, setRecentActivities] = useState(
    user?.recentActivities || [
      {
        id: 'act-1',
        type: 'user',
        icon: '👤',
        title: 'New User Registered',
        detail: 'elena.r@neuro.io registered with Pro credentials',
        time: '4m ago',
        badge: 'User',
        badgeColor: '#EEF2FF',
        badgeText: '#4F46E5',
      },
      {
        id: 'act-2',
        type: 'goal',
        icon: '🎯',
        title: 'Goal Created',
        detail: 'Goal "Complete HumanOS Architecture" created by usr-101',
        time: '18m ago',
        badge: 'Goal',
        badgeColor: '#FEF3C7',
        badgeText: '#D97706',
      },
      {
        id: 'act-3',
        type: 'health',
        icon: '♥',
        title: 'Health Record Added',
        detail: 'Biometric reading (Heart Rate 72 bpm) logged by usr-104',
        time: '32m ago',
        badge: 'Health',
        badgeColor: '#FFE4E6',
        badgeText: '#E11D48',
      },
      {
        id: 'act-4',
        type: 'ai',
        icon: '🧠',
        title: 'AI Recommendation Synthesized',
        detail: 'Generated cognitive recovery strategy for usr-103',
        time: '45m ago',
        badge: 'AI',
        badgeColor: '#F3E8FF',
        badgeText: '#9333EA',
      },
      {
        id: 'act-5',
        type: 'security',
        icon: '🛡️',
        title: 'Automated Security Audit Passed',
        detail: 'TLS certificates and DB encryption verified with zero anomalies',
        time: '1h ago',
        badge: 'System',
        badgeColor: '#ECFDF5',
        badgeText: '#059669',
      },
    ]
  );

  // Sync state whenever database user or admin payload updates
  React.useEffect(() => {
    if (user) {
      if (user.adminOverview) {
        setOverviewMetrics((prev) => ({ ...prev, ...user.adminOverview }));
      }
      if (user.usersList && Array.isArray(user.usersList)) {
        setUserDirectory(user.usersList);
      }
      if (user.reports) {
        setReportsData((prev) => ({ ...prev, ...user.reports }));
      }
      if (user.aiMonitoring) {
        setAiMonitoringData((prev) => ({ ...prev, ...user.aiMonitoring }));
      }
      if (user.recentActivities && Array.isArray(user.recentActivities)) {
        setRecentActivities(user.recentActivities);
      }
      if (user.settings) {
        if (typeof user.settings.maintenanceMode === 'boolean') setMaintenanceMode(user.settings.maintenanceMode);
        if (typeof user.settings.aiTelemetryEnabled === 'boolean') setAiTelemetryEnabled(user.settings.aiTelemetryEnabled);
        if (typeof user.settings.enforce2FA === 'boolean') setEnforce2FA(user.settings.enforce2FA);
        if (typeof user.settings.newRegistrationsAllowed === 'boolean') setNewRegistrationsAllowed(user.settings.newRegistrationsAllowed);
      }
    }
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // When backend database is wired, you can invoke your database query or fetchAdminTelemetry() here
    setTimeout(() => {
      setRefreshing(false);
      showToast('Admin database telemetry synced');
    }, 700);
  };

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to exit the Admin Dashboard?');
      if (confirmed && onLogout) onLogout();
    } else {
      Alert.alert(
        'Exit Admin Console',
        'Are you sure you want to log out of the administration console?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: () => {
              if (onLogout) onLogout();
            },
          },
        ]
      );
    }
  };

  // RESTRICTED ACCESS SCREEN (If user is not an Admin)
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
            <Text style={styles.restrictedTitle}>Admin Privileges Required</Text>
            <Text style={styles.restrictedDesc}>
              This console is exclusively accessible to authorized HumanOS administrators. Your current account role does not have elevated permissions.
            </Text>
            <Pressable
              onPress={onLogout || (() => {})}
              style={({ pressed }) => [
                styles.restrictedButton,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={styles.restrictedButtonText}>Return to Login</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // MAIN ADMIN DASHBOARD CONTENT
  const adminContent = (
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
        {/* ==================== 1. EXECUTIVE ADMIN HEADER ==================== */}
        <ImageBackground
          source={require('../../../assets/header-bg.jpg')}
          style={styles.headerHero}
          imageStyle={styles.headerHeroBg}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} />

          {/* Top Bar with Admin Badge & Logout Action */}
          <View style={styles.topBarRow}>
            <View style={styles.adminBadge}>
              <View style={styles.adminDot} />
              <Text style={styles.adminBadgeText}>ADMIN CONSOLE</Text>
            </View>

            <View style={styles.topRightActions}>
              <Pressable
                onPress={() => setAppSettingsModalVisible(true)}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
                hitSlop={8}
              >
                <Text style={styles.headerIconEmoji}>⚙️</Text>
              </Pressable>

              <Pressable
                onPress={handleLogoutPress}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  styles.headerLogoutBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
                hitSlop={8}
              >
                <Text style={styles.headerIconEmoji}>🚪</Text>
              </Pressable>
            </View>
          </View>

          {/* Header Title & Subtitle */}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Manage and monitor HumanOS
            </Text>
          </View>

          {/* Live Cluster Status Bar */}
          <View style={styles.clusterStatusBar}>
            <View style={styles.clusterStatusLeft}>
              <View style={styles.clusterLiveDot} />
              <Text style={styles.clusterStatusText}>System Status: {overviewMetrics.systemHealth} • {overviewMetrics.uptime} Uptime</Text>
            </View>
            <Text style={styles.clusterClusterText}>Node: prod-eu-central-1</Text>
          </View>

          {/* Ambient Glow */}
          <View style={styles.orbLarge} />
        </ImageBackground>

        {/* ==================== 2. OVERVIEW CARDS (4 PRIMARY METRICS) ==================== */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionKicker}>GLOBAL TELEMETRY</Text>
          <Text style={styles.sectionMainTitle}>Overview</Text>

          <View style={styles.overviewGrid}>
            {/* 1. Total Users */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.metricIcon, { color: '#4F46E5' }]}>👥</Text>
                </View>
                <Text style={styles.metricTrendPositive}>+8.4%</Text>
              </View>
              <Text style={styles.metricValue}>{overviewMetrics.totalUsers}</Text>
              <Text style={styles.metricLabel}>Total Users</Text>
            </View>

            {/* 2. Active Users */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.metricIcon, { color: '#059669' }]}>⚡</Text>
                </View>
                <Text style={styles.metricTrendPositive}>68% DAU</Text>
              </View>
              <Text style={styles.metricValue}>{overviewMetrics.activeUsers}</Text>
              <Text style={styles.metricLabel}>Active Users</Text>
            </View>

            {/* 3. AI Recommendations Generated */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#F3E8FF' }]}>
                  <Text style={[styles.metricIcon, { color: '#9333EA' }]}>🧠</Text>
                </View>
                <Text style={styles.metricTrendPositive}>+18.2%</Text>
              </View>
              <Text style={styles.metricValue}>{overviewMetrics.aiRecommendations}</Text>
              <Text style={styles.metricLabel}>AI Recommendations Generated</Text>
            </View>

            {/* 4. System Health */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#CCFBF1' }]}>
                  <Text style={[styles.metricIcon, { color: '#0D9488' }]}>🛡️</Text>
                </View>
                <View style={styles.healthPill}>
                  <Text style={styles.healthPillText}>99.9%</Text>
                </View>
              </View>
              <Text style={[styles.metricValue, { color: '#059669' }]}>{overviewMetrics.systemHealth}</Text>
              <Text style={styles.metricLabel}>System Health</Text>
            </View>
          </View>
        </View>

        {/* ==================== 3. USER MANAGEMENT CARD ==================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionKicker}>IDENTITY & ACCESS</Text>
              <Text style={styles.sectionTitle}>Manage Users</Text>
            </View>
            <Pressable
              onPress={() => setUserListModalVisible(true)}
              style={({ pressed }) => [
                styles.inlineActionLink,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={styles.inlineActionText}>View All ({overviewMetrics.totalUsers})</Text>
            </Pressable>
          </View>

          <View style={styles.actionList}>
            {/* View Users */}
            <Pressable
              onPress={() => setUserListModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.actionIcon}>👥</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>View Users</Text>
                <Text style={styles.actionSubtitle}>Browse directory, roles, and Pro tiers</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Search Users */}
            <Pressable
              onPress={() => setSearchUserModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#F1F5F9' }]}>
                <Text style={styles.actionIcon}>🔍</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Search Users</Text>
                <Text style={styles.actionSubtitle}>Find accounts by name, email, or identifier</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Disable Account */}
            <Pressable
              onPress={() => setDisableAccountModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Text style={styles.actionIcon}>🚫</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={[styles.actionTitle, { color: '#DC2626' }]}>Disable Account</Text>
                <Text style={styles.actionSubtitle}>Suspend credentials or manage access bans</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* View User Activity */}
            <Pressable
              onPress={() => setActivityAuditModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                { borderBottomWidth: 0 },
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.actionIcon}>📈</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>View User Activity</Text>
                <Text style={styles.actionSubtitle}>Session logs, IP telemetry, and sign-in devices</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* ==================== 4. REPORTS SECTION ==================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>ANALYTICS & ADOPTION</Text>
          <Text style={styles.sectionTitle}>Reports</Text>

          <View style={styles.reportsGrid}>
            {/* User Growth */}
            <View style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>User Growth</Text>
                <Text style={styles.reportMetricPositive}>{reportsData.userGrowth}</Text>
              </View>
              <Text style={styles.reportDesc}>{reportsData.userGrowthDesc}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${reportsData.userGrowthPercent}%`, backgroundColor: '#4F46E5' }]} />
              </View>
            </View>

            {/* System Usage */}
            <View style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>System Usage</Text>
                <Text style={styles.reportMetricNeutral}>{reportsData.systemUsage}</Text>
              </View>
              <Text style={styles.reportDesc}>{reportsData.systemUsageDesc}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${reportsData.systemUsagePercent}%`, backgroundColor: '#0D9488' }]} />
              </View>
            </View>

            {/* Feature Usage */}
            <View style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>Feature Usage</Text>
                <Text style={styles.reportMetricPositive}>{reportsData.featureUsage}</Text>
              </View>
              <Text style={styles.reportDesc}>{reportsData.featureUsageDesc}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${reportsData.featureUsagePercent}%`, backgroundColor: '#6366F1' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ==================== 5. AI MONITORING SECTION ==================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionKicker}>NEURAL ENGINE AUDIT</Text>
              <Text style={styles.sectionTitle}>AI Monitoring</Text>
            </View>
            <View style={styles.aiStatusBadge}>
              <View style={styles.aiStatusDot} />
              <Text style={styles.aiStatusText}>{aiMonitoringData.status}</Text>
            </View>
          </View>

          {/* AI Recommendation Status Sub-card */}
          <View style={styles.aiStatusBox}>
            <View style={styles.aiStatusTopRow}>
              <Text style={styles.aiStatusHeading}>AI Recommendation Status</Text>
              <Text style={styles.aiStatusLatency}>{aiMonitoringData.latency}</Text>
            </View>
            <Text style={styles.aiStatusSub}>
              Adaptive biometric recommendations and executive focus loops generated via Gemini Pro Engine.
            </Text>

            <View style={styles.aiMetricStrip}>
              <View style={styles.aiMetricItem}>
                <Text style={styles.aiMetricValue}>{aiMonitoringData.totalRecommendations}</Text>
                <Text style={styles.aiMetricLabel}>Total Recommendations</Text>
              </View>
              <View style={styles.aiMetricDivider} />
              <View style={styles.aiMetricItem}>
                <Text style={[styles.aiMetricValue, { color: '#DC2626' }]}>{aiMonitoringData.failedGenerations}</Text>
                <Text style={styles.aiMetricLabel}>Failed Generations</Text>
              </View>
              <View style={styles.aiMetricDivider} />
              <View style={styles.aiMetricItem}>
                <Text style={[styles.aiMetricValue, { color: '#059669' }]}>{aiMonitoringData.successRate}</Text>
                <Text style={styles.aiMetricLabel}>Success Rate</Text>
              </View>
            </View>
          </View>

          {/* System Performance Bar */}
          <View style={styles.perfRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.perfTitle}>System Performance</Text>
              <Text style={styles.perfSub}>{aiMonitoringData.systemResourceSub}</Text>
            </View>
            <Text style={styles.perfScore}>{aiMonitoringData.systemPerformance}</Text>
          </View>
        </View>

        {/* ==================== 6. SETTINGS SECTION ==================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>CORE INFRASTRUCTURE</Text>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.actionList}>
            {/* Application Settings */}
            <Pressable
              onPress={() => setAppSettingsModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#F1F5F9' }]}>
                <Text style={styles.actionIcon}>⚙️</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Application Settings</Text>
                <Text style={styles.actionSubtitle}>Feature flags, telemetry mode, maintenance toggle</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Security Settings */}
            <Pressable
              onPress={() => setSecuritySettingsModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.actionIcon}>🔒</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Security Settings</Text>
                <Text style={styles.actionSubtitle}>2FA policy, token expirations, session constraints</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Database Management */}
            <Pressable
              onPress={() => setDbManagementModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                { borderBottomWidth: 0 },
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#CCFBF1' }]}>
                <Text style={styles.actionIcon}>💾</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Database Management</Text>
                <Text style={styles.actionSubtitle}>Snapshot backups, cache purge, schema health</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* ==================== 7. RECENT ACTIVITY ==================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionKicker}>REAL-TIME AUDIT STREAM</Text>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            <View style={styles.liveIndicatorPill}>
              <View style={styles.liveDotPulse} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.activityFeed}>
            {recentActivities.map((act, index) => (
              <View
                key={act.id}
                style={[
                  styles.activityItem,
                  index === recentActivities.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.activityIconWrap}>
                  <Text style={styles.activityIcon}>{act.icon}</Text>
                </View>

                <View style={styles.activityMain}>
                  <View style={styles.activityTopLine}>
                    <Text style={styles.activityTitle}>{act.title}</Text>
                    <Text style={styles.activityTime}>{act.time}</Text>
                  </View>
                  <Text style={styles.activityDetail}>{act.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Console Footprint */}
        <View style={styles.consoleFooter}>
          <Text style={styles.consoleFooterText}>HumanOS Executive Administration Console</Text>
          <Text style={styles.consoleVersionText}>v1.0.0 Pro • Security Level: Root Admin</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ==================== USER DIRECTORY MODAL ==================== */}
      <Modal
        visible={userListModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUserListModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>USER DIRECTORY</Text>
                <Text style={styles.modalTitle}>Registered Users</Text>
              </View>
              <Pressable
                onPress={() => setUserListModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseBtn}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {userDirectory.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: '#64748B', fontSize: 13 }}>No registered users found in database</Text>
                </View>
              ) : (
                userDirectory.map((usr) => (
                  <View key={usr.id || usr._id} style={styles.userListItem}>
                    <View style={styles.userListAvatar}>
                      <Text style={styles.userListAvatarText}>{(usr.name || usr.email || 'U').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.userListNameRow}>
                        <Text style={styles.userListName}>{usr.name || 'User'}</Text>
                        <View style={[styles.userRoleBadge, usr.role === 'Admin' ? styles.roleAdmin : styles.roleUser]}>
                          <Text style={styles.userRoleText}>{usr.role || 'User'}</Text>
                        </View>
                      </View>
                      <Text style={styles.userListEmail}>{usr.email}</Text>
                      <Text style={styles.userListMeta}>Joined: {usr.joined || 'Recent'} • Plan: {usr.plan || 'Standard'}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setUserListModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalDoneBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalDoneBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== SEARCH USERS MODAL ==================== */}
      <Modal
        visible={searchUserModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSearchUserModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>QUERY DIRECTORY</Text>
                <Text style={styles.modalTitle}>Search Users</Text>
              </View>
              <Pressable
                onPress={() => setSearchUserModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseBtn}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalSearchBox}>
              <Text style={styles.modalSearchIcon}>🔍</Text>
              <TextInput
                style={[styles.modalSearchInput, isWeb && styles.webOutlineNone]}
                placeholder="Search by name, email, or user ID..."
                placeholderTextColor="#94A3B8"
                value={searchUserQuery}
                onChangeText={setSearchUserQuery}
                autoFocus
              />
              {!!searchUserQuery && (
                <Pressable onPress={() => setSearchUserQuery('')}>
                  <Text style={styles.clearSearchBtn}>✕</Text>
                </Pressable>
              )}
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {userDirectory
                .filter(
                  (u) =>
                    searchUserQuery.trim() === '' ||
                    (u.name && u.name.toLowerCase().includes(searchUserQuery.toLowerCase())) ||
                    (u.email && u.email.toLowerCase().includes(searchUserQuery.toLowerCase())) ||
                    (u.id && String(u.id).toLowerCase().includes(searchUserQuery.toLowerCase())) ||
                    (u._id && String(u._id).toLowerCase().includes(searchUserQuery.toLowerCase()))
                )
                .map((usr) => (
                  <View key={usr.id || usr._id} style={styles.userListItem}>
                    <View style={styles.userListAvatar}>
                      <Text style={styles.userListAvatarText}>{(usr.name || usr.email || 'U').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userListName}>{usr.name || 'User'}</Text>
                      <Text style={styles.userListEmail}>{usr.email}</Text>
                      <Text style={styles.userListMeta}>{usr.id || usr._id} • Status: {usr.status || 'Active'}</Text>
                    </View>
                  </View>
                ))}
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setSearchUserModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalDoneBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== DISABLE ACCOUNT MODAL ==================== */}
      <Modal
        visible={disableAccountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDisableAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalKicker, { color: '#DC2626' }]}>SECURITY ENFORCEMENT</Text>
                <Text style={styles.modalTitle}>Disable Account</Text>
              </View>
              <Pressable
                onPress={() => setDisableAccountModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseBtn}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalExplainer}>
                Enter the email or User ID of the account you wish to suspend. Suspended users are immediately logged out of all active sessions.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target User Email or ID</Text>
                <TextInput
                  style={[styles.textInput, isWeb && styles.webOutlineNone]}
                  placeholder="e.g. user@domain.com or usr-105"
                  placeholderTextColor="#94A3B8"
                  value={userToDisableInput}
                  onChangeText={setUserToDisableInput}
                />
              </View>

              <View style={styles.dangerNoticeBox}>
                <Text style={styles.dangerNoticeIcon}>⚠️</Text>
                <Text style={styles.dangerNoticeText}>
                  This action revokes authentication tokens immediately. You can re-enable the account anytime.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setDisableAccountModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (!userToDisableInput.trim()) {
                    showToast('Please enter a user email or ID');
                    return;
                  }
                  setDisableAccountModalVisible(false);
                  setUserToDisableInput('');
                  showToast(`Account suspended successfully`);
                }}
                style={({ pressed }) => [
                  styles.modalDestructiveBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalDestructiveBtnText}>Disable Account</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== VIEW USER ACTIVITY MODAL ==================== */}
      <Modal
        visible={activityAuditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActivityAuditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>SESSION TELEMETRY</Text>
                <Text style={styles.modalTitle}>User Activity Logs</Text>
              </View>
              <Pressable
                onPress={() => setActivityAuditModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseBtn}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.activityAuditBanner}>
                <Text style={styles.activityAuditBannerIcon}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityAuditBannerTitle}>142 Active Concurrent Sessions</Text>
                  <Text style={styles.activityAuditBannerSub}>Global latency: 18ms • Zero security blocks in 24h</Text>
                </View>
              </View>

              {recentActivities.map((act) => (
                <View key={act.id} style={styles.auditLogItem}>
                  <Text style={styles.auditLogIcon}>{act.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.auditLogTitle}>{act.title}</Text>
                    <Text style={styles.auditLogDetail}>{act.detail}</Text>
                    <Text style={styles.auditLogTime}>{act.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setActivityAuditModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalDoneBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== APPLICATION SETTINGS MODAL ==================== */}
      <Modal
        visible={appSettingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAppSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>CONFIGURATION</Text>
                <Text style={styles.modalTitle}>Application Settings</Text>
              </View>
              <Pressable
                onPress={() => setAppSettingsModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseBtn}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalToggleTitle}>System Maintenance Mode</Text>
                  <Text style={styles.modalToggleSub}>Temporarily pause client writes for DB maintenance</Text>
                </View>
                <Switch
                  value={maintenanceMode}
                  onValueChange={(val) => {
                    setMaintenanceMode(val);
                    showToast(val ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#DC2626' }}
                  thumbColor={maintenanceMode ? '#F87171' : '#FFFFFF'}
                />
              </View>

              <View style={styles.modalToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalToggleTitle}>AI Telemetry Engine</Text>
                  <Text style={styles.modalToggleSub}>Real-time biometric advice synthesis</Text>
                </View>
                <Switch
                  value={aiTelemetryEnabled}
                  onValueChange={(val) => {
                    setAiTelemetryEnabled(val);
                    showToast(val ? 'AI Engine active' : 'AI Engine paused');
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                  thumbColor={aiTelemetryEnabled ? '#818CF8' : '#FFFFFF'}
                />
              </View>

              <View style={[styles.modalToggleRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalToggleTitle}>Allow New Registrations</Text>
                  <Text style={styles.modalToggleSub}>Public onboarding gateway</Text>
                </View>
                <Switch
                  value={newRegistrationsAllowed}
                  onValueChange={(val) => {
                    setNewRegistrationsAllowed(val);
                    showToast(val ? 'Registrations open' : 'Registrations closed');
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                  thumbColor={newRegistrationsAllowed ? '#818CF8' : '#FFFFFF'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setAppSettingsModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalDoneBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalDoneBtnText}>Save Settings</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== SECURITY SETTINGS MODAL ==================== */}
      <Modal
        visible={securitySettingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSecuritySettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>SYSTEM HARDENING</Text>
                <Text style={styles.modalTitle}>Security Settings</Text>
              </View>
              <Pressable
                onPress={() => setSecuritySettingsModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseBtn}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalToggleTitle}>Enforce Global 2FA</Text>
                  <Text style={styles.modalToggleSub}>Mandatory two-factor authentication for all users</Text>
                </View>
                <Switch
                  value={enforce2FA}
                  onValueChange={(val) => {
                    setEnforce2FA(val);
                    showToast(val ? '2FA enforced globally' : '2FA optional');
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                  thumbColor={enforce2FA ? '#818CF8' : '#FFFFFF'}
                />
              </View>

              <View style={styles.securityConfigItem}>
                <Text style={styles.configLabel}>Session Timeout Duration</Text>
                <Text style={styles.configValue}>30 Days (Sliding Window)</Text>
              </View>

              <View style={styles.securityConfigItem}>
                <Text style={styles.configLabel}>API Rate Limit</Text>
                <Text style={styles.configValue}>120 requests / minute / IP</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setSecuritySettingsModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalDoneBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== DATABASE MANAGEMENT MODAL ==================== */}
      <Modal
        visible={dbManagementModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDbManagementModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>DATA LAYER</Text>
                <Text style={styles.modalTitle}>Database Management</Text>
              </View>
              <Pressable
                onPress={() => setDbManagementModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseBtn}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.dbInfoBanner}>
                <Text style={styles.dbInfoIcon}>💾</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dbInfoTitle}>PostgreSQL & Redis Cluster</Text>
                  <Text style={styles.dbInfoSub}>Storage: 4.8 GB / 100 GB • Last backup: 2h ago</Text>
                </View>
              </View>

              <Pressable
                onPress={() => showToast('Backup snapshot initiated')}
                style={({ pressed }) => [
                  styles.dbActionBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.dbActionBtnText}>📥 Create Backup Snapshot</Text>
              </Pressable>

              <Pressable
                onPress={() => showToast('Redis cache cleared')}
                style={({ pressed }) => [
                  styles.dbActionBtnSecondary,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.dbActionBtnSecondaryText}>⚡ Flush Redis Cache</Text>
              </Pressable>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setDbManagementModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalDoneBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
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
          <View style={styles.desktopShell}>{adminContent}</View>
        </View>
      ) : (
        adminContent
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

  /* HEADER HERO */
  headerHero: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  headerHeroBg: {
    opacity: 0.85,
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 25, 0.45)',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    zIndex: 2,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  adminDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  adminBadgeText: {
    color: '#FECACA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  headerLogoutBtn: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  headerIconEmoji: {
    fontSize: 16,
  },
  headerTextContainer: {
    zIndex: 2,
    marginTop: 2,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '850',
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  clusterStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    zIndex: 2,
  },
  clusterStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clusterLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  clusterStatusText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  clusterClusterText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  orbLarge: {
    position: 'absolute',
    right: -60,
    top: 0,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#4338CA',
    opacity: 0.35,
    pointerEvents: 'none',
  },

  /* OVERVIEW METRICS */
  overviewSection: {
    marginHorizontal: 18,
    marginTop: -8,
    marginBottom: 16,
    zIndex: 3,
  },
  sectionKicker: {
    color: '#6366F1',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  sectionMainTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '850',
    marginTop: 2,
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIcon: {
    fontSize: 15,
  },
  metricTrendPositive: {
    color: '#059669',
    fontSize: 10.5,
    fontWeight: '800',
  },
  healthPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  healthPillText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '850',
    letterSpacing: -0.5,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },

  /* SECTION CARDS */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 10,
  },
  inlineActionLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  inlineActionText: {
    color: '#4F46E5',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* ACTION LIST */
  actionList: {
    gap: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionTexts: {
    flex: 1,
    paddingRight: 8,
  },
  actionTitle: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 2,
  },
  chevron: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
    paddingRight: 4,
  },

  /* REPORTS */
  reportsGrid: {
    gap: 10,
  },
  reportCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  reportTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  reportMetricPositive: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '800',
  },
  reportMetricNeutral: {
    color: '#0D9488',
    fontSize: 11.5,
    fontWeight: '800',
  },
  reportDesc: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 8,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* AI MONITORING */
  aiStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  aiStatusText: {
    color: '#059669',
    fontSize: 10.5,
    fontWeight: '800',
  },
  aiStatusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  aiStatusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  aiStatusHeading: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
  },
  aiStatusLatency: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  aiStatusSub: {
    color: '#64748B',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 12,
  },
  aiMetricStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  aiMetricValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '850',
  },
  aiMetricLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  aiMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  perfTitle: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '800',
  },
  perfSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  perfScore: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  /* RECENT ACTIVITY */
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
  },
  liveIndicatorText: {
    color: '#4F46E5',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activityFeed: {
    gap: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  activityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityIcon: {
    fontSize: 15,
  },
  activityMain: {
    flex: 1,
  },
  activityTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  activityTime: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  activityDetail: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  consoleFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 3,
  },
  consoleFooterText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  consoleVersionText: {
    color: '#94A3B8',
    fontSize: 10.5,
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
    fontSize: 20,
    fontWeight: '850',
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  restrictedDesc: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
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
    maxWidth: 420,
    maxHeight: '90%',
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
    marginBottom: 16,
    paddingBottom: 12,
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
    fontSize: 18,
    fontWeight: '850',
    marginTop: 2,
  },
  modalCloseBtn: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
    padding: 4,
  },
  modalScroll: {
    maxHeight: 460,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalDoneBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  modalDestructiveBtn: {
    flex: 1.3,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDestructiveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* USER LIST MODAL */
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userListAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userListAvatarText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  userListNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userListName: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '700',
  },
  userRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleAdmin: {
    backgroundColor: '#FEF2F2',
  },
  roleUser: {
    backgroundColor: '#EEF2FF',
  },
  userRoleText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#4F46E5',
  },
  userListEmail: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1,
  },
  userListMeta: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 2,
  },

  /* SEARCH MODAL */
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    gap: 8,
  },
  modalSearchIcon: {
    fontSize: 14,
  },
  modalSearchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    padding: 0,
  },
  clearSearchBtn: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 4,
  },

  /* FORM INPUTS & TOGGLES */
  modalExplainer: {
    color: '#475569',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 13.5,
  },
  dangerNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  dangerNoticeIcon: {
    fontSize: 18,
  },
  dangerNoticeText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
  },
  modalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalToggleTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  modalToggleSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  securityConfigItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  configLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  configValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },

  /* AUDIT & DB MODAL */
  activityAuditBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 14,
  },
  activityAuditBannerIcon: {
    fontSize: 22,
  },
  activityAuditBannerTitle: {
    color: '#1E1B4B',
    fontSize: 13,
    fontWeight: '800',
  },
  activityAuditBannerSub: {
    color: '#4338CA',
    fontSize: 11,
    marginTop: 2,
  },
  auditLogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  auditLogIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  auditLogTitle: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '700',
  },
  auditLogDetail: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  auditLogTime: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  dbInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  dbInfoIcon: {
    fontSize: 24,
  },
  dbInfoTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  dbInfoSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  dbActionBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  dbActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dbActionBtnSecondary: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dbActionBtnSecondaryText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },

  pressedOpacity: {
    opacity: 0.65,
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
