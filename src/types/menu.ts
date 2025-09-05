// Menu-related TypeScript interfaces

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  prep_time: number;
  is_available: boolean;
  is_featured: boolean;
  calories?: number;
  allergens: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  price: number;
  category_id: string;
  prep_time: number;
  is_available: boolean;
  is_featured: boolean;
  calories?: number;
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

export interface MenuStats {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  averagePrice: number;
}
