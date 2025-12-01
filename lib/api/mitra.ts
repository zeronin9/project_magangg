import axios from 'axios';
import { SubscriptionOrderResponse } from '@/types/mitra'; // Add this import

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.1.16:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config: any) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Handle errors
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  register: async (data: {
    business_name: string;
    business_email: string;
    business_phone: string;
    username: string;
    password: string;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  verifyEmail: async (data: { email: string; code: string }) => {
    const response = await apiClient.post('/auth/verify-email', data);
    return response.data;
  },

  login: async (data: { username: string; password: string }) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },
};

// ==================== BRANCH ====================
export const branchAPI = {
  getAll: async (showAll = false) => {
    const response = await apiClient.get('/branch', {
      params: showAll ? { show_all: true } : {},
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/branch/${id}`);
    return response.data;
  },

  create: async (data: {
    branch_name: string;
    address?: string;
    phone_number?: string;
  }) => {
    const response = await apiClient.post('/branch', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      branch_name?: string;
      address?: string;
      phone_number?: string;
      is_active?: boolean;
    }
  ) => {
    const response = await apiClient.put(`/branch/${id}`, data);
    return response.data;
  },

  softDelete: async (id: string) => {
    const response = await apiClient.delete(`/branch/${id}`);
    return response.data;
  },

  hardDelete: async (id: string) => {
    const response = await apiClient.delete(`/branch/permanent/${id}`);
    return response.data;
  },
};

// ==================== BRANCH ADMIN ====================
export const branchAdminAPI = {
  getAll: async () => {
    const response = await apiClient.get('/branch/admin');
    return response.data;
  },

  create: async (data: {
    full_name: string;
    username: string;
    password: string;
    branch_id: string;
  }) => {
    const response = await apiClient.post('/branch/admin', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      full_name?: string;
      username?: string;
      password?: string;
      branch_id?: string;
    }
  ) => {
    const response = await apiClient.put(`/branch/admin/${id}`, data);
    return response.data;
  },

  softDelete: async (id: string) => {
    const response = await apiClient.delete(`/branch/admin/${id}`);
    return response.data;
  },

  hardDelete: async (id: string) => {
    const response = await apiClient.delete(`/branch/admin/permanent/${id}`);
    return response.data;
  },
};

// ==================== PRODUCT ====================
export const productAPI = {
  getAll: async () => {
    const response = await apiClient.get('/product');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/product/${id}`);
    return response.data;
  },

  create: async (formData: FormData) => {
    const response = await apiClient.post('/product', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: string, formData: FormData) => {
    const response = await apiClient.put(`/product/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  softDelete: async (id: string) => {
    const response = await apiClient.delete(`/product/${id}`);
    return response.data;
  },

  hardDelete: async (id: string) => {
    const response = await apiClient.delete(`/product/permanent/${id}`);
    return response.data;
  },
};

// ==================== CATEGORY ====================
export const categoryAPI = {
  getAll: async () => {
    const response = await apiClient.get('/category');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/category/${id}`);
    return response.data;
  },

  create: async (data: { category_name: string }) => {
    const response = await apiClient.post('/category', data);
    return response.data;
  },

  update: async (id: string, data: { category_name: string }) => {
    const response = await apiClient.put(`/category/${id}`, data);
    return response.data;
  },

  softDelete: async (id: string) => {
    const response = await apiClient.delete(`/category/${id}`);
    return response.data;
  },

  hardDelete: async (id: string) => {
    const response = await apiClient.delete(`/category/permanent/${id}`);
    return response.data;
  },
};

// ==================== DISCOUNT ====================
export const discountAPI = {
  getAll: async () => {
    const response = await apiClient.get('/discount-rule');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/discount-rule/${id}`);
    return response.data;
  },

  create: async (data: {
    discount_name: string;
    discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    start_date: string;
    end_date: string;
    applies_to: 'ENTIRE_TRANSACTION' | 'SPECIFIC_CATEGORY' | 'SPECIFIC_PRODUCT';
    target_id?: string;
    min_transaction?: number;
    max_discount?: number;
  }) => {
    const response = await apiClient.post('/discount-rule', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      discount_name?: string;
      discount_type?: 'PERCENTAGE' | 'FIXED_AMOUNT';
      value?: number;
      start_date?: string;
      end_date?: string;
      applies_to?: 'ENTIRE_TRANSACTION' | 'SPECIFIC_CATEGORY' | 'SPECIFIC_PRODUCT';
      target_id?: string;
      min_transaction?: number;
      max_discount?: number;
    }
  ) => {
    const response = await apiClient.put(`/discount-rule/${id}`, data);
    return response.data;
  },

  softDelete: async (id: string) => {
    const response = await apiClient.delete(`/discount-rule/${id}`);
    return response.data;
  },

  hardDelete: async (id: string) => {
    const response = await apiClient.delete(`/discount-rule/permanent/${id}`);
    return response.data;
  },
};

// ==================== LICENSE ====================
export const licenseAPI = {
  getAll: async () => {
    const response = await apiClient.get('/license');
    return response.data;
  },

  generate: async (quantity: number) => {
    const response = await apiClient.post('/license/generate', { quantity });
    return response.data;
  },

  delete: async (activationCode: string) => {
    const response = await apiClient.delete(`/license/${activationCode}`);
    return response.data;
  },

  assignBranch: async (activationCode: string, branchId: string) => {
    const response = await apiClient.put('/license/assign-branch', {
      activation_code: activationCode,
      branch_id: branchId,
    });
    return response.data;
  },

  resetDevice: async (activationCode: string) => {
    const response = await apiClient.put('/license/reset-device', {
      activation_code: activationCode,
    });
    return response.data;
  },
};

// ==================== SUBSCRIPTION ====================
export const subscriptionAPI = {
  // Get all subscription plans
  getPlans: async () => {
    const response = await apiClient.get('/partner-subscription/plans');
    return response.data;
  },

  // Create subscription order
  createOrder: async (planId: string) => {
    const response = await apiClient.post('/partner-subscription/order', { 
      plan_id: planId 
    });
    return response.data;
  },

  // Get user's orders (if exists)
  getOrders: async () => {
    const response = await apiClient.get('/partner-subscription/orders');
    return response.data;
  },

  // Upload payment proof (if exists)
  uploadPaymentProof: async (orderId: string, file: File) => {
    const formData = new FormData();
    formData.append('payment_proof', file);
    
    const response = await apiClient.post(`/partner-subscription/order/${orderId}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ==================== REPORT ====================
export const reportAPI = {
  getSales: async (params?: {
    branchId?: string;
    tanggalMulai?: string;
    tanggalSelesai?: string;
  }) => {
    const response = await apiClient.get('/report/sales', { params });
    return response.data;
  },

  getExpenses: async (params?: {
    branchId?: string;
    tanggalMulai?: string;
    tanggalSelesai?: string;
  }) => {
    const response = await apiClient.get('/report/expenses', { params });
    return response.data;
  },

  getItems: async (params?: {
    branchId?: string;
    tanggalMulai?: string;
    tanggalSelesai?: string;
  }) => {
    const response = await apiClient.get('/report/items', { params });
    return response.data;
  },
};

// ==================== HELPER ====================
export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numValue);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default apiClient;
