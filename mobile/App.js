import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [currentUser, setCurrentUser] = useState(null);

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

  const handleLoginSuccess = (credentials) => {
    console.log('User logged in with:', credentials);
    setCurrentUser(credentials || null);
    setCurrentScreen('dashboard');
  };

  const handleRegisterSuccess = (userInfo) => {
    console.log('User registered with:', userInfo);
    setCurrentUser(userInfo || null);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
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
    if (currentScreen === 'profile') {
      return (
        <ProfileScreen
          user={currentUser}
          onLogout={handleLogout}
          onNavigateTab={handleNavigateTab}
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
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      {renderScreen()}
    </SafeAreaProvider>
  );
}
