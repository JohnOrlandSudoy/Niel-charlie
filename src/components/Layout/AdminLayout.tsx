import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../Dashboard/Dashboard';
import InventoryManagement from '../Inventory/InventoryManagement';
import MenuManagement from '../Menu/MenuManagement';
import EmployeeManagement from '../Employee/EmployeeManagement';
import OrderHistory from '../Orders/OrderHistory';
import Settings from '../Settings/Settings';

const AdminLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [notifications] = useState([
    { id: 1, type: 'warning', message: 'Low stock: Chicken (5 kg remaining)', time: '2 min ago' },
    { id: 2, type: 'info', message: 'New order received: #ORD-12345', time: '5 min ago' },
    { id: 3, type: 'error', message: 'Pepper out of stock - Chicken Pastil unavailable', time: '10 min ago' },
  ]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryManagement />;
      case 'menu':
        return <MenuManagement />;
      case 'employees':
        return <EmployeeManagement />;
      case 'orders':
        return <OrderHistory />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        
        <div className="flex-1 ml-64">
          <Header notifications={notifications} />
          
          <main className="p-6">
            {renderCurrentPage()}
          </main>
        </div>
      </div>

      {/* Global Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.slice(0, 3).map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg border-l-4 bg-white transition-all duration-300 transform hover:scale-105 ${
              notification.type === 'warning'
                ? 'border-amber-500'
                : notification.type === 'error'
                ? 'border-red-500'
                : 'border-blue-500'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.time}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLayout;
