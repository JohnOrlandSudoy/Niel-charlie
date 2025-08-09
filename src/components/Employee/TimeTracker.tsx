import React, { useState } from 'react';
import { Calendar, Clock, Download, Filter } from 'lucide-react';

const TimeTracker: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2024-01-15');
  const [filterEmployee, setFilterEmployee] = useState('all');

  const timeRecords = [
    {
      id: 1,
      employeeName: 'Maria Santos',
      role: 'Admin',
      timeIn: '08:00 AM',
      timeOut: '05:00 PM',
      breakTime: '1 hour',
      totalHours: 8,
      status: 'completed',
      overtime: 0
    },
    {
      id: 2,
      employeeName: 'Juan Dela Cruz',
      role: 'Kitchen Staff',
      timeIn: '07:30 AM',
      timeOut: '04:30 PM',
      breakTime: '1 hour',
      totalHours: 8,
      status: 'completed',
      overtime: 0
    },
    {
      id: 3,
      employeeName: 'Ana Reyes',
      role: 'Cashier',
      timeIn: '09:00 AM',
      timeOut: '06:15 PM',
      breakTime: '45 min',
      totalHours: 8.5,
      status: 'completed',
      overtime: 0.5
    },
    {
      id: 4,
      employeeName: 'Pedro Garcia',
      role: 'Kitchen Staff',
      timeIn: '10:00 AM',
      timeOut: '---',
      breakTime: '---',
      totalHours: 0,
      status: 'on-duty',
      overtime: 0
    },
    {
      id: 5,
      employeeName: 'Lisa Wong',
      role: 'Cashier',
      timeIn: '---',
      timeOut: '---',
      breakTime: '---',
      totalHours: 0,
      status: 'absent',
      overtime: 0
    }
  ];

  const employees = ['all', 'Maria Santos', 'Juan Dela Cruz', 'Ana Reyes', 'Pedro Garcia', 'Lisa Wong'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'on-duty':
        return 'bg-blue-100 text-blue-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecords = timeRecords.filter(record =>
    filterEmployee === 'all' || record.employeeName === filterEmployee
  );

  const totalHoursToday = filteredRecords.reduce((sum, record) => sum + record.totalHours, 0);
  const totalOvertime = filteredRecords.reduce((sum, record) => sum + record.overtime, 0);

  return (
    <div className="space-y-6">
      {/* Date and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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

        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center space-x-2 transition-colors duration-200">
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Total Hours</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">{totalHoursToday}h</p>
        </div>
        
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            <span className="font-medium text-emerald-900">On Duty</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-2">
            {filteredRecords.filter(r => r.status === 'on-duty').length}
          </p>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-amber-900">Overtime</span>
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">{totalOvertime}h</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-900">Absent</span>
          </div>
          <p className="text-2xl font-bold text-red-900 mt-2">
            {filteredRecords.filter(r => r.status === 'absent').length}
          </p>
        </div>
      </div>

      {/* Time Records Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time Out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Break Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Overtime
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                    <div className="text-sm text-gray-500">{record.role}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.timeIn}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.timeOut}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.breakTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.totalHours > 0 ? `${record.totalHours}h` : '---'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.overtime > 0 ? `${record.overtime}h` : '---'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(record.status)}`}>
                    {record.status.replace('-', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeTracker;