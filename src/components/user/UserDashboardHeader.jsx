import React from "react";

/**
 * Header section for the User Dashboard.
 * Displays user greeting, role indication, and account status dot.
 *
 * @param {Object} props
 * @param {string} props.displayName User full name or display handle
 * @param {string} [props.roleLabel="Renter"] Account role label
 */
export function UserDashboardHeader({ displayName = "User", roleLabel = "Renter" }) {
  return (
    <div className="renter-dashboard-header">
      <div>
        <span className="dashboard-label">MY ACCOUNT</span>
        <h1>Welcome, {displayName}</h1>
        <p>Manage your saved properties, enquiries and Pg Dhundo account.</p>
      </div>

      <div className="account-status">
        <span className="status-dot" aria-hidden="true"></span>
        <span>Account Active</span>
      </div>
    </div>
  );
}

export default UserDashboardHeader;
