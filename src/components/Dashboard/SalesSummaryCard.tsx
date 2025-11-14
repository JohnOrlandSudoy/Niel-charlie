import React, { useState } from 'react';
import { Calendar, BarChart3, Loader2 } from 'lucide-react';
import { useSalesSummary } from '../../hooks/useSalesSummary';

const SalesSummaryCard: React.FC = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const { summary, isLoading, error } = useSalesSummary(date);

  const formatCurrency = (amount?: string | number) => {
    if (amount === undefined) return '—';
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(isNaN(n) ? 0 : n);
  };

  const totalRevenue = summary?.netRevenue ?? summary?.totalRevenue ?? summary?.total_revenue;
  const itemsSold = summary?.total_items_sold ?? '—';
  const avgItemPrice = summary?.average_item_price;
  const ordersCount = summary?.orders_count ?? '—';
  const topItem = summary?.top_item;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Daily Sales Summary</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      ) : !summary ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No summary available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Items Sold</p>
            <p className="text-lg font-bold text-gray-900">{itemsSold}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Avg Item Price</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(avgItemPrice)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Orders</p>
            <p className="text-lg font-bold text-gray-900">{ordersCount}</p>
          </div>
          {topItem && (
            <div className="p-4 bg-gray-50 rounded-lg col-span-2">
              <p className="text-sm text-gray-600">Top Item</p>
              <p className="text-lg font-bold text-gray-900">{topItem.name} • {topItem.quantity}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesSummaryCard;