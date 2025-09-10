import React, { useState } from 'react';
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../utils/api';
import { PayMongoCancelResponse } from '../../types/paymongo';

interface PayMongoTestComponentProps {
  onClose: () => void;
}

const PayMongoTestComponent: React.FC<PayMongoTestComponentProps> = ({ onClose }) => {
  const [paymentIntentId, setPaymentIntentId] = useState('pi_aiQXCuABh9q6QejNxigPYFjv');
  const [isCancelling, setIsCancelling] = useState(false);
  const [result, setResult] = useState<PayMongoCancelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCancelPayment = async () => {
    if (!paymentIntentId.trim()) {
      setError('Please enter a payment intent ID');
      return;
    }

    try {
      setIsCancelling(true);
      setError(null);
      setResult(null);

      console.log('Cancelling payment with ID:', paymentIntentId);
      
      const response = await api.payments.cancel(paymentIntentId);
      const cancelResult: PayMongoCancelResponse = await response.json();

      console.log('Cancel payment response:', cancelResult);

      if (cancelResult.success) {
        setResult(cancelResult);
      } else {
        setError(cancelResult.message || 'Failed to cancel payment');
      }
    } catch (err) {
      console.error('Error cancelling payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel payment');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">PayMongo Cancel Payment Test</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close test modal"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Test Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Intent ID
              </label>
              <input
                type="text"
                value={paymentIntentId}
                onChange={(e) => setPaymentIntentId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                placeholder="Enter payment intent ID (e.g., pi_aiQXCuABh9q6QejNxigPYFjv)"
              />
            </div>

            <button
              onClick={handleCancelPayment}
              disabled={isCancelling}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {isCancelling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Cancelling Payment...</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>Cancel Payment</span>
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Payment Cancelled Successfully!</span>
              </div>
              
              <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Success:</span>
                    <span className="ml-2 text-gray-900">{result.success ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2 text-gray-900">{result.data.status}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Payment Intent ID:</span>
                    <span className="ml-2 text-gray-900 font-mono text-xs">{result.data.paymentIntentId}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Amount:</span>
                    <span className="ml-2 text-gray-900">₱{(result.data.amount / 100).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Currency:</span>
                    <span className="ml-2 text-gray-900">{result.data.currency}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="font-medium text-gray-700">Message:</span>
                  <p className="text-gray-900 mt-1">{result.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* API Endpoint Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">API Endpoint Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Method:</span>
                <span className="ml-2 font-mono bg-gray-200 px-2 py-1 rounded">POST</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">URL:</span>
                <span className="ml-2 font-mono bg-gray-200 px-2 py-1 rounded">
                  http://localhost:3000/api/payments/cancel/{paymentIntentId}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Headers:</span>
                <div className="ml-2 font-mono bg-gray-200 px-2 py-1 rounded text-xs">
                  Authorization: Bearer {'{token}'}<br/>
                  Content-Type: application/json
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayMongoTestComponent;
