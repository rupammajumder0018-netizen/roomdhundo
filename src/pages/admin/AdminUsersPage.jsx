import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminUserTable from "../../components/admin/AdminUserTable.jsx";
import { fetchAdminProfiles } from "../../services/admin/adminService.js";

export function AdminUsersPage() {
  const { onToggleMobileMenu } = useOutletContext();
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminProfiles({
        roleFilter,
        searchQuery,
      });
      if (res.data) setProfiles(res.data);
    } catch (err) {
      console.warn("[Roomdhundo] Error loading user profiles:", err);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchQuery]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  return (
    <div className="admin-page-container">
      <AdminHeader
        title="Registered Profiles"
        subtitle="View all accounts registered on Pg Dhundo (Renters, Owners, Agents, and Administrators)."
        onToggleMobileMenu={onToggleMobileMenu}
      />

      {/* Filter Row */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrap">
          <input
            type="text"
            className="admin-input"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-filters-wrap">
          <select
            className="admin-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
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

      <AdminUserTable profiles={profiles} isLoading={isLoading} />
    </div>
  );
}

export default AdminUsersPage;
