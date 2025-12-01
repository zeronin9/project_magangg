// lib/api.ts

const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.NEXT_PUBLIC_API_URL || 
  'http://192.168.1.16:3001/api';

// Validation check
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL && !process.env.NEXT_PUBLIC_API_URL) {
    console.warn('⚠️ Warning: API URL tidak dikonfigurasi di .env.local. Menggunakan default URL.');
  } else {
    console.log('✅ API URL dikonfigurasi:', API_BASE_URL);
  }
}

interface FetchOptions extends RequestInit {
  body?: string;
}

export async function fetchWithAuth(endpoint: string, options: FetchOptions = {}) {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export { API_BASE_URL };
