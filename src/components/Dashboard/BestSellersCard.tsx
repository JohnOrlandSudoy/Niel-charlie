// src/components/Dashboard/BestSellersCard.tsx
import React from 'react';
import { TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import { useBestSellers } from '../../hooks/useBestSellers';

interface BestSellersCardProps {
  onViewMore?: () => void;
}

const BestSellersCard: React.FC<BestSellersCardProps> = ({ onViewMore }) => {
  const { bestSellers, isLoading, error, week, year } = useBestSellers(5);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Best Sellers</h3>
            <p className="text-xs text-gray-500">Week {week}, {year}</p>
          </div>
        </div>
        {onViewMore && (
          <button
            onClick={onViewMore}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      ) : bestSellers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No sales data available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bestSellers.map((item) => (
            <div key={item.menu_item_id} className="flex items-center justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">{item.rank}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.menu_item_name}</p>
                  <p className="text-xs text-gray-500">{item.total_quantity} sold</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-sm font-semibold text-gray-900">
                  ₱{parseFloat(item.total_revenue).toLocaleString('en-PH', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-emerald-600">Avg: {item.average_daily_sales}/day</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BestSellersCard;
