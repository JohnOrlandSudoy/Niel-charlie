import React, { useState } from 'react';
import { X, AlertCircle, Calendar, DollarSign, Percent } from 'lucide-react';
import { CreateDiscountRequest } from '../../types/discounts';

interface CreateDiscountModalProps {
  onClose: () => void;
  onCreate: (data: CreateDiscountRequest) => Promise<boolean>;
}

const CreateDiscountModal: React.FC<CreateDiscountModalProps> = React.memo(({ onClose, onCreate }) => {
  const [formData, setFormData] = useState<CreateDiscountRequest>({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    minimum_order_amount: 0,
    maximum_discount_amount: 0,
    valid_until: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle input changes
  const handleInputChange = (field: keyof CreateDiscountRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.code.trim()) {
      setError('Discount code is required');
      return;
    }

    if (!formData.name.trim()) {
      setError('Discount name is required');
      return;
    }

    if (formData.discount_value <= 0) {
      setError('Discount value must be greater than 0');
      return;
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }

    if (formData.minimum_order_amount < 0) {
      setError('Minimum order amount cannot be negative');
      return;
    }

    if (formData.maximum_discount_amount < 0) {
      setError('Maximum discount amount cannot be negative');
      return;
    }

    if (formData.valid_until && new Date(formData.valid_until) <= new Date()) {
      setError('Valid until date must be in the future');
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await onCreate(formData);
      
      if (!success) {
        setError('Failed to create discount. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set default valid until date (1 year from now)
  const getDefaultValidUntil = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Discount</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-mono"
                  placeholder="SAVE10"
                  required
                  aria-label="Discount code"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Code will be automatically converted to uppercase
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  placeholder="10% Off Special"
                  required
                  aria-label="Discount name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                placeholder="Special discount for new customers"
                rows={3}
                aria-label="Discount description"
              />
            </div>
          </div>

          {/* Discount Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Discount Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type *
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => handleInputChange('discount_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  required
                  aria-label="Discount type"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value *
                </label>
                <div className="relative">
                  {formData.discount_type === 'percentage' ? (
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  ) : (
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  )}
                  <input
                    type="number"
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    step={formData.discount_type === 'percentage' ? 0.1 : 0.01}
                    value={formData.discount_value}
                    onChange={(e) => handleInputChange('discount_value', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    placeholder={formData.discount_type === 'percentage' ? '10' : '50.00'}
                    required
                    aria-label="Discount value"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.discount_type === 'percentage' 
                    ? 'Enter percentage (0-100)'
                    : 'Enter amount in pesos'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimum_order_amount}
                    onChange={(e) => handleInputChange('minimum_order_amount', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    placeholder="0.00"
                    aria-label="Minimum order amount"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum order amount required to use this discount
                </p>
              </div>

              {formData.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Discount Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maximum_discount_amount}
                      onChange={(e) => handleInputChange('maximum_discount_amount', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                      placeholder="0.00"
                      aria-label="Maximum discount amount"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum amount that can be discounted (0 = no limit)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Validity Period */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Validity Period</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.valid_until || getDefaultValidUntil()}
                  onChange={(e) => handleInputChange('valid_until', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  min={new Date().toISOString().split('T')[0]}
                  aria-label="Valid until date"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to set 1 year from today
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Discount</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

CreateDiscountModal.displayName = 'CreateDiscountModal';

export default CreateDiscountModal;
