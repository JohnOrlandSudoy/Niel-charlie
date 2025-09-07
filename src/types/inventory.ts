// Inventory-related TypeScript interfaces

export interface Ingredient {
  id: string;
  name: string;
  description?: string;
  unit: string;
  current_stock: number;
  min_stock_threshold?: number;
  max_stock_threshold?: number;
  cost_per_unit?: number;
  supplier?: string;
  category?: string;
  storage_location?: string;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateIngredientRequest {
  name: string;
  unit: string;
  description?: string;
  current_stock?: number;
  min_stock_threshold?: number;
  max_stock_threshold?: number;
  cost_per_unit?: number;
  supplier?: string;
  category?: string;
  storage_location?: string;
  expiry_date?: string;
}

export interface UpdateIngredientRequest extends Partial<CreateIngredientRequest> {}

export interface StockMovement {
  id: string;
  ingredient_id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'spoilage';
  quantity: number;
  reason?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
  // Joined data
  ingredient?: Ingredient;
}

export interface CreateStockMovementRequest {
  ingredient_id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'spoilage';
  quantity: number;
  reason?: string;
  reference_number?: string;
  notes?: string;
}

export interface StockMovementsResponse {
  movements: StockMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  wellStockedItems: number;
  totalValue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
