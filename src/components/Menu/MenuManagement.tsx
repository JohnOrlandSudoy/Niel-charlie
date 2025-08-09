import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import MenuItemCard from './MenuItemCard';
import AddMenuItemModal from './AddMenuItemModal';

const MenuManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const menuItems = [
    {
      id: 1,
      name: 'Chicken Pastil',
      description: 'Traditional Filipino dish with seasoned chicken and rice',
      price: 190,
      category: 'Main Course',
      image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=300',
      available: false,
      ingredients: [
        { name: 'Chicken Breast', amount: 200, unit: 'g' },
        { name: 'Rice', amount: 150, unit: 'g' },
        { name: 'Soy Sauce', amount: 30, unit: 'ml' },
        { name: 'Black Pepper', amount: 5, unit: 'g' }
      ],
      prepTime: 20,
      popularity: 95
    },
    {
      id: 2,
      name: 'Pork Adobo',
      description: 'Classic Filipino pork dish in savory sauce',
      price: 220,
      category: 'Main Course',
      image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=300',
      available: true,
      ingredients: [
        { name: 'Pork Belly', amount: 250, unit: 'g' },
        { name: 'Soy Sauce', amount: 50, unit: 'ml' },
        { name: 'Vinegar', amount: 30, unit: 'ml' }
      ],
      prepTime: 35,
      popularity: 88
    },
    {
      id: 3,
      name: 'Beef Steak',
      description: 'Tender beef with caramelized onions',
      price: 280,
      category: 'Main Course',
      image: 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg?auto=compress&cs=tinysrgb&w=300',
      available: true,
      ingredients: [
        { name: 'Beef Sirloin', amount: 200, unit: 'g' },
        { name: 'Onions', amount: 100, unit: 'g' },
        { name: 'Soy Sauce', amount: 30, unit: 'ml' }
      ],
      prepTime: 25,
      popularity: 75
    },
    {
      id: 4,
      name: 'Vegetable Lumpia',
      description: 'Fresh spring rolls with mixed vegetables',
      price: 120,
      category: 'Appetizer',
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
      available: true,
      ingredients: [
        { name: 'Lumpia Wrapper', amount: 3, unit: 'pieces' },
        { name: 'Mixed Vegetables', amount: 100, unit: 'g' },
        { name: 'Cooking Oil', amount: 50, unit: 'ml' }
      ],
      prepTime: 15,
      popularity: 68
    },
    {
      id: 5,
      name: 'Iced Tea',
      description: 'Refreshing house-blend iced tea',
      price: 45,
      category: 'Beverage',
      image: 'https://images.pexels.com/photos/1251175/pexels-photo-1251175.jpeg?auto=compress&cs=tinysrgb&w=300',
      available: true,
      ingredients: [
        { name: 'Tea Bags', amount: 2, unit: 'pieces' },
        { name: 'Sugar', amount: 20, unit: 'g' },
        { name: 'Ice', amount: 100, unit: 'g' }
      ],
      prepTime: 5,
      popularity: 85
    },
    {
      id: 6,
      name: 'Garlic Rice',
      description: 'Fragrant rice with garlic and herbs',
      price: 65,
      category: 'Side Dish',
      image: 'https://images.pexels.com/photos/725997/pexels-photo-725997.jpeg?auto=compress&cs=tinysrgb&w=300',
      available: true,
      ingredients: [
        { name: 'Rice', amount: 150, unit: 'g' },
        { name: 'Garlic', amount: 10, unit: 'g' },
        { name: 'Cooking Oil', amount: 15, unit: 'ml' }
      ],
      prepTime: 10,
      popularity: 92
    }
  ];

  const categories = ['all', 'Main Course', 'Appetizer', 'Side Dish', 'Beverage', 'Dessert'];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{menuItems.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Available</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {menuItems.filter(item => item.available).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Unavailable</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {menuItems.filter(item => !item.available).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Avg. Price</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ₱{Math.round(menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length)}
          </p>
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
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      {showAddModal && (
        <AddMenuItemModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default MenuManagement;