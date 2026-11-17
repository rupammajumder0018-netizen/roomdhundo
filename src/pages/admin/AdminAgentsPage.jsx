import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminAgentTable from "../../components/admin/AdminAgentTable.jsx";
import {
  fetchAdminAgentApplications,
  updateAgentApplicationStatus,
  deleteAgentApplication,
} from "../../services/admin/adminService.js";

export function AdminAgentsPage() {
  const { onToggleMobileMenu } = useOutletContext();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminAgentApplications();
      if (res.data) setApplications(res.data);
    } catch (err) {
      console.warn("[Roomdhundo] Error loading agent applications:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApprove = async (appId, userId) => {
    const res = await updateAgentApplicationStatus(appId, userId, "approved");
    if (res.success) {
      setActionMessage({ type: "success", text: "Agent application approved. User has been granted the Agent role." });
      loadApplications();
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Failed to approve agent." });
    }
  };

  const handleReject = async (appId, userId) => {
    const res = await updateAgentApplicationStatus(appId, userId, "rejected");
    if (res.success) {
      setActionMessage({ type: "success", text: "Agent application rejected." });
      loadApplications();
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Failed to reject agent." });
    }
  };

  const handleDelete = async (appId, userId, name) => {
    if (!window.confirm(`Delete ${name || "this agent"}? Their application will be removed and their role will revert to renter.`)) return;
    const res = await deleteAgentApplication(appId, userId);
    if (res.success) {
      setActionMessage({ type: "success", text: "Agent application deleted." });
      loadApplications();
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Failed to delete agent." });
    }
  };

  const pendingCount = applications.filter((a) => String(a.status || "").toLowerCase() === "pending").length;
  const approvedCount = applications.filter((a) => String(a.status || "").toLowerCase() === "approved").length;
  const rejectedCount = applications.filter((a) => String(a.status || "").toLowerCase() === "rejected").length;

  return (
    <div className="admin-page-container">
      <AdminHeader
        title="Agent Applications"
        subtitle="Review, approve, reject, or manage agent partnership requests on Pg Dhundo."
        onToggleMobileMenu={onToggleMobileMenu}
      />

      {actionMessage && (
        <div
          className={`admin-alert ${
            actionMessage.type === "success" ? "admin-alert-success" : "admin-alert-error"
          }`}
          role="alert"
        >
          {actionMessage.text}
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setActionMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Status Counters */}
      <div className="agent-counts-row">
        <div className="agent-count-badge badge-pending">
          Pending: <strong id="adminAgentsPendingCount">{pendingCount}</strong>
        </div>
        <div className="agent-count-badge badge-approved">
          Approved: <strong id="adminAgentsApprovedCount">{approvedCount}</strong>
        </div>
        <div className="agent-count-badge badge-rejected">
          Rejected: <strong id="adminAgentsRejectedCount">{rejectedCount}</strong>
        </div>
      </div>

      <AdminAgentTable
        applications={applications}
        onApprove={handleApprove}
        onReject={handleReject}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}

export default AdminAgentsPage;
