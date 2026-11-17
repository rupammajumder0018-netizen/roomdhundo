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
  const { isAuthenticated, isLoading, role, roleKind, profile } = useAuth();
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

    // Owner approval guard: Owners must have owner_approval_status === 'approved' to access owner pages
    if (
      roleKind === "owner" &&
      allowedRoles.includes("owner") &&
      !allowedRoles.includes("renter")
    ) {
      const approval = String(profile?.owner_approval_status || "pending").toLowerCase();
      if (approval !== "approved") {
        return (
          <div
            className="owner-approval-pending-screen"
            style={{
              maxWidth: "600px",
              margin: "60px auto",
              padding: "32px 24px",
              textAlign: "center",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <h2 style={{ fontSize: "22px", marginBottom: "12px", color: "#1a1a1a" }}>
              Owner Account Awaiting Review
            </h2>
            <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.6, marginBottom: "20px" }}>
              Your account has registered as a property owner. To maintain listing quality and safety,
              a platform administrator will verify your profile before property listings and the owner
              dashboard can be accessed.
            </p>
            <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px" }}>
              Current Status:{" "}
              <strong style={{ color: approval === "rejected" ? "#c5221f" : "#b06000" }}>
                {approval === "rejected" ? "Application Rejected" : "Pending Approval"}
              </strong>
            </p>
            <a
              href="/"
              className="btn btn-primary"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Return to Homepage
            </a>
          </div>
        );
      }
    }
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;

