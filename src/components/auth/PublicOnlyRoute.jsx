import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

/**
 * Route protection wrapper for guest-only pages (e.g. Login, Signup, Forgot Password).
 * Redirects already authenticated users away to their dashboard or previous location.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.defaultRedirect='/'] Fallback destination if no history exists
 */
export function PublicOnlyRoute({ children, defaultRedirect = "/" }) {
  const { isAuthenticated, isLoading, role, roleKind } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading-screen" role="status" aria-live="polite">
        <div className="auth-spinner" aria-hidden="true" />
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    // If the user was trying to access a protected page before being sent to login
    const destination = location.state?.from?.pathname || defaultRedirect;
    return <Navigate to={destination} replace />;
  }

  return children ? children : <Outlet />;
}

export default PublicOnlyRoute;

