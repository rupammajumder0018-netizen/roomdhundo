import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminUserTable from "../../components/admin/AdminUserTable.jsx";
import { fetchAdminProfiles, updateOwnerApprovalStatus } from "../../services/admin/adminService.js";

const EMPTY_TOTALS = { total: 0, renters: 0, owners: 0, agents: 0, admins: 0 };

export function AdminUsersPage() {
  const { onToggleMobileMenu } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRole = searchParams.get("role") || "all";

  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState(urlRole);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [filteredCount, setFilteredCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [loadError, setLoadError] = useState("");
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    const nextRole = searchParams.get("role") || "all";
    setRoleFilter(nextRole);
    setPage(1);
  }, [searchParams]);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const res = await fetchAdminProfiles({
        roleFilter,
        searchQuery,
        page,
        pageSize,
      });
      if (res.error) {
        setLoadError(res.error.message || "Could not load users.");
        setProfiles([]);
        setFilteredCount(0);
      } else if (res.data) {
        setProfiles(res.data);
        setFilteredCount(res.count);
        setTotalPages(res.totalPages);
        if (res.totals) {
          setTotals(res.totals);
        } else if (roleFilter === "all" && !searchQuery.trim()) {
          setTotals((current) => ({ ...current, total: res.count || 0 }));
        }
      }
    } catch (err) {
      setLoadError(err.message || "Could not load users.");
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchQuery, page, pageSize]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleRoleChange = (event) => {
    const val = event.target.value;
    setRoleFilter(val);
    setSearchParams(val === "all" ? {} : { role: val });
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
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

  const rangeStart = filteredCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filteredCount);

  const summaryCards = [
    { key: "total", label: "Total users", value: totals.total, hint: "Email and Google accounts" },
    { key: "renters", label: "Renters", value: totals.renters, hint: "Standard accounts" },
    { key: "owners", label: "Owners", value: totals.owners, hint: "Property owners" },
    { key: "agents", label: "Agents", value: totals.agents, hint: "Agents and pending agents" },
    { key: "admins", label: "Admins", value: totals.admins, hint: "Platform administrators" },
  ];

  return (
    <div className="admin-page-container profiles-directory">
      <AdminHeader
        title="Registered Profiles"
        subtitle="Every account stored in the database, whether they signed up with email or Google."
        onToggleMobileMenu={onToggleMobileMenu}
      />

      <section className="profiles-summary" aria-label="User totals">
        {summaryCards.map((card) => (
          <article key={card.key} className={`profiles-stat ${card.key === "total" ? "is-total" : ""}`}>
            <span>{card.label}</span>
            <strong>{isLoading && totals.total === 0 ? "—" : card.value.toLocaleString("en-IN")}</strong>
            <small>{card.hint}</small>
          </article>
        ))}
      </section>

      {actionMessage && (
        <div
          className={`admin-alert ${
            actionMessage.type === "success" ? "admin-alert-success" : "admin-alert-error"
          }`}
          role="alert"
        >
          {actionMessage.text}
          <button type="button" className="admin-alert-close" onClick={() => setActionMessage(null)}>
            ×
          </button>
        </div>
      )}

      {loadError && (
        <div className="admin-alert admin-alert-error" role="alert">
          {loadError}
        </div>
      )}

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
            <option value="all">All roles ({totals.total})</option>
            <option value="renter">Renters ({totals.renters})</option>
            <option value="owner">Property owners ({totals.owners})</option>
            <option value="agent">Agents ({totals.agents})</option>
            <option value="agent_pending">Pending agents</option>
            <option value="admin">Administrators ({totals.admins})</option>
          </select>
        </div>
      </div>

      <AdminUserTable
        profiles={profiles}
        isLoading={isLoading}
        onOwnerApproval={handleOwnerApproval}
      />

      <div className="profiles-pager">
        <span>
          {isLoading
            ? "Loading users..."
            : `Showing ${rangeStart}–${rangeEnd} of ${filteredCount.toLocaleString("en-IN")} matching accounts`}
          {!isLoading && roleFilter === "all" && !searchQuery.trim()
            ? ` · ${totals.total.toLocaleString("en-IN")} total in the database`
            : ""}
        </span>
        <div>
          <button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminUsersPage;
