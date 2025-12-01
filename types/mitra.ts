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

export interface Product {
  product_id: string;
  product_name: string;
  base_price: number;
  category_id: string;
  category?: Category;
  product_image_url?: string;
  branch_id: string | null;
  branch?: Branch | null;
  is_active: boolean;
  created_at?: string;
}

export interface DiscountRule {
  discount_rule_id: string;
  discount_name: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  start_date: string;
  end_date: string;
  applies_to: 'ENTIRE_TRANSACTION' | 'SPECIFIC_CATEGORY' | 'SPECIFIC_PRODUCT';
  target_id?: string | null;
  min_transaction?: number;
  max_discount?: number;
  branch_id: string | null;
  branch?: Branch | null;
  is_active: boolean;
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

export interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  price: string;
  description?: string;
  branch_limit: number;
  device_limit: number;
  features?: string[];
}

export interface SubscriptionOrder {
  order_id: string;
  plan_id: string;
  plan?: SubscriptionPlan;
  status: 'WAITING_TRANSFER' | 'CONFIRMED' | 'EXPIRED';
  total_amount: string;
  bank_info?: {
    bank_name: string;
    account_number: string;
    account_name?: string;
  };
  payment_proof_url?: string;
  created_at: string;
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
