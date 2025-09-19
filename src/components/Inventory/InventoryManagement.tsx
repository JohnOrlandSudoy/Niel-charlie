import React, { useState, useEffect } from 'react';
import { Search, Plus, AlertTriangle, Package, Filter, Loader2, Download, X } from 'lucide-react';
import InventoryTable from './InventoryTable';
import AddIngredientModal from './AddIngredientModal';
import { api } from '../../utils/api';
import { Ingredient, InventoryStats, ApiResponse } from '../../types/inventory';
import * as XLSX from 'xlsx';

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
  
  // Export functionality states
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

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

  // Export inventory to Excel
  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      
      console.log('📊 Starting inventory Excel export...');
      
      // Get filtered ingredients based on current search and filter
      let filteredIngredients = ingredients;
      
      // Apply search filter
      if (searchQuery.trim()) {
        filteredIngredients = filteredIngredients.filter(ingredient =>
          ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ingredient.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ingredient.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply status filter
      if (filterStatus !== 'all') {
        filteredIngredients = filteredIngredients.filter(ingredient => {
          switch (filterStatus) {
            case 'in-stock':
              return ingredient.current_stock > (ingredient.min_stock_threshold || 0);
            case 'low-stock':
              return ingredient.current_stock > 0 && ingredient.current_stock <= (ingredient.min_stock_threshold || 0);
            case 'out-of-stock':
              return ingredient.current_stock === 0;
            default:
              return true;
          }
        });
      }

      // Prepare data for Excel export
      const exportData = filteredIngredients.map((ingredient) => {
        // Calculate stock status
        const getStockStatus = () => {
          if (ingredient.current_stock === 0) return 'OUT OF STOCK';
          if (ingredient.min_stock_threshold && ingredient.current_stock <= ingredient.min_stock_threshold) {
            return 'LOW STOCK';
          }
          return 'IN STOCK';
        };

        // Calculate total value
        const totalValue = ingredient.cost_per_unit ? ingredient.current_stock * ingredient.cost_per_unit : 0;

        // Format dates
        const formatDate = (dateString: string) => {
          return new Date(dateString).toLocaleString('en-PH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        };

        return {
          'Ingredient Name': ingredient.name,
          'Description': ingredient.description || '',
          'Current Stock': ingredient.current_stock,
          'Unit': ingredient.unit || '',
          'Min Stock Threshold': ingredient.min_stock_threshold || 0,
          'Stock Status': getStockStatus(),
          'Cost Per Unit': ingredient.cost_per_unit || 0,
          'Total Value': totalValue,
          'Supplier': ingredient.supplier || '',
          'Category': ingredient.category || '',
          'Location': ingredient.location || '',
          'Expiry Date': ingredient.expiry_date ? formatDate(ingredient.expiry_date) : '',
          'Last Updated': ingredient.updated_at ? formatDate(ingredient.updated_at) : '',
          'Created Date': ingredient.created_at ? formatDate(ingredient.created_at) : '',
          'Notes': ingredient.notes || ''
        };
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Main inventory sheet
      const inventorySheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Ingredient Name
        { wch: 30 }, // Description
        { wch: 15 }, // Current Stock
        { wch: 10 }, // Unit
        { wch: 18 }, // Min Stock Threshold
        { wch: 15 }, // Stock Status
        { wch: 15 }, // Cost Per Unit
        { wch: 15 }, // Total Value
        { wch: 20 }, // Supplier
        { wch: 15 }, // Category
        { wch: 15 }, // Location
        { wch: 20 }, // Expiry Date
        { wch: 20 }, // Last Updated
        { wch: 20 }, // Created Date
        { wch: 30 }  // Notes
      ];
      inventorySheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Inventory');

      // Create summary sheet
      const summaryData = [
        { 'Metric': 'Total Ingredients', 'Value': filteredIngredients.length },
        { 'Metric': 'Total Stock Value', 'Value': `₱${filteredIngredients.reduce((sum, ingredient) => {
          const value = ingredient.cost_per_unit ? ingredient.current_stock * ingredient.cost_per_unit : 0;
          return sum + value;
        }, 0).toFixed(2)}` },
        { 'Metric': 'In Stock Items', 'Value': filteredIngredients.filter(i => i.current_stock > (i.min_stock_threshold || 0)).length },
        { 'Metric': 'Low Stock Items', 'Value': filteredIngredients.filter(i => i.current_stock > 0 && i.current_stock <= (i.min_stock_threshold || 0)).length },
        { 'Metric': 'Out of Stock Items', 'Value': filteredIngredients.filter(i => i.current_stock === 0).length },
        { 'Metric': 'Total Current Stock', 'Value': filteredIngredients.reduce((sum, ingredient) => sum + ingredient.current_stock, 0) },
        { 'Metric': 'Average Cost Per Unit', 'Value': `₱${(filteredIngredients.reduce((sum, ingredient) => sum + (ingredient.cost_per_unit || 0), 0) / filteredIngredients.length || 0).toFixed(2)}` },
        { 'Metric': 'Export Date', 'Value': new Date().toLocaleString('en-PH') },
        { 'Metric': 'Export Generated By', 'Value': 'Restaurant Management System' },
        { 'Metric': 'Search Query', 'Value': searchQuery || 'All Items' },
        { 'Metric': 'Filter Applied', 'Value': filterStatus === 'all' ? 'All Items' : filterStatus.replace('-', ' ').toUpperCase() }
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Inventory_Report_${timestamp}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);
      
      console.log(`✅ Inventory Excel export completed: ${filename}`);
      console.log(`📊 Exported ${filteredIngredients.length} ingredients`);
      
    } catch (error) {
      console.error('❌ Inventory Excel export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Failed to export inventory to Excel');
    } finally {
      setIsExporting(false);
    }
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
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportToExcel}
            disabled={isExporting}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors duration-200"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Export Error Display */}
      {exportError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">Export Error: {exportError}</span>
            <button
              onClick={() => setExportError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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