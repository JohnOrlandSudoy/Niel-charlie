import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import MenuItemCard from './MenuItemCard';
import AddMenuItemModal from './AddMenuItemModal';
import EditMenuItemModal from './EditMenuItemModal';
import ManageIngredientsModal from './ManageIngredientsModal';
import { api } from '../../utils/api';
import { MenuItem, MenuStats, ApiResponse, CreateMenuItemRequest, MenuCategory, PaginatedResponse } from '../../types/menu';
import { storageHelpers } from '../../lib/supabase';


const MenuManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAvailable, setFilterAvailable] = useState<boolean | undefined>(undefined);
  const [filterFeatured, setFilterFeatured] = useState<boolean | undefined>(undefined);
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
  const [managingIngredients, setManagingIngredients] = useState<MenuItem | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(12); // Fixed items per page

  // Transform API MenuItem to card format for MenuItemCard
  const transformToCardFormat = (item: MenuItem) => {
    // Construct image URL from filename or use image_url if available
    let imageUrl = '';
    if (item.image_url) {
      imageUrl = item.image_url;
    } else if (item.image_filename) {
      // For Supabase Storage, get the public URL
      imageUrl = storageHelpers.getPublicUrl('menu-item-images', item.image_filename);
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: getCategoryName(item.category_id), // Use actual category name
      image: imageUrl,
      available: item.is_available,
      prepTime: item.prep_time,
      popularity: item.popularity,
      isFeatured: item.is_featured,
      calories: item.calories,
      allergens: item.allergens || [],
      ingredients: item.ingredients || []
    };
  };

  // Handle ingredient management
  const handleManageIngredients = (item: any) => {
    // Find the full menu item data
    const fullMenuItem = menuItems.find(menuItem => menuItem.id === item.id);
    if (fullMenuItem) {
      setManagingIngredients(fullMenuItem);
    }
  };

  // Handle edit menu item
  const handleEditMenuItem = (item: any) => {
    // Find the full menu item data
    const fullMenuItem = menuItems.find(menuItem => menuItem.id === item.id);
    if (fullMenuItem) {
      setEditingMenuItem(fullMenuItem);
    }
  };

  // Handle ingredients updated
  const handleIngredientsUpdated = async () => {
    if (managingIngredients) {
      try {
        // Fetch updated ingredients for the specific menu item
        const ingredientsResponse = await api.inventory.getMenuItemIngredients(managingIngredients.id);
        const ingredientsResult = await ingredientsResponse.json();
        
        if (ingredientsResult.success && ingredientsResult.data) {
          // Update the specific menu item with new ingredients
          setMenuItems(prev => 
            prev.map(item => 
              item.id === managingIngredients.id 
                ? { ...item, ingredients: ingredientsResult.data }
                : item
            )
          );
          console.log('Updated ingredients for menu item:', managingIngredients.id, ingredientsResult.data);
        }
      } catch (err) {
        console.error('Error updating ingredients:', err);
        // Fallback to full refresh if specific update fails
        fetchMenuItems();
      }
    }
  };

  // Handle menu item updated
  const handleMenuItemUpdated = (updatedItem: MenuItem) => {
    // Update the specific menu item in the list
    setMenuItems(prev => 
      prev.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    );
    console.log('Updated menu item:', updatedItem);
  };

  // Fetch menu items from API with server-side filtering and pagination
  const fetchMenuItems = async (page: number = currentPage, resetPage: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query parameters
      const queryParams: any = {
        page: resetPage ? 1 : page,
        limit: itemsPerPage
      };
      
      // Add filters
      if (filterCategory !== 'all') {
        queryParams.category = filterCategory;
      }
      if (filterAvailable !== undefined) {
        queryParams.available = filterAvailable;
      }
      if (filterFeatured !== undefined) {
        queryParams.featured = filterFeatured;
      }
      if (searchQuery.trim()) {
        queryParams.search = searchQuery.trim();
      }
      
      console.log('Fetching menu items with params:', queryParams);
      
      const response = await api.menus.getAll(queryParams);
      const result: PaginatedResponse<MenuItem> = await response.json();
      
      if (result.success && result.data) {
        // Fetch ingredients for each menu item
        const menuItemsWithIngredients = await Promise.all(
          result.data.map(async (menuItem) => {
            try {
              const ingredientsResponse = await api.inventory.getMenuItemIngredients(menuItem.id);
              const ingredientsResult = await ingredientsResponse.json();
              
              if (ingredientsResult.success && ingredientsResult.data) {
                return {
                  ...menuItem,
                  ingredients: ingredientsResult.data
                };
              } else {
                console.warn(`Failed to fetch ingredients for menu item ${menuItem.id}:`, ingredientsResult.message);
                return {
                  ...menuItem,
                  ingredients: []
                };
              }
            } catch (err) {
              console.warn(`Error fetching ingredients for menu item ${menuItem.id}:`, err);
              return {
                ...menuItem,
                ingredients: []
              };
            }
          })
        );
        
        setMenuItems(menuItemsWithIngredients);
        
        // Update pagination state
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.total);
        
        // Calculate stats from current page data (for display purposes)
        // Note: For accurate stats, we'd need a separate stats endpoint
        console.log('Calculating stats for current page items:', menuItemsWithIngredients.length);
        calculateStats(menuItemsWithIngredients);
        
        console.log('Menu items with ingredients:', menuItemsWithIngredients);
        console.log('Pagination info:', result.pagination);
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
    
    // Calculate average price with debugging
    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    const averagePrice = totalItems > 0 ? Math.round(totalPrice / totalItems) : 0;
    
    // Debug logging
    console.log('Calculating stats for items:', items.map(item => ({ name: item.name, price: item.price })));
    console.log('Total price:', totalPrice, 'Total items:', totalItems, 'Average:', averagePrice);
    
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
      
      // Extract image file from the request
      const { image, ...menuData } = newItem;
      
      const response = await api.menus.create(menuData, image);
      const result: ApiResponse<MenuItem> = await response.json();
      
      if (result.success && result.data) {
        // Refresh the current page to show the new item
        // This ensures proper pagination and filtering
        fetchMenuItems(currentPage, false);
        setShowAddModal(false);
        console.log('Menu item created successfully:', result.data);
      } else {
        setError(result.message || 'Failed to add menu item');
      }
    } catch (err) {
      console.error('Error adding menu item:', err);
      setError('Failed to add menu item. Please try again.');
    }
  };

  // Handle deleting menu item (soft delete)
  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item? This will make it unavailable but preserve the data.')) {
      return;
    }
    
    try {
      console.log('Deleting menu item:', id);
      
      const response = await api.menus.delete(id);
      const result: ApiResponse<null> = await response.json();
      
      console.log('Delete response:', result);
      
      if (result.success) {
        // Remove the item from the current page list
        const updatedItems = menuItems.filter(item => item.id !== id);
        setMenuItems(updatedItems);
        
        // Update total count
        setTotalItems(prev => prev - 1);
        
        // Recalculate stats for current page
        calculateStats(updatedItems);
        
        // If we're on a page that's now empty and not the first page, go to previous page
        if (updatedItems.length === 0 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
        
        console.log('Menu item deleted successfully');
      } else {
        setError(result.message || 'Failed to delete menu item');
      }
    } catch (err) {
      console.error('Error deleting menu item:', err);
      setError('Failed to delete menu item. Please try again.');
    }
  };

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Reset to page 1 when searching
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: any) => {
    switch (filterType) {
      case 'category':
        setFilterCategory(value);
        break;
      case 'available':
        setFilterAvailable(value === 'all' ? undefined : value === 'true');
        break;
      case 'featured':
        setFilterFeatured(value === 'all' ? undefined : value === 'true');
        break;
    }
    // Reset to page 1 when filtering
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Load menu items and categories on component mount
  useEffect(() => {
    fetchMenuItems(1, true); // Start with page 1
    fetchCategories();
  }, []);

  // Refetch when filters or search change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMenuItems(1, true); // Reset to page 1 when filters change
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filterCategory, filterAvailable, filterFeatured]);

  // Refetch when page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchMenuItems(currentPage, false);
    }
  }, [currentPage]);

  // No need for client-side filtering since we're using server-side filtering
  const filteredItems = menuItems;

  // Get category name by ID
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'No Category';
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
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</p>
          <p className="text-xs text-gray-500 mt-1">Across all pages</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Current Page</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{menuItems.length}</p>
          <p className="text-xs text-gray-500 mt-1">Items on this page</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Available</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.availableItems}</p>
          <p className="text-xs text-gray-500 mt-1">On current page</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Avg. Price</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₱{stats.averagePrice}</p>
          <p className="text-xs text-gray-500 mt-1">Current page ({menuItems.length} items)</p>
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
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
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
            
            <select
              value={filterAvailable === undefined ? 'all' : filterAvailable.toString()}
              onChange={(e) => handleFilterChange('available', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Availability</option>
              <option value="true">Available Only</option>
              <option value="false">Unavailable Only</option>
            </select>
            
            <select
              value={filterFeatured === undefined ? 'all' : filterFeatured.toString()}
              onChange={(e) => handleFilterChange('featured', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Items</option>
              <option value="true">Featured Only</option>
              <option value="false">Non-Featured Only</option>
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
                item={transformToCardFormat(item)} 
                onDelete={handleDeleteMenuItem}
                onEdit={handleEditMenuItem}
                onManageIngredients={handleManageIngredients}
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

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            {/* Page Numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddMenuItemModal 
          onClose={() => setShowAddModal(false)} 
          onSubmit={handleAddMenuItem}
        />
      )}

      {managingIngredients && (
        <ManageIngredientsModal
          menuItem={managingIngredients}
          onClose={() => setManagingIngredients(null)}
          onIngredientsUpdated={handleIngredientsUpdated}
        />
      )}

      {editingMenuItem && (
        <EditMenuItemModal
          menuItem={editingMenuItem}
          categories={categories}
          onClose={() => setEditingMenuItem(null)}
          onMenuItemUpdated={handleMenuItemUpdated}
        />
      )}
    </div>
  );
};

export default MenuManagement;