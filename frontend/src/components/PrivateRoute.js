import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ requiredRole }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Logged in, but wrong role, redirect to home page
    return <Navigate to="/" />;
  }

  // Logged in and has the correct role (or no role required)
  return <Outlet />;
};

export default PrivateRoute;
