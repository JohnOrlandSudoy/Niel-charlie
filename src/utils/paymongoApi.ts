// PayMongo API utility functions for admin dashboard
import { api } from './api';

// PayMongo Payment Status Response Interface
export interface PayMongoPaymentStatusResponse {
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

// PayMongo API functions for admin dashboard
export const payMongoApi = {
  // Get all PayMongo payments (admin only)
  getAllPayments: async (params?: {
    page?: number;
    limit?: number;
    status?: PayMongoPaymentStatus;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/paymongo/payments?${queryString}` : '/paymongo/payments';
    return api.payments.getStatus(endpoint);
  },

  // Get payment status by ID
  getPaymentStatus: async (paymentIntentId: string): Promise<PayMongoPaymentStatusResponse> => {
    const response = await api.payments.getStatus(paymentIntentId);
    return response.json();
  },

  // Cancel payment
  cancelPayment: async (paymentIntentId: string) => {
    return api.payments.cancel(paymentIntentId);
  },

  // Get payment statistics
  getPaymentStats: async () => {
    const response = await api.payments.getStatus('/paymongo/stats');
    return response.json();
  },

  // Export payments data
  exportPayments: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: PayMongoPaymentStatus;
    format?: 'csv' | 'excel' | 'pdf';
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.format) queryParams.append('format', params.format);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/paymongo/export?${queryString}` : '/paymongo/export';
    return api.payments.getStatus(endpoint);
  }
};

// Example usage in the hook:
/*
// In usePayMongoAdmin.ts, replace the mock data with:
const loadPayments = useCallback(async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    const response = await payMongoApi.getAllPayments({
      page: 1,
      limit: 50
    });
    const result = await response.json();
    
    if (result.success && result.data) {
      setPayments(result.data);
    } else {
      setError(result.message || 'Failed to load payments');
    }
  } catch (err) {
    console.error('Error loading payments:', err);
    setError('Failed to load PayMongo payments. Please try again.');
  } finally {
    setIsLoading(false);
  }
}, []);
*/
