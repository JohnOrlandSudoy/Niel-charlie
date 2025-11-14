import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Thermometer,
  Timer,
  Package,
  Bell,
  Eye,
  X,
  AlertCircle,
  Loader2,
  History,
  Trash2,
  PlusCircle,
  Filter,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../utils/api';
import { 
  KitchenOrder, 
  OrderStatusHistory, 
  KitchenStats, 
  ApiResponse,
  WasteReport,
  WasteReportFilters,
  WasteReportPayload,
  WasteReportUpdatePayload,
  WasteAnalytics
} from '../../types/kitchen';



interface Ingredient {
  id?: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  status: 'sufficient' | 'low' | 'out';
}

// Utility functions moved outside components for accessibility
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};


const getStatusColor = (status: string) => {
  switch (status) {
    case 'ready':
      return 'bg-emerald-100 text-emerald-800';
    case 'preparing':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStockStatusColor = (status: string) => {
  switch (status) {
    case 'sufficient':
      return 'bg-emerald-100 text-emerald-800';
    case 'low':
      return 'bg-amber-100 text-amber-800';
    case 'out':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const WASTE_REASON_OPTIONS = [
  { value: 'spoilage', label: 'Spoilage' },
  { value: 'overproduction', label: 'Overproduction' },
  { value: 'prep_error', label: 'Preparation Error' },
  { value: 'contamination', label: 'Contamination' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' }
];

const getWasteStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'approved':
    case 'resolved':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'rejected':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
};

const KitchenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kitchenStats, setKitchenStats] = useState<KitchenStats>({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    averagePrepTime: 0,
    totalRevenue: 0
  });
  const [orderHistory, setOrderHistory] = useState<OrderStatusHistory[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const notificationTimeouts = useRef<number[]>([]);
  const [wasteReports, setWasteReports] = useState<WasteReport[]>([]);
  const [isLoadingWasteReports, setIsLoadingWasteReports] = useState(false);
  const [wasteFilters, setWasteFilters] = useState<{
    status: string;
    reason: string;
    startDate: string;
    endDate: string;
  }>({
    status: 'all',
    reason: 'all',
    startDate: '',
    endDate: ''
  });
  const [wasteError, setWasteError] = useState<string | null>(null);
  const [isWasteFormOpen, setIsWasteFormOpen] = useState(false);
  const [isSubmittingWasteReport, setIsSubmittingWasteReport] = useState(false);
  const [wasteAnalytics, setWasteAnalytics] = useState<WasteAnalytics | null>(null);
  const [isLoadingWasteAnalytics, setIsLoadingWasteAnalytics] = useState(false);
  const [updatingWasteReportId, setUpdatingWasteReportId] = useState<string | null>(null);

  // Fetch kitchen orders from API - Memoized for performance
  const fetchKitchenOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.orders.getKitchenOrders();
      const result: ApiResponse<KitchenOrder[]> = await response.json();
      
      if (result.success && result.data) {
        console.log('Kitchen orders fetched:', result.data);
        console.log('First order structure:', result.data[0]);
        
        // Check if orders have items included
        const ordersWithItems = result.data.filter(order => order.order_items && order.order_items.length > 0);
        const ordersWithoutItems = result.data.filter(order => !order.order_items || order.order_items.length === 0);
        
        console.log(`📊 Orders with items: ${ordersWithItems.length}`);
        console.log(`⚠️ Orders without items: ${ordersWithoutItems.length}`);
        
        if (ordersWithoutItems.length > 0) {
          console.warn('⚠️ Some orders are missing items. Check backend kitchen orders endpoint configuration.');
        }
        
        // Process orders with the new structure
        const processedOrders = result.data.map((order) => {
          if (!order.order_items || order.order_items.length === 0) {
            console.warn(`⚠️ Order ${order.id} has no items - check backend kitchen orders endpoint`);
          }
          return order;
        });
        
        setOrders(processedOrders);
        
        // Calculate stats for active orders
        calculateActiveOrdersStats(processedOrders);
        
        // Fetch completed orders for today's statistics
        await fetchCompletedOrdersForStats();
      } else {
        console.error('Failed to fetch kitchen orders:', result);
        setError(result.message || 'Failed to fetch kitchen orders');
      }
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
      setError('Failed to fetch kitchen orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get today's date key for localStorage
  const getTodayKey = () => {
    const today = new Date();
    return `kitchen_completed_orders_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  // Save completed orders count to localStorage
  const saveCompletedOrdersToStorage = (count: number) => {
    try {
      const todayKey = getTodayKey();
      localStorage.setItem(todayKey, count.toString());
      console.log('💾 Saved completed orders to localStorage:', { key: todayKey, count });
    } catch (err) {
      console.warn('⚠️ Failed to save completed orders to localStorage:', err);
    }
  };

  // Load completed orders count from localStorage
  const loadCompletedOrdersFromStorage = (): number => {
    try {
      const todayKey = getTodayKey();
      const stored = localStorage.getItem(todayKey);
      const count = stored ? parseInt(stored, 10) : 0;
      console.log('📂 Loaded completed orders from localStorage:', { key: todayKey, count });
      return count;
    } catch (err) {
      console.warn('⚠️ Failed to load completed orders from localStorage:', err);
      return 0;
    }
  };

  // Fetch completed orders for today's statistics
  const fetchCompletedOrdersForStats = async () => {
    try {
      // First, load from localStorage as fallback
      const storedCount = loadCompletedOrdersFromStorage();
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      console.log('📅 Fetching completed orders for today:', {
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
        storedCount
      });
      
      // Try to fetch completed orders for today
      const response = await api.orders.getAll({
        status: 'completed'
      });
      
      const result: ApiResponse<KitchenOrder[]> = await response.json();
      
      if (result.success && result.data) {
        // Filter completed orders to only include today's orders
        const todayCompletedOrders = result.data.filter(order => {
          const orderDate = new Date(order.completed_at || order.updated_at);
          return orderDate >= startOfDay && orderDate < endOfDay;
        });
        
        const apiCount = todayCompletedOrders.length;
        console.log('✅ Completed orders for today from API:', apiCount);
        console.log('📊 Total completed orders from API:', result.data.length);
        console.log('💾 Stored count from localStorage:', storedCount);
        
        // Use the higher count between API and localStorage (in case localStorage has newer data)
        const finalCount = Math.max(apiCount, storedCount);
        
        // Update kitchen stats with today's completed orders count
        setKitchenStats(prevStats => ({
          ...prevStats,
          completedOrders: finalCount
        }));
        
        // Save to localStorage
        saveCompletedOrdersToStorage(finalCount);
      } else {
        console.warn('⚠️ Could not fetch completed orders, using localStorage count:', storedCount);
        // Use stored count as fallback
        setKitchenStats(prevStats => ({
          ...prevStats,
          completedOrders: storedCount
        }));
      }
    } catch (err) {
      console.warn('⚠️ Error fetching completed orders, using localStorage count:', err);
      // Use stored count as fallback
      const storedCount = loadCompletedOrdersFromStorage();
      setKitchenStats(prevStats => ({
        ...prevStats,
        completedOrders: storedCount
      }));
    }
  };

  // Calculate kitchen statistics (for active orders only)
  const calculateActiveOrdersStats = (ordersData: KitchenOrder[]) => {
    setKitchenStats(prevStats => ({
      totalOrders: ordersData?.length || 0,
      pendingOrders: ordersData?.filter(order => order.status === 'pending').length || 0,
      preparingOrders: ordersData?.filter(order => order.status === 'preparing').length || 0,
      readyOrders: ordersData?.filter(order => order.status === 'ready').length || 0,
      completedOrders: prevStats.completedOrders, // Keep the completed orders count from localStorage/API
      averagePrepTime: 0, // This would need to be calculated from actual prep times
      totalRevenue: ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    }));
  };

  // Memoized stats cards for performance
  const stats = useMemo(() => [
    { label: 'Orders in Queue', value: kitchenStats.pendingOrders.toString(), icon: Clock, color: 'amber' },
    { label: 'Currently Preparing', value: kitchenStats.preparingOrders.toString(), icon: ChefHat, color: 'blue' },
    { label: 'Ready for Pickup', value: kitchenStats.readyOrders.toString(), icon: CheckCircle, color: 'emerald' },
    { label: 'Completed Today', value: kitchenStats.completedOrders.toString(), icon: Timer, color: 'purple' }
  ], [kitchenStats]);

  // Fetch real inventory data for stock awareness - Memoized for performance
  const fetchInventoryData = useCallback(async () => {
    try {
      const response = await api.inventory.getAllIngredients();
      const result: ApiResponse<any[]> = await response.json();
      
      if (result.success && result.data) {
        // Convert API data to our ingredient format
        const inventoryIngredients: Ingredient[] = result.data.map(item => ({
          id: item.id,
          name: item.name,
          currentStock: item.current_stock || 0,
          minStock: item.min_stock_threshold || 0,
          unit: item.unit || 'kg',
          status: item.current_stock === 0 ? 'out' : 
                  (item.min_stock_threshold && item.current_stock <= item.min_stock_threshold) ? 'low' : 'sufficient'
        }));
        setIngredients(inventoryIngredients);
        
        // Check for critical stock alerts
        const criticalIngredients = inventoryIngredients.filter(ing => ing.status === 'out');
        if (criticalIngredients.length > 0) {
          setShowStockAlert(true);
        }
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      // Fallback to mock data if API fails
      const mockIngredients: Ingredient[] = [
        { id: 'mock-chicken', name: 'chicken', currentStock: 15, minStock: 10, unit: 'kg', status: 'sufficient' },
        { id: 'mock-pork', name: 'pork', currentStock: 8, minStock: 10, unit: 'kg', status: 'low' },
        { id: 'mock-beef', name: 'beef', currentStock: 12, minStock: 10, unit: 'kg', status: 'sufficient' },
        { id: 'mock-rice', name: 'rice', currentStock: 25, minStock: 15, unit: 'kg', status: 'sufficient' },
        { id: 'mock-soy-sauce', name: 'soy sauce', currentStock: 3, minStock: 5, unit: 'L', status: 'low' },
        { id: 'mock-pepper', name: 'pepper', currentStock: 0, minStock: 2, unit: 'kg', status: 'out' },
        { id: 'mock-garlic', name: 'garlic', currentStock: 2, minStock: 3, unit: 'kg', status: 'low' },
        { id: 'mock-vinegar', name: 'vinegar', currentStock: 4, minStock: 3, unit: 'L', status: 'sufficient' },
        { id: 'mock-oil', name: 'oil', currentStock: 6, minStock: 5, unit: 'L', status: 'sufficient' },
        { id: 'mock-tea-leaves', name: 'tea leaves', currentStock: 1, minStock: 2, unit: 'kg', status: 'low' },
        { id: 'mock-sugar', name: 'sugar', currentStock: 8, minStock: 5, unit: 'kg', status: 'sufficient' }
      ];
      setIngredients(mockIngredients);
      
      const criticalIngredients = mockIngredients.filter(ing => ing.status === 'out');
      if (criticalIngredients.length > 0) {
        setShowStockAlert(true);
      }
    }
  }, []);

  const fetchWasteReports = useCallback(async () => {
    try {
      setIsLoadingWasteReports(true);
      setWasteError(null);

      const filters: WasteReportFilters = {
        page: 1,
        limit: 20,
        status: wasteFilters.status,
        reason: wasteFilters.reason,
        startDate: wasteFilters.startDate || undefined,
        endDate: wasteFilters.endDate || undefined
      };

      const response = await api.kitchen.getWasteReports(filters);
      const result: ApiResponse<WasteReport[]> = await response.json();

      if (result.success) {
        const reports = Array.isArray(result.data) ? result.data : [];
        setWasteReports(reports);
      } else {
        setWasteError(result.message || 'Failed to fetch waste reports');
      }
    } catch (err) {
      console.error('Error fetching waste reports:', err);
      setWasteError('Failed to fetch waste reports. Please try again.');
    } finally {
      setIsLoadingWasteReports(false);
    }
  }, [wasteFilters]);

  const fetchWasteAnalytics = useCallback(async () => {
    if (!wasteFilters.startDate || !wasteFilters.endDate) {
      setWasteAnalytics(null);
      return;
    }

    try {
      setIsLoadingWasteAnalytics(true);
      const response = await api.kitchen.getWasteAnalytics({
        startDate: wasteFilters.startDate,
        endDate: wasteFilters.endDate
      });
      const result: ApiResponse<WasteAnalytics> = await response.json();

      if (result.success && result.data) {
        setWasteAnalytics(result.data);
      } else {
        setWasteAnalytics(null);
      }
    } catch (err) {
      console.error('Error fetching waste analytics:', err);
      setWasteAnalytics(null);
    } finally {
      setIsLoadingWasteAnalytics(false);
    }
  }, [wasteFilters.startDate, wasteFilters.endDate]);

  const handleWasteFiltersChange = useCallback((updates: Partial<typeof wasteFilters>) => {
    setWasteFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const resetWasteFilters = useCallback(() => {
    setWasteFilters({
      status: 'all',
      reason: 'all',
      startDate: '',
      endDate: ''
    });
  }, []);

  useEffect(() => {
    setWasteFilters(prev => {
      if (prev.startDate && prev.endDate) {
        return prev;
      }

      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      const startDate = start.toISOString().split('T')[0];

      return {
        ...prev,
        startDate,
        endDate,
      };
    });
  }, []);

  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [...prev, message]);
    const timeoutId = window.setTimeout(() => {
      setNotifications(prev => prev.slice(1));
      notificationTimeouts.current = notificationTimeouts.current.filter((id) => id !== timeoutId);
    }, 5000);
    notificationTimeouts.current.push(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      notificationTimeouts.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      notificationTimeouts.current = [];
    };
  }, []);

  const handleWasteReportSubmit = useCallback(
    async (payload: WasteReportPayload) => {
      try {
        setIsSubmittingWasteReport(true);
        setWasteError(null);

        const response = await api.kitchen.submitWasteReport(payload);
        const result: ApiResponse<WasteReport> = await response.json();

        if (result.success && result.data) {
          addNotification('Waste report submitted successfully.');
          setIsWasteFormOpen(false);
          await fetchWasteReports();
          return { success: true, data: result.data };
        }

        const message = result.message || 'Failed to submit waste report';
        setWasteError(message);
        return { success: false, message };
      } catch (err) {
        console.error('Error submitting waste report:', err);
        const message = err instanceof Error ? err.message : 'Failed to submit waste report. Please try again.';
        setWasteError(message);
        return { success: false, message };
      } finally {
        setIsSubmittingWasteReport(false);
      }
    },
    [fetchWasteReports, addNotification]
  );

  const handleWasteReportStatusUpdate = useCallback(
    async (wasteReportId: string, updates: WasteReportUpdatePayload) => {
      try {
        setUpdatingWasteReportId(wasteReportId);
        setWasteError(null);
        const response = await api.kitchen.updateWasteReport(wasteReportId, updates);
        const result: ApiResponse<WasteReport> = await response.json();

        if (result.success && result.data) {
          setWasteReports(prev =>
            prev.map(report => (report.id === wasteReportId ? result.data! : report))
          );
          if (updates.status === 'resolved') {
            addNotification('Waste report marked as resolved.');
          } else {
            addNotification('Waste report updated.');
          }
          await fetchWasteReports();
          if (wasteFilters.startDate && wasteFilters.endDate) {
            fetchWasteAnalytics();
          }
          return { success: true };
        }

        const message = result.message || 'Failed to update waste report';
        setWasteError(message);
        return { success: false, message };
      } catch (err) {
        console.error('Error updating waste report:', err);
        const message = err instanceof Error ? err.message : 'Failed to update waste report. Please try again.';
        setWasteError(message);
        return { success: false, message };
      }
      finally {
        setUpdatingWasteReportId(null);
      }
    },
    [addNotification, fetchWasteAnalytics, fetchWasteReports, wasteFilters.endDate, wasteFilters.startDate]
  );


  useEffect(() => {
    // Initialize completed orders count from localStorage first
    const storedCompletedCount = loadCompletedOrdersFromStorage();
    setKitchenStats(prevStats => ({
      ...prevStats,
      completedOrders: storedCompletedCount
    }));
    
    fetchKitchenOrders();
    fetchInventoryData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchKitchenOrders();
      fetchInventoryData();
      fetchWasteReports();
      fetchWasteAnalytics();
    }, 30000);
    
    // Add keyboard shortcuts
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (event.key) {
        case 'r':
        case 'R':
          event.preventDefault();
          fetchKitchenOrders();
          fetchInventoryData();
          addNotification('Data refreshed!');
          break;
        case '1':
          event.preventDefault();
          setActiveTab('orders');
          break;
        case '2':
          event.preventDefault();
          setActiveTab('inventory');
          break;
        case '3':
          event.preventDefault();
          setActiveTab('waste');
          break;
        case '4':
          event.preventDefault();
          setActiveTab('equipment');
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [fetchKitchenOrders, fetchInventoryData, fetchWasteReports, fetchWasteAnalytics]);

  useEffect(() => {
    fetchWasteReports();
    fetchWasteAnalytics();
  }, [fetchWasteReports, fetchWasteAnalytics]);



  // Update order status via API
  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled', notes?: string) => {
    try {
      setError(null);
      console.log('🔄 Updating order status:', { orderId, newStatus, notes });
      console.log('🌐 API URL will be:', `http://localhost:3000/api/orders/${orderId}/status`);
      console.log('📤 Request body will be:', JSON.stringify({ status: newStatus, notes }));
      
      const response = await api.orders.updateOrderStatus(orderId, { status: newStatus, notes });
      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        setError(`API Error (${response.status}): ${errorText}`);
        return;
      }
      
      const result: ApiResponse<KitchenOrder> = await response.json();
      console.log('📋 API Result:', result);
      
      if (result.success && result.data) {
        console.log('✅ Status update successful, updating local state...');
        
        // Update the order in local state
        setOrders(prevOrders => {
          const updatedOrders = prevOrders.map(order => 
            order.id === orderId ? result.data! : order
          );
          console.log('🔄 Updated orders:', updatedOrders);
          return updatedOrders;
        });
        
        // Update selected order if it's the same
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(result.data!);
          console.log('🔄 Updated selected order:', result.data);
        }
        
        // Add notification for status changes
        if (newStatus === 'ready') {
          addNotification(`Order #${result.data.order_number} is ready for pickup!`);
        } else if (newStatus === 'preparing') {
          addNotification(`Started preparing Order #${result.data.order_number}`);
        } else if (newStatus === 'completed') {
          addNotification(`Order #${result.data.order_number} completed successfully`);
          
          // Increment completed orders count for today
          setKitchenStats(prevStats => {
            const newCount = prevStats.completedOrders + 1;
            // Save to localStorage immediately
            saveCompletedOrdersToStorage(newCount);
            return {
              ...prevStats,
              completedOrders: newCount
            };
          });
        }
        
        console.log('✅ Order status updated successfully:', result.data);
      } else {
        console.error('❌ API returned error:', result);
        setError(result.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('❌ Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    }
  };


  const markOrderComplete = async (orderId: string) => {
    await updateOrderStatus(orderId, 'completed', 'Order completed by kitchen staff');
  };


  const canPrepareItem = (order: KitchenOrder): boolean => {
    // Use the kitchen_metadata to determine if order can be prepared
    return order.kitchen_metadata?.can_prepare ?? false;
  };

  // Memoized filtered orders for performance
  const getFilteredOrders = useCallback((status: string) => {
    return orders?.filter(order => order.status === status) || [];
  }, [orders]);

  const openOrderModal = (order: KitchenOrder) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };


  // Fetch order status history
  const fetchOrderHistory = async (orderId: string) => {
    try {
      setIsLoadingHistory(true);
      setError(null);
      
      const response = await api.orders.getOrderStatusHistory(orderId);
      const result: ApiResponse<OrderStatusHistory[]> = await response.json();
      
      if (result.success && result.data) {
        setOrderHistory(result.data);
        setShowHistoryModal(true);
        console.log('Order history fetched:', result.data);
      } else {
        setError(result.message || 'Failed to fetch order history');
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
      setError('Failed to fetch order history. Please try again.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 shadow-lg max-w-sm">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm sm:text-base text-green-800">{notification}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
            <span className="text-sm sm:text-base text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Stock Alert Banner */}
      {showStockAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-medium text-red-800">Critical Stock Alert</h3>
                <p className="text-xs sm:text-sm text-red-600 mt-1">
                  {ingredients.filter(ing => ing.status === 'out').length} ingredient(s) out of stock: {' '}
                  <span className="font-medium">
                    {ingredients.filter(ing => ing.status === 'out').map(ing => ing.name).join(', ')}
                  </span>
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Orders requiring these ingredients cannot be prepared
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowStockAlert(false)}
              className="text-red-400 hover:text-red-600 p-1 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
              aria-label="Dismiss stock alert"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Kitchen Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
                Welcome back, {user?.firstName}! Manage food preparation and orders here.
              </p>
              {/* Keyboard Shortcuts Help */}
              <div className="hidden sm:flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">R</kbd> to refresh</span>
                <span>Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">1-4</kbd> for tabs</span>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-gray-500">Kitchen Status</p>
                <p className="text-xs sm:text-sm font-medium text-emerald-600">All Systems Operational</p>
              </div>
              <button
                onClick={() => {
                  fetchKitchenOrders();
                  fetchInventoryData();
                }}
                disabled={isLoading}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 flex items-center space-x-1 sm:space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 touch-manipulation min-h-[44px]"
                aria-label="Refresh kitchen data (or press R)"
                title="Refresh data (R)"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                <span className="text-sm sm:text-base font-medium">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200 touch-manipulation">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg bg-${stat.color}-100 flex-shrink-0`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide">
            <div className="flex space-x-1 sm:space-x-8 px-4 sm:px-6 min-w-full">
              {[
                { id: 'orders', label: 'Active Orders', icon: ChefHat },
                { id: 'inventory', label: 'Stock Levels', icon: Package },
                { id: 'waste', label: 'Waste Reports', icon: Trash2 },
                { id: 'equipment', label: 'Equipment Status', icon: Thermometer }
              ].map((tab) => {
                const Icon = tab.icon;
                const shortcutMap: Record<string, string> = {
                  orders: '1',
                  inventory: '2',
                  waste: '3',
                  equipment: '4',
                };
                const shortcut = shortcutMap[tab.id] || '';

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center space-x-1 sm:space-x-2 whitespace-nowrap touch-manipulation min-h-[44px] transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-label={`Switch to ${tab.label} tab${shortcut ? ` (${shortcut})` : ''}`}
                    title={`${tab.label}${shortcut ? ` (${shortcut})` : ''}`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'orders' && (
            <div className="space-y-4 sm:space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm sm:text-base text-gray-600">Loading kitchen orders...</span>
                </div>
              ) : (
                <>
              {/* Order Status Sections */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Pending Orders */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
                    <span>Pending ({getFilteredOrders('pending').length})</span>
                  </h3>
                  <div className="space-y-3">
                    {getFilteredOrders('pending').map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        onStatusUpdate={updateOrderStatus}
                        onComplete={markOrderComplete}
                        onViewDetails={openOrderModal}
                      />
                    ))}
                  </div>
                </div>

                {/* Preparing Orders */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                    <span>Preparing ({getFilteredOrders('preparing').length})</span>
                  </h3>
                  <div className="space-y-3">
                    {getFilteredOrders('preparing').map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        onStatusUpdate={updateOrderStatus}
                        onComplete={markOrderComplete}
                        onViewDetails={openOrderModal}
                      />
                    ))}
                  </div>
                </div>

                {/* Ready Orders */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                    <span>Ready ({getFilteredOrders('ready').length})</span>
                  </h3>
                  <div className="space-y-3">
                    {getFilteredOrders('ready').map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        onStatusUpdate={updateOrderStatus}
                        onComplete={markOrderComplete}
                        onViewDetails={openOrderModal}
                      />
                    ))}
                  </div>
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Current Stock Levels</h3>
                <div className="flex items-center justify-center sm:justify-end space-x-3 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-gray-600">Sufficient</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-gray-600">Low</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-gray-600">Out of Stock</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {ingredients.map((ingredient) => (
                  <div key={ingredient.name} className="bg-gray-50 rounded-lg p-3 sm:p-4 border hover:shadow-sm transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h4 className="font-medium text-gray-900 capitalize text-sm sm:text-base truncate">{ingredient.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getStockStatusColor(ingredient.status)}`}>
                        {ingredient.status === 'out' ? 'Out' : 
                         ingredient.status === 'low' ? 'Low' : 'OK'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 font-medium">
                        {ingredient.currentStock} {ingredient.unit}
                      </span>
                      <span className="text-gray-500">
                        Min: {ingredient.minStock} {ingredient.unit}
                      </span>
                    </div>
                    {ingredient.status === 'out' && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        ⚠️ Cannot fulfill orders requiring this ingredient
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'waste' && (
            <WasteReportsTab
              wasteReports={wasteReports}
              isLoading={isLoadingWasteReports}
              filters={wasteFilters}
              onFilterChange={handleWasteFiltersChange}
              onResetFilters={resetWasteFilters}
              onRefresh={fetchWasteReports}
              onCreateReport={() => setIsWasteFormOpen(true)}
              onResolveReport={(id) => handleWasteReportStatusUpdate(id, { status: 'resolved' })}
              updatingReportId={updatingWasteReportId}
              analytics={wasteAnalytics}
              isLoadingAnalytics={isLoadingWasteAnalytics}
              error={wasteError}
            />
          )}

          {activeTab === 'equipment' && (
            <div className="text-center py-8 sm:py-12">
              <Thermometer className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Equipment Status</h3>
              <p className="text-sm sm:text-base text-gray-500">Check kitchen equipment and maintenance status.</p>
            </div>
          )}
        </div>
      </div>

       {/* Order Detail Modal */}
       {showOrderModal && selectedOrder && (
         <OrderDetailModal 
           order={selectedOrder}
           onClose={() => setShowOrderModal(false)}
           onStatusUpdate={updateOrderStatus}
           onComplete={markOrderComplete}
           canPrepare={canPrepareItem}
           onViewHistory={fetchOrderHistory}
         />
       )}

      {/* Order History Modal */}
      {showHistoryModal && (
        <OrderHistoryModal
          orderHistory={orderHistory}
          isLoading={isLoadingHistory}
          onClose={() => {
            setShowHistoryModal(false);
            setOrderHistory([]);
          }}
        />
      )}

      {isWasteFormOpen && (
        <WasteReportFormModal
          ingredients={ingredients}
          orders={orders}
          onClose={() => setIsWasteFormOpen(false)}
          onSubmit={handleWasteReportSubmit}
          isSubmitting={isSubmittingWasteReport}
          reasons={WASTE_REASON_OPTIONS}
        />
      )}
    </div>
  );
};

// Order Card Component
interface OrderCardProps {
  order: KitchenOrder;
  onStatusUpdate: (orderId: string, status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled', notes?: string) => void;
  onComplete: (orderId: string) => void;
  onViewDetails: (order: KitchenOrder) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onStatusUpdate, 
  onComplete, 
  onViewDetails
}) => {
  return (
    <div className={`p-3 sm:p-4 border rounded-lg transition-all duration-200 hover:shadow-sm ${getPriorityColor(order.kitchen_metadata?.priority?.toLowerCase() || 'medium')}`}>
      {/* Header Section - Responsive Layout */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{order.order_number}</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getPriorityColor(order.kitchen_metadata?.priority?.toLowerCase() || 'medium')}`}>
            <span className="hidden sm:inline">{(order.kitchen_metadata?.priority || 'MEDIUM').toUpperCase()} PRIORITY</span>
            <span className="sm:hidden">{(order.kitchen_metadata?.priority || 'MEDIUM').charAt(0)}</span>
          </span>
        </div>
        <div className="text-left sm:text-right">
          <p className="font-semibold text-gray-900 text-sm sm:text-base">₱{order.total_amount}</p>
          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Customer Info Section */}
      <div className="mb-3">
        <p className="text-sm text-gray-600 truncate">{order.customer_name || 'Walk-in Customer'}</p>
        {order.table_number && (
          <p className="text-xs text-gray-500 mt-1">Table: {order.table_number}</p>
        )}
      </div>
      
      {/* Special Instructions */}
      {order.special_instructions && (
        <div className="mb-3 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded text-xs sm:text-sm text-yellow-700">
          📝 {order.special_instructions}
        </div>
      )}
      
      {/* Kitchen Metadata Summary - Responsive Layout */}
      {order.kitchen_metadata && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-blue-900">
                Est. Prep: {order.kitchen_metadata.estimated_total_prep_time}m
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-blue-900">
                {order.kitchen_metadata.total_items} item{order.kitchen_metadata.total_items !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          {/* Stock Status - Responsive */}
          {order.kitchen_metadata.has_out_of_stock && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
              ⚠️ <strong>Cannot prepare:</strong> Missing ingredients ({order.kitchen_metadata.low_stock_ingredients.length} out of stock)
            </div>
          )}
          {order.kitchen_metadata.has_low_stock && !order.kitchen_metadata.has_out_of_stock && (
            <div className="mt-2 p-2 bg-amber-100 border border-amber-300 rounded text-xs text-amber-800">
              ⚡ <strong>Low stock warning:</strong> Some ingredients running low
            </div>
          )}
          {!order.kitchen_metadata.has_low_stock && !order.kitchen_metadata.has_out_of_stock && (
            <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800">
              ✅ <strong>Ready to prepare:</strong> All ingredients available
            </div>
          )}
        </div>
      )}

      {/* Order Items - Responsive Layout */}
      <div className="space-y-2 sm:space-y-3 mb-4">
        {order.order_items && order.order_items.length > 0 ? (
          order.order_items.map((item, index) => {
            
            return (
              <div key={index} className="p-2 sm:p-3 bg-white bg-opacity-50 rounded-lg border">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  {/* Menu Item Image Placeholder */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      <ChefHat className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Menu Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.menu_items.name}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                          {item.menu_items.description}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-500">₱{item.total_price?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    
                    {/* Menu Item Info - Responsive */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 mb-2">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>{item.menu_items.prep_time}m prep</span>
                      </div>
                      {item.menu_items.calories > 0 && (
                        <div className="flex items-center space-x-1">
                          <ChefHat className="h-3 w-3 flex-shrink-0" />
                          <span>{item.menu_items.calories} cal</span>
                        </div>
                      )}
                      {item.menu_items.allergens && item.menu_items.allergens.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          <span className="hidden sm:inline">Allergens: {item.menu_items.allergens.join(', ')}</span>
                          <span className="sm:hidden">Allergens</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Order Item Details - Responsive */}
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <div>Qty: {item.quantity} × ₱{item.unit_price?.toFixed(2) || '0.00'}</div>
                      {item.customizations && (
                        <div className="text-blue-600 truncate">Custom: {item.customizations}</div>
                      )}
                      {item.special_instructions && (
                        <div className="text-amber-600 truncate">Instructions: {item.special_instructions}</div>
                      )}
                    </div>
                    
                    {/* Ingredients from menu_item_ingredients - Responsive */}
                    {item.menu_items.menu_item_ingredients && item.menu_items.menu_item_ingredients.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-1">Ingredients:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.menu_items.menu_item_ingredients.slice(0, 3).map((ingredient, ingIndex) => {
                            const isOutOfStock = ingredient.ingredients.current_stock <= 0;
                            const isLowStock = ingredient.ingredients.current_stock <= ingredient.ingredients.min_stock_threshold;
                            
                            return (
                              <span
                                key={ingIndex}
                                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                                  isOutOfStock 
                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                    : isLowStock
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                    : 'bg-green-100 text-green-700 border border-green-200'
                                }`}
                              >
                                <span className="hidden sm:inline">{ingredient.ingredients.name}</span>
                                <span className="sm:hidden">{ingredient.ingredients.name.substring(0, 8)}</span>
                                <span className="hidden sm:inline ml-1 text-gray-500">
                                  ({ingredient.quantity_required} {ingredient.unit})
                                </span>
                                {isOutOfStock && ' ⚠️'}
                                {isLowStock && !isOutOfStock && ' ⚡'}
                              </span>
                            );
                          })}
                          {item.menu_items.menu_item_ingredients.length > 3 && (
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              +{item.menu_items.menu_item_ingredients.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No items found for this order</p>
            <p className="text-xs text-gray-400 mt-1">
              {order.special_instructions ? 'Order has special instructions only' : 'This order appears to be empty'}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons - Responsive Layout */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <button 
          onClick={() => onViewDetails(order)}
          className="px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 flex items-center justify-center space-x-1 sm:space-x-2 touch-manipulation min-h-[44px] transition-colors duration-200"
          aria-label="View order details"
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>View Details</span>
        </button>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          {order.status === 'pending' && (
            <button 
              onClick={() => onStatusUpdate(order.id, 'preparing', 'Started preparing order')}
              className="px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 touch-manipulation min-h-[44px] transition-colors duration-200"
              aria-label="Start preparing order"
            >
              Start Preparing
            </button>
          )}
          
          {order.status === 'preparing' && (
            <button 
              onClick={() => onStatusUpdate(order.id, 'ready', 'Order ready for pickup')}
              className="px-3 py-2 text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-300 rounded hover:bg-emerald-50 touch-manipulation min-h-[44px] transition-colors duration-200"
              aria-label="Mark order as ready"
            >
              Mark Ready
            </button>
          )}
          
          {order.status === 'ready' && (
            <button 
              onClick={() => onComplete(order.id)}
              className="px-3 py-2 text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-300 rounded hover:bg-emerald-50 touch-manipulation min-h-[44px] transition-colors duration-200"
              aria-label="Mark order as complete"
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Order Detail Modal Component
interface OrderDetailModalProps {
  order: KitchenOrder;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled', notes?: string) => void;
  onComplete: (orderId: string) => void;
  canPrepare: (order: KitchenOrder) => boolean;
  onViewHistory: (orderId: string) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ 
  order, 
  onClose, 
  onStatusUpdate, 
  onComplete,
  canPrepare,
  onViewHistory
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Order Details</h2>
              <p className="text-sm text-gray-600 mt-1 truncate">#{order.order_number}</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
              aria-label="Close order details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Customer Information</h3>
              <p className="text-gray-600 text-sm sm:text-base">{order.customer_name || 'Walk-in Customer'}</p>
              {order.special_instructions && (
                <div className="mt-2 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    <strong>Special Instructions:</strong> {order.special_instructions}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Order Items</h3>
              {order.order_items && order.order_items.length > 0 ? (
                order.order_items.map((item, index) => {
                const canPrepareOrder = canPrepare(order);
                return (
                  <div key={index} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">{item.menu_items.name}</h4>
                        <div className="mt-1 space-y-1">
                          <p className="text-xs sm:text-sm text-gray-500">Quantity: {item.quantity}</p>
                          <p className="text-xs sm:text-sm text-gray-500">Prep Time: {item.menu_items.prep_time} minutes</p>
                          <p className="text-xs sm:text-sm text-gray-500">Calories: {item.menu_items.calories}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm sm:text-base font-medium text-gray-900">₱{item.total_price?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>

                      {item.special_instructions && (
                      <div className="mb-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs sm:text-sm text-blue-800">
                            <strong>Item Instructions:</strong> {item.special_instructions}
                        </p>
                      </div>
                    )}

                      {/* Ingredients Section - Responsive */}
                      {item.menu_items.menu_item_ingredients && item.menu_items.menu_item_ingredients.length > 0 && (
                        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded">
                          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Required Ingredients:</p>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {item.menu_items.menu_item_ingredients.map((ingredient, ingIndex) => {
                              const isOutOfStock = ingredient.ingredients.current_stock <= 0;
                              const isLowStock = ingredient.ingredients.current_stock <= ingredient.ingredients.min_stock_threshold;
                              
                              return (
                                <span
                                  key={ingIndex}
                                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${
                                    isOutOfStock 
                                      ? 'bg-red-100 text-red-700 border border-red-200' 
                                      : isLowStock
                                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                      : 'bg-green-100 text-green-700 border border-green-200'
                                  }`}
                                >
                                  <span className="hidden sm:inline">{ingredient.ingredients.name}</span>
                                  <span className="sm:hidden">{ingredient.ingredients.name.substring(0, 10)}</span>
                                  <span className="hidden sm:inline ml-1 text-gray-500">
                                    ({ingredient.quantity_required} {ingredient.unit})
                                  </span>
                                  {ingredient.ingredients.storage_location && (
                                    <span className="hidden sm:inline ml-1 text-gray-400">
                                      @{ingredient.ingredients.storage_location}
                                    </span>
                                  )}
                                  {isOutOfStock && ' ⚠️'}
                                  {isLowStock && !isOutOfStock && ' ⚡'}
                                  {!isLowStock && !isOutOfStock && ' ✅'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {!canPrepareOrder && (
                      <div className="mb-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs sm:text-sm text-red-700">
                          ⚠️ Cannot prepare this item due to missing ingredients
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                      <button
                          onClick={() => onStatusUpdate(order.id, 'preparing', `Started preparing ${item.menu_items.name}`)}
                          disabled={order.status === 'preparing' || !canPrepareOrder}
                        className={`px-3 py-2 text-xs sm:text-sm font-medium rounded border touch-manipulation min-h-[44px] transition-colors duration-200 ${
                            order.status === 'preparing' || !canPrepareOrder
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50'
                        }`}
                        aria-label="Start preparing this item"
                      >
                        Start Preparing
                      </button>
                      <button
                          onClick={() => onStatusUpdate(order.id, 'ready', `Order ready for pickup`)}
                          disabled={order.status === 'ready'}
                        className={`px-3 py-2 text-xs sm:text-sm font-medium rounded border touch-manipulation min-h-[44px] transition-colors duration-200 ${
                            order.status === 'ready'
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'text-emerald-600 hover:text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        }`}
                        aria-label="Mark order as ready"
                      >
                        Mark Ready
                      </button>
                    </div>
                  </div>
                );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No items found for this order</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t">
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">₱{order.total_amount}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                <button
                  onClick={() => onViewHistory(order.id)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 flex items-center justify-center space-x-1 sm:space-x-2 touch-manipulation min-h-[44px] transition-colors duration-200"
                  aria-label="View order history"
                >
                  <History className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>View History</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 touch-manipulation min-h-[44px] transition-colors duration-200"
                  aria-label="Close modal"
                >
                  Close
                </button>
                {order.status === 'ready' && (
                  <button
                    onClick={() => {
                      onComplete(order.id);
                      onClose();
                    }}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 touch-manipulation min-h-[44px] transition-colors duration-200"
                    aria-label="Mark order as complete"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Order History Modal Component
interface OrderHistoryModalProps {
  orderHistory: OrderStatusHistory[];
  isLoading: boolean;
  onClose: () => void;
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  orderHistory,
  isLoading,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Order Status History</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
              aria-label="Close history modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm sm:text-base text-gray-600">Loading history...</span>
            </div>
          ) : orderHistory.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {orderHistory.map((history) => (
                <div key={history.id} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${getStatusColor(history.status)}`}>
                      {history.status}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {new Date(history.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <p><strong>Updated by:</strong> {history.updated_by_name || history.updated_by}</p>
                    {history.notes && (
                      <p className="mt-1"><strong>Notes:</strong> {history.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base">No status history available</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t mt-4 sm:mt-6">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 touch-manipulation min-h-[44px] transition-colors duration-200"
              aria-label="Close modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface WasteReportsTabProps {
  wasteReports: WasteReport[];
  isLoading: boolean;
  filters: {
    status: string;
    reason: string;
    startDate: string;
    endDate: string;
  };
  onFilterChange: (updates: Partial<WasteReportsTabProps['filters']>) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onCreateReport: () => void;
  onResolveReport: (id: string) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  updatingReportId: string | null;
  analytics: WasteAnalytics | null;
  isLoadingAnalytics: boolean;
  error?: string | null;
}

const WasteReportsTab: React.FC<WasteReportsTabProps> = ({
  wasteReports,
  isLoading,
  filters,
  onFilterChange,
  onResetFilters,
  onRefresh,
  onCreateReport,
  onResolveReport,
  updatingReportId,
  analytics,
  isLoadingAnalytics,
  error
}) => {
  const hasActiveFilters = useMemo(
    () =>
      filters.status !== 'all' ||
      filters.reason !== 'all' ||
      Boolean(filters.startDate) ||
      Boolean(filters.endDate),
    [filters]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Waste Reports</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage kitchen waste incidents to reduce losses over time.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 touch-manipulation min-h-[40px]"
            aria-label="Refresh waste reports"
          >
            <Clock className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={onCreateReport}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 touch-manipulation min-h-[40px]"
            aria-label="Create waste report"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Waste Report</span>
          </button>
        </div>
      </div>

      {filters.startDate && filters.endDate && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span>Analytics ({filters.startDate} → {filters.endDate})</span>
            </div>
            {isLoadingAnalytics && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" aria-label="Loading analytics" />
            )}
          </div>

          {analytics ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Total Reports</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">{analytics.totalReports}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Total Quantity</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">{analytics.totalQuantity}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Cost Impact</p>
                <p className="text-xl font-semibold text-rose-600 mt-1">₱{analytics.totalCostImpact.toFixed(2)}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Top Reason</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {analytics.byReason.length > 0 ? analytics.byReason[0].reason.replace('_', ' ') : '—'}
                </p>
                {analytics.byReason.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.byReason[0].count} report(s) • ₱{analytics.byReason[0].costImpact.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {isLoadingAnalytics ? 'Loading analytics…' : 'No analytics available for the selected date range.'}
            </p>
          )}

          {analytics && analytics.byReason.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-xs sm:text-sm text-gray-600">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 pr-4 font-semibold text-gray-700">Reason</th>
                    <th className="py-2 pr-4 font-semibold text-gray-700">Reports</th>
                    <th className="py-2 pr-4 font-semibold text-gray-700">Quantity</th>
                    <th className="py-2 pr-4 font-semibold text-gray-700">Cost Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byReason.map((reason) => (
                    <tr key={reason.reason} className="border-b border-gray-100 last:border-b-0">
                      <td className="py-2 pr-4 capitalize">{reason.reason.replace('_', ' ')}</td>
                      <td className="py-2 pr-4">{reason.count}</td>
                      <td className="py-2 pr-4">{reason.quantity}</td>
                      <td className="py-2 pr-4">₱{reason.costImpact.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-3">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label htmlFor="waste-reason" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <select
              id="waste-reason"
              value={filters.reason}
              onChange={(event) => onFilterChange({ reason: event.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All reasons</option>
              {WASTE_REASON_OPTIONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="waste-status" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="waste-status"
              value={filters.status}
              onChange={(event) => onFilterChange({ status: event.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label htmlFor="waste-start-date" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              From date
            </label>
            <input
              id="waste-start-date"
              type="date"
              value={filters.startDate}
              onChange={(event) => onFilterChange({ startDate: event.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="waste-end-date" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              To date
            </label>
            <input
              id="waste-end-date"
              type="date"
              value={filters.endDate}
              onChange={(event) => onFilterChange({ endDate: event.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-3">
            <button
              onClick={onResetFilters}
              className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700"
              aria-label="Reset waste report filters"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Loading waste reports...</span>
          </div>
        ) : wasteReports.length > 0 ? (
          wasteReports.map((report) => {
            const reasonLabel =
              WASTE_REASON_OPTIONS.find((option) => option.value === report.reason)?.label ||
              report.reason.replace('_', ' ');
            return (
              <div
                key={report.id}
                className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {report.ingredient?.name || 'Unknown ingredient'}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Reported on {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getWasteStatusColor(report.status)}`}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Quantity</p>
                  <p className="font-medium">
                    {report.quantity} {report.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Reason</p>
                  <p className="font-medium">{reasonLabel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Cost impact</p>
                  <p className="font-medium text-rose-600">₱{report.cost_impact?.toFixed(2) ?? '0.00'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Reported by</p>
                  <p className="font-medium">
                    {report.reported_by_user
                      ? `${report.reported_by_user.first_name ?? ''} ${report.reported_by_user.last_name ?? ''}`.trim() ||
                        report.reported_by_user.username
                      : 'Unknown'}
                  </p>
                </div>
              </div>
              {report.notes && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  <p className="font-medium">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap">{report.notes}</p>
                </div>
              )}
              {report.photo_url && (
                <div className="mt-3 text-sm">
                  <a
                    href={report.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View attached photo
                  </a>
                </div>
              )}
              {report.order?.order_number && (
                <div className="mt-3 text-xs text-gray-500">
                  Linked order: <span className="font-medium text-gray-700">{report.order.order_number}</span>
                </div>
              )}
              <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
                {report.status !== 'resolved' && (
                  <button
                    onClick={async () => {
                      await onResolveReport(report.id);
                    }}
                    disabled={updatingReportId === report.id}
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 touch-manipulation min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>{updatingReportId === report.id ? 'Resolving…' : 'Mark Resolved'}</span>
                  </button>
                )}
              </div>
            </div>
            );
          })
        ) : (
          <div className="text-center py-10 bg-white border border-dashed border-gray-300 rounded-xl">
            <Trash2 className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No waste reports recorded for the current filters.</p>
            <p className="text-xs text-gray-400 mt-1">Create a new report whenever spoilage or spillage occurs.</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface WasteReportFormModalProps {
  ingredients: Ingredient[];
  orders: KitchenOrder[];
  onClose: () => void;
  onSubmit: (payload: WasteReportPayload) => Promise<{ success: boolean; message?: string }>;
  isSubmitting: boolean;
  reasons: { value: string; label: string }[];
}

const WasteReportFormModal: React.FC<WasteReportFormModalProps> = ({
  ingredients,
  orders,
  onClose,
  onSubmit,
  isSubmitting,
  reasons
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    ingredientId: '',
    quantity: '',
    unit: '',
    reason: reasons.length > 0 ? reasons[0].value : 'spoilage',
    orderId: '',
    notes: '',
    photoUrl: ''
  });

  const ingredientOptions = useMemo(
    () =>
      ingredients.map((ingredient) => ({
        value: ingredient.id || ingredient.name,
        label: ingredient.name.toUpperCase(),
        unit: ingredient.unit,
        currentStock: ingredient.currentStock,
      })),
    [ingredients]
  );

  const selectedIngredient = useMemo(
    () => ingredients.find((ingredient) => (ingredient.id || ingredient.name) === formState.ingredientId) ?? null,
    [ingredients, formState.ingredientId]
  );

  useEffect(() => {
    if (selectedIngredient && selectedIngredient.unit && !formState.unit) {
      setFormState((prev) => ({
        ...prev,
        unit: selectedIngredient.unit || prev.unit,
      }));
    }
  }, [selectedIngredient, formState.unit]);

  const handleInputChange = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFormError(null);
  };

  const handleIngredientChange = (value: string) => {
    const ingredient = ingredientOptions.find((option) => option.value === value);
    setFormState((prev) => ({
      ...prev,
      ingredientId: value,
      unit: ingredient?.unit || prev.unit || '',
    }));
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!formState.ingredientId) {
      setFormError('Please select an ingredient to report waste for.');
      return;
    }

    const quantityValue = Number(formState.quantity);

    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      setFormError('Quantity must be a positive number.');
      return;
    }

    const unitValue = formState.unit || selectedIngredient?.unit || '';

    if (!unitValue) {
      setFormError('Unit is required. Please confirm the ingredient details.');
      return;
    }

    const payload: WasteReportPayload = {
      ingredientId: formState.ingredientId,
      quantity: quantityValue,
      unit: unitValue,
      reason: formState.reason,
      orderId: formState.orderId || undefined,
      notes: formState.notes || undefined,
      photoUrl: formState.photoUrl || undefined,
    };

    const result = await onSubmit(payload);
    if (!result.success) {
      setFormError(result.message || 'Failed to submit waste report. Please try again.');
      return;
    }

    setFormState({
      ingredientId: '',
      quantity: '',
      unit: '',
      reason: reasons.length > 0 ? reasons[0].value : 'spoilage',
      orderId: '',
      notes: '',
      photoUrl: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">New Waste Report</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Log spoilage, spillage, or prep errors to keep costs under control.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close waste report form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <label htmlFor="waste-ingredient" className="block text-sm font-medium text-gray-700 mb-1.5">
              Ingredient *
            </label>
            <select
              id="waste-ingredient"
              value={formState.ingredientId}
              onChange={(event) => handleIngredientChange(event.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select ingredient</option>
              {ingredientOptions.map((ingredient) => (
                <option key={ingredient.value} value={ingredient.value}>
                  {ingredient.label} {ingredient.currentStock !== undefined ? `(Stock: ${ingredient.currentStock})` : ''}
                </option>
              ))}
            </select>
            {selectedIngredient && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-2">
                Current stock: {selectedIngredient.currentStock} {selectedIngredient.unit} | Minimum:{' '}
                {selectedIngredient.minStock} {selectedIngredient.unit}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="waste-quantity" className="block text-sm font-medium text-gray-700 mb-1.5">
                Quantity *
              </label>
              <input
                id="waste-quantity"
                type="number"
                min="0"
                step="0.01"
                value={formState.quantity}
                onChange={(event) => handleInputChange('quantity', event.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity lost"
                required
              />
            </div>
            <div>
              <label htmlFor="waste-unit" className="block text-sm font-medium text-gray-700 mb-1.5">
                Unit *
              </label>
              <input
                id="waste-unit"
                type="text"
                value={formState.unit}
                onChange={(event) => handleInputChange('unit', event.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. kg, pcs"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="waste-reason-select" className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason *
            </label>
            <select
              id="waste-reason-select"
              value={formState.reason}
              onChange={(event) => handleInputChange('reason', event.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {reasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="waste-order" className="block text-sm font-medium text-gray-700 mb-1.5">
              Linked Order (optional)
            </label>
            <select
              id="waste-order"
              value={formState.orderId}
              onChange={(event) => handleInputChange('orderId', event.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No linked order</option>
              {orders.slice(0, 50).map((order) => (
                <option key={order.id} value={order.id}>
                  {order.order_number} — {order.customer_name || 'Walk-in'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="waste-notes" className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              id="waste-notes"
              value={formState.notes}
              onChange={(event) => handleInputChange('notes', event.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add context about what happened"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="waste-photo" className="block text-sm font-medium text-gray-700 mb-1.5">
              Photo URL (optional)
            </label>
            <input
              id="waste-photo"
              type="url"
              value={formState.photoUrl}
              onChange={(event) => handleInputChange('photoUrl', event.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 touch-manipulation min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Waste Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KitchenDashboard;