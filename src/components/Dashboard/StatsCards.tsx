import React from 'react';
import { TrendingUp, ShoppingBag, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

const StatsCards: React.FC = () => {
  const { stats, isLoading, error } = useDashboardData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeType = (value: number) => {
    if (value > 0) return 'increase';
    if (value < 0) return 'decrease';
    return 'neutral';
  };

  const statsData = [
    {
      label: 'Today\'s Sales',
      value: formatCurrency(stats.todaySales),
      change: formatPercentage(stats.salesGrowth),
      changeType: getChangeType(stats.salesGrowth),
      icon: TrendingUp,
      color: 'blue'
    },
    {
      label: 'Orders Today',
      value: stats.todayOrders.toString(),
      change: formatPercentage(stats.ordersGrowth),
      changeType: getChangeType(stats.ordersGrowth),
      icon: ShoppingBag,
      color: 'emerald'
    },
    {
      label: 'Menu Items',
      value: `${stats.availableMenuItems}/${stats.totalMenuItems}`,
      change: `${stats.activeCategories} categories`,
      changeType: 'neutral',
      icon: Package,
      color: 'purple'
    },
    {
      label: 'Stock Alerts',
      value: (stats.lowStockItems + stats.outOfStockItems).toString(),
      change: `${stats.outOfStockItems} critical`,
      changeType: stats.outOfStockItems > 0 ? 'decrease' : 'neutral',
      icon: AlertTriangle,
      color: 'amber'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
          >
            <div className="flex items-center justify-center h-20 sm:h-24">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200 touch-manipulation"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 truncate">{stat.value}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-lg bg-${stat.color}-100 flex-shrink-0 ml-2`}>
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${stat.color}-600`} />
              </div>
            </div>
            
            <div className="flex items-center mt-3 sm:mt-4">
              <span
                className={`text-xs sm:text-sm font-medium ${
                  stat.changeType === 'increase'
                    ? 'text-emerald-600'
                    : stat.changeType === 'decrease'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 ml-2 truncate">
                {stat.label === 'Today\'s Sales' || stat.label === 'Orders Today' 
                  ? 'vs yesterday' 
                  : stat.label === 'Menu Items' 
                  ? 'active' 
                  : 'total'
                }
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;