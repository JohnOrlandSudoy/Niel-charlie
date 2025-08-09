import React from 'react';
import { AlertTriangle, Package, XCircle } from 'lucide-react';

const InventoryAlerts: React.FC = () => {
  const alerts = [
    {
      id: 1,
      item: 'Chicken Breast',
      current: 5,
      minimum: 10,
      unit: 'kg',
      status: 'low',
      affectedItems: ['Chicken Pastil', 'Chicken Adobo']
    },
    {
      id: 2,
      item: 'Black Pepper',
      current: 0,
      minimum: 2,
      unit: 'kg',
      status: 'out',
      affectedItems: ['Chicken Pastil', 'Beef Steak']
    },
    {
      id: 3,
      item: 'Soy Sauce',
      current: 3,
      minimum: 5,
      unit: 'bottles',
      status: 'low',
      affectedItems: ['Pork Adobo', 'Chicken Pastil']
    },
    {
      id: 4,
      item: 'Rice',
      current: 2,
      minimum: 10,
      unit: 'sacks',
      status: 'low',
      affectedItems: ['All Rice Dishes']
    },
    {
      id: 5,
      item: 'Cooking Oil',
      current: 0,
      minimum: 3,
      unit: 'liters',
      status: 'out',
      affectedItems: ['All Fried Items']
    }
  ];

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Inventory Alerts</h3>
        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
          {alerts.filter(alert => alert.status === 'out').length} Critical
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-sm ${getStatusColor(alert.status)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(alert.status)}
                <span className="font-medium">{alert.item}</span>
              </div>
              <span className="text-xs font-medium uppercase">
                {alert.status === 'out' ? 'OUT OF STOCK' : 'LOW STOCK'}
              </span>
            </div>

            <div className="text-sm mb-2">
              <span className="font-medium">
                {alert.current} {alert.unit}
              </span>
              <span className="text-gray-600"> remaining (min: {alert.minimum} {alert.unit})</span>
            </div>

            <div className="text-xs">
              <span className="font-medium">Affected items: </span>
              <span className="text-gray-600">{alert.affectedItems.join(', ')}</span>
            </div>

            <div className="flex justify-end mt-3">
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Restock Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryAlerts;