import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Edit, Trash2, Clock, ChefHat, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { Order as ApiOrder, OrderItem, UpdateOrderItemRequest } from '../../types/orders';
import { MenuItem } from '../../types/menu';
import { api } from '../../utils/api';
import { storageHelpers } from '../../lib/supabase';

interface OrderDetailsModalProps {
  order: ApiOrder;
  orderItems: OrderItem[];
  isLoadingItems: boolean;
  editingItem: OrderItem | null;
  isUpdatingItem: boolean;
  isDeletingItem: boolean;
  onClose: () => void;
  onEditItem: (item: OrderItem | null) => void;
  onUpdateItem: (itemId: string, data: UpdateOrderItemRequest) => void;
  onDeleteItem: (itemId: string) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = React.memo(({
  order,
  orderItems,
  isLoadingItems,
  editingItem,
  isUpdatingItem,
  isDeletingItem,
  onClose,
  onEditItem,
  onUpdateItem,
  onDeleteItem
}) => {
  const [editForm, setEditForm] = useState<UpdateOrderItemRequest>({});
  const [menuItemDetails, setMenuItemDetails] = useState<{ [key: string]: MenuItem }>({});
  const [loadingMenuItems, setLoadingMenuItems] = useState<{ [key: string]: boolean }>({});

  const handleEditSubmit = useCallback((item: OrderItem) => {
    // Convert customizations string back to object format
    let customizationsObj = undefined;
    if (editForm.customizations && typeof editForm.customizations === 'string' && editForm.customizations.trim()) {
      try {
        // Try to parse as JSON if it's already an object string
        customizationsObj = JSON.parse(editForm.customizations);
      } catch {
        // If not JSON, create a structured object from the string
        customizationsObj = {
          notes: editForm.customizations.trim()
        };
      }
    } else if (editForm.customizations && typeof editForm.customizations === 'object') {
      customizationsObj = editForm.customizations;
    }

    const updateData: UpdateOrderItemRequest = {
      quantity: editForm.quantity,
      special_instructions: editForm.special_instructions,
      customizations: customizationsObj
    };
    
    onUpdateItem(item.id, updateData);
    setEditForm({});
  }, [editForm, onUpdateItem]);

  const handleEditChange = useCallback((field: keyof UpdateOrderItemRequest, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCancelEdit = useCallback(() => {
    onEditItem(null);
    setEditForm({});
  }, [onEditItem]);

  // Fetch detailed menu item information
  const fetchMenuItemDetails = useCallback(async (menuItemId: string) => {
    if (menuItemDetails[menuItemId] || loadingMenuItems[menuItemId]) {
      return; // Already loaded or loading
    }

    try {
      setLoadingMenuItems(prev => ({ ...prev, [menuItemId]: true }));
      
      // Fetch menu item details
      const menuResponse = await api.menus.getById(menuItemId);
      const menuResult = await menuResponse.json();
      
      if (menuResult.success && menuResult.data) {
        setMenuItemDetails(prev => ({ ...prev, [menuItemId]: menuResult.data }));
        
      }
    } catch (err) {
      console.error(`Error fetching menu item details for ${menuItemId}:`, err);
    } finally {
      setLoadingMenuItems(prev => ({ ...prev, [menuItemId]: false }));
    }
  }, [menuItemDetails, loadingMenuItems]);

  // Get image URL for menu item
  const getMenuItemImageUrl = useCallback((menuItem: MenuItem) => {
    if (menuItem.image_url) {
      return menuItem.image_url;
    } else if (menuItem.image_filename) {
      return storageHelpers.getPublicUrl('menu-item-images', menuItem.image_filename);
    }
    return null;
  }, []);

  const handleStartEdit = useCallback((item: OrderItem) => {
    onEditItem(item);
    // Convert customizations object back to string for editing
    let customizationsString = '';
    if (item.customizations) {
      if (typeof item.customizations === 'string') {
        customizationsString = item.customizations;
      } else {
        // Convert object to readable string
        const parts = [];
        if (item.customizations.size) parts.push(`Size: ${item.customizations.size}`);
        if (item.customizations.toppings && item.customizations.toppings.length > 0) {
          parts.push(`Toppings: ${item.customizations.toppings.join(', ')}`);
        }
        if (item.customizations.spice_level) parts.push(`Spice: ${item.customizations.spice_level}`);
        if (item.customizations.notes) parts.push(item.customizations.notes);
        customizationsString = parts.join(', ');
      }
    }
    
    setEditForm({
      quantity: item.quantity,
      customizations: customizationsString,
      special_instructions: item.special_instructions || ''
    });
  }, [onEditItem]);

  // Fetch menu item details when order items change
  useEffect(() => {
    orderItems.forEach(item => {
      if (item.menu_item_id && !menuItemDetails[item.menu_item_id]) {
        fetchMenuItemDetails(item.menu_item_id);
      }
    });
  }, [orderItems, menuItemDetails, fetchMenuItemDetails]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const orderStatusColor = useMemo(() => {
    switch (order.status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'preparing': return 'bg-amber-100 text-amber-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, [order.status]);

  const paymentStatusColor = useMemo(() => {
    return order.payment_status === 'paid' 
      ? 'bg-emerald-100 text-emerald-800' 
      : 'bg-red-100 text-red-800';
  }, [order.payment_status]);

  // Calculate totals from order items (in case order totals are outdated)
  const calculatedTotals = useMemo(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const tax = subtotal * 0.12; // 12% VAT
    const total = subtotal + tax;
    
    return {
      subtotal,
      tax,
      total
    };
  }, [orderItems]);

  // Use calculated totals if order items exist, otherwise use order totals
  const displayTotals = useMemo(() => {
    if (orderItems.length > 0) {
      return calculatedTotals;
    }
    return {
      subtotal: order.subtotal || 0,
      tax: order.tax_amount || 0,
      total: order.total_amount || 0
    };
  }, [orderItems, calculatedTotals, order]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="order-details-title" className="text-xl font-semibold text-gray-900">
            Order Details - #{order.order_number}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close order details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
              
        <div className="p-6">
          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Order Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Order Number:</span> {order.order_number}</div>
                <div><span className="font-medium">Customer:</span> {order.customer_name || 'Walk-in Customer'}</div>
                <div><span className="font-medium">Phone:</span> {order.customer_phone || 'N/A'}</div>
                <div><span className="font-medium">Type:</span> {order.order_type.replace('_', ' ').toUpperCase()}</div>
                {order.table_number && <div><span className="font-medium">Table:</span> {order.table_number}</div>}
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${orderStatusColor}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Payment Status:</span> 
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${paymentStatusColor}`}>
                    {order.payment_status}
                  </span>
                </div>
                <div><span className="font-medium">Payment Method:</span> {order.payment_method || 'N/A'}</div>
                
                {/* Order Totals with Discount Information */}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div><span className="font-medium">Subtotal:</span> ₱{displayTotals.subtotal.toFixed(2)}</div>
                  <div><span className="font-medium">VAT (12%):</span> ₱{displayTotals.tax.toFixed(2)}</div>
                  
                  {/* Enhanced discount display matching receipt approach */}
                  {(() => {
                    // Extract discount information with comprehensive fallback handling
                    const discountApplied = (order as any).discount_applied;
                    const discountCode = discountApplied?.code || discountApplied || (order as any).discount_code || null;
                    const discountAmount = (order as any).discount_amount || (order as any).discountAmount || 0;
                    
                    console.log('🔍 ORDER DETAILS DISCOUNT DEBUG:', {
                      discountApplied,
                      discountCode,
                      discountAmount,
                      orderKeys: Object.keys(order),
                      displayTotals
                    });
                    
                    if (discountCode && discountAmount > 0) {
                      const originalTotal = displayTotals.subtotal + displayTotals.tax;
                      
                      return (
                        <>
                          <div className="text-red-600 font-medium">
                            <span>discount:</span> 
                            <span className="ml-2">-{discountAmount.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-red-600 ml-4 mt-1 space-y-1">
                            <div>Original Total: ₱{originalTotal.toFixed(2)}</div>
                            <div>Discount Applied: {((discountAmount / originalTotal) * 100).toFixed(1)}% off</div>
                            <div className="font-bold">💰 You Save: ₱{discountAmount.toFixed(2)}</div>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="border-t border-gray-200 pt-1 mt-2">
                    <div className="font-medium text-lg">
                      <span>Total:</span> 
                      <span className={`ml-2 ${displayTotals.total < (displayTotals.subtotal + displayTotals.tax) ? 'text-red-600 font-bold' : ''}`}>
                        ₱{displayTotals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Show savings summary if discount is applied */}
                  {(() => {
                    const discountApplied = (order as any).discount_applied;
                    const discountCode = discountApplied?.code || discountApplied || (order as any).discount_code || null;
                    const discountAmount = (order as any).discount_amount || (order as any).discountAmount || 0;
                    
                    if (discountCode && discountAmount > 0) {
                      return (
                        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-lg">
                          <div className="text-center text-red-700 font-semibold text-sm">
                            🎉 Great Deal! You saved ₱{discountAmount.toFixed(2)} with {discountCode}!
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Order Items</h3>
            
            {isLoadingItems ? (
              <div className="flex items-center justify-center py-8" role="status" aria-label="Loading order items">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading items...</span>
              </div>
            ) : orderItems.length > 0 ? (
              <div className="space-y-3" role="list" aria-label="Order items">
                {orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4" role="listitem">
                    {editingItem?.id === item.id ? (
                      // Edit Form
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{item.menu_item?.name}</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditSubmit(item)}
                              disabled={isUpdatingItem}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label={`Save changes to ${item.menu_item?.name}`}
                            >
                              {isUpdatingItem ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                              aria-label="Cancel editing"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`quantity-${item.id}`}>
                              Quantity
                            </label>
                            <input
                              id={`quantity-${item.id}`}
                              type="number"
                              min="1"
                              value={editForm.quantity || item.quantity}
                              onChange={(e) => handleEditChange('quantity', parseInt(e.target.value) || 1)}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label="Quantity"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`customizations-${item.id}`}>
                              Customizations
                            </label>
                            <input
                              id={`customizations-${item.id}`}
                              type="text"
                              value={typeof editForm.customizations === 'string' ? editForm.customizations : ''}
                              onChange={(e) => handleEditChange('customizations', e.target.value)}
                              placeholder="e.g., Extra spicy"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label="Customizations"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`instructions-${item.id}`}>
                              Special Instructions
                            </label>
                            <input
                              id={`instructions-${item.id}`}
                              type="text"
                              value={editForm.special_instructions || item.special_instructions || ''}
                              onChange={(e) => handleEditChange('special_instructions', e.target.value)}
                              placeholder="Special instructions"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label="Special instructions"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Enhanced Display Mode with Menu Item Details
                      <div className="space-y-3">
                        <div className="flex items-start space-x-4">
                          {/* Menu Item Image */}
                          <div className="flex-shrink-0">
                            {(() => {
                              const menuItem = menuItemDetails[item.menu_item_id];
                              const imageUrl = menuItem ? getMenuItemImageUrl(menuItem) : null;
                              
                              if (loadingMenuItems[item.menu_item_id]) {
                                return (
                                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                  </div>
                                );
                              }
                              
                              if (imageUrl) {
                                return (
                                  <img
                                    src={imageUrl}
                                    alt={item.menu_item?.name || 'Menu item'}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                );
                              }
                              
                              return (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* Menu Item Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{item.menu_item?.name}</h4>
                                {(() => {
                                  const menuItem = menuItemDetails[item.menu_item_id];
                                  return menuItem && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {menuItem.description}
                                    </p>
                                  );
                                })()}
                              </div>
                              <span className="text-sm font-medium text-gray-900 ml-2">₱{item.total_price.toFixed(2)}</span>
                            </div>
                            
                            {/* Menu Item Info */}
                            {(() => {
                              const menuItem = menuItemDetails[item.menu_item_id];
                              return menuItem && (
                                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{menuItem.prep_time}m prep</span>
                                  </div>
                                  {menuItem.calories > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <ChefHat className="h-3 w-3" />
                                      <span>{menuItem.calories} cal</span>
                                    </div>
                                  )}
                                  {menuItem.allergens && menuItem.allergens.length > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                                      <span>Allergens: {menuItem.allergens.join(', ')}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            
                            {/* Order Item Details */}
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Quantity: {item.quantity} × ₱{item.unit_price.toFixed(2)}</div>
                              {item.customizations && (
                                <div className="text-blue-600">
                                  Customizations: {(() => {
                                    if (typeof item.customizations === 'string') {
                                      return item.customizations;
                                    } else {
                                      const parts = [];
                                      if (item.customizations.size) parts.push(`Size: ${item.customizations.size}`);
                                      if (item.customizations.toppings && item.customizations.toppings.length > 0) {
                                        parts.push(`Toppings: ${item.customizations.toppings.join(', ')}`);
                                      }
                                      if (item.customizations.spice_level) parts.push(`Spice: ${item.customizations.spice_level}`);
                                      if (item.customizations.notes) parts.push(item.customizations.notes);
                                      return parts.join(', ');
                                    }
                                  })()}
                                </div>
                              )}
                              {item.special_instructions && (
                                <div className="text-amber-600">Instructions: {item.special_instructions}</div>
                              )}
                              
                              {/* Ingredient Information */}
                              {item.menu_item?.ingredients && item.menu_item.ingredients.length > 0 && (
                                <div className="mt-2 p-2 bg-gray-50 rounded border">
                                  <div className="text-xs font-medium text-gray-700 mb-1">Ingredients:</div>
                                  <div className="space-y-1">
                                    {item.menu_item.ingredients.map((ingredient, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium">{ingredient.name}</span>
                                          <span className="text-gray-500">
                                            {ingredient.total_required_for_order} {ingredient.unit}
                                            {ingredient.is_optional && <span className="text-blue-500 ml-1">(optional)</span>}
                                          </span>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                                          ingredient.stock_status === 'sufficient' 
                                            ? 'bg-green-100 text-green-800'
                                            : ingredient.stock_status === 'low_stock'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {ingredient.stock_status === 'sufficient' ? '✓' : 
                                           ingredient.stock_status === 'low_stock' ? '⚠' : '✗'} 
                                          {ingredient.current_stock}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {/* Only show edit button if order is not completed */}
                          {order.status !== 'completed' && (
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              title="Edit item"
                              aria-label={`Edit ${item.menu_item?.name}`}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* Only show delete button if order is not completed */}
                          {order.status !== 'completed' && (
                            <button
                              onClick={() => onDeleteItem(item.id)}
                              disabled={isDeletingItem}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                              title="Delete item"
                              aria-label={`Delete ${item.menu_item?.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500" role="status" aria-label="No items found">
                No items found for this order
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

OrderDetailsModal.displayName = 'OrderDetailsModal';

export default OrderDetailsModal;
