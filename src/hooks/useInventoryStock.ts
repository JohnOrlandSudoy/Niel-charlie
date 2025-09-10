import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../utils/api';
import { Ingredient, ApiResponse } from '../types/inventory';
import { MenuItem } from '../types/menu';

export interface StockStatus {
  isAvailable: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  missingIngredients: string[];
  lowStockIngredients: string[];
  stockMessage: string;
}

export const useInventoryStock = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all ingredients
  const fetchIngredients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.inventory.getAllIngredients();
      const result: ApiResponse<Ingredient[]> = await response.json();
      
      if (result.success && result.data) {
        setIngredients(result.data);
      } else {
        setError(result.message || 'Failed to fetch ingredients');
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to fetch ingredients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check stock status for a menu item
  const checkMenuItemStock = useCallback((menuItem: MenuItem, quantity: number = 1): StockStatus => {
    if (!menuItem.ingredients || menuItem.ingredients.length === 0) {
      return {
        isAvailable: true,
        isLowStock: false,
        isOutOfStock: false,
        missingIngredients: [],
        lowStockIngredients: [],
        stockMessage: 'No ingredient requirements'
      };
    }

    const missingIngredients: string[] = [];
    const lowStockIngredients: string[] = [];

    // Check each required ingredient
    for (const menuIngredient of menuItem.ingredients) {
      const inventoryIngredient = ingredients.find(ing => ing.id === menuIngredient.ingredient_id);
      
      if (!inventoryIngredient) {
        missingIngredients.push(menuIngredient.ingredient_name || 'Unknown ingredient');
        continue;
      }

      const requiredAmount = menuIngredient.quantity * quantity;
      const currentStock = inventoryIngredient.current_stock;
      const minThreshold = inventoryIngredient.min_stock_threshold || 0;

      // Check if out of stock
      if (currentStock < requiredAmount) {
        missingIngredients.push(menuIngredient.ingredient_name || inventoryIngredient.name);
      }
      // Check if low stock (after fulfilling this order)
      else if (currentStock - requiredAmount <= minThreshold) {
        lowStockIngredients.push(menuIngredient.ingredient_name || inventoryIngredient.name);
      }
    }

    const isOutOfStock = missingIngredients.length > 0;
    const isLowStock = lowStockIngredients.length > 0 && !isOutOfStock;
    const isAvailable = !isOutOfStock;

    // Generate stock message
    let stockMessage = '';
    if (isOutOfStock) {
      stockMessage = `Out of stock: ${missingIngredients.join(', ')}`;
    } else if (isLowStock) {
      stockMessage = `Low stock: ${lowStockIngredients.join(', ')}`;
    } else {
      stockMessage = 'In stock';
    }

    return {
      isAvailable,
      isLowStock,
      isOutOfStock,
      missingIngredients,
      lowStockIngredients,
      stockMessage
    };
  }, [ingredients]);

  // Check stock for multiple menu items (for order validation)
  const checkOrderStock = useCallback((orderItems: Array<{ menuItem: MenuItem; quantity: number }>): {
    isOrderAvailable: boolean;
    unavailableItems: Array<{ menuItem: MenuItem; quantity: number; stockStatus: StockStatus }>;
    lowStockItems: Array<{ menuItem: MenuItem; quantity: number; stockStatus: StockStatus }>;
    orderStockMessage: string;
  } => {
    const unavailableItems: Array<{ menuItem: MenuItem; quantity: number; stockStatus: StockStatus }> = [];
    const lowStockItems: Array<{ menuItem: MenuItem; quantity: number; stockStatus: StockStatus }> = [];

    for (const orderItem of orderItems) {
      const stockStatus = checkMenuItemStock(orderItem.menuItem, orderItem.quantity);
      
      if (stockStatus.isOutOfStock) {
        unavailableItems.push({
          menuItem: orderItem.menuItem,
          quantity: orderItem.quantity,
          stockStatus
        });
      } else if (stockStatus.isLowStock) {
        lowStockItems.push({
          menuItem: orderItem.menuItem,
          quantity: orderItem.quantity,
          stockStatus
        });
      }
    }

    const isOrderAvailable = unavailableItems.length === 0;
    
    let orderStockMessage = '';
    if (unavailableItems.length > 0) {
      orderStockMessage = `${unavailableItems.length} item(s) out of stock`;
    } else if (lowStockItems.length > 0) {
      orderStockMessage = `${lowStockItems.length} item(s) low on stock`;
    } else {
      orderStockMessage = 'All items in stock';
    }

    return {
      isOrderAvailable,
      unavailableItems,
      lowStockItems,
      orderStockMessage
    };
  }, [checkMenuItemStock]);

  // Get inventory statistics
  const inventoryStats = useMemo(() => {
    const totalItems = ingredients.length;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    let totalValue = 0;

    ingredients.forEach(ingredient => {
      if (ingredient.current_stock === 0) {
        outOfStockItems++;
      } else if (ingredient.min_stock_threshold && ingredient.current_stock <= ingredient.min_stock_threshold) {
        lowStockItems++;
      }
      
      if (ingredient.cost_per_unit) {
        totalValue += ingredient.current_stock * ingredient.cost_per_unit;
      }
    });

    const wellStockedItems = totalItems - lowStockItems - outOfStockItems;

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      wellStockedItems,
      totalValue
    };
  }, [ingredients]);

  // Load ingredients on mount
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  return {
    ingredients,
    isLoading,
    error,
    inventoryStats,
    checkMenuItemStock,
    checkOrderStock,
    fetchIngredients
  };
};
