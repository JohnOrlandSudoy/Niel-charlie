// Sample data for testing MenuItemSelector and order creation
import { MenuItem } from '../types/menu';

export const sampleMenuItems: MenuItem[] = [
  {
    id: "menu-item-1",
    name: "Chicken Adobo",
    description: "Traditional Filipino chicken adobo with soy sauce and vinegar",
    price: 120.00,
    prep_time: 25,
    calories: 350,
    is_available: true,
    is_featured: true,
    category_id: "category-1",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
    image_filename: "chicken-adobo.jpg",
    ingredients: [
      {
        id: "ingredient-1",
        menu_item_id: "menu-item-1",
        ingredient_id: "ingredient-chicken",
        quantity_required: 1,
        unit: "kg",
        ingredient: {
          id: "ingredient-chicken",
          name: "Chicken Breast",
          current_stock: 5.5,
          min_stock_level: 2.0,
          unit: "kg",
          is_available: true
        }
      },
      {
        id: "ingredient-2",
        menu_item_id: "menu-item-1",
        ingredient_id: "ingredient-soy-sauce",
        quantity_required: 0.1,
        unit: "L",
        ingredient: {
          id: "ingredient-soy-sauce",
          name: "Soy Sauce",
          current_stock: 2.0,
          min_stock_level: 0.5,
          unit: "L",
          is_available: true
        }
      }
    ]
  },
  {
    id: "menu-item-2",
    name: "Beef Sinigang",
    description: "Sour soup with beef and vegetables",
    price: 150.00,
    prep_time: 30,
    calories: 280,
    is_available: true,
    is_featured: false,
    category_id: "category-1",
    image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    image_filename: "beef-sinigang.jpg",
    ingredients: [
      {
        id: "ingredient-3",
        menu_item_id: "menu-item-2",
        ingredient_id: "ingredient-beef",
        quantity_required: 0.5,
        unit: "kg",
        ingredient: {
          id: "ingredient-beef",
          name: "Beef",
          current_stock: 3.0,
          min_stock_level: 1.0,
          unit: "kg",
          is_available: true
        }
      },
      {
        id: "ingredient-4",
        menu_item_id: "menu-item-2",
        ingredient_id: "ingredient-tamarind",
        quantity_required: 0.05,
        unit: "kg",
        ingredient: {
          id: "ingredient-tamarind",
          name: "Tamarind",
          current_stock: 1.5,
          min_stock_level: 0.5,
          unit: "kg",
          is_available: true
        }
      }
    ]
  },
  {
    id: "menu-item-3",
    name: "Pork Sisig",
    description: "Sizzling pork sisig with onions and chili",
    price: 180.00,
    prep_time: 20,
    calories: 420,
    is_available: true,
    is_featured: true,
    category_id: "category-1",
    image_url: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400",
    image_filename: "pork-sisig.jpg",
    ingredients: [
      {
        id: "ingredient-5",
        menu_item_id: "menu-item-3",
        ingredient_id: "ingredient-pork",
        quantity_required: 0.4,
        unit: "kg",
        ingredient: {
          id: "ingredient-pork",
          name: "Pork",
          current_stock: 2.5,
          min_stock_level: 1.0,
          unit: "kg",
          is_available: true
        }
      },
      {
        id: "ingredient-6",
        menu_item_id: "menu-item-3",
        ingredient_id: "ingredient-onion",
        quantity_required: 0.1,
        unit: "kg",
        ingredient: {
          id: "ingredient-onion",
          name: "Onion",
          current_stock: 0.8,
          min_stock_level: 0.5,
          unit: "kg",
          is_available: true
        }
      }
    ]
  },
  {
    id: "menu-item-4",
    name: "Fish Sinigang",
    description: "Sour soup with fish and vegetables",
    price: 130.00,
    prep_time: 25,
    calories: 200,
    is_available: false, // This item should be hidden due to missing ingredients
    is_featured: false,
    category_id: "category-1",
    image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    image_filename: "fish-sinigang.jpg",
    ingredients: [
      {
        id: "ingredient-7",
        menu_item_id: "menu-item-4",
        ingredient_id: "ingredient-fish",
        quantity_required: 0.3,
        unit: "kg",
        ingredient: {
          id: "ingredient-fish",
          name: "Fish",
          current_stock: 0.0, // Out of stock
          min_stock_level: 0.5,
          unit: "kg",
          is_available: false
        }
      }
    ]
  },
  {
    id: "menu-item-5",
    name: "Chicken Inasal",
    description: "Grilled chicken marinated in calamansi and annatto",
    price: 140.00,
    prep_time: 35,
    calories: 380,
    is_available: true,
    is_featured: false,
    category_id: "category-1",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
    image_filename: "chicken-inasal.jpg",
    ingredients: [
      {
        id: "ingredient-8",
        menu_item_id: "menu-item-5",
        ingredient_id: "ingredient-chicken-leg",
        quantity_required: 0.6,
        unit: "kg",
        ingredient: {
          id: "ingredient-chicken-leg",
          name: "Chicken Leg",
          current_stock: 1.2, // Low stock
          min_stock_level: 1.0,
          unit: "kg",
          is_available: true
        }
      },
      {
        id: "ingredient-9",
        menu_item_id: "menu-item-5",
        ingredient_id: "ingredient-calamansi",
        quantity_required: 0.05,
        unit: "kg",
        ingredient: {
          id: "ingredient-calamansi",
          name: "Calamansi",
          current_stock: 0.3,
          min_stock_level: 0.2,
          unit: "kg",
          is_available: true
        }
      }
    ]
  }
];

// Sample categories
export const sampleCategories = [
  {
    id: "category-1",
    name: "Main Dishes",
    description: "Traditional Filipino main dishes",
    is_active: true
  },
  {
    id: "category-2",
    name: "Appetizers",
    description: "Starters and appetizers",
    is_active: true
  },
  {
    id: "category-3",
    name: "Desserts",
    description: "Sweet treats and desserts",
    is_active: true
  }
];

// Sample order item data structure
export const sampleOrderItem = {
  id: "order-item-1",
  order_id: "order-123",
  menu_item_id: "menu-item-1",
  quantity: 2,
  unit_price: 120.00,
  total_price: 240.00,
  customizations: "Extra spicy",
  special_instructions: "No onions",
  created_at: "2025-01-16T10:30:00Z",
  updated_at: "2025-01-16T10:30:00Z",
  menu_items: {
    id: "menu-item-1",
    name: "Chicken Adobo",
    price: 120.00,
    description: "Traditional Filipino chicken adobo with soy sauce and vinegar",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400"
  }
};

// Sample order data structure
export const sampleOrder = {
  id: "order-123",
  order_number: "ORD-20250116-0001",
  customer_name: "John Doe",
  customer_phone: "09999999999",
  order_type: "dine_in",
  table_number: 1,
  status: "pending",
  payment_status: "unpaid",
  payment_method: null,
  subtotal: 240.00,
  tax_amount: 28.80,
  total_amount: 268.80,
  special_instructions: "Please make it spicy",
  estimated_prep_time: 25,
  created_at: "2025-01-16T10:30:00Z",
  updated_at: "2025-01-16T10:30:00Z",
  order_items: [sampleOrderItem]
};
