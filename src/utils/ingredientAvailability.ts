import { MenuItem } from '../types/menu';

export interface IngredientAvailability {
  isAvailable: boolean;
  missingCount: number;
  missingIngredients: Array<{
    id: string;
    ingredient_id: string;
    quantity_required: number;
    unit: string;
    is_optional: boolean;
    ingredient?: {
      id: string;
      name: string;
      current_stock: number;
    };
  }>;
  lowStockCount: number;
  lowStockIngredients: Array<{
    id: string;
    ingredient_id: string;
    quantity_required: number;
    unit: string;
    is_optional: boolean;
    ingredient?: {
      id: string;
      name: string;
      current_stock: number;
    };
  }>;
}

/**
 * Check ingredient availability for a menu item
 * This matches the logic used in MenuManagement.tsx
 */
export const checkIngredientAvailability = (menuItem: MenuItem): IngredientAvailability => {
  if (!menuItem.ingredients || menuItem.ingredients.length === 0) {
    return { 
      isAvailable: true, 
      missingCount: 0, 
      missingIngredients: [],
      lowStockCount: 0,
      lowStockIngredients: []
    };
  }
  
  // Filter out missing ingredients (current_stock < quantity_required)
  const missingIngredients = menuItem.ingredients.filter(ingredient => {
    if (ingredient.is_optional) return false; // Optional ingredients don't affect availability
    if (!ingredient.ingredient) return true; // Missing ingredient data
    return ingredient.ingredient.current_stock < ingredient.quantity_required;
  });
  
  // Filter out low stock ingredients (current_stock < quantity_required * 2)
  const lowStockIngredients = menuItem.ingredients.filter(ingredient => {
    if (ingredient.is_optional) return false; // Optional ingredients don't affect availability
    if (!ingredient.ingredient) return false; // Missing ingredient data
    if (ingredient.ingredient.current_stock < ingredient.quantity_required) return false; // Already missing
    return ingredient.ingredient.current_stock < (ingredient.quantity_required * 2);
  });
  
  return {
    isAvailable: missingIngredients.length === 0,
    missingCount: missingIngredients.length,
    missingIngredients: missingIngredients,
    lowStockCount: lowStockIngredients.length,
    lowStockIngredients: lowStockIngredients
  };
};

/**
 * Check if a menu item is available for ordering (no missing ingredients)
 */
export const isMenuItemAvailableForOrder = (menuItem: MenuItem): boolean => {
  const availability = checkIngredientAvailability(menuItem);
  return availability.isAvailable;
};

/**
 * Get availability message for a menu item
 */
export const getAvailabilityMessage = (menuItem: MenuItem): string => {
  const availability = checkIngredientAvailability(menuItem);
  
  if (!availability.isAvailable) {
    return `Unavailable due to missing ingredients (${availability.missingCount} missing)`;
  }
  
  if (availability.lowStockCount > 0) {
    return `Low stock on ${availability.lowStockCount} ingredient(s)`;
  }
  
  return 'Available';
};

/**
 * Get availability status for display
 */
export const getAvailabilityStatus = (menuItem: MenuItem): {
  status: 'available' | 'low_stock' | 'unavailable';
  message: string;
  color: string;
} => {
  const availability = checkIngredientAvailability(menuItem);
  
  if (!availability.isAvailable) {
    return {
      status: 'unavailable',
      message: `Unavailable due to missing ingredients (${availability.missingCount} missing)`,
      color: 'red'
    };
  }
  
  if (availability.lowStockCount > 0) {
    return {
      status: 'low_stock',
      message: `Low stock on ${availability.lowStockCount} ingredient(s)`,
      color: 'amber'
    };
  }
  
  return {
    status: 'available',
    message: 'Available',
    color: 'green'
  };
};
