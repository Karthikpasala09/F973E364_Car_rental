import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import HomePage from './components/HomePage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import VehicleList from './components/vehicles/VehicleList';
import VehicleDetail from './components/vehicles/VehicleDetail';
import ReservationFlow from './components/reservations/ReservationFlow';
import MyReservations from './components/reservations/MyReservations';
import VehicleManagement from './components/admin/VehicleManagement';
import BranchManagement from './components/admin/BranchManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/vehicles" 
                element={
                  <ProtectedRoute>
                    <VehicleList />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/vehicles/:id" 
                element={
                  <ProtectedRoute>
                    <VehicleDetail />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/reserve/:vehicleId" 
                element={
                  <ProtectedRoute>
                    <ReservationFlow />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/reservations" 
                element={
                  <ProtectedRoute>
                    <MyReservations />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin/vehicles" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <VehicleManagement />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/branches" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <BranchManagement />
                  </ProtectedRoute>
                } 
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;