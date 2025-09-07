import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  X,
  CreditCard,
  Percent,
  Save
} from 'lucide-react';
import NewOrderModal from './NewOrderModal';
import { api } from '../../utils/api';
import { Order as ApiOrder, OrderStats, PaginatedOrderResponse, OrderItem, UpdateOrderItemRequest } from '../../types/orders';

const CashierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
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

  // Order details and item management state
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Payment and discount management state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [availableDiscounts, setAvailableDiscounts] = useState<any[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_status: 'unpaid' as 'unpaid' | 'paid' | 'refunded',
    payment_method: 'cash' as 'cash' | 'gcash' | 'card'
  });

  // Fetch orders from API
  const fetchOrders = async () => {
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
  };

  // Calculate order statistics
  const calculateOrderStats = (ordersData: ApiOrder[]) => {
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
  };

  // Handle new order creation
  const handleOrderCreated = (newOrder: ApiOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    calculateOrderStats([newOrder, ...orders]);
    console.log('New order created:', newOrder);
  };

  // Fetch order items
  const fetchOrderItems = async (orderId: string) => {
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
  };

  // Handle view order details
  const handleViewOrderDetails = async (order: ApiOrder) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    await fetchOrderItems(order.id);
  };

  // Handle update order item
  const handleUpdateOrderItem = async (itemId: string, updateData: UpdateOrderItemRequest) => {
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
        
        // Update the order in the orders list if needed
        if (selectedOrder) {
          setOrders(prev => prev.map(order => 
            order.id === selectedOrder.id 
              ? { ...order, items: orderItems.map(item => 
                  item.id === itemId ? { ...item, ...result.data } : item
                )}
              : order
          ));
        }
        
        setEditingItem(null);
        console.log('Order item updated:', result.data);
      } else {
        setError(result.message || 'Failed to update order item');
      }
    } catch (err) {
      console.error('Error updating order item:', err);
      setError('Failed to update order item. Please try again.');
    } finally {
      setIsUpdatingItem(false);
    }
  };

  // Handle delete order item
  const handleDeleteOrderItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to remove this item from the order?')) {
      return;
    }

    try {
      setIsDeletingItem(true);
      setError(null);
      
      const response = await api.orders.deleteItem(itemId);
      const result = await response.json();
      
      if (result.success) {
        // Remove the item from local state
        setOrderItems(prev => prev.filter(item => item.id !== itemId));
        
        // Update the order in the orders list
        if (selectedOrder) {
          setOrders(prev => prev.map(order => 
            order.id === selectedOrder.id 
              ? { ...order, items: orderItems.filter(item => item.id !== itemId) }
              : order
          ));
        }
        
        console.log('Order item deleted successfully');
      } else {
        setError(result.message || 'Failed to delete order item');
      }
    } catch (err) {
      console.error('Error deleting order item:', err);
      setError('Failed to delete order item. Please try again.');
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Fetch available discounts
  const fetchAvailableDiscounts = async () => {
    try {
      setIsLoadingDiscounts(true);
      setError(null);
      
      const response = await api.orders.getAvailableDiscounts();
      const result = await response.json();
      
      if (result.success && result.data) {
        setAvailableDiscounts(result.data);
        console.log('Available discounts fetched:', result.data);
      } else {
        setError(result.message || 'Failed to fetch available discounts');
      }
    } catch (err) {
      console.error('Error fetching available discounts:', err);
      setError('Failed to fetch available discounts. Please try again.');
    } finally {
      setIsLoadingDiscounts(false);
    }
  };

  // Handle payment status update
  const handleUpdatePayment = async (orderId: string, paymentData: any) => {
    try {
      setIsUpdatingPayment(true);
      setError(null);
      
      const response = await api.orders.updatePayment(orderId, paymentData);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Update the order in the orders list
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, ...result.data } : order
        ));
        
        // Update selected order if it's the same
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, ...result.data });
        }
        
        setShowPaymentModal(false);
        console.log('Payment status updated:', result.data);
      } else {
        setError(result.message || 'Failed to update payment status');
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Failed to update payment status. Please try again.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  // Handle open payment modal
  const handleOpenPaymentModal = (order: ApiOrder) => {
    setSelectedOrder(order);
    setPaymentForm({
      payment_status: order.payment_status,
      payment_method: order.payment_method || 'cash'
    });
    setShowPaymentModal(true);
    fetchAvailableDiscounts();
  };

  // Search orders
  const searchOrders = async (query: string) => {
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
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchOrders(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  // Filter orders (client-side filtering for status)
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesStatus;
  });

  // Load data on component mount
  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const stats = [
    { label: 'Total Orders', value: orderStats.totalOrders.toString(), icon: ShoppingCart, color: 'blue' },
    { label: 'Pending Orders', value: orderStats.pendingOrders.toString(), icon: Clock, color: 'amber' },
    { label: 'Ready Orders', value: orderStats.readyOrders.toString(), icon: CheckCircle, color: 'emerald' },
    { label: 'Total Revenue', value: `₱${orderStats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'green' }
  ];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-800';
    case 'preparing': return 'bg-blue-100 text-blue-800';
    case 'ready': return 'bg-emerald-100 text-emerald-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentStatusColor = (status: string) => {
  return status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
};

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
        <button
          onClick={() => setShowNewOrderModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Order</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

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
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading orders...</span>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
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
                      <span>Created: {new Date(order.created_at).toLocaleString()}</span>
            </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewOrderDetails(order)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View Details</span>
                    </button>
                    
                    {order.payment_status === 'unpaid' && (
                      <button 
                        onClick={() => handleOpenPaymentModal(order)}
                        className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-700 border border-green-300 rounded hover:bg-green-50 flex items-center space-x-1"
                      >
                        <CreditCard className="h-3 w-3" />
                        <span>Payment</span>
                      </button>
                    )}
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
          onUpdateItem={handleUpdateOrderItem}
          onDeleteItem={handleDeleteOrderItem}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          availableDiscounts={availableDiscounts}
          isLoadingDiscounts={isLoadingDiscounts}
          isUpdatingPayment={isUpdatingPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrder(null);
            setPaymentForm({
              payment_status: 'unpaid',
              payment_method: 'cash'
            });
          }}
          onUpdatePayment={handleUpdatePayment}
        />
      )}
    </div>
  );
};

// Order Details Modal Component
interface OrderDetailsModalProps {
  order: ApiOrder;
  orderItems: OrderItem[];
  isLoadingItems: boolean;
  editingItem: OrderItem | null;
  isUpdatingItem: boolean;
  isDeletingItem: boolean;
  onClose: () => void;
  onEditItem: (item: OrderItem) => void;
  onUpdateItem: (itemId: string, data: UpdateOrderItemRequest) => void;
  onDeleteItem: (itemId: string) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
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

  const handleEditSubmit = (item: OrderItem) => {
    onUpdateItem(item.id, editForm);
    setEditForm({});
  };

  const handleEditChange = (field: keyof UpdateOrderItemRequest, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Order Details - #{order.order_number}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
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
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    order.status === 'preparing' ? 'bg-amber-100 text-amber-800' :
                    order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                      </span>
                    </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Payment Status:</span> 
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
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
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading items...</span>
              </div>
            ) : orderItems.length > 0 ? (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    {editingItem?.id === item.id ? (
                      // Edit Form
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{item.menu_item?.name}</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditSubmit(item)}
                              disabled={isUpdatingItem}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isUpdatingItem ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                onEditItem(null as any);
                                setEditForm({});
                              }}
                              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={editForm.quantity || item.quantity}
                              onChange={(e) => handleEditChange('quantity', parseInt(e.target.value) || 1)}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customizations</label>
                            <input
                              type="text"
                              value={editForm.customizations || item.customizations || ''}
                              onChange={(e) => handleEditChange('customizations', e.target.value)}
                              placeholder="e.g., Extra spicy"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                            <input
                              type="text"
                              value={editForm.special_instructions || item.special_instructions || ''}
                              onChange={(e) => handleEditChange('special_instructions', e.target.value)}
                              placeholder="Special instructions"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
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
                            onClick={() => {
                              onEditItem(item);
                              setEditForm({
                                quantity: item.quantity,
                                customizations: item.customizations || '',
                                special_instructions: item.special_instructions || ''
                              });
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                            title="Edit item"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            disabled={isDeletingItem}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Delete item"
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
              <div className="text-center py-8 text-gray-500">
                No items found for this order
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

// Payment Modal Component
interface PaymentModalProps {
  order: ApiOrder;
  paymentForm: {
    payment_status: 'unpaid' | 'paid' | 'refunded';
    payment_method: 'cash' | 'gcash' | 'card';
  };
  setPaymentForm: (form: any) => void;
  availableDiscounts: any[];
  isLoadingDiscounts: boolean;
  isUpdatingPayment: boolean;
  onClose: () => void;
  onUpdatePayment: (orderId: string, paymentData: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  paymentForm,
  setPaymentForm,
  availableDiscounts,
  isLoadingDiscounts,
  isUpdatingPayment,
  onClose,
  onUpdatePayment
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePayment(order.id, paymentForm);
  };

  const handleInputChange = (field: string, value: any) => {
    setPaymentForm((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Payment Management - Order #{order.order_number}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Customer:</span> {order.customer_name || 'Walk-in Customer'}
              </div>
              <div>
                <span className="font-medium">Order Type:</span> {order.order_type.replace('_', ' ').toUpperCase()}
              </div>
              <div>
                <span className="font-medium">Subtotal:</span> ₱{order.subtotal.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Tax:</span> ₱{order.tax_amount.toFixed(2)}
              </div>
              <div className="col-span-2">
                <span className="font-medium text-lg">Total Amount:</span> 
                <span className="text-lg font-bold text-green-600 ml-2">₱{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status *
                  </label>
                  <select
                    value={paymentForm.payment_status}
                    onChange={(e) => handleInputChange('payment_status', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => handleInputChange('payment_method', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="card">Card</option>
                  </select>
                </div>
        </div>
      </div>

            {/* Available Discounts */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Discounts</h3>
              
              {isLoadingDiscounts ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading discounts...</span>
                </div>
              ) : availableDiscounts.length > 0 ? (
                <div className="space-y-3">
                  {availableDiscounts.map((discount, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">{discount.name}</h4>
                          <p className="text-sm text-blue-700">{discount.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-900">
                            {discount.type === 'percentage' 
                              ? `${discount.value}%` 
                              : `₱${discount.value}`
                            }
                          </span>
                          <p className="text-xs text-blue-600">Discount</p>
                        </div>
                      </div>
        </div>
                  ))}
        </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Percent className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>No available discounts</p>
                  <p className="text-sm text-gray-400 mt-1">Contact admin to add discounts</p>
          </div>
        )}
      </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isUpdatingPayment}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
              >
                {isUpdatingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Update Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;