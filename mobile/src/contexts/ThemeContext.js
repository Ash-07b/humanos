import React, { createContext, useContext, useState } from 'react';

export const DarkTheme = {
  isDark: true,
  colors: {
    // Backgrounds
    appBg: '#0A0E1A',
    desktopBg: '#05070D',
    pageBg: '#0B0F19',
    heroBg: '#0F172A',
    heroOverlay: 'rgba(11, 15, 25, 0.45)',
    cardBg: '#131B2E',
    cardAltBg: '#0E1626',
    cardSubtle: '#1E293B',
    handle: '#334155',
    
    // Header & Hero text
    textHero: '#F8FAFC',
    textHeroSub: '#CBD5E1',
    kicker: '#818CF8',
    
    // Body Text
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    
    // Primary Brand & Accents
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryLight: 'rgba(99, 102, 241, 0.18)',
    accent: '#818CF8',
    accentCyan: '#0284C7',
    accentCyanLight: 'rgba(2, 132, 199, 0.18)',
    accentAmber: '#F59E0B',
    accentAmberLight: 'rgba(245, 158, 11, 0.18)',
    accentEmerald: '#10B981',
    accentEmeraldLight: 'rgba(16, 185, 129, 0.18)',
    
    // Borders & Dividers
    border: '#1E293B',
    borderLight: '#172033',
    borderDark: 'rgba(99, 102, 241, 0.25)',
    borderFocus: '#6366F1',
    
    // Navigation
    navBg: '#0F172A',
    navBorder: 'rgba(99, 102, 241, 0.25)',
    navActiveIcon: '#818CF8',
    navInactiveIcon: '#64748B',
    navActiveText: '#F8FAFC',
    navInactiveText: '#64748B',
    
    // Inputs & Badges
    inputBg: '#0E1626',
    inputBorder: '#1E293B',
    inputText: '#F8FAFC',
    
    // Status Bar & Shadows
    statusBarStyle: 'light-content',
    shadowColor: '#000000',
  },
};

export const LightTheme = {
  isDark: false,
  colors: {
    // Backgrounds
    appBg: '#EEF2FF',
    desktopBg: '#E0E7FE',
    pageBg: '#F8FAFC',
    heroBg: '#1E1B4B',
    heroOverlay: 'rgba(30, 27, 75, 0.35)',
    cardBg: '#FFFFFF',
    cardAltBg: '#F8FAFC',
    cardSubtle: '#EEF2FF',
    handle: '#CBD5E1',
    
    // Header & Hero text
    textHero: '#FFFFFF',
    textHeroSub: '#E0E7FF',
    kicker: '#818CF8',
    
    // Body Text
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    
    // Primary Brand & Accents
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryLight: '#EEF2FF',
    accent: '#6366F1',
    accentCyan: '#0284C7',
    accentCyanLight: '#E0F2FE',
    accentAmber: '#D97706',
    accentAmberLight: '#FEF3C7',
    accentEmerald: '#059669',
    accentEmeraldLight: '#DCFCE7',
    
    // Borders & Dividers
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderDark: 'rgba(79, 70, 229, 0.2)',
    borderFocus: '#4F46E5',
    
    // Navigation
    navBg: '#FFFFFF',
    navBorder: '#E2E8F0',
    navActiveIcon: '#4F46E5',
    navInactiveIcon: '#94A3B8',
    navActiveText: '#4F46E5',
    navInactiveText: '#94A3B8',
    
    // Inputs & Badges
    inputBg: '#FFFFFF',
    inputBorder: '#CBD5E1',
    inputText: '#0F172A',
    
    // Status Bar & Shadows
    statusBarStyle: 'dark-content',
    shadowColor: '#0F172A',
  },
};

const ThemeContext = createContext({
  isDarkMode: true,
  setDarkMode: () => {},
  toggleTheme: () => {},
  theme: DarkTheme,
});

export function ThemeProvider({ children, initialDarkMode = true }) {
  const [isDarkMode, setIsDarkMode] = useState(initialDarkMode);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const setDarkMode = (val) => {
    setIsDarkMode(val);
  };

  const theme = isDarkMode ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, setDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
