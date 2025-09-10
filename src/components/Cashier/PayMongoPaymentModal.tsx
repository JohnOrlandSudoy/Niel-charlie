import React, { useCallback, useMemo } from 'react';
import { X, QrCode, Smartphone, CreditCard, Clock, CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink } from 'lucide-react';
import { PayMongoPaymentIntent } from '../../types/paymongo';

interface PayMongoPaymentModalProps {
  paymentIntent: PayMongoPaymentIntent;
  isCheckingStatus: boolean;
  isCancelling: boolean;
  error: string | null;
  onCancel: () => void;
  onClose: () => void;
}

const PayMongoPaymentModal: React.FC<PayMongoPaymentModalProps> = React.memo(({
  paymentIntent,
  isCheckingStatus,
  isCancelling,
  error,
  onCancel,
  onClose
}) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleCopyQRCode = useCallback(() => {
    if (paymentIntent.qrCodeData) {
      navigator.clipboard.writeText(paymentIntent.qrCodeData);
    }
  }, [paymentIntent.qrCodeData]);

  const handleCopyPaymentId = useCallback(() => {
    navigator.clipboard.writeText(paymentIntent.paymentIntentId);
  }, [paymentIntent.paymentIntentId]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-amber-600" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  }, []);

  const getStatusMessage = useCallback((status: string) => {
    switch (status) {
      case 'awaiting_payment_method':
        return 'Waiting for customer to scan QR code and select payment method';
      case 'awaiting_next_action':
        return 'Payment method selected, waiting for customer to complete payment';
      case 'processing':
        return 'Payment is being processed, please wait...';
      case 'succeeded':
        return 'Payment completed successfully!';
      case 'cancelled':
        return 'Payment was cancelled';
      case 'failed':
        return 'Payment failed, please try again';
      default:
        return 'Payment status unknown';
    }
  }, []);

  const isPaymentComplete = useMemo(() => {
    return paymentIntent.status === 'succeeded' || paymentIntent.status === 'cancelled' || paymentIntent.status === 'failed';
  }, [paymentIntent.status]);

  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount / 100);
  }, []);

  const formatExpiryTime = useCallback((expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    
    if (diffMins <= 0) {
      return 'Expired';
    } else if (diffMins === 1) {
      return '1 minute';
    } else {
      return `${diffMins} minutes`;
    }
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paymongo-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="paymongo-modal-title" className="text-xl font-semibold text-gray-900">
            PayMongo Payment - Order #{paymentIntent.order.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close PayMongo payment modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Customer:</span> {paymentIntent.order.customerName}
              </div>
              <div>
                <span className="font-medium">Order Number:</span> {paymentIntent.order.orderNumber}
              </div>
              <div className="col-span-2">
                <span className="font-medium text-lg">Total Amount:</span> 
                <span className="text-lg font-bold text-green-600 ml-2">
                  {formatAmount(paymentIntent.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Payment Status</h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon(paymentIntent.status)}
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(paymentIntent.status)}`}>
                  {paymentIntent.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-2">
              {getStatusMessage(paymentIntent.status)}
            </p>
            {!isPaymentComplete && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Expires in: {formatExpiryTime(paymentIntent.expiresAt)}</span>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          {!isPaymentComplete && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code to Pay</h3>
                
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <img
                      src={paymentIntent.qrCodeUrl}
                      alt="PayMongo QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Customer can scan this QR code using their mobile banking app or e-wallet
                  </p>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleCopyQRCode}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Copy QR code data"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy QR Data</span>
                    </button>
                    
                    <a
                      href={paymentIntent.qrCodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      aria-label="Open QR code in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Open QR Code</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
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

          {/* Payment Intent ID */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Payment Intent ID</h4>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono">
                {paymentIntent.paymentIntentId}
              </code>
              <button
                onClick={handleCopyPaymentId}
                className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Copy payment intent ID"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            {!isPaymentComplete && (
              <button
                onClick={onCancel}
                disabled={isCancelling}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Cancel payment"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Payment'}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
            >
              {isPaymentComplete ? 'Close' : 'Close & Continue Monitoring'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

PayMongoPaymentModal.displayName = 'PayMongoPaymentModal';

export default PayMongoPaymentModal;
