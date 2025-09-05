import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Loader2, AlertCircle, Grid, List } from 'lucide-react';
import CategoryCard from './CategoryCard';
import AddCategoryModal from './AddCategoryModal';
import { api } from '../../utils/api';
import { MenuCategory, ApiResponse } from '../../types/menu';

const CategoryManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0
  });

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.categories.getAll();
      const result: ApiResponse<MenuCategory[]> = await response.json();
      
      if (result.success && result.data) {
        setCategories(result.data);
        calculateStats(result.data);
      } else {
        setError(result.message || 'Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics from categories
  const calculateStats = (categories: MenuCategory[]) => {
    const totalCategories = categories.length;
    const activeCategories = categories.filter(cat => cat.is_active).length;
    const inactiveCategories = totalCategories - activeCategories;
    
    setStats({
      totalCategories,
      activeCategories,
      inactiveCategories
    });
  };

  // Handle adding/updating category
  const handleSubmitCategory = async (categoryData: any) => {
    try {
      let response;
      if (editingCategory) {
        // Update existing category
        response = await api.categories.update(editingCategory.id, categoryData);
      } else {
        // Create new category
        response = await api.categories.create(categoryData);
      }
      
      const result: ApiResponse<MenuCategory> = await response.json();
      
      if (result.success && result.data) {
        if (editingCategory) {
          // Update existing category in state
          setCategories(prev => 
            prev.map(cat => cat.id === editingCategory.id ? result.data : cat)
          );
        } else {
          // Add new category to state
          setCategories(prev => [...prev, result.data]);
        }
        calculateStats([...categories, result.data]);
        setShowAddModal(false);
        setEditingCategory(null);
      } else {
        console.error('Category creation failed:', result);
        setError(result.message || result.error || 'Failed to save category');
      }
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category. Please try again.');
    }
  };

  // Handle editing category
  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setShowAddModal(true);
  };

  // Handle deleting category
  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await api.categories.delete(id);
      const result: ApiResponse<null> = await response.json();
      
      if (result.success) {
        const updatedCategories = categories.filter(cat => cat.id !== id);
        setCategories(updatedCategories);
        calculateStats(updatedCategories);
      } else {
        setError(result.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
    }
  };

  // Handle toggling category active status
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const category = categories.find(cat => cat.id === id);
      if (!category) return;

      const response = await api.categories.update(id, {
        ...category,
        is_active: isActive
      });
      
      const result: ApiResponse<MenuCategory> = await response.json();
      
      if (result.success && result.data) {
        setCategories(prev => 
          prev.map(cat => cat.id === id ? result.data : cat)
        );
        calculateStats(categories.map(cat => cat.id === id ? result.data : cat));
      } else {
        setError(result.message || 'Failed to update category status');
      }
    } catch (err) {
      console.error('Error updating category status:', err);
      setError('Failed to update category status. Please try again.');
    }
  };

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search and status
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && category.is_active) ||
                         (filterStatus === 'inactive' && !category.is_active);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-1">Manage your menu categories and organize your menu items</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Categories</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCategories}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.activeCategories}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Inactive</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactiveCategories}</p>
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
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-1 border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-lg transition-colors duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-lg transition-colors duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading categories...</span>
        </div>
      ) : (
        /* Categories Grid/List */
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredCategories.length > 0 ? (
            filteredCategories.map(category => (
              <CategoryCard 
                key={category.id} 
                category={category}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onToggleActive={handleToggleActive}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No categories found</p>
              <p className="text-gray-400 mt-1">Try adjusting your search or add a new category</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {showAddModal && (
        <AddCategoryModal 
          onClose={() => {
            setShowAddModal(false);
            setEditingCategory(null);
          }} 
          onSubmit={handleSubmitCategory}
          editingCategory={editingCategory}
        />
      )}
    </div>
  );
};

export default CategoryManagement;
