import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

/**
 * Route guard that requires the user to have one of the specified roles.
 * @param {Array<number>} allowedRoles - Array of role IDs allowed to access the route.
 */
export default function RoleGuard({ children, allowedRoles }) {
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role;

  if (userRole === undefined || !allowedRoles.includes(userRole)) {
    // If not authorized, redirect to dashboard or safe area
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
