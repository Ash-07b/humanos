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
  Alert,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SystemSettingsScreen({ user, onLogout, onBack, navigation }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  // Refresh & Feedback state
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Role Access Control: Ensure only ADMIN role can view
  const userRole = (user?.role || 'ADMIN').toUpperCase();
  const isAdmin = userRole === 'ADMIN' || user?.isAdmin === true;

  // 1. Account Settings State
  const [adminName, setAdminName] = useState(user?.name || 'Ashbel Anih');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'ashbel@gmail.com');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2. Application Settings Feature Toggles
  const [enableAiRecommendations, setEnableAiRecommendations] = useState(
    user?.systemSettings?.enableAiRecommendations ?? true
  );
  const [enableNotifications, setEnableNotifications] = useState(
    user?.systemSettings?.enableNotifications ?? true
  );
  const [enableHealthTracking, setEnableHealthTracking] = useState(
    user?.systemSettings?.enableHealthTracking ?? true
  );
  const [enableFinanceModule, setEnableFinanceModule] = useState(
    user?.systemSettings?.enableFinanceModule ?? true
  );

  // 3. Security Settings State
  const [twoFactorAuth, setTwoFactorAuth] = useState(
    user?.systemSettings?.twoFactorAuth ?? true
  );
  const [sessionTimeout, setSessionTimeout] = useState('30 Days (Sliding Window)');
  const [passwordPolicy, setPasswordPolicy] = useState('Strong (Min 12 chars, 2FA)');
  const [timeoutModalVisible, setTimeoutModalVisible] = useState(false);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);

  // 4. Data Management State
  const [dataActionLoading, setDataActionLoading] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('System configuration reloaded');
    }, 600);
  };

  const handleSaveProfile = () => {
    if (!adminName.trim() || !adminEmail.trim()) {
      showToast('Please provide valid name and email');
      return;
    }
    setProfileModalVisible(false);
    showToast('Admin profile updated successfully');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(false);
    showToast('Admin master password updated');
  };

  const triggerDataAction = (actionType) => {
    setDataActionLoading(true);
    setTimeout(() => {
      setDataActionLoading(false);
      if (actionType === 'backup') {
        showToast('Database backup snapshot created successfully (DB-2026-08)');
      } else if (actionType === 'clear') {
        showToast('Temporary cache & transient application memory cleared');
      } else if (actionType === 'export') {
        showToast('Application dataset exported (JSON archive ready in downloads)');
      }
    }, 800);
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
              This console is exclusively accessible to authorized HumanOS administrators. Your current account role is "{userRole}".
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
      {/* Toast Feedback Banner */}
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
                <Text style={styles.adminBadgeText}>SYSTEM ROOT</Text>
              </View>
            )}

            <View style={styles.statusPill}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.statusPillText}>Config Sync Active</Text>
            </View>
          </View>

          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>System Settings</Text>
            <Text style={styles.headerSubtitle}>
              Configure HumanOS application settings
            </Text>
          </View>

          {/* Ambient Glow */}
          <View style={styles.orbLarge} />
        </View>

        {/* ==================== 1. ACCOUNT SETTINGS ==================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>ADMINISTRATOR CREDENTIALS</Text>
          <Text style={styles.sectionTitle}>Admin Account</Text>

          {/* Active Admin Summary Strip */}
          <View style={styles.adminSummaryBox}>
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>{adminName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminSummaryName}>{adminName}</Text>
              <Text style={styles.adminSummaryEmail}>{adminEmail}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Root Admin</Text>
            </View>
          </View>

          {/* Action Rows */}
          <View style={styles.actionList}>
            {/* Change Admin Profile */}
            <Pressable
              onPress={() => setProfileModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.actionIcon}>👤</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Change Admin Profile</Text>
                <Text style={styles.actionSubtitle}>Update name, administrative email & avatar</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Change Password */}
            <Pressable
              onPress={() => setPasswordModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.actionIcon}>🔑</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Change Password</Text>
                <Text style={styles.actionSubtitle}>Update admin master password</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Manage Permissions */}
            <Pressable
              onPress={() => setPermissionsModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                { borderBottomWidth: 0 },
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#F3E8FF' }]}>
                <Text style={styles.actionIcon}>🛡️</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Manage Permissions</Text>
                <Text style={styles.actionSubtitle}>Role privileges, access control & audit scope</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* ==================== 2. APPLICATION SETTINGS ==================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>MODULES & FUNCTIONALITY</Text>
          <Text style={styles.sectionTitle}>Application Settings</Text>

          <View style={styles.togglesList}>
            {/* Enable AI Recommendations */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleIconWrap}>
                <Text style={styles.toggleIcon}>🧠</Text>
              </View>
              <View style={styles.toggleTexts}>
                <Text style={styles.toggleTitle}>Enable AI Recommendations</Text>
                <Text style={styles.toggleSubtitle}>
                  Biometric telemetry synthesis & recovery suggestions
                </Text>
              </View>
              <Switch
                value={enableAiRecommendations}
                onValueChange={(val) => {
                  setEnableAiRecommendations(val);
                  showToast(val ? 'AI Recommendations enabled' : 'AI Recommendations paused');
                }}
                trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                thumbColor={enableAiRecommendations ? '#818CF8' : '#FFFFFF'}
              />
            </View>

            {/* Enable Notifications */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleIconWrap}>
                <Text style={styles.toggleIcon}>🔔</Text>
              </View>
              <View style={styles.toggleTexts}>
                <Text style={styles.toggleTitle}>Enable Notifications</Text>
                <Text style={styles.toggleSubtitle}>
                  System push alerts, medication reminders & habits
                </Text>
              </View>
              <Switch
                value={enableNotifications}
                onValueChange={(val) => {
                  setEnableNotifications(val);
                  showToast(val ? 'Notifications enabled' : 'Notifications disabled');
                }}
                trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                thumbColor={enableNotifications ? '#818CF8' : '#FFFFFF'}
              />
            </View>

            {/* Enable Health Tracking */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleIconWrap}>
                <Text style={styles.toggleIcon}>♥</Text>
              </View>
              <View style={styles.toggleTexts}>
                <Text style={styles.toggleTitle}>Enable Health Tracking</Text>
                <Text style={styles.toggleSubtitle}>
                  Vitals, heart rate, sleep & medication logging
                </Text>
              </View>
              <Switch
                value={enableHealthTracking}
                onValueChange={(val) => {
                  setEnableHealthTracking(val);
                  showToast(val ? 'Health Tracking enabled' : 'Health Tracking paused');
                }}
                trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
                thumbColor={enableHealthTracking ? '#14B8A6' : '#FFFFFF'}
              />
            </View>

            {/* Enable Finance Module */}
            <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
              <View style={styles.toggleIconWrap}>
                <Text style={styles.toggleIcon}>💳</Text>
              </View>
              <View style={styles.toggleTexts}>
                <Text style={styles.toggleTitle}>Enable Finance Module</Text>
                <Text style={styles.toggleSubtitle}>
                  Cashflow tracking, allocations & savings metrics
                </Text>
              </View>
              <Switch
                value={enableFinanceModule}
                onValueChange={(val) => {
                  setEnableFinanceModule(val);
                  showToast(val ? 'Finance Module enabled' : 'Finance Module paused');
                }}
                trackColor={{ false: '#CBD5E1', true: '#D97706' }}
                thumbColor={enableFinanceModule ? '#FBBF24' : '#FFFFFF'}
              />
            </View>
          </View>
        </View>

        {/* ==================== 3. SECURITY SETTINGS ==================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>PROTECTION & POLICIES</Text>
          <Text style={styles.sectionTitle}>Security Settings</Text>

          <View style={styles.actionList}>
            {/* Two Factor Authentication (Toggle) */}
            <View style={styles.toggleRow}>
              <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.actionIcon}>🛡️</Text>
              </View>
              <View style={styles.toggleTexts}>
                <Text style={styles.toggleTitle}>Two Factor Authentication</Text>
                <Text style={styles.toggleSubtitle}>
                  Enforce global 2FA on administrative logins
                </Text>
              </View>
              <Switch
                value={twoFactorAuth}
                onValueChange={(val) => {
                  setTwoFactorAuth(val);
                  showToast(val ? '2FA enforced globally' : '2FA optional');
                }}
                trackColor={{ false: '#CBD5E1', true: '#059669' }}
                thumbColor={twoFactorAuth ? '#34D399' : '#FFFFFF'}
              />
            </View>

            {/* Session Timeout */}
            <Pressable
              onPress={() => setTimeoutModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.actionIcon}>⏱️</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Session Timeout</Text>
                <Text style={styles.actionSubtitle}>{sessionTimeout}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Password Policy */}
            <Pressable
              onPress={() => setPolicyModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                { borderBottomWidth: 0 },
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Text style={styles.actionIcon}>🔒</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Password Policy</Text>
                <Text style={styles.actionSubtitle}>{passwordPolicy}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* ==================== 4. DATA MANAGEMENT ==================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>DATABASE & MEMORY</Text>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <View style={styles.actionList}>
            {/* Backup Database */}
            <Pressable
              onPress={() => triggerDataAction('backup')}
              disabled={dataActionLoading}
              style={({ pressed }) => [
                styles.actionRow,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.actionIcon}>💾</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Backup Database</Text>
                <Text style={styles.actionSubtitle}>Create automated snapshot & upload to secure vault</Text>
              </View>
              <Text style={styles.actionButtonText}>Execute ↗</Text>
            </Pressable>

            {/* Clear Temporary Data */}
            <Pressable
              onPress={() => triggerDataAction('clear')}
              disabled={dataActionLoading}
              style={({ pressed }) => [
                styles.actionRow,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Text style={styles.actionIcon}>🧹</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Clear Temporary Data</Text>
                <Text style={styles.actionSubtitle}>Purge Redis session cache and transient files</Text>
              </View>
              <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Purge ↗</Text>
            </Pressable>

            {/* Export Application Data */}
            <Pressable
              onPress={() => triggerDataAction('export')}
              disabled={dataActionLoading}
              style={({ pressed }) => [
                styles.actionRow,
                { borderBottomWidth: 0 },
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.actionIcon}>📦</Text>
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Export Application Data</Text>
                <Text style={styles.actionSubtitle}>Download schema, accounts & telemetry archive</Text>
              </View>
              <Text style={[styles.actionButtonText, { color: '#059669' }]}>Export ↗</Text>
            </Pressable>
          </View>
        </View>

        {/* ==================== 5. ABOUT SYSTEM ==================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>SYSTEM INFORMATION</Text>
          <Text style={styles.sectionTitle}>About System</Text>

          <View style={styles.aboutGrid}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Application</Text>
              <Text style={styles.aboutValue}>HumanOS</Text>
            </View>

            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <View style={styles.versionPill}>
                <Text style={styles.versionPillText}>1.0.0 Pro</Text>
              </View>
            </View>

            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Developer</Text>
              <Text style={styles.aboutValue}>HumanOS Team</Text>
            </View>

            <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.aboutLabel}>Environment</Text>
              <Text style={styles.aboutValueSub}>Node 22 LTS • React Native Expo • TLS 1.3</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ==================== 1. CHANGE ADMIN PROFILE MODAL ==================== */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>ACCOUNT DETAILS</Text>
                <Text style={styles.modalTitle}>Change Admin Profile</Text>
              </View>
              <Pressable
                onPress={() => setProfileModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Full Name</Text>
              <TextInput
                style={[styles.textInput, isWeb && styles.webOutlineNone]}
                value={adminName}
                onChangeText={setAdminName}
                placeholder="Admin Name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Email Address</Text>
              <TextInput
                style={[styles.textInput, isWeb && styles.webOutlineNone]}
                value={adminEmail}
                onChangeText={setAdminEmail}
                placeholder="admin@humanos.app"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setProfileModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveProfile}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryBtnText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== 2. CHANGE PASSWORD MODAL ==================== */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>AUTHENTICATION</Text>
                <Text style={styles.modalTitle}>Change Password</Text>
              </View>
              <Pressable
                onPress={() => setPasswordModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={[styles.textInput, isWeb && styles.webOutlineNone]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="••••••••••••"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={[styles.textInput, isWeb && styles.webOutlineNone]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Minimum 8 characters"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={[styles.textInput, isWeb && styles.webOutlineNone]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Re-enter new password"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setPasswordModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleChangePassword}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryBtnText}>Update Password</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== 3. MANAGE PERMISSIONS MODAL ==================== */}
      <Modal
        visible={permissionsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPermissionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>ACCESS CONTROL (RBAC)</Text>
                <Text style={styles.modalTitle}>Manage Permissions</Text>
              </View>
              <Pressable
                onPress={() => setPermissionsModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={styles.permissionItem}>
                <Text style={styles.permissionTitle}>User Directory Access</Text>
                <Text style={styles.permissionDesc}>Full read, write, suspension and tier assignment</Text>
                <Text style={styles.permissionRoleTag}>Granted (Root)</Text>
              </View>

              <View style={styles.permissionItem}>
                <Text style={styles.permissionTitle}>Database Write & Purge</Text>
                <Text style={styles.permissionDesc}>Execute database snapshots and cache flushes</Text>
                <Text style={styles.permissionRoleTag}>Granted (Root)</Text>
              </View>

              <View style={styles.permissionItem}>
                <Text style={styles.permissionTitle}>AI Telemetry Tuning</Text>
                <Text style={styles.permissionDesc}>Adjust prompt parameters & model routing</Text>
                <Text style={styles.permissionRoleTag}>Granted (Root)</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setPermissionsModalVisible(false)}
                style={[styles.modalPrimaryBtn, { width: '100%' }]}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== 4. SESSION TIMEOUT MODAL ==================== */}
      <Modal
        visible={timeoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimeoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>SECURITY POLICY</Text>
                <Text style={styles.modalTitle}>Session Timeout</Text>
              </View>
              <Pressable
                onPress={() => setTimeoutModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.pickerList}>
              {[
                '24 Hours (High Security)',
                '7 Days (Standard)',
                '30 Days (Sliding Window)',
                '90 Days (Extended)',
              ].map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    setSessionTimeout(opt);
                    setTimeoutModalVisible(false);
                    showToast(`Session timeout updated to ${opt}`);
                  }}
                  style={styles.pickerItem}
                >
                  <Text style={[styles.pickerItemText, sessionTimeout === opt && styles.pickerItemTextActive]}>
                    {opt}
                  </Text>
                  {sessionTimeout === opt && <Text style={styles.pickerCheckmark}>✓</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== 5. PASSWORD POLICY MODAL ==================== */}
      <Modal
        visible={policyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPolicyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>CREDENTIAL ENFORCEMENT</Text>
                <Text style={styles.modalTitle}>Password Policy</Text>
              </View>
              <Pressable
                onPress={() => setPolicyModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.pickerList}>
              {[
                'Strict (Min 14 chars, 2FA, 60-day expiry)',
                'Strong (Min 12 chars, 2FA)',
                'Standard (Min 8 chars, 1 Special character)',
              ].map((pol) => (
                <Pressable
                  key={pol}
                  onPress={() => {
                    setPasswordPolicy(pol);
                    setPolicyModalVisible(false);
                    showToast(`Password policy updated to ${pol}`);
                  }}
                  style={styles.pickerItem}
                >
                  <Text style={[styles.pickerItemText, passwordPolicy === pol && styles.pickerItemTextActive]}>
                    {pol}
                  </Text>
                  {passwordPolicy === pol && <Text style={styles.pickerCheckmark}>✓</Text>}
                </Pressable>
              ))}
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '700',
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

  /* SECTION CARDS */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: 14,
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
  sectionKicker: {
    color: '#6366F1',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 10,
  },

  /* ADMIN SUMMARY STRIP */
  adminSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  adminAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  adminSummaryName: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '750',
  },
  adminSummaryEmail: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '800',
  },

  /* ACTION LIST */
  actionList: {
    gap: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionIcon: {
    fontSize: 15,
  },
  actionTexts: {
    flex: 1,
    paddingRight: 8,
  },
  actionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  actionButtonText: {
    color: '#4F46E5',
    fontSize: 11.5,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  chevron: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
    paddingRight: 2,
  },

  /* TOGGLES LIST */
  togglesList: {
    gap: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  toggleIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIcon: {
    fontSize: 15,
  },
  toggleTexts: {
    flex: 1,
    paddingRight: 6,
  },
  toggleTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },

  /* ABOUT GRID */
  aboutGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  aboutLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  aboutValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '750',
  },
  aboutValueSub: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
  versionPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  versionPillText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '800',
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
    marginBottom: 14,
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
  inputGroup: {
    marginBottom: 12,
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
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
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
  modalPrimaryBtn: {
    flex: 1.3,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* PERMISSIONS LIST */
  permissionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  permissionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '750',
  },
  permissionDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  permissionRoleTag: {
    color: '#059669',
    fontSize: 10.5,
    fontWeight: '800',
    marginTop: 4,
  },

  /* PICKER LIST */
  pickerList: {
    gap: 6,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerItemText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  pickerCheckmark: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '800',
  },

  pressedOpacity: {
    opacity: 0.65,
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
