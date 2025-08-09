import React, { useState } from 'react';
import { Save, Shield, Bell, Database, Users, DollarSign } from 'lucide-react';

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

  const tabs = [
    { id: 'general', label: 'General', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'users', label: 'User Roles', icon: Users },
    { id: 'billing', label: 'Billing', icon: DollarSign }
  ];

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