export interface Discount {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  usage_limit?: number | null;
  used_count: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDiscountRequest {
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  valid_until?: string;
}

export interface UpdateDiscountRequest {
  name?: string;
  description?: string;
  discount_type?: 'percentage' | 'fixed_amount';
  discount_value?: number;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  is_active?: boolean;
  valid_until?: string;
  usage_limit?: number;
}

export interface DiscountStats {
  total_discounts: number;
  active_discounts: number;
  expired_discounts: number;
  total_usage: number;
  total_savings: number;
}

export interface DiscountValidation {
  is_valid: boolean;
  discount_amount: number;
  message?: string;
}

export interface ApiDiscountResponse {
  success: boolean;
  data: Discount;
  message?: string;
}

export interface ApiDiscountsResponse {
  success: boolean;
  data: Discount[];
  message?: string;
}

export interface ApiDiscountStatsResponse {
  success: boolean;
  data: DiscountStats;
  message?: string;
}
