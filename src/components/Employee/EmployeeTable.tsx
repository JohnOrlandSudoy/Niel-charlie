import React, { useState } from 'react';
import { Edit, Trash2, Shield, User, Clock } from 'lucide-react';

interface EmployeeTableProps {
  searchQuery: string;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ searchQuery }) => {
  const [employees] = useState([
    {
      id: 1,
      name: 'Maria Santos',
      email: 'maria.santos@restaurant.com',
      role: 'Admin',
      phone: '+63 912 345 6789',
      hireDate: '2023-06-15',
      status: 'active',
      hourlyRate: 180,
      totalHours: 168,
      lastLogin: '2024-01-15 14:30'
    },
    {
      id: 2,
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@restaurant.com',
      role: 'Kitchen Staff',
      phone: '+63 923 456 7890',
      hireDate: '2023-08-20',
      status: 'active',
      hourlyRate: 120,
      totalHours: 172,
      lastLogin: '2024-01-15 12:15'
    },
    {
      id: 3,
      name: 'Ana Reyes',
      email: 'ana.reyes@restaurant.com',
      role: 'Cashier',
      phone: '+63 934 567 8901',
      hireDate: '2023-09-10',
      status: 'active',
      hourlyRate: 110,
      totalHours: 165,
      lastLogin: '2024-01-15 16:45'
    },
    {
      id: 4,
      name: 'Pedro Garcia',
      email: 'pedro.garcia@restaurant.com',
      role: 'Kitchen Staff',
      phone: '+63 945 678 9012',
      hireDate: '2023-10-05',
      status: 'active',
      hourlyRate: 125,
      totalHours: 158,
      lastLogin: '2024-01-14 18:20'
    },
    {
      id: 5,
      name: 'Lisa Wong',
      email: 'lisa.wong@restaurant.com',
      role: 'Cashier',
      phone: '+63 956 789 0123',
      hireDate: '2023-11-12',
      status: 'inactive',
      hourlyRate: 115,
      totalHours: 145,
      lastLogin: '2024-01-10 09:30'
    }
  ]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'Kitchen Staff':
        return <User className="h-4 w-4 text-emerald-600" />;
      case 'Cashier':
        return <User className="h-4 w-4 text-purple-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-blue-100 text-blue-800';
      case 'Kitchen Staff':
        return 'bg-emerald-100 text-emerald-800';
      case 'Cashier':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Work Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredEmployees.map((employee) => (
            <tr key={employee.id} className="hover:bg-gray-50 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    <div className="text-sm text-gray-500">{employee.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {getRoleIcon(employee.role)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(employee.role)}`}>
                    {employee.role}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>{employee.phone}</div>
                <div className="text-gray-500">Hired: {employee.hireDate}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>₱{employee.hourlyRate}/hour</div>
                <div className="text-gray-500 flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{employee.totalHours}h this month</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  employee.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {employee.status}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  Last: {employee.lastLogin}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-700 p-1 rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-700 p-1 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;