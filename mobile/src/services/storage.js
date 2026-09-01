import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'humanos_auth_token';
const USER_KEY = 'humanos_auth_user';

// In-memory fallback for environments where neither SecureStore nor localStorage is available
const memoryStorage = new Map();

/**
 * Helper to check if SecureStore is natively supported on current platform
 */
const isSecureStoreAvailable = () => {
  return Platform.OS !== 'web';
};

/**
 * Save item securely
 */
export const setSecureItem = async (key, value) => {
  try {
    if (isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(key, value);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    } else {
      memoryStorage.set(key, value);
    }
  } catch (error) {
    console.warn(`Error storing key "${key}":`, error);
    memoryStorage.set(key, value);
  }
};

/**
 * Get item securely
 */
export const getSecureItem = async (key) => {
  try {
    if (isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(key);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    } else {
      return memoryStorage.get(key) || null;
    }
  } catch (error) {
    console.warn(`Error retrieving key "${key}":`, error);
    return memoryStorage.get(key) || null;
  }
};

/**
 * Delete item securely
 */
export const deleteSecureItem = async (key) => {
  try {
    if (isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(key);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    } else {
      memoryStorage.delete(key);
    }
  } catch (error) {
    console.warn(`Error deleting key "${key}":`, error);
    memoryStorage.delete(key);
  }
};

/**
 * Store JWT token
 */
export const saveToken = async (token) => {
  if (token) {
    await setSecureItem(TOKEN_KEY, token);
  }
};

/**
 * Retrieve stored JWT token
 */
export const getToken = async () => {
  return await getSecureItem(TOKEN_KEY);
};

/**
 * Remove stored JWT token
 */
export const removeToken = async () => {
  await deleteSecureItem(TOKEN_KEY);
};

/**
 * Store user session object
 */
export const saveUser = async (user) => {
  if (user) {
    await setSecureItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Retrieve stored user session object
 */
export const getUser = async () => {
  const data = await getSecureItem(USER_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Remove stored user session object
 */
export const removeUser = async () => {
  await deleteSecureItem(USER_KEY);
};

/**
 * Clear full session (token + user data)
 */
export const clearSession = async () => {
  await Promise.all([removeToken(), removeUser()]);
  memoryStorage.clear();
};
