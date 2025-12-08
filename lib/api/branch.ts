import { apiClient } from './index'; // Ini akan mengambil dari lib/api/index.ts yang sudah kita perbaiki

export const branchPageAPI = {
  // --- 2. Akun Kasir (Login Tablet) ---
  getCashierAccounts: async (showAll = false) => {
    const response = await apiClient.get(`/cashier/login-account${showAll ? '?show_all=true' : ''}`);
    return response.data;
  },
  createCashierAccount: async (data: any) => {
    const response = await apiClient.post('/cashier/login-account', data);
    return response.data;
  },
  updateCashierAccount: async (id: string, data: any) => {
    const response = await apiClient.put(`/cashier/login-account/${id}`, data);
    return response.data;
  },
  deleteCashierAccount: async (id: string) => {
    const response = await apiClient.delete(`/cashier/login-account/${id}`);
    return response.data;
  },
  hardDeleteCashierAccount: async (id: string) => {
    const response = await apiClient.delete(`/cashier/login-account/permanent/${id}`);
    return response.data;
  },

  // --- 3. Operator PIN ---
  getPinOperators: async () => {
    const response = await apiClient.get('/cashier/pin-operator');
    return response.data;
  },
  createPinOperator: async (data: any) => {
    const response = await apiClient.post('/cashier/pin-operator', data);
    return response.data;
  },
  deletePinOperator: async (id: string) => {
    const response = await apiClient.delete(`/cashier/pin-operator/${id}`);
    return response.data;
  },

  // --- 4. Jadwal Shift ---
  getShifts: async () => {
    const response = await apiClient.get('/shift-schedule');
    return response.data;
  },
  createShift: async (data: any) => {
    const response = await apiClient.post('/shift-schedule', data);
    return response.data;
  },
  updateShift: async (id: string, data: any) => {
    const response = await apiClient.put(`/shift-schedule/${id}`, data);
    return response.data;
  },

  // --- 5. Produk (Lokal & General) ---
  getProducts: async (type?: 'local' | 'general') => {
    const query = type ? `?type=${type}` : '';
    const response = await apiClient.get(`/product${query}`);
    return response.data;
  },
  createLocalProduct: async (formData: FormData) => {
    const response = await apiClient.post('/product', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  updateLocalProduct: async (id: string, formData: FormData) => {
    const response = await apiClient.put(`/product/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteLocalProduct: async (id: string) => {
    const response = await apiClient.delete(`/product/${id}`);
    return response.data;
  },
  overrideProduct: async (productId: string, data: any) => {
    const response = await apiClient.post(`/branch-product-setting/${productId}`, data);
    return response.data;
  },

  // --- 6. Diskon (Lokal & General) ---
  getDiscounts: async () => {
    // Asumsi endpoint sama dengan mitra tapi difilter di backend
    const response = await apiClient.get('/discount-rule'); 
    return response.data;
  },
  createLocalDiscount: async (data: any) => {
    const response = await apiClient.post('/discount-rule', data);
    return response.data;
  },
  overrideDiscount: async (discountRuleId: string, data: any) => {
    const response = await apiClient.post(`/branch-discount-setting/${discountRuleId}`, data);
    return response.data;
  },
  deleteLocalDiscount: async (id: string) => {
    const response = await apiClient.delete(`/discount-rule/${id}`);
    return response.data;
  },

  // --- 7. Operasional & Keuangan ---
  getExpenses: async () => {
    const response = await apiClient.get('/expense');
    return response.data;
  },
  createExpense: async (data: any) => {
    const response = await apiClient.post('/expense', data);
    return response.data;
  },
  updateTaxSetting: async (data: any) => {
    const response = await apiClient.put('/branch/tax-setting', data);
    return response.data;
  },
  updatePaymentSetting: async (data: any) => {
    const response = await apiClient.post('/payment/setting', data);
    return response.data;
  },

  // --- 8. Void Requests ---
  getVoidRequests: async () => {
    const response = await apiClient.get('/transaction/void-requests');
    return response.data;
  },
  reviewVoid: async (transactionId: string, approve: boolean) => {
    const response = await apiClient.put(`/transaction/${transactionId}/review-void`, { approve });
    return response.data;
  },

  // --- 9. Lisensi Saya ---
  getMyLicenses: async () => {
    const response = await apiClient.get('/license/my-branch');
    return response.data;
  },
  resetLicense: async (activationCode: string) => {
    const response = await apiClient.put('/license/reset-device', { activation_code: activationCode });
    return response.data;
  }
};
