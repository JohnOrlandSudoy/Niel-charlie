import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Printer, AlertTriangle, Loader2, Trash2, X, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { api } from '../../utils/api';
import { Order as ApiOrder, PaginatedOrderResponse } from '../../types/orders';
import * as XLSX from 'xlsx';

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);
  
  // Delete functionality states
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [bulkDeleteResults, setBulkDeleteResults] = useState<any[]>([]);
  const [forceDelete, setForceDelete] = useState(false);
  const [showForceDeleteWarning, setShowForceDeleteWarning] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  
  // Export functionality states
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Fetch orders from API
  const fetchOrders = async (page: number = currentPage, resetPage: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams: any = {
        page: resetPage ? 1 : page,
        limit: itemsPerPage
      };
      
      if (filterStatus !== 'all') {
        queryParams.status = filterStatus;
      }
      
      if (filterType !== 'all') {
        queryParams.order_type = filterType;
      }
      
      console.log('Fetching orders with params:', queryParams);
      
      const response = await api.orders.getAll(queryParams);
      const result: PaginatedOrderResponse = await response.json();
      
      if (result.success && result.data) {
        // Check if orders have items and enhance them if needed
        const enhancedOrders = await enhanceOrdersWithItems(result.data);
        
        setOrders(enhancedOrders);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.total);
        console.log('Orders fetched:', enhancedOrders);
        console.log('Pagination info:', result.pagination);
      } else {
        setError(result.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhance orders with items if they're missing
  const enhanceOrdersWithItems = async (orders: ApiOrder[]): Promise<ApiOrder[]> => {
    try {
      // Check which orders are missing items
      const ordersWithoutItems = orders.filter(order => 
        (!order.order_items || order.order_items.length === 0) && 
        (!order.items || order.items.length === 0)
      );

      if (ordersWithoutItems.length === 0) {
        console.log('✅ All orders have items');
        return orders;
      }

      console.log(`⚠️ Found ${ordersWithoutItems.length} orders without items, attempting to fetch...`);

      // Try to fetch detailed orders with items using the kitchen endpoint
      try {
        const kitchenResponse = await api.orders.getKitchenOrders();
        const kitchenResult = await kitchenResponse.json();
        
        if (kitchenResult.success && kitchenResult.data) {
          console.log('✅ Successfully fetched detailed orders from kitchen endpoint');
          
          // Merge kitchen orders data with current orders
          const enhancedOrders = orders.map(order => {
            const kitchenOrder = kitchenResult.data.find((ko: any) => ko.id === order.id);
            if (kitchenOrder && kitchenOrder.order_items) {
              return {
                ...order,
                order_items: kitchenOrder.order_items,
                items: kitchenOrder.order_items // Also set items for backward compatibility
              };
            }
            return order;
          });
          
          return enhancedOrders;
        }
      } catch (kitchenError) {
        console.warn('⚠️ Could not fetch kitchen orders:', kitchenError);
      }

      return orders;
    } catch (error) {
      console.error('Error enhancing orders with items:', error);
      return orders;
    }
  };

  // Search orders
  const searchOrders = async (query: string) => {
    if (!query.trim()) {
      fetchOrders(1, true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.orders.search({
        q: query,
        page: 1,
        limit: itemsPerPage
      });
      
      const result: PaginatedOrderResponse = await response.json();
      
      if (result.success && result.data) {
        setOrders(result.data);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.total);
      } else {
        setError(result.message || 'Failed to search orders');
      }
    } catch (err) {
      console.error('Error searching orders:', err);
      setError('Failed to search orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchOrders(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'status') {
      setFilterStatus(value);
    } else if (filterType === 'type') {
      setFilterType(value);
    }
    setCurrentPage(1);
  };

  // Load data on component mount
  useEffect(() => {
    fetchOrders(1, true);
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchOrders(1, true);
  }, [filterStatus, filterType]);

  // Refetch when page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchOrders(currentPage, false);
    }
  }, [currentPage]);

  // Delete single order
  const handleDeleteOrder = async (orderId: string, force: boolean = false) => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      console.log(`Deleting order ${orderId}${force ? ' with force' : ''}`);
      
      const response = await api.orders.delete(orderId, force);
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Remove order from local state
        setOrders(prev => prev.filter(order => order.id !== orderId));
        setTotalItems(prev => prev - 1);
        setShowDeleteModal(false);
        setDeleteOrderId(null);
        
        // Show success message
        console.log('✅ Order deleted successfully');
      } else {
        setDeleteError(result.message || result.error || 'Failed to delete order');
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      setDeleteError('Failed to delete order. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel order (soft delete)
  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      setIsCancelling(true);
      setDeleteError(null);
      
      const response = await api.orders.cancel(orderId, reason);
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update order status in local state
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' }
            : order
        ));
        setShowCancelModal(false);
        setCancelOrderId(null);
        setCancelReason('');
        
        // Show success message
        console.log('✅ Order cancelled successfully');
      } else {
        setDeleteError(result.error || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setDeleteError('Failed to cancel order. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Bulk delete orders
  const handleBulkDelete = async (force: boolean = false) => {
    if (selectedOrders.length === 0) return;
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      console.log(`Bulk deleting ${selectedOrders.length} orders${force ? ' with force' : ''}`);
      
      const response = await api.orders.bulkDelete(selectedOrders, force);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setBulkDeleteResults(result.data || []);
        
        // Remove successfully deleted orders from local state
        const deletedIds = result.data
          ?.filter((item: any) => item.success)
          ?.map((item: any) => item.orderId) || [];
        
        setOrders(prev => prev.filter(order => !deletedIds.includes(order.id)));
        setTotalItems(prev => prev - deletedIds.length);
        setSelectedOrders([]);
        setShowDeleteModal(false);
        
        console.log('✅ Bulk delete completed');
      } else {
        setDeleteError(result.message || result.error || 'Failed to delete orders');
      }
    } catch (err) {
      console.error('Error bulk deleting orders:', err);
      setDeleteError('Failed to delete orders. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle order selection for bulk operations
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle select all orders
  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  };

  // Handle note expansion
  const toggleNoteExpansion = (orderId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Export orders to Excel
  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      
      console.log('📊 Starting Excel export...');
      
      // Fetch all orders for export (not just current page)
      let allOrders: ApiOrder[] = [];
      
      try {
        // Get all orders without pagination
        const response = await api.orders.getAll({
          page: 1,
          limit: 10000, // Large limit to get all orders
          ...(filterStatus !== 'all' && { status: filterStatus }),
          ...(filterType !== 'all' && { order_type: filterType })
        });
        
        const result: PaginatedOrderResponse = await response.json();
        
        if (result.success && result.data) {
          allOrders = await enhanceOrdersWithItems(result.data);
          console.log(`📊 Fetched ${allOrders.length} orders for export`);
        } else {
          throw new Error(result.message || 'Failed to fetch orders for export');
        }
      } catch (fetchError) {
        console.warn('⚠️ Could not fetch all orders, using current page data');
        allOrders = orders; // Fallback to current page data
      }

      // Prepare data for Excel export
      const exportData = allOrders.map((order) => {
        // Get order items
        const orderItems = order.order_items || order.items || [];
        
        // Calculate item details
        const itemDetails = orderItems.map((item: any) => {
          const itemName = (item as any).menu_items?.name || item.menu_item?.name || 'Unknown Item';
          const quantity = item.quantity || 0;
          const unitPrice = item.unit_price || 0;
          const totalPrice = quantity * unitPrice;
          
          return {
            itemName,
            quantity,
            unitPrice,
            totalPrice,
            customizations: item.customizations ? JSON.stringify(item.customizations) : '',
            specialInstructions: item.special_instructions || ''
          };
        });

        // Format dates
        const formatDate = (dateString: string) => {
          return new Date(dateString).toLocaleString('en-PH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        };

        // Main order data
        const orderData = {
          'Order Number': order.order_number,
          'Order ID': order.id,
          'Customer Name': order.customer_name || 'Walk-in Customer',
          'Customer Phone': order.customer_phone || '',
          'Order Type': order.order_type.replace('_', ' ').toUpperCase(),
          'Table Number': order.table_number || '',
          'Status': order.status.toUpperCase(),
          'Payment Status': order.payment_status.toUpperCase(),
          'Payment Method': order.payment_method || '',
          'Subtotal': order.subtotal || 0,
          'VAT Amount': order.tax_amount || 0,
          'Discount Amount': order.discount_amount || 0,
          'Total Amount': order.total_amount,
          'Special Instructions': order.special_instructions || '',
          'Created Date': formatDate(order.created_at),
          'Updated Date': formatDate(order.updated_at),
          'Items Count': orderItems.length,
          'Items Details': itemDetails.map(item => 
            `${item.itemName} (Qty: ${item.quantity}, Price: ₱${item.unitPrice.toFixed(2)}, Total: ₱${item.totalPrice.toFixed(2)})`
          ).join('; ')
        };

        return orderData;
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Main orders sheet
      const ordersSheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Order Number
        { wch: 25 }, // Order ID
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Customer Phone
        { wch: 12 }, // Order Type
        { wch: 12 }, // Table Number
        { wch: 12 }, // Status
        { wch: 15 }, // Payment Status
        { wch: 15 }, // Payment Method
        { wch: 12 }, // Subtotal
        { wch: 12 }, // Tax Amount
        { wch: 15 }, // Discount Amount
        { wch: 15 }, // Total Amount
        { wch: 30 }, // Special Instructions
        { wch: 20 }, // Created Date
        { wch: 20 }, // Updated Date
        { wch: 12 }, // Items Count
        { wch: 50 }  // Items Details
      ];
      ordersSheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');

      // Create summary sheet
      const summaryData = [
        { 'Metric': 'Total Orders', 'Value': allOrders.length },
        { 'Metric': 'Total Revenue', 'Value': `₱${allOrders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}` },
        { 'Metric': 'Completed Orders', 'Value': allOrders.filter(o => o.status === 'completed').length },
        { 'Metric': 'Pending Orders', 'Value': allOrders.filter(o => o.status === 'pending').length },
        { 'Metric': 'Preparing Orders', 'Value': allOrders.filter(o => o.status === 'preparing').length },
        { 'Metric': 'Cancelled Orders', 'Value': allOrders.filter(o => o.status === 'cancelled').length },
        { 'Metric': 'Paid Orders', 'Value': allOrders.filter(o => o.payment_status === 'paid').length },
        { 'Metric': 'Unpaid Orders', 'Value': allOrders.filter(o => o.payment_status === 'unpaid').length },
        { 'Metric': 'Dine-in Orders', 'Value': allOrders.filter(o => o.order_type === 'dine_in').length },
        { 'Metric': 'Takeout Orders', 'Value': allOrders.filter(o => o.order_type === 'takeout').length },
        { 'Metric': 'Export Date', 'Value': new Date().toLocaleString('en-PH') },
        { 'Metric': 'Export Generated By', 'Value': 'Restaurant Management System' }
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Order_History_Report_${timestamp}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);
      
      console.log(`✅ Excel export completed: ${filename}`);
      console.log(`📊 Exported ${allOrders.length} orders`);
      
    } catch (error) {
      console.error('❌ Excel export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Failed to export orders to Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle print order
  const handlePrintOrder = (order: ApiOrder) => {
    try {
      console.log('🖨️ Printing order:', order.order_number, 'Status:', order.status);
      console.log('📦 Order items data:', {
        hasOrderItems: !!order.order_items,
        hasItems: !!order.items,
        orderItemsCount: order.order_items?.length || 0,
        itemsCount: order.items?.length || 0,
        orderItems: order.order_items,
        items: order.items
      });

      // Generate HTML content for printing
      const printContent = generatePrintHTML(order);
      
      if (!printContent) {
        console.error('❌ Failed to generate print content');
        alert('Failed to generate print content. Please try again.');
        return;
      }

      console.log('✅ Print content generated successfully');

      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        alert('Please allow popups to print orders');
        return;
      }

      // Write content to print window
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        console.log('🖨️ Print window loaded, triggering print dialog');
        setTimeout(() => {
          printWindow.print();
          // Don't close immediately, let user decide
          // printWindow.close();
        }, 500);
      };

      // Fallback: if onload doesn't work, try after a delay
      setTimeout(() => {
        if (printWindow.document.readyState === 'complete') {
          console.log('🖨️ Fallback: Print window ready, triggering print dialog');
          printWindow.print();
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Error printing order:', error);
      alert(`Failed to print order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Generate HTML content for printing
  const generatePrintHTML = (order: ApiOrder) => {
    try {
      console.log('🔄 Generating print HTML for order:', order.order_number);
      
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP'
        }).format(amount);
      };

      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-PH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      // Safe helper functions for handling arrays
      const safeMapToString = (arr: any, nameKey: string = 'name') => {
        if (!arr || !Array.isArray(arr)) return '';
        return arr.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            return item[nameKey] || item.name || JSON.stringify(item);
          }
          return String(item);
        }).join(', ');
      };

      // Get items from either order_items or items
      const items = order.order_items || order.items || [];
      console.log('📦 Items for printing:', items.length, 'items found');
      
      // Debug: Log item structure for first item
      if (items.length > 0) {
        console.log('🔍 First item structure:', {
          item: items[0],
          hasCustomizations: !!items[0].customizations,
          customizationsType: typeof items[0].customizations,
          customizationsIsArray: Array.isArray(items[0].customizations),
          hasAddons: !!(items[0] as any).addons,
          addonsType: typeof (items[0] as any).addons,
          addonsIsArray: Array.isArray((items[0] as any).addons)
        });
      }

      if (!order || !order.order_number) {
        console.error('❌ Invalid order data for printing');
        return null;
      }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Receipt - ${order.order_number}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            font-size: 12px; 
            margin: 0; 
            padding: 20px; 
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 15px; 
            margin-bottom: 20px; 
          }
          .logo { 
            width: 60px; 
            height: 60px; 
            margin: 0 auto 10px; 
            display: block; 
          }
          .restaurant-name { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .order-info { 
            margin-bottom: 20px; 
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .order-info div {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          .items-table th, .items-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          .items-table th { 
            background-color: #f5f5f5; 
            font-weight: bold;
          }
          .totals { 
            text-align: right; 
            margin-top: 20px; 
            border-top: 2px solid #000;
            padding-top: 15px;
          }
          .status-badges {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-completed { background-color: #dcfce7; color: #166534; }
          .status-pending { background-color: #dbeafe; color: #1e40af; }
          .status-preparing { background-color: #fef3c7; color: #92400e; }
          .status-cancelled { background-color: #fecaca; color: #991b1b; }
          .payment-paid { background-color: #dcfce7; color: #166534; }
          .payment-unpaid { background-color: #fecaca; color: #991b1b; }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-style: italic;
            color: #666;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .header { page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.svg" alt="Restaurant Logo" class="logo" onerror="this.style.display='none'">
          <div class="restaurant-name">DONG G PASTILLAN</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 10px;">Ordering Management System</div>
          <h2>ORDER RECEIPT</h2>
          <p>Order #${order.order_number}</p>
        </div>
        
        <div class="order-info">
          <div>
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${order.customer_name || 'Walk-in Customer'}</p>
            ${order.customer_phone ? `<p><strong>Phone:</strong> ${order.customer_phone}</p>` : ''}
            <p><strong>Order Type:</strong> ${order.order_type.replace('_', ' ').toUpperCase()}</p>
            ${order.table_number ? `<p><strong>Table:</strong> ${order.table_number}</p>` : ''}
          </div>
          <div>
            <h3>Order Details</h3>
            <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
            <p><strong>Status:</strong> <span class="status-badges status-${order.status}">${order.status}</span></p>
            <p><strong>Payment:</strong> <span class="status-badges payment-${order.payment_status}">${order.payment_status}</span></p>
            <p><strong>Payment Method:</strong> ${order.payment_method || 'N/A'}</p>
          </div>
        </div>

        ${order.special_instructions ? `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
          <h4>Special Instructions:</h4>
          <p>${order.special_instructions}</p>
        </div>
        ` : ''}

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.length > 0 ? 
              items.map((item, index) => {
                try {
                  return `
                    <tr>
                      <td>
                        ${(item as any).menu_items?.name || item.menu_item?.name || 'Unknown Item'}
                        ${item.customizations && safeMapToString(item.customizations) ? 
                          `<br><small>Customizations: ${safeMapToString(item.customizations)}</small>` : ''}
                        ${(item as any).addons && safeMapToString((item as any).addons) ? 
                          `<br><small>Add-ons: ${safeMapToString((item as any).addons)}</small>` : ''}
                        ${item.special_instructions ? 
                          `<br><small><em>Note: ${item.special_instructions}</em></small>` : ''}
                      </td>
                      <td>${item.quantity || 0}</td>
                      <td>${formatCurrency(item.unit_price || 0)}</td>
                      <td>${formatCurrency((item.unit_price || 0) * (item.quantity || 0))}</td>
                    </tr>
                  `;
                } catch (itemError) {
                  console.error(`❌ Error processing item ${index}:`, itemError, item);
                  return `
                    <tr>
                      <td>Error processing item ${index + 1}</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                    </tr>
                  `;
                }
              }).join('') : 
              '<tr><td colspan="4" style="text-align: center; color: #666;">No items found</td></tr>'
            }
          </tbody>
        </table>

        <div class="totals">
          <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal || 0)}</p>
          ${order.discount_amount && order.discount_amount > 0 ? `<p><strong>Discount:</strong> -${formatCurrency(order.discount_amount)}</p>` : ''}
          <p><strong>Tax:</strong> ${formatCurrency(order.tax_amount || 0)}</p>
          <p><strong>Total Amount:</strong> <strong style="font-size: 14px;">${formatCurrency(order.total_amount)}</strong></p>
        </div>

        <div class="footer">
          <p>Thank you for your order!</p>
          <p>DONG G PASTILLAN - Ordering Management System</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    
    } catch (error) {
      console.error('❌ Error generating print HTML:', error);
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .error { color: red; background: #ffe6e6; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Print Error</h2>
            <p>Failed to generate print content for order ${order.order_number || 'Unknown'}.</p>
            <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p>Please try refreshing the page and printing again.</p>
          </div>
        </body>
        </html>
      `;
    }
  };

  // Check if order can be deleted
  const canDeleteOrder = (order: ApiOrder) => {
    // Cannot delete paid orders (must refund first)
    if (order.payment_status === 'paid') return false;
    // Completed orders can be deleted with force parameter
    return true;
  };

  // Check if order can be force deleted
  const canForceDeleteOrder = (order: ApiOrder) => {
    // Can force delete completed orders
    return order.status === 'completed';
  };

  // Check if order can be cancelled
  const canCancelOrder = (order: ApiOrder) => {
    // Cannot cancel completed or cancelled orders
    // Cannot cancel paid orders (must refund first)
    if (order.payment_status === 'paid') return false;
    return !['completed', 'cancelled'].includes(order.status);
  };

  // Check if any selected orders need force delete
  const needsForceDelete = () => {
    return selectedOrders.some(orderId => {
      const order = orders.find(o => o.id === orderId);
      return order && canForceDeleteOrder(order);
    });
  };

  // Check if any selected orders cannot be deleted
  const hasNonDeletableOrders = () => {
    return selectedOrders.some(orderId => {
      const order = orders.find(o => o.id === orderId);
      return order && !canDeleteOrder(order);
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'preparing':
        return 'bg-amber-100 text-amber-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentBadge = (status: string) => {
    return status === 'paid' 
      ? 'bg-emerald-100 text-emerald-800' 
      : 'bg-red-100 text-red-800';
  };

  // Calculate statistics from current orders
  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = totalItems; // Use total from API pagination
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">View and manage all customer orders and transactions</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button 
            onClick={async () => {
              console.log('🔄 Refreshing order items...');
              try {
                await fetchOrders(currentPage, false);
                console.log('✅ Order items refreshed');
              } catch (err) {
                console.error('❌ Error refreshing order items:', err);
              }
            }}
            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-1 sm:space-x-2 transition-colors duration-200 text-sm sm:text-base"
            title="Refresh order items from kitchen endpoint"
          >
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh Items</span>
            <span className="sm:hidden">Refresh</span>
          </button>
          <button 
            onClick={handleExportToExcel}
            disabled={isExporting}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 sm:space-x-2 transition-colors duration-200 text-sm sm:text-base"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isExporting ? 'Exporting...' : 'Export Report'}
            </span>
            <span className="sm:hidden">
              {isExporting ? 'Exporting...' : 'Export'}
            </span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

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

      {/* Summary Stats - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <p className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">₱{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
          <p className="text-lg sm:text-2xl font-bold text-emerald-600 mt-1">{completedOrders}</p>
        </div>
      </div>

      {/* Search and Filter - Responsive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders by ID or customer..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              >
                <option value="all">All Types</option>
                <option value="dine_in">Dine-in</option>
                <option value="takeout">Takeout</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (needsForceDelete()) {
                      setShowForceDeleteWarning(true);
                    } else {
                      setShowDeleteModal(true);
                    }
                  }}
                  disabled={selectedOrders.length > 50 || hasNonDeletableOrders()}
                  className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 border border-red-300 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Selected</span>
                </button>
                <button
                  onClick={() => setSelectedOrders([])}
                  className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Selection</span>
                </button>
              </div>
            </div>
            
            {/* Warnings */}
            <div className="mt-3 space-y-2">
              {selectedOrders.length > 50 && (
                <p className="text-xs text-red-600">
                  Maximum 50 orders can be deleted at once
                </p>
              )}
              {hasNonDeletableOrders() && (
                <p className="text-xs text-red-600">
                  Some selected orders cannot be deleted (paid orders must be refunded first)
                </p>
              )}
              {needsForceDelete() && (
                <p className="text-xs text-amber-600">
                  Some selected orders are completed and will require force delete
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Orders Display - Responsive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading orders...</span>
          </div>
        ) : orders.length > 0 ? (
          <>
            {/* Desktop Table View (1024px+) */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* Checkbox and status columns removed */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                      {/* Checkbox cell removed */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">
                              {order.order_number}
                            </div>
                            {((order.order_items && order.order_items.length > 0) || (order.items && order.items.length > 0)) ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Package className="h-3 w-3 mr-1" />
                                {order.order_items?.length || order.items?.length || 0} items
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                No items
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            <span className={`px-2 py-1 rounded-full ${
                              order.order_type === 'dine_in' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {order.order_type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer_name || 'Walk-in Customer'}
                        </div>
                        {order.customer_phone && (
                          <div className="text-sm text-gray-500">
                            {order.customer_phone}
                          </div>
                        )}
                        {order.special_instructions && (
                          <div className="text-xs text-gray-500 mt-1">
                            {order.special_instructions.length > 100 ? (
                              <div>
                                <div 
                                  className="overflow-hidden" 
                                  title={`Note: ${order.special_instructions}`}
                                  style={{
                                    display: expandedNotes.has(order.id) ? 'block' : '-webkit-box',
                                    WebkitLineClamp: expandedNotes.has(order.id) ? 'unset' : 2,
                                    WebkitBoxOrient: expandedNotes.has(order.id) ? 'unset' : 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: '1.2em',
                                    maxHeight: expandedNotes.has(order.id) ? 'none' : '2.4em'
                                  }}
                                >
                                  Note: {expandedNotes.has(order.id) 
                                    ? order.special_instructions 
                                    : order.special_instructions.substring(0, 100) + '...'
                                  }
                                </div>
                                <button 
                                  onClick={() => toggleNoteExpansion(order.id)}
                                  className="text-blue-600 text-xs mt-1 cursor-pointer hover:text-blue-800 underline"
                                  title={`${expandedNotes.has(order.id) ? 'Show less' : 'Show full note'}`}
                                >
                                  {expandedNotes.has(order.id) ? 'Show less' : 'Read more'}
                                </button>
                              </div>
                            ) : (
                              <div 
                                className="truncate" 
                                title={`Note: ${order.special_instructions}`}
                              >
                                Note: {order.special_instructions}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.order_items && order.order_items.length > 0 ? (
                            <div className="space-y-1" title={`${order.order_items.length} items in this order`}>
                              {order.order_items.slice(0, 2).map((item, index) => (
                                <div key={index} className="flex items-center space-x-2 group">
                                  <span className="text-gray-600 flex-shrink-0">•</span>
                                  <span className="font-medium group-hover:text-blue-600 transition-colors truncate">
                                    {(item as any).menu_items?.name || item.menu_item?.name || 'Unknown Item'}
                                  </span>
                                  <span className="text-gray-500 flex-shrink-0">x{item.quantity}</span>
                                  {item.unit_price && (
                                    <span className="text-xs text-gray-400 flex-shrink-0">₱{(item.unit_price * item.quantity).toFixed(2)}</span>
                                  )}
                                </div>
                              ))}
                              {order.order_items.length > 2 && (
                                <div className="text-xs text-blue-600 font-medium hover:text-blue-800 cursor-pointer">
                                  +{order.order_items.length - 2} more item{order.order_items.length - 2 !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          ) : order.items && order.items.length > 0 ? (
                            <div className="space-y-1" title={`${order.items.length} items in this order`}>
                              {order.items.slice(0, 2).map((item, index) => (
                                <div key={index} className="flex items-center space-x-2 group">
                                  <span className="text-gray-600 flex-shrink-0">•</span>
                                  <span className="font-medium group-hover:text-blue-600 transition-colors truncate">
                                    {item.menu_item?.name || 'Unknown Item'}
                                  </span>
                                  <span className="text-gray-500 flex-shrink-0">x{item.quantity}</span>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className="text-xs text-blue-600 font-medium hover:text-blue-800 cursor-pointer">
                                  +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-gray-400" title="Click 'Refresh Items' to load order details">
                              <Package className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm">No items found</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">₱{order.total_amount.toFixed(2)}</div>
                        {order.payment_method && (
                          <div className="text-xs text-gray-500 truncate" title={order.payment_method}>
                            {order.payment_method}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          
                          <button 
                            onClick={() => handlePrintOrder(order)}
                            className="text-gray-600 hover:text-gray-700 p-1 rounded" 
                            title="Print Order"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {canCancelOrder(order) && (
                            <button
                              onClick={() => {
                                setCancelOrderId(order.id);
                                setShowCancelModal(true);
                              }}
                              className="text-orange-600 hover:text-orange-700 p-1 rounded" 
                              title="Cancel Order"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          {canDeleteOrder(order) && (
                            <button
                              onClick={() => {
                                setDeleteOrderId(order.id);
                                if (canForceDeleteOrder(order)) {
                                  setShowForceDeleteWarning(true);
                                } else {
                                  setShowDeleteModal(true);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 p-1 rounded" 
                              title={canForceDeleteOrder(order) ? "Force Delete Order" : "Delete Order"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {!canDeleteOrder(order) && order.payment_status === 'paid' && (
                            <span className="text-xs text-gray-400" title="Cannot delete paid orders - must refund first">
                              Protected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Laptop Table View (768px - 1023px) */}
            <div className="hidden lg:block xl:hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* Checkbox and status columns removed */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                      {/* Checkbox cell removed */}
                      <td className="px-4 py-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">
                              {order.order_number}
                            </div>
                            {((order.order_items && order.order_items.length > 0) || (order.items && order.items.length > 0)) ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Package className="h-3 w-3 mr-1" />
                                {order.order_items?.length || order.items?.length || 0}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                0
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            <span className={`px-2 py-1 rounded-full ${
                              order.order_type === 'dine_in' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {order.order_type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer_name || 'Walk-in Customer'}
                        </div>
                        {order.customer_phone && (
                          <div className="text-xs text-gray-500">
                            {order.customer_phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">₱{order.total_amount.toFixed(2)}</div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handlePrintOrder(order)}
                            className="text-gray-600 hover:text-gray-700 p-1 rounded" 
                            title="Print Order"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {canDeleteOrder(order) && (
                            <button
                              onClick={() => {
                                setDeleteOrderId(order.id);
                                if (canForceDeleteOrder(order)) {
                                  setShowForceDeleteWarning(true);
                                } else {
                                  setShowDeleteModal(true);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 p-1 rounded" 
                              title="Delete Order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablet Card View (640px - 1023px) */}
            <div className="hidden md:block lg:hidden">
              <div className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {/* Checkbox removed */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {order.order_number}
                            </h3>
                            {/* Status badge removed */}
                            {((order.order_items && order.order_items.length > 0) || (order.items && order.items.length > 0)) ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                                <Package className="h-3 w-3 mr-1" />
                                {order.order_items?.length || order.items?.length || 0} items
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex-shrink-0">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                No items
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Customer</p>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {order.customer_name || 'Walk-in Customer'}
                              </p>
                              {order.customer_phone && (
                                <p className="text-xs text-gray-500 truncate">
                                  {order.customer_phone}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="text-sm font-bold text-gray-900">₱{order.total_amount.toFixed(2)}</p>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(order.payment_status)}`}>
                                {order.payment_status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {/* Status badge removed */}
                              <span className={`px-2 py-1 rounded-full text-xs ${order.order_type === 'dine_in' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{order.order_type.replace('_', ' ')}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-4">
                        <button 
                          onClick={() => handlePrintOrder(order)}
                          className="text-gray-600 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50" 
                          title="Print Order"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {canDeleteOrder(order) && (
                          <button
                            onClick={() => {
                              setDeleteOrderId(order.id);
                              if (canForceDeleteOrder(order)) {
                                setShowForceDeleteWarning(true);
                              } else {
                                setShowDeleteModal(true);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50" 
                            title="Delete Order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Card View (< 640px) */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start space-x-3">
                      {/* Checkbox removed */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {order.order_number}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Customer</p>
                            <p className="text-sm font-medium text-gray-900">
                              {order.customer_name || 'Walk-in Customer'}
                            </p>
                            {order.customer_phone && (
                              <p className="text-xs text-gray-500">
                                {order.customer_phone}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="text-sm font-bold text-gray-900">₱{order.total_amount.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Payment</p>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(order.payment_status)}`}>
                                {order.payment_status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {((order.order_items && order.order_items.length > 0) || (order.items && order.items.length > 0)) ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Package className="h-3 w-3 mr-1" />
                                  {order.order_items?.length || order.items?.length || 0} items
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  No items
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                order.order_type === 'dine_in' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {order.order_type.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handlePrintOrder(order)}
                              className="text-gray-600 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50" 
                              title="Print Order"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            {canDeleteOrder(order) && (
                              <button
                                onClick={() => {
                                  setDeleteOrderId(order.id);
                                  if (canForceDeleteOrder(order)) {
                                    setShowForceDeleteWarning(true);
                                  } else {
                                    setShowDeleteModal(true);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50" 
                                title="Delete Order"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No orders found</div>
            <div className="text-gray-400 mt-1">Try adjusting your search or filters</div>
          </div>
        )}
      </div>

      {/* Pagination Controls - Responsive */}
      {!isLoading && totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} orders
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg touch-manipulation ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedOrders.length > 1 ? 'Delete Orders' : 'Delete Order'}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedOrders.length > 1 
                    ? `Are you sure you want to delete ${selectedOrders.length} orders? This action cannot be undone.`
                    : 'Are you sure you want to delete this order? This action cannot be undone.'
                  }
                </p>
              </div>
            </div>
            
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{deleteError}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteOrderId(null);
                  setDeleteError(null);
                  setForceDelete(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedOrders.length > 1) {
                    handleBulkDelete(forceDelete);
                  } else if (deleteOrderId) {
                    handleDeleteOrder(deleteOrderId, forceDelete);
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Delete Warning Modal */}
      {showForceDeleteWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Force Delete Required
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedOrders.length > 1 
                    ? `Some of the selected orders are completed and require force delete. This action cannot be undone.`
                    : 'This order is completed and requires force delete. This action cannot be undone.'
                  }
                </p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> Force delete will permanently remove completed orders from the system. 
                This action cannot be undone and may affect reporting and analytics.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowForceDeleteWarning(false);
                  setDeleteOrderId(null);
                  setForceDelete(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setForceDelete(true);
                  setShowForceDeleteWarning(false);
                  setShowDeleteModal(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-lg hover:bg-amber-700"
              >
                Force Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Cancel Order</h3>
                <p className="text-sm text-gray-500">
                  Please provide a reason for cancelling this order.
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                required
              />
            </div>
            
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{deleteError}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelOrderId(null);
                  setCancelReason('');
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                disabled={isCancelling}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (cancelOrderId && cancelReason.trim()) {
                    handleCancelOrder(cancelOrderId, cancelReason.trim());
                  }
                }}
                disabled={isCancelling || !cancelReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isCancelling ? 'Cancelling...' : 'Cancel Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Results Modal */}
      {bulkDeleteResults.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Bulk Delete Results</h3>
                <p className="text-sm text-gray-500">
                  Results of the bulk delete operation
                </p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {bulkDeleteResults.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      Order {result.orderNumber || result.orderId}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'Deleted' : 'Failed'}
                    </span>
                  </div>
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setBulkDeleteResults([])}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;