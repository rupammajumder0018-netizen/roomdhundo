import React from "react";
import { getAdminRoleLabel, normalizeAdminRole } from "../../services/admin/adminService.js";

export function AdminUserTable({ profiles = [], isLoading = false, onOwnerApproval }) {
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
            <th>Status / Approval</th>
            <th>User ID</th>
            <th>Registered Date</th>
            {onOwnerApproval && <th>Actions</th>}
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

            const ownerApproval = p.owner_approval_status
              ? String(p.owner_approval_status).toLowerCase()
              : roleKind === "owner"
              ? "pending"
              : null;

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
                <td data-label="Status / Approval">
                  {roleKind === "owner" ? (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor:
                          ownerApproval === "approved"
                            ? "#e6f4ea"
                            : ownerApproval === "rejected"
                            ? "#fce8e6"
                            : "#fef7e0",
                        color:
                          ownerApproval === "approved"
                            ? "#137333"
                            : ownerApproval === "rejected"
                            ? "#c5221f"
                            : "#b06000",
                      }}
                    >
                      {ownerApproval === "approved"
                        ? "Approved"
                        : ownerApproval === "rejected"
                        ? "Rejected"
                        : "Pending Approval"}
                    </span>
                  ) : (
                    <span style={{ color: "#888", fontSize: "13px" }}>Active</span>
                  )}
                </td>
                <td data-label="User ID" className="table-mono">
                  {p.id.slice(0, 12)}...
                </td>
                <td data-label="Registered Date">{dateStr}</td>
                {onOwnerApproval && (
                  <td data-label="Actions">
                    {roleKind === "owner" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        {ownerApproval !== "approved" && (
                          <button
                            type="button"
                            onClick={() => onOwnerApproval(p.id, "approved")}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11px",
                              borderRadius: "4px",
                              backgroundColor: "#137333",
                              color: "#fff",
                              border: "none",
                              cursor: "pointer",
                            }}
                            title="Approve owner privileges"
                          >
                            Approve
                          </button>
                        )}
                        {ownerApproval !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => onOwnerApproval(p.id, "rejected")}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11px",
                              borderRadius: "4px",
                              backgroundColor: "#c5221f",
                              color: "#fff",
                              border: "none",
                              cursor: "pointer",
                            }}
                            title="Reject owner privileges"
                          >
                            Reject
                          </button>
                        )}
                      </div>
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
