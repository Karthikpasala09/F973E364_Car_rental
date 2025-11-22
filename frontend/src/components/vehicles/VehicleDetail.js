import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleAPI } from '../../services/api';

function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getById(id);
      setVehicle(response.data);
    } catch (err) {
      setError('Failed to load vehicle details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = () => {
    navigate(`/reserve/${vehicle.vehicle_id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg">{error || 'Vehicle not found'}</div>
          <button
            onClick={() => navigate('/vehicles')}
            className="btn-primary mt-4"
          >
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/vehicles')}
          className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Vehicles
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vehicle.make} {vehicle.model}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Year: {vehicle.year}</span>
                <span>•</span>
                <span>Branch: {vehicle.branch_name}</span>
                <span>•</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  vehicle.status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {vehicle.status === 'available' ? 'Available' : vehicle.status || 'Not Available'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-600">
                ${vehicle.daily_rate}
              </div>
              <div className="text-sm text-gray-600">per day</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Make</dt>
                  <dd className="text-sm text-gray-900">{vehicle.make}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Model</dt>
                  <dd className="text-sm text-gray-900">{vehicle.model}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Year</dt>
                  <dd className="text-sm text-gray-900">{vehicle.year}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Daily Rate</dt>
                  <dd className="text-sm text-gray-900">${vehicle.daily_rate}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Branch Name</dt>
                  <dd className="text-sm text-gray-900">{vehicle.branch_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="text-sm text-gray-900">{vehicle.branch_location}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact</dt>
                  <dd className="text-sm text-gray-900">{vehicle.branch_contact}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-medium text-gray-900">Ready to reserve?</p>
                <p className="text-sm text-gray-600">Book this vehicle for your next trip</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/vehicles')}
                  className="btn-secondary"
                >
                  Browse More
                </button>
                {vehicle.status === 'available' && (
                  <button
                    onClick={handleReserve}
                    className="btn-primary"
                  >
                    Reserve Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleDetail;