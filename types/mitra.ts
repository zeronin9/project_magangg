export interface Branch {
  branch_id: string;
  branch_name: string;
  address?: string;
  phone_number?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface BranchAdmin {
  user_id: string;
  full_name: string;
  username: string;
  branch_id: string;
  branch?: Branch;
  role: 'branch_admin';
  is_active: boolean;
  created_at?: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  branch_id: string | null;
  branch?: Branch | null;
  is_active: boolean;
  created_at?: string;
}

// ✅ PERBAIKAN: Ubah product_image_url ke image_url sesuai dokumentasi API
export interface Product {
  product_id: string;
  product_name: string;
  base_price: number;
  category_id: string;
  category?: Category;
  image_url?: string | null;  // ✅ UBAH dari product_image_url ke image_url
  branch_id: string | null;
  branch?: Branch | null;
  is_active: boolean;
  created_at?: string;
}

export interface DiscountRule {
  discount_rule_id: string;
  discount_name: string;
  discount_code?: string | null;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  start_date: string;
  end_date: string;
  applies_to: 'ENTIRE_TRANSACTION' | 'SPECIFIC_PRODUCTS' | 'SPECIFIC_CATEGORIES';  // ✅ UBAH: Plural
  
  // ✅ UBAH: Ganti target_id dengan arrays
  product_ids?: string[];
  category_ids?: string[];
  
  // Field Rules
  min_transaction_amount?: number;
  max_transaction_amount?: number;
  min_item_quantity?: number;
  max_item_quantity?: number;
  min_discount_amount?: number;
  max_discount_amount?: number;

  branch_id: string | null;
  branch?: Branch | null;
  is_active: boolean;
  created_at?: string;
}

export interface License {
  license_id: string;
  activation_code: string;
  license_status: 'Pending' | 'Assigned' | 'Active' | 'Inactive';
  branch_id: string | null;
  branch?: Branch | null;
  device_id?: string | null;
  device_name?: string | null;
  activated_at?: string | null;
  created_at: string;
}

export interface PartnerSubscriptionHistory {
  subscription_id: string;
  partner_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  payment_status: 'Paid' | 'Pending' | 'Expired' | 'Upgraded' | 'Failed';
  subscription_plan: {
    plan_name: string;
    price: string | number;
    duration_months: number;
    branch_limit: number;
    device_limit: number;
  };
}

export interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  price: string | number;
  description?: string;
  branch_limit: number;
  device_limit: number;
  duration_months?: number;
  features?: string[];
}

export interface SubscriptionOrderResponse {
  status: 'WAITING_TRANSFER' | 'CONFIRMED' | 'EXPIRED';
  total_amount: string | number;
  bank_info: {
    bank_name: string;
    account_number: string;
    account_name?: string;
  };
  order_id?: string;
  created_at?: string;
}

export interface Subscription {
  subscription_id: string;
  partner_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  payment_status: 'Paid' | 'Pending' | 'Expired' | 'Upgraded';
  subscription_plan: {
    plan_name: string;
    price: string;
    duration_months: number;
    branch_limit: number;
    device_limit: number;
  };
}

export interface SubscriptionOrder {
  order_id?: string;
  plan_id?: string;
  plan?: SubscriptionPlan;
  status: 'WAITING_TRANSFER' | 'CONFIRMED' | 'EXPIRED';
  total_amount: string | number;
  bank_info: {
    bank_name: string;
    account_number: string;
    account_name?: string;
  };
  payment_proof_url?: string;
  created_at?: string;
  expires_at?: string;
}

export interface SalesReport {
  summary: {
    total_sales: string;
    transaction_count: number;
    total_discount?: string;
    total_tax?: string;
  };
  data: Array<{
    transaction_id: string;
    branch_name?: string;
    final_total: string;
    discount_amount: string;
    tax_amount: string;
    created_at: string;
  }>;
}

export interface ItemsReport {
  product_id: string;
  product_name: string;
  category_name?: string;
  quantity_sold: number;
  total_revenue: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}
