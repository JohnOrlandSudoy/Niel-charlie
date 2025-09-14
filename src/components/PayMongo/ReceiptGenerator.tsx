import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Mail, 
  X, 
  Loader2, 
  FileText, 
  Calendar,
  User,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../utils/api';

interface ReceiptData {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone?: string;
    orderType: string;
    tableNumber?: number;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    createdAt: string;
    status: string;
  };
  items: Array<{
    id: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customizations?: any[];
    addons?: any[];
    specialInstructions?: string;
  }>;
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
  }>;
  summary: {
    totalPayments: number;
    successfulPayments: number;
    totalAmount: number;
  };
}

interface ReceiptGeneratorProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  orderId,
  isOpen,
  onClose
}) => {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  // Fetch receipt data
  const fetchReceiptData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.orders.getReceipt(orderId);
      const result = await response.json();
      
      if (result.success && result.data) {
        setReceiptData(result.data);
      } else {
        setError(result.message || 'Failed to fetch receipt data');
      }
    } catch (err) {
      console.error('Error fetching receipt data:', err);
      setError('Failed to fetch receipt data');
    } finally {
      setLoading(false);
    }
  };

  // Load receipt data when modal opens
  useEffect(() => {
    if (isOpen && orderId) {
      fetchReceiptData();
    }
  }, [isOpen, orderId]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Print receipt
  const handlePrint = () => {
    setIsPrinting(true);
    const printWindow = window.open('', '_blank');
    if (printWindow && receiptData) {
      printWindow.document.write(generatePrintHTML());
      printWindow.document.close();
      printWindow.print();
      setIsPrinting(false);
    }
  };

  // Email receipt (placeholder - would need backend implementation)
  const handleEmail = async () => {
    try {
      setIsEmailing(true);
      // This would call an email endpoint
      // await api.orders.emailReceipt(orderId, { email: customerEmail });
      alert('Email receipt functionality would be implemented here');
    } catch (err) {
      console.error('Error emailing receipt:', err);
    } finally {
      setIsEmailing(false);
    }
  };

  // Download receipt as PDF (placeholder)
  const handleDownload = () => {
    // This would generate and download a PDF
    alert('PDF download functionality would be implemented here');
  };

  // Generate HTML for printing
  const generatePrintHTML = () => {
    if (!receiptData) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receiptData.order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .order-info { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f5f5f5; }
          .totals { text-align: right; margin-top: 20px; }
          .payment-info { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RestaurantOS</h1>
          <h2>RECEIPT</h2>
          <p>Order #${receiptData.order.orderNumber}</p>
        </div>
        
        <div class="order-info">
          <p><strong>Customer:</strong> ${receiptData.order.customerName}</p>
          ${receiptData.order.customerPhone ? `<p><strong>Phone:</strong> ${receiptData.order.customerPhone}</p>` : ''}
          <p><strong>Order Type:</strong> ${receiptData.order.orderType.replace('_', ' ').toUpperCase()}</p>
          ${receiptData.order.tableNumber ? `<p><strong>Table:</strong> ${receiptData.order.tableNumber}</p>` : ''}
          <p><strong>Date:</strong> ${formatDate(receiptData.order.createdAt)}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${receiptData.items.map(item => `
              <tr>
                <td>
                  ${item.menuItemName}
                  ${item.customizations && item.customizations.length > 0 ? 
                    `<br><small>Customizations: ${item.customizations.map(c => c.name).join(', ')}</small>` : ''}
                  ${item.addons && item.addons.length > 0 ? 
                    `<br><small>Add-ons: ${item.addons.map(a => a.name).join(', ')}</small>` : ''}
                  ${item.specialInstructions ? `<br><small>Note: ${item.specialInstructions}</small>` : ''}
                </td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${formatCurrency(item.totalPrice)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <p><strong>Subtotal:</strong> ${formatCurrency(receiptData.order.subtotal)}</p>
          <p><strong>Discount:</strong> -${formatCurrency(receiptData.order.discount)}</p>
          <p><strong>Tax:</strong> ${formatCurrency(receiptData.order.tax)}</p>
          <p><strong>Total:</strong> ${formatCurrency(receiptData.order.total)}</p>
        </div>

        <div class="payment-info">
          <h3>Payment Details</h3>
          ${receiptData.payments.map(payment => `
            <p><strong>Method:</strong> ${payment.paymentMethod.toUpperCase()}</p>
            <p><strong>Amount:</strong> ${formatCurrency(payment.amount / 100)}</p>
            <p><strong>Status:</strong> ${payment.status.toUpperCase()}</p>
            ${payment.paidAt ? `<p><strong>Paid At:</strong> ${formatDate(payment.paidAt)}</p>` : ''}
            ${payment.externalReferenceNumber ? `<p><strong>Reference:</strong> ${payment.externalReferenceNumber}</p>` : ''}
            ${payment.feeAmount > 0 ? `<p><strong>Fee:</strong> ${formatCurrency(payment.feeAmount / 100)}</p>` : ''}
            <p><strong>Net Amount:</strong> ${formatCurrency(payment.netAmount / 100)}</p>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p><em>Thank you for your business!</em></p>
        </div>
      </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Order Receipt
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading receipt...</span>
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
          ) : receiptData ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b-2 border-gray-300 pb-6">
                <h1 className="text-2xl font-bold text-gray-900">RestaurantOS</h1>
                <h2 className="text-lg font-semibold text-gray-700">RECEIPT</h2>
                <p className="text-sm text-gray-600">Order #{receiptData.order.orderNumber}</p>
              </div>

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Customer Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {receiptData.order.customerName}</p>
                    {receiptData.order.customerPhone && (
                      <p className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        <span className="font-medium">Phone:</span> {receiptData.order.customerPhone}
                      </p>
                    )}
                    <p><span className="font-medium">Order Type:</span> {receiptData.order.orderType.replace('_', ' ').toUpperCase()}</p>
                    {receiptData.order.tableNumber && (
                      <p><span className="font-medium">Table:</span> {receiptData.order.tableNumber}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Order Details
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Date:</span> {formatDate(receiptData.order.createdAt)}</p>
                    <p><span className="font-medium">Status:</span> {receiptData.order.status.toUpperCase()}</p>
                    <p><span className="font-medium">Order ID:</span> {receiptData.order.id}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Qty</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Price</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {receiptData.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm">
                            <div>
                              <p className="font-medium">{item.menuItemName}</p>
                              {item.customizations && item.customizations.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  Customizations: {item.customizations.map(c => c.name).join(', ')}
                                </p>
                              )}
                              {item.addons && item.addons.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  Add-ons: {item.addons.map(a => a.name).join(', ')}
                                </p>
                              )}
                              {item.specialInstructions && (
                                <p className="text-xs text-gray-500 italic">
                                  Note: {item.specialInstructions}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(receiptData.order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="text-red-600">-{formatCurrency(receiptData.order.discount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(receiptData.order.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(receiptData.order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Details
                </h3>
                {receiptData.payments.map((payment, index) => (
                  <div key={payment.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><span className="font-medium">Method:</span> {payment.paymentMethod.toUpperCase()}</p>
                        <p><span className="font-medium">Amount:</span> {formatCurrency(payment.amount / 100)}</p>
                        <p><span className="font-medium">Status:</span> 
                          <span className={`ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status === 'succeeded' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {payment.status.toUpperCase()}
                          </span>
                        </p>
                      </div>
                      <div>
                        {payment.paidAt && (
                          <p><span className="font-medium">Paid At:</span> {formatDate(payment.paidAt)}</p>
                        )}
                        {payment.externalReferenceNumber && (
                          <p><span className="font-medium">Reference:</span> {payment.externalReferenceNumber}</p>
                        )}
                        {payment.feeAmount > 0 && (
                          <p><span className="font-medium">Fee:</span> {formatCurrency(payment.feeAmount / 100)}</p>
                        )}
                        <p><span className="font-medium">Net Amount:</span> {formatCurrency(payment.netAmount / 100)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handleEmail}
                  disabled={isEmailing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isEmailing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  <span>Email Receipt</span>
                </button>
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {isPrinting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ReceiptGenerator;
