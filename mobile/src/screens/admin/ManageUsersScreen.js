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
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManageUsersScreen({ user, onLogout, onBack, navigation }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  // Refresh & Feedback
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All' | 'Active' | 'Disabled' | 'CLIENT' | 'ADMIN'

  // Modals & Action States
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'disable' | 'activate' | 'role', user: {...}, targetRole?: string }

  // Initial Mock Users State
  const [usersList, setUsersList] = useState([
    {
      id: 'usr-101',
      name: 'Ashbel Anih',
      email: 'ashbel@gmail.com',
      phone: '+1 (555) 019-2834',
      role: 'ADMIN',
      status: 'Active',
      registrationDate: 'Jan 12, 2026',
      activitySummary: 'Last login 4m ago • 142 tasks completed • 68 health telemetry readings',
    },
    {
      id: 'usr-102',
      name: 'Elena Rostova',
      email: 'elena.r@neuro.io',
      phone: '+1 (555) 847-2910',
      role: 'CLIENT',
      status: 'Active',
      registrationDate: 'Feb 04, 2026',
      activitySummary: 'Last login 22m ago • 84 tasks • 12 active goals • Pro Subscriber',
    },
    {
      id: 'usr-103',
      name: 'Marcus Vance',
      email: 'marcus.v@quant.com',
      phone: '+1 (555) 392-1084',
      role: 'CLIENT',
      status: 'Active',
      registrationDate: 'Mar 18, 2026',
      activitySummary: 'Last login 2h ago • 31 tasks • 4 goals • Standard Tier',
    },
    {
      id: 'usr-104',
      name: 'Sora Takahashi',
      email: 'sora.t@biotech.jp',
      phone: '+81 90-1234-5678',
      role: 'CLIENT',
      status: 'Disabled',
      registrationDate: 'Apr 02, 2026',
      activitySummary: 'Account suspended by Admin • 0 active sessions • Access revoked',
    },
    {
      id: 'usr-105',
      name: 'Amara Diallo',
      email: 'amara.d@apex.org',
      phone: '+44 7700 900123',
      role: 'ADMIN',
      status: 'Active',
      registrationDate: 'Apr 29, 2026',
      activitySummary: 'Last login 1h ago • System security audits: 12 • Root Access',
    },
    {
      id: 'usr-106',
      name: 'David Miller',
      email: 'david.m@cloudcorp.com',
      phone: '+1 (555) 720-3849',
      role: 'CLIENT',
      status: 'Active',
      registrationDate: 'May 14, 2026',
      activitySummary: 'Last login 3h ago • 96 tasks • 42 knowledge notes',
    },
    {
      id: 'usr-107',
      name: 'Chloe Bennett',
      email: 'chloe.b@designhub.co',
      phone: '+1 (555) 918-4720',
      role: 'CLIENT',
      status: 'Disabled',
      registrationDate: 'Jun 01, 2026',
      activitySummary: 'Inactive for 45 days • 0 recent logins • Account dormant',
    },
  ]);

  // Role Access Control: Only ADMIN role can access
  const userRole = (user?.role || 'ADMIN').toUpperCase();
  const isAdmin = userRole === 'ADMIN' || user?.isAdmin === true;

  // Dynamic Statistics
  const totalUsersCount = 1250; // Total platform count
  const activeUsersCount = usersList.filter((u) => u.status === 'Active').length > 0 ? 1100 : 0;
  const inactiveUsersCount = 150;
  const administratorsCount = 5;

  // Sync with database if users are passed via prop
  React.useEffect(() => {
    if (user && user.usersList && Array.isArray(user.usersList)) {
      setUsersList(user.usersList);
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
      showToast('User directory refreshed');
    }, 600);
  };

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Active') return u.status === 'Active';
    if (selectedFilter === 'Disabled') return u.status === 'Disabled';
    if (selectedFilter === 'CLIENT') return u.role === 'CLIENT';
    if (selectedFilter === 'ADMIN') return u.role === 'ADMIN';

    return true;
  });

  // Action Triggers
  const handleOpenActions = (targetUser) => {
    setSelectedUser(targetUser);
    setActionsModalVisible(true);
  };

  const handleOpenDetails = (targetUser) => {
    setSelectedUser(targetUser);
    setDetailsModalVisible(true);
  };

  const triggerStatusToggle = (targetUser) => {
    const isCurrentlyActive = targetUser.status === 'Active';
    setActionsModalVisible(false);
    setConfirmAction({
      type: isCurrentlyActive ? 'disable' : 'activate',
      user: targetUser,
    });
    setConfirmModalVisible(true);
  };

  const triggerRoleChange = (targetUser) => {
    const nextRole = targetUser.role === 'ADMIN' ? 'CLIENT' : 'ADMIN';
    setActionsModalVisible(false);
    setConfirmAction({
      type: 'role',
      user: targetUser,
      targetRole: nextRole,
    });
    setConfirmModalVisible(true);
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'disable') {
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === confirmAction.user.id
            ? { ...u, status: 'Disabled', activitySummary: 'Account disabled by Administrator' }
            : u
        )
      );
      if (selectedUser?.id === confirmAction.user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, status: 'Disabled' } : null));
      }
      showToast(`Account for ${confirmAction.user.name} has been disabled`);
    } else if (confirmAction.type === 'activate') {
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === confirmAction.user.id
            ? { ...u, status: 'Active', activitySummary: 'Account reactivated by Administrator' }
            : u
        )
      );
      if (selectedUser?.id === confirmAction.user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, status: 'Active' } : null));
      }
      showToast(`Account for ${confirmAction.user.name} has been activated`);
    } else if (confirmAction.type === 'role') {
      const newRole = confirmAction.targetRole;
      setUsersList((prev) =>
        prev.map((u) => (u.id === confirmAction.user.id ? { ...u, role: newRole } : u))
      );
      if (selectedUser?.id === confirmAction.user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
      }
      showToast(`${confirmAction.user.name}'s role updated to ${newRole}`);
    }

    setConfirmModalVisible(false);
    setConfirmAction(null);
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
              This view is restricted to HumanOS system administrators. Your account currently holds the "{userRole}" role.
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
      {/* Toast Notification */}
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
                <Text style={styles.adminBadgeText}>ADMIN ONLY</Text>
              </View>
            )}

            <View style={styles.headerRightStatus}>
              <Text style={styles.headerCountBadge}>{usersList.length} Loaded</Text>
            </View>
          </View>

          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Manage Users</Text>
            <Text style={styles.headerSubtitle}>View and manage HumanOS accounts</Text>
          </View>

          {/* Ambient Glow */}
          <View style={styles.orbLarge} />
        </View>

        {/* ==================== 2. USER STATISTICS CARDS ==================== */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionKicker}>ACCOUNT METRICS</Text>
          <Text style={styles.sectionMainTitle}>User Statistics</Text>

          <View style={styles.statsGrid}>
            {/* Total Users */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconWrap, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.statIcon, { color: '#4F46E5' }]}>👥</Text>
                </View>
                <Text style={styles.statTrend}>Platform</Text>
              </View>
              <Text style={styles.statValue}>{totalUsersCount.toLocaleString('en-US')}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>

            {/* Active Users */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.statIcon, { color: '#059669' }]}>⚡</Text>
                </View>
                <View style={styles.activeDotPill}>
                  <View style={styles.activeLiveDot} />
                  <Text style={styles.activeDotText}>Live</Text>
                </View>
              </View>
              <Text style={[styles.statValue, { color: '#059669' }]}>
                {activeUsersCount.toLocaleString('en-US')}
              </Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>

            {/* Inactive Users */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconWrap, { backgroundColor: '#FEF2F2' }]}>
                  <Text style={[styles.statIcon, { color: '#DC2626' }]}>⏸️</Text>
                </View>
                <Text style={styles.inactivePillText}>Dormant</Text>
              </View>
              <Text style={[styles.statValue, { color: '#DC2626' }]}>
                {inactiveUsersCount.toLocaleString('en-US')}
              </Text>
              <Text style={styles.statLabel}>Inactive Users</Text>
            </View>

            {/* Administrators */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconWrap, { backgroundColor: '#F3E8FF' }]}>
                  <Text style={[styles.statIcon, { color: '#9333EA' }]}>🛡️</Text>
                </View>
                <Text style={styles.adminPillText}>Elevated</Text>
              </View>
              <Text style={[styles.statValue, { color: '#9333EA' }]}>{administratorsCount}</Text>
              <Text style={styles.statLabel}>Administrators</Text>
            </View>
          </View>
        </View>

        {/* ==================== 3. SEARCH & FILTER SECTION ==================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>DIRECTORY SEARCH</Text>
          <Text style={styles.sectionTitle}>Find Accounts</Text>

          {/* Search Input Bar */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, isWeb && styles.webOutlineNone]}
              placeholder="Search users by name or email..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {!!searchQuery && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Text style={styles.clearSearchText}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['All', 'Active', 'Disabled', 'CLIENT', 'ADMIN'].map((f) => (
              <Pressable
                key={f}
                onPress={() => setSelectedFilter(f)}
                style={[
                  styles.filterPill,
                  selectedFilter === f && styles.filterPillActive,
                  isWeb && styles.webPointer,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedFilter === f && styles.filterPillTextActive,
                  ]}
                >
                  {f}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ==================== 4. USER LIST ==================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionKicker}>ACCOUNT DIRECTORY</Text>
              <Text style={styles.sectionTitle}>User List ({filteredUsers.length})</Text>
            </View>
            <Text style={styles.sectionCountText}>Showing matching records</Text>
          </View>

          {filteredUsers.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateEmoji}>👥</Text>
              <Text style={styles.emptyStateHeading}>No accounts match query</Text>
              <Text style={styles.emptyStateSub}>
                Try adjusting your search criteria or resetting filters.
              </Text>
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setSelectedFilter('All');
                }}
                style={styles.emptyStateResetBtn}
              >
                <Text style={styles.emptyStateResetText}>Clear Filters</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.userListContainer}>
              {filteredUsers.map((item) => {
                const isActive = item.status === 'Active';
                const isAdminRole = item.role === 'ADMIN';

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleOpenDetails(item)}
                    style={({ pressed }) => [
                      styles.userCard,
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    {/* Top Row: Avatar, Name & Options */}
                    <View style={styles.userCardTopRow}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{item.name.charAt(0)}</Text>
                      </View>

                      <View style={styles.userInfoCol}>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                      </View>

                      {/* Options Button */}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenActions(item);
                        }}
                        style={({ pressed }) => [
                          styles.optionsBtn,
                          isWeb && styles.webPointer,
                          pressed && styles.pressedOpacity,
                        ]}
                        hitSlop={10}
                      >
                        <Text style={styles.optionsBtnText}>•••</Text>
                      </Pressable>
                    </View>

                    {/* Bottom Metadata Badges */}
                    <View style={styles.userCardBottomRow}>
                      <View style={styles.badgesGroup}>
                        {/* Role Badge */}
                        <View
                          style={[
                            styles.badge,
                            isAdminRole ? styles.badgeAdmin : styles.badgeClient,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              isAdminRole ? styles.badgeTextAdmin : styles.badgeTextClient,
                            ]}
                          >
                            {item.role}
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View
                          style={[
                            styles.badge,
                            isActive ? styles.badgeActive : styles.badgeDisabled,
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              isActive ? styles.statusDotActive : styles.statusDotDisabled,
                            ]}
                          />
                          <Text
                            style={[
                              styles.badgeText,
                              isActive ? styles.badgeTextActive : styles.badgeTextDisabled,
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.regDateText}>Registered: {item.registrationDate}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ==================== 5. USER DETAILS MODAL ==================== */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>ACCOUNT PROFILE</Text>
                <Text style={styles.modalTitle}>User Details</Text>
              </View>
              <Pressable
                onPress={() => setDetailsModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Hero Summary */}
                <View style={styles.detailHeroBox}>
                  <View style={styles.detailAvatar}>
                    <Text style={styles.detailAvatarText}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.detailName}>{selectedUser.name}</Text>
                  <Text style={styles.detailEmail}>{selectedUser.email}</Text>

                  <View style={styles.detailBadgeRow}>
                    <View
                      style={[
                        styles.badge,
                        selectedUser.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeClient,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          selectedUser.role === 'ADMIN'
                            ? styles.badgeTextAdmin
                            : styles.badgeTextClient,
                        ]}
                      >
                        {selectedUser.role}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.badge,
                        selectedUser.status === 'Active'
                          ? styles.badgeActive
                          : styles.badgeDisabled,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          selectedUser.status === 'Active'
                            ? styles.statusDotActive
                            : styles.statusDotDisabled,
                        ]}
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          selectedUser.status === 'Active'
                            ? styles.badgeTextActive
                            : styles.badgeTextDisabled,
                        ]}
                      >
                        {selectedUser.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Detail Information Fields */}
                <View style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  <Text style={styles.fieldValue}>{selectedUser.phone || 'Not provided'}</Text>
                </View>

                <View style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>Created Date</Text>
                  <Text style={styles.fieldValue}>{selectedUser.registrationDate}</Text>
                </View>

                <View style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>Account Identifier</Text>
                  <Text style={[styles.fieldValue, { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
                    {selectedUser.id}
                  </Text>
                </View>

                <View style={[styles.fieldItem, { borderBottomWidth: 0 }]}>
                  <Text style={styles.fieldLabel}>Activity Summary</Text>
                  <Text style={styles.fieldValueSummary}>{selectedUser.activitySummary}</Text>
                </View>

                {/* Quick Actions in Detail Modal */}
                <View style={styles.detailActionGrid}>
                  <Pressable
                    onPress={() => {
                      setDetailsModalVisible(false);
                      triggerStatusToggle(selectedUser);
                    }}
                    style={[
                      styles.detailActionBtn,
                      selectedUser.status === 'Active' ? styles.btnDanger : styles.btnSuccess,
                    ]}
                  >
                    <Text style={styles.detailActionBtnText}>
                      {selectedUser.status === 'Active' ? 'Disable Account' : 'Activate Account'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setDetailsModalVisible(false);
                      triggerRoleChange(selectedUser);
                    }}
                    style={styles.detailActionBtnRole}
                  >
                    <Text style={styles.detailActionBtnRoleText}>
                      Switch to {selectedUser.role === 'ADMIN' ? 'CLIENT' : 'ADMIN'}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setDetailsModalVisible(false)}
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

      {/* ==================== 6. USER ACTIONS MODAL (OPTIONS MENU) ==================== */}
      <Modal
        visible={actionsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 360 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>USER ACTIONS</Text>
                <Text style={styles.modalTitle}>{selectedUser?.name}</Text>
              </View>
              <Pressable
                onPress={() => setActionsModalVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {selectedUser && (
              <View style={styles.optionsList}>
                {/* 1. View Profile */}
                <Pressable
                  onPress={() => {
                    setActionsModalVisible(false);
                    setDetailsModalVisible(true);
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.optionIcon}>👤</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>View Profile</Text>
                    <Text style={styles.optionSub}>Inspect telemetry, activity & contacts</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>

                {/* 2. Disable / Activate Account */}
                {selectedUser.status === 'Active' ? (
                  <Pressable
                    onPress={() => triggerStatusToggle(selectedUser)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Text style={styles.optionIcon}>🚫</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, { color: '#DC2626' }]}>
                        Disable Account
                      </Text>
                      <Text style={styles.optionSub}>Revoke active authentication tokens</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => triggerStatusToggle(selectedUser)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Text style={styles.optionIcon}>✅</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, { color: '#059669' }]}>
                        Activate Account
                      </Text>
                      <Text style={styles.optionSub}>Restore full client access</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                )}

                {/* 3. Change Role */}
                <Pressable
                  onPress={() => triggerRoleChange(selectedUser)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    { borderBottomWidth: 0 },
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.optionIcon}>🔄</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>Change Role</Text>
                    <Text style={styles.optionSub}>
                      Promote or demote to {selectedUser.role === 'ADMIN' ? 'CLIENT' : 'ADMIN'}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => setActionsModalVisible(false)}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ==================== 7. CONFIRMATION ALERT MODAL ==================== */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 360 }]}>
            <View style={styles.confirmIconContainer}>
              <Text style={styles.confirmIconEmoji}>
                {confirmAction?.type === 'disable' ? '⚠️' : confirmAction?.type === 'activate' ? '✅' : '🛡️'}
              </Text>
            </View>

            <Text style={styles.confirmTitle}>
              {confirmAction?.type === 'disable'
                ? 'Disable User Account?'
                : confirmAction?.type === 'activate'
                ? 'Activate User Account?'
                : 'Change User Role?'}
            </Text>

            <Text style={styles.confirmDesc}>
              {confirmAction?.type === 'disable'
                ? `Are you sure you want to disable ${confirmAction?.user?.name}'s account? The user will be immediately logged out.`
                : confirmAction?.type === 'activate'
                ? `Re-activate access for ${confirmAction?.user?.name}? They will be able to log in again.`
                : `Are you sure you want to update ${confirmAction?.user?.name}'s role to ${confirmAction?.targetRole}?`}
            </Text>

            <View style={styles.confirmActionsRow}>
              <Pressable
                onPress={() => setConfirmModalVisible(false)}
                style={({ pressed }) => [
                  styles.confirmCancelBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={executeConfirmAction}
                style={({ pressed }) => [
                  confirmAction?.type === 'disable' ? styles.confirmDestructiveBtn : styles.confirmAcceptBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.confirmBtnText}>
                  {confirmAction?.type === 'disable'
                    ? 'Disable'
                    : confirmAction?.type === 'activate'
                    ? 'Activate'
                    : 'Confirm'}
                </Text>
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
  headerRightStatus: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  headerCountBadge: {
    color: '#818CF8',
    fontSize: 10.5,
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

  /* STATISTICS SECTION */
  statsSection: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
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
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 14,
  },
  statTrend: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  activeDotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  activeDotText: {
    color: '#059669',
    fontSize: 9.5,
    fontWeight: '800',
  },
  inactivePillText: {
    color: '#DC2626',
    fontSize: 9.5,
    fontWeight: '700',
  },
  adminPillText: {
    color: '#9333EA',
    fontSize: 9.5,
    fontWeight: '800',
  },
  statValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '850',
    letterSpacing: -0.4,
  },
  statLabel: {
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
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 8,
  },
  sectionCountText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },

  /* SEARCH BAR & FILTERS */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
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
  filterScroll: {
    flexDirection: 'row',
    marginTop: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#4F46E5',
  },
  filterPillText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  /* USER CARDS LIST */
  userListContainer: {
    gap: 10,
  },
  userCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
  },
  userEmail: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 1,
  },
  optionsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionsBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  userCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeAdmin: {
    backgroundColor: '#F3E8FF',
  },
  badgeClient: {
    backgroundColor: '#EEF2FF',
  },
  badgeActive: {
    backgroundColor: '#ECFDF5',
  },
  badgeDisabled: {
    backgroundColor: '#FEF2F2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextAdmin: {
    color: '#7E22CE',
  },
  badgeTextClient: {
    color: '#4F46E5',
  },
  badgeTextActive: {
    color: '#059669',
  },
  badgeTextDisabled: {
    color: '#DC2626',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusDotDisabled: {
    backgroundColor: '#EF4444',
  },
  regDateText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '600',
  },

  /* EMPTY STATE */
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 4,
  },
  emptyStateEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyStateHeading: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyStateSub: {
    color: '#64748B',
    fontSize: 11.5,
    textAlign: 'center',
  },
  emptyStateResetBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  emptyStateResetText: {
    color: '#4F46E5',
    fontSize: 11.5,
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
  modalScroll: {
    maxHeight: 460,
  },
  modalFooter: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalDoneBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* DETAIL MODAL INTERIOR */
  detailHeroBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  detailAvatarText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '850',
  },
  detailName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '850',
  },
  detailEmail: {
    color: '#64748B',
    fontSize: 12.5,
    marginTop: 2,
    marginBottom: 8,
  },
  detailBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fieldLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  fieldValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  fieldValueSummary: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  detailActionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  detailActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  btnSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  detailActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  detailActionBtnRole: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailActionBtnRoleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4F46E5',
  },

  /* OPTIONS POPUP */
  optionsList: {
    gap: 2,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  optionIcon: {
    fontSize: 16,
  },
  optionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  optionSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  chevron: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* CONFIRMATION MODAL */
  confirmIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  confirmIconEmoji: {
    fontSize: 24,
  },
  confirmTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '850',
    textAlign: 'center',
    marginBottom: 6,
  },
  confirmDesc: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmDestructiveBtn: {
    flex: 1.2,
    backgroundColor: '#DC2626',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmAcceptBtn: {
    flex: 1.2,
    backgroundColor: '#4F46E5',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  pressedOpacity: {
    opacity: 0.65,
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
