 import React, { useCallback, useMemo, useState } from 'react';
import { X, Save, Smartphone, CreditCard, QrCode } from 'lucide-react';
import { Order as ApiOrder } from '../../types/orders';
import { Discount } from '../../types/discounts';
import DiscountSelector from './DiscountSelector';

interface PaymentModalProps {
  order: ApiOrder;
  paymentForm: {
    payment_status: 'unpaid' | 'paid' | 'refunded';
    payment_method: 'cash' | 'gcash' | 'card' | 'paymongo';
  };
  setPaymentForm: (form: any) => void;
  isUpdatingPayment: boolean;
  isApplyingDiscount: boolean;
  onClose: () => void;
  onUpdatePayment: (orderId: string, paymentData: any) => void;
  onApplyDiscount: (orderId: string, discountCode: string) => Promise<any>;
  onPayMongoPayment?: (order: ApiOrder) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = React.memo(({
  order,
  paymentForm,
  setPaymentForm,
  isUpdatingPayment,
  isApplyingDiscount,
  onClose,
  onUpdatePayment,
  onApplyDiscount,
  onPayMongoPayment
}) => {
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const paymentData = {
      ...paymentForm,
      discount_id: selectedDiscount?.id || null
    };
    onUpdatePayment(order.id, paymentData);
  }, [order.id, paymentForm, selectedDiscount, onUpdatePayment]);

  const handlePayMongoPayment = useCallback(() => {
    if (onPayMongoPayment) {
      onPayMongoPayment(order);
    }
  }, [onPayMongoPayment, order]);

  // Handle discount application
  const handleApplyDiscount = useCallback(async (discount: Discount) => {
    if (!discount) return;
    
    try {
      const result = await onApplyDiscount(order.id, discount.code);
      if (result) {
        // Discount applied successfully
        console.log('Discount applied:', result);
        // You could show a success message here
      }
    } catch (error) {
      console.error('Failed to apply discount:', error);
    }
  }, [onApplyDiscount, order.id]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setPaymentForm((prev: any) => ({ ...prev, [field]: value }));
  }, [setPaymentForm]);

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
            Payment Management - Order #{order.order_number}
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
                <span className="font-medium">Tax:</span> ₱{orderSummary.tax}
              </div>
              <div className="col-span-2">
                <span className="font-medium text-lg">Total Amount:</span> 
                <span className="text-lg font-bold text-green-600 ml-2">₱{orderSummary.total}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="payment-status">
                    Payment Status *
                  </label>
                  <select
                    id="payment-status"
                    value={paymentForm.payment_status}
                    onChange={(e) => handleInputChange('payment_status', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    required
                    aria-label="Payment status"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="payment-method">
                    Payment Method
                  </label>
                  <select
                    id="payment-method"
                    value={paymentForm.payment_method}
                    onChange={(e) => handleInputChange('payment_method', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    aria-label="Payment method"
                  >
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="card">Card</option>
                    <option value="paymongo">PayMongo (Online)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Discount Selector */}
            <DiscountSelector
              orderAmount={order.total_amount}
              onDiscountSelect={setSelectedDiscount}
              selectedDiscount={selectedDiscount}
              onApplyDiscount={handleApplyDiscount}
              isApplyingDiscount={isApplyingDiscount}
            />

            {/* PayMongo Payment Button */}
            {paymentForm.payment_method === 'paymongo' && paymentForm.payment_status === 'unpaid' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">PayMongo Online Payment</h4>
                    <p className="text-sm text-blue-700">
                      Generate a QR code for the customer to scan and pay online
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePayMongoPayment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Create PayMongo payment"
                  >
                    <QrCode className="h-4 w-4" aria-hidden="true" />
                    <span>Create QR Payment</span>
                  </button>
                </div>
              </div>
            )}

            {/* Payment Method Info */}
            {paymentForm.payment_method === 'paymongo' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">PayMongo Payment Methods</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">GCash</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Credit/Debit Cards</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <QrCode className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Bank QR Codes</span>
                  </div>
                </div>
              </div>
            )}

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
                type="submit"
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
          </form>
        </div>
      </div>
    </div>
  );
});

PaymentModal.displayName = 'PaymentModal';

export default PaymentModal;
