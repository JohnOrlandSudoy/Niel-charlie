 import React, { useCallback, useMemo } from 'react';
import { X, Save } from 'lucide-react';
import { Order as ApiOrder } from '../../types/orders';

interface PaymentModalProps {
  order: ApiOrder;
  paymentForm: {
    payment_status: 'unpaid' | 'paid' | 'refunded';
    payment_method: 'cash' | 'paymongo';
  };
  isUpdatingPayment: boolean;
  onClose: () => void;
  onUpdatePayment: (orderId: string, paymentData: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = React.memo(({
  order,
  paymentForm,
  isUpdatingPayment,
  onClose,
  onUpdatePayment
}) => {

  const handleSubmit = useCallback(async () => {
    
    try {
      // Use the API utility for proper authentication and base URL
      const { api } = await import('../../utils/api');
      const response = await api.orders.updatePayment(order.id, {
        payment_status: paymentForm.payment_status,
        payment_method: paymentForm.payment_method
      });

      if (!response.ok) {
        throw new Error(`Payment update failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Payment updated successfully:', result);
      
      // Call the original handler for UI updates
      onUpdatePayment(order.id, paymentForm);
    } catch (err) {
      console.error('Error updating payment:', err);
      // Still call the original handler for error handling
      onUpdatePayment(order.id, paymentForm);
    }
  }, [order.id, paymentForm, onUpdatePayment]);


  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const orderSummary = useMemo(() => ({
    customer: order.customer_name || 'Walk-in Customer',
    orderType: order.order_type.replace('_', ' ').toUpperCase(),
    subtotal: order.subtotal.toFixed(2),
    tax: order.tax_amount.toFixed(2),
    total: order.total_amount.toFixed(2)
  }), [order]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="payment-modal-title" className="text-xl font-semibold text-gray-900">
            Payment Management - Order #{order.customer_name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close payment modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Customer:</span> {orderSummary.customer}
              </div>
              <div>
                <span className="font-medium">Order Type:</span> {orderSummary.orderType}
              </div>
              <div>
                <span className="font-medium">Subtotal:</span> ₱{orderSummary.subtotal}
              </div>
              <div>
                <span className="font-medium">VAT:</span> ₱{orderSummary.tax}
              </div>
              <div className="col-span-2">
                <span className="font-medium text-lg">Total Amount:</span> 
                <span className="text-lg font-bold text-green-600 ml-2">₱{orderSummary.total}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdatingPayment}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Cancel payment update"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUpdatingPayment}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Update payment status"
            >
              {isUpdatingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>Update Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

PaymentModal.displayName = 'PaymentModal';

export default PaymentModal;
