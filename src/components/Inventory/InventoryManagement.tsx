import React, { useState, useEffect } from 'react';
import { Search, Plus, AlertTriangle, Package, Filter, Loader2 } from 'lucide-react';
import InventoryTable from './InventoryTable';
import AddIngredientModal from './AddIngredientModal';
import { api } from '../../utils/api';
import { Ingredient, InventoryStats, ApiResponse } from '../../types/inventory';

const InventoryManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    wellStockedItems: 0,
    totalValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ingredients and calculate statistics
  const fetchIngredients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.inventory.getAllIngredients();
      const result: ApiResponse<Ingredient[]> = await response.json();
      
      if (result.success && result.data) {
        setIngredients(result.data);
        calculateStats(result.data);
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

  // Calculate statistics from ingredients
  const calculateStats = (ingredients: Ingredient[]) => {
    const totalItems = ingredients.length;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    let totalValue = 0;

    ingredients.forEach(ingredient => {
      if (ingredient.current_stock === 0) {
        outOfStockItems++;
      } else if (ingredient.min_stock_threshold && ingredient.current_stock <= ingredient.min_stock_threshold) {
        lowStockItems++;
      }
      
      if (ingredient.cost_per_unit) {
        totalValue += ingredient.current_stock * ingredient.cost_per_unit;
      }
    });

    const wellStockedItems = totalItems - lowStockItems - outOfStockItems;

    setStats({
      totalItems,
      lowStockItems,
      outOfStockItems,
      wellStockedItems,
      totalValue
    });
  };

  // Load ingredients on component mount
  useEffect(() => {
    fetchIngredients();
  }, []);

  // Handle ingredient added
  const handleIngredientAdded = (newIngredient: Ingredient) => {
    setIngredients(prev => [...prev, newIngredient]);
    calculateStats([...ingredients, newIngredient]);
  };

  // Handle ingredient update (for table refresh)
  const handleIngredientUpdate = () => {
    fetchIngredients();
  };

  const inventoryStats = [
    { label: 'Total Items', value: stats.totalItems, icon: Package, color: 'blue' },
    { label: 'Low Stock', value: stats.lowStockItems, icon: AlertTriangle, color: 'amber' },
    { label: 'Out of Stock', value: stats.outOfStockItems, icon: AlertTriangle, color: 'red' },
    { label: 'Well Stocked', value: stats.wellStockedItems, icon: Package, color: 'emerald' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your ingredient stock levels</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Ingredient</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventoryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Items</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <InventoryTable 
          searchQuery={searchQuery} 
          filterStatus={filterStatus} 
          onIngredientUpdate={handleIngredientUpdate}
        />
      </div>

      {showAddModal && (
        <AddIngredientModal 
          onClose={() => setShowAddModal(false)} 
          onIngredientAdded={handleIngredientAdded}
        />
      )}
    </div>
  );
};

export default InventoryManagement;