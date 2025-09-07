import React, { useState, useEffect } from 'react';
import { Edit, Trash2, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';
import { Ingredient, ApiResponse } from '../../types/inventory';
import EditIngredientModal from './EditIngredientModal';

interface InventoryTableProps {
  searchQuery: string;
  filterStatus: string;
  onIngredientUpdate?: () => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ searchQuery, filterStatus, onIngredientUpdate }) => {
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  // Fetch ingredients from API
  const fetchIngredients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.inventory.getAllIngredients();
      const result: ApiResponse<Ingredient[]> = await response.json();
      
      if (result.success && result.data) {
        setInventory(result.data);
      } else {
        setError(result.message || 'Failed to fetch ingredients');
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to fetch ingredients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load ingredients on component mount
  useEffect(() => {
    fetchIngredients();
  }, []);

  // Handle ingredient deletion
  const handleDeleteIngredient = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ingredient?')) {
      return;
    }
    
    try {
      const response = await api.inventory.deleteIngredient(id);
      const result: ApiResponse<null> = await response.json();
      
      if (result.success) {
        setInventory(prev => prev.filter(item => item.id !== id));
        onIngredientUpdate?.();
      } else {
        setError(result.message || 'Failed to delete ingredient');
      }
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      setError('Failed to delete ingredient. Please try again.');
    }
  };

  // Handle ingredient edit
  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
  };

  // Handle ingredient updated
  const handleIngredientUpdated = (updatedIngredient: Ingredient) => {
    setInventory(prev => 
      prev.map(item => 
        item.id === updatedIngredient.id ? updatedIngredient : item
      )
    );
    setEditingIngredient(null);
    onIngredientUpdate?.();
  };

  // Calculate status based on current stock and thresholds
  const getIngredientStatus = (ingredient: Ingredient) => {
    if (ingredient.current_stock === 0) return 'out';
    if (ingredient.min_stock_threshold && ingredient.current_stock <= ingredient.min_stock_threshold) return 'low';
    return 'good';
  };

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
                         (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const status = getIngredientStatus(item);
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'in-stock' && status === 'good') ||
                         (filterStatus === 'low-stock' && status === 'low') ||
                         (filterStatus === 'out-of-stock' && status === 'out');

    return matchesSearch && matchesFilter;
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="mt-6 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading ingredients...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

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
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => {
                const status = getIngredientStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.category || 'No Category'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.current_stock} {item.unit}
                      </div>
                      {item.cost_per_unit && (
                        <div className="text-sm text-gray-500">
                          ₱{item.cost_per_unit}/{item.unit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(status)}`}>
                          {status === 'good' ? 'In Stock' : status === 'low' ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.min_stock_threshold && (
                        <>Min: {item.min_stock_threshold} {item.unit}<br /></>
                      )}
                      {item.max_stock_threshold && (
                        <>Max: {item.max_stock_threshold} {item.unit}</>
                      )}
                      {!item.min_stock_threshold && !item.max_stock_threshold && (
                        <span className="text-gray-400">No thresholds set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditIngredient(item)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded"
                          title="Edit ingredient"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteIngredient(item.id)}
                          className="text-red-600 hover:text-red-700 p-1 rounded"
                          title="Delete ingredient"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No ingredients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingIngredient && (
        <EditIngredientModal
          ingredient={editingIngredient}
          onClose={() => setEditingIngredient(null)}
          onIngredientUpdated={handleIngredientUpdated}
        />
      )}
    </div>
  );
};

export default InventoryTable;