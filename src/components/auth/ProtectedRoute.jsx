import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { Clock } from "lucide-react";
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
    // A pending agent must not access agent/owner features until approved by admin
    if (role === "agent_pending" && !allowedRoles.includes("agent_pending")) {
      return <Navigate to="/be-an-agent" replace />;
    }

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
              padding: "36px 28px",
              textAlign: "center",
              background: "var(--rd-surface, #ffffff)",
              border: "1px solid var(--rd-border, #c6ead9)",
              borderRadius: "18px",
              boxShadow: "var(--rd-shadow, 0 14px 34px rgba(34,87,122,0.08))",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(245, 158, 11, 0.15)",
                color: "#d97706",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <Clock size={32} />
            </div>
            <h2 style={{ fontSize: "22px", marginBottom: "12px", color: "var(--rd-text, #22577A)", fontWeight: 800 }}>
              Owner Account Awaiting Review
            </h2>
            <p style={{ fontSize: "15px", color: "var(--rd-muted, #3a6f86)", lineHeight: 1.6, marginBottom: "20px" }}>
              Your account has registered as a property owner. To maintain listing quality and safety,
              a platform administrator will verify your profile before property listings and the owner
              dashboard can be accessed.
            </p>
            <p style={{ fontSize: "14px", color: "var(--rd-muted, #3a6f86)", marginBottom: "24px" }}>
              Current Status:{" "}
              <strong style={{ color: approval === "rejected" ? "#ef4444" : "#d97706" }}>
                {approval === "rejected" ? "Application Rejected" : "Pending Approval"}
              </strong>
            </p>
            <a
              href="/"
              className="btn btn-primary"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: 700,
                background: "var(--rd-accent, #38A3A5)",
                color: "#ffffff",
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

