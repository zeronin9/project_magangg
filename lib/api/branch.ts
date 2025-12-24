// lib/api/branch.ts

import { apiClient } from '../api';
import { fetchData } from '@/lib/services/fetchData';

// --- Definisi Tipe Data untuk Override Diskon (Sesuai Backend) ---
export interface DiscountOverridePayload {
  is_active_at_branch: boolean;
  value?: number | null;
  min_transaction_amount?: number | null;
  min_item_quantity?: number | null;
  max_transaction_amount?: number | null;
  max_item_quantity?: number | null;
  min_discount_amount?: number | null;
  max_discount_amount?: number | null;
}

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
  getAll: async (params: { page?: number; limit?: number; search?: string; category_id?: string; type?: string; status?: string } = {}) => {
    return fetchData('/product', params.page, params.limit, {
      search: params.search,
      category_id: params.category_id,
      type: params.type,
      status: params.status
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
  getAll: async (params: { page?: number; limit?: number; search?: string; type?: string; is_active?: string } = {}) => {
    return fetchData('/category', params.page, params.limit, {
      search: params.search,
      type: params.type,
      is_active: params.is_active
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
  // ✅ PERBAIKAN: Diskon lokal (yang dibuat di cabang) - kirim type=local
  getAll: async (params: { page?: number; limit?: number; search?: string; status?: string; type?: string } = {}) => {
    console.log('📞 [API] branchDiscountAPI.getAll called with params:', params);
    return fetchData('/discount-rule', params.page, params.limit, {
      search: params.search,
      status: params.status,
      type: params.type || 'local' // Default ke 'local' jika tidak ada type
    });
  },

  // Get single discount by ID
  getById: (id: string) => 
    apiClient.get(`/discount-rule/${id}`),

  // ✅ PERBAIKAN: Diskon general dari partner/pusat - gunakan /discount-rule?type=general&status=all
  getGeneral: async (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
    try {
      console.log('📞 [API] branchDiscountAPI.getGeneral called with params:', params);
      console.log('🔍 Fetching GENERAL discounts with type=general&status=all...');
      
      // ✅ PERBAIKAN: Tambahkan status='all' untuk ambil semua diskon (termasuk arsip)
      const response = await fetchData(
        '/discount-rule', 
        params.page || 1, 
        params.limit || 100, 
        {
          search: params.search,
          type: 'general',
          status: params.status || 'all' // ✅ DEFAULT ke 'all' untuk ambil semua data
        }
      );
      
      console.log('✅ [API] getGeneral response:', {
        total_items: response?.meta?.total_items || response?.items?.length || 0,
        items_count: response?.items?.length || 0,
        meta: response?.meta
      });
      
      return response;
    } catch (error) {
      console.error('❌ [API] getGeneral error:', error);
      throw error;
    }
  },

  // ✅ Get diskon general dengan info override dari branch-discount-setting
  getGeneralWithOverride: async () => {
    try {
      console.log('📞 [API] branchDiscountAPI.getGeneralWithOverride called');
      console.log('🔍 Fetching GENERAL discounts WITH OVERRIDE info...');
      const response = await apiClient.get('/branch-discount-setting');
      console.log('✅ [API] getGeneralWithOverride response:', {
        items_count: Array.isArray(response.data) ? response.data.length : 'not array',
        sample: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null
      });
      return response.data || response;
    } catch (error) {
      console.error('❌ [API] getGeneralWithOverride error:', error);
      throw error;
    }
  },

  // Get single discount override setting
  getOverrideSetting: (discountRuleId: string) =>
    apiClient.get(`/branch-discount-setting/${discountRuleId}`),
  
  // Create/update discount lokal
  create: (data: any) =>
    apiClient.post('/discount-rule', data),
  
  update: (id: string, data: any) =>
    apiClient.put(`/discount-rule/${id}`, data),
  
  softDelete: (id: string) =>
    apiClient.delete(`/discount-rule/${id}`),
  
  hardDelete: (id: string) =>
    apiClient.delete(`/discount-rule/permanent/${id}`),
  
  // Set/update override untuk diskon general
  setOverride: (discountRuleId: string, data: DiscountOverridePayload) =>
    apiClient.post(`/branch-discount-setting/${discountRuleId}`, data),
};

// ==================== EXPENSES ====================
export const expenseAPI = {
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
  getAll: () => apiClient.get('/transaction/void-requests'),

  review: (id: string, approve: boolean) =>
    apiClient.post(`/transaction/${id}/void-review`, { approve }),
};

// ==================== REPORTS ====================
export const branchReportAPI = {
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
  getReceipt: () => 
    apiClient.get('/branch/receipt'),

  updateReceipt: (data: { receipt_header?: string; receipt_footer?: string }) =>
    apiClient.put('/branch/receipt', data),

  getTax: () => 
    apiClient.get('/branch/tax'),

  updateTax: (data: { tax_name: string; tax_percentage: number }) =>
    apiClient.put('/branch/tax', data),

  deleteTax: () => 
    apiClient.delete('/branch/tax'), 
  
  getPaymentMethods: () =>
    apiClient.get('/payment'),

  updatePaymentMethod: (data: { payment_method_id: string; is_active: boolean }) =>
    apiClient.post('/payment/setting', data),
  
  getMe: () => 
    apiClient.get('/branch/me'),
};
