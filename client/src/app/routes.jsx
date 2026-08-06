import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/Login';
import SignUpPage from '../pages/SignUp';
import ForgotPasswordPage from '../pages/ForgotPassword';
import ResetPasswordPage from '../pages/ResetPassword';
import { ProtectedRoute } from '../components/ProtectedRoute';
import AdminDashboard from '../features/dashboard/pages/AdminDashboard';
import CustomerDashboard from '../features/dashboard/pages/CustomerDashboard';
import DriverDashboard from '../features/dashboard/pages/DriverDashboard';
import CollectionScheduleManagement from '../features/collection-schedules/pages/CollectionScheduleManagement';
import DriverManagement from '../features/drivers/pages/DriverManagement';
import AdminRewardManagement from '../features/rewards/pages/AdminRewardManagement';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin/schedules"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <CollectionScheduleManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin/drivers"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <DriverManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin/rewards"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminRewardManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/customer"
        element={
          <ProtectedRoute requiredRole="CUSTOMER">
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/driver"
        element={
          <ProtectedRoute requiredRole="DRIVER">
            <DriverDashboard />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
