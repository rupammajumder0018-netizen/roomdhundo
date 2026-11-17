import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminPropertyTable from "../../components/admin/AdminPropertyTable.jsx";
import {
  fetchAdminProperties,
  updatePropertyVerificationStatus,
  deleteAdminProperty,
} from "../../services/admin/adminService.js";

export function AdminPropertiesPage() {
  const { onToggleMobileMenu } = useOutletContext();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMessage, setActionMessage] = useState(null);

  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminProperties({
        verificationFilter,
        typeFilter,
        searchQuery,
      });
      if (res.data) setProperties(res.data);
    } catch (err) {
      console.warn("[Roomdhundo] Error loading admin properties:", err);
    } finally {
      setIsLoading(false);
    }
  }, [verificationFilter, typeFilter, searchQuery]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleApprove = async (id) => {
    const res = await updatePropertyVerificationStatus(id, "approved");
    if (res.success) {
      setActionMessage({ type: "success", text: "Property approved successfully." });
      loadProperties();
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Failed to approve property." });
    }
  };

  const handleReject = async (id) => {
    const res = await updatePropertyVerificationStatus(id, "rejected");
    if (res.success) {
      setActionMessage({ type: "success", text: "Property listing rejected." });
      loadProperties();
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Failed to reject property." });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name || "this property"}"? This cannot be undone.`)) return;
    const res = await deleteAdminProperty(id);
    if (res.success) {
      setActionMessage({ type: "success", text: "Property deleted permanently." });
      loadProperties();
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Failed to delete property." });
    }
  };

  return (
    <div className="admin-page-container">
      <AdminHeader
        title="Properties"
        subtitle="Review, moderate, approve, or reject accommodation listings on Pg Dhundo."
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
        <div className="admin-search-wrap">
          <input
            type="text"
            className="admin-input"
            placeholder="Search property name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-filters-wrap">
          <select
            className="admin-select"
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            aria-label="Filter by verification status"
          >
            <option value="all">All Verification Statuses</option>
            <option value="live">Live / Approved</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="admin-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by property type"
          >
            <option value="all">All Property Types</option>
            <option value="PG">PG</option>
            <option value="Room">Room</option>
            <option value="Hotel">Hotel</option>
            <option value="Flat">Flat</option>
            <option value="Guest House">Guest House</option>
          </select>
        </div>
      </div>

      {/* Properties Table */}
      <AdminPropertyTable
        properties={properties}
        onApprove={handleApprove}
        onReject={handleReject}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}

export default AdminPropertiesPage;
