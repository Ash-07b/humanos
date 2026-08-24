import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Modal,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/BottomNavigation';

export default function ProfileScreen({ user, onLogout, onNavigateTab }) {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  // Active Tab state
  const [activeTab, setActiveTab] = useState('profile');

  // User Profile state (dynamically bound to database/auth user)
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || user?.phone || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [dob, setDob] = useState(user?.dob || user?.dateOfBirth || '');
  const [avatar, setAvatar] = useState(user?.profilePic || user?.avatar || '🌱');
  const [memberStatus, setMemberStatus] = useState(user?.memberStatus || user?.tier || 'Active');
  const [securityScore, setSecurityScore] = useState(user?.securityScore ?? 98);
  const [activeStreak, setActiveStreak] = useState(user?.activeStreak ?? 0);
  const [isPro, setIsPro] = useState(user?.isPro ?? true);

  // Sync state whenever user prop updates from database / auth
  React.useEffect(() => {
    if (user) {
      if (user.fullName !== undefined || user.name !== undefined) setFullName(user.fullName || user.name || '');
      if (user.email !== undefined) setEmail(user.email || '');
      if (user.phoneNumber !== undefined || user.phone !== undefined) setPhoneNumber(user.phoneNumber || user.phone || '');
      if (user.gender !== undefined) setGender(user.gender || '');
      if (user.dob !== undefined || user.dateOfBirth !== undefined) setDob(user.dob || user.dateOfBirth || '');
      if (user.profilePic !== undefined || user.avatar !== undefined) setAvatar(user.profilePic || user.avatar || '🌱');
      if (user.memberStatus !== undefined || user.tier !== undefined) setMemberStatus(user.memberStatus || user.tier || 'Active');
      if (user.securityScore !== undefined) setSecurityScore(user.securityScore);
      if (user.activeStreak !== undefined) setActiveStreak(user.activeStreak);
      if (user.isPro !== undefined) setIsPro(user.isPro);
      if (user.preferences) {
        if (user.preferences.biometricsEnabled !== undefined) setBiometricsEnabled(user.preferences.biometricsEnabled);
        if (user.preferences.twoFactorEnabled !== undefined) setTwoFactorEnabled(user.preferences.twoFactorEnabled);
        if (user.preferences.pushNotifications !== undefined) setPushNotifications(user.preferences.pushNotifications);
        if (user.preferences.aiPersonalization !== undefined) setAiPersonalization(user.preferences.aiPersonalization);
        if (user.preferences.darkMode !== undefined) setDarkMode(user.preferences.darkMode);
        if (user.preferences.language) setLanguage(user.preferences.language);
        if (user.preferences.startOfWeek) setStartOfWeek(user.preferences.startOfWeek);
        if (user.preferences.reminderTime) setReminderTime(user.preferences.reminderTime);
      }
    }
  }, [user]);

  // Switches / Preferences state
  const [biometricsEnabled, setBiometricsEnabled] = useState(user?.preferences?.biometricsEnabled ?? true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.preferences?.twoFactorEnabled ?? false);
  const [pushNotifications, setPushNotifications] = useState(user?.preferences?.pushNotifications ?? true);
  const [aiPersonalization, setAiPersonalization] = useState(user?.preferences?.aiPersonalization ?? true);
  const [darkMode, setDarkMode] = useState(user?.preferences?.darkMode ?? true);

  // Preference Dropdowns / Values
  const [language, setLanguage] = useState(user?.preferences?.language || 'English (US)');
  const [startOfWeek, setStartOfWeek] = useState(user?.preferences?.startOfWeek || 'Monday');
  const [reminderTime, setReminderTime] = useState(user?.preferences?.reminderTime || '09:00 AM');

  // Modals for Editing & Features
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Support & Legal Modals
  const [helpCenterModalVisible, setHelpCenterModalVisible] = useState(false);
  const [contactSupportModalVisible, setContactSupportModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  // Help Center FAQ State
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('All');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);

  // Contact Support State
  const [supportCategory, setSupportCategory] = useState('General Inquiry');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Password fields for security modal
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Temp edit form state
  const [tempName, setTempName] = useState(fullName);
  const [tempEmail, setTempEmail] = useState(email);
  const [tempPhone, setTempPhone] = useState(phoneNumber);
  const [tempGender, setTempGender] = useState(gender);
  const [tempDob, setTempDob] = useState(dob);

  const avatarOptions = ['🌱', '⚡', '🧠', '🌿', '🎯', '🦉', '🦊', '✨', '👑'];
  const languages = ['English (US)', 'Français (French)', 'English (UK)'];
  const supportCategories = ['General Inquiry', 'Technical Issue', 'Bug Report', 'Feature Request', 'Billing'];
  const faqCategories = ['All', 'Account', 'Tasks & Habits', 'Health', 'Privacy'];

  const faqData = [
    {
      category: 'Account',
      question: 'How do I change my account credentials or email?',
      answer: 'You can update your personal information directly by tapping "Edit Profile" on this page. To change your master password or enable 2-Factor Authentication, open the Security Center.',
    },
    {
      category: 'Account',
      question: 'How do I enable Biometric Login or 2FA?',
      answer: 'Navigate to Security Center via the shield icon or row in Account Settings, then toggle Biometric Authentication or Two-Factor Authentication.',
    },
    {
      category: 'Health',
      question: 'How does HumanOS calculate my daily readiness score?',
      answer: 'HumanOS aggregates resting heart rate, sleep quality, recovery metrics, daily active minutes, and task consistency into a dynamic composite readiness index (0–100%).',
    },
    {
      category: 'Tasks & Habits',
      question: 'How do habit streaks and routines work?',
      answer: 'Completing scheduled daily habits before midnight keeps your streak active. Habits link into your overarching quarterly goals for automatic telemetry tracking.',
    },
    {
      category: 'Privacy',
      question: 'Is my personal health data private and encrypted?',
      answer: 'Yes. All biometric readings and journal entries are encrypted using industry-standard AES-256 at rest and TLS 1.3 in transit. HumanOS never sells your telemetry data to advertisers.',
    },
    {
      category: 'Health',
      question: 'Can I export my telemetry and health logs?',
      answer: 'Yes, you can generate comprehensive PDF or CSV summaries from the Health Profile tab under Export Options.',
    },
  ];

  const cycleLanguage = () => {
    const currentIndex = languages.indexOf(language);
    const next = languages[(currentIndex + 1) % languages.length];
    setLanguage(next);
    showNotice(`Language: ${next}`);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onNavigateTab) {
      onNavigateTab(tabId);
    }
  };

  const handleOpenEdit = () => {
    setTempName(fullName);
    setTempEmail(email);
    setTempPhone(phoneNumber);
    setTempGender(gender);
    setTempDob(dob);
    setEditProfileModalVisible(true);
  };

  const handleSaveProfile = () => {
    setFullName(tempName);
    setEmail(tempEmail);
    setPhoneNumber(tempPhone);
    setGender(tempGender);
    setDob(tempDob);
    setEditProfileModalVisible(false);
    showNotice('Profile updated successfully');
  };

  const showNotice = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage('');
    }, 2800);
  };

  const handleSendSupportMessage = () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      showNotice('Please complete the subject and message');
      return;
    }
    const ticketId = Math.floor(1000 + Math.random() * 9000);
    setSupportSubject('');
    setSupportMessage('');
    setContactSupportModalVisible(false);
    showNotice(`Support ticket #HOS-${ticketId} created! We'll reply shortly.`);
  };

  const handleRowPress = (title) => {
    if (title === 'Security Center' || title === 'Privacy & Security' || title === 'Change Password') {
      setSecurityModalVisible(true);
    } else if (title === 'System Settings' || title === 'Notification Settings' || title === 'Preferences') {
      setSettingsModalVisible(true);
    } else if (title === 'Help Center') {
      setHelpCenterModalVisible(true);
    } else if (title === 'Contact Support') {
      setContactSupportModalVisible(true);
    } else if (title === 'About HumanOS') {
      setAboutModalVisible(true);
    } else if (title === 'Terms & Conditions') {
      setTermsModalVisible(true);
    } else if (title === 'Privacy Policy') {
      setPrivacyModalVisible(true);
    } else if (title === 'Health Profile' || title === 'Health') {
      handleTabChange('health');
    } else if (title === 'Goals') {
      handleTabChange('goals');
    } else if (title === 'Habits') {
      showNotice('Opening Supporting Habits');
      handleTabChange('goals');
    } else if (title === 'Connected Accounts') {
      showNotice('Connected Accounts: Google & Apple sync active');
    } else if (title === 'Active Sessions') {
      showNotice('Active Sessions: 2 authorized devices');
    } else {
      showNotice(`${title} opened`);
    }
  };

  const handleSavePassword = () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      showNotice('Please fill in password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotice('New passwords do not match');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityModalVisible(false);
    showNotice('Password updated successfully');
  };

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed && onLogout) {
        onLogout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: () => {
              if (onLogout) onLogout();
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  const appContent = (
    <View style={styles.mainWrapper}>
      {/* Floating Feedback Toast Always on Top */}
      {feedbackMessage !== '' && (
        <View style={styles.floatingToastNotice}>
          <Text style={styles.floatingToastText}>✓ {feedbackMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. PROFESSIONAL EXECUTIVE HEADER SECTION */}
        <ImageBackground
          source={require('../../assets/header-bg.jpg')}
          style={styles.headerHero}
          imageStyle={styles.headerHeroBg}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} />

          {/* Top Bar with Navigation Context & Settings Action */}
          <View style={styles.topBarRow}>
            <View style={styles.brandBadge}>
              <View style={styles.brandDot} />
              <Text style={styles.brandBadgeText}>HUMANOS ACCOUNT</Text>
            </View>

            <View style={styles.topRightActions}>
              <Pressable
                onPress={() => setSecurityModalVisible(true)}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
                hitSlop={8}
              >
                <Text style={styles.headerIconEmoji}>🛡️</Text>
              </Pressable>

              <Pressable
                onPress={() => setSettingsModalVisible(true)}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
                hitSlop={8}
              >
                <Text style={styles.headerIconEmoji}>⚙️</Text>
              </Pressable>
            </View>
          </View>

          {/* Header Title & Subtitle */}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>
              Manage your personal information and preferences.
            </Text>
          </View>

          {/* Ambient Glows */}
          <View style={styles.orbLarge} />
        </ImageBackground>

        {/* 2. ELEVATED EXECUTIVE PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardMain}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarGlowRing}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>{avatar}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setPhotoPickerVisible(true)}
                style={({ pressed }) => [
                  styles.changePhotoBadge,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.changePhotoBadgeIcon}>📷</Text>
              </Pressable>
            </View>

            <View style={styles.profileInfoColumn}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{fullName || user?.username || 'HumanOS User'}</Text>
                {isPro && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ PRO</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>{email || 'No email registered'}</Text>

              <View style={styles.userMetaBadges}>
                {gender ? (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>{gender}</Text>
                  </View>
                ) : null}
                {phoneNumber ? (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>{phoneNumber}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Quick Profile Performance Counters */}
          <View style={styles.statsStrip}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{securityScore ? `${securityScore}%` : '0%'}</Text>
              <Text style={styles.statLabel}>Security Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{activeStreak > 0 ? `${activeStreak} Days` : '0 Days'}</Text>
              <Text style={styles.statLabel}>Active Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{memberStatus || 'Active'}</Text>
              <Text style={styles.statLabel}>Member Status</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.profileActionRow}>
            <Pressable
              onPress={handleOpenEdit}
              style={({ pressed }) => [
                styles.editProfileButton,
                isWeb && styles.webPointer,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.editProfileButtonText}>✏️ Edit Profile</Text>
            </Pressable>

            <Pressable
              onPress={() => setPhotoPickerVisible(true)}
              style={({ pressed }) => [
                styles.changePhotoButton,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={styles.changePhotoButtonText}>Change Photo</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. PERSONAL INFORMATION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionKicker}>ACCOUNT DETAILS</Text>
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            <Pressable
              onPress={handleOpenEdit}
              style={({ pressed }) => [
                styles.inlineActionLink,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={styles.inlineActionText}>Edit Information</Text>
            </Pressable>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Text style={styles.infoIcon}>👤</Text>
              </View>
              <View style={styles.infoTexts}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{fullName || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Text style={styles.infoIcon}>✉️</Text>
              </View>
              <View style={styles.infoTexts}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Text style={styles.infoIcon}>📞</Text>
              </View>
              <View style={styles.infoTexts}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{phoneNumber || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Text style={styles.infoIcon}>⚧</Text>
              </View>
              <View style={styles.infoTexts}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{gender || 'Not specified'}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoIconWrap}>
                <Text style={styles.infoIcon}>📅</Text>
              </View>
              <View style={styles.infoTexts}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>{dob || 'Not specified'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. ACCOUNT SETTINGS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>SECURITY & INTEGRATIONS</Text>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.rowsList}>
            <Pressable
              onPress={() => handleRowPress('Change Password')}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>🔒</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Change Password</Text>
                <Text style={styles.settingDesc}>Update your security credentials</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => handleRowPress('Privacy & Security')}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>🛡️</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Privacy & Security</Text>
                <Text style={styles.settingDesc}>Data sharing and permissions</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => handleRowPress('Notification Settings')}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>🔔</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Notification Settings</Text>
                <Text style={styles.settingDesc}>Manage alerts and daily digests</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => handleRowPress('Connected Accounts')}
              style={({ pressed }) => [styles.settingRow, { borderBottomWidth: 0 }, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>🔗</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Connected Accounts</Text>
                <Text style={styles.settingDesc}>Google, Apple & calendar sync</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 5. HUMANOS PREFERENCES */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>APP CONFIGURATION</Text>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.rowsList}>
            <View style={styles.controlRow}>
              <View style={[styles.settingIconWrap, { backgroundColor: darkMode ? '#1E293B' : '#FEF3C7' }]}>
                <Text style={styles.settingIcon}>{darkMode ? '🌙' : '☀️'}</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDesc}>
                  {darkMode ? 'Dark Mode (Obsidian Navy)' : 'Light Mode (Clean Daylight)'}
                </Text>
              </View>
              <View style={styles.themeToggleGroup}>
                <Text style={[styles.themePillLabel, darkMode ? styles.themePillDark : styles.themePillLight]}>
                  {darkMode ? 'Dark' : 'Light'}
                </Text>
                <Switch
                  value={darkMode}
                  onValueChange={(val) => {
                    setDarkMode(val);
                    showNotice(val ? 'Dark mode enabled' : 'Light mode enabled');
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                  thumbColor={darkMode ? '#818CF8' : '#FFFFFF'}
                />
              </View>
            </View>

            <Pressable
              onPress={cycleLanguage}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>🌐</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Language</Text>
                <Text style={styles.settingDesc}>{language}</Text>
              </View>
              <Text style={styles.pillControl}>{language.split(' ')[0]}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                const next = startOfWeek === 'Monday' ? 'Sunday' : 'Monday';
                setStartOfWeek(next);
                showNotice(`Start of week set to ${next}`);
              }}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>📆</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Start of Week</Text>
                <Text style={styles.settingDesc}>Calendar alignment</Text>
              </View>
              <Text style={styles.pillControl}>{startOfWeek}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                const next = reminderTime === '09:00 AM' ? '08:00 AM' : '09:00 AM';
                setReminderTime(next);
                showNotice(`Reminder time set to ${next}`);
              }}
              style={({ pressed }) => [styles.settingRow, { borderBottomWidth: 0 }, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>⏰</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Default Reminder Time</Text>
                <Text style={styles.settingDesc}>Daily morning check-in</Text>
              </View>
              <Text style={styles.pillControl}>{reminderTime}</Text>
            </Pressable>
          </View>
        </View>

        {/* 6. HEALTH & PERSONALIZATION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>MODULES & AI</Text>
          <Text style={styles.sectionTitle}>Personalization</Text>

          <View style={styles.rowsList}>
            <Pressable
              onPress={() => handleRowPress('Health Profile')}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={[styles.settingIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <Text style={styles.settingIcon}>♡</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Health Profile</Text>
                <Text style={styles.settingDesc}>Metrics, sleep & wellness tracking</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => handleRowPress('Goals')}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={[styles.settingIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.settingIcon}>🎯</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Goals</Text>
                <Text style={styles.settingDesc}>Quarterly milestones & targets</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => handleRowPress('Habits')}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={[styles.settingIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.settingIcon}>⚡</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Habits</Text>
                <Text style={styles.settingDesc}>Daily routines and loops</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <View style={[styles.controlRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.settingIconWrap, { backgroundColor: '#F3E8FF' }]}>
                <Text style={styles.settingIcon}>🧠</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>AI Personalization</Text>
                <Text style={styles.settingDesc}>Adaptive suggestions & cadence</Text>
              </View>
              <Switch
                value={aiPersonalization}
                onValueChange={setAiPersonalization}
                trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                thumbColor={aiPersonalization ? '#818CF8' : '#FFFFFF'}
              />
            </View>
          </View>
        </View>

        {/* 7. SECURITY */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>AUTHENTICATION</Text>
          <Text style={styles.sectionTitle}>Security</Text>

          <View style={styles.rowsList}>
            <View style={styles.controlRow}>
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>🔐</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Biometric Login</Text>
                <Text style={styles.settingDesc}>FaceID / Fingerprint authorization</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                thumbColor={biometricsEnabled ? '#818CF8' : '#FFFFFF'}
              />
            </View>

            <View style={styles.controlRow}>
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>🔑</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <Text style={styles.settingDesc}>Additional verification code</Text>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={setTwoFactorEnabled}
                trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                thumbColor={twoFactorEnabled ? '#818CF8' : '#FFFFFF'}
              />
            </View>

            <Pressable
              onPress={() => handleRowPress('Active Sessions')}
              style={({ pressed }) => [styles.settingRow, { borderBottomWidth: 0 }, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>📱</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Active Sessions</Text>
                <Text style={styles.settingDesc}>2 devices currently signed in</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 8. SUPPORT */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>HELP & POLICIES</Text>
          <Text style={styles.sectionTitle}>Support</Text>

          <View style={styles.rowsList}>
            <Pressable
              onPress={() => handleRowPress('Help Center')}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>❓</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Help Center</Text>
                <Text style={styles.settingDesc}>FAQs, guides and tutorials</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => handleRowPress('Contact Support')}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>💬</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Contact Support</Text>
                <Text style={styles.settingDesc}>Reach out to the team</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => handleRowPress('About HumanOS')}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>ℹ️</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>About HumanOS</Text>
                <Text style={styles.settingDesc}>Vision, team and roadmap</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => handleRowPress('Terms & Conditions')}
              style={({ pressed }) => [styles.settingRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>📜</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Terms & Conditions</Text>
                <Text style={styles.settingDesc}>Service terms and usage rules</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => handleRowPress('Privacy Policy')}
              style={({ pressed }) => [styles.settingRow, { borderBottomWidth: 0 }, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={styles.settingIconWrap}>
                <Text style={styles.settingIcon}>📄</Text>
              </View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingDesc}>How your data is protected</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 9. LOGOUT */}
        <View style={styles.logoutContainer}>
          <Pressable
            onPress={handleLogoutPress}
            style={({ pressed }) => [
              styles.logoutButton,
              isWeb && styles.webPointer,
              pressed && styles.logoutButtonPressed,
            ]}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </Pressable>
        </View>

        {/* 10. APP INFORMATION */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appInfoName}>HumanOS</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
        </View>

        {/* Extra spacing so bottom navigation doesn't hide content */}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Bottom Floating Navigation */}
      <BottomNavigation activeTab={activeTab} onTabPress={handleTabChange} />

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={editProfileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Information</Text>
              <Pressable
                onPress={() => setEditProfileModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Full Name</Text>
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone]}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="Full Name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Email</Text>
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone]}
                  value={tempEmail}
                  onChangeText={setTempEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Email"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Phone Number</Text>
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone]}
                  value={tempPhone}
                  onChangeText={setTempPhone}
                  placeholder="Phone"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Gender</Text>
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone]}
                  value={tempGender}
                  onChangeText={setTempGender}
                  placeholder="Gender"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Date of Birth</Text>
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone]}
                  value={tempDob}
                  onChangeText={setTempDob}
                  placeholder="Date of Birth"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalActionRow}>
                <Pressable
                  onPress={() => setEditProfileModalVisible(false)}
                  style={({ pressed }) => [
                    styles.modalCancelBtn,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveProfile}
                  style={({ pressed }) => [
                    styles.modalSaveBtn,
                    isWeb && styles.webPointer,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CHANGE PHOTO MODAL */}
      <Modal
        visible={photoPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoPickerCard}>
            <Text style={styles.photoPickerTitle}>Select Profile Avatar</Text>
            <Text style={styles.photoPickerSubtitle}>Choose an avatar for your HumanOS profile</Text>

            <View style={styles.avatarGrid}>
              {avatarOptions.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setAvatar(item);
                    setPhotoPickerVisible(false);
                    showNotice(`Avatar updated to ${item}`);
                  }}
                  style={({ pressed }) => [
                    styles.avatarOptionItem,
                    avatar === item && styles.avatarOptionItemActive,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.avatarOptionEmoji}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setPhotoPickerVisible(false)}
              style={({ pressed }) => [
                styles.photoPickerCloseBtn,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={styles.photoPickerCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* SECURITY CENTER MODAL */}
      <Modal
        visible={securityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>AUTHENTICATION & PRIVACY</Text>
                <Text style={styles.modalTitle}>Security Center</Text>
              </View>
              <Pressable
                onPress={() => setSecurityModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Quick Security Status */}
              <View style={styles.securityStatusBanner}>
                <Text style={styles.securityStatusIcon}>🛡️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.securityStatusHeading}>Security Rating: 98% (Strong)</Text>
                  <Text style={styles.securityStatusSub}>
                    Biometrics active • Encryption enabled
                  </Text>
                </View>
              </View>

              {/* Password Management */}
              <View style={styles.modalSectionBlock}>
                <Text style={styles.modalSectionHeading}>Change Master Password</Text>
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone, { marginBottom: 8 }]}
                  placeholder="Current Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone, { marginBottom: 8 }]}
                  placeholder="New Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone, { marginBottom: 12 }]}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable
                  onPress={handleSavePassword}
                  style={({ pressed }) => [
                    styles.savePasswordBtn,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.savePasswordBtnText}>Update Password</Text>
                </Pressable>
              </View>

              {/* Toggles */}
              <View style={styles.modalSectionBlock}>
                <Text style={styles.modalSectionHeading}>Access Controls</Text>

                <View style={styles.modalToggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalToggleTitle}>Biometric Authentication</Text>
                    <Text style={styles.modalToggleSub}>FaceID / Fingerprint login</Text>
                  </View>
                  <Switch
                    value={biometricsEnabled}
                    onValueChange={(val) => {
                      setBiometricsEnabled(val);
                      showNotice(val ? 'Biometrics enabled' : 'Biometrics disabled');
                    }}
                    trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                    thumbColor={biometricsEnabled ? '#818CF8' : '#FFFFFF'}
                  />
                </View>

                <View style={[styles.modalToggleRow, { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalToggleTitle}>Two-Factor Authentication</Text>
                    <Text style={styles.modalToggleSub}>SMS or Authenticator App</Text>
                  </View>
                  <Switch
                    value={twoFactorEnabled}
                    onValueChange={(val) => {
                      setTwoFactorEnabled(val);
                      showNotice(val ? '2FA enabled' : '2FA disabled');
                    }}
                    trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                    thumbColor={twoFactorEnabled ? '#818CF8' : '#FFFFFF'}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setSecurityModalVisible(false)}
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

      {/* SYSTEM SETTINGS & PREFERENCES MODAL */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>SYSTEM CONFIGURATION</Text>
                <Text style={styles.modalTitle}>Preferences & Settings</Text>
              </View>
              <Pressable
                onPress={() => setSettingsModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Preferences Toggles */}
              <View style={styles.modalSectionBlock}>
                <Text style={styles.modalSectionHeading}>System Defaults</Text>

                <View style={styles.modalToggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalToggleTitle}>Dark Mode</Text>
                    <Text style={styles.modalToggleSub}>Obsidian executive theme</Text>
                  </View>
                  <Switch
                    value={darkMode}
                    onValueChange={(val) => {
                      setDarkMode(val);
                      showNotice(val ? 'Dark mode enabled' : 'Light mode enabled');
                    }}
                    trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                    thumbColor={darkMode ? '#818CF8' : '#FFFFFF'}
                  />
                </View>

                <View style={styles.modalToggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalToggleTitle}>Push Notifications</Text>
                    <Text style={styles.modalToggleSub}>Daily check-ins and habit reminders</Text>
                  </View>
                  <Switch
                    value={pushNotifications}
                    onValueChange={(val) => {
                      setPushNotifications(val);
                      showNotice(val ? 'Notifications on' : 'Notifications off');
                    }}
                    trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                    thumbColor={pushNotifications ? '#818CF8' : '#FFFFFF'}
                  />
                </View>

                <View style={[styles.modalToggleRow, { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalToggleTitle}>AI Personalization</Text>
                    <Text style={styles.modalToggleSub}>Adaptive telemetry recommendations</Text>
                  </View>
                  <Switch
                    value={aiPersonalization}
                    onValueChange={(val) => {
                      setAiPersonalization(val);
                      showNotice(val ? 'AI Personalization on' : 'AI Personalization off');
                    }}
                    trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                    thumbColor={aiPersonalization ? '#818CF8' : '#FFFFFF'}
                  />
                </View>
              </View>

              {/* Locale Settings */}
              <View style={styles.modalSectionBlock}>
                <Text style={styles.modalSectionHeading}>Regional & Schedule</Text>

                <Pressable
                  onPress={cycleLanguage}
                  style={styles.modalSelectRow}
                >
                  <Text style={styles.modalSelectLabel}>Language</Text>
                  <Text style={styles.modalSelectValue}>{language} ›</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const next = startOfWeek === 'Monday' ? 'Sunday' : 'Monday';
                    setStartOfWeek(next);
                    showNotice(`Start of Week: ${next}`);
                  }}
                  style={styles.modalSelectRow}
                >
                  <Text style={styles.modalSelectLabel}>Start of Week</Text>
                  <Text style={styles.modalSelectValue}>{startOfWeek} ›</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const next = reminderTime === '09:00 AM' ? '08:00 AM' : '09:00 AM';
                    setReminderTime(next);
                    showNotice(`Reminder: ${next}`);
                  }}
                  style={[styles.modalSelectRow, { borderBottomWidth: 0 }]}
                >
                  <Text style={styles.modalSelectLabel}>Daily Check-in Time</Text>
                  <Text style={styles.modalSelectValue}>{reminderTime} ›</Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setSettingsModalVisible(false)}
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

      {/* 5. HELP CENTER MODAL */}
      <Modal
        visible={helpCenterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHelpCenterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>KNOWLEDGE BASE & GUIDES</Text>
                <Text style={styles.modalTitle}>Help Center</Text>
              </View>
              <Pressable
                onPress={() => setHelpCenterModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Search Bar */}
              <View style={styles.searchBarContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={[styles.searchInput, isWeb && styles.webOutlineNone]}
                  placeholder="Search questions or topics..."
                  placeholderTextColor="#94A3B8"
                  value={faqSearchQuery}
                  onChangeText={setFaqSearchQuery}
                />
                {faqSearchQuery.length > 0 && (
                  <Pressable onPress={() => setFaqSearchQuery('')} style={({ pressed }) => [pressed && styles.pressedOpacity]}>
                    <Text style={styles.clearSearchText}>✕</Text>
                  </Pressable>
                )}
              </View>

              {/* Category Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.faqCategoryScroll}>
                <View style={styles.faqCategoryRow}>
                  {faqCategories.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setSelectedFaqCategory(cat)}
                      style={[
                        styles.faqCategoryPill,
                        selectedFaqCategory === cat && styles.faqCategoryPillActive,
                        isWeb && styles.webPointer,
                      ]}
                    >
                      <Text
                        style={[
                          styles.faqCategoryPillText,
                          selectedFaqCategory === cat && styles.faqCategoryPillTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* FAQ Accordion List */}
              <View style={styles.faqListContainer}>
                {faqData
                  .filter((item) => {
                    const matchesCat = selectedFaqCategory === 'All' || item.category === selectedFaqCategory;
                    const matchesSearch =
                      faqSearchQuery.trim() === '' ||
                      item.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
                      item.answer.toLowerCase().includes(faqSearchQuery.toLowerCase());
                    return matchesCat && matchesSearch;
                  })
                  .map((item, index) => {
                    const isExpanded = expandedFaqIndex === index;
                    return (
                      <Pressable
                        key={index}
                        onPress={() => setExpandedFaqIndex(isExpanded ? null : index)}
                        style={({ pressed }) => [
                          styles.faqCard,
                          isExpanded && styles.faqCardActive,
                          isWeb && styles.webPointer,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <View style={styles.faqCardHeader}>
                          <View style={styles.faqCategoryBadge}>
                            <Text style={styles.faqCategoryBadgeText}>{item.category.toUpperCase()}</Text>
                          </View>
                          <Text style={styles.faqQuestion}>{item.question}</Text>
                          <Text style={styles.faqChevron}>{isExpanded ? '▲' : '▼'}</Text>
                        </View>
                        {isExpanded && (
                          <View style={styles.faqAnswerContainer}>
                            <Text style={styles.faqAnswerText}>{item.answer}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
              </View>

              {/* Need Live Help Card */}
              <View style={styles.supportPromoCard}>
                <Text style={styles.supportPromoIcon}>💬</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportPromoTitle}>Can't find what you need?</Text>
                  <Text style={styles.supportPromoSub}>Our technical support team is standing by 24/7.</Text>
                </View>
                <Pressable
                  onPress={() => {
                    setHelpCenterModalVisible(false);
                    setContactSupportModalVisible(true);
                  }}
                  style={({ pressed }) => [
                    styles.supportPromoBtn,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.supportPromoBtnText}>Contact</Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setHelpCenterModalVisible(false)}
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

      {/* 6. CONTACT SUPPORT MODAL */}
      <Modal
        visible={contactSupportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>HUMANOS HELP DESK</Text>
                <Text style={styles.modalTitle}>Contact Support</Text>
              </View>
              <Pressable
                onPress={() => setContactSupportModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.supportHeaderBanner}>
                <Text style={styles.supportHeaderIcon}>🎧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportHeaderTitle}>Dedicated Priority Support</Text>
                  <Text style={styles.supportHeaderSub}>Typical response time: under 2 hours</Text>
                </View>
              </View>

              {/* Category Selector */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Issue Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                    {supportCategories.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setSupportCategory(cat)}
                        style={[
                          styles.catPill,
                          supportCategory === cat && styles.catPillActive,
                          isWeb && styles.webPointer,
                        ]}
                      >
                        <Text
                          style={[
                            styles.catPillText,
                            supportCategory === cat && styles.catPillTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Subject */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Subject</Text>
                <TextInput
                  style={[styles.modalInput, isWeb && styles.webOutlineNone]}
                  placeholder="Brief summary of your question or issue"
                  placeholderTextColor="#94A3B8"
                  value={supportSubject}
                  onChangeText={setSupportSubject}
                />
              </View>

              {/* Message */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Message / Description</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { height: 100, textAlignVertical: 'top', paddingTop: 10 },
                    isWeb && styles.webOutlineNone,
                  ]}
                  multiline
                  numberOfLines={4}
                  placeholder="Please describe what you are experiencing in detail..."
                  placeholderTextColor="#94A3B8"
                  value={supportMessage}
                  onChangeText={setSupportMessage}
                />
              </View>

              {/* Email direct line info */}
              <View style={styles.supportDirectInfo}>
                <Text style={styles.supportDirectInfoText}>
                  ✉️ Direct Email:{' '}
                  <Text style={{ fontWeight: '700', color: '#4F46E5' }}>support@humanos.app</Text>
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setContactSupportModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSendSupportMessage}
                style={({ pressed }) => [
                  styles.modalSaveBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.modalSaveBtnText}>Submit Ticket ↗</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 7. ABOUT HUMANOS MODAL */}
      <Modal
        visible={aboutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>MISSION & VISION</Text>
                <Text style={styles.modalTitle}>About HumanOS</Text>
              </View>
              <Pressable
                onPress={() => setAboutModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Brand Center */}
              <View style={styles.aboutHeroBlock}>
                <View style={styles.aboutLogoWrap}>
                  <Text style={styles.aboutLogoEmoji}>🌱</Text>
                </View>
                <Text style={styles.aboutBrandTitle}>HumanOS</Text>
                <Text style={styles.aboutVersionBadge}>v1.0.0 Pro • Obsidian Edition</Text>
                <Text style={styles.aboutTagline}>
                  The personal operating system engineered to elevate human cognitive focus, metabolic vitality, and execution velocity.
                </Text>
              </View>

              {/* Core Philosophy Cards */}
              <View style={styles.modalSectionBlock}>
                <Text style={styles.modalSectionHeading}>Core Principles</Text>

                <View style={styles.aboutPillarRow}>
                  <Text style={styles.aboutPillarIcon}>🧠</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aboutPillarTitle}>Cognitive Harmony</Text>
                    <Text style={styles.aboutPillarDesc}>
                      Task prioritization designed around circadian rhythm cycles and peak mental clarity.
                    </Text>
                  </View>
                </View>

                <View style={styles.aboutPillarRow}>
                  <Text style={styles.aboutPillarIcon}>♡</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aboutPillarTitle}>Biological Telemetry</Text>
                    <Text style={styles.aboutPillarDesc}>
                      Real-time biometric tracking to maintain sustained high energy without burnout.
                    </Text>
                  </View>
                </View>

                <View style={[styles.aboutPillarRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.aboutPillarIcon}>🛡️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aboutPillarTitle}>Zero-Compromise Privacy</Text>
                    <Text style={styles.aboutPillarDesc}>
                      Hardware-backed encryption and total personal data sovereignty.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Build Meta */}
              <View style={styles.aboutMetaRow}>
                <Text style={styles.aboutMetaText}>Designed for high performance individuals worldwide.</Text>
                <Text style={styles.aboutMetaCopyright}>© 2026 HumanOS Technologies, Inc. All rights reserved.</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setAboutModalVisible(false)}
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

      {/* 8. TERMS & CONDITIONS MODAL */}
      <Modal
        visible={termsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>LEGAL & POLICIES</Text>
                <Text style={styles.modalTitle}>Terms & Conditions</Text>
              </View>
              <Pressable
                onPress={() => setTermsModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.legalEffectiveDate}>Effective Date: August 2026 • Version 2.1</Text>

              <View style={styles.legalSection}>
                <Text style={styles.legalSectionTitle}>1. Acceptance of Terms</Text>
                <Text style={styles.legalParagraph}>
                  By creating an account or accessing HumanOS services, you acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service. If you do not agree with any portion, you must discontinue use immediately.
                </Text>
              </View>

              <View style={styles.legalSection}>
                <Text style={styles.legalSectionTitle}>2. Health & Wellness Disclaimer</Text>
                <Text style={styles.legalParagraph}>
                  HumanOS provides lifestyle tracking, cognitive routine optimization, and productivity telemetry. HumanOS is not a licensed medical provider. The software does not diagnose, treat, or prevent any illness or condition. Always seek professional advice from qualified healthcare providers.
                </Text>
              </View>

              <View style={styles.legalSection}>
                <Text style={styles.legalSectionTitle}>3. User Account & Data Security</Text>
                <Text style={styles.legalParagraph}>
                  You are responsible for maintaining the confidentiality of your authentication credentials. You agree to notify HumanOS immediately upon discovering any unauthorized breach or suspicious activity regarding your account.
                </Text>
              </View>

              <View style={styles.legalSection}>
                <Text style={styles.legalSectionTitle}>4. Subscriptions & Pro Services</Text>
                <Text style={styles.legalParagraph}>
                  Certain advanced modules (such as AI Telemetry Coaching and biometric deep analytics) may require an active Pro subscription. Subscriptions automatically renew unless cancelled at least 24 hours prior to the billing cycle end.
                </Text>
              </View>

              <View style={styles.legalSection}>
                <Text style={styles.legalSectionTitle}>5. Intellectual Property & License</Text>
                <Text style={styles.legalParagraph}>
                  HumanOS and its original content, features, and functionality remain the exclusive property of HumanOS Technologies, Inc. You are granted a limited, personal, non-exclusive license to use the app for individual purposes.
                </Text>
              </View>

              <View style={styles.legalSection}>
                <Text style={styles.legalSectionTitle}>6. Termination & Inquiries</Text>
                <Text style={styles.legalParagraph}>
                  We may terminate or suspend access to our service immediately, without prior notice, for conduct that violates these Terms. For legal inquiries, contact legal@humanos.app.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => {
                  setTermsModalVisible(false);
                  showNotice('Terms & Conditions acknowledged');
                }}
                style={({ pressed }) => [
                  styles.modalDoneBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalDoneBtnText}>I Understand & Accept</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 9. PRIVACY POLICY MODAL */}
      <Modal
        visible={privacyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>PRIVACY & DATA SOVEREIGNTY</Text>
                <Text style={styles.modalTitle}>Privacy Policy</Text>
              </View>
              <Pressable
                onPress={() => setPrivacyModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.privacyTrustBanner}>
                <Text style={styles.privacyTrustIcon}>🔒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.privacyTrustTitle}>Zero-Ad Data Architecture</Text>
                  <Text style={styles.privacyTrustSub}>Your personal metrics are never sold or monetized.</Text>
                </View>
              </View>

              <Text style={styles.legalEffectiveDate}>Effective Date: August 2026 • GDPR & CCPA Compliant</Text>

              <View style={styles.legalSection}>
                <Text style={styles.legalSectionTitle}>1. Information We Collect</Text>
                <Text style={styles.legalParagraph}>
                  • Account details: Full name, verified email, and profile preferences.{'\n'}
                  • Daily logs: Tasks completed, habit streak tracking, and daily focus logs.{'\n'}
                  • Telemetry: Voluntary metrics such as resting heart rate, sleep duration, and active minutes.
                </Text>
              </View>

              <View style={styles.legalSection}>
                <Text style={styles.legalSectionTitle}>2. Military-Grade Data Encryption</Text>
                <Text style={styles.legalParagraph}>
                  All biometric and personal data is encrypted at rest using AES-256 and transmitted exclusively via authenticated TLS 1.3 tunnels. Encryption keys remain segregated from raw user identities.
                </Text>
              </View>

              <View style={styles.legalSection}>
                <Text style={styles.legalSectionTitle}>3. AI Processing & Zero Retention</Text>
                <Text style={styles.legalParagraph}>
                  When using AI Personalization, contextual telemetry prompts are evaluated in transient memory sessions. We do not use your private logs to train public language models without your consent.
                </Text>
              </View>

              <View style={styles.legalSection}>
                <Text style={styles.legalSectionTitle}>4. Your Rights & One-Click Erasure</Text>
                <Text style={styles.legalParagraph}>
                  Under GDPR and CCPA, you retain the unconditional right to export your complete telemetry archive or execute a permanent, irreversible purge of your account data directly from the Security Center.
                </Text>
              </View>

              <View style={styles.legalSection}>
                <Text style={styles.legalSectionTitle}>5. Contact the Data Protection Officer</Text>
                <Text style={styles.legalParagraph}>
                  If you have questions regarding our privacy architecture or wish to request data verification, email our Data Protection Officer at privacy@humanos.app.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => {
                  setPrivacyModalVisible(false);
                  showNotice('Privacy Policy acknowledged');
                }}
                style={({ pressed }) => [
                  styles.modalDoneBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.modalDoneBtnText}>Understood</Text>
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
    paddingBottom: 24,
  },

  /* 1. HEADER HERO */
  headerHero: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  headerHeroBg: {
    opacity: 0.85,
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 25, 0.38)',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    zIndex: 2,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818CF8',
  },
  brandBadgeText: {
    color: '#C7D2FE',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerIconEmoji: {
    fontSize: 16,
  },
  headerTextContainer: {
    zIndex: 2,
    marginTop: 4,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 320,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  orbLarge: {
    position: 'absolute',
    right: -70,
    top: 0,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4338CA',
    opacity: 0.35,
    pointerEvents: 'none',
  },

  /* FLOATING TOAST NOTICE */
  floatingToastNotice: {
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
  floatingToastText: {
    color: '#E0E7FF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* 2. PROFILE CARD (Clean Docking) */
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: -10,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarSection: {
    position: 'relative',
  },
  avatarGlowRing: {
    padding: 2.5,
    borderRadius: 42,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#818CF8',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  changePhotoBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changePhotoBadgeIcon: {
    fontSize: 11,
  },
  profileInfoColumn: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  userName: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
  },
  verifiedBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  verifiedText: {
    color: '#4F46E5',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  userEmail: {
    color: '#64748B',
    fontSize: 12.5,
    marginBottom: 8,
  },
  userMetaBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaBadgeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },

  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },

  profileActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  editProfileButton: {
    flex: 1.2,
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  changePhotoButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  changePhotoButtonText: {
    color: '#334155',
    fontSize: 12.5,
    fontWeight: '600',
  },

  /* SECTIONS */
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
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionKicker: {
    color: '#6366F1',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
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
  infoList: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoIcon: {
    fontSize: 15,
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  infoValue: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 1,
  },
  rowsList: {
    gap: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIcon: {
    fontSize: 15,
  },
  settingTexts: {
    flex: 1,
    paddingRight: 8,
  },
  settingTitle: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '700',
  },
  settingDesc: {
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
  pillControl: {
    color: '#4F46E5',
    fontSize: 11.5,
    fontWeight: '700',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  themeToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themePillLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  themePillDark: {
    backgroundColor: '#1E293B',
    color: '#818CF8',
  },
  themePillLight: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  logoutContainer: {
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  logoutButtonPressed: {
    backgroundColor: '#FEE2E2',
    opacity: 0.85,
  },
  logoutIcon: {
    fontSize: 16,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 14.5,
    fontWeight: '800',
  },
  appInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 3,
  },
  appInfoName: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appInfoVersion: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
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
    fontWeight: '800',
    marginTop: 2,
  },
  modalCloseButton: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
    padding: 4,
  },
  modalScroll: {
    maxHeight: 480,
  },
  modalSectionBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  modalSectionHeading: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 10,
  },
  securityStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
  },
  securityStatusIcon: {
    fontSize: 24,
  },
  securityStatusHeading: {
    color: '#065F46',
    fontSize: 13.5,
    fontWeight: '800',
  },
  securityStatusSub: {
    color: '#047857',
    fontSize: 11.5,
    marginTop: 2,
  },
  savePasswordBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  savePasswordBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
  modalSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalSelectLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  modalSelectValue: {
    color: '#4F46E5',
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalDoneBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalInputGroup: {
    marginBottom: 12,
  },
  modalInputLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 13.5,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
  modalSaveBtn: {
    flex: 1.3,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  photoPickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  photoPickerTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  photoPickerSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 18,
  },
  avatarOptionItem: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionItemActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  avatarOptionEmoji: {
    fontSize: 26,
  },
  photoPickerCloseBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  photoPickerCloseText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  /* HELP CENTER & FAQ MODAL STYLES */
  searchBarContainer: {
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
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    padding: 0,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  faqCategoryScroll: {
    marginBottom: 14,
  },
  faqCategoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  faqCategoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqCategoryPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  faqCategoryPillText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  faqCategoryPillTextActive: {
    color: '#FFFFFF',
  },
  faqListContainer: {
    gap: 10,
    marginBottom: 14,
  },
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqCardActive: {
    borderColor: '#C7D2FE',
    backgroundColor: '#F5F7FF',
  },
  faqCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  faqCategoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  faqCategoryBadgeText: {
    color: '#4F46E5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  faqQuestion: {
    flex: 1,
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 17,
  },
  faqChevron: {
    color: '#94A3B8',
    fontSize: 10,
    paddingLeft: 4,
  },
  faqAnswerContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  faqAnswerText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
  },
  supportPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 10,
  },
  supportPromoIcon: {
    fontSize: 22,
  },
  supportPromoTitle: {
    color: '#1E1B4B',
    fontSize: 12.5,
    fontWeight: '800',
  },
  supportPromoSub: {
    color: '#4338CA',
    fontSize: 11,
    marginTop: 2,
  },
  supportPromoBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  supportPromoBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* CONTACT SUPPORT MODAL STYLES */
  supportHeaderBanner: {
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
  supportHeaderIcon: {
    fontSize: 24,
  },
  supportHeaderTitle: {
    color: '#1E1B4B',
    fontSize: 13,
    fontWeight: '800',
  },
  supportHeaderSub: {
    color: '#4338CA',
    fontSize: 11,
    marginTop: 2,
  },
  catPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  catPillText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  supportDirectInfo: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 8,
  },
  supportDirectInfoText: {
    color: '#64748B',
    fontSize: 11.5,
  },

  /* ABOUT HUMANOS MODAL STYLES */
  aboutHeroBlock: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 14,
  },
  aboutLogoWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#818CF8',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    marginBottom: 10,
  },
  aboutLogoEmoji: {
    fontSize: 30,
  },
  aboutBrandTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '850',
    letterSpacing: -0.5,
  },
  aboutVersionBadge: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  aboutTagline: {
    color: '#475569',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  aboutPillarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  aboutPillarIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  aboutPillarTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  aboutPillarDesc: {
    color: '#64748B',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  aboutMetaRow: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  aboutMetaText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
  aboutMetaCopyright: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },

  /* LEGAL & PRIVACY MODAL STYLES */
  legalEffectiveDate: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  legalSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  legalSectionTitle: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 6,
  },
  legalParagraph: {
    color: '#475569',
    fontSize: 11.5,
    lineHeight: 17,
  },
  privacyTrustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  privacyTrustIcon: {
    fontSize: 22,
  },
  privacyTrustTitle: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '800',
  },
  privacyTrustSub: {
    color: '#047857',
    fontSize: 11,
    marginTop: 2,
  },

  pressedOpacity: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
