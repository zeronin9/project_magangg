// lib/api/branch.ts

import { apiClient } from '../api';
import { fetchData } from '@/lib/services/fetchData';

// ==================== CASHIER LOGIN ACCOUNTS ====================
export const cashierAccountAPI = {
  getAll: (showAll = false) =>
    apiClient.get(`/cashier/login-account${showAll ? '?show_all=true' : ''}`),
  
  create: (data: { full_name: string; username: string; password: string }) =>
    apiClient.post('/cashier/login-account', data),
  
  update: (id: string, data: { full_name?: string; username?: string; password?: string }) =>
    apiClient.put(`/cashier/login-account/${id}`, data),
  
  softDelete: (id: string) =>
    apiClient.delete(`/cashier/login-account/${id}`),
  
  hardDelete: (id: string) =>
    apiClient.delete(`/cashier/login-account/permanent/${id}`),
  
  restore: (id: string, data: { full_name: string; username?: string }) =>
    apiClient.put(`/cashier/login-account/${id}`, data),
};

// ==================== PIN OPERATORS ====================
export const pinOperatorAPI = {
  getAll: (showAll = false) =>
    apiClient.get(`/cashier/pin-operator${showAll ? '?show_all=true' : ''}`),
  
  create: (data: { full_name: string; pin: string }) =>
    apiClient.post('/cashier/pin-operator', data),
  
  update: (id: string, data: { full_name?: string; pin?: string; is_active?: boolean }) =>
    apiClient.put(`/cashier/pin-operator/${id}`, data),
  
  softDelete: (id: string) =>
    apiClient.delete(`/cashier/pin-operator/${id}`),
  
  hardDelete: (id: string) =>
    apiClient.delete(`/cashier/pin-operator/permanent/${id}`),
};

// ==================== SHIFT SCHEDULES ====================
export const shiftScheduleAPI = {
  getAll: () =>
    apiClient.get('/shift-schedule'),
  
  create: (data: { shift_name: string; start_time: string; end_time: string }) =>
    apiClient.post('/shift-schedule', data),
  
  update: (id: string, data: { shift_name?: string; start_time?: string; end_time?: string; is_active?: boolean }) =>
    apiClient.put(`/shift-schedule/${id}`, data),

  softDelete: (id: string) =>
    apiClient.delete(`/shift-schedule/${id}`),

  hardDelete: (id: string) =>
    apiClient.delete(`/shift-schedule/permanent/${id}`),
};

// ==================== CASHIER MENU ====================
export const cashierMenuAPI = {
  getMenu: () =>
    apiClient.get('/cashier/menu'),
};

// ==================== PRODUCTS ====================
export const branchProductAPI = {
  // ✅ Update: Menggunakan fetchData untuk Pagination
  getAll: async (params: { page?: number; limit?: number; search?: string; category_id?: string; type?: string } = {}) => {
    return fetchData('/product', params.page, params.limit, {
      search: params.search,
      category_id: params.category_id,
      type: params.type
    });
  },
  
  create: (formData: FormData) =>
    apiClient.post('/product', formData),
  
  update: (id: string, formData: FormData | any) =>
    apiClient.put(`/product/${id}`, formData),
  
  softDelete: (id: string) =>
    apiClient.delete(`/product/${id}`),
  
  hardDelete: (id: string) =>
    apiClient.delete(`/product/permanent/${id}`),
  
  setOverride: (productId: string, formData: FormData) =>
    apiClient.post(`/branch-product-setting/${productId}`, formData),
  
  getOverride: (productId: string) =>
    apiClient.get(`/branch-product-setting/${productId}`),
};

// ==================== CATEGORIES ====================
export const branchCategoryAPI = {
  // ✅ Update: Menggunakan fetchData untuk Pagination
  getAll: async (params: { page?: number; limit?: number; search?: string; type?: string } = {}) => {
    return fetchData('/category', params.page, params.limit, {
      search: params.search,
      type: params.type
    });
  },
  
  create: (data: { category_name: string }) =>
    apiClient.post('/category', data),
  
  update: (id: string, data: { category_name?: string; is_active?: boolean }) =>
    apiClient.put(`/category/${id}`, data),
  
  softDelete: (id: string) =>
    apiClient.delete(`/category/${id}`),
  
  hardDelete: (id: string) =>
    apiClient.delete(`/category/permanent/${id}`),
};

// ==================== DISCOUNTS ====================
export const branchDiscountAPI = {
  // ✅ Update: Menggunakan fetchData untuk Pagination (Local & Search)
  getAll: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    return fetchData('/discount-rule', params.page, params.limit, {
      search: params.search
    });
  },

  // Get General Discounts (Diskon pusat) - Tetap axios biasa karena struktur beda/belum tentu paginated
  getGeneral: () =>
    apiClient.get('/branch-discount-setting'),
  
  create: (data: {
    discount_name: string;
    discount_type: 'PERCENTAGE' | 'NOMINAL';
    value: number;
    start_date: string;
    end_date: string;
  }) =>
    apiClient.post('/discount-rule', data),
  
  update: (id: string, data: any) =>
    apiClient.put(`/discount-rule/${id}`, data),
  
  softDelete: (id: string) =>
    apiClient.delete(`/discount-rule/${id}`),
  
  hardDelete: (id: string) =>
    apiClient.delete(`/discount-rule/permanent/${id}`),
  
  // Override General Discount
  setOverride: (discountRuleId: string, data: { is_active_at_branch: boolean; value?: number }) =>
    apiClient.post(`/branch-discount-setting/${discountRuleId}`, data),
};

// ==================== EXPENSES ====================
export const expenseAPI = {
  // ✅ Update: Menggunakan fetchData untuk Pagination
  getAll: async (params: { page?: number; limit?: number; search?: string; start_date?: string; end_date?: string } = {}) => {
    return fetchData('/expense', params.page, params.limit, {
      search: params.search,
      start_date: params.start_date,
      end_date: params.end_date
    });
  },
  
  create: (formData: FormData) =>
    apiClient.post('/expense', formData),
  
  delete: (id: string) =>
    apiClient.delete(`/expense/${id}`),
};

// ==================== VOID REQUESTS ====================
export const voidRequestAPI = {
  // ✅ Update: Menggunakan fetchData untuk Pagination
  getAll: async (params: { page?: number; limit?: number } = {}) => {
    return fetchData('/transaction/void-requests', params.page, params.limit);
  },

  // ✅ Update: Sesuai route backend (POST /transaction/:id/void-review)
  review: (id: string, approve: boolean) =>
    apiClient.post(`/transaction/${id}/void-review`, { approve }),
};

// ==================== REPORTS ====================
export const branchReportAPI = {
  // ✅ Update: Menggunakan fetchData untuk Pagination + Filter Tanggal
  getSales: async (tanggalMulai: string, tanggalSelesai: string, page = 1, limit = 10) => {
    return fetchData('/report/sales', page, limit, {
      tanggalMulai,
      tanggalSelesai
    });
  },
};

// ==================== LICENSES ====================
export const branchLicenseAPI = {
  getMyBranch: () =>
    apiClient.get('/license/my-branch'),
  
  resetDevice: (activationCode: string) =>
    apiClient.put('/license/reset-device', { activation_code: activationCode }),
};

// ==================== SETTINGS ====================
export const branchSettingsAPI = {
  updateTax: (data: { tax_name: string; tax_percentage: number }) =>
    apiClient.put('/branch/tax-setting', data),
  
  updatePaymentMethod: (data: { payment_method_id: string; is_active: boolean }) =>
    apiClient.post('/payment/setting', data),
};