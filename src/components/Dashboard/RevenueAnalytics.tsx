import React, { useState } from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useRevenueAnalytics } from '../../hooks/useRevenueAnalytics';

const RevenueAnalytics: React.FC = () => {
  const now = new Date();
  const defaultEnd = now.toISOString().split('T')[0];
  const defaultStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const { analytics, isLoading, error } = useRevenueAnalytics(startDate, endDate);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const points = analytics?.points || [];
  const maxRevenue = points.length > 0 ? Math.max(...points.map(p => p.revenue)) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Revenue Analytics</h3>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
          <span className="text-gray-600 text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm sm:text-base text-gray-600">Loading analytics...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      ) : points.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No analytics data available</p>
        </div>
      ) : (
        <>
          <div className="h-48 sm:h-64 flex items-end space-x-2 sm:space-x-4">
            {points.map((p, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center space-y-1 sm:space-y-2">
                  <div
                    className="w-full bg-emerald-600 rounded-t-md transition-all duration-500 ease-out hover:bg-emerald-700 cursor-pointer"
                    style={{
                      height: `${maxRevenue > 0 ? (p.revenue / maxRevenue) * (window.innerWidth < 640 ? 120 : 180) : 20}px`,
                      minHeight: '20px'
                    }}
                    title={`${formatCurrency(p.revenue)}${p.orders ? ` • ${p.orders} orders` : ''}`}
                  />
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-900">
                      {p.revenue > 1000 ? `${(p.revenue / 1000).toFixed(1)}k` : p.revenue}
                    </p>
                    <p className="text-xs text-gray-500">{p.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 sm:mt-6 pt-4 border-t border-gray-200 gap-4">
            <div />
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(analytics?.totalRevenue || 0)}</p>
              {analytics?.totalOrders !== undefined && (
                <p className="text-sm text-gray-500">{analytics.totalOrders} orders</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueAnalytics;