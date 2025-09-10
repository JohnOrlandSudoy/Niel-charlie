import React, { useState } from 'react';
import { BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

const SalesChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState('week');
  const { salesData, stats, isLoading, error } = useDashboardData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const maxSales = salesData.length > 0 ? Math.max(...salesData.map(d => d.sales)) : 0;
  const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0);
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading sales data...</p>
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
            <p>Failed to load sales data</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
        </div>
        
        <div className="flex space-x-2">
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                timeRange === range
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 flex items-end space-x-4">
        {salesData.length > 0 ? salesData.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col items-center space-y-2">
              <div
                className="w-full bg-blue-600 rounded-t-md transition-all duration-500 ease-out hover:bg-blue-700 cursor-pointer"
                style={{
                  height: `${maxSales > 0 ? (data.sales / maxSales) * 180 : 20}px`,
                  minHeight: '20px'
                }}
                title={`${formatCurrency(data.sales)} - ${data.orders} orders`}
              />
              <div className="text-center">
                <p className="text-xs font-medium text-gray-900">
                  {data.sales > 1000 ? `${(data.sales / 1000).toFixed(1)}k` : data.sales}
                </p>
                <p className="text-xs text-gray-500">{data.day}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <p className="text-gray-500">No sales data available</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className={`text-sm font-medium ${
              stats.salesGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {stats.salesGrowth >= 0 ? '+' : ''}{stats.salesGrowth.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500">vs yesterday</span>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Sales (7 days)</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSales)}</p>
          <p className="text-xs text-gray-500">{totalOrders} orders</p>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;