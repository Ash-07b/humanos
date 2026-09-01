import { Platform } from 'react-native';

/**
 * Determine the appropriate API base URL based on runtime platform
 */
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    // Android emulator loops back to host machine via 10.0.2.2
    return 'http://10.0.2.2:5000/api';
  }
  // iOS simulator, desktop web, and node environments
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getBaseUrl();

/**
 * Generic JSON API request handler with timeout and error handling
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: data.message || `Request failed with status ${response.status}`,
        data,
      };
    }

    return {
      success: true,
      status: response.status,
      ...data,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Connection timed out. Please verify the backend server is running.',
      };
    }
    return {
      success: false,
      message: error.message || 'Network request failed. Please check your connection.',
    };
  }
};

/**
 * Register a new client user
 * @param {Object} userData - Registration payload
 */
export const registerUser = async (userData) => {
  // Ensure we only pass expected client fields and sanitize inputs
  const payload = {
    fullName: userData.fullName ? userData.fullName.trim() : '',
    email: userData.email ? userData.email.trim().toLowerCase() : '',
    phoneNumber: userData.phoneNumber ? userData.phoneNumber.trim() : '',
    password: userData.password || '',
    gender: userData.gender && userData.gender !== 'Gender' ? userData.gender : '',
    dateOfBirth: userData.dob || userData.dateOfBirth || '',
    profilePicture: userData.profilePic || userData.profilePicture || '',
  };

  return await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Authenticate user and receive JWT token
 * @param {string} email
 * @param {string} password
 */
export const loginUser = async (email, password) => {
  const payload = {
    email: (email || '').trim().toLowerCase(),
    password: password || '',
  };

  return await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Fetch authenticated user profile using token
 * @param {string} token - JWT Token
 */
export const fetchUserProfile = async (token) => {
  return await apiRequest('/auth/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Update authenticated user profile in the database
 * @param {Object} userData - Profile fields to update (fullName, phoneNumber, gender, dob, profilePicture)
 * @param {string} token - JWT Token
 */
export const updateUserProfile = async (userData, token) => {
  return await apiRequest('/auth/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
};

/**
 * Task Management API Calls
 */

/**
 * Create a new task
 * @param {Object} taskData - Task payload { title, description, priority, category, dueDate, dueTime, reminder }
 * @param {string} token - JWT Token
 */
export const createTask = async (taskData, token) => {
  return await apiRequest('/tasks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });
};

/**
 * Fetch all tasks for authenticated user
 * @param {Object} filters - Optional query filters { status, priority, category, dueDate }
 * @param {string} token - JWT Token
 */
export const fetchTasks = async (filters = {}, token) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return await apiRequest(`/tasks${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Fetch single task by ID
 * @param {string} taskId - Task ID
 * @param {string} token - JWT Token
 */
export const fetchTaskById = async (taskId, token) => {
  return await apiRequest(`/tasks/${taskId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Update task by ID
 * @param {string} taskId - Task ID
 * @param {Object} updateData - Updated task fields
 * @param {string} token - JWT Token
 */
export const updateTask = async (taskId, updateData, token) => {
  return await apiRequest(`/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
};

/**
 * Delete task by ID
 * @param {string} taskId - Task ID
 * @param {string} token - JWT Token
 */
export const deleteTask = async (taskId, token) => {
  return await apiRequest(`/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Toggle task completion status
 * @param {string} taskId - Task ID
 * @param {string} token - JWT Token
 */
export const toggleTaskComplete = async (taskId, token) => {
  return await apiRequest(`/tasks/${taskId}/toggle`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Request AI Health Recommendation from Ollama / Backend
 * @param {Object} telemetry - Telemetry metrics (heartRate, sleep, bloodPressure, steps, etc.)
 * @param {string} token - User JWT token (optional)
 */
export const fetchAiHealthRecommendation = async (telemetry, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return await apiRequest('/ai/health-recommendation', {
    method: 'POST',
    headers,
    body: JSON.stringify(telemetry),
  });
};

export const fetchAiGoalRecommendation = async (goalData, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return await apiRequest('/ai/goal-recommendation', {
    method: 'POST',
    headers,
    body: JSON.stringify(goalData),
  });
};

export const fetchAiTaskRecommendation = async (taskData, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return await apiRequest('/ai/task-recommendation', {
    method: 'POST',
    headers,
    body: JSON.stringify(taskData),
  });
};

export const fetchAiFinanceRecommendation = async (financeData, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return await apiRequest('/ai/finance-recommendation', {
    method: 'POST',
    headers,
    body: JSON.stringify(financeData),
  });
};

export const fetchAiNoteAssistant = async (noteData, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return await apiRequest('/ai/note-assistant', {
    method: 'POST',
    headers,
    body: JSON.stringify(noteData),
  });
};

export const fetchAiGeneralAssistant = async (assistantData, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return await apiRequest('/ai/assistant', {
    method: 'POST',
    headers,
    body: JSON.stringify(assistantData),
  });
};

/**
 * Fetch AI recommendation history
 * @param {string} token - User JWT token
 */
export const fetchAiHistory = async (token) => {
  return await apiRequest('/ai/history', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};



