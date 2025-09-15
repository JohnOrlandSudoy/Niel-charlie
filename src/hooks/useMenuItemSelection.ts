import { useState, useCallback, useMemo } from 'react';
import { api } from '../utils/api';
import { MenuItem, ApiResponse, MenuCategory } from '../types/menu';
import { storageHelpers } from '../lib/supabase';

export const useMenuItemSelection = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryData, setCategoryData] = useState<MenuCategory[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.categories.getAll();
      const result: ApiResponse<MenuCategory[]> = await response.json();
      
      if (result.success && result.data) {
        setCategoryData(result.data.filter(category => category.is_active));
        console.log('Categories loaded:', result.data);
      } else {
        console.error('Failed to fetch categories:', result.message);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch menu items with ingredients (matches MenuManagement logic)
  const fetchMenuItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch both menu items and categories in parallel
      const [menuResponse, categoriesResponse] = await Promise.all([
        api.menus.getAll(),
        api.categories.getAll()
      ]);
      
      const menuResult: ApiResponse<MenuItem[]> = await menuResponse.json();
      const categoriesResult: ApiResponse<MenuCategory[]> = await categoriesResponse.json();
      
      // Set categories data
      if (categoriesResult.success && categoriesResult.data) {
        setCategoryData(categoriesResult.data.filter(category => category.is_active));
      }
      
      if (menuResult.success && menuResult.data) {
        // Fetch ingredients for each menu item (same as MenuManagement)
        const menuItemsWithIngredients = await Promise.all(
          menuResult.data.map(async (menuItem) => {
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
        
        // Extract unique categories
        const uniqueCategories = [...new Set(menuItemsWithIngredients.map(item => item.category_id).filter(Boolean))];
        setCategories(uniqueCategories);
        
        console.log('Menu items with ingredients loaded:', menuItemsWithIngredients);
        
        // Debug: Check if ingredients are loaded for each item
        menuItemsWithIngredients.forEach(item => {
          console.log(`Item "${item.name}":`, {
            hasIngredients: !!item.ingredients,
            ingredientsCount: item.ingredients?.length || 0,
            isAvailable: item.is_available,
            ingredients: item.ingredients?.map(ing => ({
              name: ing.ingredient?.name,
              current_stock: ing.ingredient?.current_stock,
              quantity_required: ing.quantity_required,
              is_optional: ing.is_optional
            }))
          });
        });
      } else {
        setError(menuResult.message || 'Failed to fetch menu items');
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to fetch menu items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter menu items (now we can trust the database is_available field after implementing triggers)
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || item.category_id === filterCategory;
      
      // Now we can trust the database is_available field since we have triggers to keep it updated
      // But we'll still do a real-time check as a fallback for immediate updates
      return matchesSearch && matchesCategory && item.is_available;
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
    
    // Find the category in the loaded category data
    const category = categoryData.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId; // Fallback to ID if not found
  }, [categoryData]);

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
    categoryData,
    imageErrors,
    filteredItems,
    fetchMenuItems,
    fetchCategories,
    getImageUrl,
    handleImageError,
    getCategoryName
  };
};
