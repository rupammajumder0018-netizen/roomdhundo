import React from "react";
import { getAdminRoleLabel, normalizeAdminRole } from "../../services/admin/adminService.js";

function displayName(profile) {
  const name = String(profile.full_name || profile.name || "").trim();
  if (name) return name;
  const email = String(profile.email || "").trim();
  if (email.includes("@")) return email.split("@")[0];
  return "Unnamed user";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminUserTable({ profiles = [], isLoading = false, onOwnerApproval }) {
  if (isLoading) {
    return (
      <div className="table-container profiles-table-wrap">
        <p className="no-data-msg">Loading every registered user...</p>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="table-container profiles-table-wrap">
        <p className="no-data-msg">No registered users match this search.</p>
      </div>
    );
  }

  return (
    <div className="table-container profiles-table-wrap">
      <table className="admin-table profiles-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Contact</th>
            <th>Role</th>
            <th>Status</th>
            <th>Registered</th>
            {onOwnerApproval && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => {
            const roleKind = normalizeAdminRole(profile.role);
            const roleLabel = getAdminRoleLabel(profile.role);
            const name = displayName(profile);
            const initial = name.charAt(0).toUpperCase() || "U";
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

            const accountStatus = String(profile.status || "active").toLowerCase();
            const ownerApproval = profile.owner_approval_status
              ? String(profile.owner_approval_status).toLowerCase()
              : roleKind === "owner"
              ? "pending"
              : null;
            const statusLabel =
              roleKind === "owner"
                ? ownerApproval === "approved"
                  ? "Owner approved"
                  : ownerApproval === "rejected"
                  ? "Owner rejected"
                  : "Owner pending"
                : accountStatus === "suspended"
                ? "Suspended"
                : accountStatus === "blocked"
                ? "Blocked"
                : "Active";
            const statusClass =
              statusLabel.includes("rejected") || statusLabel === "Blocked"
                ? "is-bad"
                : statusLabel.includes("pending") || statusLabel === "Suspended"
                ? "is-wait"
                : "is-good";

            return (
              <tr key={profile.id}>
                <td data-label="User">
                  <div className="table-user-cell">
                    <div className={`table-avatar profiles-avatar ${roleBadgeClass}`}>{initial}</div>
                    <div>
                      <strong>{name}</strong>
                      <span className="table-subtext">{profile.email || "No email on file"}</span>
                    </div>
                  </div>
                </td>
                <td data-label="Contact">{profile.phone || "—"}</td>
                <td data-label="Role">
                  <span className={`role-badge ${roleBadgeClass}`}>{roleLabel}</span>
                </td>
                <td data-label="Status">
                  <span className={`profiles-status ${statusClass}`}>{statusLabel}</span>
                </td>
                <td data-label="Registered">{formatDate(profile.created_at)}</td>
                {onOwnerApproval && (
                  <td data-label="Actions">
                    {roleKind === "owner" ? (
                      <div className="table-actions">
                        {ownerApproval !== "approved" && (
                          <button
                            type="button"
                            className="action-btn approve-btn"
                            onClick={() => onOwnerApproval(profile.id, "approved")}
                          >
                            Approve
                          </button>
                        )}
                        {ownerApproval !== "rejected" && (
                          <button
                            type="button"
                            className="action-btn reject-btn"
                            onClick={() => onOwnerApproval(profile.id, "rejected")}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="profiles-no-action">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUserTable;
