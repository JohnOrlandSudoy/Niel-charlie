import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import KitchenDashboard from '../Kitchen/KitchenDashboard';

const KitchenLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/logo.svg" 
              alt="Restaurant Logo" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kitchen Portal</h1>
              <p className="text-sm text-gray-600">Food Preparation & Order Management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                <User className="h-5 w-5 text-gray-600" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200 text-red-600"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <KitchenDashboard />
      </main>
    </div>
  );
};

export default KitchenLayout;
