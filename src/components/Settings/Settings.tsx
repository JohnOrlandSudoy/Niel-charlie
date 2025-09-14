import React, { useState, useEffect } from 'react';
import { Save, Shield, Bell, Database, Users, DollarSign, CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('general');
  
  const [generalSettings, setGeneralSettings] = useState({
    restaurantName: 'RestaurantOS',
    address: '123 Main Street, City, Country',
    phone: '+63 912 345 6789',
    email: 'admin@restaurant.com',
    timezone: 'Asia/Manila',
    currency: 'PHP',
    taxRate: '12'
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: '30',
    passwordMinLength: '8',
    requireMfa: false,
    auditLogs: true,
    autoBackup: true,
    backupFrequency: 'daily'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlerts: true,
    orderNotifications: true,
    paymentReminders: true,
    systemAlerts: true,
    emailNotifications: true,
    smsNotifications: false
  });

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [togglingMethod, setTogglingMethod] = useState<string | null>(null);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null);

  const tabs = [
    { id: 'general', label: 'General', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
    { id: 'users', label: 'User Roles', icon: Users },
    { id: 'billing', label: 'Billing', icon: DollarSign }
  ];

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      setPaymentMethodsError(null);
      
      const response = await api.payments.getAdminMethods();
      const result = await response.json();
      
      if (result.success && result.data) {
        setPaymentMethods(result.data);
      } else {
        setPaymentMethodsError(result.message || 'Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethodsError('Failed to fetch payment methods');
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Toggle payment method
  const togglePaymentMethod = async (methodKey: string, isEnabled: boolean) => {
    try {
      setTogglingMethod(methodKey);
      setPaymentMethodsError(null);
      
      const response = await api.payments.toggleMethod(methodKey, isEnabled);
      const result = await response.json();
      
      if (result.success) {
        // Update the payment method in the local state
        setPaymentMethods(prev => 
          prev.map(method => 
            method.method_key === methodKey 
              ? { ...method, is_enabled: isEnabled, updated_at: result.data.updated_at }
              : method
          )
        );
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

  // Load payment methods when component mounts or when payment methods tab is selected
  useEffect(() => {
    if (activeTab === 'payment-methods') {
      fetchPaymentMethods();
    }
  }, [activeTab]);

  const handleSave = () => {
    console.log('Settings saved');
    // Handle save logic here
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure your restaurant management system</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    value={generalSettings.restaurantName}
                    onChange={(e) => setGeneralSettings({...generalSettings, restaurantName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={generalSettings.phone}
                    onChange={(e) => setGeneralSettings({...generalSettings, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({...generalSettings, address: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Asia/Manila">Asia/Manila</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={generalSettings.taxRate}
                    onChange={(e) => setGeneralSettings({...generalSettings, taxRate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Password Length
                  </label>
                  <input
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requireMfa"
                    checked={securitySettings.requireMfa}
                    onChange={(e) => setSecuritySettings({...securitySettings, requireMfa: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireMfa" className="ml-2 text-sm text-gray-700">
                    Require Multi-Factor Authentication
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auditLogs"
                    checked={securitySettings.auditLogs}
                    onChange={(e) => setSecuritySettings({...securitySettings, auditLogs: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="auditLogs" className="ml-2 text-sm text-gray-700">
                    Enable Audit Logs
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoBackup"
                    checked={securitySettings.autoBackup}
                    onChange={(e) => setSecuritySettings({...securitySettings, autoBackup: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoBackup" className="ml-2 text-sm text-gray-700">
                    Enable Automatic Backups
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="lowStockAlerts" className="text-sm font-medium text-gray-700">
                      Low Stock Alerts
                    </label>
                    <p className="text-sm text-gray-500">Get notified when inventory is running low</p>
                  </div>
                  <input
                    type="checkbox"
                    id="lowStockAlerts"
                    checked={notificationSettings.lowStockAlerts}
                    onChange={(e) => setNotificationSettings({...notificationSettings, lowStockAlerts: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="orderNotifications" className="text-sm font-medium text-gray-700">
                      Order Notifications
                    </label>
                    <p className="text-sm text-gray-500">Receive real-time order updates</p>
                  </div>
                  <input
                    type="checkbox"
                    id="orderNotifications"
                    checked={notificationSettings.orderNotifications}
                    onChange={(e) => setNotificationSettings({...notificationSettings, orderNotifications: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="systemAlerts" className="text-sm font-medium text-gray-700">
                      System Alerts
                    </label>
                    <p className="text-sm text-gray-500">Important system and security notifications</p>
                  </div>
                  <input
                    type="checkbox"
                    id="systemAlerts"
                    checked={notificationSettings.systemAlerts}
                    onChange={(e) => setNotificationSettings({...notificationSettings, systemAlerts: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment-methods' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
                <button
                  onClick={fetchPaymentMethods}
                  disabled={loadingPaymentMethods}
                  className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loadingPaymentMethods ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span>Refresh</span>
                </button>
              </div>

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
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
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
                                <h4 className="font-medium text-gray-900">{method.method_name}</h4>
                                <p className="text-sm text-gray-500">{method.method_description}</p>
                                <div className="flex items-center space-x-2 mt-1">
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
                            <div className="flex items-center space-x-3">
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
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">User Role Permissions</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900">Administrator</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Full system access including user management, reports, settings, and all operational features.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-medium text-emerald-900">Kitchen Staff</h4>
                  <p className="text-sm text-emerald-700 mt-1">
                    Order management, inventory viewing, and status updates. Cannot modify system settings.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900">Cashier</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Order processing, payment handling, and customer management. Limited inventory access.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900">Inventory Manager</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Full inventory management, stock operations, and supplier management. Limited order access.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Billing & Subscription</h3>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">Professional Plan</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Unlimited users, advanced reporting, priority support
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-900">₱2,999</p>
                    <p className="text-sm text-green-700">per month</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-sm text-green-700">
                    Next billing date: February 15, 2024
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;