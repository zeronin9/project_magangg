// lib/api.ts

const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.NEXT_PUBLIC_API_URL || 
  'http://localhost:3001/api';

// Validation check
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL && !process.env.NEXT_PUBLIC_API_URL) {
    console.warn('⚠️ Warning: API URL tidak dikonfigurasi di .env.local. Menggunakan default URL.');
  }
}

interface FetchOptions extends RequestInit {
  body?: any;
}

export async function fetchWithAuth(endpoint: string, options: FetchOptions = {}) {
  const token = localStorage.getItem('token');

  // Cek apakah body adalah FormData (untuk upload file)
  const isFormData = options.body instanceof FormData;

  const headers: any = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // PENTING: Jangan set Content-Type jika FormData (biarkan browser set boundary)
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      // Jika json body, stringify. Jika FormData, biarkan raw.
      body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
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

// Tambahkan helper khusus untuk Auth agar lebih bersih dipakai di page
export const authClient = {
  register: async (data: any) => {
    return fetchWithAuth('/auth/register', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  },
  verifyEmail: async (data: { email: string; code: string }) => {
    return fetchWithAuth('/auth/verify-email', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  }
};

// ✅ DEFINISI APICLIENT (Tambahkan ini agar tidak merah di branch.ts)
export const apiClient = {
  get: async (endpoint: string) => {
    const data = await fetchWithAuth(endpoint, { method: 'GET' });
    // Bungkus dalam { data } agar konsisten jika backend return array langsung
    return { data }; 
  },
  post: async (endpoint: string, body: any, options: any = {}) => {
    const data = await fetchWithAuth(endpoint, { method: 'POST', body, ...options });
    return { data };
  },
  put: async (endpoint: string, body: any, options: any = {}) => {
    const data = await fetchWithAuth(endpoint, { method: 'PUT', body, ...options });
    return { data };
  },
  delete: async (endpoint: string) => {
    const data = await fetchWithAuth(endpoint, { method: 'DELETE' });
    return { data };
  }
};

export { API_BASE_URL };