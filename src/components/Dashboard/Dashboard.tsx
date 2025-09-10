import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import StatsCards from './StatsCards';
import SalesChart from './SalesChart';
import RecentOrders from './RecentOrders';
import InventoryAlerts from './InventoryAlerts';
import StockUsageChart from './StockUsageChart';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { lastUpdated, refresh, isLoading, stats } = useDashboardData();

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName}! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-900">
              {formatLastUpdated(lastUpdated)}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <StatsCards />
      
      <div className="grid grid-cols-1 gap-6">
        <SalesChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrders />
        <InventoryAlerts />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StockUsageChart />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Total Revenue</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
              <p className="text-lg font-bold text-emerald-600">
                ₱{stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Completed Orders</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
              <p className="text-lg font-bold text-blue-600">
                {stats.completedOrders}
              </p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Pending Orders</p>
                <p className="text-xs text-gray-500">Currently</p>
              </div>
              <p className="text-lg font-bold text-amber-600">
                {stats.pendingOrders}
              </p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Active Discounts</p>
                <p className="text-xs text-gray-500">Currently</p>
              </div>
              <p className="text-lg font-bold text-purple-600">
                {stats.activeDiscounts}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;