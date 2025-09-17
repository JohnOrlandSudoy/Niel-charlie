// PayMongo Webhook Event Handler
import { api } from './api';
import { 
  PayMongoWebhookEvent, 
  PayMongoWebhookEventType, 
  PayMongoWebhookResponse,
  PayMongoPaymentStatus 
} from '../types/paymongo';

export interface WebhookEventHandler {
  onPaymentPaid: (orderId: string, orderNumber: string, paymentData: any) => void;
  onPaymentFailed: (orderId: string, orderNumber: string, errorData: any) => void;
  onPaymentCancelled: (orderId: string, orderNumber: string) => void;
  onPaymentExpired: (orderId: string, orderNumber: string) => void;
}

class PayMongoWebhookHandler {
  private eventHandlers: WebhookEventHandler[] = [];
  private isListening = false;

  // Register event handler
  registerHandler(handler: WebhookEventHandler) {
    this.eventHandlers.push(handler);
  }

  // Unregister event handler
  unregisterHandler(handler: WebhookEventHandler) {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  // Process webhook event
  async processWebhookEvent(webhookEvent: PayMongoWebhookEvent): Promise<PayMongoWebhookResponse> {
    try {
      console.log('Processing PayMongo webhook event:', webhookEvent);

      const { type, data } = webhookEvent;
      const { attributes } = data;
      const { metadata } = attributes;

      const orderId = metadata.orderId;
      const orderNumber = metadata.orderNumber || 'Unknown';

      // Process based on event type
      switch (type) {
        case 'payment.paid':
          await this.handlePaymentPaid(orderId, orderNumber, attributes);
          break;
        
        case 'payment.failed':
          await this.handlePaymentFailed(orderId, orderNumber, attributes);
          break;
        
        case 'payment_intent.cancelled':
          await this.handlePaymentCancelled(orderId, orderNumber);
          break;
        
        case 'qrph.expired':
          await this.handlePaymentExpired(orderId, orderNumber);
          break;
        
        default:
          console.warn('Unknown webhook event type:', type);
          return {
            success: false,
            message: `Unknown event type: ${type}`
          };
      }

      return {
        success: true,
        message: `Successfully processed ${type} event`,
        data: {
          orderId,
          orderNumber,
          paymentStatus: attributes.status,
          paymentMethod: 'paymongo'
        }
      };

    } catch (error) {
      console.error('Error processing webhook event:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error processing webhook'
      };
    }
  }

  // Handle payment.paid event
  private async handlePaymentPaid(orderId: string, orderNumber: string, attributes: any) {
    try {
      // Update order payment status in database
      const response = await api.orders.updatePayment(orderId, {
        payment_status: 'paid',
        payment_method: 'paymongo'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update order payment status');
      }

      console.log(`Payment succeeded for order ${orderNumber} (${orderId})`);

      // Notify all registered handlers
      this.eventHandlers.forEach(handler => {
        try {
          handler.onPaymentPaid(orderId, orderNumber, {
            amount: attributes.amount,
            currency: attributes.currency,
            fee: attributes.fee,
            netAmount: attributes.net_amount,
            externalReferenceNumber: attributes.external_reference_number
          });
        } catch (error) {
          console.error('Error in payment paid handler:', error);
        }
      });

    } catch (error) {
      console.error('Error handling payment.paid event:', error);
      throw error;
    }
  }

  // Handle payment.failed event
  private async handlePaymentFailed(orderId: string, orderNumber: string, attributes: any) {
    try {
      console.log(`Payment failed for order ${orderNumber} (${orderId}):`, {
        failedCode: attributes.failed_code,
        failedMessage: attributes.failed_message
      });

      // Notify all registered handlers
      this.eventHandlers.forEach(handler => {
        try {
          handler.onPaymentFailed(orderId, orderNumber, {
            failedCode: attributes.failed_code,
            failedMessage: attributes.failed_message,
            amount: attributes.amount,
            currency: attributes.currency
          });
        } catch (error) {
          console.error('Error in payment failed handler:', error);
        }
      });

    } catch (error) {
      console.error('Error handling payment.failed event:', error);
      throw error;
    }
  }

  // Handle payment_intent.cancelled event
  private async handlePaymentCancelled(orderId: string, orderNumber: string) {
    try {
      console.log(`Payment cancelled for order ${orderNumber} (${orderId})`);

      // Notify all registered handlers
      this.eventHandlers.forEach(handler => {
        try {
          handler.onPaymentCancelled(orderId, orderNumber);
        } catch (error) {
          console.error('Error in payment cancelled handler:', error);
        }
      });

    } catch (error) {
      console.error('Error handling payment_intent.cancelled event:', error);
      throw error;
    }
  }

  // Handle qrph.expired event
  private async handlePaymentExpired(orderId: string, orderNumber: string) {
    try {
      console.log(`Payment expired for order ${orderNumber} (${orderId})`);

      // Notify all registered handlers
      this.eventHandlers.forEach(handler => {
        try {
          handler.onPaymentExpired(orderId, orderNumber);
        } catch (error) {
          console.error('Error in payment expired handler:', error);
        }
      });

    } catch (error) {
      console.error('Error handling qrph.expired event:', error);
      throw error;
    }
  }

  // Simulate webhook event (for testing)
  simulateWebhookEvent(eventType: PayMongoWebhookEventType, orderId: string, orderNumber: string, additionalData: any = {}) {
    const mockEvent: PayMongoWebhookEvent = {
      id: `evt_${Date.now()}`,
      type: eventType,
      data: {
        id: `pi_${Date.now()}`,
        attributes: {
          amount: 10000,
          currency: 'PHP',
          status: this.getStatusFromEventType(eventType),
          metadata: {
            orderId,
            orderNumber
          },
          ...additionalData
        }
      }
    };

    return this.processWebhookEvent(mockEvent);
  }

  // Helper to get status from event type
  private getStatusFromEventType(eventType: PayMongoWebhookEventType): PayMongoPaymentStatus {
    switch (eventType) {
      case 'payment.paid':
        return 'succeeded';
      case 'payment.failed':
        return 'failed';
      case 'payment_intent.cancelled':
        return 'cancelled';
      case 'qrph.expired':
        return 'awaiting_payment_method';
      default:
        return 'awaiting_payment_method';
    }
  }
}

// Create singleton instance
export const payMongoWebhookHandler = new PayMongoWebhookHandler();

// Export for use in components
export default payMongoWebhookHandler;
