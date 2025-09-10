import React from 'react';
import { Plus, Package, Book as MenuBook, Percent, FileText, Settings, ShoppingCart, BarChart3 } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

const QuickActions: React.FC = () => {
  const { stats } = useDashboardData();

  const actions = [
    {
      label: 'New Order',
      icon: ShoppingCart,
      color: 'blue',
      description: 'Create customer order',
      href: '/cashier'
    },
    {
      label: 'Add Menu Item',
      icon: MenuBook,
      color: 'purple',
      description: 'Create new menu offering',
      href: '/menu'
    },
    {
      label: 'Manage Inventory',
      icon: Package,
      color: 'emerald',
      description: 'Update stock levels',
      href: '/inventory',
      alert: stats.lowStockItems + stats.outOfStockItems > 0
    },
    {
      label: 'Create Discount',
      icon: Percent,
      color: 'amber',
      description: 'Add discount codes',
      href: '/discounts'
    },
    {
      label: 'View Reports',
      icon: BarChart3,
      color: 'red',
      description: 'Sales & analytics',
      href: '/reports'
    },
    {
      label: 'Order History',
      icon: FileText,
      color: 'gray',
      description: 'View all orders',
      href: '/orders'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <button
              key={index}
              onClick={() => {
                // Navigate to the specified route
                window.location.href = action.href;
              }}
              className={`relative p-4 rounded-lg border-2 border-dashed border-${action.color}-200 hover:border-${action.color}-300 hover:bg-${action.color}-50 transition-all duration-200 group`}
            >
              {action.alert && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors duration-200 mb-2`}>
                  <Icon className={`h-4 w-4 text-${action.color}-600`} />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{action.label}</p>
                <p className="text-xs text-gray-500 leading-tight">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* System Status Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-600">Active Discounts</p>
            <p className="text-lg font-semibold text-amber-600">{stats.activeDiscounts}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Menu Categories</p>
            <p className="text-lg font-semibold text-purple-600">{stats.activeCategories}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;