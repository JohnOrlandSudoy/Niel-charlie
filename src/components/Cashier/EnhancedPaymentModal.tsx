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
  cashOnly?: boolean;
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
  onApplyDiscount,
  cashOnly = false
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
  const [currentOrder, setCurrentOrder] = useState<ApiOrder>(order);
  const [isLoadingDiscount, setIsLoadingDiscount] = useState(false);

  // Update currentOrder when order prop changes
  useEffect(() => {
    setCurrentOrder(order);
    console.log('🔍 EnhancedPaymentModal: Order prop updated:', order);
  }, [order]);

  // Handle discount application
  const handleApplyDiscount = useCallback(async (discount: Discount) => {
    if (!onApplyDiscount) return;
    
    setIsLoadingDiscount(true);
    setIsApplyingDiscount(true);
    
    try {
      console.log('🔍 Applying discount:', discount);
      const result = await onApplyDiscount(order.id, discount.code);
      
      if (result) {
        console.log('🔍 Discount applied successfully:', result);
        console.log('🔍 Full result data:', result);
        
        // Update the current order with the new discounted totals
        const updatedOrder = {
          ...currentOrder,
          ...result, // This includes the updated totals with discount applied
          discount_applied: result.discount_applied || discount.code,
          discount_amount: result.discount_amount || 0,
          subtotal: result.subtotal || currentOrder.subtotal,
          tax_amount: result.tax_amount || currentOrder.tax_amount,
          total_amount: result.total_amount || currentOrder.total_amount
        };
        
        console.log('🔍 Updating currentOrder with discount:', updatedOrder);
        console.log('🔍 Discount fields in updated order:', {
          discount_applied: updatedOrder.discount_applied,
          discount_amount: updatedOrder.discount_amount
        });
        
        setCurrentOrder(updatedOrder);
        setSelectedDiscount(discount);
        
        // Add a small delay to ensure the state update is visible
        setTimeout(() => {
          setIsLoadingDiscount(false);
          setIsApplyingDiscount(false);
        }, 1000);
      } else {
        console.log('🔍 No result from discount application');
        setIsLoadingDiscount(false);
        setIsApplyingDiscount(false);
      }
    } catch (error) {
      console.error('🔍 Error applying discount:', error);
      setError('Failed to apply discount');
      setIsLoadingDiscount(false);
      setIsApplyingDiscount(false);
    }
  }, [onApplyDiscount, order.id, currentOrder]);

  // Calculate totals - handle different possible field names and fallback calculation
  const calculateTotals = () => {
    let baseSubtotal, baseTax, baseTotal;
    
    // First try to use pre-calculated totals
    if (currentOrder.subtotal && currentOrder.tax_amount && currentOrder.total_amount) {
      baseSubtotal = currentOrder.subtotal;
      baseTax = currentOrder.tax_amount;
      baseTotal = currentOrder.total_amount;
    } else {
      // Fallback: calculate from order items
      const orderItems = (currentOrder as any).order_items || (currentOrder as any).items || [];
      baseSubtotal = orderItems.reduce((sum: number, item: any) => {
        const itemTotal = (item.unit_price || item.price || 0) * (item.quantity || 1);
        return sum + itemTotal;
      }, 0);
      
      baseTax = baseSubtotal * 0.12; // 12% VAT
      baseTotal = baseSubtotal + baseTax;
    }
    
    // Apply discount if available
    const discountApplied = (currentOrder as any).discount_applied;
    const discountCode = discountApplied?.code || discountApplied || (currentOrder as any).discount_code || selectedDiscount?.code || null;
    const discountAmount = (currentOrder as any).discount_amount || (currentOrder as any).discountAmount || 0;
    
    console.log('🔍 CALCULATION DEBUG:', {
      baseSubtotal,
      baseTax,
      baseTotal,
      discountCode,
      discountAmount,
      selectedDiscount: selectedDiscount
    });
    
    // FIXED: Prevent discounts from exceeding order total
    const maxAllowedDiscount = baseTotal;
    const actualDiscountAmount = Math.min(discountAmount, maxAllowedDiscount);
    
    // Calculate final total after discount (ensure it's never negative)
    const finalTotal = Math.max(0, baseTotal - actualDiscountAmount);
    
    // Log validation
    if (discountAmount > maxAllowedDiscount) {
      console.warn('🚨 DISCOUNT VALIDATION: Discount amount exceeds order total, capped at order total', {
        originalDiscount: discountAmount,
        maxAllowed: maxAllowedDiscount,
        actualDiscount: actualDiscountAmount,
        finalTotal
      });
    }
    
    return {
      subtotal: baseSubtotal,
      tax: baseTax,
      total: finalTotal,
      originalTotal: baseTotal,
      discountAmount: actualDiscountAmount
    };
  };
  
  const { subtotal, tax, total, originalTotal } = calculateTotals();
  
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


  const handleProcessPayment = async () => {
    if (!paymentData.paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    // FIXED: Validate that order total is not negative
    if (total < 0) {
      setError('Order total cannot be negative. Please check discount amount.');
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

      // FIXED: Additional validation for cash payments
      if (total <= 0) {
        setError('Order total must be greater than zero');
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
        
        // Debug discount data specifically
        console.log('🔍 DISCOUNT DEBUG - Order discount fields:', {
          discount_applied: (order as any).discount_applied,
          discount_amount: (order as any).discount_amount,
          discount_code: (order as any).discount_code,
          discountAmount: (order as any).discountAmount,
          allOrderKeys: Object.keys(order)
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

        // Extract discount information with comprehensive fallback handling
        const discountApplied = (currentOrder as any).discount_applied;
        const discountCode = discountApplied?.code || discountApplied || (currentOrder as any).discount_code || selectedDiscount?.code || null;
        const discountAmount = (currentOrder as any).discount_amount || (currentOrder as any).discountAmount || 0;
        
        // Calculate discount amount if not available but we have a selected discount
        let finalDiscountAmount = discountAmount;
        if (finalDiscountAmount === 0 && selectedDiscount && total < (subtotal + tax)) {
          finalDiscountAmount = (subtotal + tax) - total;
        }
        
        console.log('Extracting discount data for receipt:', {
          discountApplied,
          discountCode,
          discountAmount,
          orderKeys: Object.keys(order),
          fullOrder: order
        });

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
          isOfflineCash: paymentData.isOfflineCash,
          discountCode,
          discountAmount: finalDiscountAmount
        };
        
        console.log('Generated cash payment receipt:', receipt);
        console.log('🔍 RECEIPT DISCOUNT DEBUG:', {
          receiptDiscountCode: receipt.discountCode,
          receiptDiscountAmount: receipt.discountAmount,
          discountCode,
          discountAmount,
          orderDiscountApplied: (order as any).discount_applied,
          orderDiscountAmount: (order as any).discount_amount,
          currentOrderDiscountApplied: (currentOrder as any).discount_applied,
          currentOrderDiscountAmount: (currentOrder as any).discount_amount
        });

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
    
    // Debug discount data for PayMongo payments
    console.log('🔍 PAYMONGO DISCOUNT DEBUG - Order discount fields:', {
      discount_applied: (order as any).discount_applied,
      discount_amount: (order as any).discount_amount,
      discount_code: (order as any).discount_code,
      discountAmount: (order as any).discountAmount,
      allOrderKeys: Object.keys(order)
    });
    
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
      
      // Extract discount information with comprehensive fallback handling
      const discountApplied = (currentOrder as any).discount_applied;
      const discountCode = discountApplied?.code || discountApplied || (currentOrder as any).discount_code || selectedDiscount?.code || null;
      const discountAmount = (currentOrder as any).discount_amount || (currentOrder as any).discountAmount || 0;
      
      // Calculate discount amount if not available but we have a selected discount
      let finalDiscountAmount = discountAmount;
      if (finalDiscountAmount === 0 && selectedDiscount && total < (subtotal + tax)) {
        finalDiscountAmount = (subtotal + tax) - total;
      }
      
      console.log('Extracting discount data for PayMongo receipt:', {
        discountApplied,
        discountCode,
        discountAmount,
        orderKeys: Object.keys(order),
        fullOrder: order
      });

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
        paymentIntentId: paymentIntent?.paymentIntentId,
        discountCode,
        discountAmount: finalDiscountAmount
      };
      
      console.log('Generated PayMongo receipt:', receipt);
      console.log('🔍 PAYMONGO RECEIPT DISCOUNT DEBUG:', {
        receiptDiscountCode: receipt.discountCode,
        receiptDiscountAmount: receipt.discountAmount,
        discountCode,
        discountAmount,
        orderDiscountApplied: (order as any).discount_applied,
        orderDiscountAmount: (order as any).discount_amount,
        currentOrderDiscountApplied: (currentOrder as any).discount_applied,
        currentOrderDiscountAmount: (currentOrder as any).discount_amount
      });
      
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
    console.log('generateReceiptHTML called with receipt data:', receipt);
    console.log('Discount data in receipt:', {
      discountCode: receipt.discountCode,
      discountAmount: receipt.discountAmount
    });
    
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
          ${receipt.discountCode && receipt.discountAmount ? `
            <div class="item" style="color: #059669; border-top: 1px solid #e5e7eb; padding-top: 5px; margin-top: 5px;">
              <span>Discount (${receipt.discountCode}):</span><span>-₱${receipt.discountAmount.toFixed(2)}</span>
            </div>
            <div style="font-size: 10px; color: #059669; margin-left: 10px; margin-bottom: 5px;">
              Original Total: ₱${(receipt.subtotal + receipt.tax).toFixed(2)}<br>
              You Saved: ₱${receipt.discountAmount.toFixed(2)}
            </div>
          ` : ''}
          <div class="item" style="border-top: 2px solid #000; padding-top: 8px; margin-top: 8px;"><strong><span>Total:</span><span>₱${receipt.total.toFixed(2)}</span></strong></div>
        </div>
        
        <div class="payment-info">
          <div class="item"><span>Payment Method:</span><span>${receipt.paymentMethod.toUpperCase()}</span></div>
          <div class="item"><span>Amount Paid:</span><span>₱${receipt.amountPaid.toFixed(2)}</span></div>
          ${receipt.change > 0 ? `<div class="item"><span>Change:</span><span>₱${receipt.change.toFixed(2)}</span></div>` : ''}
          ${receipt.isOfflineCash ? '<p style="color: #666; font-size: 12px; margin-top: 10px;">Offline Cash Payment</p>' : ''}
        </div>
        
        ${receipt.discountCode && receipt.discountAmount ? `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; margin: 15px 0; text-align: center;">
            <p style="color: #059669; font-weight: bold; margin: 0; font-size: 14px;">
              💰 You saved ₱${receipt.discountAmount.toFixed(2)} with ${receipt.discountCode}!
            </p>
          </div>
        ` : ''}
        
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Process Payment</h2>
                <p className="text-sm text-gray-600 mt-1 truncate">Order #{order.order_number}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                aria-label="Close payment modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
          {!showReceipt ? (
            <>
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Order Summary</h3>
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
                  
                  {/* Simple discount display matching the desired approach */}
                  {(() => {
                    // Show loading state when applying discount
                    if (isLoadingDiscount) {
                      return (
                        <div className="flex justify-between">
                          <span>discount:</span>
                          <span className="text-red-600 font-medium flex items-center">
                            <Loader2 className="animate-spin h-4 w-4 mr-1" />
                            Applying...
                          </span>
                        </div>
                      );
                    }
                    
                    // Extract discount information with comprehensive fallback handling
                    const discountApplied = (currentOrder as any).discount_applied;
                    const discountCode = discountApplied?.code || discountApplied || (currentOrder as any).discount_code || selectedDiscount?.code || null;
                    const discountAmount = (currentOrder as any).discount_amount || (currentOrder as any).discountAmount || 0;
                    
                    console.log('🔍 ORDER SUMMARY DISCOUNT DEBUG:', {
                      discountApplied,
                      discountCode,
                      discountAmount,
                      selectedDiscount: selectedDiscount,
                      currentOrderKeys: Object.keys(currentOrder),
                      originalOrderKeys: Object.keys(order)
                    });
                    
                    // Show discount if we have either the discount data or a selected discount
                    if ((discountCode && discountAmount > 0) || selectedDiscount) {
                      // Use the actual discount amount from the order, not a fallback
                      const actualDiscountAmount = discountAmount > 0 ? discountAmount : 0;
                      
                      console.log('🔍 DISCOUNT DISPLAY DEBUG:', {
                        discountAmount,
                        actualDiscountAmount,
                        selectedDiscount,
                        discountCode
                      });
                      
                      return (
                        <div className="flex justify-between">
                          <span>discount:</span>
                          <span className="text-red-600 font-medium">-{actualDiscountAmount.toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className={total === 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                      ₱{originalTotal.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Show final discounted total in red if discount is applied */}
                  {(() => {
                    // Show loading state when applying discount
                    if (isLoadingDiscount) {
                      return (
                        <div className="flex justify-between font-medium text-lg">
                          <span>total:</span>
                          <span className="text-red-600 font-bold flex items-center">
                            <Loader2 className="animate-spin h-4 w-4 mr-1" />
                            Calculating...
                          </span>
                        </div>
                      );
                    }
                    
                    const discountApplied = (currentOrder as any).discount_applied;
                    const discountCode = discountApplied?.code || discountApplied || (currentOrder as any).discount_code || selectedDiscount?.code || null;
                    const discountAmount = (currentOrder as any).discount_amount || (currentOrder as any).discountAmount || 0;
                    
                    // Show final total if we have either the discount data or a selected discount
                    if ((discountCode && discountAmount > 0) || selectedDiscount) {
                      return (
                        <div className="flex justify-between font-medium text-lg">
                          <span>total:</span>
                          <span className="text-red-600 font-bold">
                            ₱{total.toFixed(2)}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
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
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                {isLoadingMethods ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading payment methods...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Check if any payment methods are available */}
                    {paymentMethods.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No Payment Methods Available</p>
                        <p className="text-sm mt-1">Please enable payment methods in Settings to process payments.</p>
                      </div>
                    ) : (
                      <>
                        {/* Online Payment Methods - Only show if not cashOnly */}
                        {!cashOnly && paymentMethods.filter(method => method.is_online).length > 0 && (
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
                            className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-all duration-200 touch-manipulation min-h-[60px] ${
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
                            <p className="text-xs text-gray-600 mt-1">
                              {method.method_key === 'paymongo' 
                                ? 'Digital payment via Maya, GCash, QR Ph, and GrabPay'
                                : method.method_description
                              }
                            </p>
                            {method.method_key === 'paymongo' && (
                              <p className="text-xs text-blue-600 mt-1 font-medium">✓ QR Code Generation</p>
                            )}
                          </button>
                        ))}
                            </div>
                          </div>
                        )}

                        {/* Cash Payment Method - Only show if cash is available */}
                    {paymentMethods.some(method => method.method_key === 'cash') && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                          {cashOnly ? 'Cash Payment' : 'Cash Payment'}
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          <button
                            onClick={() => handlePaymentMethodChange('cash')}
                            className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-all duration-200 touch-manipulation min-h-[60px] ${
                              paymentData.paymentMethod === 'cash'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium">Cash Payment</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {cashOnly 
                                ? 'Physical cash payment with change calculation' 
                                : 'Physical cash payment with change calculation'
                              }
                            </p>
                          </button>
                        </div>
                      </div>
                    )}
                      </>
                    )}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base h-12 sm:h-14 touch-manipulation"
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
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleProcessPayment}
                  disabled={
                    isProcessing || 
                    !paymentData.paymentMethod || 
                    (paymentData.paymentMethod === 'cash' && paymentData.amountPaid < total)
                  }
                  className={`flex-1 px-4 py-2 sm:py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] text-sm sm:text-base ${
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
                  className="w-full sm:w-auto px-4 py-2 sm:py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 touch-manipulation min-h-[44px] text-sm sm:text-base"
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
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors duration-200 touch-manipulation min-h-[44px] text-sm sm:text-base"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
                
                <button
                  onClick={handleDownloadReceipt}
                  className="flex-1 bg-green-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 transition-colors duration-200 touch-manipulation min-h-[44px] text-sm sm:text-base"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>

              {/* Finalize Order */}
              <div className="border-t pt-6">
                <button
                  onClick={handleFinalizeOrder}
                  className="w-full bg-green-600 text-white px-4 py-3 sm:py-3.5 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 transition-colors duration-200 font-medium touch-manipulation min-h-[48px] text-sm sm:text-base"
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

