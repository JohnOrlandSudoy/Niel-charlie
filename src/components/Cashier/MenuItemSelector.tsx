import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Clock, AlertTriangle, CheckCircle, Package, Image as ImageIcon, XCircle } from 'lucide-react';
import { MenuItem } from '../../types/menu';
import { useMenuItemSelection } from '../../hooks/useMenuItemSelection';
import { useInventoryStock } from '../../hooks/useInventoryStock';

interface MenuItemSelectorProps {
  onAddToOrder: (menuItem: MenuItem, quantity: number, customizations?: string, specialInstructions?: string) => void;
  onClose: () => void;
}

const MenuItemSelector: React.FC<MenuItemSelectorProps> = React.memo(({ onAddToOrder, onClose }) => {
  // Use the custom hook for menu item management
  const {
    menuItems,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    categories,
    imageErrors,
    filteredItems,
    fetchMenuItems,
    getImageUrl,
    handleImageError,
    getCategoryName
  } = useMenuItemSelection();

  // Use inventory stock checking
  const {
    checkMenuItemStock,
    isLoading: isStockLoading
  } = useInventoryStock();
  
  // Selected item state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleAddToOrder = useCallback(() => {
    if (selectedItem && quantity > 0) {
      // Check stock before adding to order
      const stockStatus = checkMenuItemStock(selectedItem, quantity);
      if (!stockStatus.isAvailable) {
        alert(`Cannot add ${selectedItem.name}: ${stockStatus.stockMessage}`);
        return;
      }
      
      onAddToOrder(selectedItem, quantity, customizations, specialInstructions);
      // Reset form
      setSelectedItem(null);
      setQuantity(1);
      setCustomizations('');
      setSpecialInstructions('');
    }
  }, [selectedItem, quantity, customizations, specialInstructions, onAddToOrder, checkMenuItemStock]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleItemSelect = useCallback((item: MenuItem) => {
    setSelectedItem(item);
  }, []);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(Math.max(1, newQuantity));
  }, []);

  const handleCustomizationsChange = useCallback((value: string) => {
    setCustomizations(value);
  }, []);

  const handleSpecialInstructionsChange = useCallback((value: string) => {
    setSpecialInstructions(value);
  }, []);

  const totalPrice = useMemo(() => {
    return selectedItem ? selectedItem.price * quantity : 0;
  }, [selectedItem, quantity]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading menu items...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-selector-title"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="menu-selector-title" className="text-xl font-semibold text-gray-900">Select Menu Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close menu selector"
          >
            <span className="text-gray-500">×</span>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    aria-label="Search menu items"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  aria-label="Filter by category"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {getCategoryName(category)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6" role="list" aria-label="Available menu items">
            {filteredItems.map(item => {
              const imageUrl = getImageUrl(item);
              const hasImageError = imageErrors.has(item.id);
              const stockStatus = checkMenuItemStock(item);
              const isDisabled = !stockStatus.isAvailable;
              
              return (
                <div
                  key={item.id}
                  onClick={() => !isDisabled && handleItemSelect(item)}
                  className={`p-4 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDisabled
                      ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                      : selectedItem?.id === item.id
                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                  role="listitem"
                  tabIndex={isDisabled ? -1 : 0}
                  onKeyDown={(e) => {
                    if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleItemSelect(item);
                    }
                  }}
                  aria-label={`${isDisabled ? 'Out of stock: ' : ''}Select ${item.name} - ₱${item.price}`}
                >
                  {/* Menu Item Image */}
                  <div className="relative mb-3">
                    {imageUrl && !hasImageError ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={() => handleImageError(item.id)}
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Price Badge */}
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-medium">
                      ₱{item.price}
                    </div>
                    
                    {/* Stock Status Badge */}
                    {stockStatus.isOutOfStock && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <XCircle className="h-3 w-3" />
                        <span>Out of Stock</span>
                      </div>
                    )}
                    {stockStatus.isLowStock && !stockStatus.isOutOfStock && (
                      <div className="absolute top-2 left-2 bg-amber-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Low Stock</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{item.name}</h3>
                    
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.prep_time}m</span>
                      </div>
                      
                      {item.calories && (
                        <div className="flex items-center space-x-1">
                          <Package className="h-3 w-3" />
                          <span>{item.calories} cal</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        {stockStatus.isOutOfStock ? (
                          <>
                            <XCircle className="h-3 w-3 text-red-500" />
                            <span className="text-red-600">Out of Stock</span>
                          </>
                        ) : stockStatus.isLowStock ? (
                          <>
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span className="text-amber-600">Low Stock</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>Available</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No menu items found</p>
              <p className="text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Selected Item Details */}
          {selectedItem && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Order</h3>
              
              {/* Stock Status Alert */}
              {(() => {
                const stockStatus = checkMenuItemStock(selectedItem, quantity);
                if (stockStatus.isOutOfStock) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <h4 className="text-red-800 font-medium">Out of Stock</h4>
                          <p className="text-red-700 text-sm">{stockStatus.stockMessage}</p>
                        </div>
                      </div>
                    </div>
                  );
                } else if (stockStatus.isLowStock) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <div>
                          <h4 className="text-amber-800 font-medium">Low Stock Warning</h4>
                          <p className="text-amber-700 text-sm">{stockStatus.stockMessage}</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {/* Selected Item Image */}
                  <div className="relative mb-4">
                    {(() => {
                      const imageUrl = getImageUrl(selectedItem);
                      const hasImageError = imageErrors.has(selectedItem.id);
                      
                      return imageUrl && !hasImageError ? (
                        <img
                          src={imageUrl}
                          alt={selectedItem.name}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={() => handleImageError(selectedItem.id)}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      );
                    })()}
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">{selectedItem.name}</h4>
                  <p className="text-gray-600 mb-4">{selectedItem.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Price: ₱{selectedItem.price}</span>
                    <span>Prep Time: {selectedItem.prep_time}m</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                        className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Quantity"
                      />
                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customizations (Optional)
                    </label>
                    <input
                      type="text"
                      value={customizations}
                      onChange={(e) => handleCustomizationsChange(e.target.value)}
                      placeholder="e.g., Extra spicy, No onions"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                      aria-label="Customizations"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => handleSpecialInstructionsChange(e.target.value)}
                      placeholder="Any special preparation instructions..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                      aria-label="Special instructions"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-lg font-semibold">
                  Total: ₱{totalPrice.toFixed(2)}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    aria-label="Cancel item selection"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddToOrder}
                    disabled={checkMenuItemStock(selectedItem, quantity).isOutOfStock}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 focus:outline-none focus:ring-2 ${
                      checkMenuItemStock(selectedItem, quantity).isOutOfStock
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                    aria-label={`Add ${selectedItem?.name} to order`}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>{checkMenuItemStock(selectedItem, quantity).isOutOfStock ? 'Out of Stock' : 'Add to Order'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MenuItemSelector.displayName = 'MenuItemSelector';

export default MenuItemSelector;
