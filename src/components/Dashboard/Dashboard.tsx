import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StatsCards from './StatsCards';
import SalesChart from './SalesChart';
import RecentOrders from './RecentOrders';
import InventoryAlerts from './InventoryAlerts';
import QuickActions from './QuickActions';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName}! Here's what's happening today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-medium text-gray-900">Just now</p>
        </div>
      </div>

      <StatsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrders />
        <InventoryAlerts />
      </div>
    </div>
  );
};

export default Dashboard;