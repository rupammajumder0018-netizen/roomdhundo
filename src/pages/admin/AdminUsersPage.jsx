import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminUserTable from "../../components/admin/AdminUserTable.jsx";
import { fetchAdminProfiles, updateOwnerApprovalStatus } from "../../services/admin/adminService.js";

export function AdminUsersPage() {
  const { onToggleMobileMenu } = useOutletContext();
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionMessage, setActionMessage] = useState(null);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminProfiles({
        roleFilter,
        searchQuery,
        page,
        pageSize,
      });
      if (res.data) {
        setProfiles(res.data);
        setTotalCount(res.count);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.warn("[Roomdhundo] Error loading user profiles:", err);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchQuery, page, pageSize]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleOwnerApproval = async (userId, status) => {
    try {
      const { success, error } = await updateOwnerApprovalStatus(userId, status);
      if (success) {
        setActionMessage({ type: "success", text: `Owner account has been ${status}.` });
        loadProfiles();
      } else {
        setActionMessage({ type: "error", text: error?.message || "Failed to update owner status." });
      }
    } catch (err) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="admin-page-container">
      <AdminHeader
        title="Registered Profiles"
        subtitle={`Directory of all registered accounts (${totalCount} total: Renters, Owners, Agents, and Administrators).`}
        onToggleMobileMenu={onToggleMobileMenu}
      />

      {actionMessage && (
        <div
          className={`admin-feedback-banner ${
            actionMessage.type === "success" ? "admin-feedback-success" : "admin-feedback-error"
          }`}
          style={{
            padding: "10px 16px",
            marginBottom: "16px",
            borderRadius: "6px",
            backgroundColor: actionMessage.type === "success" ? "#e6f4ea" : "#fce8e6",
            color: actionMessage.type === "success" ? "#137333" : "#c5221f",
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Filter Row */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrap">
          <input
            type="text"
            className="admin-input"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div className="admin-filters-wrap">
          <select
            className="admin-select"
            value={roleFilter}
            onChange={handleRoleChange}
            aria-label="Filter by account role"
          >
            <option value="all">All Roles</option>
            <option value="renter">Renters (Users)</option>
            <option value="owner">Property Owners</option>
            <option value="agent">Agents</option>
            <option value="agent_pending">Pending Agents</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      <AdminUserTable
        profiles={profiles}
        isLoading={isLoading}
        onOwnerApproval={handleOwnerApproval}
      />

      {/* Server-Side Pagination Controls */}
      {totalPages > 1 && (
        <div
          className="admin-pagination"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
            padding: "12px 16px",
            background: "#fff",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
          }}
        >
          <span style={{ fontSize: "14px", color: "#666" }}>
            Page {page} of {totalPages} ({totalCount} total accounts)
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="admin-btn-secondary"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "6px 14px",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                opacity: page <= 1 ? 0.6 : 1,
              }}
            >
              Previous
            </button>
            <button
              className="admin-btn-secondary"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: "6px 14px",
                cursor: page >= totalPages ? "not-allowed" : "pointer",
                opacity: page >= totalPages ? 0.6 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
