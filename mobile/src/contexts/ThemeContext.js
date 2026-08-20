import React, { createContext, useContext, useState } from 'react';

export const DarkTheme = {
  isDark: true,
  colors: {
    // Full Dark Backgrounds
    appBg: '#0A0E1A',
    desktopBg: '#05070D',
    pageBg: '#0B0F19',          // Deep Midnight Body
    heroBg: '#0F172A',
    heroOverlay: 'rgba(11, 15, 25, 0.45)',
    cardBg: '#131B2E',          // Elevated Dark Card
    cardAltBg: '#0E1626',       // Inner items / rows
    cardSubtle: '#1E293B',
    handle: '#334155',
    
    // Header & Hero text
    textHero: '#F8FAFC',
    textHeroSub: '#CBD5E1',
    kicker: '#C7D2FE',
    
    // Body Text
    textPrimary: '#F8FAFC',     // Crisp White Heading / Value
    textSecondary: '#94A3B8',   // Muted Silver Subtitle
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
    
    // Borders & Dividers
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.05)',
    borderDark: 'rgba(99, 102, 241, 0.25)',
    borderFocus: '#6366F1',
    
    // Navigation
    navBg: '#0B0F19',
    navBorder: 'rgba(99, 102, 241, 0.25)',
    navActiveIcon: '#818CF8',
    navInactiveIcon: '#64748B',
    navActiveText: '#F8FAFC',
    navInactiveText: '#64748B',
    
    // Inputs & Badges
    inputBg: '#0B0F19',
    inputBorder: '#2A374E',
    inputText: '#F8FAFC',
    
    // Status Bar
    statusBarStyle: 'light-content',
    shadowColor: '#000000',
  },
};

export const LightTheme = {
  isDark: false,
  colors: {
    // Full Light Backgrounds
    appBg: '#EEF2FF',
    desktopBg: '#E0E7FE',
    pageBg: '#F8FAFC',          // Clean Daylight Porcelain Body
    heroBg: '#3730A3',
    heroOverlay: 'rgba(30, 27, 75, 0.35)',
    cardBg: '#FFFFFF',          // Pure White Card
    cardAltBg: '#F1F5F9',       // Inner items / rows
    cardSubtle: '#EEF2FF',
    handle: '#CBD5E1',
    
    // Header & Hero text
    textHero: '#FFFFFF',
    textHeroSub: '#E0E7FF',
    kicker: '#C7D2FE',
    
    // Body Text
    textPrimary: '#0F172A',     // Dark Slate Heading / Value
    textSecondary: '#64748B',   // Muted Slate Subtitle
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
    
    // Borders & Dividers
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderDark: 'rgba(79, 70, 229, 0.2)',
    borderFocus: '#4F46E5',
    
    // Navigation
    navBg: '#0F172A',
    navBorder: 'rgba(79, 70, 229, 0.2)',
    navActiveIcon: '#A5B4FC',
    navInactiveIcon: '#94A3B8',
    navActiveText: '#FFFFFF',
    navInactiveText: '#94A3B8',
    
    // Inputs & Badges
    inputBg: '#FFFFFF',
    inputBorder: '#CBD5E1',
    inputText: '#0F172A',
    
    // Status Bar
    statusBarStyle: 'light-content',
    shadowColor: '#0F172A',
  },
};

const ThemeContext = createContext({
  isDarkMode: true,
  setDarkMode: () => {},
  toggleTheme: () => {},
  theme: DarkTheme,
});

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

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
