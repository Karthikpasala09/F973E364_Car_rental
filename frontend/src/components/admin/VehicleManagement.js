import React, { useState, useEffect } from 'react';
import { vehicleAPI, branchAPI } from '../../services/api';

function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    license_plate: '',
    fuel_type: 'petrol',
    transmission: 'manual',
    seats: 5,
    branch_id: '',
    daily_rate: '',
    status: 'available'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('Starting to load vehicles and branches data...');
      
      const [vehiclesRes, branchesRes] = await Promise.all([
        vehicleAPI.getAll().catch(error => {
          console.error('Vehicles API error:', error);
          return { error: error.message, data: [] };
        }),
        branchAPI.getAll().catch(error => {
          console.error('Branches API error:', error);
          return { error: error.message, data: [] };
        })
      ]);
      
      console.log('Raw vehicles response:', vehiclesRes);
      
      // Handle vehicles response - axios returns response in .data property
      let vehiclesData = [];
      console.log('Vehicles response structure:', Object.keys(vehiclesRes || {}));
      
      if (vehiclesRes && !vehiclesRes.error) {
        // Axios response format: response.data contains the actual API response
        const apiResponse = vehiclesRes.data || vehiclesRes;
        console.log('Vehicles API response:', apiResponse);
        
        if (Array.isArray(apiResponse)) {
          vehiclesData = apiResponse;
          console.log('Vehicles format: Direct array from API');
        } else if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
          vehiclesData = apiResponse.data;
          console.log('Vehicles format: API success response with data array');
        } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
          vehiclesData = apiResponse.data;
          console.log('Vehicles format: API response with data array');
        } else {
          console.log('Unexpected vehicles API response format:', apiResponse);
        }
      }
      
      // Handle branches response - axios returns response in .data property
      let branchesData = [];
      console.log('Branches response structure:', Object.keys(branchesRes || {}));
      
      if (branchesRes && !branchesRes.error) {
        // Axios response format: response.data contains the actual API response
        const apiResponse = branchesRes.data || branchesRes;
        console.log('Branches API response:', apiResponse);
        
        if (Array.isArray(apiResponse)) {
          branchesData = apiResponse;
          console.log('Branches format: Direct array from API');
        } else if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
          branchesData = apiResponse.data;
          console.log('Branches format: API success response with data array');
        } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
          branchesData = apiResponse.data;
          console.log('Branches format: API response with data array');
        } else {
          console.log('Unexpected branches API response format:', apiResponse);
          console.log('Available properties:', Object.keys(apiResponse || {}));
        }
      } else {
        console.log('No branches response received or error occurred');
      }
      
      setVehicles(vehiclesData);
      setBranches(branchesData);
      
      console.log('Loaded vehicles:', vehiclesData.length, 'branches:', branchesData.length);
      console.log('Branches data:', branchesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set empty arrays on error to prevent map errors
      setVehicles([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingVehicle) {
        response = await vehicleAPI.update(editingVehicle.vehicle_id, formData);
        console.log('Vehicle updated:', response);
      } else {
        response = await vehicleAPI.create(formData);
        console.log('Vehicle created:', response);
      }
      await loadData();
      setShowForm(false);
      setEditingVehicle(null);
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        license_plate: '',
        fuel_type: 'petrol',
        transmission: 'manual',
        seats: 5,
        branch_id: '',
        daily_rate: '',
        status: 'available'
      });
    } catch (error) {
      console.error('Failed to save vehicle:', error);
      alert(`Failed to ${editingVehicle ? 'update' : 'create'} vehicle: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      color: vehicle.color || '',
      license_plate: vehicle.license_plate || '',
      fuel_type: vehicle.fuel_type || 'petrol',
      transmission: vehicle.transmission || 'manual',
      seats: vehicle.seats || 5,
      branch_id: vehicle.branch_id || '',
      daily_rate: vehicle.daily_rate || '',
      status: vehicle.status || 'available'
    });
    setShowForm(true);
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        const response = await vehicleAPI.delete(vehicleId);
        console.log('Vehicle deleted:', response);
        await loadData();
      } catch (error) {
        console.error('Failed to delete vehicle:', error);
        alert(`Failed to delete vehicle: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVehicle(null);
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      license_plate: '',
      fuel_type: 'petrol',
      transmission: 'manual',
      seats: 5,
      branch_id: '',
      daily_rate: '',
      status: 'available'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600">Manage your fleet of vehicles</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Add New Vehicle
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make
                </label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., Toyota"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., Camry"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., ABC123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type
                </label>
                <select
                  name="fuel_type"
                  value={formData.fuel_type}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transmission
                </label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seats
                </label>
                <input
                  type="number"
                  name="seats"
                  value={formData.seats}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="12"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <select
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="">Select Branch</option>
                  {Array.isArray(branches) && branches.map(branch => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.name} - {branch.location}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate ($)
                </label>
                <input
                  type="number"
                  name="daily_rate"
                  value={formData.daily_rate}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="50.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Daily Rate
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
            {Array.isArray(vehicles) && vehicles.map((vehicle) => (
              <tr key={vehicle.vehicle_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500">Year: {vehicle.year}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{vehicle.branch_name}</div>
                  <div className="text-sm text-gray-500">{vehicle.branch_location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${vehicle.daily_rate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vehicle.status === 'available'
                      ? 'bg-green-100 text-green-800' 
                      : vehicle.status === 'rented'
                      ? 'bg-blue-100 text-blue-800'
                      : vehicle.status === 'maintenance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {vehicle.status === 'available' ? 'Available' : 
                     vehicle.status === 'rented' ? 'Rented' :
                     vehicle.status === 'maintenance' ? 'Maintenance' :
                     vehicle.status === 'retired' ? 'Retired' : 
                     (vehicle.status || 'Unknown')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(vehicle)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle.vehicle_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {vehicles.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new vehicle to your fleet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VehicleManagement;