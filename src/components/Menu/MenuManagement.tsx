import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import MenuItemCard from './MenuItemCard';
import AddMenuItemModal from './AddMenuItemModal';
import { api } from '../../utils/api';
import { MenuItem, MenuStats, ApiResponse, CreateMenuItemRequest, MenuCategory } from '../../types/menu';

// Legacy interface for MenuItemCard compatibility
interface LegacyMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  prepTime: number;
  popularity: number;
}

const MenuManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MenuStats>({
    totalItems: 0,
    availableItems: 0,
    unavailableItems: 0,
    averagePrice: 0
  });

  // Transform API MenuItem to legacy format for MenuItemCard
  const transformToLegacyFormat = (item: MenuItem): LegacyMenuItem => {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: getCategoryName(item.category_id), // Use actual category name
      image: item.image_url || '',
      available: item.is_available,
      ingredients: [], // Empty for now since API doesn't include ingredients
      prepTime: item.prep_time,
      popularity: 0 // Default value since API doesn't include popularity
    };
  };

  // Fetch menu items from API
  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.menus.getAll();
      const result: ApiResponse<MenuItem[]> = await response.json();
      
      if (result.success && result.data) {
        setMenuItems(result.data);
        calculateStats(result.data);
      } else {
        setError(result.message || 'Failed to fetch menu items');
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to fetch menu items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      
      const response = await api.categories.getAll();
      const result: ApiResponse<MenuCategory[]> = await response.json();
      
      if (result.success && result.data) {
        setCategories(result.data.filter(category => category.is_active));
      } else {
        console.error('Failed to fetch categories:', result.message);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Calculate statistics from menu items
  const calculateStats = (items: MenuItem[]) => {
    const totalItems = items.length;
    const availableItems = items.filter(item => item.is_available).length;
    const unavailableItems = totalItems - availableItems;
    const averagePrice = totalItems > 0 
      ? Math.round(items.reduce((sum, item) => sum + item.price, 0) / totalItems)
      : 0;
    
    setStats({
      totalItems,
      availableItems,
      unavailableItems,
      averagePrice
    });
  };

  // Handle adding new menu item
  const handleAddMenuItem = async (newItem: CreateMenuItemRequest) => {
    try {
      console.log('Creating menu item with data:', newItem);
      const response = await api.menus.create(newItem);
      const result: ApiResponse<MenuItem> = await response.json();
      
      if (result.success && result.data) {
        setMenuItems(prev => [...prev, result.data]);
        calculateStats([...menuItems, result.data]);
        setShowAddModal(false);
      } else {
        setError(result.message || 'Failed to add menu item');
      }
    } catch (err) {
      console.error('Error adding menu item:', err);
      setError('Failed to add menu item. Please try again.');
    }
  };

  // Handle deleting menu item
  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }
    
    try {
      const response = await api.menus.delete(id);
      const result: ApiResponse<null> = await response.json();
      
      if (result.success) {
        const updatedItems = menuItems.filter(item => item.id !== id);
        setMenuItems(updatedItems);
        calculateStats(updatedItems);
      } else {
        setError(result.message || 'Failed to delete menu item');
      }
    } catch (err) {
      console.error('Error deleting menu item:', err);
      setError('Failed to delete menu item. Please try again.');
    }
  };

  // Load menu items and categories on component mount
  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = filterCategory === 'all' || item.category_id === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-1">Manage your menu items and track ingredient dependencies</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Available</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.availableItems}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Unavailable</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.unavailableItems}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Avg. Price</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₱{stats.averagePrice}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoadingCategories}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {isLoadingCategories && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading menu items...</span>
        </div>
      ) : (
        /* Menu Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <MenuItemCard 
                key={item.id} 
                item={transformToLegacyFormat(item)} 
                onDelete={handleDeleteMenuItem}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No menu items found</p>
              <p className="text-gray-400 mt-1">Try adjusting your search or add a new item</p>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <AddMenuItemModal 
          onClose={() => setShowAddModal(false)} 
          onSubmit={handleAddMenuItem}
        />
      )}
    </div>
  );
};

export default MenuManagement;