import React, { useState, useCallback, useMemo } from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import { Order as ApiOrder, OrderItem, UpdateOrderItemRequest } from '../../types/orders';

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

  const handleEditSubmit = useCallback((item: OrderItem) => {
    onUpdateItem(item.id, editForm);
    setEditForm({});
  }, [editForm, onUpdateItem]);

  const handleEditChange = useCallback((field: keyof UpdateOrderItemRequest, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCancelEdit = useCallback(() => {
    onEditItem(null);
    setEditForm({});
  }, [onEditItem]);

  const handleStartEdit = useCallback((item: OrderItem) => {
    onEditItem(item);
    setEditForm({
      quantity: item.quantity,
      customizations: item.customizations || '',
      special_instructions: item.special_instructions || ''
    });
  }, [onEditItem]);

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
                <div><span className="font-medium">Subtotal:</span> ₱{order.subtotal.toFixed(2)}</div>
                <div><span className="font-medium">Tax:</span> ₱{order.tax_amount.toFixed(2)}</div>
                <div><span className="font-medium">Total:</span> ₱{order.total_amount.toFixed(2)}</div>
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
                              value={editForm.customizations || item.customizations || ''}
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
                      // Display Mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{item.menu_item?.name}</h4>
                            <span className="text-sm font-medium text-gray-900">₱{item.total_price.toFixed(2)}</span>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Quantity: {item.quantity} × ₱{item.unit_price.toFixed(2)}</div>
                            {item.customizations && (
                              <div>Customizations: {item.customizations}</div>
                            )}
                            {item.special_instructions && (
                              <div>Instructions: {item.special_instructions}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Edit item"
                            aria-label={`Edit ${item.menu_item?.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            disabled={isDeletingItem}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Delete item"
                            aria-label={`Delete ${item.menu_item?.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
