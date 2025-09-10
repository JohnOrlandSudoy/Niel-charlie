import React, { useState } from 'react';
import { TrendingDown, Package, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

const StockUsageChart: React.FC = () => {
  const { lowStockAlerts, stats, isLoading, error } = useDashboardData();
  const [timeRange, setTimeRange] = useState('week');

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading stock data...</p>
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
            <p>Failed to load stock data</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stock usage percentage
  const getStockUsagePercentage = (current: number, minimum: number) => {
    if (current === 0) return 0;
    return Math.min((current / (minimum * 2)) * 100, 100);
  };

  // Sort alerts by urgency (out of stock first, then by stock level)
  const sortedAlerts = [...lowStockAlerts].sort((a, b) => {
    if (a.current_stock === 0 && b.current_stock > 0) return -1;
    if (b.current_stock === 0 && a.current_stock > 0) return 1;
    return a.current_stock - b.current_stock;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TrendingDown className="h-6 w-6 text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-900">Stock Usage Overview</h3>
        </div>
        
        <div className="flex space-x-2">
          {['week', 'month', 'quarter'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                timeRange === range
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {sortedAlerts.length > 0 ? sortedAlerts.slice(0, 5).map((item) => {
          const usagePercentage = getStockUsagePercentage(item.current_stock, item.minimum_stock);
          const isOutOfStock = item.current_stock === 0;
          
          return (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {item.current_stock} {item.unit}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    (min: {item.minimum_stock})
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isOutOfStock 
                      ? 'bg-red-500' 
                      : usagePercentage < 30 
                        ? 'bg-amber-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${isOutOfStock ? 100 : usagePercentage}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${
                  isOutOfStock 
                    ? 'text-red-600' 
                    : usagePercentage < 30 
                      ? 'text-amber-600' 
                      : 'text-green-600'
                }`}>
                  {isOutOfStock ? 'Out of Stock' : `${usagePercentage.toFixed(0)}% remaining`}
                </span>
                {item.menu_items && item.menu_items.length > 0 && (
                  <span className="text-gray-500">
                    {item.menu_items.length} menu item{item.menu_items.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No stock alerts</p>
            <p className="text-sm text-gray-400 mt-1">All inventory items are well stocked</p>
          </div>
        )}
      </div>

      {sortedAlerts.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Out of Stock ({stats.outOfStockItems})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-gray-600">Low Stock ({stats.lowStockItems})</span>
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              View All Items
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockUsageChart;
