import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../Dashboard/Dashboard';
import InventoryManagement from '../Inventory/InventoryManagement';
import MenuManagement from '../Menu/MenuManagement';
import CategoryManagement from '../Menu/CategoryManagement';
import DiscountManagement from '../Discounts/DiscountManagement';
import OrderHistory from '../Orders/OrderHistory';
import PayMongoPaymentManagement from '../PayMongo/PayMongoPaymentManagement';
import Settings from '../Settings/Settings';

const AdminLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Responsive state management
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLaptopScreen, setIsLaptopScreen] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsLaptopScreen(width >= 768 && width < 1280);
      
      // Auto-collapse sidebar on tablet and smaller laptops by default
      if (width >= 768 && width < 1280) {
        setIsSidebarCollapsed(true);
      } else if (width >= 1280) {
        setIsSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigateToInventory={() => setCurrentPage('inventory')} />;
      case 'inventory':
        return <InventoryManagement />;
      case 'menu':
        return <MenuManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'discounts':
        return <DiscountManagement />;
      case 'orders':
        return <OrderHistory />;
      case 'paymongo':
        return <PayMongoPaymentManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
          isCollapsed={isSidebarCollapsed}
          isMobile={isMobile && isMobileSidebarOpen}
          onToggle={toggleSidebar}
          onClose={closeMobileSidebar}
        />
        
        {/* Main Content Area */}
        <div className={`
          flex-1 transition-all duration-300 ease-in-out
          ${isMobile ? 'ml-0' : isSidebarCollapsed ? 'ml-16' : 'ml-64'}
        `}>
          {/* Mobile Header with Menu Button */}
          {isMobile && (
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
              <div className="w-10"></div> {/* Spacer for centering */}
            </div>
          )}
          
          <Header isLaptopScreen={isLaptopScreen} />
          
          <main className="p-4 sm:p-6">
            {renderCurrentPage()}
          </main>
        </div>
      </div>

    </div>
  );
};

export default AdminLayout;
