import React, { useState, useEffect } from 'react';
import { X, CreditCard, Wifi, WifiOff, Sync, AlertCircle, CheckCircle } from 'lucide-react';
import { useOfflinePayment, OfflinePaymentData } from '../../hooks/useOfflinePayment';

interface OfflinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number: string;
    total_amount: number;
    customer_name?: string;
  };
  onPaymentSuccess?: (paymentData: any) => void;
}

const OfflinePaymentModal: React.FC<OfflinePaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  onPaymentSuccess
}) => {
  const {
    isProcessing,
    isOnline,
    error,
    syncStatus,
    processPayment,
    getPaymentMethods,
    getSyncStatus,
    forceSync,
    getOfflineStatus,
    setError
  } = useOfflinePayment();

  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'cash' as 'cash' | 'gcash' | 'card' | 'paymongo',
    amount: order.total_amount,
    notes: ''
  });
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<any>(null);

  // Load payment methods and status on mount
  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
      loadStatus();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    setIsLoadingMethods(true);
    try {
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setIsLoadingMethods(false);
    }
  };

  const loadStatus = async () => {
    try {
      const status = await getSyncStatus();
      const offlineStatus = getOfflineStatus();
      setOfflineStatus(offlineStatus);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const paymentData: OfflinePaymentData = {
      orderId: order.id,
      paymentMethod: paymentForm.paymentMethod,
      amount: paymentForm.amount,
      notes: paymentForm.notes || undefined
    };

    try {
      const result = await processPayment(paymentData);
      
      if (result.success && result.data) {
        onPaymentSuccess?.(result.data);
        onClose();
      }
    } catch (error) {
      console.error('Payment submission error:', error);
    }
  };

  const handleForceSync = async () => {
    try {
      const success = await forceSync();
      if (success) {
        await loadStatus();
      }
    } catch (error) {
      console.error('Force sync error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Process Payment</h2>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs">Online</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-amber-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs">Offline</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Order Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900">Order #{order.order_number}</h3>
            <p className="text-sm text-gray-600">
              Customer: {order.customer_name || 'Walk-in Customer'}
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              Total: ₱{order.total_amount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Sync Status */}
        {offlineStatus && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Sync Status</h3>
              <button
                onClick={handleForceSync}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Sync className="h-4 w-4" />
                <span>Sync Now</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Last Sync: {offlineStatus.lastSync ? new Date(offlineStatus.lastSync).toLocaleTimeString() : 'Never'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Pending: {offlineStatus.pendingSync}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            {isLoadingMethods ? (
              <div className="text-sm text-gray-500">Loading payment methods...</div>
            ) : (
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm(prev => ({ 
                  ...prev, 
                  paymentMethod: e.target.value as any 
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
                <option value="card">Credit/Debit Card</option>
                <option value="paymongo">PayMongo (Online)</option>
              </select>
            )}
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Paid
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(prev => ({ 
                ...prev, 
                amount: parseFloat(e.target.value) || 0 
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Change Calculation */}
          {paymentForm.amount > order.total_amount && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-800">Change:</span>
                <span className="text-lg font-semibold text-green-900">
                  ₱{(paymentForm.amount - order.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any payment notes..."
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || paymentForm.amount < order.total_amount}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Process Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfflinePaymentModal;
