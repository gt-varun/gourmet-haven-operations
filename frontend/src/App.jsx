import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Admin from './pages/Admin';
import AuditLog from './pages/AuditLog';
import Ingredients from './pages/Ingredients';

// Helper component to redirect authenticated users to their landing page
const HomeRedirect = () => {
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Secure Layout Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Landing page router */}
            <Route index element={<HomeRedirect />} />

            {/* Dashboard: All authenticated users */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* POS Billing: All authenticated users */}
            <Route
              path="pos"
              element={
                <ProtectedRoute>
                  <POS />
                </ProtectedRoute>
              }
            />

            {/* Inventory: ADMIN or SUPER_ADMIN */}
            <Route
              path="inventory"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            {/* Ingredients: ADMIN, SUPER_ADMIN, or CASHIER with toggle access */}
            <Route
              path="ingredients"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']} allowIngredientsAccess={true}>
                  <Ingredients />
                </ProtectedRoute>
              }
            />

            {/* Staff Management: ADMIN or SUPER_ADMIN */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Audit Logs: SUPER_ADMIN only */}
            <Route
              path="audit-log"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AuditLog />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Page not found redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
