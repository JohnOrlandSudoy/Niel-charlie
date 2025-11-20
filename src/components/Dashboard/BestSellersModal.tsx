// src/components/Dashboard/BestSellersModal.tsx
import React, { useState, useMemo } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useBestSellersByWeek } from '../../hooks/useBestSellersByWeek';

interface BestSellersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to get current ISO week
const getCurrentWeek = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
};

const BestSellersModal: React.FC<BestSellersModalProps> = ({ isOpen, onClose }) => {
  const [week, setWeek] = useState(getCurrentWeek());
  const [year, setYear] = useState(new Date().getFullYear());
  const { bestSellers, isLoading, error, total, pages, currentPage, setPage } = useBestSellersByWeek(week, year, 10);

  const handlePrevWeek = () => {
    if (week > 1) {
      setWeek(week - 1);
    } else {
      setWeek(53);
      setYear(year - 1);
    }
    setPage(1);
  };

  const handleNextWeek = () => {
    if (week < 53) {
      setWeek(week + 1);
    } else {
      setWeek(1);
      setYear(year + 1);
    }
    setPage(1);
  };

  const handleExport = () => {
    if (bestSellers.length === 0) return;

    const csv = [
      ['Rank', 'Item', 'Quantity', 'Revenue', 'Avg Daily'],
      ...bestSellers.map(item => [
        item.rank,
        item.menu_item_name,
        item.total_quantity,
        item.total_revenue,
        item.average_daily_sales
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `best-sellers-week-${week}-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Best Sellers Analysis</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Week Selector */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Week {week}, {year}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevWeek}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
                title="Previous week"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextWeek}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
                title="Next week"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ml-4"
                title="Export as CSV"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="inline-block animate-spin">
                  <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p className="text-sm">{error}</p>
            </div>
          ) : bestSellers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No sales data available for this week</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((item) => (
                <div key={item.menu_item_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      #{item.rank} {item.menu_item_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.total_quantity} units sold | Avg: {item.average_daily_sales}/day
                    </p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 flex-shrink-0 ml-4">
                    ₱{parseFloat(item.total_revenue).toLocaleString('en-PH', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center space-x-4 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {pages}
            </span>
            <button
              onClick={() => setPage(Math.min(currentPage + 1, pages))}
              disabled={currentPage === pages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BestSellersModal;
