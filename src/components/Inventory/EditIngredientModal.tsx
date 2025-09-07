import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';
import { Ingredient, UpdateIngredientRequest, ApiResponse } from '../../types/inventory';

interface EditIngredientModalProps {
  ingredient: Ingredient;
  onClose: () => void;
  onIngredientUpdated?: (ingredient: Ingredient) => void;
}

const EditIngredientModal: React.FC<EditIngredientModalProps> = ({ 
  ingredient, 
  onClose, 
  onIngredientUpdated 
}) => {
  const [formData, setFormData] = useState({
    name: ingredient.name,
    description: ingredient.description || '',
    category: ingredient.category || 'Meat',
    current_stock: ingredient.current_stock.toString(),
    unit: ingredient.unit,
    min_stock_threshold: ingredient.min_stock_threshold?.toString() || '',
    max_stock_threshold: ingredient.max_stock_threshold?.toString() || '',
    cost_per_unit: ingredient.cost_per_unit?.toString() || '',
    supplier: ingredient.supplier || '',
    storage_location: ingredient.storage_location || '',
    expiry_date: ingredient.expiry_date || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = ['Meat', 'Vegetables', 'Spices', 'Condiments', 'Grains', 'Oils', 'Dairy', 'Other'];
  const units = ['kg', 'g', 'liters', 'ml', 'pieces', 'bottles', 'sacks', 'packs'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Prepare data for API
      const updateData: UpdateIngredientRequest = {
        name: formData.name,
        unit: formData.unit,
        description: formData.description || undefined,
        current_stock: formData.current_stock ? parseFloat(formData.current_stock) : undefined,
        min_stock_threshold: formData.min_stock_threshold ? parseFloat(formData.min_stock_threshold) : undefined,
        max_stock_threshold: formData.max_stock_threshold ? parseFloat(formData.max_stock_threshold) : undefined,
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : undefined,
        supplier: formData.supplier || undefined,
        category: formData.category || undefined,
        storage_location: formData.storage_location || undefined,
        expiry_date: formData.expiry_date || undefined
      };

      console.log('Updating ingredient with data:', {
        id: ingredient.id,
        updateData
      });
      
      const response = await api.inventory.updateIngredient(ingredient.id, updateData);
      const result: ApiResponse<Ingredient> = await response.json();
      
      console.log('Update response:', result);

      if (result.success && result.data) {
        onIngredientUpdated?.(result.data);
        onClose();
      } else {
        setError(result.message || 'Failed to update ingredient');
      }
    } catch (err) {
      console.error('Error updating ingredient:', err);
      setError('Failed to update ingredient. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Ingredient</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <X className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredient Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Stock
              </label>
              <input
                type="number"
                step="0.01"
                name="current_stock"
                value={formData.current_stock}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost per Unit (₱)
              </label>
              <input
                type="number"
                step="0.01"
                name="cost_per_unit"
                value={formData.cost_per_unit}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stock Threshold
              </label>
              <input
                type="number"
                step="0.01"
                name="min_stock_threshold"
                value={formData.min_stock_threshold}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Stock Threshold
              </label>
              <input
                type="number"
                step="0.01"
                name="max_stock_threshold"
                value={formData.max_stock_threshold}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Supplier name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Location
              </label>
              <input
                type="text"
                name="storage_location"
                value={formData.storage_location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Refrigerator, Pantry"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Updating...' : 'Update Ingredient'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIngredientModal;
