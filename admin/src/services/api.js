/**
 * HumanOS Admin Web API Service
 * Communicates with the Node.js Express Backend at http://127.0.0.1:5000
 */

const API_BASE_URL = 'http://127.0.0.1:5000/api';

/**
 * Generic Fetch Wrapper with Bearer JWT Auth
 */
async function adminRequest(endpoint, options = {}) {
  const token = localStorage.getItem('humanos_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    const errorHint = response.status === 404
      ? 'Admin API routes not loaded on backend. Please restart your backend server (Ctrl+C then npm start).'
      : `Server returned non-JSON response (HTTP ${response.status}).`;
    data = { success: false, message: errorHint };
  }

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Check backend server connectivity
 */
export const checkServerHealth = async () => {
  try {
    const res = await fetch('http://127.0.0.1:5000/');
    const data = await res.json();
    return res.ok && data.message ? true : false;
  } catch (e) {
    return false;
  }
};

/**
 * Admin Authentication
 */
export const loginAdmin = async (email, password) => {
  const data = await adminRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (data.user && data.user.role !== 'ADMIN') {
    throw new Error('Access Denied: This web dashboard requires Administrator privileges.');
  }

  return data;
};

/**
 * Dashboard Overview
 */
export const fetchDashboardOverview = async () => {
  return await adminRequest('/admin/dashboard');
};

/**
 * User Directory & Management
 */
export const fetchUsers = async (params = {}) => {
  const query = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
      query.append(k, params[k]);
    }
  });
  const qs = query.toString() ? `?${query.toString()}` : '';
  return await adminRequest(`/admin/users${qs}`);
};

export const fetchUserById = async (id) => {
  return await adminRequest(`/admin/users/${id}`);
};

export const updateUserStatus = async (id, status) => {
  return await adminRequest(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

/**
 * Reports & System Statistics
 */
export const fetchReports = async () => {
  return await adminRequest('/admin/reports');
};

/**
 * System Settings
 */
export const fetchSystemSettings = async () => {
  return await adminRequest('/admin/settings');
};

export const updateSystemSettings = async (settings) => {
  return await adminRequest('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
};

/**
 * System Activity Logs
 */
export const fetchActivityLogs = async (limit = 50) => {
  return await adminRequest(`/admin/activity?limit=${limit}`);
};
