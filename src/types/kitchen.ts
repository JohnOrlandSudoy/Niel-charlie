// Kitchen-specific types and interfaces

export interface KitchenOrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations?: string;
  special_instructions?: string;
  created_at: string;
  menu_items: {
    id: string;
    name: string;
    price: number;
    calories: number;
    allergens: string[];
    prep_time: number;
    description: string;
    is_available: boolean;
    menu_item_ingredients: MenuItemIngredient[];
  };
}

export interface MenuItemIngredient {
  id: string;
  unit: string;
  quantity_required: number;
  is_optional: boolean;
  ingredients: {
    id: string;
    name: string;
    unit: string;
    category: string;
    supplier: string | null;
    is_active: boolean;
    description: string | null;
    expiry_date: string | null;
    cost_per_unit: number;
    current_stock: number;
    storage_location: string | null;
    max_stock_threshold: number;
    min_stock_threshold: number;
  };
}

export interface KitchenOrder {
  id: string;
  order_number: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  order_type: 'dine_in' | 'takeout';
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded' | 'pending';
  payment_method?: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  special_instructions?: string | null;
  table_number?: string | null;
  estimated_prep_time?: number | null;
  actual_prep_time?: number | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  order_items: KitchenOrderItem[];
  kitchen_metadata: KitchenMetadata;
}

export interface KitchenMetadata {
  total_items: number;
  estimated_total_prep_time: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  ingredients_needed: IngredientNeeded[];
  low_stock_ingredients: LowStockIngredient[];
  has_low_stock: boolean;
  has_out_of_stock: boolean;
  can_prepare: boolean;
}

export interface IngredientNeeded {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  required_quantity: number;
  current_stock: number;
  min_stock_threshold: number;
  max_stock_threshold: number;
  cost_per_unit: number;
  supplier: string | null;
  category: string;
  storage_location: string | null;
  expiry_date: string | null;
  is_optional: boolean;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

export interface LowStockIngredient {
  id: string;
  name: string;
  current_stock: number;
  min_stock_threshold: number;
  required_quantity: number;
  is_out_of_stock: boolean;
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
