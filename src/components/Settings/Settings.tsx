import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';

// Payment Method Types
interface PaymentMethod {
  id: string;
  method_key: string;
  method_name: string;
  method_description: string;
  is_enabled: boolean;
  is_online: boolean;
  requires_setup: boolean;
  display_order: number;
  icon_name: string;
  color_code: string;
  config_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Settings: React.FC = () => {
  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [togglingMethod, setTogglingMethod] = useState<string | null>(null);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      setPaymentMethodsError(null);
      
      console.log('Fetching payment methods...');
      
      // Check if token exists
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      console.log('Using token:', token.substring(0, 20) + '...');
      
      // Use direct API call to get payment methods
      const response = await fetch('http://localhost:3000/api/payments/admin/methods', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Payment methods response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Payment methods result:', result);
      
      if (result.success && result.data) {
        setPaymentMethods(result.data);
        console.log('Payment methods set:', result.data);
      } else {
        setPaymentMethodsError(result.message || 'Failed to fetch payment methods');
        console.error('API returned error:', result.message);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethodsError(`Failed to fetch payment methods: ${error.message}`);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Toggle payment method using specific API endpoints
  const togglePaymentMethod = async (methodKey: string, isEnabled: boolean) => {
    try {
      setTogglingMethod(methodKey);
      setPaymentMethodsError(null);
      setSuccessMessage(null);
      
      // Check if token exists
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Use the specific API endpoint for each payment method
      const endpoint = `http://localhost:3000/api/payments/admin/methods/${methodKey}/toggle`;
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_enabled: isEnabled
        })
      });
      
      console.log('Toggle response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Toggle response result:', result);
      
      if (result.success) {
        // Update the payment method in the local state
        setPaymentMethods(prev => 
          prev.map(method => 
            method.method_key === methodKey 
              ? { ...method, is_enabled: isEnabled, updated_at: new Date().toISOString() }
              : method
          )
        );
        
        setSuccessMessage(`${methodKey.toUpperCase()} payment method ${isEnabled ? 'enabled' : 'disabled'} successfully!`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setPaymentMethodsError(result.message || 'Failed to toggle payment method');
      }
    } catch (error) {
      console.error('Error toggling payment method:', error);
      setPaymentMethodsError('Failed to toggle payment method');
    } finally {
      setTogglingMethod(null);
    }
  };

  // Load payment methods when component mounts
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Debug payment methods state changes
  useEffect(() => {
    console.log('Payment methods state changed:', paymentMethods);
    console.log('Payment methods length:', paymentMethods.length);
  }, [paymentMethods]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/logo.svg" alt="Restaurant Logo" className="w-12 h-12" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Methods Settings</h1>
            <p className="text-gray-600 mt-1">Enable or disable payment methods for your restaurant</p>
          </div>
        </div>
        <button
          onClick={fetchPaymentMethods}
          disabled={loadingPaymentMethods}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors duration-200"
        >
          {loadingPaymentMethods ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>Refresh</span>
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {paymentMethodsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{paymentMethodsError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
              <div className="text-sm text-gray-500">
                Toggle payment methods on/off for your restaurant
              </div>
            </div>

            {loadingPaymentMethods ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading payment methods...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No payment methods found</p>
                  </div>
                ) : (
                  paymentMethods
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((method) => (
                      <div
                        key={method.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-medium text-lg"
                              style={{ backgroundColor: method.color_code }}
                            >
                              {method.icon_name === 'cash' && '₱'}
                              {method.icon_name === 'gcash' && 'G'}
                              {method.icon_name === 'card' && '💳'}
                              {method.icon_name === 'paymongo' && 'P'}
                              {method.icon_name === 'qrph' && 'QR'}
                              {!['cash', 'gcash', 'card', 'paymongo', 'qrph'].includes(method.icon_name) && '💳'}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 text-lg">{method.method_name}</h4>
                              <p className="text-sm text-gray-500 mt-1">{method.method_description}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    method.is_online
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {method.is_online ? 'Online' : 'Offline'}
                                </span>
                                {method.requires_setup && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    Setup Required
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span
                              className={`text-sm font-medium ${
                                method.is_enabled ? 'text-green-600' : 'text-gray-400'
                              }`}
                            >
                              {method.is_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <button
                              onClick={() => togglePaymentMethod(method.method_key, !method.is_enabled)}
                              disabled={togglingMethod === method.method_key}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                method.is_enabled ? 'bg-blue-600' : 'bg-gray-200'
                              } ${togglingMethod === method.method_key ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  method.is_enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                              {togglingMethod === method.method_key && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Payment Method Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Online methods</strong> require internet connection and may have additional setup requirements</li>
                <li>• <strong>Offline methods</strong> work without internet but require manual processing</li>
                <li>• <strong>Setup Required</strong> indicates the method needs additional configuration</li>
                <li>• Only enabled payment methods will be available to customers during checkout</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;