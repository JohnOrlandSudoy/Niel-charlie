import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Printer, AlertTriangle, Loader2, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';
import { Order as ApiOrder, OrderStats, PaginatedOrderResponse } from '../../types/orders';

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);
  
  // Delete functionality states
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [bulkDeleteResults, setBulkDeleteResults] = useState<any[]>([]);

  // Fetch orders from API
  const fetchOrders = async (page: number = currentPage, resetPage: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams: any = {
        page: resetPage ? 1 : page,
        limit: itemsPerPage
      };
      
      if (filterStatus !== 'all') {
        queryParams.status = filterStatus;
      }
      
      if (filterType !== 'all') {
        queryParams.order_type = filterType;
      }
      
      console.log('Fetching orders with params:', queryParams);
      
      const response = await api.orders.getAll(queryParams);
      const result: PaginatedOrderResponse = await response.json();
      
      if (result.success && result.data) {
        setOrders(result.data);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.total);
        console.log('Orders fetched:', result.data);
        console.log('Pagination info:', result.pagination);
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

  // Search orders
  const searchOrders = async (query: string) => {
    if (!query.trim()) {
      fetchOrders(1, true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.orders.search({
        q: query,
        page: 1,
        limit: itemsPerPage
      });
      
      const result: PaginatedOrderResponse = await response.json();
      
      if (result.success && result.data) {
        setOrders(result.data);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.total);
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

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'status') {
      setFilterStatus(value);
    } else if (filterType === 'type') {
      setFilterType(value);
    }
    setCurrentPage(1);
  };

  // Load data on component mount
  useEffect(() => {
    fetchOrders(1, true);
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchOrders(1, true);
  }, [filterStatus, filterType]);

  // Refetch when page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchOrders(currentPage, false);
    }
  }, [currentPage]);

  // Delete single order
  const handleDeleteOrder = async (orderId: string, force: boolean = false) => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      const response = await api.orders.delete(orderId, force);
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Remove order from local state
        setOrders(prev => prev.filter(order => order.id !== orderId));
        setTotalItems(prev => prev - 1);
        setShowDeleteModal(false);
        setDeleteOrderId(null);
        
        // Show success message
        console.log('✅ Order deleted successfully');
      } else {
        setDeleteError(result.error || 'Failed to delete order');
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      setDeleteError('Failed to delete order. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel order (soft delete)
  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      setIsCancelling(true);
      setDeleteError(null);
      
      const response = await api.orders.cancel(orderId, reason);
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update order status in local state
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' }
            : order
        ));
        setShowCancelModal(false);
        setCancelOrderId(null);
        setCancelReason('');
        
        // Show success message
        console.log('✅ Order cancelled successfully');
      } else {
        setDeleteError(result.error || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setDeleteError('Failed to cancel order. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Bulk delete orders
  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      const response = await api.orders.bulkDelete(selectedOrders);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setBulkDeleteResults(result.data || []);
        
        // Remove successfully deleted orders from local state
        const deletedIds = result.data
          ?.filter((item: any) => item.success)
          ?.map((item: any) => item.orderId) || [];
        
        setOrders(prev => prev.filter(order => !deletedIds.includes(order.id)));
        setTotalItems(prev => prev - deletedIds.length);
        setSelectedOrders([]);
        setShowDeleteModal(false);
        
        console.log('✅ Bulk delete completed');
      } else {
        setDeleteError(result.error || 'Failed to delete orders');
      }
    } catch (err) {
      console.error('Error bulk deleting orders:', err);
      setDeleteError('Failed to delete orders. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle order selection for bulk operations
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle select all orders
  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  };

  // Check if order can be deleted
  const canDeleteOrder = (order: ApiOrder) => {
    // Cannot delete paid orders
    if (order.payment_status === 'paid') return false;
    // Cannot delete completed orders without force
    if (order.status === 'completed') return false;
    return true;
  };

  // Check if order can be cancelled
  const canCancelOrder = (order: ApiOrder) => {
    // Cannot cancel completed or cancelled orders
    return !['completed', 'cancelled'].includes(order.status);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'preparing':
        return 'bg-amber-100 text-amber-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentBadge = (status: string) => {
    return status === 'paid' 
      ? 'bg-emerald-100 text-emerald-800' 
      : 'bg-red-100 text-red-800';
  };

  // Calculate statistics from current orders
  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = totalItems; // Use total from API pagination
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingPayments = orders.filter(o => o.payment_status === 'unpaid' && o.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-600 mt-1">View and manage all customer orders and transactions</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200">
          <Download className="h-4 w-4" />
          <span>Export Report</span>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₱{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{completedOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Pending Payments</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{pendingPayments}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders by ID or customer..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="dine_in">Dine-in</option>
              <option value="takeout">Takeout</option>
            </select>
          </div>
        </div>
        
        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={selectedOrders.length > 50}
                  className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 border border-red-300 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Selected</span>
                </button>
                <button
                  onClick={() => setSelectedOrders([])}
                  className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Selection</span>
                </button>
              </div>
            </div>
            {selectedOrders.length > 50 && (
              <p className="text-xs text-red-600 mt-2">
                Maximum 50 orders can be deleted at once
              </p>
            )}
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
          ) : orders.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleOrderSelect(order.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                        <div className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          <span className={`px-2 py-1 rounded-full ${
                            order.order_type === 'dine_in' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {order.order_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer_name || 'Walk-in Customer'}
                      </div>
                      {order.customer_phone && (
                        <div className="text-xs text-gray-500">{order.customer_phone}</div>
                      )}
                      {order.special_instructions && (
                        <div className="text-xs text-gray-500 mt-1">Note: {order.special_instructions}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, index) => (
                            <div key={index} className="mb-1">
                              {item.menu_item?.name || 'Unknown Item'} x{item.quantity}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400">No items</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">₱{order.total_amount.toFixed(2)}</div>
                      {order.payment_method && (
                        <div className="text-xs text-gray-500">{order.payment_method}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                      {order.status === 'completed' && (
                        <div className="text-xs text-gray-500 mt-1">
                          Completed: {new Date(order.updated_at).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 p-1 rounded" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 p-1 rounded" title="Print">
                          <Printer className="h-4 w-4" />
                        </button>
                        {canCancelOrder(order) && (
                          <button
                            onClick={() => {
                              setCancelOrderId(order.id);
                              setShowCancelModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-700 p-1 rounded" 
                            title="Cancel Order"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteOrder(order) && (
                          <button
                            onClick={() => {
                              setDeleteOrderId(order.id);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-700 p-1 rounded" 
                            title="Delete Order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {!canDeleteOrder(order) && order.payment_status === 'paid' && (
                          <span className="text-xs text-gray-400" title="Cannot delete paid orders">
                            Protected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No orders found</div>
              <div className="text-gray-400 mt-1">Try adjusting your search or filters</div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} orders
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedOrders.length > 1 ? 'Delete Orders' : 'Delete Order'}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedOrders.length > 1 
                    ? `Are you sure you want to delete ${selectedOrders.length} orders? This action cannot be undone.`
                    : 'Are you sure you want to delete this order? This action cannot be undone.'
                  }
                </p>
              </div>
            </div>
            
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{deleteError}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteOrderId(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedOrders.length > 1) {
                    handleBulkDelete();
                  } else if (deleteOrderId) {
                    handleDeleteOrder(deleteOrderId);
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Cancel Order</h3>
                <p className="text-sm text-gray-500">
                  Please provide a reason for cancelling this order.
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                required
              />
            </div>
            
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{deleteError}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelOrderId(null);
                  setCancelReason('');
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                disabled={isCancelling}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (cancelOrderId && cancelReason.trim()) {
                    handleCancelOrder(cancelOrderId, cancelReason.trim());
                  }
                }}
                disabled={isCancelling || !cancelReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isCancelling ? 'Cancelling...' : 'Cancel Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Results Modal */}
      {bulkDeleteResults.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Bulk Delete Results</h3>
                <p className="text-sm text-gray-500">
                  Results of the bulk delete operation
                </p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {bulkDeleteResults.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      Order {result.orderNumber || result.orderId}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'Deleted' : 'Failed'}
                    </span>
                  </div>
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setBulkDeleteResults([])}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;