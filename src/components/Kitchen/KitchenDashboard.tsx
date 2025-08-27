import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Utensils, 
  Thermometer,
  Timer,
  Package,
  Bell,
  Eye,
  X,
  Plus,
  Minus,
  AlertCircle
} from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  prepTime: number;
  status: 'pending' | 'preparing' | 'ready';
  specialInstructions?: string;
  ingredients: string[];
}

interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  total: number;
  orderTime: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  specialInstructions?: string;
}

interface Ingredient {
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  status: 'sufficient' | 'low' | 'out';
}

// Utility functions moved outside components for accessibility
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'preparing':
      return <ChefHat className="h-4 w-4 text-blue-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ready':
      return 'bg-emerald-100 text-emerald-800';
    case 'preparing':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStockStatusColor = (status: string) => {
  switch (status) {
    case 'sufficient':
      return 'bg-emerald-100 text-emerald-800';
    case 'low':
      return 'bg-amber-100 text-amber-800';
    case 'out':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const KitchenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Mock data for kitchen dashboard
  const stats = [
    { label: 'Orders in Queue', value: '8', icon: Clock, color: 'amber' },
    { label: 'Currently Preparing', value: '5', icon: ChefHat, color: 'blue' },
    { label: 'Ready for Pickup', value: '3', icon: CheckCircle, color: 'emerald' },
    { label: 'Completed Today', value: '42', icon: Timer, color: 'purple' }
  ];

  // Enhanced mock orders with real-time data
  const mockOrders: Order[] = [
    { 
      id: 'ORD-12354', 
      customer: 'Maria Santos', 
      items: [
        { 
          name: 'Chicken Pastil', 
          quantity: 2, 
          prepTime: 20, 
          status: 'preparing',
          specialInstructions: 'Extra spicy, no onions',
          ingredients: ['chicken', 'rice', 'pepper', 'soy sauce', 'garlic']
        },
        { 
          name: 'Iced Tea', 
          quantity: 1, 
          prepTime: 5, 
          status: 'ready',
          ingredients: ['tea leaves', 'sugar', 'ice']
        }
      ], 
      total: 425, 
      orderTime: '2 min ago',
      priority: 'high',
      status: 'preparing',
      specialInstructions: 'Customer allergic to onions'
    },
    { 
      id: 'ORD-12355', 
      customer: 'Juan Dela Cruz', 
      items: [
        { 
          name: 'Pork Adobo', 
          quantity: 1, 
          prepTime: 35, 
          status: 'preparing',
          ingredients: ['pork', 'soy sauce', 'vinegar', 'garlic', 'pepper']
        },
        { 
          name: 'Rice', 
          quantity: 2, 
          prepTime: 10, 
          status: 'ready',
          ingredients: ['rice', 'water']
        }
      ], 
      total: 320, 
      orderTime: '5 min ago',
      priority: 'medium',
      status: 'preparing'
    },
    { 
      id: 'ORD-12356', 
      customer: 'Ana Reyes', 
      items: [
        { 
          name: 'Beef Steak', 
          quantity: 1, 
          prepTime: 25, 
          status: 'pending',
          ingredients: ['beef', 'garlic', 'soy sauce', 'pepper']
        },
        { 
          name: 'Garlic Rice', 
          quantity: 1, 
          prepTime: 10, 
          status: 'pending',
          ingredients: ['rice', 'garlic', 'oil']
        }
      ], 
      total: 345, 
      orderTime: '8 min ago',
      priority: 'low',
      status: 'pending'
    }
  ];

  // Mock ingredients with stock levels
  const mockIngredients: Ingredient[] = [
    { name: 'chicken', currentStock: 15, minStock: 10, unit: 'kg', status: 'sufficient' },
    { name: 'pork', currentStock: 8, minStock: 10, unit: 'kg', status: 'low' },
    { name: 'beef', currentStock: 12, minStock: 10, unit: 'kg', status: 'sufficient' },
    { name: 'rice', currentStock: 25, minStock: 15, unit: 'kg', status: 'sufficient' },
    { name: 'soy sauce', currentStock: 3, minStock: 5, unit: 'L', status: 'low' },
    { name: 'pepper', currentStock: 0, minStock: 2, unit: 'kg', status: 'out' },
    { name: 'garlic', currentStock: 2, minStock: 3, unit: 'kg', status: 'low' },
    { name: 'vinegar', currentStock: 4, minStock: 3, unit: 'L', status: 'sufficient' },
    { name: 'oil', currentStock: 6, minStock: 5, unit: 'L', status: 'sufficient' },
    { name: 'tea leaves', currentStock: 1, minStock: 2, unit: 'kg', status: 'low' },
    { name: 'sugar', currentStock: 8, minStock: 5, unit: 'kg', status: 'sufficient' }
  ];

  useEffect(() => {
    setOrders(mockOrders);
    setIngredients(mockIngredients);
    
    // Check for critical stock alerts
    const criticalIngredients = mockIngredients.filter(ing => ing.status === 'out');
    if (criticalIngredients.length > 0) {
      setShowStockAlert(true);
    }
  }, []);

  const updateOrderStatus = (orderId: string, itemIndex: number, newStatus: 'pending' | 'preparing' | 'ready') => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedItems = [...order.items];
          updatedItems[itemIndex] = { ...updatedItems[itemIndex], status: newStatus };
          
          // Update overall order status
          let orderStatus: 'pending' | 'preparing' | 'ready' | 'completed' = 'pending';
          if (updatedItems.every(item => item.status === 'ready')) {
            orderStatus = 'ready';
          } else if (updatedItems.some(item => item.status === 'preparing')) {
            orderStatus = 'preparing';
          }
          
          return { ...order, items: updatedItems, status: orderStatus };
        }
        return order;
      })
    );
  };

  const markOrderComplete = (orderId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'completed' as const }
          : order
      )
    );
  };

  const canPrepareItem = (item: OrderItem): boolean => {
    return item.ingredients.every(ingredientName => {
      const ingredient = ingredients.find(ing => ing.name === ingredientName);
      return ingredient && ingredient.status !== 'out';
    });
  };

  const getFilteredOrders = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Stock Alert Banner */}
      {showStockAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Critical Stock Alert</h3>
                <p className="text-sm text-red-600">
                  Some ingredients are out of stock and may affect order fulfillment
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowStockAlert(false)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName}! Manage food preparation and orders here.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Kitchen Status</p>
          <p className="text-sm font-medium text-emerald-600">All Systems Operational</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'orders', label: 'Active Orders', icon: ChefHat },
              { id: 'inventory', label: 'Stock Levels', icon: Package },
              { id: 'equipment', label: 'Equipment Status', icon: Thermometer }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Order Status Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Orders */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <span>Pending ({getFilteredOrders('pending').length})</span>
                  </h3>
                  <div className="space-y-3">
                    {getFilteredOrders('pending').map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        onStatusUpdate={updateOrderStatus}
                        onComplete={markOrderComplete}
                        onViewDetails={openOrderModal}
                        canPrepare={canPrepareItem}
                        ingredients={ingredients}
                      />
                    ))}
                  </div>
                </div>

                {/* Preparing Orders */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <ChefHat className="h-5 w-5 text-blue-500" />
                    <span>Preparing ({getFilteredOrders('preparing').length})</span>
                  </h3>
                  <div className="space-y-3">
                    {getFilteredOrders('preparing').map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        onStatusUpdate={updateOrderStatus}
                        onComplete={markOrderComplete}
                        onViewDetails={openOrderModal}
                        canPrepare={canPrepareItem}
                        ingredients={ingredients}
                      />
                    ))}
                  </div>
                </div>

                {/* Ready Orders */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span>Ready ({getFilteredOrders('ready').length})</span>
                  </h3>
                  <div className="space-y-3">
                    {getFilteredOrders('ready').map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        onStatusUpdate={updateOrderStatus}
                        onComplete={markOrderComplete}
                        onViewDetails={openOrderModal}
                        canPrepare={canPrepareItem}
                        ingredients={ingredients}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Current Stock Levels</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Sufficient</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Low</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Out of Stock</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ingredients.map((ingredient) => (
                  <div key={ingredient.name} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 capitalize">{ingredient.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(ingredient.status)}`}>
                        {ingredient.status === 'out' ? 'Out of Stock' : 
                         ingredient.status === 'low' ? 'Low Stock' : 'Sufficient'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {ingredient.currentStock} {ingredient.unit}
                      </span>
                      <span className="text-gray-500">
                        Min: {ingredient.minStock} {ingredient.unit}
                      </span>
                    </div>
                    {ingredient.status === 'out' && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        ⚠️ Cannot fulfill orders requiring this ingredient
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="text-center py-12">
              <Thermometer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Equipment Status</h3>
              <p className="text-gray-500">Check kitchen equipment and maintenance status.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all duration-200 text-center">
            <ChefHat className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Start Preparation</p>
            <p className="text-sm text-gray-500">Begin cooking order</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-lg transition-all duration-200 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Mark Ready</p>
            <p className="text-sm text-gray-500">Order ready for pickup</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-amber-200 hover:border-amber-300 hover:bg-amber-50 rounded-lg transition-all duration-200 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Report Issue</p>
            <p className="text-sm text-gray-500">Equipment or ingredient problem</p>
          </button>

          <button className="p-4 border-2 border-dashed border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-lg transition-all duration-200 text-center">
            <Bell className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Notify Cashier</p>
            <p className="text-sm text-gray-500">Order ready notification</p>
          </button>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder}
          onClose={() => setShowOrderModal(false)}
          onStatusUpdate={updateOrderStatus}
          onComplete={markOrderComplete}
          canPrepare={canPrepareItem}
          ingredients={ingredients}
        />
      )}
    </div>
  );
};

// Order Card Component
interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, itemIndex: number, status: 'pending' | 'preparing' | 'ready') => void;
  onComplete: (orderId: string) => void;
  onViewDetails: (order: Order) => void;
  canPrepare: (item: OrderItem) => boolean;
  ingredients: Ingredient[];
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onStatusUpdate, 
  onComplete, 
  onViewDetails,
  canPrepare,
  ingredients
}) => {
  return (
    <div className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-sm ${getPriorityColor(order.priority)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="font-medium text-gray-900">{order.id}</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority)}`}>
            {order.priority.toUpperCase()} PRIORITY
          </span>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">₱{order.total}</p>
          <p className="text-xs text-gray-500">{order.orderTime}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{order.customer}</p>
      
      {order.specialInstructions && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          📝 {order.specialInstructions}
        </div>
      )}
      
      <div className="space-y-2 mb-4">
        {order.items.map((item, index) => {
          const canPrepareItem = canPrepare(item);
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-white bg-opacity-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(item.status)}
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  {item.specialInstructions && (
                    <p className="text-xs text-blue-600">💡 {item.specialInstructions}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">Est: {item.prepTime}m</p>
                {!canPrepareItem && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Missing ingredients</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center">
        <button 
          onClick={() => onViewDetails(order)}
          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 flex items-center space-x-1"
        >
          <Eye className="h-3 w-3" />
          <span>View Details</span>
        </button>
        
        <div className="flex space-x-2">
          {order.status === 'ready' && (
            <button 
              onClick={() => onComplete(order.id)}
              className="px-3 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-300 rounded hover:bg-emerald-50"
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Order Detail Modal Component
interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, itemIndex: number, status: 'pending' | 'preparing' | 'ready') => void;
  onComplete: (orderId: string) => void;
  canPrepare: (item: OrderItem) => boolean;
  ingredients: Ingredient[];
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ 
  order, 
  onClose, 
  onStatusUpdate, 
  onComplete,
  canPrepare,
  ingredients
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Order Details - {order.id}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
              <p className="text-gray-600">{order.customer}</p>
              {order.specialInstructions && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Special Instructions:</strong> {order.specialInstructions}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Order Items</h3>
              {order.items.map((item, index) => {
                const canPrepareItem = canPrepare(item);
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-500">Prep Time: {item.prepTime} minutes</p>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    {item.specialInstructions && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Item Instructions:</strong> {item.specialInstructions}
                        </p>
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Required Ingredients:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.ingredients.map((ingredient) => {
                          const ing = ingredients.find(i => i.name === ingredient);
                          return (
                            <span 
                              key={ingredient}
                              className={`px-2 py-1 text-xs rounded-full ${
                                ing?.status === 'out' 
                                  ? 'bg-red-100 text-red-800' 
                                  : ing?.status === 'low'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {ingredient} {ing?.status === 'out' && '⚠️'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {!canPrepareItem && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">
                          ⚠️ Cannot prepare this item due to missing ingredients
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => onStatusUpdate(order.id, index, 'pending')}
                        disabled={item.status === 'pending'}
                        className={`px-3 py-1 text-xs font-medium rounded border ${
                          item.status === 'pending'
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'text-amber-600 hover:text-amber-700 border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        Mark Pending
                      </button>
                      <button
                        onClick={() => onStatusUpdate(order.id, index, 'preparing')}
                        disabled={item.status === 'preparing' || !canPrepareItem}
                        className={`px-3 py-1 text-xs font-medium rounded border ${
                          item.status === 'preparing' || !canPrepareItem
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        Start Preparing
                      </button>
                      <button
                        onClick={() => onStatusUpdate(order.id, index, 'ready')}
                        disabled={item.status === 'ready'}
                        className={`px-3 py-1 text-xs font-medium rounded border ${
                          item.status === 'ready'
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'text-emerald-600 hover:text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        Mark Ready
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">₱{order.total}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                {order.status === 'ready' && (
                  <button
                    onClick={() => {
                      onComplete(order.id);
                      onClose();
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700"
                  >
                    Mark Order Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenDashboard;
