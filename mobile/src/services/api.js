import { Platform, NativeModules } from 'react-native';

/**
 * Determine the appropriate API base URL based on runtime platform and environment
 */
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // Detect the host machine IP dynamically from Metro bundle scriptURL (used by Expo Go on physical phones)
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:\/]+)/);
      const host = match ? match[1] : null;
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:5000/api`;
      }
    }
  } catch (e) {
    // fallback
  }

  // Default LAN IP for physical device connection
  return 'http://192.168.1.176:5000/api';
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
    const isAi = endpoint.startsWith('/ai');
    const timeoutMs = options.timeout || (isAi ? 60000 : 15000);
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
 * Goal Management API Calls
 */

/**
 * Create a new goal
 * @param {Object} goalData - Goal payload { title, description, category, priority, targetDate, milestones, progress, status }
 * @param {string} token - JWT Token
 */
export const createGoal = async (goalData, token) => {
  return await apiRequest('/goals', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(goalData),
  });
};

/**
 * Fetch all goals for authenticated user
 * @param {Object} filters - Optional query filters { status, category, priority, search }
 * @param {string} token - JWT Token
 */
export const fetchGoals = async (filters = {}, token) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return await apiRequest(`/goals${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Fetch a single goal by ID
 * @param {string} goalId - Goal ID
 * @param {string} token - JWT Token
 */
export const fetchGoalById = async (goalId, token) => {
  return await apiRequest(`/goals/${goalId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Update an existing goal
 * @param {string} goalId - Goal ID
 * @param {Object} updateData - Updated goal fields
 * @param {string} token - JWT Token
 */
export const updateGoal = async (goalId, updateData, token) => {
  return await apiRequest(`/goals/${goalId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
};

/**
 * Update goal progress
 * @param {string} goalId - Goal ID
 * @param {number} progress - Progress value (0 - 100)
 * @param {string} note - Optional note
 * @param {string} token - JWT Token
 */
export const updateGoalProgress = async (goalId, progress, note = '', token) => {
  return await apiRequest(`/goals/${goalId}/progress`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ progress, note }),
  });
};

/**
 * Mark a goal as completed
 * @param {string} goalId - Goal ID
 * @param {string} token - JWT Token
 */
