// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
}

export async function uploadWithAuth(endpoint: string, formData: FormData) {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Upload failed');
  }

  return response.json();
}

// ==================== MITRA API FUNCTIONS ====================

// AUTH
export const authAPI = {
  login: (username: string, password: string) =>
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

// BRANCH MANAGEMENT
export const branchAPI = {
  getAll: () => fetchWithAuth('/branch'),
  
  create: (data: { branch_name: string; address: string; phone_number: string }) =>
    fetchWithAuth('/branch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: { branch_name?: string; address?: string; phone_number?: string }) =>
    fetchWithAuth(`/branch/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchWithAuth(`/branch/${id}`, {
      method: 'DELETE',
    }),
};

// BRANCH ADMIN MANAGEMENT
export const branchAdminAPI = {
  getAll: () => fetchWithAuth('/branch/admin'),
  
  create: (data: { full_name: string; username: string; password: string; branch_id: string }) =>
    fetchWithAuth('/branch/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: { full_name?: string; username?: string; password?: string }) =>
    fetchWithAuth(`/branch/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchWithAuth(`/branch/admin/${id}`, {
      method: 'DELETE',
    }),
};

// CATEGORY MANAGEMENT
export const categoryAPI = {
  getAll: () => fetchWithAuth('/category/all'),
  
  create: (data: { category_name: string }) =>
    fetchWithAuth('/category', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: { category_name: string }) =>
    fetchWithAuth(`/category/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchWithAuth(`/category/${id}`, {
      method: 'DELETE',
    }),
};

// PRODUCT MANAGEMENT
export const productAPI = {
  getAll: () => fetchWithAuth('/product'),
  
  create: (formData: FormData) => uploadWithAuth('/product', formData),
  
  update: async (id: string, formData: FormData) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/product/${id}`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Update failed');
    }

    return response.json();
  },
  
  delete: (id: string) =>
    fetchWithAuth(`/product/${id}`, {
      method: 'DELETE',
    }),
};

// DISCOUNT RULE MANAGEMENT
export const discountAPI = {
  getAll: () => fetchWithAuth('/discount-rule'),
  
  create: (data: any) =>
    fetchWithAuth('/discount-rule', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    fetchWithAuth(`/discount-rule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchWithAuth(`/discount-rule/${id}`, {
      method: 'DELETE',
    }),
};

// BRANCH DISCOUNT SETTINGS (untuk L1)
export const branchDiscountAPI = {
  getAll: () => fetchWithAuth('/branch-discount-setting'),
  
  updateSetting: (discountRuleId: string, data: any) =>
    fetchWithAuth(`/branch-discount-setting/${discountRuleId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// LICENSE MANAGEMENT
export const licenseAPI = {
  getAll: () => fetchWithAuth('/license'),
  
  generate: (quantity: number) =>
    fetchWithAuth('/license/generate', {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    }),
  
  assignBranch: (activation_code: string, branch_id: string) =>
    fetchWithAuth('/license/assign-branch', {
      method: 'PUT',
      body: JSON.stringify({ activation_code, branch_id }),
    }),
  
  resetDevice: (activation_code: string) =>
    fetchWithAuth('/license/reset-device', {
      method: 'PUT',
      body: JSON.stringify({ activation_code }),
    }),
  
  activate: (data: { activation_code: string; device_id: string; device_name: string }) =>
    fetchWithAuth('/license/activate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// SUBSCRIPTION MANAGEMENT
export const subscriptionAPI = {
  getPlans: () => fetchWithAuth('/subscription-plan'),
  
  createOrder: (plan_id: string) =>
    fetchWithAuth('/partner-subscription/order', {
      method: 'POST',
      body: JSON.stringify({ plan_id }),
    }),
};

// REPORTS
export const reportAPI = {
  getSales: (params?: { branchId?: string; tanggalMulai?: string; tanggalSelesai?: string }) => {
    const queryParams = new URLSearchParams(
      Object.entries(params || {}).filter(([_, v]) => v != null) as [string, string][]
    ).toString();
    return fetchWithAuth(`/report/sales${queryParams ? `?${queryParams}` : ''}`);
  },
  
  getExpenses: (params?: { branchId?: string; tanggalMulai?: string; tanggalSelesai?: string }) => {
    const queryParams = new URLSearchParams(
      Object.entries(params || {}).filter(([_, v]) => v != null) as [string, string][]
    ).toString();
    return fetchWithAuth(`/report/expenses${queryParams ? `?${queryParams}` : ''}`);
  },
  
  getItems: (params?: { branchId?: string; tanggalMulai?: string; tanggalSelesai?: string }) => {
    const queryParams = new URLSearchParams(
      Object.entries(params || {}).filter(([_, v]) => v != null) as [string, string][]
    ).toString();
    return fetchWithAuth(`/report/items${queryParams ? `?${queryParams}` : ''}`);
  },
};
