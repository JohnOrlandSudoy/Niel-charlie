// src/components/Dashboard/SalesRecordsTable.tsx
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Download, Loader2 } from 'lucide-react';
import { useSalesRecords } from '../../hooks/useSalesRecords';
import { SalesRecord } from '../../types/sales';

interface SalesRecordsTableProps {
  menuItemId?: string;
  startDate?: string;
  endDate?: string;
}

type SortBy = 'quantity' | 'revenue' | 'date';
type SortOrder = 'asc' | 'desc';

const SalesRecordsTable: React.FC<SalesRecordsTableProps> = ({
  menuItemId,
  startDate,
  endDate,
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterMenuItemId, setFilterMenuItemId] = useState(menuItemId || '');
  const [filterStartDate, setFilterStartDate] = useState(startDate || '');
  const [filterEndDate, setFilterEndDate] = useState(endDate || '');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');

  const { records, isLoading, error, pagination } = useSalesRecords({
    page,
    limit,
    menuItemId: filterMenuItemId || undefined,
    startDate: filterStartDate || undefined,
    endDate: filterEndDate || undefined,
    paymentStatus: (filterPaymentStatus as any) || undefined,
    paymentMethod: (filterPaymentMethod as any) || undefined,
  });

  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleExport = () => {
    if (records.length === 0) return;

    const csv = [
      ['Order ID', 'Item', 'Quantity', 'Unit Price', 'Total', 'Order Date', 'Status'],
      ...records.map(record => [
        record.order_id,
        record.menu_item_name,
        record.quantity,
        `₱${record.unit_price}`,
        `₱${record.total_price}`,
        new Date(record.order_date).toLocaleDateString(),
        record.payment_status,
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-records-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const SortIcon = ({ column }: { column: SortBy }) => {
    if (sortBy !== column) {
      return <ChevronUp className="h-4 w-4 text-gray-300" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    );
  };

  const displayRecords = useMemo(() => {
    const arr = [...records];
    const cmp = (a: SalesRecord, b: SalesRecord) => {
      let av = 0, bv = 0;
      if (sortBy === 'quantity') {
        av = a.quantity; bv = b.quantity;
      } else if (sortBy === 'revenue') {
        av = parseFloat(String(a.total_price));
        bv = parseFloat(String(b.total_price));
      } else {
        av = new Date(a.order_date).getTime();
        bv = new Date(b.order_date).getTime();
      }
      return sortOrder === 'asc' ? av - bv : bv - av;
    };
    return arr.sort(cmp);
  }, [records, sortBy, sortOrder]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Sales Records</h3>
          <button
            onClick={handleExport}
            disabled={records.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            value={filterMenuItemId}
            onChange={(e) => setFilterMenuItemId(e.target.value)}
            placeholder="Menu Item ID"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Payment Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Payment Method</option>
            <option value="cash">Cash</option>
            <option value="gcash">GCash</option>
            <option value="card">Card</option>
            <option value="paymongo">PayMongo</option>
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPage(1); }}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm"
            >
              Apply
            </button>
            <button
              onClick={() => { setFilterMenuItemId(''); setFilterStartDate(''); setFilterEndDate(''); setFilterPaymentStatus(''); setFilterPaymentMethod(''); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
            <p className="mt-2 text-gray-600">Loading records...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-6 text-center text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && records.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <p className="text-sm">No sales records found</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && records.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Order ID</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Item</span>
                  </th>
                  <th className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('quantity')}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</span>
                      <SortIcon column="quantity" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit Price</span>
                  </th>
                  <th className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('revenue')}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</span>
                      <SortIcon column="revenue" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Order Date</span>
                      <SortIcon column="date" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {record.order_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {record.menu_item_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ₱{parseFloat(String(record.unit_price)).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                      ₱{parseFloat(String(record.total_price)).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(record.order_date).toLocaleDateString('en-PH')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : record.payment_status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {record.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} records
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
                <button
                  onClick={() => setPage(Math.max(page - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(page + 1, pagination.pages))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SalesRecordsTable;
