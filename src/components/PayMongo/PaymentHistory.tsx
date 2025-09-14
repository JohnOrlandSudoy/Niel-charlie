import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  Calendar,
  DollarSign,
  CreditCard,
  Smartphone
} from 'lucide-react';
import { api } from '../../utils/api';

interface PaymentHistoryData {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone?: string;
    orderType: string;
    total: number;
    createdAt: string;
  };
  payments: Array<{
    id: string;
    paymentIntentId?: string;
    amount: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    paidAt?: string;
    feeAmount: number;
    netAmount: number;
    externalReferenceNumber?: string;
    webhookEvents?: any[];
    paymongoResponse?: any;
  }>;
  summary: {
    totalPayments: number;
    successfulPayments: number;
    totalAmount: number;
  };
}

interface PaymentHistoryProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  orderId,
  isOpen,
  onClose
}) => {
  const [historyData, setHistoryData] = useState<PaymentHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch payment history
  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.payments.getPaymentHistory(orderId);
      const result = await response.json();
      
      if (result.success && result.data) {
        setHistoryData(result.data);
      } else {
        setError(result.message || 'Failed to fetch payment history');
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError('Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  // Refresh payment history
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentHistory();
    setRefreshing(false);
  };

  // Load payment history when modal opens
  useEffect(() => {
    if (isOpen && orderId) {
      fetchPaymentHistory();
    }
  }, [isOpen, orderId]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount / 100);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
      case 'awaiting_payment_method':
      case 'awaiting_next_action':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
      case 'awaiting_payment_method':
      case 'awaiting_next_action':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'paymongo':
      case 'gcash':
        return <Smartphone className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Payment History
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading payment history...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          ) : historyData ? (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Order #:</span> {historyData.order.orderNumber}</p>
                    <p><span className="font-medium">Customer:</span> {historyData.order.customerName}</p>
                    {historyData.order.customerPhone && (
                      <p><span className="font-medium">Phone:</span> {historyData.order.customerPhone}</p>
                    )}
                  </div>
                  <div>
                    <p><span className="font-medium">Order Type:</span> {historyData.order.orderType.replace('_', ' ').toUpperCase()}</p>
                    <p><span className="font-medium">Order Total:</span> {formatCurrency(historyData.order.total * 100)}</p>
                    <p><span className="font-medium">Created:</span> {formatDate(historyData.order.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Payment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900">{historyData.summary.totalPayments}</p>
                    <p className="text-blue-700">Total Payments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{historyData.summary.successfulPayments}</p>
                    <p className="text-green-700">Successful</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(historyData.summary.totalAmount)}</p>
                    <p className="text-blue-700">Total Amount</p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
                {historyData.payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No payment records found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyData.payments.map((payment, index) => (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(payment.status)}
                            <div>
                              <h4 className="font-medium text-gray-900">Payment #{index + 1}</h4>
                              {payment.paymentIntentId && (
                                <p className="text-xs text-gray-500 font-mono">{payment.paymentIntentId}</p>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Payment Method</p>
                            <div className="flex items-center space-x-2">
                              {getPaymentMethodIcon(payment.paymentMethod)}
                              <span className="capitalize">{payment.paymentMethod}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Amount</p>
                            <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                          </div>

                          <div>
                            <p className="font-medium text-gray-700 mb-1">Net Amount</p>
                            <p className="font-semibold">{formatCurrency(payment.netAmount)}</p>
                          </div>

                          {payment.paidAt && (
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Paid At</p>
                              <p>{formatDate(payment.paidAt)}</p>
                            </div>
                          )}

                          {payment.externalReferenceNumber && (
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Reference Number</p>
                              <p className="font-mono text-xs">{payment.externalReferenceNumber}</p>
                            </div>
                          )}

                          {payment.feeAmount > 0 && (
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Processing Fee</p>
                              <p className="text-red-600">{formatCurrency(payment.feeAmount)}</p>
                            </div>
                          )}
                        </div>

                        {/* Webhook Events */}
                        {payment.webhookEvents && payment.webhookEvents.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="font-medium text-gray-700 mb-2">Webhook Events</p>
                            <div className="space-y-2">
                              {payment.webhookEvents.map((event, eventIndex) => (
                                <div key={eventIndex} className="bg-gray-50 rounded p-2 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{event.type}</span>
                                    <span className="text-gray-500">{formatDate(event.timestamp)}</span>
                                  </div>
                                  {event.data && (
                                    <pre className="mt-1 text-gray-600 overflow-x-auto">
                                      {JSON.stringify(event.data, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* PayMongo Response */}
                        {payment.paymongoResponse && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="font-medium text-gray-700 mb-2">PayMongo Response</p>
                            <pre className="bg-gray-50 rounded p-2 text-xs overflow-x-auto">
                              {JSON.stringify(payment.paymongoResponse, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
