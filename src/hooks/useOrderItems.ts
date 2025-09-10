import { useState, useCallback } from 'react';
import { api } from '../utils/api';
import { OrderItem, UpdateOrderItemRequest } from '../types/orders';

export const useOrderItems = () => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch order items
  const fetchOrderItems = useCallback(async (orderId: string) => {
    try {
      setIsLoadingItems(true);
      setError(null);
      
      const response = await api.orders.getItems(orderId);
      const result = await response.json();
      
      if (result.success && result.data) {
        setOrderItems(result.data);
        console.log('Order items fetched:', result.data);
      } else {
        setError(result.message || 'Failed to fetch order items');
      }
    } catch (err) {
      console.error('Error fetching order items:', err);
      setError('Failed to fetch order items. Please try again.');
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  // Handle update order item
  const handleUpdateOrderItem = useCallback(async (itemId: string, updateData: UpdateOrderItemRequest) => {
    try {
      setIsUpdatingItem(true);
      setError(null);
      
      const response = await api.orders.updateItem(itemId, updateData);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Update the item in the local state
        setOrderItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, ...result.data } : item
        ));
        
        setEditingItem(null);
        console.log('Order item updated:', result.data);
        return result.data;
      } else {
        setError(result.message || 'Failed to update order item');
        return null;
      }
    } catch (err) {
      console.error('Error updating order item:', err);
      setError('Failed to update order item. Please try again.');
      return null;
    } finally {
      setIsUpdatingItem(false);
    }
  }, []);

  // Handle delete order item
  const handleDeleteOrderItem = useCallback(async (itemId: string) => {
    if (!window.confirm('Are you sure you want to remove this item from the order?')) {
      return false;
    }

    try {
      setIsDeletingItem(true);
      setError(null);
      
      const response = await api.orders.deleteItem(itemId);
      const result = await response.json();
      
      if (result.success) {
        // Remove the item from local state
        setOrderItems(prev => prev.filter(item => item.id !== itemId));
        
        console.log('Order item deleted successfully');
        return true;
      } else {
        setError(result.message || 'Failed to delete order item');
        return false;
      }
    } catch (err) {
      console.error('Error deleting order item:', err);
      setError('Failed to delete order item. Please try again.');
      return false;
    } finally {
      setIsDeletingItem(false);
    }
  }, []);

  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);

  return {
    orderItems,
    setOrderItems,
    isLoadingItems,
    isUpdatingItem,
    isDeletingItem,
    editingItem,
    setEditingItem,
    error,
    setError,
    fetchOrderItems,
    handleUpdateOrderItem,
    handleDeleteOrderItem
  };
};
