// src/components/Dashboard/BestSellersModal.tsx
import React, { useState, useMemo } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useBestSellersByWeek } from '../../hooks/useBestSellersByWeek';

interface BestSellersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to get current ISO week
const getISOWeek = (date: Date): number => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getISOWeekYear = (date: Date): number => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  return tmp.getUTCFullYear();
};

const BestSellersModal: React.FC<BestSellersModalProps> = ({ isOpen, onClose }) => {
  const [week, setWeek] = useState<number | undefined>(getISOWeek(new Date()));
  const [year, setYear] = useState<number | undefined>(new Date().getFullYear());
  const { bestSellers, isLoading, error, total, pages, currentPage, setPage } = useBestSellersByWeek(week, year, 10);

  const handlePrevWeek = () => {
    if (typeof week === 'number' && week > 1) {
      setWeek(week - 1);
    } else {
      setWeek(53);
      setYear(typeof year === 'number' ? year - 1 : new Date().getFullYear());
    }
    setPage(1);
  };

  const handleNextWeek = () => {
    if (typeof week === 'number' && week < 53) {
      setWeek(week + 1);
    } else {
      setWeek(1);
      setYear(typeof year === 'number' ? year + 1 : new Date().getFullYear());
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
              <span className="font-medium">{typeof week === 'number' && typeof year === 'number' ? `Week ${week}, ${year}` : 'Current week'}</span>
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
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="number"
                  min={1}
                  max={53}
                  value={typeof week === 'number' ? week : ''}
                  onChange={(e) => { const v = e.target.value ? Number(e.target.value) : undefined; setWeek(v); setPage(1); }}
                  placeholder="Week"
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  title="Set ISO week"
                />
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={typeof year === 'number' ? year : ''}
                  onChange={(e) => { const v = e.target.value ? Number(e.target.value) : undefined; setYear(v); setPage(1); }}
                  placeholder="Year"
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  title="Set year"
                />
                <input
                  type="date"
                  onChange={(e) => {
                    if (!e.target.value) { setWeek(undefined); setYear(undefined); setPage(1); return; }
                    const d = new Date(e.target.value);
                    setWeek(getISOWeek(d));
                    setYear(getISOWeekYear(d));
                    setPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  title="Pick date to derive week/year"
                />
                <input
                  type="datetime-local"
                  onChange={(e) => {
                    if (!e.target.value) { setWeek(undefined); setYear(undefined); setPage(1); return; }
                    const d = new Date(e.target.value);
                    setWeek(getISOWeek(d));
                    setYear(getISOWeekYear(d));
                    setPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  title="Pick date/time to derive week/year"
                />
              </div>
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
