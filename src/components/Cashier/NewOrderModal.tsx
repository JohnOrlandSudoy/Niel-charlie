import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Save, User, Phone, Clock, MessageSquare, AlertTriangle, XCircle, CreditCard, QrCode, DollarSign, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';
import { CreateOrderRequest, AddOrderItemRequest, Order, ApiResponse } from '../../types/orders';
import { MenuItem } from '../../types/menu';
import MenuItemSelector from './MenuItemSelector';
import PaymentModal from './PaymentModal';
import EnhancedPaymentModal from './EnhancedPaymentModal';
import { useInventoryStock } from '../../hooks/useInventoryStock';
import { checkIngredientAvailability, isMenuItemAvailableForOrder } from '../../utils/ingredientAvailability';
import { usePayMongoPayment } from '../../hooks/usePayMongoPayment';
import PayMongoPaymentModal from './PayMongoPaymentModal';
import PayMongoWebhookTest from './PayMongoWebhookTest';
import { debugOrderCreation, simulateOrderCreation, debugApiResponse } from '../../utils/orderDebug';
import { OrderIngredientValidationResponse } from '../../types/orders';

interface NewOrderModalProps {
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  customizations?: string;
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

interface PaymentMethod {
  method_key: string;
  method_name: string;
  method_description: string;
  is_online: boolean;
  display_order: number;
  icon_name: string;
  color_code: string;
}

const NewOrderModal: React.FC<NewOrderModalProps> = React.memo(({ onClose, onOrderCreated }) => {
  const [orderData, setOrderData] = useState<CreateOrderRequest>({
    order_type: 'dine_in',
    customer_name: '',
    customer_phone: '',
    table_number: undefined,
    special_instructions: '',
    estimated_prep_time: undefined
  });
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showMenuItemSelector, setShowMenuItemSelector] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEnhancedPaymentModal, setShowEnhancedPaymentModal] = useState(false);
  const [showPaymentMethodSelection, setShowPaymentMethodSelection] = useState(false);
  const [showWebhookTest, setShowWebhookTest] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_status: 'unpaid' as 'unpaid' | 'paid' | 'refunded',
    payment_method: 'cash' as 'cash' | 'paymongo'
  });
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  
  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  // Use inventory stock checking
  const { checkOrderStock } = useInventoryStock();

  // Use PayMongo payment hook
  const {
    paymentIntent,
    isCheckingStatus,
    isCancelling,
    error: payMongoError,
    showPayMongoModal,
    createPaymentIntent,
    cancelPayment,
    closePayMongoModal
  } = usePayMongoPayment();

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoadingPaymentMethods(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No authentication token found for fetching payment methods');
        return;
      }
      
      const response = await fetch('https://server-resturant-3.onrender.com/api/payments/methods/available', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Filter to only show Cash and PayMongo methods
          const filteredMethods = result.data.filter((method: any) => 
            method.method_key === 'cash' || method.method_key === 'paymongo'
          );
          setPaymentMethods(filteredMethods);
          console.log('Available payment methods loaded:', filteredMethods);
        }
      } else {
        console.error('Failed to fetch payment methods:', response.status);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  }, []);

  // Fetch payment methods on component mount
  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // Calculate totals with memoization
  const { subtotal, tax, total } = useMemo(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.12; // 12% VAT
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [orderItems]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: name === 'table_number' || name === 'estimated_prep_time' 
        ? (value ? parseInt(value) : undefined)
        : value
    }));
  }, []);

  const handleAddMenuItem = useCallback((menuItem: MenuItem, quantity: number, customizations?: string, specialInstructions?: string) => {
    const unitPrice = menuItem.price;
    const totalPrice = unitPrice * quantity;
    
    const newItem: OrderItem = {
      menuItem,
      quantity,
      customizations,
      specialInstructions,
      unitPrice,
      totalPrice
    };
    
    setOrderItems(prev => [...prev, newItem]);
    setShowMenuItemSelector(false);
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Validate order ingredients using new API endpoint
  const validateOrderIngredients = useCallback(async (orderId: string): Promise<OrderIngredientValidationResponse | null> => {
    try {
      const response = await api.orders.getOrderIngredientValidation(orderId);
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Failed to validate order ingredients:', result.message);
        return null;
      }
    } catch (error) {
      console.error('Error validating order ingredients:', error);
      return null;
    }
  }, []);

  const handleCreateOrder = async () => {
    // Debug: Start order creation process
    debugOrderCreation('Starting order creation', { orderData, orderItems });
    
    if (orderItems.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    if (orderData.order_type === 'dine_in' && !orderData.table_number) {
      setError('Table number is required for dine-in orders');
      return;
    }

    // Debug: Simulate order creation to validate data (for logging only)
    await simulateOrderCreation(orderData, orderItems);
    // Note: We don't block order creation based on simulation validation

    // Check ingredient availability for all items
    const ingredientCheck = orderItems.every(item => {
      return isMenuItemAvailableForOrder(item.menuItem);
    });

    if (!ingredientCheck) {
      const unavailableItems = orderItems
        .filter(item => !isMenuItemAvailableForOrder(item.menuItem))
        .map(item => {
          const availability = checkIngredientAvailability(item.menuItem);
          return `${item.menuItem.name} (${availability.missingCount} missing ingredients)`;
        })
        .join(', ');
      setError(`Cannot create order: ${unavailableItems}`);
      return;
    }

    // Check stock availability for all items
    const stockCheck = checkOrderStock(orderItems.map(item => ({
      menuItem: item.menuItem,
      quantity: item.quantity
    })));

    if (!stockCheck.isOrderAvailable) {
      const unavailableItems = stockCheck.unavailableItems.map(item => 
        `${item.menuItem.name} (${item.stockStatus.stockMessage})`
      ).join(', ');
      setError(`Cannot create order: ${unavailableItems}`);
      return;
    }

    // Show warning for low stock items
    if (stockCheck.lowStockItems.length > 0) {
      const lowStockItems = stockCheck.lowStockItems.map(item => 
        `${item.menuItem.name} (${item.stockStatus.stockMessage})`
      ).join(', ');
      const proceed = window.confirm(
        `Warning: Some items are low on stock: ${lowStockItems}\n\nDo you want to proceed with the order?`
      );
      if (!proceed) {
        return;
      }
    }

    setIsCreating(true);
    setError(null);

    try {
      // Check authentication
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Step 1: Create the order
      // Clean up the order data before sending
      const cleanedOrderData = {
        ...orderData,
        customer_name: orderData.customer_name?.trim() || undefined,
        customer_phone: orderData.customer_phone?.trim() || undefined,
        special_instructions: orderData.special_instructions?.trim() || undefined,
        table_number: orderData.table_number || undefined,
        estimated_prep_time: orderData.estimated_prep_time || undefined
      };
      
      // Validate required fields
      if (!cleanedOrderData.order_type) {
        throw new Error('Order type is required');
      }
      
      if (cleanedOrderData.order_type === 'dine_in' && !cleanedOrderData.table_number) {
        throw new Error('Table number is required for dine-in orders');
      }
      
      debugOrderCreation('Creating order with cleaned data', cleanedOrderData);
      debugOrderCreation('Auth token present', !!token);
      
      const orderResponse = await api.orders.create(cleanedOrderData);
      debugOrderCreation('Order response status', orderResponse.status);
      
      // Check if the response is ok
      if (!orderResponse.ok) {
        console.error('Order creation HTTP error:', {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          url: orderResponse.url
        });
        throw new Error(`HTTP ${orderResponse.status}: ${orderResponse.statusText}`);
      }
      
      const orderResult: ApiResponse<Order> = await orderResponse.json();
      debugApiResponse('Order Creation', orderResult);

      if (!orderResult.success || !orderResult.data) {
        console.error('Order creation failed:', {
          success: orderResult.success,
          message: orderResult.message,
          data: orderResult.data
        });
        throw new Error(orderResult.message || 'Failed to create order');
      }

      const createdOrder = orderResult.data;
      setCurrentOrder(createdOrder);
      console.log('Order created:', createdOrder);

      // Step 2: Add items to the order
      let itemsAddedSuccessfully = 0;
      const addedOrderItems: any[] = [];
      
      for (const item of orderItems) {
        // Parse customizations string into object format as expected by API
        let customizationsObj = undefined;
        if (item.customizations && item.customizations.trim()) {
          try {
            // Try to parse as JSON if it's already an object string
            customizationsObj = JSON.parse(item.customizations);
          } catch {
            // If not JSON, create a structured object from the string
            customizationsObj = {
              notes: item.customizations.trim()
            };
          }
        }

        const itemData: AddOrderItemRequest = {
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          customizations: customizationsObj,
          special_instructions: item.specialInstructions || undefined
        };

        debugOrderCreation('Adding item to order', itemData);
        const itemResponse = await api.orders.addItem(createdOrder.id, itemData);
        const itemResult: ApiResponse<any> = await itemResponse.json();
        debugApiResponse('Add Order Item', itemResult);

        if (itemResult.success && itemResult.data) {
          itemsAddedSuccessfully++;
          addedOrderItems.push(itemResult.data);
          debugOrderCreation('Item added successfully', itemResult.data);
          
          // Log ingredient information if available
          if (itemResult.data.menu_item?.ingredients) {
            console.log(`Ingredient details for ${itemResult.data.menu_item.name}:`, {
              itemName: itemResult.data.menu_item.name,
              quantity: itemResult.data.quantity,
              ingredients: itemResult.data.menu_item.ingredients.map((ing: any) => ({
                name: ing.name,
                required: ing.quantity_required,
                unit: ing.unit,
                currentStock: ing.current_stock,
                stockStatus: ing.stock_status,
                totalRequired: ing.total_required_for_order,
                isOptional: ing.is_optional
              }))
            });
          }
        } else {
          console.error('Failed to add item:', itemResult.message);
          // Continue with other items even if one fails
        }
      }

      console.log(`Successfully added ${itemsAddedSuccessfully} out of ${orderItems.length} items`);

      // Step 3: Validate order ingredients using new API endpoint
      console.log('Validating order ingredients...');
      const ingredientValidation = await validateOrderIngredients(createdOrder.id);
      
      if (ingredientValidation) {
        console.log('Ingredient validation result:', ingredientValidation);
        
        // Show warning if there are ingredient issues
        if (!ingredientValidation.overall_validation.all_items_available) {
          const unavailableCount = ingredientValidation.overall_validation.unavailable_items;
          const lowStockCount = ingredientValidation.ingredient_summary.total_low_stock_ingredients;
          
          let warningMessage = `Order created but with ingredient issues:\n`;
          if (unavailableCount > 0) {
            warningMessage += `- ${unavailableCount} item(s) are unavailable due to missing ingredients\n`;
          }
          if (lowStockCount > 0) {
            warningMessage += `- ${lowStockCount} ingredient(s) are running low on stock\n`;
          }
          warningMessage += `\nPlease check the order details for more information.`;
          
          alert(warningMessage);
        } else if (ingredientValidation.overall_validation.has_low_stock_items) {
          const lowStockCount = ingredientValidation.ingredient_summary.total_low_stock_ingredients;
          alert(`Order created successfully, but ${lowStockCount} ingredient(s) are running low on stock.`);
        }
      }

      // Step 4: Create updated order with correct totals and actual order items from database
      const updatedOrder: Order = {
        ...createdOrder,
        subtotal: subtotal,
        tax_amount: tax,
        total_amount: total,
        order_items: addedOrderItems // Use actual order items from database
      };

      console.log('Updated order with totals:', updatedOrder);
      
      // Step 5: Show payment method selection first
      console.log('Setting currentOrder for payment method selection:', updatedOrder);
      setCurrentOrder(updatedOrder);
      setShowPaymentMethodSelection(true);
      
      // Show warning if some items failed to add
      if (itemsAddedSuccessfully < orderItems.length) {
        console.warn(`Warning: Only ${itemsAddedSuccessfully} out of ${orderItems.length} items were added to the order. Please check the order details.`);
      }

    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Payment handling functions (matching PaymentModal approach)
  const handleUpdatePayment = useCallback(async (orderId: string, paymentData: any) => {
    setIsUpdatingPayment(true);
    try {
      const response = await api.orders.updatePayment(orderId, paymentData);
      const result = await response.json();
      
      if (result.success) {
        console.log('Payment updated successfully:', result);
        // Update the current order with new payment status
        if (currentOrder) {
          setCurrentOrder(prev => prev ? { ...prev, ...paymentData } : null);
        }
        // Close payment modal after successful update
        setShowPaymentModal(false);
      } else {
        throw new Error(result.message || 'Failed to update payment');
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to update payment');
    } finally {
      setIsUpdatingPayment(false);
    }
  }, [currentOrder]);

  const handleApplyDiscount = useCallback(async (orderId: string, discountCode: string) => {
    try {
      const response = await api.orders.applyDiscount(orderId, { discount_code: discountCode });
      const result = await response.json();
      
      if (result.success) {
        console.log('Discount applied successfully:', result);
        
        // Update the current order with the new discounted totals from the API response
        if (currentOrder && result.data) {
          const updatedOrder = {
            ...currentOrder,
            ...result.data, // This includes the updated totals with discount applied
            discount_applied: result.data.discount_applied,
            discount_amount: result.data.discount_amount,
            subtotal: result.data.subtotal,
            tax_amount: result.data.tax_amount,
            total_amount: result.data.total_amount
          };
          
          console.log('🔍 DISCOUNT APPLICATION DEBUG:');
          console.log('- Original order:', currentOrder);
          console.log('- API response data:', result.data);
          console.log('- Updated order with discount:', updatedOrder);
          console.log('- Discount fields in updated order:', {
            discount_applied: updatedOrder.discount_applied,
            discount_amount: updatedOrder.discount_amount
          });
          
          setCurrentOrder(updatedOrder);
        }
        
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to apply discount');
      }
    } catch (err) {
      console.error('Error applying discount:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply discount');
      return null;
    }
  }, [currentOrder]);

  const handlePayMongoPayment = useCallback(async (order: Order) => {
    try {
      console.log('Creating PayMongo payment for order:', order);
      const paymentIntent = await createPaymentIntent(order);
      
      if (paymentIntent) {
        console.log('PayMongo payment intent created successfully:', paymentIntent);
        // PayMongo modal will be shown automatically by the hook
      } else {
        setError('Failed to create PayMongo payment intent');
      }
    } catch (err) {
      console.error('Error creating PayMongo payment:', err);
      setError('Failed to create PayMongo payment. Please try again.');
    }
  }, [createPaymentIntent]);

  // Get available payment methods (API already returns only available methods)
  const availablePaymentMethods = useMemo(() => {
    return paymentMethods; // API already filters to available methods
  }, [paymentMethods]);

  // Handle payment method selection
  const handlePaymentMethodSelect = useCallback(async (methodKey: string) => {
    setPaymentForm(prev => ({ ...prev, payment_method: methodKey as 'cash' | 'paymongo' }));
    setShowPaymentMethodSelection(false);
    
    // Show appropriate payment modal based on selected method
    if (methodKey === 'paymongo') {
      // Create PayMongo payment intent and show PayMongoPaymentModal
      if (currentOrder) {
        await handlePayMongoPayment(currentOrder);
      }
    } else if (methodKey === 'cash') {
      // For cash payments, directly show EnhancedPaymentModal with cash-only options
      setShowEnhancedPaymentModal(true);
    }
  }, [currentOrder, handlePayMongoPayment]);

  // Payment modal handlers
  const handlePaymentComplete = (order: Order) => {
    console.log('Payment completed for order:', order);
    setCurrentOrder(null);
    setShowPaymentModal(false);
    setShowEnhancedPaymentModal(false);
    // Reset form
    setOrderData({
      order_type: 'dine_in',
      customer_name: '',
      customer_phone: '',
      table_number: undefined,
      special_instructions: '',
      estimated_prep_time: undefined
    });
    setOrderItems([]);
    onOrderCreated(order);
    onClose();
  };

  const handleReceiptGenerated = (receiptData: any) => {
    console.log('Receipt generated:', receiptData);
    // You can add additional receipt handling logic here
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-order-title"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 id="new-order-title" className="text-lg sm:text-xl font-semibold text-gray-900">Create New Order</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close new order modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <X className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Order Details */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Order Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Type *
                    </label>
                    <select
                      name="order_type"
                      value={orderData.order_type}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm sm:text-base h-12 sm:h-14 touch-manipulation"
                      aria-label="Order type"
                    >
                      <option value="dine_in">Dine In</option>
                      <option value="takeout">Takeout</option>
                    </select>
                  </div>

                  {orderData.order_type === 'dine_in' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Table Number *
                      </label>
                      <input
                        type="number"
                        name="table_number"
                        value={orderData.table_number || ''}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm sm:text-base h-12 sm:h-14 touch-manipulation"
                        placeholder="Enter table number"
                        aria-label="Table number"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="customer_name"
                        value={orderData.customer_name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm sm:text-base h-12 sm:h-14 touch-manipulation"
                        placeholder="Customer name (optional)"
                        aria-label="Customer name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        name="customer_phone"
                        value={orderData.customer_phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm sm:text-base h-12 sm:h-14 touch-manipulation"
                        placeholder="Phone number (optional)"
                        aria-label="Customer phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Prep Time (minutes)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        name="estimated_prep_time"
                        value={orderData.estimated_prep_time || ''}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        placeholder="Estimated prep time"
                        aria-label="Estimated preparation time in minutes"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <textarea
                        name="special_instructions"
                        value={orderData.special_instructions}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm sm:text-base touch-manipulation resize-none"
                        placeholder="Any special instructions for this order..."
                        aria-label="Special instructions for the order"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Order Items</h3>
                <button
                  onClick={() => setShowMenuItemSelector(true)}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 flex items-center space-x-1 sm:space-x-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px]"
                  aria-label="Add menu item to order"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  <span className="text-sm sm:text-base font-medium">Add Item</span>
                </button>
              </div>

              {orderItems.length > 0 ? (
                <div className="space-y-3">
                  {orderItems.map((item, index) => {
                    const stockCheck = checkOrderStock([{ menuItem: item.menuItem, quantity: item.quantity }]);
                    const hasStockIssue = stockCheck.unavailableItems.length > 0 || stockCheck.lowStockItems.length > 0;
                    
                    return (
                      <div key={index} className={`rounded-lg p-3 sm:p-4 ${
                        hasStockIssue ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                      } touch-manipulation`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
                              <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.menuItem.name}</h4>
                              {stockCheck.unavailableItems.length > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Out of Stock
                                </span>
                              )}
                              {stockCheck.lowStockItems.length > 0 && stockCheck.unavailableItems.length === 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Low Stock
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            {item.customizations && (
                              <p className="text-sm text-gray-600">Customizations: {item.customizations}</p>
                            )}
                            {item.specialInstructions && (
                              <p className="text-sm text-gray-600">Instructions: {item.specialInstructions}</p>
                            )}
                            {hasStockIssue && (
                              <p className="text-sm text-red-600 mt-1">
                                {stockCheck.unavailableItems.length > 0 
                                  ? stockCheck.unavailableItems[0].stockStatus.stockMessage
                                  : stockCheck.lowStockItems[0].stockStatus.stockMessage
                                }
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">₱{item.totalPrice.toFixed(2)}</p>
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-2 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                              aria-label={`Remove ${item.menuItem.name} from order`}
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No items added yet</p>
                  <p className="text-gray-400 text-sm mt-1">Click "Add Item" to start building the order</p>
                </div>
              )}

              {/* Stock Status Summary */}
              {orderItems.length > 0 && (() => {
                const stockCheck = checkOrderStock(orderItems.map(item => ({
                  menuItem: item.menuItem,
                  quantity: item.quantity
                })));
                
                if (stockCheck.unavailableItems.length > 0 || stockCheck.lowStockItems.length > 0) {
                  return (
                    <div className={`rounded-lg p-4 ${
                      stockCheck.unavailableItems.length > 0 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-amber-50 border border-amber-200'
                    }`}>
                      <h4 className={`font-medium mb-3 ${
                        stockCheck.unavailableItems.length > 0 ? 'text-red-900' : 'text-amber-900'
                      }`}>
                        Stock Status
                      </h4>
                      <div className="space-y-2 text-sm">
                        {stockCheck.unavailableItems.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-red-800">
                              {stockCheck.unavailableItems.length} item(s) out of stock
                            </span>
                          </div>
                        )}
                        {stockCheck.lowStockItems.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span className="text-amber-800">
                              {stockCheck.lowStockItems.length} item(s) low on stock
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Order Summary */}
              {orderItems.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₱{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (12%):</span>
                      <span>₱{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isCreating}
              className="w-full sm:w-auto px-4 py-2 sm:py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 touch-manipulation min-h-[44px] text-sm sm:text-base"
              aria-label="Cancel order creation"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrder}
              disabled={isCreating || orderItems.length === 0 || (() => {
                // Check ingredient availability
                const ingredientCheck = orderItems.every(item => {
                  return isMenuItemAvailableForOrder(item.menuItem);
                });
                
                if (!ingredientCheck) return true;
                
                // Check stock availability
                const stockCheck = checkOrderStock(orderItems.map(item => ({
                  menuItem: item.menuItem,
                  quantity: item.quantity
                })));
                return stockCheck.unavailableItems.length > 0;
              })()}
              className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px] text-sm sm:text-base"
              aria-label="Create new order"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                  <span>Creating Order...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>Create Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Item Selector Modal */}
      {showMenuItemSelector && (
        <MenuItemSelector
          onAddToOrder={handleAddMenuItem}
          onClose={() => setShowMenuItemSelector(false)}
        />
      )}

      {/* Payment Modal - For PayMongo Online Payments */}
      {showPaymentModal && currentOrder && (
        <PaymentModal
          order={currentOrder}
          paymentForm={paymentForm}
          isUpdatingPayment={isUpdatingPayment}
          onClose={() => setShowPaymentModal(false)}
          onUpdatePayment={handleUpdatePayment}
        />
      )}

      {/* Enhanced Payment Modal - For Cash Payments */}
      {showEnhancedPaymentModal && currentOrder && (
        <>
          {console.log('🔍 PASSING ORDER TO ENHANCED PAYMENT MODAL:', {
            order: currentOrder,
            discount_applied: (currentOrder as any).discount_applied,
            discount_amount: (currentOrder as any).discount_amount,
            orderKeys: Object.keys(currentOrder)
          })}
          <EnhancedPaymentModal
            order={currentOrder}
            isOpen={showEnhancedPaymentModal}
            onClose={() => setShowEnhancedPaymentModal(false)}
            onPaymentComplete={handlePaymentComplete}
            onReceiptGenerated={handleReceiptGenerated}
            onApplyDiscount={handleApplyDiscount}
            cashOnly={paymentForm.payment_method === 'cash'}
          />
        </>
      )}

      {/* Payment Method Selection Modal */}
      {showPaymentMethodSelection && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Select Payment Method</h2>
              <button
                onClick={() => setShowPaymentMethodSelection(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-6">Choose how the customer will pay for this order:</p>
              
              {loadingPaymentMethods ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading payment methods...</span>
                </div>
              ) : availablePaymentMethods.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No Payment Methods Available</p>
                  <p className="text-sm mt-1">Please enable payment methods in Settings to process payments.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availablePaymentMethods
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((method) => {
                      const getIcon = () => {
                        switch (method.method_key) {
                          case 'cash':
                            return <DollarSign className="h-6 w-6 text-green-600" />;
                          case 'paymongo':
                            return <QrCode className="h-6 w-6 text-blue-600" />;
                          case 'gcash':
                            return <CreditCard className="h-6 w-6 text-blue-600" />;
                          case 'card':
                            return <CreditCard className="h-6 w-6 text-purple-600" />;
                          case 'qrph':
                            return <QrCode className="h-6 w-6 text-cyan-600" />;
                          default:
                            return <CreditCard className="h-6 w-6 text-gray-600" />;
                        }
                      };

                      const getBorderColor = () => {
                        switch (method.method_key) {
                          case 'cash':
                            return 'border-green-200 hover:border-green-500 hover:bg-green-50';
                          case 'paymongo':
                            return 'border-blue-200 hover:border-blue-500 hover:bg-blue-50';
                          case 'gcash':
                            return 'border-blue-200 hover:border-blue-500 hover:bg-blue-50';
                          case 'card':
                            return 'border-purple-200 hover:border-purple-500 hover:bg-purple-50';
                          case 'qrph':
                            return 'border-cyan-200 hover:border-cyan-500 hover:bg-cyan-50';
                          default:
                            return 'border-gray-200 hover:border-gray-500 hover:bg-gray-50';
                        }
                      };

                      return (
                        <button
                          key={method.method_key}
                          onClick={() => handlePaymentMethodSelect(method.method_key)}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${getBorderColor()}`}
                        >
                          <div className="flex items-center space-x-3">
                            {getIcon()}
                            <div>
                              <div className="font-medium text-gray-900">{method.method_name}</div>
                              <div className="text-sm text-gray-600">
                                {method.method_key === 'cash' 
                                  ? 'Physical cash payment with change calculation'
                                  : method.method_key === 'paymongo'
                                  ? 'Digital payment via Maya, GCash, QR Ph, and GrabPay'
                                  : method.method_description
                                }
                              </div>
                              {method.is_online && (
                                <div className="text-xs text-blue-600 mt-1">Online Payment</div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PayMongo Payment Modal */}
      {showPayMongoModal && paymentIntent && (
        <PayMongoPaymentModal
          paymentIntent={paymentIntent}
          isCheckingStatus={isCheckingStatus}
          isCancelling={isCancelling}
          error={payMongoError}
          onCancel={() => cancelPayment(paymentIntent.paymentIntentId)}
          onClose={closePayMongoModal}
        />
      )}

      {/* PayMongo Webhook Test Modal */}
      {showWebhookTest && currentOrder && (
        <PayMongoWebhookTest
          orderId={currentOrder.id}
          orderNumber={currentOrder.order_number}
          onClose={() => setShowWebhookTest(false)}
        />
      )}
    </div>
  );
});

NewOrderModal.displayName = 'NewOrderModal';

export default NewOrderModal;
