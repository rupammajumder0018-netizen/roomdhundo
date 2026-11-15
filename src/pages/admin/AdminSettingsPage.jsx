import React from "react";
import { useOutletContext } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import { useAuth } from "../../hooks/useAuth.js";

export function AdminSettingsPage() {
  const { onToggleMobileMenu } = useOutletContext();
  const { user, profile, role, roleKind } = useAuth();

  return (
    <div className="admin-page-container">
      <AdminHeader
        title="Settings"
        subtitle="Manage your Pg Dhundo administrator information and security configuration."
        onToggleMobileMenu={onToggleMobileMenu}
      />

      <div className="admin-settings-card">
        <h3>Administrator Profile</h3>
        <p className="admin-settings-desc">
          Your account is authorized as an administrator based on your verified public profile record.
        </p>

        <div className="admin-settings-grid">
          <div className="settings-field">
            <span className="settings-label">Full Name</span>
            <strong>{profile?.full_name || user?.user_metadata?.full_name || "Administrator"}</strong>
          </div>

          <div className="settings-field">
            <span className="settings-label">Email Address</span>
            <strong>{user?.email || "—"}</strong>
          </div>

          <div className="settings-field">
            <span className="settings-label">Authoritative Role</span>
            <span className="role-badge role-badge-admin">{role || roleKind || "admin"}</span>
          </div>

          <div className="settings-field">
            <span className="settings-label">Account ID</span>
            <span className="table-mono">{user?.id || "—"}</span>
          </div>
        </div>
      </div>

      <div className="admin-settings-card" style={{ marginTop: "24px" }}>
        <h3>Platform & Security Status</h3>
        <ul className="settings-list">
          <li>
            <strong>Authentication Provider:</strong> Supabase Auth (PKCE)
          </li>
          <li>
            <strong>Authorization Model:</strong> Database Row-Level Security (RLS) + ProtectedRoute checks
          </li>
          <li>
            <strong>Agent Workflow:</strong> Applications managed via <code>agent_applications</code> table
          </li>
          <li>
            <strong>Moderation Status:</strong> Dual-status model (<code>listing_status</code> and <code>verification_status</code>)
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AdminSettingsPage;
