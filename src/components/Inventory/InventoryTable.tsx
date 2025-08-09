import React, { useState } from 'react';
import { Edit, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface InventoryTableProps {
  searchQuery: string;
  filterStatus: string;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ searchQuery, filterStatus }) => {
  const [inventory] = useState([
    {
      id: 1,
      name: 'Chicken Breast',
      category: 'Meat',
      currentStock: 5,
      unit: 'kg',
      minThreshold: 10,
      maxThreshold: 50,
      status: 'low',
      lastUpdated: '2024-01-15',
      supplier: 'Fresh Meat Co.',
      cost: 280
    },
    {
      id: 2,
      name: 'Black Pepper',
      category: 'Spices',
      currentStock: 0,
      unit: 'kg',
      minThreshold: 2,
      maxThreshold: 10,
      status: 'out',
      lastUpdated: '2024-01-14',
      supplier: 'Spice World',
      cost: 450
    },
    {
      id: 3,
      name: 'Soy Sauce',
      category: 'Condiments',
      currentStock: 8,
      unit: 'bottles',
      minThreshold: 5,
      maxThreshold: 20,
      status: 'good',
      lastUpdated: '2024-01-15',
      supplier: 'Local Supplier',
      cost: 35
    },
    {
      id: 4,
      name: 'Rice',
      category: 'Grains',
      currentStock: 2,
      unit: 'sacks',
      minThreshold: 5,
      maxThreshold: 15,
      status: 'low',
      lastUpdated: '2024-01-13',
      supplier: 'Rice Depot',
      cost: 2100
    },
    {
      id: 5,
      name: 'Cooking Oil',
      category: 'Oils',
      currentStock: 0,
      unit: 'liters',
      minThreshold: 3,
      maxThreshold: 15,
      status: 'out',
      lastUpdated: '2024-01-12',
      supplier: 'Oil Supplies Inc.',
      cost: 120
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'out':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-emerald-100 text-emerald-800';
      case 'low':
        return 'bg-amber-100 text-amber-800';
      case 'out':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'in-stock' && item.status === 'good') ||
                         (filterStatus === 'low-stock' && item.status === 'low') ||
                         (filterStatus === 'out-of-stock' && item.status === 'out');

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="mt-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ingredient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thresholds
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.category}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.currentStock} {item.unit}
                  </div>
                  <div className="text-sm text-gray-500">
                    ₱{item.cost}/{item.unit}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(item.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(item.status)}`}>
                      {item.status === 'good' ? 'In Stock' : item.status === 'low' ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Min: {item.minThreshold} {item.unit}<br />
                  Max: {item.maxThreshold} {item.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.lastUpdated}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-700 p-1 rounded">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-700 p-1 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;