import React from "react";
import { Phone, Mail, MapPin, Check, X, Trash2, CheckCircle2, Clock, XCircle } from "lucide-react";

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

            const StatusIcon =
              status === "approved"
                ? CheckCircle2
                : status === "rejected"
                ? XCircle
                : Clock;

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
                  <div className="table-icon-text">
                    <Phone size={13} className="cell-icon" />
                    <span>{app.phone || "—"}</span>
                  </div>
                  <div className="table-subtext table-icon-text">
                    <Mail size={12} className="cell-icon" />
                    <span>{app.email || "—"}</span>
                  </div>
                </td>
                <td data-label="Location & Pin">
                  <div className="table-icon-text">
                    <MapPin size={13} className="cell-icon" />
                    <span>{app.location || "—"}</span>
                  </div>
                  <div className="table-subtext">PIN: {app.pincode || "—"}</div>
                </td>
                <td data-label="Status">
                  <span className={`status-pill ${statusClass}`}>
                    <StatusIcon size={12} className="status-pill-icon" />
                    <span>{status}</span>
                  </span>
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
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          className="action-btn reject-btn"
                          onClick={() => onReject(app.id, app.user_id)}
                          title="Reject Agent"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="action-btn delete-btn"
                      onClick={() => onDelete(app.id, app.user_id, fullName)}
                      title="Delete Application"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
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
