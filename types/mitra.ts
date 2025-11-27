// types/mitra.ts
export interface User {
  name: string;
  role: 'super_admin' | 'branch_admin';
  partnerId: string;
  branchId: string | null;
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

export interface BranchAdmin {
  user_id: string;
  full_name: string;
  username: string;
  branch_id: string;
  branch?: Branch;
}

export interface Category {
  category_id: string;
  partner_id: string;
  branch_id: string | null;
  category_name: string;
  branch?: Branch | null;
}

export interface Product {
  product_id: string;
  partner_id: string;
  branch_id: string | null;
  category_id: string;
  product_name: string;
  base_price: string;
  product_image: string | null;
  category?: Category;
  branch?: Branch | null;
}

export interface DiscountRule {
  discount_rule_id: string;
  partner_id: string;
  branch_id: string | null;
  discount_name: string;
  discount_code: string | null;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: string;
  applies_to: 'ENTIRE_TRANSACTION' | 'SPECIFIC_PRODUCTS' | 'SPECIFIC_CATEGORIES';
  min_transaction_amount: string | null;
  max_transaction_amount: string | null;
  min_item_quantity: number | null;
  max_item_quantity: number | null;
  max_discount_amount: string | null;
  start_date: string;
  end_date: string;
  product_ids: string[];
  category_ids: string[];
  products?: Product[];
  categories?: Category[];
}

export interface License {
  license_id: string;
  partner_id: string;
  branch_id: string | null;
  activation_code: string;
  license_status: 'Pending' | 'Assigned' | 'Active' | 'Inactive';
  device_id: string | null;
  device_name: string | null;
  activated_at: string | null;
  branch?: Branch | null;
}

export interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  price: string;
  branch_limit: number;
  device_limit: number;
  description: string | null;
}

export interface SalesReport {
  summary: {
    total_sales: string;
    transaction_count: number;
    total_subtotal: string;
    total_discount: string;
    total_tax: string;
  };
  data: any[];
}
