import React, { useState } from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Info,
  Clock,
  DollarSign
} from 'lucide-react';
import { api } from '../../utils/api';

interface PaymentSyncProps {
  orderId: string;
  orderNumber: string;
  onSyncComplete?: (success: boolean, message: string) => void;
  onClose?: () => void;
}

interface SyncResult {
  success: boolean;
  message: string;
  data?: {
    paymentStatus: string;
    paymentMethod: string;
    syncedAt: string;
    paymongoData?: any;
  };
}

const PaymentSync: React.FC<PaymentSyncProps> = ({
  orderId,
  orderNumber,
  onSyncComplete,
  onClose
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Perform manual payment sync
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      setSyncResult(null);

      const response = await api.payments.syncPayment(orderId);
      const result = await response.json();

      if (result.success) {
        const syncResult: SyncResult = {
          success: true,
          message: result.message || 'Payment synced successfully',
          data: result.data
        };
        setSyncResult(syncResult);
        onSyncComplete?.(true, syncResult.message);
      } else {
        const syncResult: SyncResult = {
          success: false,
          message: result.message || 'Failed to sync payment',
        };
        setSyncResult(syncResult);
        setError(syncResult.message);
        onSyncComplete?.(false, syncResult.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync payment';
      const syncResult: SyncResult = {
        success: false,
        message: errorMessage,
      };
      setSyncResult(syncResult);
      setError(errorMessage);
      onSyncComplete?.(false, errorMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <RefreshCw className="h-5 w-5 mr-2" />
          Manual Payment Sync
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">What is Manual Payment Sync?</p>
              <p className="text-blue-800">
                This feature checks PayMongo directly for the latest payment status and updates your order accordingly. 
                Use this when webhooks fail or payment status seems incorrect.
              </p>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">Order #:</span> {orderNumber}</p>
            <p><span className="font-medium">Order ID:</span> {orderId}</p>
          </div>
        </div>

        {/* Sync Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Syncing Payment...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                <span>Sync Payment Status</span>
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {syncResult?.success && syncResult.data && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Payment Synced Successfully</p>
                <p className="text-sm text-green-700">{syncResult.message}</p>
              </div>
            </div>

            <div className="bg-white rounded border border-green-200 p-3">
              <h5 className="font-medium text-gray-900 mb-2">Updated Payment Information:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      syncResult.data.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {syncResult.data.paymentStatus.toUpperCase()}
                    </span>
                  </p>
                  <p><span className="font-medium">Method:</span> {syncResult.data.paymentMethod.toUpperCase()}</p>
                </div>
                <div>
                  <p><span className="font-medium">Synced At:</span> 
                    <span className="flex items-center ml-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(syncResult.data.syncedAt).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              {/* PayMongo Data */}
              {syncResult.data.paymongoData && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h6 className="font-medium text-gray-900 mb-2">PayMongo Response:</h6>
                  <pre className="bg-gray-50 rounded p-2 text-xs overflow-x-auto max-h-32">
                    {JSON.stringify(syncResult.data.paymongoData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Failure Result */}
        {syncResult && !syncResult.success && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Sync Failed</p>
                <p className="text-sm text-red-700">{syncResult.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">When to Use Manual Sync:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Customer says they paid but order still shows as unpaid</li>
            <li>• Webhook notifications failed or were delayed</li>
            <li>• Payment status appears incorrect or outdated</li>
            <li>• Troubleshooting payment processing issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentSync;
