import React, { useState } from 'react';
import { X, Plus, Trash2, Save, User, Phone, MapPin, Clock, MessageSquare } from 'lucide-react';
import { api } from '../../utils/api';
import { CreateOrderRequest, AddOrderItemRequest, Order, MenuItem, ApiResponse } from '../../types/orders';
import MenuItemSelector from './MenuItemSelector';

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

const NewOrderModal: React.FC<NewOrderModalProps> = ({ onClose, onOrderCreated }) => {
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

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.12; // 12% VAT
  const total = subtotal + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: name === 'table_number' || name === 'estimated_prep_time' 
        ? (value ? parseInt(value) : undefined)
        : value
    }));
  };

  const handleAddMenuItem = (menuItem: MenuItem, quantity: number, customizations?: string, specialInstructions?: string) => {
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
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    if (orderData.order_type === 'dine_in' && !orderData.table_number) {
      setError('Table number is required for dine-in orders');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Step 1: Create the order
      console.log('Creating order with data:', orderData);
      const orderResponse = await api.orders.create(orderData);
      const orderResult: ApiResponse<Order> = await orderResponse.json();

      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.message || 'Failed to create order');
      }

      const createdOrder = orderResult.data;
      setCurrentOrder(createdOrder);
      console.log('Order created:', createdOrder);

      // Step 2: Add items to the order
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

        if (!itemResult.success) {
          console.error('Failed to add item:', itemResult.message);
          // Continue with other items even if one fails
        }
      }

      // Step 3: Notify parent component
      onOrderCreated(createdOrder);
      onClose();

    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Order</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter table number"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Customer name (optional)"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Phone number (optional)"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Estimated prep time"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any special instructions for this order..."
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Item</span>
                </button>
              </div>

              {orderItems.length > 0 ? (
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          {item.customizations && (
                            <p className="text-sm text-gray-600">Customizations: {item.customizations}</p>
                          )}
                          {item.specialInstructions && (
                            <p className="text-sm text-gray-600">Instructions: {item.specialInstructions}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">₱{item.totalPrice.toFixed(2)}</p>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700 mt-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No items added yet</p>
                  <p className="text-gray-400 text-sm mt-1">Click "Add Item" to start building the order</p>
                </div>
              )}

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
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrder}
              disabled={isCreating || orderItems.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Order...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
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
};

export default NewOrderModal;
