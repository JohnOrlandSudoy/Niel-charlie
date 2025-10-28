// Enhanced Admin Layout with robust state management and error boundaries

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../contexts/AppStateContext';
import { ErrorBoundary } from '../ErrorBoundary';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationSystem from './NotificationSystem';
import LoadingOverlay from './LoadingOverlay';

// Lazy load components for better performance
const Dashboard = React.lazy(() => import('../Dashboard/Dashboard'));
const InventoryManagement = React.lazy(() => import('../Inventory/InventoryManagement'));
const MenuManagement = React.lazy(() => import('../Menu/MenuManagement'));
const CategoryManagement = React.lazy(() => import('../Menu/CategoryManagement'));
const DiscountManagement = React.lazy(() => import('../Discounts/DiscountManagement'));
const OrderHistory = React.lazy(() => import('../Orders/OrderHistory'));
const PayMongoPaymentManagement = React.lazy(() => import('../PayMongo/PayMongoPaymentManagement'));
const Settings = React.lazy(() => import('../Settings/Settings'));

// Error fallback component
const ErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
          <p className="text-sm text-gray-500">An error occurred while loading this page</p>
        </div>
      </div>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-red-800 font-mono">{error.message}</p>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={resetError}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

// Page component wrapper with error boundary
const PageWrapper: React.FC<{ children: React.ReactNode; pageId: string }> = ({ children, pageId }) => (
  <ErrorBoundary fallback={ErrorFallback}>
    <React.Suspense fallback={<LoadingOverlay message={`Loading ${pageId}...`} />}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
);

const EnhancedAdminLayout: React.FC = () => {
  const { currentPage, navigateTo, isNavigating, isOnline, notifications } = useAppState();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle page navigation
  const handlePageChange = (page: string) => {
    navigateTo(page);
  };

  // Render current page with error boundary
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <PageWrapper pageId="Dashboard">
            <Dashboard onNavigateToInventory={() => navigateTo('inventory')} onNavigateToOrders={() => navigateTo('orders')} />
          </PageWrapper>
        );
      case 'inventory':
        return (
          <PageWrapper pageId="Inventory">
            <InventoryManagement />
          </PageWrapper>
        );
      case 'menu':
        return (
          <PageWrapper pageId="Menu Management">
            <MenuManagement />
          </PageWrapper>
        );
      case 'categories':
        return (
          <PageWrapper pageId="Categories">
            <CategoryManagement />
          </PageWrapper>
        );
      case 'discounts':
        return (
          <PageWrapper pageId="Discounts">
            <DiscountManagement />
          </PageWrapper>
        );
      case 'orders':
        return (
          <PageWrapper pageId="Order History">
            <OrderHistory />
          </PageWrapper>
        );
      case 'paymongo':
        return (
          <PageWrapper pageId="PayMongo Payments">
            <PayMongoPaymentManagement />
          </PageWrapper>
        );
      case 'settings':
        return (
          <PageWrapper pageId="Settings">
            <Settings />
          </PageWrapper>
        );
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
              <p className="text-gray-600 mb-4">The requested page could not be found.</p>
              <button
                onClick={() => navigateTo('dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-center py-2 text-sm">
          <span className="font-medium">Offline Mode:</span> You're working offline. Changes will sync when connection is restored.
        </div>
      )}

      {/* Navigation indicator */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-blue-600 animate-pulse"></div>
        </div>
      )}

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out`}>
          <Sidebar
            currentPage={currentPage}
            onPageChange={handlePageChange}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header
            currentPage={currentPage}
            onPageChange={handlePageChange}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {renderCurrentPage()}
            </div>
          </main>
        </div>
      </div>

      {/* Notification system */}
      <NotificationSystem notifications={notifications} />

      {/* Global loading overlay */}
      {isNavigating && <LoadingOverlay message="Loading..." />}
    </div>
  );
};

export default EnhancedAdminLayout;
