import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  History
} from 'lucide-react';
import { api } from '../../utils/api';
import { 
  KitchenOrder, 
  OrderStatusHistory, 
  KitchenStats, 
  ApiResponse 
} from '../../types/kitchen';



interface Ingredient {
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
        { name: 'chicken', currentStock: 15, minStock: 10, unit: 'kg', status: 'sufficient' },
        { name: 'pork', currentStock: 8, minStock: 10, unit: 'kg', status: 'low' },
        { name: 'beef', currentStock: 12, minStock: 10, unit: 'kg', status: 'sufficient' },
        { name: 'rice', currentStock: 25, minStock: 15, unit: 'kg', status: 'sufficient' },
        { name: 'soy sauce', currentStock: 3, minStock: 5, unit: 'L', status: 'low' },
        { name: 'pepper', currentStock: 0, minStock: 2, unit: 'kg', status: 'out' },
        { name: 'garlic', currentStock: 2, minStock: 3, unit: 'kg', status: 'low' },
        { name: 'vinegar', currentStock: 4, minStock: 3, unit: 'L', status: 'sufficient' },
        { name: 'oil', currentStock: 6, minStock: 5, unit: 'L', status: 'sufficient' },
        { name: 'tea leaves', currentStock: 1, minStock: 2, unit: 'kg', status: 'low' },
        { name: 'sugar', currentStock: 8, minStock: 5, unit: 'kg', status: 'sufficient' }
      ];
      setIngredients(mockIngredients);
      
      const criticalIngredients = mockIngredients.filter(ing => ing.status === 'out');
      if (criticalIngredients.length > 0) {
        setShowStockAlert(true);
      }
    }
  }, []);


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
          setActiveTab('equipment');
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [fetchKitchenOrders, fetchInventoryData]);


  // Add notification
  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

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
                <span>Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">1-3</kbd> for tabs</span>
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
                { id: 'equipment', label: 'Equipment Status', icon: Thermometer }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center space-x-1 sm:space-x-2 whitespace-nowrap touch-manipulation min-h-[44px] transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-label={`Switch to ${tab.label} tab (${tab.id === 'orders' ? '1' : tab.id === 'inventory' ? '2' : '3'})`}
                    title={`${tab.label} (${tab.id === 'orders' ? '1' : tab.id === 'inventory' ? '2' : '3'})`}
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

export default KitchenDashboard;