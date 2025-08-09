import React, { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

const SalesChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState('week');
  
  const salesData = {
    week: [
      { day: 'Mon', sales: 8500, orders: 45 },
      { day: 'Tue', sales: 12200, orders: 67 },
      { day: 'Wed', sales: 9800, orders: 52 },
      { day: 'Thu', sales: 15600, orders: 78 },
      { day: 'Fri', sales: 18900, orders: 89 },
      { day: 'Sat', sales: 22400, orders: 112 },
      { day: 'Sun', sales: 19700, orders: 95 },
    ]
  };

  const maxSales = Math.max(...salesData.week.map(d => d.sales));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
        </div>
        
        <div className="flex space-x-2">
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                timeRange === range
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 flex items-end space-x-4">
        {salesData.week.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col items-center space-y-2">
              <div
                className="w-full bg-blue-600 rounded-t-md transition-all duration-500 ease-out hover:bg-blue-700 cursor-pointer"
                style={{
                  height: `${(data.sales / maxSales) * 180}px`,
                  minHeight: '20px'
                }}
                title={`₱${data.sales.toLocaleString()}`}
              />
              <div className="text-center">
                <p className="text-xs font-medium text-gray-900">₱{(data.sales / 1000).toFixed(1)}k</p>
                <p className="text-xs text-gray-500">{data.day}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-600">+15.2%</span>
            <span className="text-sm text-gray-500">vs last week</span>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-lg font-bold text-gray-900">₱107,100</p>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;