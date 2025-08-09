import React from 'react';
import { TrendingUp, ShoppingBag, Users, AlertTriangle } from 'lucide-react';

const StatsCards: React.FC = () => {
  const stats = [
    {
      label: 'Today\'s Sales',
      value: '₱12,450',
      change: '+12.5%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      label: 'Orders Today',
      value: '156',
      change: '+8.2%',
      changeType: 'increase',
      icon: ShoppingBag,
      color: 'emerald'
    },
    {
      label: 'Active Staff',
      value: '12',
      change: '100%',
      changeType: 'neutral',
      icon: Users,
      color: 'purple'
    },
    {
      label: 'Low Stock Items',
      value: '5',
      change: '+2',
      changeType: 'decrease',
      icon: AlertTriangle,
      color: 'amber'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <Icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
            </div>
            
            <div className="flex items-center mt-4">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'increase'
                    ? 'text-emerald-600'
                    : stat.changeType === 'decrease'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs yesterday</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;