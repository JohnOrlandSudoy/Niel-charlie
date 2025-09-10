export interface PayMongoPaymentRequest {
  description: string;
  metadata: {
    customer_phone?: string;
    order_type: string;
  };
}

export interface PayMongoPaymentResponse {
  success: boolean;
  message: string;
  data: {
    paymentIntentId: string;
    status: PayMongoPaymentStatus;
    amount: number;
    currency: string;
    expiresAt: string;
    qrCodeUrl: string;
    qrCodeData: string;
    order: {
      id: string;
      orderNumber: string;
      totalAmount: number;
      customerName: string;
    };
  };
}

export interface PayMongoPaymentStatusResponse {
  success: boolean;
  data: {
    paymentIntentId: string;
    status: PayMongoPaymentStatus;
    amount: number;
    currency: string;
  };
}

export interface PayMongoCancelResponse {
  success: boolean;
  message: string;
  data: {
    paymentIntentId: string;
    status: PayMongoPaymentStatus;
    amount: number;
    currency: string;
  };
}

export type PayMongoPaymentStatus = 
  | 'awaiting_payment_method'
  | 'awaiting_next_action'
  | 'processing'
  | 'succeeded'
  | 'cancelled'
  | 'failed';

export interface PayMongoPaymentIntent {
  paymentIntentId: string;
  status: PayMongoPaymentStatus;
  amount: number;
  currency: string;
  expiresAt: string;
  qrCodeUrl: string;
  qrCodeData: string;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    customerName: string;
  };
}

export interface PayMongoPaymentUpdate {
  payment_status: 'paid' | 'unpaid' | 'refunded';
  payment_method: 'paymongo' | 'cash';
}
