import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminEnquiryTable from "../../components/admin/AdminEnquiryTable.jsx";
import {
  fetchAdminEnquiries,
  updateAdminEnquiryStatus,
} from "../../services/admin/adminService.js";

export function AdminEnquiriesPage() {
  const { onToggleMobileMenu } = useOutletContext();
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionMessage, setActionMessage] = useState(null);

  const loadEnquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminEnquiries({ statusFilter });
      if (res.data) setEnquiries(res.data);
    } catch (err) {
      console.warn("[Roomdhundo] Error loading enquiries:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const handleStatusChange = async (enquiryId, newStatus) => {
    const res = await updateAdminEnquiryStatus(enquiryId, newStatus);
    if (res.success) {
      setActionMessage({ type: "success", text: `Enquiry status updated to ${newStatus}.` });
      loadEnquiries();
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Failed to update enquiry status." });
    }
  };

  return (
    <div className="admin-page-container">
      <AdminHeader
        title="Enquiries"
        subtitle="Manage and track tenant property enquiries submitted across all listings."
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

      {/* Filter Row */}
      <div className="admin-filter-bar">
        <div className="admin-filters-wrap">
          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by enquiry status"
          >
            <option value="all">All Enquiry Statuses</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <AdminEnquiryTable
        enquiries={enquiries}
        onStatusChange={handleStatusChange}
        isLoading={isLoading}
      />
    </div>
  );
}

export default AdminEnquiriesPage;
