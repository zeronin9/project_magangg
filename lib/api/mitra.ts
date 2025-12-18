import axios from 'axios';
// Pastikan Anda sudah mengupdate types/mitra.ts sesuai instruksi sebelumnya
// agar PaginatedResponse dan PaginationMeta tersedia.
import { 
  PaginatedResponse, 
  Product, 
  Category, 
  DiscountRule, 
  SubscriptionOrderResponse, 
  Subscription 
} from '@/types/mitra'; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.1.16:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== INTERCEPTORS ====================

// Add token to requests
apiClient.interceptors.request.use(
  (config: any) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // ✅ PERBAIKAN KRITIS: Hapus Content-Type jika data adalah FormData
    // Biarkan browser yang auto-set dengan boundary yang benar
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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
  getAll: async (showAll = false) => {
    const response = await apiClient.get(`/branch/admin${showAll ? '?show_all=true' : ''}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await apiClient.post('/branch/admin', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
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

// ==================== PRODUCT (UPDATED) ====================
export const productAPI = {
  // ✅ Updated: Menerima params untuk pagination & filter
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    type?: string; 
    category_id?: string 
  }) => {
    const response = await apiClient.get('/product', { params });
    // Mengembalikan PaginatedResponse<Product>
    return response.data as PaginatedResponse<Product>; 
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/product/${id}`);
    return response.data;
  },

  // ✅ Create produk dengan FormData (untuk upload gambar)
  create: async (data: FormData | any) => {
    const response = await apiClient.post('/product', data);
    return response.data;
  },

  // ✅ Update produk - bisa FormData (dengan gambar) atau JSON (tanpa gambar)
  update: async (id: string, data: FormData | any) => {
    const response = await apiClient.put(`/product/${id}`, data);
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

// ==================== CATEGORY (UPDATED) ====================
export const categoryAPI = {
  // ✅ Updated: Menerima params object, menggunakan apiClient agar token otomatis terlampir
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    type?: string 
  }) => {
    const response = await apiClient.get('/category', { params });
    // Mengembalikan PaginatedResponse<Category>
    return response.data as PaginatedResponse<Category>;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/category/${id}`);
    return response.data;
  },

  create: async (data: { category_name: string }) => {
    const response = await apiClient.post('/category', data);
    return response.data;
  },

  update: async (id: string, data: { category_name: string; is_active?: boolean }) => {
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

// ==================== DISCOUNT (UPDATED) ====================
export const discountAPI = {
  // ✅ Updated: Support pagination
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string 
  }) => {
    const response = await apiClient.get('/discount-rule', { params });
    // Mengembalikan PaginatedResponse<DiscountRule>
    return response.data as PaginatedResponse<DiscountRule>;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/discount-rule/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/discount-rule', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
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
  getPlans: async () => {
    const response = await apiClient.get('/partner-subscription/plans'); 
    return response.data; 
  },

  getHistory: async (partnerId: string) => {
    const response = await apiClient.get(`/partner-subscription/partner/${partnerId}`);
    return response.data;
  },

  createOrder: async (planId: string) => {
    const response = await apiClient.post('/partner-subscription/order', { 
      plan_id: planId 
    });
    return response.data;
  },

  uploadPaymentProof: async (orderId: string, file: File) => {
    const formData = new FormData();
    formData.append('payment_proof', file);
    
    const response = await apiClient.post(`/partner-subscription/order/${orderId}/proof`, formData);
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

// ==================== HELPERS ====================
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