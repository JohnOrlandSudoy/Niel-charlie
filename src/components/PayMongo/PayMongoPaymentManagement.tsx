import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  AlertTriangle, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  Smartphone,
  QrCode,
  Copy,
  Download,
  Calendar,
  DollarSign,
  User,
  Phone,
  Plus
} from 'lucide-react';
import { usePayMongoAdmin } from '../../hooks/usePayMongoAdmin';
import ReceiptGenerator from './ReceiptGenerator';

const PayMongoPaymentManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualPaymentId, setManualPaymentId] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Use custom hook
  const {
    payments,
    isLoading,
    error,
    selectedPayment,
    showDetailsModal,
    loadingProgress,
    stats,
    loadPayments,
    refreshPayments,
    fetchPaymentStatus,
    handleViewDetails,
    handleCloseDetails,
    handleCopy,
    formatAmount,
    formatTimestamp,
    getStatusIcon,
    getStatusColor,
    getStatusMessage,
    setError
  } = usePayMongoAdmin();

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((status: string) => {
    setFilterStatus(status);
  }, []);

  // Refresh payments with loading state
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshPayments();
    setIsRefreshing(false);
  }, [refreshPayments]);

  // Add payment manually by ID
  const handleAddManualPayment = useCallback(async () => {
    if (!manualPaymentId.trim()) return;
    
    try {
      setIsAddingManual(true);
      const payment = await fetchPaymentStatus(manualPaymentId.trim());
      
      if (payment) {
        // Check if payment already exists
        const exists = payments.some(p => p.paymentIntentId === payment.paymentIntentId);
        if (!exists) {
          // Add to payments list (this would need to be implemented in the hook)
          console.log('Payment found:', payment);
          setError(null);
          setManualPaymentId('');
          // Refresh to show the new payment
          await handleRefresh();
        } else {
          setError('Payment already exists in the list');
        }
      } else {
        setError('Payment not found or failed to fetch');
      }
    } catch (err) {
      console.error('Error adding manual payment:', err);
      setError('Failed to fetch payment. Please check the payment ID.');
    } finally {
      setIsAddingManual(false);
    }
  }, [manualPaymentId, fetchPaymentStatus, payments, handleRefresh]);

  // Handle receipt generation
  const handleGenerateReceipt = useCallback((orderId: string, _orderNumber: string) => {
    setSelectedOrderId(orderId);
    setShowReceiptModal(true);
  }, []);

  // Close modals
  const closeReceiptModal = useCallback(() => {
    setShowReceiptModal(false);
    setSelectedOrderId(null);
  }, []);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = searchQuery === '' || 
        payment.paymentIntentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.metadata.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.metadata.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.metadata.customer_phone?.includes(searchQuery);
      
      const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, filterStatus]);

  // Load data on component mount
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PayMongo Payments</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all PayMongo payment transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors duration-200">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!isLoading && payments.length > 0 && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">
              Successfully loaded {payments.length} PayMongo payment{payments.length !== 1 ? 's' : ''} from your system
            </span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPayments}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.successfulPayments}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingPayments}</p>
            </div>
            <div className="p-3 rounded-full bg-amber-100">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.failedPayments}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(stats.totalAmount)}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col space-y-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by payment ID, order number, or customer..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="awaiting_payment_method">Awaiting Payment Method</option>
                <option value="awaiting_next_action">Awaiting Next Action</option>
                <option value="processing">Processing</option>
                <option value="succeeded">Succeeded</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Manual Payment ID Input */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter Payment Intent ID (e.g., pi_EostntdQe4tS6TP1fEFFCvA8)"
                  value={manualPaymentId}
                  onChange={(e) => setManualPaymentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleAddManualPayment}
                disabled={!manualPaymentId.trim() || isAddingManual}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors duration-200"
              >
                {isAddingManual ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>{isAddingManual ? 'Adding...' : 'Add Payment'}</span>
              </button>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                Add a specific payment by entering its Payment Intent ID
              </p>
              <button
                onClick={() => setManualPaymentId('pi_EostntdQe4tS6TP1fEFFCvA8')}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Use Test Payment ID
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading payments...</span>
            {loadingProgress && (
              <div className="mt-4 w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Loading payments...</span>
                  <span>{loadingProgress.current} / {loadingProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          ) : filteredPayments.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.paymentIntentId} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.paymentIntentId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.metadata.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.metadata.orderType.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-400">
                          Created by: {payment.metadata.createdByUsername}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.metadata.customerName}
                        </div>
                        {payment.metadata.customer_phone && (
                          <div className="text-sm text-gray-500">
                            {payment.metadata.customer_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatAmount(payment.amount, payment.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payment.status) === 'CheckCircle' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {getStatusIcon(payment.status) === 'XCircle' && <XCircle className="h-5 w-5 text-red-600" />}
                        {getStatusIcon(payment.status) === 'Clock' && <Calendar className={`h-5 w-5 ${payment.status === 'processing' ? 'text-blue-600 animate-spin' : 'text-amber-600'}`} />}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getStatusMessage(payment.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTimestamp(payment.created_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Updated: {formatTimestamp(payment.updated_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded" 
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleGenerateReceipt(payment.metadata.orderId, payment.metadata.orderNumber)}
                          className="text-green-600 hover:text-green-700 p-1 rounded" 
                          title="Generate Receipt"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(payment.paymentIntentId)}
                          className="text-gray-600 hover:text-gray-700 p-1 rounded" 
                          title="Copy Payment ID"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No payments found</p>
              <p className="text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Payment Details - {selectedPayment.paymentIntentId}
              </h2>
              <button
                onClick={handleCloseDetails}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Status</h3>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(selectedPayment.status) === 'CheckCircle' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {getStatusIcon(selectedPayment.status) === 'XCircle' && <XCircle className="h-5 w-5 text-red-600" />}
                  {getStatusIcon(selectedPayment.status) === 'Clock' && <Calendar className={`h-5 w-5 ${selectedPayment.status === 'processing' ? 'text-blue-600 animate-spin' : 'text-amber-600'}`} />}
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedPayment.status)}`}>
                    {selectedPayment.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">
                    {getStatusMessage(selectedPayment.status)}
                  </span>
                </div>
              </div>

              {/* Payment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-gray-900 font-mono">{selectedPayment.paymentIntentId}</code>
                        <button
                          onClick={() => handleCopy(selectedPayment.paymentIntentId)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-gray-900">
                        {formatAmount(selectedPayment.amount, selectedPayment.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="text-gray-900">{selectedPayment.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Description:</span>
                      <span className="text-gray-900">{selectedPayment.description}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="text-gray-900">{selectedPayment.metadata.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Type:</span>
                      <span className="text-gray-900">{selectedPayment.metadata.orderType.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created By:</span>
                      <span className="text-gray-900">{selectedPayment.metadata.createdByUsername}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-gray-900 font-mono text-xs">{selectedPayment.metadata.orderId}</code>
                        <button
                          onClick={() => handleCopy(selectedPayment.metadata.orderId)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Name:</span>
                    <span className="text-gray-900">{selectedPayment.metadata.customerName}</span>
                  </div>
                  {selectedPayment.metadata.customer_phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Phone:</span>
                      <span className="text-gray-900">{selectedPayment.metadata.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Timestamps</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">{formatTimestamp(selectedPayment.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Updated:</span>
                    <span className="text-gray-900">{formatTimestamp(selectedPayment.updated_at)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Supported Payment Methods</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">GCash</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">Credit/Debit Cards</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <QrCode className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">Bank QR Codes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Generator Modal */}
      {showReceiptModal && selectedOrderId && (
        <ReceiptGenerator
          orderId={selectedOrderId}
          isOpen={showReceiptModal}
          onClose={closeReceiptModal}
        />
      )}
    </div>
  );
};

export default PayMongoPaymentManagement;
