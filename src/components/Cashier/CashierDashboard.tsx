import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ShoppingCart, 
  CreditCard, 
  Receipt, 
  Search, 
  Plus, 
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Printer,
  QrCode,
  DollarSign,
  Percent,
  Package,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  ingredients: string[];
  prepTime: number;
  customizations: string[];
  addOns: Array<{ name: string; price: number }>;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  customizations: string[];
  specialInstructions: string;
  price: number;
  addOns?: Array<{ name: string; price: number }>;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  orderType: 'dine-in' | 'takeout';
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod?: 'cash' | 'gcash' | 'card';
  orderTime: string;
  estimatedReadyTime?: string;
  tableNumber?: number;
}

interface Ingredient {
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  status: 'sufficient' | 'low' | 'out';
}

// Utility functions moved outside components for accessibility
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-800';
    case 'preparing': return 'bg-blue-100 text-blue-800';
    case 'ready': return 'bg-emerald-100 text-emerald-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentStatusColor = (status: string) => {
  return status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
};

const CashierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Enhanced Mock Data for Prototyping
  const mockMenuItems: MenuItem[] = [
    { 
      id: '1', 
      name: 'Chicken Pastil', 
      price: 180, 
      category: 'Main Course', 
      available: true, 
      ingredients: ['chicken', 'rice', 'pepper', 'soy sauce', 'garlic'], 
      prepTime: 20,
      customizations: ['Extra Spicy', 'No Onions', 'Extra Rice'],
      addOns: [
        { name: 'Extra Chicken', price: 50 },
        { name: 'Extra Rice', price: 25 },
        { name: 'Egg', price: 15 }
      ]
    },
    { 
      id: '2', 
      name: 'Pork Adobo', 
      price: 160, 
      category: 'Main Course', 
      available: true, 
      ingredients: ['pork', 'soy sauce', 'vinegar', 'garlic', 'pepper'], 
      prepTime: 35,
      customizations: ['Extra Spicy', 'Less Salty', 'Extra Sauce'],
      addOns: [
        { name: 'Extra Pork', price: 60 },
        { name: 'Extra Rice', price: 25 },
        { name: 'Egg', price: 15 }
      ]
    },
    { 
      id: '3', 
      name: 'Beef Steak', 
      price: 220, 
      category: 'Main Course', 
      available: false, 
      ingredients: ['beef', 'garlic', 'soy sauce', 'pepper'], 
      prepTime: 25,
      customizations: ['Medium Rare', 'Well Done', 'Extra Spicy'],
      addOns: [
        { name: 'Extra Beef', price: 80 },
        { name: 'Mashed Potatoes', price: 30 },
        { name: 'Vegetables', price: 25 }
      ]
    },
    { 
      id: '4', 
      name: 'Garlic Rice', 
      price: 45, 
      category: 'Side Dish', 
      available: true, 
      ingredients: ['rice', 'garlic', 'oil'], 
      prepTime: 10,
      customizations: ['Extra Garlic', 'Less Garlic'],
      addOns: []
    },
    { 
      id: '5', 
      name: 'Iced Tea', 
      price: 35, 
      category: 'Beverage', 
      available: true, 
      ingredients: ['tea leaves', 'sugar', 'ice'], 
      prepTime: 5,
      customizations: ['Less Sweet', 'Extra Sweet', 'No Ice'],
      addOns: [
        { name: 'Extra Ice', price: 5 },
        { name: 'Lemon Slice', price: 10 }
      ]
    },
    { 
      id: '6', 
      name: 'Halo-Halo', 
      price: 120, 
      category: 'Dessert', 
      available: true, 
      ingredients: ['ice', 'milk', 'sugar', 'beans'], 
      prepTime: 8,
      customizations: ['Extra Sweet', 'Less Sweet', 'Extra Ice'],
      addOns: [
        { name: 'Extra Toppings', price: 20 },
        { name: 'Extra Milk', price: 15 }
      ]
    }
  ];

  const mockIngredients: Ingredient[] = [
    { name: 'chicken', currentStock: 15, minStock: 10, unit: 'kg', status: 'sufficient' },
    { name: 'pork', currentStock: 8, minStock: 10, unit: 'kg', status: 'low' },
    { name: 'beef', currentStock: 0, minStock: 10, unit: 'kg', status: 'out' },
    { name: 'rice', currentStock: 25, minStock: 15, unit: 'kg', status: 'sufficient' },
    { name: 'soy sauce', currentStock: 3, minStock: 5, unit: 'L', status: 'low' },
    { name: 'pepper', currentStock: 0, minStock: 2, unit: 'kg', status: 'out' },
    { name: 'garlic', currentStock: 2, minStock: 3, unit: 'kg', status: 'low' },
    { name: 'vinegar', currentStock: 4, minStock: 3, unit: 'L', status: 'sufficient' },
    { name: 'oil', currentStock: 6, minStock: 5, unit: 'L', status: 'sufficient' },
    { name: 'tea leaves', currentStock: 1, minStock: 2, unit: 'kg', status: 'low' },
    { name: 'sugar', currentStock: 8, minStock: 5, unit: 'kg', status: 'sufficient' }
  ];

  const mockCustomers: Customer[] = [
    { id: '1', name: 'Maria Santos', phone: '+63 912 345 6789', email: 'maria@email.com' },
    { id: '2', name: 'Juan Dela Cruz', phone: '+63 923 456 7890', email: 'juan@email.com' },
    { id: '3', name: 'Ana Reyes', phone: '+63 934 567 8901', email: 'ana@email.com' }
  ];

  const mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      customer: mockCustomers[0],
      items: [
        { 
          menuItem: mockMenuItems[0], 
          quantity: 2, 
          customizations: ['Extra Spicy'], 
          specialInstructions: 'No onions please', 
          price: 410,
          addOns: [{ name: 'Extra Chicken', price: 50 }]
        },
        { 
          menuItem: mockMenuItems[4], 
          quantity: 1, 
          customizations: ['Less Sweet'], 
          specialInstructions: '', 
          price: 35 
        }
      ],
      orderType: 'takeout',
      status: 'ready',
      subtotal: 445,
      discount: 0,
      tax: 44.5,
      total: 489.5,
      paymentStatus: 'paid',
      paymentMethod: 'gcash',
      orderTime: '2 min ago',
      estimatedReadyTime: '5 min'
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      customer: mockCustomers[1],
      items: [
        { 
          menuItem: mockMenuItems[1], 
          quantity: 1, 
          customizations: ['Extra Spicy'], 
          specialInstructions: 'Extra sauce on the side', 
          price: 160 
        },
        { 
          menuItem: mockMenuItems[3], 
          quantity: 2, 
          customizations: ['Extra Garlic'], 
          specialInstructions: '', 
          price: 90 
        }
      ],
      orderType: 'dine-in',
      status: 'preparing',
      subtotal: 250,
      discount: 25,
      tax: 25,
      total: 250,
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      orderTime: '8 min ago',
      tableNumber: 5
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      customer: mockCustomers[2],
      items: [
        { 
          menuItem: mockMenuItems[5], 
          quantity: 1, 
          customizations: ['Extra Sweet'], 
          specialInstructions: 'Extra toppings please', 
          price: 140,
          addOns: [{ name: 'Extra Toppings', price: 20 }]
        }
      ],
      orderType: 'takeout',
      status: 'pending',
      subtotal: 140,
      discount: 0,
      tax: 14,
      total: 154,
      paymentStatus: 'unpaid',
      orderTime: '15 min ago'
    }
  ];

  useEffect(() => {
    setOrders(mockOrders);
    setMenuItems(mockMenuItems);
    setIngredients(mockIngredients);
    setCustomers(mockCustomers);
  }, []);

  // Update menu availability based on ingredients
  useEffect(() => {
    const updatedMenuItems = mockMenuItems.map(item => ({
      ...item,
      available: item.ingredients.every(ingredientName => {
        const ingredient = ingredients.find(ing => ing.name === ingredientName);
        return ingredient && ingredient.status !== 'out';
      })
    }));
    setMenuItems(updatedMenuItems);
  }, [ingredients]);

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${year}-${month}${day}-${random}`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Today\'s Orders', value: orders.length.toString(), icon: ShoppingCart, color: 'blue' },
    { label: 'Pending Payment', value: orders.filter(o => o.paymentStatus === 'unpaid').length.toString(), icon: CreditCard, color: 'amber' },
    { label: 'Ready for Pickup', value: orders.filter(o => o.status === 'ready').length.toString(), icon: CheckCircle, color: 'emerald' },
    { label: 'Today\'s Revenue', value: `₱${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}`, icon: DollarSign, color: 'green' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cashier Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName}! Process orders and manage transactions efficiently.
          </p>
        </div>
        <button
          onClick={() => setShowNewOrderModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Order</span>
        </button>
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

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by order number or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'transactions', label: 'Transactions', icon: CreditCard },
              { id: 'customers', label: 'Customers', icon: User },
              { id: 'inventory', label: 'Stock Status', icon: Package }
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <p className="text-sm text-gray-500">{filteredOrders.length} orders found</p>
              </div>
              
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onViewDetails={() => {
                      setSelectedOrder(order);
                      setShowOrderDetailsModal(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction History</h3>
              <p className="text-gray-500">View payment history and financial reports.</p>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Management</h3>
              <p className="text-gray-500">Manage customer information and preferences.</p>
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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        ingredient.status === 'out' ? 'bg-red-100 text-red-800' : 
                        ingredient.status === 'low' ? 'bg-amber-100 text-amber-800' : 
                        'bg-emerald-100 text-emerald-800'
                      }`}>
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
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all duration-200 text-center">
            <Plus className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">New Order</p>
            <p className="text-sm text-gray-500">Create customer order</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-lg transition-all duration-200 text-center">
            <Receipt className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Print Receipt</p>
            <p className="text-sm text-gray-500">Generate order receipt</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-lg transition-all duration-200 text-center">
            <QrCode className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">GCash QR</p>
            <p className="text-sm text-gray-500">Show payment QR code</p>
          </button>

          <button className="p-4 border-2 border-dashed border-amber-200 hover:border-amber-300 hover:bg-amber-50 rounded-lg transition-all duration-200 text-center">
            <TrendingUp className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Daily Report</p>
            <p className="text-sm text-gray-500">View sales summary</p>
          </button>
        </div>
      </div>

      {/* Modals will be added in the next part */}
    </div>
  );
};

// Order Card Component
interface OrderCardProps {
  order: Order;
  onViewDetails: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewDetails }) => {
  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="font-medium text-gray-900">{order.orderNumber}</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
            {order.paymentStatus}
          </span>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">₱{order.total.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{order.orderTime}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-3">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{order.customer.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{order.customer.phone}</span>
        </div>
        {order.orderType === 'dine-in' && order.tableNumber && (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Table {order.tableNumber}</span>
          </div>
        )}
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-2">Order Items:</p>
        <div className="space-y-1">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.quantity}x {item.menuItem.name}
                {item.customizations.length > 0 && (
                  <span className="text-gray-500 ml-2">({item.customizations.join(', ')})</span>
                )}
              </span>
              <span className="text-gray-600">₱{item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {order.orderType === 'dine-in' ? 'Dine-in' : 'Takeout'}
          {order.paymentMethod && ` • ${order.paymentMethod.toUpperCase()}`}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
