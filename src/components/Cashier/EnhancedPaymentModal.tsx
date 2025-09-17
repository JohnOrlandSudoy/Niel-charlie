import React, { useState, useEffect, useCallback } from 'react';
import { X, CreditCard, DollarSign, CheckCircle, AlertTriangle, Loader2, Printer, Download, QrCode } from 'lucide-react';
import { Order as ApiOrder } from '../../types/orders';
import { Discount } from '../../types/discounts';
import DiscountSelector from './DiscountSelector';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { usePayMongoPayment } from '../../hooks/usePayMongoPayment';
import PayMongoPaymentModal from './PayMongoPaymentModal';

interface EnhancedPaymentModalProps {
  order: ApiOrder;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (order: ApiOrder) => void;
  onReceiptGenerated: (receiptData: any) => void;
  onApplyDiscount?: (orderId: string, discountCode: string) => Promise<any>;
}

interface PaymentData {
  amountPaid: number;
  change: number;
  paymentMethod: string;
  isOfflineCash: boolean;
}

const EnhancedPaymentModal: React.FC<EnhancedPaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onPaymentComplete,
  onReceiptGenerated,
  onApplyDiscount
}) => {
  const { paymentMethods, loading: isLoadingMethods } = usePaymentMethods();
  const {
    paymentIntent,
    isCheckingStatus,
    isCancelling,
    error: payMongoError,
    showPayMongoModal,
    createPaymentIntent,
    cancelPayment,
    closePayMongoModal,
    setError: setPayMongoError
  } = usePayMongoPayment();
  
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amountPaid: 0,
    change: 0,
    paymentMethod: '',
    isOfflineCash: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Calculate totals - handle different possible field names and fallback calculation
  const calculateTotals = () => {
    // First try to use pre-calculated totals
    if (order.subtotal && order.tax_amount && order.total_amount) {
      return {
        subtotal: order.subtotal,
        tax: order.tax_amount,
        total: order.total_amount
      };
    }
    
    // Fallback: calculate from order items
    const orderItems = (order as any).order_items || (order as any).items || [];
    const calculatedSubtotal = orderItems.reduce((sum: number, item: any) => {
      const itemTotal = (item.unit_price || item.price || 0) * (item.quantity || 1);
      return sum + itemTotal;
    }, 0);
    
    const calculatedTax = calculatedSubtotal * 0.12; // 12% VAT
    const calculatedTotal = calculatedSubtotal + calculatedTax;
    
    return {
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      total: calculatedTotal
    };
  };
  
  const { subtotal, tax, total } = calculateTotals();
  
  // Debug logging
  console.log('EnhancedPaymentModal - Order data:', {
    order,
    orderId: order.id,
    orderNumber: order.order_number,
    subtotal,
    tax,
    total,
    orderItems: (order as any).order_items || (order as any).items,
    calculatedFromItems: (order as any).order_items || (order as any).items
  });

  // Calculate change when amount paid changes
  useEffect(() => {
    if (paymentData.amountPaid > 0) {
      const change = paymentData.amountPaid - total;
      setPaymentData(prev => ({ ...prev, change: Math.max(0, change) }));
    }
  }, [paymentData.amountPaid, total]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentData({
        amountPaid: 0,
        change: 0,
        paymentMethod: '',
        isOfflineCash: false
      });
      setError(null);
      setShowReceipt(false);
      setReceiptData(null);
    }
  }, [isOpen]);

  const handleAmountPaidChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setPaymentData(prev => ({ ...prev, amountPaid: amount }));
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentData(prev => ({ 
      ...prev, 
      paymentMethod: method,
      isOfflineCash: method === 'cash_offline'
    }));
    
    // Clear any PayMongo errors when switching methods
    if (payMongoError) {
      setPayMongoError(null);
    }
  };

  // Handle discount application
  const handleApplyDiscount = useCallback(async (discount: Discount) => {
    if (!discount || !onApplyDiscount) return;
    
    try {
      setIsApplyingDiscount(true);
      const result = await onApplyDiscount(order.id, discount.code);
      if (result) {
        // Discount applied successfully
        console.log('Discount applied:', result);
        setSelectedDiscount(discount);
      }
    } catch (error) {
      console.error('Failed to apply discount:', error);
    } finally {
      setIsApplyingDiscount(false);
    }
  }, [onApplyDiscount, order.id]);

  const handleProcessPayment = async () => {
    if (!paymentData.paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    // Handle PayMongo (Online) payments
    if (paymentData.paymentMethod === 'paymongo') {
      try {
        setIsProcessing(true);
        setError(null);
        
        console.log('Creating PayMongo payment intent for order:', order);
        const paymentIntent = await createPaymentIntent(order);
        
        if (paymentIntent) {
          console.log('PayMongo payment intent created successfully:', paymentIntent);
          // PayMongo modal will be shown automatically by the hook
          // The modal will handle QR code display and payment monitoring
        } else {
          setError('Failed to create PayMongo payment intent');
        }
      } catch (err) {
        console.error('Error creating PayMongo payment:', err);
        setError('Failed to create PayMongo payment. Please try again.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Handle Cash payments (both regular cash and offline cash)
    if (paymentData.paymentMethod === 'cash' || paymentData.paymentMethod === 'cash_offline') {
      if (paymentData.amountPaid < total) {
        setError('Amount paid must be greater than or equal to the total amount');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        // Debug logging
        console.log('Processing cash payment for order:', {
          orderId: order.id,
          orderNumber: order.order_number,
          orderData: order
        });

        // Save payment to database using the API utility
        const { api } = await import('../../utils/api');
        const paymentResponse = await api.orders.updatePayment(order.id, {
          payment_status: 'paid',
          payment_method: 'cash'
        });

        if (!paymentResponse.ok) {
          throw new Error(`Payment update failed: ${paymentResponse.statusText}`);
        }

        const paymentResult = await paymentResponse.json();
        console.log('Payment saved to database:', paymentResult);

        // Generate receipt data for cash payment
        const receipt = {
          orderNumber: order.order_number,
          date: new Date().toISOString(),
          items: (order as any).order_items || (order as any).items || [],
          subtotal,
          tax,
          total,
          paymentMethod: 'cash',
          amountPaid: paymentData.amountPaid,
          change: paymentData.change,
          isOfflineCash: paymentData.isOfflineCash
        };
        
        console.log('Generated cash payment receipt:', receipt);

        setReceiptData(receipt);
        setShowReceipt(true);
        onReceiptGenerated(receipt);

        // Automatically print receipt
        setTimeout(() => {
          handlePrintReceipt();
        }, 1000);

      } catch (err) {
        console.error('Cash payment processing failed:', err);
        setError('Cash payment processing failed. Please try again.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Handle other payment methods (GCash, Card, etc.) - for now, treat as cash
    setError('This payment method is not yet implemented. Please use Cash or PayMongo.');
  };

  const handlePrintReceipt = () => {
    if (receiptData) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generateReceiptHTML(receiptData));
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownloadReceipt = () => {
    if (receiptData) {
      const receiptHTML = generateReceiptHTML(receiptData);
      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${order.order_number}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleFinalizeOrder = async () => {
    try {
      // Ensure payment is saved to database before finalizing
      if (receiptData && receiptData.paymentMethod === 'cash') {
        const { api } = await import('../../utils/api');
        const paymentResponse = await api.orders.updatePayment(order.id, {
          payment_status: 'paid',
          payment_method: 'cash'
        });

        if (!paymentResponse.ok) {
          throw new Error(`Payment update failed: ${paymentResponse.statusText}`);
        }

        console.log('Payment finalized and saved to database');
      }

      // Mark order as paid and finalized
      const updatedOrder = {
        ...order,
        payment_status: 'paid' as const,
        payment_method: receiptData?.paymentMethod || 'cash',
        amount_paid: receiptData?.amountPaid || paymentData.amountPaid,
        change_given: receiptData?.change || paymentData.change,
        finalized_at: new Date().toISOString()
      };

      onPaymentComplete(updatedOrder);
      onClose();
    } catch (err) {
      console.error('Error finalizing order:', err);
      setError('Failed to finalize order. Please try again.');
    }
  };

  // Handle PayMongo payment completion
  const handlePayMongoPaymentComplete = useCallback(async () => {
    console.log('PayMongo payment completed, generating receipt...');
    
    try {
      // Save PayMongo payment to database
      const { api } = await import('../../utils/api');
      const paymentResponse = await api.orders.updatePayment(order.id, {
        payment_status: 'paid',
        payment_method: 'paymongo'
      });

      if (!paymentResponse.ok) {
        throw new Error(`Payment update failed: ${paymentResponse.statusText}`);
      }

      const paymentResult = await paymentResponse.json();
      console.log('PayMongo payment saved to database:', paymentResult);
      
      // Generate receipt for PayMongo payment
      const receipt = {
        orderNumber: order.order_number,
        date: new Date().toISOString(),
        items: (order as any).order_items || (order as any).items || [],
        subtotal,
        tax,
        total,
        paymentMethod: 'paymongo',
        amountPaid: total, // PayMongo payments are exact amount
        change: 0,
        isOfflineCash: false,
        paymentIntentId: paymentIntent?.paymentIntentId
      };
      
      console.log('Generated PayMongo receipt:', receipt);
      
      setReceiptData(receipt);
      setShowReceipt(true);
      onReceiptGenerated(receipt);
      
      // Close PayMongo modal
      closePayMongoModal();
    } catch (err) {
      console.error('Error saving PayMongo payment:', err);
      setError('Failed to save PayMongo payment. Please try again.');
    }
  }, [order, subtotal, tax, total, paymentIntent, onReceiptGenerated, closePayMongoModal]);

  // Monitor PayMongo payment status
  useEffect(() => {
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      handlePayMongoPaymentComplete();
    }
  }, [paymentIntent, handlePayMongoPaymentComplete]);

  const generateReceiptHTML = (receipt: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .logo { width: 60px; height: 60px; margin: 0 auto 10px; display: block; }
          .restaurant-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .total { border-top: 1px solid #000; padding-top: 10px; margin-top: 10px; }
          .payment-info { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.svg" alt="Restaurant Logo" class="logo" onerror="this.style.display='none'">
          <div class="restaurant-name">DONG G PASTILLAN</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 10px;">Ordering Management System</div>
          <p>Order #${receipt.orderNumber}</p>
          <p>${new Date(receipt.date).toLocaleString()}</p>
        </div>
        
        <div class="items">
          ${receipt.items.map((item: any) => `
            <div class="item">
              <span>${item.menu_items?.name || item.menu_item?.name || 'Item'} x${item.quantity}</span>
              <span>₱${(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="total">
          <div class="item"><span>Subtotal:</span><span>₱${receipt.subtotal.toFixed(2)}</span></div>
          <div class="item"><span>Tax (12%):</span><span>₱${receipt.tax.toFixed(2)}</span></div>
          <div class="item"><strong><span>Total:</span><span>₱${receipt.total.toFixed(2)}</span></strong></div>
        </div>
        
        <div class="payment-info">
          <div class="item"><span>Payment Method:</span><span>${receipt.paymentMethod.toUpperCase()}</span></div>
          <div class="item"><span>Amount Paid:</span><span>₱${receipt.amountPaid.toFixed(2)}</span></div>
          ${receipt.change > 0 ? `<div class="item"><span>Change:</span><span>₱${receipt.change.toFixed(2)}</span></div>` : ''}
          ${receipt.isOfflineCash ? '<p style="color: #666; font-size: 12px; margin-top: 10px;">Offline Cash Payment</p>' : ''}
        </div>
        
        <div class="footer">
          <p>Thank you for your order!</p>
          <p>DONG G PASTILLAN - Ordering Management System</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* PayMongo Payment Modal */}
      {showPayMongoModal && paymentIntent && (
        <PayMongoPaymentModal
          paymentIntent={paymentIntent}
          isCheckingStatus={isCheckingStatus}
          isCancelling={isCancelling}
          error={payMongoError}
          onCancel={() => cancelPayment(paymentIntent.paymentIntentId)}
          onClose={closePayMongoModal}
        />
      )}

      {/* Main Payment Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Process Payment</h2>
            <p className="text-sm text-gray-600 mt-1">Order #{order.order_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!showReceipt ? (
            <>
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className={subtotal === 0 ? 'text-red-600 font-medium' : ''}>
                      ₱{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (12%):</span>
                    <span className={tax === 0 ? 'text-red-600 font-medium' : ''}>
                      ₱{tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className={total === 0 ? 'text-red-600 font-bold' : ''}>
                      ₱{total.toFixed(2)}
                    </span>
                  </div>
                </div>
                {total === 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    ⚠️ Warning: Order total is ₱0.00. Please check if order items are properly loaded.
                  </div>
                )}
              </div>

              {/* Discount Selector */}
              {onApplyDiscount && (
                <DiscountSelector
                  orderAmount={total}
                  onDiscountSelect={setSelectedDiscount}
                  selectedDiscount={selectedDiscount}
                  onApplyDiscount={handleApplyDiscount}
                  isApplyingDiscount={isApplyingDiscount}
                />
              )}

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                {isLoadingMethods ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading payment methods...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Online Payment Methods */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <QrCode className="h-4 w-4 mr-2 text-blue-600" />
                        Online Payments
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {paymentMethods.filter(method => method.is_online).map((method) => (
                          <button
                            key={method.method_key}
                            onClick={() => handlePaymentMethodChange(method.method_key)}
                            className={`p-3 border-2 rounded-lg text-left transition-all duration-200 ${
                              paymentData.paymentMethod === method.method_key
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {method.method_key === 'paymongo' ? (
                                <QrCode className="h-4 w-4" />
                              ) : (
                                <CreditCard className="h-4 w-4" />
                              )}
                              <span className="font-medium">{method.method_name}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{method.method_description}</p>
                            {method.method_key === 'paymongo' && (
                              <p className="text-xs text-blue-600 mt-1 font-medium">✓ QR Code Generation</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cash Payment Method */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                        Cash Payment
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => handlePaymentMethodChange('cash')}
                          className={`p-3 border-2 rounded-lg text-left transition-all duration-200 ${
                            paymentData.paymentMethod === 'cash'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">Cash Payment</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Physical cash payment with change calculation</p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Amount Input - Only for cash payments */}
              {paymentData.paymentMethod === 'cash' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentData.amountPaid || ''}
                    onChange={(e) => handleAmountPaidChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount paid"
                    required
                  />
                  
                  {paymentData.change > 0 && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Change: ₱{paymentData.change.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Online Payment Info */}
              {paymentData.paymentMethod === 'paymongo' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">Online Payment Selected</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    QR code will be generated for customer to scan and pay online (GCash, GrabPay, Maya, QR Ph)
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleProcessPayment}
                  disabled={
                    isProcessing || 
                    !paymentData.paymentMethod || 
                    (paymentData.paymentMethod === 'cash' && paymentData.amountPaid < total)
                  }
                  className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    paymentData.paymentMethod === 'paymongo' 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : paymentData.paymentMethod === 'paymongo' ? (
                    <QrCode className="h-4 w-4" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  <span>
                    {isProcessing 
                      ? 'Processing...' 
                      : paymentData.paymentMethod === 'paymongo'
                        ? 'Generate QR Code'
                        : 'Process Payment'
                    }
                  </span>
                </button>
                
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            /* Receipt Display */
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600">Receipt generated for Order #{order.order_number}</p>
              </div>

              {/* Receipt Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors duration-200"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
                
                <button
                  onClick={handleDownloadReceipt}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 transition-colors duration-200"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>

              {/* Finalize Order */}
              <div className="border-t pt-6">
                <button
                  onClick={handleFinalizeOrder}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 transition-colors duration-200 font-medium"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Finalize Order</span>
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  This will lock the order and mark it as completed
                </p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
};

export default EnhancedPaymentModal;