export const completeGoal = async (goalId, token) => {
  return await apiRequest(`/goals/${goalId}/complete`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Add a milestone to a goal
 * @param {string} goalId - Goal ID
 * @param {string} text - Milestone description
 * @param {string} token - JWT Token
 */
export const addGoalMilestone = async (goalId, text, token) => {
  return await apiRequest(`/goals/${goalId}/milestones`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
};

/**
 * Toggle a milestone's completion status
 * @param {string} goalId - Goal ID
 * @param {string} milestoneId - Milestone ID
 * @param {string} token - JWT Token
 */
export const toggleGoalMilestone = async (goalId, milestoneId, token) => {
  return await apiRequest(`/goals/${goalId}/milestones/${milestoneId}/toggle`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Delete a goal by ID
 * @param {string} goalId - Goal ID
 * @param {string} token - JWT Token
 */
export const deleteGoal = async (goalId, token) => {
  return await apiRequest(`/goals/${goalId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Health Records API Calls
 */

/**
 * Fetch all health records for authenticated user
 * @param {Object} filters - Optional query filters { type }
 * @param {string} token - JWT Token
 */
export const fetchHealthRecords = async (filters = {}, token) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return await apiRequest(`/health${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Fetch single health record by ID
 * @param {string} recordId - Health record ID
 * @param {string} token - JWT Token
 */
export const fetchHealthRecordById = async (recordId, token) => {
  return await apiRequest(`/health/${recordId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Create a new health record
 * @param {Object} recordData - Record payload { type, value, unit, date, time, notes }
 * @param {string} token - JWT Token
 */
export const createHealthRecord = async (recordData, token) => {
  return await apiRequest('/health', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(recordData),
  });
};

/**
 * Update an existing health record
 * @param {string} recordId - Health record ID
 * @param {Object} updateData - Updated health record fields
 * @param {string} token - JWT Token
 */
export const updateHealthRecord = async (recordId, updateData, token) => {
  return await apiRequest(`/health/${recordId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
};

/**
 * Delete a health record
 * @param {string} recordId - Health record ID
 * @param {string} token - JWT Token
 */
export const deleteHealthRecord = async (recordId, token) => {
  return await apiRequest(`/health/${recordId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Medication Management API Calls
 */

/**
 * Fetch all medications for authenticated user
 * @param {Object} filters - Optional query filters { status }
 * @param {string} token - JWT Token
 */
export const fetchMedications = async (filters = {}, token) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return await apiRequest(`/medications${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Fetch single medication by ID
 * @param {string} medId - Medication ID
 * @param {string} token - JWT Token
 */
export const fetchMedicationById = async (medId, token) => {
  return await apiRequest(`/medications/${medId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Create a new medication
 * @param {Object} medData - Medication payload { name, dosage, frequency, reminderTime, startDate, endDate, instructions, status }
 * @param {string} token - JWT Token
 */
export const createMedication = async (medData, token) => {
  return await apiRequest('/medications', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(medData),
  });
};

/**
 * Update an existing medication
 * @param {string} medId - Medication ID
 * @param {Object} updateData - Updated medication fields
 * @param {string} token - JWT Token
 */
export const updateMedication = async (medId, updateData, token) => {
  return await apiRequest(`/medications/${medId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
};

/**
 * Delete a medication
 * @param {string} medId - Medication ID
 * @param {string} token - JWT Token
 */
export const deleteMedication = async (medId, token) => {
  return await apiRequest(`/medications/${medId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Calendar & Event Management API Calls
 */

/**
 * Fetch all calendar events for authenticated user
 * @param {Object} filters - Optional query filters { dateString, tag, startDate, endDate, month }
 * @param {string} token - JWT Token
 */
export const fetchCalendarEvents = async (filters = {}, token) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return await apiRequest(`/calendar${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Fetch single calendar event by ID
 * @param {string} eventId - Event ID
 * @param {string} token - JWT Token
 */
export const fetchCalendarEventById = async (eventId, token) => {
  return await apiRequest(`/calendar/${eventId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Create a new calendar event
 * @param {Object} eventData - Event payload { title, description, dateString, startTime, endTime, time, tag, color, location, reminder }
 * @param {string} token - JWT Token
 */
export const createCalendarEvent = async (eventData, token) => {
  return await apiRequest('/calendar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });
};

/**
 * Update an existing calendar event
 * @param {string} eventId - Event ID
 * @param {Object} updateData - Updated event fields
 * @param {string} token - JWT Token
 */
export const updateCalendarEvent = async (eventId, updateData, token) => {
  return await apiRequest(`/calendar/${eventId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
};

/**
 * Delete a calendar event
 * @param {string} eventId - Event ID
 * @param {string} token - JWT Token
 */
export const deleteCalendarEvent = async (eventId, token) => {
  return await apiRequest(`/calendar/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Finance & Transaction Management API Calls
 */

/**
 * Fetch all transactions for authenticated user with summary stats
 * @param {Object} filters - Optional query filters { type, category, search }
 * @param {string} token - JWT Token
 */
export const fetchTransactions = async (filters = {}, token) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return await apiRequest(`/finance${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Fetch single transaction by ID
 * @param {string} txId - Transaction ID
 * @param {string} token - JWT Token
 */
export const fetchTransactionById = async (txId, token) => {
  return await apiRequest(`/finance/${txId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Create a new financial transaction (Income or Expense)
 * @param {Object} txData - Transaction payload { title, amount, type, category, date }
 * @param {string} token - JWT Token
 */
export const createTransaction = async (txData, token) => {
  return await apiRequest('/finance', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(txData),
  });
};

/**
 * Update an existing financial transaction
 * @param {string} txId - Transaction ID
 * @param {Object} updateData - Updated fields
 * @param {string} token - JWT Token
 */
export const updateTransaction = async (txId, updateData, token) => {
  return await apiRequest(`/finance/${txId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
};

/**
 * Delete a financial transaction
 * @param {string} txId - Transaction ID
 * @param {string} token - JWT Token
 */
export const deleteTransaction = async (txId, token) => {
  return await apiRequest(`/finance/${txId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Notes & Knowledge Base API Calls
 */

/**
 * Fetch all notes for authenticated user
 * @param {Object} filters - Optional query filters { tag, category, search, pinned }
 * @param {string} token - JWT Token
 */
export const fetchNotes = async (filters = {}, token) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return await apiRequest(`/notes${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Fetch single note by ID
 * @param {string} noteId - Note ID
 * @param {string} token - JWT Token
 */
export const fetchNoteById = async (noteId, token) => {
  return await apiRequest(`/notes/${noteId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Create a new note
 * @param {Object} noteData - Note payload { title, body, tag, pinned }
 * @param {string} token - JWT Token
 */
export const createNote = async (noteData, token) => {
  return await apiRequest('/notes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(noteData),
  });
};

/**
 * Update an existing note
 * @param {string} noteId - Note ID
 * @param {Object} updateData - Updated fields
 * @param {string} token - JWT Token
 */
export const updateNote = async (noteId, updateData, token) => {
  return await apiRequest(`/notes/${noteId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
};

/**
 * Toggle pin status of a note
 * @param {string} noteId - Note ID
 * @param {string} token - JWT Token
 */
export const togglePinNote = async (noteId, token) => {
  return await apiRequest(`/notes/${noteId}/pin`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Delete a note
 * @param {string} noteId - Note ID
 * @param {string} token - JWT Token
 */
export const deleteNote = async (noteId, token) => {
  return await apiRequest(`/notes/${noteId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Notifications & Reminders API Calls
 */

/**
 * Fetch all notifications for authenticated user
 * @param {Object} filters - Optional query filters { read, type, limit }
 * @param {string} token - JWT Token
 */
export const fetchNotifications = async (filters = {}, token) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return await apiRequest(`/notifications${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Fetch unread notification count for authenticated user
 * @param {string} token - JWT Token
 */
export const fetchUnreadNotificationCount = async (token) => {
  return await apiRequest('/notifications/unread-count', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Create a notification / reminder
 * @param {Object} notificationData - { title, message, type, relatedEntityId, scheduledTime }
 * @param {string} token - JWT Token
 */
export const createNotification = async (notificationData, token) => {
  return await apiRequest('/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(notificationData),
  });
};

/**
 * Mark a single notification as read
 * @param {string} id - Notification ID
 * @param {string} token - JWT Token
 */
export const markNotificationAsRead = async (id, token) => {
  return await apiRequest(`/notifications/${id}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Mark a single notification as unread
 * @param {string} id - Notification ID
 * @param {string} token - JWT Token
 */
export const markNotificationAsUnread = async (id, token) => {
  return await apiRequest(`/notifications/${id}/unread`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Mark all notifications as read
 * @param {string} token - JWT Token
 */
export const markAllNotificationsAsRead = async (token) => {
  return await apiRequest('/notifications/mark-all-read', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Delete a notification
 * @param {string} id - Notification ID
 * @param {string} token - JWT Token
 */
export const deleteNotification = async (id, token) => {
  return await apiRequest(`/notifications/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Clear all notifications
 * @param {string} token - JWT Token
 */
export const clearAllNotifications = async (token) => {
  return await apiRequest('/notifications', {
    method: 'DELETE',
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

/**
 * Fetch Health Recommendation History specifically
 * @param {string} token - User JWT token
 */
export const fetchAiHealthRecommendations = async (token) => {
  return await apiRequest('/ai/health-recommendations', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};




