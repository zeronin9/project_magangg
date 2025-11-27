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

export interface Partner {
  partner_id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  status: string;
  joined_date: string;
}

export interface Branch {
  branch_id: string;
  partner_id: string;
  branch_name: string;
  address: string;
  phone_number: string;
  tax_name: string | null;
  tax_percentage: number | null;
}

export interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  price: number;
   max_branches: number;        // ✅ Tambahkan ini
  max_devices: number; 
  branch_limit: number;
  device_limit: number;
  duration_months: number;
  description: string;
}

// types/index.ts
export interface PartnerSubscription {
  subscription_id: string;
  partner_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  payment_status: string;
  status: string;
  plan_snapshot?: {
    plan_name: string;
    price: number;
    branch_limit: number;
    device_limit: number;
    duration_months: number;
  };
}


export interface License {
  license_id: string;
  partner_id: string;
  branch_id: string | null;
  activation_code: string;
  device_id: string | null;
  device_name: string | null;
  license_status: string;
  branch?: {
    branch_name: string;
  };
}

export interface Category {
  category_id: string;
  partner_id: string;
  branch_id: string | null;
  category_name: string;
}

export interface Product {
  product_id: string;
  partner_id: string;
  branch_id: string | null;
  category_id: string;
  product_name: string;
  base_price: number;
  image_url: string | null;
}

export interface DiscountRule {
  discount_rule_id: string;
  partner_id: string;
  branch_id: string | null;
  discount_name: string;
  discount_code: string | null;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  applies_to: 'ENTIRE_TRANSACTION' | 'SPECIFIC_PRODUCTS' | 'SPECIFIC_CATEGORIES';
  min_transaction_amount: number | null;
  max_transaction_amount: number | null;
  min_item_quantity: number | null;
  max_item_quantity: number | null;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string;
  product_ids: string[];
  category_ids: string[];
}
