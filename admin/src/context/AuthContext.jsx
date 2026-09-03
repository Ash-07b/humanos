import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAdmin } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('humanos_admin_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('humanos_admin_user');
    const savedToken = localStorage.getItem('humanos_admin_token');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'ADMIN') {
          setAdmin(parsed);
          setToken(savedToken);
        } else {
          // Clear non-admin data
          localStorage.removeItem('humanos_admin_token');
          localStorage.removeItem('humanos_admin_user');
        }
      } catch (e) {
        localStorage.removeItem('humanos_admin_token');
        localStorage.removeItem('humanos_admin_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginAdmin(email, password);

    if (data.user && data.user.role === 'ADMIN') {
      localStorage.setItem('humanos_admin_token', data.token);
      localStorage.setItem('humanos_admin_user', JSON.stringify(data.user));
      setAdmin(data.user);
      setToken(data.token);
      return data;
    } else {
      throw new Error('Access Denied: This account does not possess Administrator authorization.');
    }
  };

  const logout = () => {
    localStorage.removeItem('humanos_admin_token');
    localStorage.removeItem('humanos_admin_user');
    setAdmin(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, loading, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
