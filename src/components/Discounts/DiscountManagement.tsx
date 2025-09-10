import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Calendar,
  Percent,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useDiscountManagement } from '../../hooks/useDiscountManagement';
import { Discount, CreateDiscountRequest } from '../../types/discounts';
import CreateDiscountModal from './CreateDiscountModal';
import EditDiscountModal from './EditDiscountModal';
import DiscountStats from './DiscountStats';

const DiscountManagement: React.FC = React.memo(() => {
  const {
    discounts,
    stats,
    isLoading,
    error,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    toggleDiscountStatus,
    refreshDiscounts,
  } = useDiscountManagement();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

  // Filter and search discounts
  const filteredDiscounts = useMemo(() => {
    let filtered = discounts;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(discount =>
        discount.code.toLowerCase().includes(query) ||
        discount.name.toLowerCase().includes(query) ||
        discount.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(discount => {
        switch (statusFilter) {
          case 'active':
            return discount.is_active && new Date(discount.valid_until) > now;
          case 'inactive':
            return !discount.is_active;
          case 'expired':
            return new Date(discount.valid_until) <= now;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [discounts, searchQuery, statusFilter]);

  // Handle create discount
  const handleCreateDiscount = async (data: CreateDiscountRequest) => {
    const success = await createDiscount(data);
    if (success) {
      setShowCreateModal(false);
    }
  };

  // Handle edit discount
  const handleEditDiscount = async (id: string, data: any) => {
    const success = await updateDiscount(id, data);
    if (success) {
      setShowEditModal(false);
      setSelectedDiscount(null);
    }
  };

  // Handle delete discount
  const handleDeleteDiscount = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this discount? This action cannot be undone.')) {
      await deleteDiscount(id);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id: string) => {
    await toggleDiscountStatus(id);
  };

  // Get status badge
  const getStatusBadge = (discount: Discount) => {
    const now = new Date();
    const validUntil = new Date(discount.valid_until);

    if (!discount.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 mr-1" />
          Inactive
        </span>
      );
    }

    if (validUntil <= now) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </span>
    );
  };

  // Format discount value
  const formatDiscountValue = (discount: Discount) => {
    if (discount.discount_type === 'percentage') {
      return `${discount.discount_value}%`;
    }
    return `₱${discount.discount_value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discount Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage discount codes for your restaurant
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Create new discount"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          <span>Create Discount</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert" aria-live="polite">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && <DiscountStats stats={stats} />}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search discounts by code, name, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                aria-label="Search discounts"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading discounts...</span>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No discounts found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first discount code.'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create First Discount
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name & Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDiscounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 font-mono">
                          {discount.code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {discount.name}
                      </div>
                      {discount.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {discount.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {discount.discount_type === 'percentage' ? (
                          <Percent className="h-4 w-4 text-blue-600" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {formatDiscountValue(discount)}
                        </span>
                      </div>
                      {discount.minimum_order_amount && (
                        <div className="text-xs text-gray-500 mt-1">
                          Min: ₱{discount.minimum_order_amount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {discount.used_count}
                          {discount.usage_limit && ` / ${discount.usage_limit}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(discount.valid_until).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(discount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleStatus(discount.id)}
                          className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                          aria-label={`${discount.is_active ? 'Deactivate' : 'Activate'} discount`}
                        >
                          {discount.is_active ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDiscount(discount);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                          aria-label="Edit discount"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDiscount(discount.id)}
                          className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                          aria-label="Delete discount"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateDiscountModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateDiscount}
        />
      )}

      {showEditModal && selectedDiscount && (
        <EditDiscountModal
          discount={selectedDiscount}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDiscount(null);
          }}
          onUpdate={handleEditDiscount}
        />
      )}
    </div>
  );
});

DiscountManagement.displayName = 'DiscountManagement';

export default DiscountManagement;
