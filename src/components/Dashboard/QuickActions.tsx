import React from 'react';
import { Plus, Package, Book as MenuBook, Users, FileText, Settings } from 'lucide-react';

const QuickActions: React.FC = () => {
  const actions = [
    {
      label: 'Add New Order',
      icon: Plus,
      color: 'blue',
      description: 'Create a new customer order'
    },
    {
      label: 'Restock Item',
      icon: Package,
      color: 'emerald',
      description: 'Update inventory levels'
    },
    {
      label: 'Add Menu Item',
      icon: MenuBook,
      color: 'purple',
      description: 'Create new menu offering'
    },
    {
      label: 'Add Employee',
      icon: Users,
      color: 'amber',
      description: 'Register new staff member'
    },
    {
      label: 'Generate Report',
      icon: FileText,
      color: 'red',
      description: 'Create sales or inventory report'
    },
    {
      label: 'System Settings',
      icon: Settings,
      color: 'gray',
      description: 'Configure system preferences'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <button
              key={index}
              className={`p-4 rounded-lg border-2 border-dashed border-${action.color}-200 hover:border-${action.color}-300 hover:bg-${action.color}-50 transition-all duration-200 group`}
            >
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors duration-200 mb-2`}>
                  <Icon className={`h-4 w-4 text-${action.color}-600`} />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{action.label}</p>
                <p className="text-xs text-gray-500 leading-tight">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;