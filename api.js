// utils/api.js — Axios instance pointing at the backend
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chatapp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 (token expired/invalid), log user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('chatapp_token');
      localStorage.removeItem('chatapp_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
