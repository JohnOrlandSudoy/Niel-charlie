import { useState, useCallback, useMemo } from 'react';
import { api } from '../utils/api';
import { MenuItem, ApiResponse } from '../types/menu';
import { storageHelpers } from '../lib/supabase';

export const useMenuItemSelection = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Fetch menu items
  const fetchMenuItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.menus.getAll();
      const result: ApiResponse<MenuItem[]> = await response.json();
      
      if (result.success && result.data) {
        setMenuItems(result.data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(result.data.map(item => item.category_id).filter(Boolean))];
        setCategories(uniqueCategories);
      } else {
        setError(result.message || 'Failed to fetch menu items');
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to fetch menu items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || item.category_id === filterCategory;
      const isAvailable = item.is_available;
      
      return matchesSearch && matchesCategory && isAvailable;
    });
  }, [menuItems, searchQuery, filterCategory]);

  // Get image URL for menu item
  const getImageUrl = useCallback((item: MenuItem) => {
    if (item.image_filename) {
      return storageHelpers.getPublicUrl('menu-item-images', item.image_filename);
    }
    return null;
  }, []);

  // Handle image error
  const handleImageError = useCallback((itemId: string) => {
    setImageErrors(prev => new Set(prev).add(itemId));
  }, []);

  // Get category name
  const getCategoryName = useCallback((categoryId: string | null) => {
    if (!categoryId) return 'No Category';
    // You might want to fetch category names from your categories API
    return categoryId;
  }, []);

  return {
    menuItems,
    setMenuItems,
    isLoading,
    error,
    setError,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    categories,
    imageErrors,
    filteredItems,
    fetchMenuItems,
    getImageUrl,
    handleImageError,
    getCategoryName
  };
};
