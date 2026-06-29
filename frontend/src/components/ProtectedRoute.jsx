import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protected Route Guard for authenticated pages
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0b0e17',
        color: '#f3f4f6',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTopColor: '#5d6eff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <p>Verifying Secure Session...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Hierarchical checks for roles
  const ROLE_LEVELS = {
    CASHIER: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  };

  if (allowedRoles) {
    const userLevel = ROLE_LEVELS[user.role] || 0;
    // Find the minimum required level among the allowed roles
    const minRequiredLevel = Math.min(...allowedRoles.map(role => ROLE_LEVELS[role] || 0));

    if (userLevel < minRequiredLevel) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

// Public Route Guard (prevents logged-in users from seeing /login)
export const PublicRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return null; // Don't flash login or loader
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
