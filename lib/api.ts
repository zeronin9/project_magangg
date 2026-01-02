// lib/api.ts

const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.NEXT_PUBLIC_API_URL || 
  'http://localhost:3000/api'; // ✅ UBAH: Port 3000 sesuai backend

// Validation check
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL && !process.env.NEXT_PUBLIC_API_URL) {
    console.warn('⚠️ Warning: API URL tidak dikonfigurasi di .env.local. Menggunakan default URL: ' + API_BASE_URL);
  } else {
    console.log('✅ API URL configured:', API_BASE_URL);
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
  
  console.log('🔵 API Request:', {
    method: options.method || 'GET',
    url,
    hasToken: !!token,
    body: isFormData ? 'FormData' : options.body
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      // Jika json body, stringify. Jika FormData, biarkan raw.
      body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
    });

    console.log('🟢 API Response:', {
      status: response.status,
      statusText: response.statusText,
      url
    });

    if (response.status === 401) {
      console.error('🔴 Unauthorized - Redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('🔴 API Error Response:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Success:', data);
    return data;
  } catch (error: any) {
    // Tangani berbagai jenis error
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('🔴 Network Error: Tidak dapat terhubung ke backend', {
        url,
        possibleCauses: [
          'Backend tidak berjalan',
          'Port salah (pastikan backend di port 3000)',
          'CORS issue',
          'Firewall blocking'
        ]
      });
      throw new Error('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan di ' + API_BASE_URL);
    }
    
    console.error('🔴 API Error:', error);
    throw error;
  }
}

// ✅ DEFINISI APICLIENT
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