import React, { useState, useCallback } from 'react';
import { Percent, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Discount } from '../../types/discounts';
import { useAvailableDiscounts } from '../../hooks/useAvailableDiscounts';

interface DiscountSelectorProps {
  orderAmount: number;
  onDiscountSelect: (discount: Discount | null) => void;
  selectedDiscount: Discount | null;
  onApplyDiscount?: (discount: Discount) => Promise<void>;
  isApplyingDiscount?: boolean;
}

const DiscountSelector: React.FC<DiscountSelectorProps> = React.memo(({
  orderAmount,
  onDiscountSelect,
  selectedDiscount,
  onApplyDiscount,
  isApplyingDiscount = false
}) => {
  const { availableDiscounts, isLoading, error, validateDiscountCode } = useAvailableDiscounts();
  const [searchQuery, setSearchQuery] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    discount?: Discount;
    discountAmount?: number;
    message?: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Filter discounts based on search query
  const filteredDiscounts = availableDiscounts.filter(discount =>
    discount.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discount.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle discount selection
  const handleDiscountSelect = useCallback((discount: Discount) => {
    onDiscountSelect(discount);
    setSearchQuery('');
    setValidationResult(null);
  }, [onDiscountSelect]);

  // Handle discount code validation
  const handleCodeValidation = useCallback(async (code: string) => {
    if (!code.trim()) {
      setValidationResult(null);
      return;
    }

    try {
      setIsValidating(true);
      const result = await validateDiscountCode(code, orderAmount);
      setValidationResult(result);
    } catch (err) {
      setValidationResult({
        isValid: false,
        message: 'Failed to validate discount code'
      });
    } finally {
      setIsValidating(false);
    }
  }, [validateDiscountCode, orderAmount]);

  // Apply validated discount
  const handleApplyValidatedDiscount = useCallback(() => {
    if (validationResult?.isValid && validationResult.discount) {
      handleDiscountSelect(validationResult.discount);
    }
  }, [validationResult, handleDiscountSelect]);

  // Format discount value
  const formatDiscountValue = (discount: Discount) => {
    if (discount.discount_type === 'percentage') {
      return `${discount.discount_value}%`;
    }
    return `₱${discount.discount_value.toFixed(2)}`;
  };

  // Calculate discount amount
  const calculateDiscountAmount = (discount: Discount) => {
    if (discount.discount_type === 'percentage') {
      const amount = (orderAmount * discount.discount_value) / 100;
      return discount.maximum_discount_amount 
        ? Math.min(amount, discount.maximum_discount_amount)
        : amount;
    }
    return discount.discount_value;
  };

  // Check if discount is applicable
  const isDiscountApplicable = (discount: Discount) => {
    if (discount.minimum_order_amount && orderAmount < discount.minimum_order_amount) {
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Percent className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">Apply Discount</h3>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3" role="alert">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Manual Code Entry */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Enter Discount Code
        </label>
        <div className="flex space-x-2">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleCodeValidation(e.target.value);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-mono"
              placeholder="Enter discount code (e.g., SAVE10)"
              aria-label="Discount code"
            />
          </div>
          {validationResult?.isValid && (
            <button
              onClick={handleApplyValidatedDiscount}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Apply validated discount"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Apply</span>
            </button>
          )}
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`rounded-lg p-3 ${
            validationResult.isValid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${
                validationResult.isValid ? 'text-green-800' : 'text-red-800'
              }`}>
                {validationResult.message}
              </span>
            </div>
            {validationResult.isValid && validationResult.discountAmount && (
              <p className="text-sm text-green-700 mt-1">
                Discount: ₱{validationResult.discountAmount.toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Available Discounts */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Available Discounts
        </label>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading discounts...</span>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No discounts available</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredDiscounts.map((discount) => {
              const isApplicable = isDiscountApplicable(discount);
              const discountAmount = calculateDiscountAmount(discount);
              const isSelected = selectedDiscount?.id === discount.id;

              return (
                <div
                  key={discount.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : isApplicable
                      ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                  onClick={() => isApplicable && handleDiscountSelect(discount)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-medium text-sm">
                          {discount.code}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {discount.name}
                        </span>
                        {!isApplicable && (
                          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                            Min: ₱{discount.minimum_order_amount?.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {discount.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          {discount.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDiscountValue(discount)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Save: ₱{discountAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Discount Summary */}
      {selectedDiscount && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Selected Discount</h4>
              <p className="text-sm text-blue-700">
                {selectedDiscount.code} - {selectedDiscount.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-900">
                -₱{calculateDiscountAmount(selectedDiscount).toFixed(2)}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {onApplyDiscount && (
                  <button
                    onClick={() => onApplyDiscount(selectedDiscount)}
                    disabled={isApplyingDiscount}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                  >
                    {isApplyingDiscount ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Applying...</span>
                      </>
                    ) : (
                      <span>Apply Discount</span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => onDiscountSelect(null)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

DiscountSelector.displayName = 'DiscountSelector';

export default DiscountSelector;
