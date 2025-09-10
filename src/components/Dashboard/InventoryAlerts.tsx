import React from 'react';
import { AlertTriangle, Package, XCircle, Loader2, Plus } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

const InventoryAlerts: React.FC = () => {
  const { lowStockAlerts, stats, isLoading, error } = useDashboardData();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'out':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'low':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading inventory alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-600">
            <p>Failed to load inventory data</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Inventory Alerts</h3>
        <div className="flex items-center space-x-2">
          {stats.outOfStockItems > 0 && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
              {stats.outOfStockItems} Critical
            </span>
          )}
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
            <Plus className="h-4 w-4" />
            <span>Restock</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {lowStockAlerts.length > 0 ? lowStockAlerts.map((alert) => {
          const status = alert.current_stock === 0 ? 'out' : 'low';
          return (
            <div
              key={alert.id}
              className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-sm ${getStatusColor(status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status)}
                  <span className="font-medium">{alert.name}</span>
                </div>
                <span className="text-xs font-medium uppercase">
                  {status === 'out' ? 'OUT OF STOCK' : 'LOW STOCK'}
                </span>
              </div>

              <div className="text-sm mb-2">
                <span className="font-medium">
                  {alert.current_stock} {alert.unit}
                </span>
                <span className="text-gray-600"> remaining (min: {alert.minimum_stock} {alert.unit})</span>
              </div>

              {alert.menu_items && alert.menu_items.length > 0 && (
                <div className="text-xs">
                  <span className="font-medium">Affected items: </span>
                  <span className="text-gray-600">
                    {alert.menu_items.slice(0, 3).map((item: any) => item.name).join(', ')}
                    {alert.menu_items.length > 3 && ` +${alert.menu_items.length - 3} more`}
                  </span>
                </div>
              )}

              <div className="flex justify-end mt-3">
                <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  Restock Now
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No inventory alerts</p>
            <p className="text-sm text-gray-400 mt-1">All items are well stocked</p>
          </div>
        )}
      </div>

      {lowStockAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {stats.lowStockItems + stats.outOfStockItems} items need attention
            </span>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              View All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAlerts;