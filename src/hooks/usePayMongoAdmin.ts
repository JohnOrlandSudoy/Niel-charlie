import { useState, useCallback, useMemo } from 'react';
import { api } from '../utils/api';

// PayMongo Payment Status Response Interface (for reference)
interface _PayMongoPaymentStatusResponse {
  success: boolean;
  data: {
    paymentIntentId: string;
    status: PayMongoPaymentStatus;
    amount: number;
    currency: string;
    description: string;
    metadata: {
      orderId: string;
      timestamp: string;
      customer_phone?: string;
      orderNumber: string;
      customerName: string;
      createdBy: string;
      orderType: string;
      createdByUsername: string;
      order_type: string;
    };
    created_at: number;
    updated_at: number;
  };
}

export type PayMongoPaymentStatus = 
  | 'awaiting_payment_method'
  | 'awaiting_next_action'
  | 'processing'
  | 'succeeded'
  | 'cancelled'
  | 'failed';

export interface PayMongoPayment {
  paymentIntentId: string;
  status: PayMongoPaymentStatus;
  amount: number;
  currency: string;
  description: string;
  metadata: {
    orderId: string;
    timestamp: string;
    customer_phone?: string;
    orderNumber: string;
    customerName: string;
    createdBy: string;
    orderType: string;
    createdByUsername: string;
    order_type: string;
  };
  created_at: number;
  updated_at: number;
}

