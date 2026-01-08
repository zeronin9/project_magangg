export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/auth/register`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  GET_DEVICE_INFO: `${API_BASE_URL}/auth/device-info`,
};
