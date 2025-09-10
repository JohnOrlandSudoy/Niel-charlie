import React, { useState, useCallback, useMemo } from 'react';
import { X, Plus, Trash2, Save, User, Phone, MapPin, Clock, MessageSquare, AlertTriangle, XCircle } from 'lucide-react';
import { api } from '../../utils/api';
import { CreateOrderRequest, AddOrderItemRequest, Order, MenuItem, ApiResponse } from '../../types/orders';
import MenuItemSelector from './MenuItemSelector';
import { useInventoryStock } from '../../hooks/useInventoryStock';

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

  // Use inventory stock checking
  const { checkOrderStock } = useInventoryStock();

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

  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    if (orderData.order_type === 'dine_in' && !orderData.table_number) {
      setError('Table number is required for dine-in orders');
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
      
      console.log('Creating order with cleaned data:', cleanedOrderData);
      console.log('Auth token present:', !!token);
      const orderResponse = await api.orders.create(cleanedOrderData);
      console.log('Order response status:', orderResponse.status);
      console.log('Order response headers:', orderResponse.headers);
      
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
      console.log('Order result:', orderResult);

      if (!orderResult.success || !orderResult.data) {
        console.error('Order creation failed:', {
          success: orderResult.success,
          message: orderResult.message,
          error: orderResult.error,
          data: orderResult.data
        });
        throw new Error(orderResult.message || orderResult.error || 'Failed to create order');
      }

      const createdOrder = orderResult.data;
      setCurrentOrder(createdOrder);
      console.log('Order created:', createdOrder);

      // Step 2: Add items to the order
      let itemsAddedSuccessfully = 0;
      for (const item of orderItems) {
        const itemData: AddOrderItemRequest = {
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          customizations: item.customizations || undefined,
          special_instructions: item.specialInstructions || undefined
        };

        console.log('Adding item to order:', itemData);
        const itemResponse = await api.orders.addItem(createdOrder.id, itemData);
        const itemResult: ApiResponse<any> = await itemResponse.json();

        if (itemResult.success) {
          itemsAddedSuccessfully++;
        } else {
          console.error('Failed to add item:', itemResult.message);
          // Continue with other items even if one fails
        }
      }

      console.log(`Successfully added ${itemsAddedSuccessfully} out of ${orderItems.length} items`);

      // Step 3: Create updated order with correct totals
      const updatedOrder: Order = {
        ...createdOrder,
        subtotal: subtotal,
        tax_amount: tax,
        total_amount: total
      };

      console.log('Updated order with totals:', updatedOrder);
      
      // Step 4: Notify parent component with updated order
      onOrderCreated(updatedOrder);
      
      // Show warning if some items failed to add
      if (itemsAddedSuccessfully < orderItems.length) {
        console.warn(`Warning: Only ${itemsAddedSuccessfully} out of ${orderItems.length} items were added to the order. Please check the order details.`);
      }
      onClose();

    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-order-title"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="new-order-title" className="text-xl font-semibold text-gray-900">Create New Order</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close new order modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <X className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Type *
                    </label>
                    <select
                      name="order_type"
                      value={orderData.order_type}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        placeholder="Any special instructions for this order..."
                        aria-label="Special instructions for the order"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                <button
                  onClick={() => setShowMenuItemSelector(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Add menu item to order"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Add Item</span>
                </button>
              </div>

              {orderItems.length > 0 ? (
                <div className="space-y-3">
                  {orderItems.map((item, index) => {
                    const stockCheck = checkOrderStock([{ menuItem: item.menuItem, quantity: item.quantity }]);
                    const hasStockIssue = stockCheck.unavailableItems.length > 0 || stockCheck.lowStockItems.length > 0;
                    
                    return (
                      <div key={index} className={`rounded-lg p-4 ${
                        hasStockIssue ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
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
                          <div className="text-right">
                            <p className="font-medium text-gray-900">₱{item.totalPrice.toFixed(2)}</p>
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-700 mt-1 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                              aria-label={`Remove ${item.menuItem.name} from order`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
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
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Cancel order creation"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrder}
              disabled={isCreating || orderItems.length === 0 || (() => {
                const stockCheck = checkOrderStock(orderItems.map(item => ({
                  menuItem: item.menuItem,
                  quantity: item.quantity
                })));
                return stockCheck.unavailableItems.length > 0;
              })()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
});

NewOrderModal.displayName = 'NewOrderModal';

export default NewOrderModal;
