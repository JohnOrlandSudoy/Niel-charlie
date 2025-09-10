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
import { Order as ApiOrder } from '../../types/orders';

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
    isApplyingDiscount,
    paymentForm,
    setPaymentForm,
    handleUpdatePayment,
    handleOpenPaymentModal,
    handleClosePaymentModal,
    applyDiscountToOrder
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
    createPaymentIntent,
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

  // Enhanced apply discount with order list update
  const handleApplyDiscountEnhanced = useCallback(async (orderId: string, discountCode: string) => {
    const result = await applyDiscountToOrder(orderId, discountCode);
    if (result) {
      // Update the order in the orders list with the new discount information
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              total_amount: order.total_amount - result.discount_amount,
              discount_applied: result.discount,
              discount_amount: result.discount_amount
            } 
          : order
      ));
      
      // Update selected order if it's the same
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          total_amount: prev.total_amount - result.discount_amount,
          discount_applied: result.discount,
          discount_amount: result.discount_amount
        } : null);
      }
      
      return result;
    }
    return null;
  }, [applyDiscountToOrder, selectedOrder, setOrders]);

  // Handle PayMongo payment
  const handlePayMongoPayment = useCallback(async (order: ApiOrder) => {
    await createPaymentIntent(order);
  }, [createPaymentIntent]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cashier Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.email}! Process orders and manage transactions efficiently.
          </p>
        </div>
        <div className="flex items-center space-x-3">
        <button
          onClick={() => setShowNewOrderModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Create new order"
        >
            <Plus className="h-5 w-5" aria-hidden="true" />
          <span>New Order</span>
        </button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="region" aria-label="Order statistics">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" role="article" aria-label={`${stat.label}: ${stat.value}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} aria-hidden="true" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inventory Alerts */}
      {(inventoryStats.outOfStockItems > 0 || inventoryStats.lowStockItems > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" role="region" aria-label="Inventory alerts">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Inventory Alerts</h2>
            <Package className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inventoryStats.outOfStockItems > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-red-900 font-medium">Out of Stock Items</h3>
                    <p className="text-red-700 text-sm">
                      {inventoryStats.outOfStockItems} ingredient(s) are completely out of stock
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {inventoryStats.lowStockItems > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-amber-900 font-medium">Low Stock Items</h3>
                    <p className="text-amber-700 text-sm">
                      {inventoryStats.lowStockItems} ingredient(s) are running low
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> Some menu items may be unavailable or limited due to ingredient shortages. 
              Check stock levels before creating new orders.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by order number or customer name..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                aria-label="Search orders"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Loading orders">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
            <span className="ml-2 text-gray-600">Loading orders...</span>
          </div>
        ) : finalFilteredOrders.length > 0 ? (
          <div className="divide-y divide-gray-200" role="list" aria-label="Order list">
            {finalFilteredOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors duration-200" role="listitem">
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
                      <span>Total: ₱{order.total_amount.toFixed(2)}</span>
                      {order.discount_applied && (
                        <span className="text-green-600 font-medium">
                          Discount: {order.discount_applied.code} (-₱{order.discount_amount?.toFixed(2) || '0.00'})
                        </span>
                      )}
                      <span>Created: {new Date(order.created_at).toLocaleString()}</span>
            </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewOrderDetails(order)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`View details for order ${order.order_number}`}
                    >
                      <Eye className="h-3 w-3" aria-hidden="true" />
                      <span>View Details</span>
                    </button>
                    
                      <button 
                      onClick={() => handleOpenPaymentModalEnhanced(order)}
                      className={`px-3 py-1 text-xs font-medium border rounded flex items-center space-x-1 focus:outline-none focus:ring-2 transition-colors duration-200 ${
                        order.payment_status === 'paid' 
                          ? 'text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50 focus:ring-blue-500' 
                          : 'text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50 focus:ring-green-500'
                      }`}
                      aria-label={`${order.payment_status === 'paid' ? 'Update payment for' : 'Process payment for'} order ${order.order_number}`}
                    >
                      <CreditCard className="h-3 w-3" aria-hidden="true" />
                      <span>{order.payment_status === 'paid' ? 'Update Payment' : 'Payment'}</span>
                      </button>
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
          setPaymentForm={setPaymentForm}
          isUpdatingPayment={isUpdatingPayment}
          isApplyingDiscount={isApplyingDiscount}
          onClose={handleClosePaymentModal}
          onUpdatePayment={handleUpdatePaymentEnhanced}
          onApplyDiscount={handleApplyDiscountEnhanced}
          onPayMongoPayment={handlePayMongoPayment}
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