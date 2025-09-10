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
  customizations?: string;
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
  customizations?: string;
  special_instructions?: string;
}

export interface UpdateOrderItemRequest {
  quantity?: number;
  customizations?: string;
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
