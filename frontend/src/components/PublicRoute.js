import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PublicRoute = () => {
  const { user } = useContext(AuthContext);

  if (user) {
    // Logged in, redirect to home page
    return <Navigate to="/" />;
  }

  // Not logged in, allow access to public routes
  return <Outlet />;
};

export default PublicRoute;
