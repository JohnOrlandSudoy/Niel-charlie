// Debug utilities for order creation and testing
import { MenuItem } from '../types/menu';
import { OrderItem } from '../types/orders';

// Debug function to log order creation process
export const debugOrderCreation = (step: string, data: any) => {
  console.log(`🔍 [ORDER DEBUG] ${step}:`, data);
};

// Debug function to validate order items
export const validateOrderItems = (orderItems: OrderItem[]) => {
  console.log('🔍 [ORDER DEBUG] Validating order items:', orderItems);
  
  const validation = {
    hasItems: orderItems.length > 0,
    totalItems: orderItems.length,
    totalAmount: orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0),
    itemsWithPrices: orderItems.filter(item => item.total_price > 0).length,
    itemsWithoutPrices: orderItems.filter(item => !item.total_price || item.total_price === 0).length
  };
  
  console.log('🔍 [ORDER DEBUG] Validation result:', validation);
  
  if (validation.itemsWithoutPrices > 0) {
    console.warn('⚠️ [ORDER DEBUG] Found items without prices:', 
      orderItems.filter(item => !item.total_price || item.total_price === 0)
    );
  }
  
  return validation;
};

// Debug function to check menu item availability
export const debugMenuItemAvailability = (menuItem: MenuItem) => {
  console.log(`🔍 [ORDER DEBUG] Checking availability for: ${menuItem.name}`);
  
  const availability = {
    isAvailable: menuItem.is_available,
    hasIngredients: !!menuItem.ingredients && menuItem.ingredients.length > 0,
    ingredientsCount: menuItem.ingredients?.length || 0,
    outOfStockIngredients: menuItem.ingredients?.filter(ing => 
      !ing.ingredient?.is_available || (ing.ingredient?.current_stock || 0) <= 0
    ) || [],
    lowStockIngredients: menuItem.ingredients?.filter(ing => 
      ing.ingredient?.is_available && 
      (ing.ingredient?.current_stock || 0) <= (ing.ingredient?.min_stock_level || 0)
    ) || []
  };
  
  console.log('🔍 [ORDER DEBUG] Availability result:', availability);
  return availability;
};

// Debug function to simulate order creation
export const simulateOrderCreation = async (orderData: any, orderItems: any[]) => {
  console.log('🔍 [ORDER DEBUG] Simulating order creation...');
  
  // Step 1: Validate order data
  debugOrderCreation('Step 1: Order Data Validation', {
    hasOrderType: !!orderData.order_type,
    hasTableNumber: orderData.order_type === 'dine_in' ? !!orderData.table_number : true,
    orderData
  });
  
  // Step 2: Validate order items
  const itemValidation = validateOrderItems(orderItems);
  
  // Step 3: Check menu item availability
  const availabilityChecks = orderItems.map(item => ({
    menuItem: item.menuItem?.name || 'Unknown',
    availability: debugMenuItemAvailability(item.menuItem)
  }));
  
  // Step 4: Calculate totals
  const totals = {
    subtotal: orderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
    tax: orderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0) * 0.12,
    total: orderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0) * 1.12
  };
  
  debugOrderCreation('Step 4: Calculated Totals', totals);
  
  return {
    isValid: itemValidation.hasItems && itemValidation.itemsWithoutPrices === 0,
    validation: itemValidation,
    availability: availabilityChecks,
    totals
  };
};

// Debug function to check API responses
export const debugApiResponse = (endpoint: string, response: any) => {
  console.log(`🔍 [API DEBUG] ${endpoint}:`, {
    status: response.status,
    ok: response.ok,
    data: response.data,
    success: response.success,
    message: response.message,
    error: response.error
  });
  
  if (!response.success) {
    console.error(`❌ [API DEBUG] ${endpoint} failed:`, response.message || response.error);
  }
};

// Debug function to check order items after page reload
export const debugOrderItemsAfterReload = (orderId: string, orderItems: OrderItem[]) => {
  console.log(`🔍 [RELOAD DEBUG] Order ${orderId} items after reload:`, {
    orderId,
    itemsCount: orderItems.length,
    items: orderItems.map(item => ({
      id: item.id,
      menuItemName: item.menu_items?.name || 'Unknown',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price
    })),
    totalAmount: orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
  });
  
  if (orderItems.length === 0) {
    console.warn('⚠️ [RELOAD DEBUG] No items found after reload - this indicates a data persistence issue');
  }
  
  if (orderItems.some(item => !item.total_price || item.total_price === 0)) {
    console.warn('⚠️ [RELOAD DEBUG] Some items have zero prices after reload');
  }
};
