// Kitchen-specific types and interfaces

export interface KitchenOrderItem {
  id: string;
  menu_item_id: string;
  menu_item?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    prep_time?: number;
    image_filename?: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations?: string;
  special_instructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface KitchenOrder {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  order_type: 'dine_in' | 'takeout';
  table_number?: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  special_instructions?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  payment_method?: 'cash' | 'gcash' | 'card';
  items: KitchenOrderItem[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface OrderStatusUpdate {
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  notes?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  notes?: string;
  updated_by: string;
  updated_by_name?: string;
  created_at: string;
}

export interface KitchenStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedOrders: number;
  averagePrepTime: number;
  totalRevenue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedKitchenResponse {
  success: boolean;
  message: string;
  data: KitchenOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
