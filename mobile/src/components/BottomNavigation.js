import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  ListTodo,
  WalletCards,
  HeartPulse,
  UserRound,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'finance', label: 'Finance', icon: WalletCards },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

export default function BottomNavigation({ activeTab = 'dashboard', onTabPress }) {
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 16 : 8);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.navBg,
            borderColor: theme.colors.navBorder,
            shadowColor: theme.colors.shadowColor,
          },
        ]}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;
          return (
            <Pressable
              key={item.id}
              onPress={() => onTabPress && onTabPress(item.id)}
              style={({ pressed }) => [
                styles.tabItem,
                isWeb && styles.webPointer,
                pressed && styles.tabPressed,
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && {
                    backgroundColor: isDarkMode
                      ? 'rgba(99, 102, 241, 0.2)'
                      : '#EEF2FF',
                  },
                ]}
              >
                <IconComponent
                  size={18}
                  color={isActive ? (isDarkMode ? '#818CF8' : '#4F46E5') : theme.colors.navInactiveIcon}
                  strokeWidth={isActive ? 2.4 : 1.9}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? theme.colors.navActiveText : theme.colors.navInactiveText },
                  isActive && { fontWeight: '700' },
                ]}
              >
                {item.label}
              </Text>
              {isActive && (
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: isDarkMode ? '#818CF8' : '#4F46E5' },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0F172A',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 54,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  tabIcon: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tabIconActive: {
    color: '#818CF8',
    fontWeight: '800',
    transform: [{ scale: 1.15 }],
  },
  tabLabel: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#818CF8',
    marginTop: 3,
  },
  tabPressed: {
    opacity: 0.7,
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
});
