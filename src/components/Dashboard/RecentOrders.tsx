import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

const RecentOrders: React.FC = () => {
  const orders = [
    {
      id: 'ORD-12345',
      customer: 'Maria Santos',
      items: 'Chicken Pastil x2, Iced Tea x1',
      total: 380,
      status: 'completed',
      time: '2 min ago',
      type: 'dine-in'
    },
    {
      id: 'ORD-12346',
      customer: 'Juan Dela Cruz',
      items: 'Pork Adobo x1, Rice x2',
      total: 250,
      status: 'preparing',
      time: '5 min ago',
      type: 'takeout'
    },
    {
      id: 'ORD-12347',
      customer: 'Ana Reyes',
      items: 'Chicken Pastil x1, Soft Drink x1',
      total: 195,
      status: 'pending',
      time: '8 min ago',
      type: 'dine-in'
    },
    {
      id: 'ORD-12348',
      customer: 'Pedro Garcia',
      items: 'Beef Steak x1, Garlic Rice x1',
      total: 320,
      status: 'completed',
      time: '12 min ago',
      type: 'takeout'
    },
    {
      id: 'ORD-12349',
      customer: 'Lisa Wong',
      items: 'Vegetable Lumpia x3, Juice x2',
      total: 275,
      status: 'preparing',
      time: '15 min ago',
      type: 'dine-in'
    }
  ];

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-medium text-gray-900">{order.id}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {order.type}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-1">{order.customer}</p>
              <p className="text-xs text-gray-500">{order.items}</p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-gray-900">₱{order.total}</p>
              <div className="flex items-center space-x-1 mt-1">
                {getStatusIcon(order.status)}
                <span className="text-xs text-gray-500">{order.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOrders;