import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/contexts/ThemeContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import DashboardScreen from './src/screens/main/DashboardScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import TasksScreen from './src/screens/main/TasksScreen';
import GoalsScreen from './src/screens/main/GoalsScreen';
import FinanceScreen from './src/screens/main/FinanceScreen';
import NotesScreen from './src/screens/main/NotesScreen';
import CalendarScreen from './src/screens/main/CalendarScreen';
import HealthScreen from './src/screens/main/HealthScreen';
import { ReminderProvider } from './src/contexts/ReminderContext';
import ReminderModal from './src/components/ReminderModal';
import { getToken, getUser, saveUser, clearSession } from './src/services/storage';
import { fetchUserProfile } from './src/services/api';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [currentUser, setCurrentUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Restore authentication state when app starts
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await getToken();
        const cachedUser = await getUser();

        if (token) {
          // Fetch fresh user profile from backend API to validate JWT token and role
          const profileResponse = await fetchUserProfile(token);

          if (profileResponse.success && profileResponse.user) {
            const userObj = {
              ...profileResponse.user,
              id: profileResponse.user._id || profileResponse.user.id,
              profilePic: profileResponse.user.profilePicture || cachedUser?.profilePic || '⚡',
            };
            await saveUser(userObj);
            setCurrentUser(userObj);
            setCurrentScreen('dashboard');
          } else if (cachedUser) {
            // Retain cached session if offline/temporary network glitch
            setCurrentUser(cachedUser);
            setCurrentScreen('dashboard');
          } else {
            // Token is invalid or expired
            await clearSession();
            setCurrentScreen('welcome');
          }
        } else {
          setCurrentScreen('welcome');
        }
      } catch (error) {
        console.warn('Error restoring authentication session:', error);
        setCurrentScreen('welcome');
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();
  }, []);

  const handleOpenRegister = () => {
    setCurrentScreen('register');
  };

  const handleOpenLogin = () => {
    setCurrentScreen('login');
  };

  const handleBackToWelcome = () => {
    setCurrentScreen('welcome');
  };

  const handleOpenForgotPassword = () => {
    setCurrentScreen('forgotPassword');
  };

  const handleBackToLogin = () => {
    setCurrentScreen('login');
  };

  const handleLoginSuccess = (user) => {
    const userObj = user
      ? {
          ...user,
          id: user._id || user.id,
          profilePic: user.profilePicture || user.profilePic || '⚡',
        }
      : null;
    setCurrentUser(userObj);
    setCurrentScreen('dashboard');
  };

  const handleRegisterSuccess = (user) => {
    const userObj = user
      ? {
          ...user,
          id: user._id || user.id,
          profilePic: user.profilePicture || user.profilePic || '⚡',
        }
      : null;
    setCurrentUser(userObj);
    setCurrentScreen('dashboard');
  };

  const handleUpdateUser = async (updatedData) => {
    if (!updatedData) return;
    setCurrentUser((prev) => {
      const merged = {
        ...(prev || {}),
        ...updatedData,
        id: updatedData._id || updatedData.id || prev?.id,
        profilePic: updatedData.profilePicture || updatedData.profilePic || prev?.profilePic || '⚡',
        profilePicture: updatedData.profilePicture || updatedData.profilePic || prev?.profilePicture,
      };
      saveUser(merged);
      return merged;
    });
  };

  const handleLogout = async () => {
    try {
      await clearSession();
    } catch (e) {
      console.warn('Error during logout:', e);
    }
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  const handleNavigateTab = (tabId) => {
    if (
      tabId === 'profile' ||
      tabId === 'dashboard' ||
      tabId === 'tasks' ||
      tabId === 'goals' ||
      tabId === 'health' ||
      tabId === 'finance' ||
      tabId === 'notes' ||
      tabId === 'calendar'
    ) {
      setCurrentScreen(tabId);
    }
  };

  const renderScreen = () => {
    if (initializing) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0E1A', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      );
    }

    if (currentScreen === 'profile') {
      return (
        <ProfileScreen
          user={currentUser}
          onLogout={handleLogout}
          onNavigateTab={handleNavigateTab}
          onUpdateUser={handleUpdateUser}
        />
      );
    }

    if (currentScreen === 'tasks') {
      return (
        <TasksScreen
          user={currentUser}
          onLogout={handleLogout}
          onNavigateTab={handleNavigateTab}
        />
      );
    }

    if (currentScreen === 'goals') {
      return (
        <GoalsScreen
          user={currentUser}
          onLogout={handleLogout}
          onNavigateTab={handleNavigateTab}
        />
      );
    }

    if (currentScreen === 'health') {
      return (
        <HealthScreen
          user={currentUser}
          onLogout={handleLogout}
          onNavigateTab={handleNavigateTab}
        />
      );
    }

    if (currentScreen === 'finance') {
      return (
        <FinanceScreen
          user={currentUser}
          onLogout={handleLogout}
          onNavigateTab={handleNavigateTab}
        />
      );
    }

    if (currentScreen === 'notes') {
      return (
        <NotesScreen
          user={currentUser}
          onLogout={handleLogout}
          onNavigateTab={handleNavigateTab}
        />
      );
    }

    if (currentScreen === 'calendar') {
      return (
        <CalendarScreen
          user={currentUser}
          onLogout={handleLogout}
          onNavigateTab={handleNavigateTab}
        />
      );
    }

    if (currentScreen === 'dashboard') {
      return (
        <DashboardScreen
          user={currentUser}
          onLogout={handleLogout}
          onNavigateTab={handleNavigateTab}
          onUpdateUser={handleUpdateUser}
        />
      );
    }

    if (currentScreen === 'login') {
      return (
        <LoginScreen
          onBack={handleBackToWelcome}
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={handleOpenRegister}
          onForgotPassword={handleOpenForgotPassword}
        />
      );
    }

    if (currentScreen === 'forgotPassword') {
      return (
        <ForgotPasswordScreen
          onBack={handleBackToLogin}
        />
      );
    }

    if (currentScreen === 'register') {
      return (
        <RegisterScreen
          onBack={handleBackToWelcome}
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={handleOpenLogin}
        />
      );
    }

    return (
      <WelcomeScreen
        onBegin={handleOpenRegister}
        onLogin={handleOpenLogin}
      />
    );
  };

  return (
    <ThemeProvider initialDarkMode={currentUser?.preferences?.darkMode ?? true}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
        <ReminderProvider user={currentUser} onNavigateTab={handleNavigateTab}>
          {renderScreen()}
          <ReminderModal />
        </ReminderProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
