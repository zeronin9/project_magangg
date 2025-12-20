// lib/api/index.ts

// ✅ Export apiClient dari file api.ts
export { apiClient, fetchWithAuth } from '../api';

// Export modul API lainnya
export * from './mitra';
// export * from './branch'; 

export interface User {
  name: string;
  role: 'admin_platform' | 'super_admin' | 'branch_admin';
  partnerId: string | null;
  branchId: string | null;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface Partner {
  partner_id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  status: 'Active' | 'Suspended';
  joined_date: string;
}

export interface Branch {
  branch_id: string;
  partner_id: string;
  branch_name: string;
  address: string;
  phone_number: string;
  is_active: boolean;
  // ✅ UPDATE: Tambahkan field pengaturan sesuai Model Backend
  tax_name?: string | null;
  tax_percentage?: number | null;
  receipt_header?: string | null;
  receipt_footer?: string | null;
}

export interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  price: number;
  branch_limit: number;
  device_limit: number;
  duration_months: number;
  description: string;
  is_active: boolean;
}

export interface SubscriptionOrder {
  order_id: string;
  created_at: string;
  status: 'WAITING_TRANSFER' | 'PAID' | 'REJECTED' | 'APPROVED';
  partner_name: string;
  plan_name: string;
  amount: string | number;
}

export interface PartnerSubscription {
  subscription_id: string;
  partner_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  payment_status: 'Paid' | 'Pending' | 'Unpaid';
  status: string;
  partner?: Partner; 
  plan?: SubscriptionPlan; 
  plan_snapshot?: any;
}

export interface License {
  license_id: string;
  partner_id: string;
  branch_id: string | null;
  activation_code: string;
  device_id: string | null;
  device_name: string | null;
  license_status: 'Active' | 'Pending' | 'Assigned' | 'Revoked';
  branch?: {
    branch_name: string;
  };
  partner?: Partner;
}

export interface Category {
  category_id: string;
  category_name: string;
  branch_id: string | null;
}

export interface Product {
  product_id: string;
  product_name: string;
  base_price: number;
  image_url: string | null;
  branch_id: string | null;
  category?: Category;
  branch?: Branch;
  is_active?: boolean;
}

export interface DiscountRule {
  discount_rule_id: string;
  discount_name: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  branch_id: string | null;
  start_date: string;
  end_date: string;
  applies_to: string;
  min_transaction?: number;
  max_discount?: number;
  target_id?: string;
}