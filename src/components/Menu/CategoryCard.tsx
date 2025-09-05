import React, { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff, Star, Calendar, User } from 'lucide-react';
import { MenuCategory } from '../../types/menu';

interface CategoryCardProps {
  category: MenuCategory;
  onEdit: (category: MenuCategory) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  onEdit, 
  onDelete, 
  onToggleActive 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 ${
        !category.is_active ? 'opacity-60' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Category Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl text-gray-300">🍽️</div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            category.is_active 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {category.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Sort Order Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded-full">
            #{category.sort_order}
          </span>
        </div>
      </div>

      {/* Category Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
          </div>
        </div>

        {/* Category Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDate(category.created_at)}</span>
          </div>
          {category.updated_at !== category.created_at && (
            <div className="flex items-center space-x-1">
              <Edit className="h-4 w-4" />
              <span>Updated {formatDate(category.updated_at)}</span>
            </div>
          )}
        </div>

        {/* Image Info */}
        {category.image_filename && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">Image:</span>
              <span className="text-gray-600">{category.image_filename}</span>
            </div>
            {category.image_size && (
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="font-medium text-gray-700">Size:</span>
                <span className="text-gray-600">{(category.image_size / 1024).toFixed(1)} KB</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(category)}
            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-1"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          
          <button 
            onClick={() => onToggleActive(category.id, !category.is_active)}
            className={`py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center ${
              category.is_active 
                ? 'bg-orange-600 text-white hover:bg-orange-700' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
            title={category.is_active ? 'Deactivate' : 'Activate'}
          >
            {category.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          <button 
            onClick={() => onDelete(category.id)}
            className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors duration-200"
            title="Delete Category"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
