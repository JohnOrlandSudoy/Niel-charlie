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

// PayMongo Webhook Types
export interface PayMongoWebhookEvent {
  id: string;
  type: PayMongoWebhookEventType;
  data: PayMongoWebhookData;
}

export type PayMongoWebhookEventType = 
  | 'payment.paid'
  | 'payment.failed'
  | 'payment_intent.cancelled'
  | 'qrph.expired';

export interface PayMongoWebhookData {
  id: string;
  attributes: PayMongoWebhookAttributes;
}

export interface PayMongoWebhookAttributes {
  amount: number;
  currency: string;
  status: PayMongoPaymentStatus;
  metadata: {
    orderId: string;
    orderNumber?: string;
  };
  fee?: number;
  net_amount?: number;
  external_reference_number?: string;
  failed_code?: string;
  failed_message?: string;
}

export interface PayMongoWebhookResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    orderNumber: string;
    paymentStatus: string;
    paymentMethod: string;
  };
}
