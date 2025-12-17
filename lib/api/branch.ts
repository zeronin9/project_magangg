// lib/api/branch.ts

import { apiClient } from '../api';

// ==================== CASHIER LOGIN ACCOUNTS (L0 - Generic Login) ====================
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

// ==================== PRODUCTS ====================
export const branchProductAPI = {
  getAll: (type?: 'local') =>
    apiClient.get(`/product${type ? `?type=${type}` : ''}`),
  
  create: (formData: FormData) =>
    apiClient.post('/product', formData),
  
  update: (id: string, formData: FormData | any) =>
    apiClient.put(`/product/${id}`, formData),
  
  softDelete: (id: string) =>
    apiClient.delete(`/product/${id}`),
  
  hardDelete: (id: string) =>
    apiClient.delete(`/product/permanent/${id}`),
  
  // ✅ PERBAIKAN: Gunakan POST sesuai backend
  setOverride: (productId: string, formData: FormData) =>
    apiClient.post(`/branch-product-setting/${productId}`, formData),
};

// ==================== CATEGORIES ====================
export const branchCategoryAPI = {
  getAll: (type?: 'local' | 'general') =>
    apiClient.get(`/category${type ? `?type=${type}` : ''}`),
  
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
  getAll: () =>
    apiClient.get('/discount-rule'),
  
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
  
  setOverride: (discountRuleId: string, data: { is_active_at_branch: boolean; value?: number }) =>
    apiClient.post(`/branch-discount-setting/${discountRuleId}`, data),
};

// ==================== EXPENSES (KAS KELUAR) ====================
export const expenseAPI = {
  getAll: () =>
    apiClient.get('/expense'),
  
  create: (formData: FormData) =>
    apiClient.post('/expense', formData),
  
  delete: (id: string) =>
    apiClient.delete(`/expense/${id}`),
};

// ==================== VOID REQUESTS ====================
export const voidRequestAPI = {
  getAll: () =>
    apiClient.get('/transaction/void-requests'),
  
  review: (id: string, approve: boolean) =>
    apiClient.put(`/transaction/${id}/review-void`, { approve }),
};

// ==================== REPORTS ====================
export const branchReportAPI = {
  getSales: (tanggalMulai: string, tanggalSelesai: string) =>
    apiClient.get(`/report/sales?tanggalMulai=${tanggalMulai}&tanggalSelesai=${tanggalSelesai}`),
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
