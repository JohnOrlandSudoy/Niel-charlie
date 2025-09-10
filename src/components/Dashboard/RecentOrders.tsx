import React from 'react';
import { Clock, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { Order as ApiOrder } from '../../types/orders';

const RecentOrders: React.FC = () => {
  const { recentOrders, isLoading, error } = useDashboardData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getOrderItems = (order: ApiOrder) => {
    if (!order.items || order.items.length === 0) return 'No items';
    
    const itemNames = order.items.slice(0, 2).map(item => 
      `${item.menu_item?.name || 'Unknown Item'} x${item.quantity}`
    );
    
    if (order.items.length > 2) {
      itemNames.push(`+${order.items.length - 2} more`);
    }
    
    return itemNames.join(', ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'preparing':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'preparing':
        return 'bg-amber-100 text-amber-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading recent orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-600">
            <p>Failed to load orders</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
          <Eye className="h-4 w-4" />
          <span>View All</span>
        </button>
      </div>

      <div className="space-y-4">
        {recentOrders.length > 0 ? recentOrders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-medium text-gray-900">{order.order_number}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {order.order_type.replace('_', ' ')}
                </span>
                {order.payment_status === 'paid' && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                    Paid
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-1">
                {order.customer_name || 'Walk-in Customer'}
              </p>
              <p className="text-xs text-gray-500">{getOrderItems(order)}</p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
              <div className="flex items-center space-x-1 mt-1">
                {getStatusIcon(order.status)}
                <span className="text-xs text-gray-500">{formatTimeAgo(order.created_at)}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent orders found</p>
            <p className="text-sm text-gray-400 mt-1">Orders will appear here as they come in</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentOrders;