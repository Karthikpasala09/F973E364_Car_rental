import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vehicleAPI, branchAPI } from '../../services/api';

function VehicleCard({ vehicle, onReserve }) {
  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-sm text-gray-600">Year: {vehicle.year}</p>
          <p className="text-sm text-gray-600">Branch: {vehicle.branch_name}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary-600">
            ${vehicle.daily_rate}/day
          </p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            vehicle.status === 'available' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {vehicle.status === 'available' ? 'Available' : vehicle.status || 'Not Available'}
          </span>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Link
            to={`/vehicles/${vehicle.vehicle_id}`}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View Details
          </Link>
        </div>
        {vehicle.status === 'available' && (
          <button
            onClick={() => onReserve(vehicle)}
            className="btn-primary text-sm"
          >
            Reserve Now
          </button>
        )}
      </div>
    </div>
  );
}

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    branch_id: '',
    make: '',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      const [vehicleRes, branchRes] = await Promise.all([
        vehicleAPI.getAll(filters),
        branchAPI.getAll()
      ]);
      
      // Handle different response formats for vehicles
      let vehicleData;
      if (vehicleRes.data && Array.isArray(vehicleRes.data)) {
        vehicleData = vehicleRes.data;
      } else if (vehicleRes.data && vehicleRes.data.data && Array.isArray(vehicleRes.data.data)) {
        vehicleData = vehicleRes.data.data;
      } else if (Array.isArray(vehicleRes)) {
        vehicleData = vehicleRes;
      } else {
        vehicleData = [];
      }
      
      // Handle different response formats for branches
      let branchData;
      if (branchRes.data && Array.isArray(branchRes.data)) {
        branchData = branchRes.data;
      } else if (branchRes.data && branchRes.data.data && Array.isArray(branchRes.data.data)) {
        branchData = branchRes.data.data;
      } else if (Array.isArray(branchRes)) {
        branchData = branchRes;
      } else {
        branchData = [];
      }
      
      setVehicles(vehicleData);
      setBranches(branchData);
    } catch (err) {
      setError('Failed to load vehicles');
      console.error('Vehicle loading error:', err);
      setVehicles([]); // Set empty array on error
      setBranches([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReserve = (vehicle) => {
    // Navigate to reservation flow - will be implemented later
    console.log('Reserve vehicle:', vehicle);
  };

  const uniqueMakes = [...new Set(vehicles.map(v => v.make))];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">{error}</div>
        <button
          onClick={loadData}
          className="btn-primary mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Vehicles</h1>
        <p className="text-gray-600">Find the perfect vehicle for your rental needs</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Filter Vehicles</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by make or model"
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              name="branch_id"
              value={filters.branch_id}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Make
            </label>
            <select
              name="make"
              value={filters.make}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All Makes</option>
              {uniqueMakes.map(make => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="all">All Vehicles</option>
              <option value="available">Available Only</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-gray-600">
          Found {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
        </p>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters to see more results.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.vehicle_id}
              vehicle={vehicle}
              onReserve={handleReserve}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default VehicleList;