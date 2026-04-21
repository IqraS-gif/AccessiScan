import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Axios Request Interceptor ───
// Automatically attaches the Cognito JWT token to every API request
api.interceptors.request.use(
  (config) => {
    // Search for the OIDC user token in sessionStorage (key starts with 'oidc.user:')
    let token = null;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('oidc.user:')) {
        const oidcStorage = sessionStorage.getItem(key);
        if (oidcStorage) {
          const user = JSON.parse(oidcStorage);
          if (user?.id_token) {
            token = user.id_token;
            break;
          }
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Axios Response Interceptor ───
// Redirects to login on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized — token may be expired.');
      // Clear all stored OIDC users and reload to trigger login
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('oidc.user:')) {
          sessionStorage.removeItem(key);
        }
      }
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const startScan = async (url, userId = 'default_user') => {
  const response = await api.post('/api/scan', { url, user_id: userId });
  return response.data;
};

export const getScanHistory = async (userId = null) => {
  const params = userId ? { user_id: userId } : {};
  const response = await api.get('/api/scans', { params });
  return response.data;
};

export const getScanById = async (scanId) => {
  const response = await api.get(`/api/scan/${scanId}`);
  return response.data;
};

export const getScreenshotUrl = (scanId) => {
  return `${API_BASE_URL}/api/scan/${scanId}/screenshot`;
};

export const getPdfUrl = (scanId) => {
  return `${API_BASE_URL}/api/scan/${scanId}/pdf`;
};

export default api;
