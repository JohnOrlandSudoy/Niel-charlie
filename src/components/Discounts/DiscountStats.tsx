import React from 'react';
import { 
  Percent, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { DiscountStats as DiscountStatsType } from '../../types/discounts';

interface DiscountStatsProps {
  stats: DiscountStatsType;
}

const DiscountStats: React.FC<DiscountStatsProps> = React.memo(({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Discounts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Discounts</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_discounts}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Percent className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Active Discounts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Discounts</p>
            <p className="text-2xl font-bold text-green-600">{stats.active_discounts}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Total Usage */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Usage</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_usage}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-lg">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Total Savings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Savings</p>
            <p className="text-2xl font-bold text-green-600">
              ₱{stats.total_savings.toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="md:col-span-2 lg:col-span-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expired Discounts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired Discounts</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired_discounts}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Usage Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Usage Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total_discounts > 0 
                    ? ((stats.total_usage / stats.total_discounts) * 100).toFixed(1)
                    : 0
                  }%
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DiscountStats.displayName = 'DiscountStats';

export default DiscountStats;
