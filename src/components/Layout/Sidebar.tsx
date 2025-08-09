import React from 'react';
import { LayoutDashboard, Package, Book as MenuBook, Users, ClipboardList, Wallet, Settings, ChefHat, TrendingUp, Shield } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'menu', label: 'Menu Management', icon: MenuBook },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'orders', label: 'Order History', icon: ClipboardList },
    { id: 'payroll', label: 'Payroll', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white shadow-xl">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-center">
          <img 
            src="/logo.svg" 
            alt="Restaurant Logo" 
            className="h-24 w-auto"
          />
        </div>
      </div>

      <nav className="mt-6 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-3 right-3">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-sm font-medium">System Status</p>
              <p className="text-xs text-green-400">All systems operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;