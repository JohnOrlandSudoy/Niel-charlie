import { useState, useCallback, useMemo } from 'react';
import { api } from '../utils/api';
import { Order as ApiOrder, OrderItem, UpdateOrderItemRequest, PaginatedOrderResponse, OrderStats } from '../types/orders';

export const useOrderManagement = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  });

  // Calculate order statistics
  const calculateOrderStats = useCallback((ordersData: ApiOrder[]) => {
    const stats: OrderStats = {
      totalOrders: ordersData.length,
      pendingOrders: ordersData.filter(order => order.status === 'pending').length,
      preparingOrders: ordersData.filter(order => order.status === 'preparing').length,
      readyOrders: ordersData.filter(order => order.status === 'ready').length,
      completedOrders: ordersData.filter(order => order.status === 'completed').length,
      totalRevenue: ordersData.reduce((sum, order) => sum + order.total_amount, 0),
      averageOrderValue: ordersData.length > 0 
        ? ordersData.reduce((sum, order) => sum + order.total_amount, 0) / ordersData.length 
        : 0
    };
    setOrderStats(stats);
  }, []);

  // Fetch orders from API
  const fetchOrders = useCallback(async (filterStatus: string = 'all') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.orders.getAll({
        page: 1,
        limit: 50,
        status: filterStatus === 'all' ? undefined : filterStatus
      });
      
      const result: PaginatedOrderResponse = await response.json();
      
      if (result.success && result.data) {
        setOrders(result.data);
        calculateOrderStats(result.data);
      } else {
        setError(result.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [calculateOrderStats]);

  // Search orders
  const searchOrders = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchOrders();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.orders.search({
        q: query,
        page: 1,
        limit: 50
      });
      
      const result: PaginatedOrderResponse = await response.json();
      
      if (result.success && result.data) {
        setOrders(result.data);
        calculateOrderStats(result.data);
      } else {
        setError(result.message || 'Failed to search orders');
      }
    } catch (err) {
      console.error('Error searching orders:', err);
      setError('Failed to search orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrders, calculateOrderStats]);

  // Handle new order creation
  const handleOrderCreated = useCallback((newOrder: ApiOrder) => {
    setOrders(prev => {
      const updatedOrders = [newOrder, ...prev];
      // Calculate stats with the updated orders list
      calculateOrderStats(updatedOrders);
      return updatedOrders;
    });
    console.log('New order created:', newOrder);
  }, [calculateOrderStats]);

  // Filter orders (client-side filtering for status)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // This will be used with additional filters in the component
      return true;
    });
  }, [orders]);

  return {
    orders,
    setOrders,
    isLoading,
    error,
    setError,
    orderStats,
    fetchOrders,
    searchOrders,
    handleOrderCreated,
    filteredOrders,
    calculateOrderStats
  };
};
