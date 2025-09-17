// Order-related TypeScript interfaces

export interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  order_type: 'dine_in' | 'takeout';
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  payment_method?: 'cash' | 'gcash' | 'card' | 'paymongo';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  table_number?: number;
  special_instructions?: string;
  estimated_prep_time?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  items?: OrderItem[];
  order_items?: OrderItem[]; // Alternative property name for compatibility
  discount_applied?: {
    id: string;
    code: string;
    name: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations?: string | {
    size?: string;
    toppings?: string[];
    spice_level?: string;
    notes?: string;
    [key: string]: any;
  };
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  menu_item?: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    prep_time: number;
    is_available: boolean;
    image_url?: string;
    ingredients?: Array<{
      id: string;
      name: string;
      quantity_required: number;
      unit: string;
      is_optional: boolean;
      current_stock: number;
      min_stock_threshold: number;
      stock_status: 'sufficient' | 'low_stock' | 'out_of_stock';
      total_required_for_order: number;
    }>;
  };
}

export interface CreateOrderRequest {
  order_type: 'dine_in' | 'takeout';
  customer_name?: string;
  customer_phone?: string;
  table_number?: number;
  special_instructions?: string;
  estimated_prep_time?: number;
}

export interface AddOrderItemRequest {
  menu_item_id: string;
  quantity: number;
  customizations?: {
    size?: string;
    toppings?: string[];
    spice_level?: string;
    notes?: string;
    [key: string]: any;
  };
  special_instructions?: string;
}

export interface UpdateOrderItemRequest {
  quantity?: number;
  customizations?: string | {
    size?: string;
    toppings?: string[];
    spice_level?: string;
    notes?: string;
    [key: string]: any;
  };
  special_instructions?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// New API Response Types
export interface MenuItemAvailabilityResponse {
  menu_item_id: string;
  menu_item_name: string;
  requested_quantity: number;
  is_available: boolean;
  unavailable_ingredients: Array<{
    stock_status: 'sufficient' | 'low_stock' | 'out_of_stock';
    ingredient_id: string;
    available_stock: number;
    ingredient_name: string;
    shortage_amount: number;
    required_quantity: number;
  }>;
  max_available_quantity: number;
  stock_summary: {
    low_stock_count: number;
    sufficient_count: number;
    total_ingredients: number;
    out_of_stock_count: number;
  };
}

export interface OrderIngredientValidationResponse {
  order_id: string;
  order_number: string;
  customer_name: string;
  order_status: string;
  overall_validation: {
    all_items_available: boolean;
    has_low_stock_items: boolean;
    total_items: number;
    available_items: number;
    unavailable_items: number;
  };
  ingredient_summary: {
    total_unavailable_ingredients: number;
    total_low_stock_ingredients: number;
    total_sufficient_ingredients: number;
    total_ingredients: number;
  };
  item_details: Array<{
    order_item_id: string;
    menu_item_id: string;
    menu_item_name: string;
    current_quantity: number;
    is_available: boolean;
    unavailable_ingredients: string[];
    max_available_quantity: number;
    stock_summary: {
      low_stock_count: number;
      sufficient_count: number;
      total_ingredients: number;
      out_of_stock_count: number;
    };
  }>;
}

export interface PaginatedOrderResponse {
  success: boolean;
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
