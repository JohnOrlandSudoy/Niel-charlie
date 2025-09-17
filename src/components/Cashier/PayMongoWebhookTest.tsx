import React, { useState } from 'react';
import { Play, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { 
  simulatePaymentPaidWebhook, 
  simulatePaymentFailedWebhook, 
  simulatePaymentCancelledWebhook, 
  simulatePaymentExpiredWebhook 
} from '../../utils/webhookEndpoint';

interface PayMongoWebhookTestProps {
  orderId?: string;
  orderNumber?: string;
  onClose: () => void;
}

const PayMongoWebhookTest: React.FC<PayMongoWebhookTestProps> = ({ 
  orderId = 'test-order-123', 
  orderNumber = 'ORD-12345',
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [results, setResults] = useState<{ [key: string]: { success: boolean; message: string } }>({});

  const handleWebhookTest = async (type: string, testFunction: () => Promise<{ success: boolean; message: string }>) => {
    setIsLoading(type);
    try {
      const result = await testFunction();
      setResults(prev => ({ ...prev, [type]: result }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [type]: { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setIsLoading(null);
    }
  };

  const webhookTests = [
    {
      type: 'payment.paid',
      label: 'Payment Paid',
      description: 'Simulate successful payment completion',
      icon: CheckCircle,
      color: 'green',
      testFunction: () => simulatePaymentPaidWebhook(orderId, orderNumber)
    },
    {
      type: 'payment.failed',
      label: 'Payment Failed',
      description: 'Simulate payment failure (insufficient funds)',
      icon: XCircle,
      color: 'red',
      testFunction: () => simulatePaymentFailedWebhook(orderId, orderNumber, 'insufficient_funds', 'Insufficient funds')
    },
    {
      type: 'payment_intent.cancelled',
      label: 'Payment Cancelled',
      description: 'Simulate payment cancellation',
      icon: AlertTriangle,
      color: 'amber',
      testFunction: () => simulatePaymentCancelledWebhook(orderId, orderNumber)
    },
    {
      type: 'qrph.expired',
      label: 'Payment Expired',
      description: 'Simulate QR code expiration',
      icon: Clock,
      color: 'blue',
      testFunction: () => simulatePaymentExpiredWebhook(orderId, orderNumber)
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">PayMongo Webhook Test</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Test Order Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order ID:</span> {orderId}
                </div>
                <div>
                  <span className="font-medium">Order Number:</span> {orderNumber}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Webhook Event Tests</h3>
            <p className="text-sm text-gray-600 mb-4">
              Click the buttons below to simulate different PayMongo webhook events and see how they affect the payment flow.
            </p>

            {webhookTests.map((test) => {
              const Icon = test.icon;
              const result = results[test.type];
              const isTestLoading = isLoading === test.type;

              return (
                <div key={test.type} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full bg-${test.color}-100`}>
                        <Icon className={`h-5 w-5 text-${test.color}-600`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{test.label}</h4>
                        <p className="text-sm text-gray-600">{test.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleWebhookTest(test.type, test.testFunction)}
                      disabled={isTestLoading}
                      className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${
                        isTestLoading
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : `bg-${test.color}-600 text-white hover:bg-${test.color}-700`
                      }`}
                    >
                      <Play className="h-4 w-4" />
                      <span>{isTestLoading ? 'Testing...' : 'Test'}</span>
                    </button>
                  </div>

                  {result && (
                    <div className={`mt-3 p-3 rounded-lg ${
                      result.success 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          result.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.message}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to Use</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• These tests simulate webhook events that would normally come from PayMongo</li>
              <li>• Each test will trigger the appropriate event handler in the payment flow</li>
              <li>• Check the browser console for detailed webhook processing logs</li>
              <li>• The PayMongoPaymentModal should respond to these events in real-time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayMongoWebhookTest;
