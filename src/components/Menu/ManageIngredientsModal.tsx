import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../../utils/api';
import { MenuItem, MenuItemIngredient, CreateMenuItemIngredientRequest, UpdateMenuItemIngredientRequest, ApiResponse } from '../../types/menu';
import { Ingredient } from '../../types/inventory';

interface ManageIngredientsModalProps {
  menuItem: MenuItem;
  onClose: () => void;
  onIngredientsUpdated?: () => void;
}

const ManageIngredientsModal: React.FC<ManageIngredientsModalProps> = ({ 
  menuItem, 
  onClose, 
  onIngredientsUpdated 
}) => {
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<MenuItemIngredient | null>(null);

  // Form data for adding new ingredient
  const [addFormData, setAddFormData] = useState({
    ingredient_id: '',
    quantity_required: '',
    unit: '',
    is_optional: false
  });

  // Form data for editing ingredient
  const [editFormData, setEditFormData] = useState({
    quantity_required: '',
    unit: '',
    is_optional: false
  });

  // Fetch menu item ingredients
  const fetchMenuItemIngredients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.inventory.getMenuItemIngredients(menuItem.id);
      const result: ApiResponse<MenuItemIngredient[]> = await response.json();
      
      if (result.success && result.data) {
        setIngredients(result.data);
      } else {
        setError(result.message || 'Failed to fetch ingredients');
      }
    } catch (err) {
      console.error('Error fetching menu item ingredients:', err);
      setError('Failed to fetch ingredients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available ingredients
  const fetchAvailableIngredients = async () => {
    try {
      setIsLoadingIngredients(true);
      console.log('Fetching available ingredients...'); // Debug log
      
      const response = await api.inventory.getAllIngredients();
      console.log('API response status:', response.status); // Debug log
      
      const result: ApiResponse<Ingredient[]> = await response.json();
      console.log('API result:', result); // Debug log
      
      if (result.success && result.data) {
        // Filter out ingredients already linked to this menu item
        const linkedIngredientIds = ingredients.map(ing => ing.ingredient_id);
        const available = result.data.filter(ing => !linkedIngredientIds.includes(ing.id));
        setAvailableIngredients(available);
        console.log('Available ingredients after filtering:', available); // Debug log
      } else {
        console.error('Failed to fetch ingredients:', result.message);
        setError(result.message || 'Failed to fetch available ingredients');
      }
    } catch (err) {
      console.error('Error fetching available ingredients:', err);
      setError('Failed to fetch available ingredients. Please try again.');
    } finally {
      setIsLoadingIngredients(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchMenuItemIngredients();
    fetchAvailableIngredients(); // Always fetch available ingredients when modal opens
  }, [menuItem.id]);

  // Load available ingredients when ingredients change (to update the dropdown)
  useEffect(() => {
    fetchAvailableIngredients();
  }, [ingredients]);

  // Handle adding new ingredient
  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingIngredients(true);
    setError(null);

    try {
      const data: CreateMenuItemIngredientRequest = {
        ingredient_id: addFormData.ingredient_id,
        quantity_required: parseFloat(addFormData.quantity_required),
        unit: addFormData.unit,
        is_optional: addFormData.is_optional
      };

      const response = await api.inventory.linkIngredientToMenuItem(menuItem.id, data);
      const result: ApiResponse<MenuItemIngredient> = await response.json();

      if (result.success && result.data) {
        setIngredients(prev => [...prev, result.data]);
        setAddFormData({ ingredient_id: '', quantity_required: '', unit: '', is_optional: false });
        setShowAddForm(false);
        onIngredientsUpdated?.();
        // Refresh available ingredients to update the dropdown
        fetchAvailableIngredients();
      } else {
        setError(result.message || 'Failed to add ingredient');
      }
    } catch (err) {
      console.error('Error adding ingredient:', err);
      setError('Failed to add ingredient. Please try again.');
    } finally {
      setIsLoadingIngredients(false);
    }
  };

  // Handle updating ingredient
  const handleUpdateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient) return;

    setIsLoadingIngredients(true);
    setError(null);

    try {
      const data: UpdateMenuItemIngredientRequest = {
        quantity_required: parseFloat(editFormData.quantity_required),
        unit: editFormData.unit,
        is_optional: editFormData.is_optional
      };

      const response = await api.inventory.updateMenuItemIngredient(editingIngredient.id, data);
      const result: ApiResponse<MenuItemIngredient> = await response.json();

      if (result.success && result.data) {
        setIngredients(prev => 
          prev.map(ing => ing.id === editingIngredient.id ? result.data : ing)
        );
        setEditingIngredient(null);
        onIngredientsUpdated?.();
      } else {
        setError(result.message || 'Failed to update ingredient');
      }
    } catch (err) {
      console.error('Error updating ingredient:', err);
      setError('Failed to update ingredient. Please try again.');
    } finally {
      setIsLoadingIngredients(false);
    }
  };

  // Handle deleting ingredient
  const handleDeleteIngredient = async (ingredientId: string) => {
    if (!window.confirm('Are you sure you want to remove this ingredient from the menu item?')) {
      return;
    }

    try {
      const response = await api.inventory.removeMenuItemIngredient(ingredientId);
      const result: ApiResponse<null> = await response.json();

      if (result.success) {
        setIngredients(prev => prev.filter(ing => ing.id !== ingredientId));
        onIngredientsUpdated?.();
      } else {
        setError(result.message || 'Failed to remove ingredient');
      }
    } catch (err) {
      console.error('Error removing ingredient:', err);
      setError('Failed to remove ingredient. Please try again.');
    }
  };

  // Start editing ingredient
  const startEditing = (ingredient: MenuItemIngredient) => {
    setEditingIngredient(ingredient);
    setEditFormData({
      quantity_required: ingredient.quantity_required.toString(),
      unit: ingredient.unit,
      is_optional: ingredient.is_optional
    });
  };

  // Check if ingredient is available (has sufficient stock)
  const isIngredientAvailable = (ingredient: MenuItemIngredient) => {
    if (!ingredient.ingredient) return true;
    return ingredient.ingredient.current_stock >= ingredient.quantity_required;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Ingredients</h2>
            <p className="text-sm text-gray-600 mt-1">{menuItem.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Add New Ingredient Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Ingredient</span>
            </button>
          </div>

          {/* Add Ingredient Form */}
          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Ingredient</h3>
              <form onSubmit={handleAddIngredient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ingredient
                    </label>
                    <select
                      value={addFormData.ingredient_id}
                      onChange={(e) => setAddFormData({ ...addFormData, ingredient_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isLoadingIngredients}
                    >
                      <option value="">
                        {isLoadingIngredients ? 'Loading ingredients...' : 'Select ingredient'}
                      </option>
                      {availableIngredients.length > 0 ? (
                        availableIngredients.map(ingredient => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} ({ingredient.current_stock} {ingredient.unit})
                          </option>
                        ))
                      ) : (
                        !isLoadingIngredients && (
                          <option value="" disabled>
                            No ingredients available
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity Required
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={addFormData.quantity_required}
                      onChange={(e) => setAddFormData({ ...addFormData, quantity_required: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={addFormData.unit}
                      onChange={(e) => setAddFormData({ ...addFormData, unit: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addFormData.is_optional}
                      onChange={(e) => setAddFormData({ ...addFormData, is_optional: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Optional ingredient</span>
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isLoadingIngredients}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isLoadingIngredients ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>Add Ingredient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Ingredients List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading ingredients...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {ingredients.length > 0 ? (
                ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    {editingIngredient?.id === ingredient.id ? (
                      // Edit Form
                      <form onSubmit={handleUpdateIngredient} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Ingredient
                            </label>
                            <p className="text-sm text-gray-900 font-medium">
                              {ingredient.ingredient?.name || 'Unknown Ingredient'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity Required
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editFormData.quantity_required}
                              onChange={(e) => setEditFormData({ ...editFormData, quantity_required: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={editFormData.unit}
                              onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.is_optional}
                              onChange={(e) => setEditFormData({ ...editFormData, is_optional: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Optional ingredient</span>
                          </label>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            disabled={isLoadingIngredients}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
                          >
                            {isLoadingIngredients ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                            <span>Update</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIngredient(null)}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Display Mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {isIngredientAvailable(ingredient) ? (
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                              )}
                              <span className="font-medium text-gray-900">
                                {ingredient.ingredient?.name || 'Unknown Ingredient'}
                              </span>
                              {ingredient.is_optional && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  Optional
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">{ingredient.quantity_required} {ingredient.unit}</span>
                            {ingredient.ingredient && (
                              <span className="ml-4">
                                Available: {ingredient.ingredient.current_stock} {ingredient.ingredient.unit}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditing(ingredient)}
                            className="text-blue-600 hover:text-blue-700 p-1 rounded"
                            title="Edit ingredient"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteIngredient(ingredient.id)}
                            className="text-red-600 hover:text-red-700 p-1 rounded"
                            title="Remove ingredient"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No ingredients added yet</p>
                  <p className="text-gray-400 mt-1">Add ingredients to define what's needed for this menu item</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageIngredientsModal;
