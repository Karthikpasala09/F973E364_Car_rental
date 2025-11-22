import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { vehicleAPI, reservationAPI, paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import "react-datepicker/dist/react-datepicker.css";

function ReservationFlow() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: dates, 2: confirm, 3: payment, 4: success
  const [formData, setFormData] = useState({
    startDate: null,
    endDate: null,
    totalCost: 0,
    days: 0
  });
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [reservationId, setReservationId] = useState(null);

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  useEffect(() => {
    if (formData.startDate && formData.endDate && vehicle) {
      const timeDiff = formData.endDate.getTime() - formData.startDate.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const total = days * vehicle.daily_rate;
      
      setFormData(prev => ({
        ...prev,
        days,
        totalCost: total
      }));
    }
  }, [formData.startDate, formData.endDate, vehicle]);

  const loadVehicle = async () => {
    try {
      const response = await vehicleAPI.getById(vehicleId);
      setVehicle(response.data);
    } catch (err) {
      console.error('Failed to load vehicle:', err);
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handlePaymentChange = (e) => {
    setPaymentData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateDates = () => {
    if (!formData.startDate || !formData.endDate) {
      alert('Please select both start and end dates');
      return false;
    }
    
    if (formData.startDate >= formData.endDate) {
      alert('End date must be after start date');
      return false;
    }
    
    if (formData.startDate < new Date()) {
      alert('Start date cannot be in the past');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateDates()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmitReservation = async () => {
    try {
      setSubmitting(true);
      
      // Create reservation
      const reservationData = {
        customer_id: user.customer_id,
        vehicle_id: parseInt(vehicleId),
        start_date: formData.startDate.toISOString().split('T')[0],
        end_date: formData.endDate.toISOString().split('T')[0],
        status: 'confirmed',
        total_cost: formData.totalCost
      };
      
      const reservationResponse = await reservationAPI.create(reservationData);
      const newReservationId = reservationResponse.data.reservation_id;
      setReservationId(newReservationId);
      
      // Create payment
      const paymentPayload = {
        reservation_id: newReservationId,
        amount: formData.totalCost,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: paymentData.paymentMethod,
        status: 'completed',
        txn_ref: `TXN_${Date.now()}_${newReservationId}`
      };
      
      await paymentAPI.create(paymentPayload);
      
      setStep(4);
    } catch (err) {
      console.error('Failed to create reservation:', err);
      alert('Failed to process reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg">Vehicle not found</div>
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
      {/* Progress indicator */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {[
              { name: 'Select Dates', step: 1 },
              { name: 'Review Details', step: 2 },
              { name: 'Payment', step: 3 },
              { name: 'Confirmation', step: 4 }
            ].map((item, itemIdx) => (
              <li key={item.name} className={`relative ${itemIdx !== 3 ? 'pr-8 sm:pr-20' : ''}`}>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  {itemIdx !== 3 && (
                    <div className={`h-0.5 w-full ${step > item.step ? 'bg-primary-600' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                  step > item.step ? 'bg-primary-600' : step === item.step ? 'border-2 border-primary-600 bg-white' : 'border-2 border-gray-300 bg-white'
                }`}>
                  <span className={`text-sm font-medium ${
                    step > item.step ? 'text-white' : step === item.step ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {item.step}
                  </span>
                </div>
                <span className={`ml-4 text-sm font-medium ${
                  step >= item.step ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {item.name}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Vehicle info header */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-sm text-gray-600">Year: {vehicle.year} • Branch: {vehicle.branch_name}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary-600">${vehicle.daily_rate}/day</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Select Dates */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Rental Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <DatePicker
                    selected={formData.startDate}
                    onChange={(date) => handleDateChange('startDate', date)}
                    minDate={new Date()}
                    selectsStart
                    startDate={formData.startDate}
                    endDate={formData.endDate}
                    placeholderText="Select start date"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <DatePicker
                    selected={formData.endDate}
                    onChange={(date) => handleDateChange('endDate', date)}
                    minDate={formData.startDate || new Date()}
                    selectsEnd
                    startDate={formData.startDate}
                    endDate={formData.endDate}
                    placeholderText="Select end date"
                    className="input-field"
                  />
                </div>
              </div>
              
              {formData.startDate && formData.endDate && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Rental Duration</p>
                      <p className="text-lg font-medium">{formData.days} day{formData.days !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="text-xl font-bold text-primary-600">${formData.totalCost}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review Details */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Reservation Details</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Rental Information</h4>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-gray-500">Start Date</dt>
                      <dd className="text-sm text-gray-900">{formData.startDate?.toDateString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">End Date</dt>
                      <dd className="text-sm text-gray-900">{formData.endDate?.toDateString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Duration</dt>
                      <dd className="text-sm text-gray-900">{formData.days} day{formData.days !== 1 ? 's' : ''}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Daily Rate</dt>
                      <dd className="text-sm text-gray-900">${vehicle.daily_rate}</dd>
                    </div>
                  </dl>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Cost Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Daily rate × {formData.days} days</span>
                      <span className="text-sm text-gray-900">${formData.totalCost}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-medium text-gray-900">Total</span>
                      <span className="font-bold text-primary-600">${formData.totalCost}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={paymentData.paymentMethod}
                    onChange={handlePaymentChange}
                    className="input-field"
                  >
                    <option value="card">Credit Card</option>
                    <option value="debit">Debit Card</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                
                {(paymentData.paymentMethod === 'card' || paymentData.paymentMethod === 'debit') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        name="holderName"
                        value={paymentData.holderName}
                        onChange={handlePaymentChange}
                        className="input-field"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentData.cardNumber}
                        onChange={handlePaymentChange}
                        className="input-field"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={paymentData.expiryDate}
                          onChange={handlePaymentChange}
                          className="input-field"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          value={paymentData.cvv}
                          onChange={handlePaymentChange}
                          className="input-field"
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Amount to Pay</span>
                    <span className="text-xl font-bold text-primary-600">${formData.totalCost}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reservation Confirmed!</h3>
              <p className="text-gray-600 mb-4">
                Your reservation has been successfully created.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-medium text-gray-900 mb-2">Reservation Details</h4>
                <p className="text-sm text-gray-600">Reservation ID: #{reservationId}</p>
                <p className="text-sm text-gray-600">Vehicle: {vehicle.make} {vehicle.model}</p>
                <p className="text-sm text-gray-600">Dates: {formData.startDate?.toDateString()} - {formData.endDate?.toDateString()}</p>
                <p className="text-sm text-gray-600">Total: ${formData.totalCost}</p>
              </div>
              <div className="space-x-3">
                <button
                  onClick={() => navigate('/reservations')}
                  className="btn-primary"
                >
                  View My Reservations
                </button>
                <button
                  onClick={() => navigate('/vehicles')}
                  className="btn-secondary"
                >
                  Browse More Vehicles
                </button>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 4 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <div>
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                )}
              </div>
              
              <div>
                {step < 3 && (
                  <button
                    onClick={handleNext}
                    className="btn-primary"
                  >
                    Next
                  </button>
                )}
                
                {step === 3 && (
                  <button
                    onClick={handleSubmitReservation}
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Confirm & Pay'
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReservationFlow;