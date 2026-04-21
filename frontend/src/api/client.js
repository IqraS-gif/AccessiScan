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
    // Get the OIDC user from sessionStorage (react-oidc-context stores it here)
    const storageKey = `oidc.user:https://cognito-idp.us-east-1.amazonaws.com/us-east-1_qPTDgvkKe:2merv8shtv2gaj65bvui5msdjl`;
    const oidcStorage = sessionStorage.getItem(storageKey);

    if (oidcStorage) {
      const user = JSON.parse(oidcStorage);
      if (user?.id_token) {
        config.headers.Authorization = `Bearer ${user.id_token}`;
      }
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
      // Clear stored user and reload to trigger login
      const storageKey = `oidc.user:https://cognito-idp.us-east-1.amazonaws.com/us-east-1_qPTDgvkKe:2merv8shtv2gaj65bvui5msdjl`;
      sessionStorage.removeItem(storageKey);
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
