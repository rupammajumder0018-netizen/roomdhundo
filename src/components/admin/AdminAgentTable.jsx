import React from "react";

export function AdminAgentTable({
  applications = [],
  onApprove,
  onReject,
  onDelete,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="table-container">
        <p className="no-data-msg">Loading agent applications...</p>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="table-container">
        <p className="no-data-msg">No agent applications found.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Contact Details</th>
            <th>Location & Pin</th>
            <th>Status</th>
            <th>Applied At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="adminAgentsBody">
          {applications.map((app) => {
            const status = String(app.status || "pending").toLowerCase();
            const isPending = status === "pending";
            const fullName = `${app.first_name || ""} ${app.last_name || ""}`.trim() || "Agent Applicant";

            const statusClass =
              status === "approved"
                ? "status-approved"
                : status === "rejected"
                ? "status-rejected"
                : "status-pending";

            const dateStr = app.created_at
              ? new Date(app.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—";

            return (
              <tr key={app.id}>
                <td data-label="Applicant">
                  <strong>{fullName}</strong>
                  <span className="table-subtext">UID: {app.user_id ? `${app.user_id.slice(0, 8)}...` : "—"}</span>
                </td>
                <td data-label="Contact Details">
                  <div>📞 {app.phone || "—"}</div>
                  <div className="table-subtext">✉️ {app.email || "—"}</div>
                </td>
                <td data-label="Location & Pin">
                  <div>{app.location || "—"}</div>
                  <div className="table-subtext">PIN: {app.pincode || "—"}</div>
                </td>
                <td data-label="Status">
                  <span className={`status-pill ${statusClass}`}>{status}</span>
                </td>
                <td data-label="Applied At">{dateStr}</td>
                <td data-label="Actions">
                  <div className="table-actions">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          className="action-btn approve-btn"
                          onClick={() => onApprove(app.id, app.user_id)}
                          title="Approve Agent"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="action-btn reject-btn"
                          onClick={() => onReject(app.id, app.user_id)}
                          title="Reject Agent"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="action-btn delete-btn"
                      onClick={() => onDelete(app.id, app.user_id, fullName)}
                      title="Delete Agent Application"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminAgentTable;
