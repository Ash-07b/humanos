import React, { useState } from 'react';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');

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
  };

  const handleRegisterSuccess = (userInfo) => {
    console.log('User registered with:', userInfo);
  };

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
}
