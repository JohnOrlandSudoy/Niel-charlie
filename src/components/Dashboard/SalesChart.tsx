import React from 'react';
import { BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

const SalesChart: React.FC = () => {
  const { salesData = [], stats, isLoading, error } = useDashboardData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const dataToUse = Array.isArray(salesData) ? salesData : [];
  const maxSales = dataToUse.length > 0 ? Math.max(...dataToUse.map(d => d.sales)) : 0;
  const totalSales = dataToUse.reduce((sum, day) => sum + (day.sales || 0), 0);
  const totalOrders = dataToUse.reduce((sum, day) => sum + (day.orders || 0), 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm sm:text-base text-gray-600">Loading sales data...</p>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sales Overview</h3>
        </div>
        
        {/* No time-range controls: using hook-provided sales data only */}
        <div />
      </div>

      <div className="h-48 sm:h-64 flex items-end space-x-2 sm:space-x-4">
        {dataToUse.length > 0 && dataToUse.map((data: any, index: number) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col items-center space-y-1 sm:space-y-2">
              <div
                className="w-full bg-blue-600 rounded-t-md transition-all duration-500 ease-out hover:bg-blue-700 cursor-pointer touch-manipulation"
                style={{
                  height: `${maxSales > 0 ? (data.sales / maxSales) * (window.innerWidth < 640 ? 120 : 180) : 20}px`,
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
        ))}

        {dataToUse.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">No sales data available</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 sm:mt-6 pt-4 border-t border-gray-200 gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
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
        
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-500">Total Sales ({dataToUse.length} day{dataToUse.length !== 1 ? 's' : ''})</p>
            <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(totalSales)}</p>
            <p className="text-sm text-gray-500">{totalOrders} orders</p>
          </div>
      </div>
    </div>
  );
};

export default SalesChart;