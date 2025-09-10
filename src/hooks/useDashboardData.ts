import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { Order as ApiOrder, OrderStats } from '../types/orders';
import { MenuItem, MenuStats } from '../types/menu';
import { MenuCategory } from '../types/menu';
import { Discount, DiscountStats } from '../types/discounts';

export interface DashboardStats {
  // Sales & Orders
  todaySales: number;
  todayOrders: number;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  
  // Menu & Categories
  totalMenuItems: number;
  availableMenuItems: number;
  totalCategories: number;
  activeCategories: number;
  
  // Inventory
  totalIngredients: number;
  lowStockItems: number;
  outOfStockItems: number;
  
  // Discounts
  totalDiscounts: number;
  activeDiscounts: number;
  expiredDiscounts: number;
  
  // Trends
  salesGrowth: number;
  ordersGrowth: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: ApiOrder[];
  lowStockAlerts: any[];
  salesData: any[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date;
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    stats: {
      todaySales: 0,
      todayOrders: 0,
      totalRevenue: 0,
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      totalMenuItems: 0,
      availableMenuItems: 0,
      totalCategories: 0,
      activeCategories: 0,
      totalIngredients: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalDiscounts: 0,
      activeDiscounts: 0,
      expiredDiscounts: 0,
      salesGrowth: 0,
      ordersGrowth: 0,
    },
    recentOrders: [],
    lowStockAlerts: [],
    salesData: [],
    isLoading: true,
    error: null,
    lastUpdated: new Date(),
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch all data in parallel
      const [
        ordersResponse,
        menuItemsResponse,
        categoriesResponse,
        inventoryResponse,
        discountsResponse,
        orderStatsResponse
      ] = await Promise.allSettled([
        api.orders.getAll({ limit: 10, sort: 'created_at', order: 'desc' }),
        api.menus.getAll({ limit: 1000 }), // Get all menu items for stats
        api.categories.getAll(),
        api.inventory.getAllIngredients(),
        api.discounts.getAll(),
        api.discounts.getStats()
      ]);

      // Parse responses
      const ordersResult = ordersResponse.status === 'fulfilled' ? await ordersResponse.value.json() : { success: false, data: [] };
      const menuItemsResult = menuItemsResponse.status === 'fulfilled' ? await menuItemsResponse.value.json() : { success: false, data: [] };
      const categoriesResult = categoriesResponse.status === 'fulfilled' ? await categoriesResponse.value.json() : { success: false, data: [] };
      const inventoryResult = inventoryResponse.status === 'fulfilled' ? await inventoryResponse.value.json() : { success: false, data: [] };
      const discountsResult = discountsResponse.status === 'fulfilled' ? await discountsResponse.value.json() : { success: false, data: [] };
      const orderStatsResult = orderStatsResponse.status === 'fulfilled' ? await orderStatsResponse.value.json() : { success: false, data: {} };

      // Log any failed API calls
      if (ordersResponse.status === 'rejected') console.error('Orders API failed:', ordersResponse.reason);
      if (menuItemsResponse.status === 'rejected') console.error('Menu Items API failed:', menuItemsResponse.reason);
      if (categoriesResponse.status === 'rejected') console.error('Categories API failed:', categoriesResponse.reason);
      if (inventoryResponse.status === 'rejected') console.error('Inventory API failed:', inventoryResponse.reason);
      if (discountsResponse.status === 'rejected') console.error('Discounts API failed:', discountsResponse.reason);
      if (orderStatsResponse.status === 'rejected') console.error('Order Stats API failed:', orderStatsResponse.reason);

      // Calculate today's date
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

      // Process orders data
      const orders = ordersResult.success ? ordersResult.data : [];
      const todayOrders = orders.filter((order: ApiOrder) => 
        new Date(order.created_at) >= todayStart
      );
      const yesterdayOrders = orders.filter((order: ApiOrder) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= yesterdayStart && orderDate < todayStart;
      });

      const todaySales = todayOrders.reduce((sum: number, order: ApiOrder) => 
        sum + (order.payment_status === 'paid' ? order.total_amount : 0), 0
      );
      const yesterdaySales = yesterdayOrders.reduce((sum: number, order: ApiOrder) => 
        sum + (order.payment_status === 'paid' ? order.total_amount : 0), 0
      );

      // Process menu data
      const menuItems = menuItemsResult.success ? menuItemsResult.data : [];
      const categories = categoriesResult.success ? categoriesResult.data : [];

      // Process inventory data
      const ingredients = inventoryResult.success ? inventoryResult.data : [];
      const lowStockItems = ingredients.filter((item: any) => 
        item.current_stock <= item.minimum_stock && item.current_stock > 0
      );
      const outOfStockItems = ingredients.filter((item: any) => 
        item.current_stock === 0
      );

      console.log('Inventory data:', { ingredients, lowStockItems, outOfStockItems });

      // Process discounts data
      const discounts = discountsResult.success ? discountsResult.data : [];
      const now = new Date();
      const activeDiscounts = discounts.filter((discount: Discount) => 
        discount.is_active && new Date(discount.valid_until) > now
      );
      const expiredDiscounts = discounts.filter((discount: Discount) => 
        new Date(discount.valid_until) <= now
      );

      // Calculate growth percentages
      const salesGrowth = yesterdaySales > 0 
        ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
        : 0;
      const ordersGrowth = yesterdayOrders.length > 0 
        ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100 
        : 0;

      // Generate sales data for chart (last 7 days)
      const salesData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayOrders = orders.filter((order: ApiOrder) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= dayStart && orderDate < dayEnd;
        });
        
        const daySales = dayOrders.reduce((sum: number, order: ApiOrder) => 
          sum + (order.payment_status === 'paid' ? order.total_amount : 0), 0
        );

        salesData.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          sales: daySales,
          orders: dayOrders.length,
          date: date.toISOString().split('T')[0]
        });
      }

      // Calculate stats
      const stats: DashboardStats = {
        todaySales,
        todayOrders: todayOrders.length,
        totalRevenue: orders.reduce((sum: number, order: ApiOrder) => 
          sum + (order.payment_status === 'paid' ? order.total_amount : 0), 0
        ),
        totalOrders: orders.length,
        completedOrders: orders.filter((order: ApiOrder) => order.status === 'completed').length,
        pendingOrders: orders.filter((order: ApiOrder) => 
          ['pending', 'preparing'].includes(order.status)
        ).length,
        totalMenuItems: menuItems.length,
        availableMenuItems: menuItems.filter((item: MenuItem) => item.is_available).length,
        totalCategories: categories.length,
        activeCategories: categories.filter((cat: MenuCategory) => cat.is_active).length,
        totalIngredients: ingredients.length,
        lowStockItems: lowStockItems.length,
        outOfStockItems: outOfStockItems.length,
        totalDiscounts: discounts.length,
        activeDiscounts: activeDiscounts.length,
        expiredDiscounts: expiredDiscounts.length,
        salesGrowth,
        ordersGrowth,
      };

      setData({
        stats,
        recentOrders: orders.slice(0, 5), // Get 5 most recent orders
        lowStockAlerts: [...lowStockItems, ...outOfStockItems].slice(0, 5),
        salesData,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load dashboard data',
      }));
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return {
    ...data,
    refresh: fetchDashboardData,
  };
};
