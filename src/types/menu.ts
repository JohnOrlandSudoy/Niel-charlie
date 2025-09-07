// Menu-related TypeScript interfaces

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string | null;
  image_url: string | null;
  prep_time: number;
  is_available: boolean;
  is_featured: boolean;
  popularity: number;
  calories: number;
  allergens: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  image_file: any | null;
  image_filename: string | null;
  image_mime_type: string | null;
  image_size: number | null;
  image_alt_text: string | null;
  image_uploaded_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  // Ingredient requirements
  ingredients?: MenuItemIngredient[];
}

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  price: number;
  category_id?: string;
  prep_time: number;
  is_available: boolean;
  is_featured: boolean;
  calories?: number;
  allergens?: string[];
  image?: File;
}

export interface UpdateMenuItemRequest extends Partial<CreateMenuItemRequest> {}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  image_file?: any;
  image_filename?: string;
  image_mime_type?: string;
  image_size?: number;
  image_alt_text?: string;
  image_uploaded_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Paginated response for menu items
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
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

export interface MenuStats {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  averagePrice: number;
}

// Menu Item Ingredient Linking
export interface MenuItemIngredient {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity_required: number;
  unit: string;
  is_optional: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  ingredient?: {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    min_stock_threshold?: number;
  };
}

export interface CreateMenuItemIngredientRequest {
  ingredient_id: string;
  quantity_required: number;
  unit: string;
  is_optional?: boolean;
}

export interface UpdateMenuItemIngredientRequest {
  quantity_required?: number;
  unit?: string;
  is_optional?: boolean;
}
