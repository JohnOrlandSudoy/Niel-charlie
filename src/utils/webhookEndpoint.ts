// Webhook Endpoint Handler for Frontend
// This simulates receiving webhook events from the backend
import { payMongoWebhookHandler } from './paymongoWebhookHandler';
import { PayMongoWebhookEvent } from '../types/paymongo';

// Simulate webhook endpoint that would be called by the backend
export const handleWebhookEndpoint = async (webhookData: PayMongoWebhookEvent): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Received webhook event:', webhookData);
    
    // Process the webhook event
    const result = await payMongoWebhookHandler.processWebhookEvent(webhookData);
    
    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    console.error('Error handling webhook endpoint:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error processing webhook'
    };
  }
};

// Example usage functions for testing different webhook scenarios
export const simulatePaymentPaidWebhook = (orderId: string, orderNumber: string) => {
  const webhookEvent: PayMongoWebhookEvent = {
    id: `evt_${Date.now()}`,
    type: 'payment.paid',
    data: {
      id: `pi_${Date.now()}`,
      attributes: {
        amount: 10000,
        currency: 'PHP',
        status: 'succeeded',
        metadata: {
          orderId,
          orderNumber
        },
        fee: 300,
        net_amount: 9700,
        external_reference_number: `REF${Date.now()}`
      }
    }
  };
  
  return handleWebhookEndpoint(webhookEvent);
};

export const simulatePaymentFailedWebhook = (orderId: string, orderNumber: string, failedCode: string = 'insufficient_funds', failedMessage: string = 'Insufficient funds') => {
  const webhookEvent: PayMongoWebhookEvent = {
    id: `evt_${Date.now()}`,
    type: 'payment.failed',
    data: {
      id: `pi_${Date.now()}`,
      attributes: {
        amount: 10000,
        currency: 'PHP',
        status: 'payment_failed',
        metadata: {
          orderId,
          orderNumber
        },
        failed_code: failedCode,
        failed_message: failedMessage
      }
    }
  };
  
  return handleWebhookEndpoint(webhookEvent);
};

export const simulatePaymentCancelledWebhook = (orderId: string, orderNumber: string) => {
  const webhookEvent: PayMongoWebhookEvent = {
    id: `evt_${Date.now()}`,
    type: 'payment_intent.cancelled',
    data: {
      id: `pi_${Date.now()}`,
      attributes: {
        amount: 10000,
        currency: 'PHP',
        status: 'cancelled',
        metadata: {
          orderId,
          orderNumber
        }
      }
    }
  };
  
  return handleWebhookEndpoint(webhookEvent);
};

export const simulatePaymentExpiredWebhook = (orderId: string, orderNumber: string) => {
  const webhookEvent: PayMongoWebhookEvent = {
    id: `evt_${Date.now()}`,
    type: 'qrph.expired',
    data: {
      id: `pi_${Date.now()}`,
      attributes: {
        amount: 10000,
        currency: 'PHP',
        status: 'awaiting_payment_method',
        metadata: {
          orderId,
          orderNumber
        }
      }
    }
  };
  
  return handleWebhookEndpoint(webhookEvent);
};

// Global webhook handler for browser events (if needed)
if (typeof window !== 'undefined') {
  // Make webhook functions available globally for testing
  (window as any).payMongoWebhooks = {
    simulatePaymentPaid: simulatePaymentPaidWebhook,
    simulatePaymentFailed: simulatePaymentFailedWebhook,
    simulatePaymentCancelled: simulatePaymentCancelledWebhook,
    simulatePaymentExpired: simulatePaymentExpiredWebhook,
    handleWebhook: handleWebhookEndpoint
  };
}
