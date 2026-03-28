import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
