import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

/**
 * Route protection wrapper requiring authentication and optional role authorization.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children]
 * @param {Array<string>} [props.allowedRoles] Roles permitted to access the route
 * @param {string} [props.redirectTo='/login'] Destination when unauthenticated
 * @param {string} [props.unauthorizedRedirect='/'] Destination when role is unauthorized
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
  unauthorizedRedirect = "/",
}) {
  const { isAuthenticated, isLoading, role, roleKind } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading-screen" role="status" aria-live="polite">
        <div className="auth-spinner" aria-hidden="true" />
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const isAuthorized =
      allowedRoles.includes(role) || allowedRoles.includes(roleKind);

    if (!isAuthorized) {
      return (
        <Navigate
          to={unauthorizedRedirect}
          state={{
            unauthorizedError: `You do not have permission to access this page. Required role: ${allowedRoles.join(
              " or "
            )}.`,
          }}
          replace
        />
      );
    }
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;

