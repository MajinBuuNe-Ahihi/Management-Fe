import axios from 'axios';
import { clearAuthToken, getAuthToken } from '../utils/auth';

const rawBaseUrl = ('http://223.130.11.17/api').replace(/\/+$/, '');
const apiBaseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

console.log('API Base URL configured as:', apiBaseUrl);

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  // Attach admin JWT for protected backend routes.
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Clear invalid token and force login on unauthorized responses.
    if (error?.response?.status === 401) {
      clearAuthToken();
      if (!window.location.pathname.startsWith('/share/')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
