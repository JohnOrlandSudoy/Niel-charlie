import React, { useState } from 'react';
import { Edit, Trash2, Clock, AlertCircle, Star, Flame, Shield, Image as ImageIcon, Package, AlertTriangle, CheckCircle } from 'lucide-react';

// Updated interface to match new API structure
interface MenuItemCardData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  prepTime: number;
  popularity: number;
  isFeatured: boolean;
  calories?: number;
  allergens: string[];
  ingredients?: Array<{
    id: string;
    ingredient_id: string;
    quantity_required: number;
    unit: string;
    is_optional: boolean;
    ingredient?: {
      id: string;
      name: string;
      current_stock: number;
    };
  }>;
}

interface MenuItemCardProps {
  item: MenuItemCardData;
  onDelete: (id: string) => void;
  onEdit?: (item: MenuItemCardData) => void;
  onManageIngredients?: (item: MenuItemCardData) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onDelete, onEdit, onManageIngredients }) => {
  const [showAllergens, setShowAllergens] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Debug log to see what ingredients data we're receiving
  console.log(`MenuItemCard for "${item.name}" - ingredients:`, item.ingredients);
  console.log(`MenuItemCard for "${item.name}" - available:`, item.available);
  
  // Check ingredient availability
  const checkIngredientAvailability = () => {
    if (!item.ingredients || item.ingredients.length === 0) {
      return { isAvailable: true, missingCount: 0, missingIngredients: [] };
    }
    
    const missingIngredients = item.ingredients.filter(ingredient => {
      if (ingredient.is_optional) return false; // Optional ingredients don't affect availability
      if (!ingredient.ingredient) return true; // Missing ingredient data
      return ingredient.ingredient.current_stock < ingredient.quantity_required;
    });
    
    return {
      isAvailable: missingIngredients.length === 0,
      missingCount: missingIngredients.length,
      missingIngredients: missingIngredients
    };
  };
  
  const ingredientAvailability = checkIngredientAvailability();
  console.log(`MenuItemCard for "${item.name}" - ingredient availability:`, ingredientAvailability);
  
  // Debug each ingredient in detail
  if (item.ingredients && item.ingredients.length > 0) {
    item.ingredients.forEach((ingredient, index) => {
      console.log(`Ingredient ${index + 1} for "${item.name}":`, {
        id: ingredient.id,
        ingredient_id: ingredient.ingredient_id,
        quantity_required: ingredient.quantity_required,
        unit: ingredient.unit,
        is_optional: ingredient.is_optional,
        ingredient_data: ingredient.ingredient,
        has_ingredient_data: !!ingredient.ingredient,
        current_stock: ingredient.ingredient?.current_stock,
        is_sufficient: ingredient.ingredient ? ingredient.ingredient.current_stock >= ingredient.quantity_required : false
      });
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        {!imageError && item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-48 object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">No Image</p>
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            (item.available && ingredientAvailability.isAvailable)
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {(item.available && ingredientAvailability.isAvailable) ? 'Available' : 'Unavailable'}
          </span>
          {item.isFeatured && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center space-x-1">
              <Star className="h-3 w-3" />
              <span>Featured</span>
            </span>
          )}
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
          {item.calories && (
            <div className="flex items-center space-x-1">
              <Flame className="h-4 w-4" />
              <span>{item.calories} cal</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {item.popularity}% popular
            </span>
          </div>
        </div>

        {item.allergens && item.allergens.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowAllergens(!showAllergens)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1"
            >
              <Shield className="h-4 w-4" />
              <span>{showAllergens ? 'Hide' : 'Show'} Allergens ({item.allergens.length})</span>
            </button>
            
            {showAllergens && (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.allergens.map((allergen, index) => (
                  <span key={index} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    {allergen}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ingredients Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowIngredients(!showIngredients)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <Package className="h-4 w-4" />
              <span>
                {showIngredients ? 'Hide' : 'Show'} Ingredients 
                ({item.ingredients?.length || 0})
              </span>
            </button>
            {onManageIngredients && (
              <button
                onClick={() => onManageIngredients(item)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage
              </button>
            )}
          </div>
          
          {showIngredients && item.ingredients && item.ingredients.length > 0 && (
            <div className="mt-2 space-y-2">
              {item.ingredients.map((ingredient) => {
                const isAvailable = ingredient.ingredient && 
                  ingredient.ingredient.current_stock >= ingredient.quantity_required;
                
                return (
                  <div key={ingredient.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                    <div className="flex items-center space-x-2">
                      {isAvailable ? (
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                      )}
                      <span className="font-medium">{ingredient.ingredient?.name || 'Unknown'}</span>
                      {ingredient.is_optional && (
                        <span className="text-gray-500">(optional)</span>
                      )}
                    </div>
                    <span className="text-gray-600">
                      {ingredient.quantity_required} {ingredient.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          {showIngredients && (!item.ingredients || item.ingredients.length === 0) && (
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              No ingredients defined yet
            </div>
          )}
        </div>

        {/* Show unavailable message based on ingredient availability */}
        {(!item.available || !ingredientAvailability.isAvailable) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {!ingredientAvailability.isAvailable 
                  ? `Unavailable due to missing ingredients (${ingredientAvailability.missingCount} missing)`
                  : 'Item is currently unavailable'
                }
              </span>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit?.(item)}
            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-1"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;