import React, { useState } from 'react';
import { Edit, Trash2, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface MenuItem {
  id: number;
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

interface MenuItemCardProps {
  item: MenuItem;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const [showIngredients, setShowIngredients] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3 flex space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            item.available 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {item.available ? 'Available' : 'Unavailable'}
          </span>
        </div>
        
        <div className="absolute bottom-3 left-3 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
          {item.category}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
          </div>
          <div className="text-right ml-4">
            <p className="text-xl font-bold text-gray-900">₱{item.price}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{item.prepTime}m</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span>{item.popularity}%</span>
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setShowIngredients(!showIngredients)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showIngredients ? 'Hide' : 'Show'} Ingredients ({item.ingredients.length})
          </button>
          
          {showIngredients && (
            <div className="mt-2 space-y-2">
              {item.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                  <span className="font-medium">{ingredient.name}</span>
                  <span>{ingredient.amount}{ingredient.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!item.available && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Unavailable due to missing ingredients
              </span>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-1">
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors duration-200">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;