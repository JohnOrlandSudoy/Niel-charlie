import React from 'react';
import { LayoutDashboard, Package, Book as MenuBook, ClipboardList, Settings, Shield, LogOut, Tags, Percent, CreditCard, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isCollapsed?: boolean;
  isMobile?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onPageChange, 
  isCollapsed = false, 
  isMobile = false, 
  onToggle, 
  onClose 
}) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'menu', label: 'Menu Management', icon: MenuBook },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'discounts', label: 'Discounts', icon: Percent },
    { id: 'orders', label: 'Order History', icon: ClipboardList },
    { id: 'paymongo', label: 'PayMongo Payments', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  const handlePageChange = (page: string) => {
    onPageChange(page);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const sidebarClasses = `
    fixed left-0 top-0 h-full bg-gray-900 text-white shadow-xl flex flex-col z-40
    transition-all duration-300 ease-in-out
    ${isMobile ? 'w-80' : isCollapsed ? 'w-16' : 'w-64'}
    ${isMobile ? 'transform translate-x-0' : ''}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
        />
      )}
      
      <div className={sidebarClasses}>
        {/* Header */}
        <div className={`border-b border-gray-700 ${isCollapsed ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex flex-col items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="Restaurant Logo" 
                  className="h-16 w-auto mb-3"
                />
                <div className="text-center">
                  <div className="text-lg font-bold text-white">DONG G PASTILLAN</div>
                  <div className="text-xs text-gray-300 mt-1">Ordering Management System</div>
                </div>
              </div>
            )}
            
            {isCollapsed && (
              <div className="flex flex-col items-center">
                <img 
                  src="/logo.svg" 
                  alt="Restaurant Logo" 
                  className="h-8 w-auto mb-2"
                />
              </div>
            )}
            
            {/* Toggle Button */}
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </button>
            )}
            
            {/* Mobile Close Button */}
            {isMobile && onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`mt-6 flex-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`
                  w-full flex items-center rounded-lg mb-2 transition-all duration-200
                  ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3 space-x-3'}
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info and Logout - Only show on mobile and desktop (not laptop) */}
        {(!isCollapsed || isMobile) && (
          <div className={`border-t border-gray-700 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            {!isCollapsed && (
              <div className="bg-gray-800 rounded-lg p-4 mb-3">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
            )}
            
            {isCollapsed && (
              <div className="flex justify-center mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200
                ${isCollapsed ? 'px-2 py-3 justify-center min-h-[44px] border-2 border-red-500' : 'px-4 py-3 space-x-3'}
              `}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium">Sign Out</span>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;