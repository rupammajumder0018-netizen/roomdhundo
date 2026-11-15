import React from "react";
import { getAdminRoleLabel, normalizeAdminRole } from "../../services/admin/adminService.js";

export function AdminUserTable({ profiles = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="table-container">
        <p className="no-data-msg">Loading profiles...</p>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="table-container">
        <p className="no-data-msg">No registered profiles match the search criteria.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Contact</th>
            <th>Role</th>
            <th>User ID</th>
            <th>Registered Date</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => {
            const roleKind = normalizeAdminRole(p.role);
            const roleLabel = getAdminRoleLabel(p.role);
            const initial = String(p.full_name || p.email || "U")
              .trim()
              .charAt(0)
              .toUpperCase();

            const roleBadgeClass =
              roleKind === "admin"
                ? "role-badge-admin"
                : roleKind === "owner"
                ? "role-badge-owner"
                : roleKind === "agent"
                ? "role-badge-agent"
                : roleKind === "agent_pending"
                ? "role-badge-pending"
                : "role-badge-user";

            const dateStr = p.created_at
              ? new Date(p.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—";

            return (
              <tr key={p.id}>
                <td data-label="User">
                  <div className="table-user-cell">
                    <div className="table-avatar">{initial}</div>
                    <div>
                      <strong>{p.full_name || "Anonymous User"}</strong>
                      <span className="table-subtext">{p.email || "No email"}</span>
                    </div>
                  </div>
                </td>
                <td data-label="Contact">{p.phone || "—"}</td>
                <td data-label="Role">
                  <span className={`role-badge ${roleBadgeClass}`}>{roleLabel}</span>
                </td>
                <td data-label="User ID" className="table-mono">
                  {p.id.slice(0, 12)}...
                </td>
                <td data-label="Registered Date">{dateStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUserTable;
