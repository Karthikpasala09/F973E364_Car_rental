import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { dashboardAPI } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    salesByBranch: [],
    reservationsTrend: [],
    fleetStats: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading dashboard data...');
      
      const [salesRes, trendsRes, fleetRes] = await Promise.all([
        dashboardAPI.getSalesByBranch().catch(error => {
          console.error('Sales by branch API error:', error);
          return { error: error.message };
        }),
        dashboardAPI.getReservationsTrend().catch(error => {
          console.error('Reservations trend API error:', error);
          return { error: error.message };
        }),
        dashboardAPI.getFleetStats().catch(error => {
          console.error('Fleet stats API error:', error);
          return { error: error.message };
        })
      ]);

      console.log('Raw API responses:', { salesRes, trendsRes, fleetRes });

      // Extract data from axios responses and handle different formats
      const extractData = (response, endpointName) => {
        if (!response) {
          console.log(`${endpointName}: No response`);
          return null;
        }
        
        if (response.error) {
          console.error(`${endpointName}: API error -`, response.error);
          return null;
        }

        // Axios wraps response in .data property
        const apiData = response.data || response;
        console.log(`${endpointName} extracted data:`, apiData);

        if (apiData.success && apiData.data) {
          return apiData.data;
        } else if (Array.isArray(apiData.data)) {
          return apiData.data;
        } else if (apiData.data) {
          return apiData.data;
        }
        
        return null;
      };

      const salesByBranch = extractData(salesRes, 'Sales by Branch');
      const reservationsTrend = extractData(trendsRes, 'Reservations Trend');
      const fleetStats = extractData(fleetRes, 'Fleet Stats');

      // Set dashboard data with fallbacks
      setDashboardData({
        salesByBranch: Array.isArray(salesByBranch) ? salesByBranch : [],
        reservationsTrend: Array.isArray(reservationsTrend) ? reservationsTrend : [],
        fleetStats: fleetStats || {}
      });

      console.log('Dashboard data loaded successfully:', {
        salesByBranch: Array.isArray(salesByBranch) ? salesByBranch.length : 0,
        reservationsTrend: Array.isArray(reservationsTrend) ? reservationsTrend.length : 0,
        fleetStats: fleetStats
      });

    } catch (err) {
      console.error('Unexpected error loading dashboard:', err);
      setError('Failed to load dashboard data');
      // Mock data for demonstration
      setDashboardData({
        salesByBranch: [
          { branch_name: 'Downtown', total_sales: 15000, reservation_count: 45 },
          { branch_name: 'Airport', total_sales: 22000, reservation_count: 67 },
          { branch_name: 'Central', total_sales: 12000, reservation_count: 38 },
          { branch_name: 'Midtown', total_sales: 18000, reservation_count: 52 }
        ],
        reservationsTrend: [
          { date: '2024-11-15', reservations: 12 },
          { date: '2024-11-16', reservations: 15 },
          { date: '2024-11-17', reservations: 8 },
          { date: '2024-11-18', reservations: 18 },
          { date: '2024-11-19', reservations: 22 },
          { date: '2024-11-20', reservations: 16 },
          { date: '2024-11-21', reservations: 19 }
        ],
        fleetStats: {
          total_vehicles: 50,
          available: 32,
          rented: 15,
          maintenance: 3
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const salesByBranchData = {
    labels: dashboardData.salesByBranch.map(item => item.branch_name),
    datasets: [
      {
        label: 'Total Sales ($)',
        data: dashboardData.salesByBranch.map(item => item.total_sales),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const salesByBranchOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales by Branch',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      },
    },
  };

  const reservationsTrendData = {
    labels: dashboardData.reservationsTrend.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Reservations',
        data: dashboardData.reservationsTrend.map(item => item.reservations),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const reservationsTrendOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Reservations Trend (Last 7 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const fleetAvailabilityData = {
    labels: ['Available', 'Rented', 'Maintenance'],
    datasets: [
      {
        data: [
          dashboardData.fleetStats.available || 0,
          dashboardData.fleetStats.rented || 0,
          dashboardData.fleetStats.maintenance || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const fleetAvailabilityOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Fleet Availability',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalSales = dashboardData.salesByBranch.reduce((sum, item) => sum + item.total_sales, 0);
  const totalReservations = dashboardData.salesByBranch.reduce((sum, item) => sum + item.reservation_count, 0);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your car rental business</p>
        {error && (
          <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error} - Showing sample data for demonstration
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">${totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reservations</p>
              <p className="text-2xl font-semibold text-gray-900">{totalReservations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Fleet</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.fleetStats.total_vehicles || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Vehicles</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.fleetStats.available || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sales by Branch Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <Bar data={salesByBranchData} options={salesByBranchOptions} />
        </div>

        {/* Fleet Availability Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <Pie data={fleetAvailabilityData} options={fleetAvailabilityOptions} />
        </div>
      </div>

      {/* Reservations Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <Line data={reservationsTrendData} options={reservationsTrendOptions} />
      </div>

      {/* Branch Performance Table */}
      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Branch Performance</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Sales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reservations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg. Revenue per Reservation
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dashboardData.salesByBranch.map((branch, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {branch.branch_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${branch.total_sales.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {branch.reservation_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${Math.round(branch.total_sales / branch.reservation_count).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;