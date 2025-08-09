import React, { useState } from 'react';
import { Download, Calendar, Filter, DollarSign, Clock, Users } from 'lucide-react';

const Payroll: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01-01_2024-01-15');
  const [filterEmployee, setFilterEmployee] = useState('all');

  const payrollData = [
    {
      id: 1,
      employeeName: 'Maria Santos',
      role: 'Admin',
      hourlyRate: 180,
      hoursWorked: 168,
      regularPay: 30240,
      overtimeHours: 8,
      overtimePay: 2160,
      allowances: 2000,
      deductions: 1500,
      grossPay: 34400,
      netPay: 32900,
      status: 'processed'
    },
    {
      id: 2,
      employeeName: 'Juan Dela Cruz',
      role: 'Kitchen Staff',
      hourlyRate: 120,
      hoursWorked: 172,
      regularPay: 20640,
      overtimeHours: 12,
      overtimePay: 2160,
      allowances: 1500,
      deductions: 800,
      grossPay: 24300,
      netPay: 23500,
      status: 'processed'
    },
    {
      id: 3,
      employeeName: 'Ana Reyes',
      role: 'Cashier',
      hourlyRate: 110,
      hoursWorked: 165,
      regularPay: 18150,
      overtimeHours: 5,
      overtimePay: 825,
      allowances: 1000,
      deductions: 600,
      grossPay: 19975,
      netPay: 19375,
      status: 'pending'
    },
    {
      id: 4,
      employeeName: 'Pedro Garcia',
      role: 'Kitchen Staff',
      hourlyRate: 125,
      hoursWorked: 158,
      regularPay: 19750,
      overtimeHours: 3,
      overtimePay: 562.5,
      allowances: 1200,
      deductions: 700,
      grossPay: 21512.5,
      netPay: 20812.5,
      status: 'processed'
    },
    {
      id: 5,
      employeeName: 'Lisa Wong',
      role: 'Cashier',
      hourlyRate: 115,
      hoursWorked: 145,
      regularPay: 16675,
      overtimeHours: 0,
      overtimePay: 0,
      allowances: 800,
      deductions: 500,
      grossPay: 17475,
      netPay: 16975,
      status: 'pending'
    }
  ];

  const employees = ['all', 'Maria Santos', 'Juan Dela Cruz', 'Ana Reyes', 'Pedro Garcia', 'Lisa Wong'];

  const filteredPayroll = payrollData.filter(record =>
    filterEmployee === 'all' || record.employeeName === filterEmployee
  );

  const totalGrossPay = filteredPayroll.reduce((sum, record) => sum + record.grossPay, 0);
  const totalNetPay = filteredPayroll.reduce((sum, record) => sum + record.netPay, 0);
  const totalHours = filteredPayroll.reduce((sum, record) => sum + record.hoursWorked, 0);
  const totalOvertimeHours = filteredPayroll.reduce((sum, record) => sum + record.overtimeHours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-1">Manage employee compensation and generate payroll reports</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200">
          <Download className="h-4 w-4" />
          <span>Export Payroll</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Gross Pay</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₱{totalGrossPay.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Net Pay</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">₱{totalNetPay.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-100">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalHours}h</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overtime Hours</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{totalOvertimeHours}h</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="2024-01-01_2024-01-15">Jan 1-15, 2024</option>
              <option value="2023-12-16_2023-12-31">Dec 16-31, 2023</option>
              <option value="2023-12-01_2023-12-15">Dec 1-15, 2023</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {employees.map(employee => (
                <option key={employee} value={employee}>
                  {employee === 'all' ? 'All Employees' : employee}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours & Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Regular Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overtime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayroll.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                      <div className="text-sm text-gray-500">{record.role}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{record.hoursWorked}h</div>
                    <div className="text-gray-500">₱{record.hourlyRate}/hr</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₱{record.regularPay.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{record.overtimeHours}h</div>
                    <div className="text-gray-600">₱{record.overtimePay.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                    +₱{record.allowances.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                    -₱{record.deductions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ₱{record.netPay.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      record.status === 'processed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payroll;