import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Eye,
  CreditCard,
  Package,
  XCircle
} from 'lucide-react';
import NewOrderModal from './NewOrderModal';
import OrderDetailsModal from './OrderDetailsModal';
import PaymentModal from './PaymentModal';
import PayMongoPaymentModal from './PayMongoPaymentModal';
import PayMongoTestComponent from './PayMongoTestComponent';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { useOrderItems } from '../../hooks/useOrderItems';
import { usePaymentManagement } from '../../hooks/usePaymentManagement';
import { useInventoryStock } from '../../hooks/useInventoryStock';
import { usePayMongoPayment } from '../../hooks/usePayMongoPayment';
import { Order as ApiOrder, OrderIngredientValidationResponse } from '../../types/orders';

const CashierDashboard: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showPayMongoTest, setShowPayMongoTest] = useState(false);

  // Use custom hooks for state management
  const {
    setOrders,
    isLoading,
    error,
    orderStats,
    fetchOrders,
    searchOrders,
    handleOrderCreated,
    filteredOrders
  } = useOrderManagement();

  const {
    orderItems,
    setOrderItems,
    isLoadingItems,
    isUpdatingItem,
    isDeletingItem,
    editingItem,
    setEditingItem,
    fetchOrderItems,
    handleUpdateOrderItem,
    handleDeleteOrderItem
  } = useOrderItems();

  const {
    showPaymentModal,
    isUpdatingPayment,
    paymentForm,
    handleUpdatePayment,
    handleOpenPaymentModal,
    handleClosePaymentModal,
  } = usePaymentManagement();

  // Use inventory stock checking for alerts
  const { inventoryStats } = useInventoryStock();

  // Use PayMongo payment management
  const {
    paymentIntent,
    isCheckingStatus,
    isCancelling,
    error: payMongoError,
    showPayMongoModal,
    cancelPayment,
    closePayMongoModal
  } = usePayMongoPayment();

  // Optimized callbacks
  const handleFetchOrders = useCallback(() => {
    fetchOrders(filterStatus);
  }, [fetchOrders, filterStatus]);

  // Handle view order details
  const handleViewOrderDetails = useCallback(async (order: ApiOrder) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    // Always fetch fresh order items from database
    await fetchOrderItems(order.id);
  }, [fetchOrderItems]);

  // Enhanced update order item with order list update
  const handleUpdateOrderItemEnhanced = useCallback(async (itemId: string, updateData: any) => {
    const result = await handleUpdateOrderItem(itemId, updateData);
    if (result && selectedOrder) {
      // Update the order in the orders list
          setOrders(prev => prev.map(order => 
            order.id === selectedOrder.id 
              ? { ...order, items: orderItems.map(item => 
              item.id === itemId ? { ...item, ...result } : item
                )}
              : order
          ));
        }
  }, [handleUpdateOrderItem, selectedOrder, orderItems, setOrders]);

  // Enhanced delete order item with order list update
  const handleDeleteOrderItemEnhanced = useCallback(async (itemId: string) => {
    const success = await handleDeleteOrderItem(itemId);
    if (success && selectedOrder) {
        // Update the order in the orders list
          setOrders(prev => prev.map(order => 
            order.id === selectedOrder.id 
              ? { ...order, items: orderItems.filter(item => item.id !== itemId) }
              : order
          ));
        }
  }, [handleDeleteOrderItem, selectedOrder, orderItems, setOrders]);

  // Enhanced payment update with order list update
  const handleUpdatePaymentEnhanced = useCallback(async (orderId: string, paymentData: any) => {
    const result = await handleUpdatePayment(orderId, paymentData);
    if (result) {
        // Update the order in the orders list
        setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...result } : order
        ));
        
        // Update selected order if it's the same
        if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, ...result });
      }
    }
  }, [handleUpdatePayment, selectedOrder, setOrders]);

  // Enhanced open payment modal
  const handleOpenPaymentModalEnhanced = useCallback((order: ApiOrder) => {
    setSelectedOrder(order);
    handleOpenPaymentModal(order);
  }, [handleOpenPaymentModal]);

  // Validate order ingredients using new API endpoint
  const validateOrderIngredients = useCallback(async (orderId: string): Promise<OrderIngredientValidationResponse | null> => {
    try {
      const { api } = await import('../../utils/api');
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



  // Handle PayMongo payment cancellation
  const handlePayMongoCancel = useCallback(async () => {
    if (paymentIntent) {
      await cancelPayment(paymentIntent.paymentIntentId);
    }
  }, [cancelPayment, paymentIntent]);

  // Handle search input change with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchOrders(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchOrders]);

  // Calculate order totals from order items (for display purposes)
  const calculateOrderTotal = useCallback((order: ApiOrder) => {
    // If order has items, calculate from items
    if ((order as any).order_items && (order as any).order_items.length > 0) {
      const subtotal = (order as any).order_items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
      const tax = subtotal * 0.12; // 12% VAT
      return subtotal + tax;
    }
    // Otherwise use the order's total_amount
    return order.total_amount || 0;
  }, []);

  // Filter orders (client-side filtering for status)
  const finalFilteredOrders = useMemo(() => {
    return filteredOrders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesStatus;
  });
  }, [filteredOrders, filterStatus]);

  // Load data on component mount
  useEffect(() => {
    handleFetchOrders();
  }, [handleFetchOrders]);

  const stats = useMemo(() => [
    { label: 'Total Orders', value: orderStats.totalOrders.toString(), icon: ShoppingCart, color: 'blue' },
    { label: 'Pending Orders', value: orderStats.pendingOrders.toString(), icon: Clock, color: 'amber' },
    { label: 'Ready Orders', value: orderStats.readyOrders.toString(), icon: CheckCircle, color: 'emerald' },
    { label: 'Total Revenue', value: `₱${orderStats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'green' }
  ], [orderStats]);

  const getStatusColor = useCallback((status: string) => {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-800';
    case 'preparing': return 'bg-blue-100 text-blue-800';
    case 'ready': return 'bg-emerald-100 text-emerald-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
  }, []);

  const getPaymentStatusColor = useCallback((status: string) => {
  return status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Cashier Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
                Welcome back, {user?.firstName}! Process orders efficiently.
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowNewOrderModal(true)}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 flex items-center space-x-1 sm:space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 touch-manipulation min-h-[44px]"
                aria-label="Create new order"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="text-sm sm:text-base font-medium">New Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert" aria-live="polite">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6" role="region" aria-label="Order statistics">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200 touch-manipulation" role="article" aria-label={`${stat.label}: ${stat.value}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 truncate">{stat.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-full bg-${stat.color}-100 flex-shrink-0`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${stat.color}-600`} aria-hidden="true" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inventory Alerts */}
      {(inventoryStats.outOfStockItems > 0 || inventoryStats.lowStockItems > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6" role="region" aria-label="Inventory alerts">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Inventory Alerts</h2>
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" aria-hidden="true" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inventoryStats.outOfStockItems > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 touch-manipulation">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-red-900 font-medium text-sm sm:text-base">Out of Stock Items</h3>
                    <p className="text-red-700 text-xs sm:text-sm">
                      {inventoryStats.outOfStockItems} ingredient(s) are completely out of stock
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {inventoryStats.lowStockItems > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 touch-manipulation">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-amber-900 font-medium text-sm sm:text-base">Low Stock Items</h3>
                    <p className="text-amber-700 text-xs sm:text-sm">
                      {inventoryStats.lowStockItems} ingredient(s) are running low
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs sm:text-sm">
              <strong>Note:</strong> Some menu items may be unavailable or limited due to ingredient shortages. 
              Check stock levels before creating new orders.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder="Search by order number or customer name..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base h-12 sm:h-14 touch-manipulation"
                aria-label="Search orders"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm sm:text-base h-12 sm:h-14 touch-manipulation min-w-[140px]"
              aria-label="Filter orders by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">All Orders</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Loading orders">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
            <span className="ml-2 text-gray-600">Loading orders...</span>
          </div>
        ) : finalFilteredOrders.length > 0 ? (
          <div className="divide-y divide-gray-200" role="list" aria-label="Order list">
            {finalFilteredOrders.map((order) => (
              <div key={order.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200 touch-manipulation" role="listitem">
                {/* Desktop/Laptop Layout (1024px+) */}
                <div className="hidden lg:block">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Order #{order.order_number}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {order.customer_name || 'Walk-in Customer'}
                            {order.customer_phone && ` • ${order.customer_phone}`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                        <span>Type: {order.order_type.replace('_', ' ').toUpperCase()}</span>
                        {order.table_number && <span>Table: {order.table_number}</span>}
                        <span>Total: ₱{calculateOrderTotal(order).toFixed(2)}</span>
                        {order.discount_applied && (
                          <span className="text-green-600 font-medium">
                            Discount: {order.discount_applied.code} (-₱{order.discount_amount?.toFixed(2) || '0.00'})
                          </span>
                        )}
                        {/* Ingredient Status Indicator */}
                        {(() => {
                          const orderItems = (order as any).order_items || order.items || [];
                          const hasLowStock = orderItems.some((item: any) => 
                            item.menu_item?.ingredients?.some((ing: any) => ing.stock_status === 'low_stock')
                          );
                          const hasOutOfStock = orderItems.some((item: any) => 
                            item.menu_item?.ingredients?.some((ing: any) => ing.stock_status === 'out_of_stock')
                          );
                          
                          if (hasOutOfStock) {
                            return <span className="text-red-600 font-medium">⚠️ Out of Stock Items</span>;
                          } else if (hasLowStock) {
                            return <span className="text-amber-600 font-medium">⚠️ Low Stock Items</span>;
                          }
                          return null;
                        })()}
                        <span>Created: {new Date(order.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewOrderDetails(order)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                        aria-label={`View details for order ${order.order_number}`}
                      >
                        <Eye className="h-3 w-3" aria-hidden="true" />
                        <span>View Details</span>
                      </button>
                      
                      {/* Validate Ingredients Button */}
                      <button 
                        onClick={async () => {
                          const validation = await validateOrderIngredients(order.id);
                          if (validation) {
                            const { overall_validation, ingredient_summary } = validation;
                            let message = `Order ${order.order_number} Ingredient Validation:\n\n`;
                            message += `Overall Status: ${overall_validation.all_items_available ? 'All Available' : 'Some Issues'}\n`;
                            message += `Total Items: ${overall_validation.total_items}\n`;
                            message += `Available Items: ${overall_validation.available_items}\n`;
                            message += `Unavailable Items: ${overall_validation.unavailable_items}\n\n`;
                            message += `Ingredient Summary:\n`;
                            message += `- Unavailable: ${ingredient_summary.total_unavailable_ingredients}\n`;
                            message += `- Low Stock: ${ingredient_summary.total_low_stock_ingredients}\n`;
                            message += `- Sufficient: ${ingredient_summary.total_sufficient_ingredients}\n`;
                            message += `- Total: ${ingredient_summary.total_ingredients}`;
                            alert(message);
                          } else {
                            alert('Failed to validate order ingredients. Please try again.');
                          }
                        }}
                        className="px-3 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 border border-purple-300 rounded hover:bg-purple-50 flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                        aria-label={`Validate ingredients for order ${order.order_number}`}
                      >
                        <Package className="h-3 w-3" aria-hidden="true" />
                        <span>Validate</span>
                      </button>
                      
                    </div>
                  </div>
                </div>

                {/* Tablet Layout (640px - 1023px) */}
                <div className="hidden md:block lg:hidden">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">
                          Order #{order.order_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.customer_name || 'Walk-in Customer'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Type:</span> {order.order_type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> ₱{calculateOrderTotal(order).toFixed(2)}
                      </div>
                      {order.table_number && (
                        <div>
                          <span className="font-medium">Table:</span> {order.table_number}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Created:</span> {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewOrderDetails(order)}
                        className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 min-h-[44px]"
                        aria-label={`View details for order ${order.order_number}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span>View Details</span>
                      </button>
                      
                    </div>
                  </div>
                </div>

                {/* Mobile Layout (< 640px) */}
                <div className="block md:hidden">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">
                          Order #{order.order_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.customer_name || 'Walk-in Customer'}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span>{order.order_type.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">₱{calculateOrderTotal(order).toFixed(2)}</span>
                      </div>
                      {order.table_number && (
                        <div className="flex justify-between">
                          <span>Table:</span>
                          <span>{order.table_number}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <button 
                        onClick={() => handleViewOrderDetails(order)}
                        className="w-full px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 min-h-[44px]"
                        aria-label={`View details for order ${order.order_number}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span>View Details</span>
                      </button>
                      
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-gray-400 mt-1">Create your first order to get started</p>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <NewOrderModal
          onClose={() => setShowNewOrderModal(false)}
          onOrderCreated={handleOrderCreated}
        />
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          orderItems={orderItems}
          isLoadingItems={isLoadingItems}
          editingItem={editingItem}
          isUpdatingItem={isUpdatingItem}
          isDeletingItem={isDeletingItem}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
            setOrderItems([]);
            setEditingItem(null);
          }}
          onEditItem={setEditingItem}
          onUpdateItem={handleUpdateOrderItemEnhanced}
          onDeleteItem={handleDeleteOrderItemEnhanced}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          paymentForm={paymentForm}
          isUpdatingPayment={isUpdatingPayment}
          onClose={handleClosePaymentModal}
          onUpdatePayment={handleUpdatePaymentEnhanced}
        />
      )}

      {/* PayMongo Payment Modal */}
      {showPayMongoModal && paymentIntent && (
        <PayMongoPaymentModal
          paymentIntent={paymentIntent}
          isCheckingStatus={isCheckingStatus}
          isCancelling={isCancelling}
          error={payMongoError}
          onCancel={handlePayMongoCancel}
          onClose={closePayMongoModal}
        />
      )}

      {/* PayMongo Test Modal */}
      {showPayMongoTest && (
        <PayMongoTestComponent
          onClose={() => setShowPayMongoTest(false)}
        />
      )}
    </div>
  );
});

CashierDashboard.displayName = 'CashierDashboard';

export default CashierDashboard;