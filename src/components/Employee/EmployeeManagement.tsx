import React, { useState } from 'react';
import { Search, Plus, Users, Clock, DollarSign } from 'lucide-react';
import EmployeeTable from './EmployeeTable';
import AddEmployeeModal from './AddEmployeeModal';
import TimeTracker from './TimeTracker';

const EmployeeManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('employees');
  const [searchQuery, setSearchQuery] = useState('');

  const employeeStats = [
    { label: 'Total Employees', value: 12, icon: Users, color: 'blue' },
    { label: 'On Duty Today', value: 8, icon: Clock, color: 'emerald' },
    { label: 'Off Duty', value: 4, icon: Clock, color: 'gray' },
    { label: 'Total Payroll', value: '₱85,400', icon: DollarSign, color: 'purple' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage staff accounts, roles, and track work hours</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {employeeStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'employees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Employee Directory
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'attendance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Time Tracking
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'employees' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <EmployeeTable searchQuery={searchQuery} />
            </div>
          )}

          {activeTab === 'attendance' && <TimeTracker />}
        </div>
      </div>

      {showAddModal && (
        <AddEmployeeModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default EmployeeManagement;