export const usePayMongoAdmin = () => {
  const [payments, setPayments] = useState<PayMongoPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PayMongoPayment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);

  // Mock payment data for demonstration - replace with actual API calls
  const _mockPayments: PayMongoPayment[] = [
    {
      paymentIntentId: 'pi_EostntdQe4tS6TP1fEFFCvA8',
      status: 'awaiting_next_action',
      amount: 4704,
      currency: 'PHP',
      description: 'Payment for Order #ORD-20250910-0001',
      metadata: {
        orderId: '40387a08-cc0f-42cd-94bc-c16835123399',
        timestamp: '2025-09-10T12:09:49.354Z',
        customer_phone: '39437845',
        orderNumber: 'ORD-20250910-0001',
        customerName: 'test',
        createdBy: '3208eac9-bd2d-407d-a5cb-1887b9d154c8',
        orderType: 'dine_in',
        createdByUsername: 'cashier1',
        order_type: 'dine_in'
      },
      created_at: 1757506189,
      updated_at: 1757506190
    },
    {
      paymentIntentId: 'pi_ExamplePaymentIntent2',
      status: 'succeeded',
      amount: 2500,
      currency: 'PHP',
      description: 'Payment for Order #ORD-20250910-0002',
      metadata: {
        orderId: '40387a08-cc0f-42cd-94bc-c16835123398',
        timestamp: '2025-09-10T11:30:00.000Z',
        customer_phone: '09123456789',
        orderNumber: 'ORD-20250910-0002',
        customerName: 'John Doe',
        createdBy: '3208eac9-bd2d-407d-a5cb-1887b9d154c8',
        orderType: 'takeout',
        createdByUsername: 'cashier1',
        order_type: 'takeout'
      },
      created_at: 1757505000,
      updated_at: 1757505100
    },
    {
      paymentIntentId: 'pi_ExamplePaymentIntent3',
      status: 'failed',
      amount: 1800,
      currency: 'PHP',
      description: 'Payment for Order #ORD-20250910-0003',
      metadata: {
        orderId: '40387a08-cc0f-42cd-94bc-c16835123397',
        timestamp: '2025-09-10T10:15:00.000Z',
        customer_phone: '09876543210',
        orderNumber: 'ORD-20250910-0003',
        customerName: 'Jane Smith',
        createdBy: '3208eac9-bd2d-407d-a5cb-1887b9d154c8',
        orderType: 'dine_in',
        createdByUsername: 'cashier2',
        order_type: 'dine_in'
      },
      created_at: 1757504000,
      updated_at: 1757504100
    },
    {
      paymentIntentId: 'pi_ExamplePaymentIntent4',
      status: 'processing',
      amount: 3200,
      currency: 'PHP',
      description: 'Payment for Order #ORD-20250910-0004',
      metadata: {
        orderId: '40387a08-cc0f-42cd-94bc-c16835123396',
        timestamp: '2025-09-10T13:45:00.000Z',
        customer_phone: '09111222333',
        orderNumber: 'ORD-20250910-0004',
        customerName: 'Mike Johnson',
        createdBy: '3208eac9-bd2d-407d-a5cb-1887b9d154c8',
        orderType: 'dine_in',
        createdByUsername: 'cashier1',
        order_type: 'dine_in'
      },
      created_at: 1757506500,
      updated_at: 1757506500
    },
    {
      paymentIntentId: 'pi_ExamplePaymentIntent5',
      status: 'cancelled',
      amount: 1500,
      currency: 'PHP',
      description: 'Payment for Order #ORD-20250910-0005',
      metadata: {
        orderId: '40387a08-cc0f-42cd-94bc-c16835123395',
        timestamp: '2025-09-10T09:20:00.000Z',
        customer_phone: '09444555666',
        orderNumber: 'ORD-20250910-0005',
        customerName: 'Sarah Wilson',
        createdBy: '3208eac9-bd2d-407d-a5cb-1887b9d154c8',
        orderType: 'takeout',
        createdByUsername: 'cashier2',
        order_type: 'takeout'
      },
      created_at: 1757503500,
      updated_at: 1757503600
    }
  ];

  // Fetch payment status for a specific payment intent (through order)
  const fetchPaymentStatus = useCallback(async (_paymentIntentId: string): Promise<PayMongoPayment | null> => {
    try {
      // Since we don't have a direct payment intent endpoint, we'll need to find the order first
      // For now, return null and let the main fetch function handle this through orders
      console.warn('Direct payment intent fetching not available, using order-based approach');
      return null;
    } catch (err) {
      console.error('Error fetching payment status:', err);
      return null;
    }
  }, []);

  // Get PayMongo payments directly from orders
  const getPayMongoPaymentsFromOrders = useCallback(async (): Promise<PayMongoPayment[]> => {
    try {
      console.log('🔄 Fetching PayMongo payments from orders...');
      let allPayments: PayMongoPayment[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await api.orders.getAll({ 
          page, 
          limit: 50 // Fetch 50 orders per page
        });
        const result = await response.json();
        
        if (result.success && result.data) {
          // Filter orders that use PayMongo payment method
          const payMongoOrders = result.data.filter((order: any) => 
            order.payment_method === 'paymongo'
          );
          
          console.log(`📋 Found ${payMongoOrders.length} PayMongo orders on page ${page}`);
          
          // Convert orders to PayMongoPayment format
          const payments = payMongoOrders.map((order: any) => ({
            paymentIntentId: order.payment_intent_id || `order_${order.id}`,
            status: order.payment_status === 'paid' ? 'succeeded' : 
                   order.payment_status === 'unpaid' ? 'awaiting_payment_method' : 
                   order.payment_status || 'pending',
            amount: Math.round((order.total_amount || 0) * 100), // Convert to cents
            currency: 'PHP',
            description: `Payment for Order #${order.order_number}`,
            metadata: {
              orderId: order.id,
              orderNumber: order.order_number,
              customerName: order.customer_name || 'Walk-in Customer',
              customerPhone: order.customer_phone,
              orderType: order.order_type
            },
            qrCodeUrl: order.qr_code_url || '',
            qrCodeData: order.qr_code_data || '',
            expiresAt: order.payment_expires_at || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            order: {
              id: order.id,
              orderNumber: order.order_number,
              customerName: order.customer_name || 'Walk-in Customer',
              customerPhone: order.customer_phone,
              orderType: order.order_type,
              total: order.total_amount || 0
            },
            created_at: new Date(order.created_at).getTime() / 1000,
            updated_at: new Date(order.updated_at).getTime() / 1000
          }));
          
          allPayments = [...allPayments, ...payments];
          
          // Check if there are more pages
          hasMore = result.pagination && page < result.pagination.totalPages;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`📊 Successfully loaded ${allPayments.length} PayMongo payments from orders`);
      return allPayments;
      
    } catch (err) {
      console.error('Error fetching PayMongo payments from orders:', err);
      return [];
    }
  }, []);

  // Load all payments directly from orders
  const loadPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading PayMongo payments from orders...');
      
      // Get payments directly from orders
      const payments = await getPayMongoPaymentsFromOrders();
      
      if (payments.length === 0) {
        console.log('⚠️ No PayMongo payments found in orders');
        setPayments([]);
        return;
      }
      
      setPayments(payments);
      
      console.log('📊 Payment load results:');
      console.log(`   ✅ Successfully loaded: ${payments.length}`);
      console.log(`   📋 Total payments: ${payments.length}`);
      
    } catch (err) {
      console.error('❌ Error loading payments:', err);
      setError('Failed to load PayMongo payments. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingProgress(null);
    }
  }, [getPayMongoPaymentsFromOrders]);

  // Refresh payments
  const refreshPayments = useCallback(async () => {
    await loadPayments();
  }, [loadPayments]);

  // Filter payments
  const filterPayments = useCallback((payments: PayMongoPayment[], searchQuery: string, filterStatus: string) => {
    return payments.filter(payment => {
      const matchesSearch = searchQuery === '' || 
        payment.paymentIntentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.metadata.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.metadata.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.metadata.customer_phone?.includes(searchQuery);
      
      const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, []);

  // Calculate statistics
  const calculateStats = useCallback((payments: PayMongoPayment[]) => {
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.status === 'succeeded').length;
    const pendingPayments = payments.filter(p => ['awaiting_payment_method', 'awaiting_next_action', 'processing'].includes(p.status)).length;
    const failedPayments = payments.filter(p => ['failed', 'cancelled'].includes(p.status)).length;
    const totalAmount = payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      totalAmount
    };
  }, []);

  // Format amount
  const formatAmount = useCallback((amount: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  }, []);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status: PayMongoPaymentStatus) => {
    switch (status) {
      case 'succeeded':
        return 'CheckCircle';
      case 'cancelled':
      case 'failed':
        return 'XCircle';
      case 'processing':
        return 'Clock';
      default:
        return 'Clock';
    }
  }, []);

  // Get status color
  const getStatusColor = useCallback((status: PayMongoPaymentStatus) => {
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

  // Get status message
  const getStatusMessage = useCallback((status: PayMongoPaymentStatus) => {
    switch (status) {
      case 'awaiting_payment_method':
        return 'Waiting for customer to scan QR code';
      case 'awaiting_next_action':
        return 'Customer selected payment method';
      case 'processing':
        return 'Payment is being processed';
      case 'succeeded':
        return 'Payment completed successfully';
      case 'cancelled':
        return 'Payment was cancelled';
      case 'failed':
        return 'Payment failed';
      default:
        return 'Unknown status';
    }
  }, []);

  // Handle view payment details
  const handleViewDetails = useCallback((payment: PayMongoPayment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  }, []);

  // Handle close details modal
  const handleCloseDetails = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedPayment(null);
  }, []);

  // Copy to clipboard
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Memoized statistics
  const stats = useMemo(() => calculateStats(payments), [payments, calculateStats]);

  return {
    // State
    payments,
    isLoading,
    error,
    selectedPayment,
    showDetailsModal,
    loadingProgress,
    stats,

    // Actions
    loadPayments,
    refreshPayments,
    fetchPaymentStatus,
    filterPayments,
    handleViewDetails,
    handleCloseDetails,
    handleCopy,

    // Utilities
    formatAmount,
    formatTimestamp,
    getStatusIcon,
    getStatusColor,
    getStatusMessage,

    // Setters
    setError
  };
};
