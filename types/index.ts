// types/index.ts

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

// ✅ Update sesuai Doc 2.2
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
}

// ✅ Update sesuai Doc 3.2 (Tambah is_active)
export interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  price: number;
  branch_limit: number;
  device_limit: number;
  duration_months: number;
  description: string;
  is_active: boolean; // Menghilangkan error merah
}

// ✅ Baru: Interface untuk Pesanan (Doc 4.1)
export interface SubscriptionOrder {
  order_id: string;
  created_at: string;
  status: 'WAITING_TRANSFER' | 'PAID' | 'REJECTED' | 'APPROVED';
  partner_name: string;
  plan_name: string;
  amount: string | number;
}

// ✅ Update sesuai Doc 5.2
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

// ✅ Update sesuai Doc 6.1
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

// types/index.ts (Tambahkan di bagian bawah)

// ... (Existing types)

// --- BRANCH SPECIFIC TYPES ---

export interface CashierAccount {
  user_id: string;
  full_name: string;
  username: string;
  is_active: boolean;
}

export interface PinOperator {
  cashier_id: string;
  full_name: string;
  is_active: boolean;
}

export interface ShiftSchedule {
  shift_schedule_id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface Expense {
  expense_id: string;
  amount: number;
  description: string;
  expense_date: string;
}

export interface BranchProductSetting {
  setting_id?: string;
  product_id: string;
  sale_price?: number;
  is_available_at_branch?: boolean;
}

export interface VoidRequest {
  transaction_id: string;
  void_reason: string;
  requested_by: string;
  created_at: string;
}