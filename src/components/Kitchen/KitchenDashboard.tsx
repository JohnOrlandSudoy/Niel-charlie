import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Utensils, 
  Thermometer,
  Timer,
  Package,
  Bell,
  Eye,
  X,
  Plus,
  Minus,
  AlertCircle,
  Loader2,
  History
} from 'lucide-react';
import { api } from '../../utils/api';
import { 
  KitchenOrder, 
  KitchenOrderItem, 
  OrderStatusUpdate, 
  OrderStatusHistory, 
  KitchenStats, 
  ApiResponse 
} from '../../types/kitchen';

interface OrderItem {
  name: string;
  quantity: number;
  prepTime: number;
  status: 'pending' | 'preparing' | 'ready';
  specialInstructions?: string;
  ingredients: string[];
  customizations?: string[];
  addOns?: string[];
}

interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  total: number;
  orderTime: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  specialInstructions?: string;
  orderNumber?: string;
  orderType?: 'dine-in' | 'takeout';
  tableNumber?: number | null;
}

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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'preparing':
      return <ChefHat className="h-4 w-4 text-blue-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
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

  // Fetch kitchen orders from API
  const fetchKitchenOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.orders.getKitchenOrders();
      const result: ApiResponse<KitchenOrder[]> = await response.json();
      
      if (result.success && result.data) {
        console.log('Kitchen orders fetched:', result.data);
        console.log('First order structure:', result.data[0]);
        setOrders(result.data);
        calculateKitchenStats(result.data);
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
  };

  // Calculate kitchen statistics
  const calculateKitchenStats = (ordersData: KitchenOrder[]) => {
    const stats: KitchenStats = {
      totalOrders: ordersData?.length || 0,
      pendingOrders: ordersData?.filter(order => order.status === 'pending').length || 0,
      preparingOrders: ordersData?.filter(order => order.status === 'preparing').length || 0,
      readyOrders: ordersData?.filter(order => order.status === 'ready').length || 0,
      completedOrders: ordersData?.filter(order => order.status === 'completed').length || 0,
      averagePrepTime: 0, // This would need to be calculated from actual prep times
      totalRevenue: ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    };
    setKitchenStats(stats);
  };

  // Stats cards using real data
  const stats = [
    { label: 'Orders in Queue', value: kitchenStats.pendingOrders.toString(), icon: Clock, color: 'amber' },
    { label: 'Currently Preparing', value: kitchenStats.preparingOrders.toString(), icon: ChefHat, color: 'blue' },
    { label: 'Ready for Pickup', value: kitchenStats.readyOrders.toString(), icon: CheckCircle, color: 'emerald' },
    { label: 'Completed Today', value: kitchenStats.completedOrders.toString(), icon: Timer, color: 'purple' }
  ];

  // Fetch real inventory data for stock awareness
  const fetchInventoryData = async () => {
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
  };

  // Remove mock orders - using API data instead
  const mockOrders: Order[] = [
    { 
      id: 'ORD-12354', 
      customer: 'Maria Santos', 
      items: [
        { 
          name: 'Chicken Pastil', 
          quantity: 2, 
          prepTime: 20, 
          status: 'preparing',
          specialInstructions: 'Extra spicy, no onions',
          ingredients: ['chicken', 'rice', 'pepper', 'soy sauce', 'garlic'],
          customizations: ['Extra Spicy', 'No Onions'],
          addOns: ['Extra Chicken']
        },
        { 
          name: 'Iced Tea', 
          quantity: 1, 
          prepTime: 5, 
          status: 'ready',
          ingredients: ['tea leaves', 'sugar', 'ice'],
          customizations: ['Less Sweet'],
          addOns: []
        }
      ], 
      total: 489.5, 
      orderTime: '2 min ago',
      priority: 'high',
      status: 'preparing',
      specialInstructions: 'Customer allergic to onions - URGENT',
      orderNumber: 'ORD-2024-001',
      orderType: 'takeout',
      tableNumber: null
    },
    { 
      id: 'ORD-12355', 
      customer: 'Juan Dela Cruz', 
      items: [
        { 
          name: 'Pork Adobo', 
          quantity: 1, 
          prepTime: 35, 
          status: 'preparing',
          ingredients: ['pork', 'soy sauce', 'vinegar', 'garlic', 'pepper']
        },
        { 
          name: 'Rice', 
          quantity: 2, 
          prepTime: 10, 
          status: 'ready',
          ingredients: ['rice', 'water']
        }
      ], 
      total: 320, 
      orderTime: '5 min ago',
      priority: 'medium',
      status: 'preparing'
    },
    { 
      id: 'ORD-12356', 
      customer: 'Ana Reyes', 
      items: [
        { 
          name: 'Beef Steak', 
          quantity: 1, 
          prepTime: 25, 
          status: 'pending',
          ingredients: ['beef', 'garlic', 'soy sauce', 'pepper']
        },
        { 
          name: 'Garlic Rice', 
          quantity: 1, 
          prepTime: 10, 
          status: 'pending',
          ingredients: ['rice', 'garlic', 'oil']
        }
      ], 
      total: 345, 
      orderTime: '8 min ago',
      priority: 'low',
      status: 'pending'
    }
  ];

  useEffect(() => {
    fetchKitchenOrders();
    fetchInventoryData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchKitchenOrders();
      fetchInventoryData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

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

  const canPrepareItem = (item: KitchenOrderItem): boolean => {
    // Check if we have ingredient requirements for this menu item
    // For now, we'll do a basic check based on common ingredients
    // This would be enhanced when the API includes ingredient requirements
    
    if (!item.menu_item?.name) return false;
    
    const itemName = item.menu_item.name.toLowerCase();
    
    // Basic ingredient mapping for common dishes
    const ingredientMap: { [key: string]: string[] } = {
      'chicken pastil': ['chicken', 'rice', 'pepper', 'soy sauce', 'garlic'],
      'pork adobo': ['pork', 'rice', 'garlic', 'soy sauce', 'vinegar'],
      'beef tapa': ['beef', 'rice', 'garlic', 'soy sauce', 'vinegar'],
      'iced tea': ['tea leaves', 'sugar', 'ice'],
      'calamansi juice': ['calamansi', 'sugar', 'water', 'ice']
    };
    
    // Find matching ingredients for this item
    const requiredIngredients = ingredientMap[itemName] || [];
    
    // Check if all required ingredients are available
    return requiredIngredients.every(ingredientName => {
      const ingredient = ingredients.find(ing => ing.name === ingredientName);
      return ingredient && ingredient.status !== 'out';
    });
  };

  const getFilteredOrders = (status: string) => {
    return orders?.filter(order => order.status === status) || [];
  };

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
    <div className="space-y-6">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-green-600" />
                <span className="text-green-800">{notification}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Stock Alert Banner */}
      {showStockAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Critical Stock Alert</h3>
                <p className="text-sm text-red-600">
                  {ingredients.filter(ing => ing.status === 'out').length} ingredient(s) out of stock: {' '}
                  {ingredients.filter(ing => ing.status === 'out').map(ing => ing.name).join(', ')}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Orders requiring these ingredients cannot be prepared
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowStockAlert(false)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName}! Manage food preparation and orders here.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              fetchKitchenOrders();
              fetchInventoryData();
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span>Refresh</span>
          </button>
        <div className="text-right">
          <p className="text-sm text-gray-500">Kitchen Status</p>
          <p className="text-sm font-medium text-emerald-600">All Systems Operational</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
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
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading kitchen orders...</span>
                </div>
              ) : (
                <>
              {/* Order Status Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Orders */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-amber-500" />
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
                        canPrepare={canPrepareItem}
                        ingredients={ingredients}
                      />
                    ))}
                  </div>
                </div>

                {/* Preparing Orders */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <ChefHat className="h-5 w-5 text-blue-500" />
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
                        canPrepare={canPrepareItem}
                        ingredients={ingredients}
                      />
                    ))}
                  </div>
                </div>

                {/* Ready Orders */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
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
                        canPrepare={canPrepareItem}
                        ingredients={ingredients}
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Current Stock Levels</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Sufficient</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Low</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Out of Stock</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ingredients.map((ingredient) => (
                  <div key={ingredient.name} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 capitalize">{ingredient.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(ingredient.status)}`}>
                        {ingredient.status === 'out' ? 'Out of Stock' : 
                         ingredient.status === 'low' ? 'Low Stock' : 'Sufficient'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
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
            <div className="text-center py-12">
              <Thermometer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Equipment Status</h3>
              <p className="text-gray-500">Check kitchen equipment and maintenance status.</p>
            </div>
          )}
        </div>
      </div>

       {/* Quick Actions */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
         <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <button className="p-4 border-2 border-dashed border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all duration-200 text-center">
             <ChefHat className="h-8 w-8 text-blue-600 mx-auto mb-2" />
             <p className="font-medium text-gray-900">Start Preparation</p>
             <p className="text-sm text-gray-500">Begin cooking order</p>
           </button>
           
           <button className="p-4 border-2 border-dashed border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-lg transition-all duration-200 text-center">
             <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
             <p className="font-medium text-gray-900">Mark Ready</p>
             <p className="text-sm text-gray-500">Order ready for pickup</p>
           </button>
           
           <button className="p-4 border-2 border-dashed border-amber-200 hover:border-amber-300 hover:bg-amber-50 rounded-lg transition-all duration-200 text-center">
             <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
             <p className="font-medium text-gray-900">Report Issue</p>
             <p className="text-sm text-gray-500">Equipment or ingredient problem</p>
           </button>

           <button className="p-4 border-2 border-dashed border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-lg transition-all duration-200 text-center">
             <Bell className="h-8 w-8 text-purple-600 mx-auto mb-2" />
             <p className="font-medium text-gray-900">Notify Cashier</p>
             <p className="text-sm text-gray-500">Order ready notification</p>
           </button>
         </div>
         
         {/* API Test Section */}
         <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
           <h4 className="text-sm font-medium text-gray-900 mb-3">🔧 API Test (Debug Mode)</h4>
           <div className="flex flex-wrap gap-2">
             <button
               onClick={() => {
                 if (orders.length > 0) {
                   const testOrder = orders[0];
                   console.log('🧪 Testing API with order:', testOrder);
                   updateOrderStatus(testOrder.id, 'preparing', 'Test API call from debug button');
                 } else {
                   console.log('❌ No orders available for testing');
                   setError('No orders available for testing');
                 }
               }}
               className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200"
             >
               Test Status Update
             </button>
             <button
               onClick={async () => {
                 try {
                   console.log('🔐 Testing authentication...');
                   const response = await api.orders.getKitchenOrders();
                   console.log('✅ Auth test successful:', response.status);
                 } catch (error) {
                   console.error('❌ Auth test failed:', error);
                 }
               }}
               className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 border border-green-300 rounded hover:bg-green-200"
             >
               Test Auth
             </button>
             <button
               onClick={async () => {
                 try {
                   const orderId = '2e2d79c8-9505-4808-837c-3f08a366d5fd';
                   console.log('🧪 Testing direct API call...');
                   
                   const token = localStorage.getItem('authToken');
                   console.log('🔑 Using token:', token);
                   
                   const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
                     method: 'PUT',
                     headers: {
                       'Content-Type': 'application/json',
                       'Authorization': `Bearer ${token}`
                     },
                     body: JSON.stringify({
                       status: 'ready',
                       notes: 'Direct API test'
                     })
                   });
                   
                   console.log('📡 Direct API Response status:', response.status);
                   const result = await response.text();
                   console.log('📋 Direct API Response body:', result);
                   
                 } catch (error) {
                   console.error('❌ Direct API test failed:', error);
                 }
               }}
               className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-100 border border-purple-300 rounded hover:bg-purple-200"
             >
               Test Direct API
             </button>
             <button
               onClick={() => {
                 console.log('🔍 Current orders:', orders);
                 console.log('🔍 Current auth token:', localStorage.getItem('authToken'));
                 console.log('🔍 Current user data:', localStorage.getItem('userData'));
                 console.log('🔍 API base URL:', 'http://localhost:3000/api');
                 
                 // Check if user is logged in as kitchen staff
                 const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                 console.log('🔍 User role:', userData.role);
                 console.log('🔍 User permissions:', userData.permissions);
               }}
               className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
             >
               Debug Info
             </button>
           </div>
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
          ingredients={ingredients}
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
  canPrepare: (item: KitchenOrderItem) => boolean;
  ingredients: Ingredient[];
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onStatusUpdate, 
  onComplete, 
  onViewDetails,
  canPrepare,
  ingredients
}) => {
  return (
    <div className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-sm ${getPriorityColor(order.priority)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="font-medium text-gray-900">{order.order_number}</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority || 'medium')}`}>
            {(order.priority || 'medium').toUpperCase()} PRIORITY
          </span>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">₱{order.total_amount}</p>
          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{order.customer_name || 'Walk-in Customer'}</p>
      
      {order.special_instructions && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          📝 {order.special_instructions}
        </div>
      )}
      
      <div className="space-y-2 mb-4">
        {order.items && order.items.length > 0 ? (
          order.items.map((item, index) => {
          const canPrepareItem = canPrepare(item);
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-white bg-opacity-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(item.status)}
                <div>
                    <p className="font-medium text-gray-900">{item.menu_item?.name || 'Unknown Item'}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    {item.special_instructions && (
                      <p className="text-xs text-blue-600">💡 {item.special_instructions}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                  <p className="text-xs text-gray-500 mt-1">Est: {item.menu_item?.prep_time || 0}m</p>
                {!canPrepareItem && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Missing ingredients</p>
                )}
              </div>
            </div>
          );
          })
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No items found for this order</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button 
          onClick={() => onViewDetails(order)}
          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 flex items-center space-x-1"
        >
          <Eye className="h-3 w-3" />
          <span>View Details</span>
        </button>
        
        <div className="flex space-x-2">
          {order.status === 'pending' && (
            <button 
              onClick={() => onStatusUpdate(order.id, 'preparing', 'Started preparing order')}
              className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
            >
              Start Preparing
            </button>
          )}
          
          {order.status === 'preparing' && (
            <button 
              onClick={() => onStatusUpdate(order.id, 'ready', 'Order ready for pickup')}
              className="px-3 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-300 rounded hover:bg-emerald-50"
            >
              Mark Ready
            </button>
          )}
          
          {order.status === 'ready' && (
            <button 
              onClick={() => onComplete(order.id)}
              className="px-3 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-300 rounded hover:bg-emerald-50"
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
  canPrepare: (item: KitchenOrderItem) => boolean;
  ingredients: Ingredient[];
  onViewHistory: (orderId: string) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ 
  order, 
  onClose, 
  onStatusUpdate, 
  onComplete,
  canPrepare,
  ingredients,
  onViewHistory
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Order Details - {order.id}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
              <p className="text-gray-600">{order.customer_name || 'Walk-in Customer'}</p>
              {order.special_instructions && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Special Instructions:</strong> {order.special_instructions}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Order Items</h3>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => {
                const canPrepareItem = canPrepare(item);
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                          <h4 className="font-medium text-gray-900">{item.menu_item?.name || 'Unknown Item'}</h4>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-500">Prep Time: {item.menu_item?.prep_time || 0} minutes</p>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                      {item.special_instructions && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                            <strong>Item Instructions:</strong> {item.special_instructions}
                        </p>
                      </div>
                    )}

                      {/* Ingredients section removed - would need API integration for ingredient requirements */}

                    {!canPrepareItem && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">
                          ⚠️ Cannot prepare this item due to missing ingredients
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                          onClick={() => onStatusUpdate(order.id, 'preparing', `Started preparing ${item.menu_item?.name}`)}
                          disabled={order.status === 'preparing' || !canPrepareItem}
                        className={`px-3 py-1 text-xs font-medium rounded border ${
                            order.status === 'preparing' || !canPrepareItem
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        Start Preparing
                      </button>
                      <button
                          onClick={() => onStatusUpdate(order.id, 'ready', `Order ready for pickup`)}
                          disabled={order.status === 'ready'}
                        className={`px-3 py-1 text-xs font-medium rounded border ${
                            order.status === 'ready'
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'text-emerald-600 hover:text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        }`}
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

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">₱{order.total_amount}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onViewHistory(order.id)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 flex items-center space-x-1"
                >
                  <History className="h-4 w-4" />
                  <span>View History</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                {order.status === 'ready' && (
                  <button
                    onClick={() => {
                      onComplete(order.id);
                      onClose();
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700"
                  >
                    Mark Order Complete
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Order Status History</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading history...</span>
            </div>
          ) : orderHistory.length > 0 ? (
            <div className="space-y-4">
              {orderHistory.map((history, index) => (
                <div key={history.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(history.status)}`}>
                      {history.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(history.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
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
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No status history available</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
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
