import React, { useState, useEffect, useCallback } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminPropertyTable from "../../components/admin/AdminPropertyTable.jsx";
import {
  fetchAdminProperties,
  updatePropertyVerificationStatus,
  deleteAdminProperty,
  toggleAdminPropertyOccupancy,
} from "../../services/admin/adminService.js";

export function AdminPropertiesPage() {
  const { onToggleMobileMenu } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlVerification = searchParams.get("verification") || "all";

  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationFilter, setVerificationFilter] = useState(urlVerification);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    const nextVerif = searchParams.get("verification") || "all";
    setVerificationFilter(nextVerif);
  }, [searchParams]);

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

  const handleToggleOccupancy = async (id, currentOccupied) => {
    const res = await toggleAdminPropertyOccupancy(id, currentOccupied);
    if (res.success) {
      setActionMessage({
        type: "success",
        text: `Property marked as ${res.isOccupied ? "Occupied (Unavailable on user side)" : "Available"}.`,
      });
      loadProperties();
    } else {
      setActionMessage({
        type: "error",
        text: res.error?.message || "Failed to update property occupancy status.",
      });
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
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setSearchParams(e.target.value === "all" ? {} : { verification: e.target.value });
            }}
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
            aria-label="Filter by property category or type"
          >
            <option value="all">All Categories & Types</option>
            <optgroup label="PG & Hostels">
              <option value="PG">PG</option>
              <option value="Only Boys PG">Only Boys PG</option>
              <option value="Only Girls PG">Only Girls PG</option>
              <option value="Boys Hostel">Boys Hostel</option>
              <option value="Girls Hostel">Girls Hostel</option>
              <option value="Co-living PG">Co-living PG</option>
              <option value="Student Mess">Student Mess</option>
            </optgroup>
            <optgroup label="Hotels & Stays">
              <option value="Hotel">Hotel</option>
              <option value="Resort">Resort</option>
              <option value="Guest House">Guest House</option>
              <option value="Lodge">Lodge</option>
              <option value="Homestay">Homestay</option>
            </optgroup>
            <optgroup label="Flats & Rentals">
              <option value="Flat">Flat</option>
              <option value="Apartment">Apartment</option>
              <option value="Independent Room">Independent Room</option>
              <option value="Independent House">Independent House</option>
              <option value="Studio Apartment">Studio Apartment</option>
            </optgroup>
            <optgroup label="Event Spaces">
              <option value="Banquet Hall">Banquet Hall</option>
              <option value="Party Hall">Party Hall</option>
              <option value="Wedding Venue">Wedding Venue</option>
              <option value="Conference Hall">Conference Hall</option>
              <option value="Meeting Hall">Meeting Hall</option>
            </optgroup>
          </select>

          <Link
            to="/admin/properties/new"
            className="action-btn approve-btn"
            style={{ textDecoration: "none", display: "inline-flex", gap: "6px", alignItems: "center", whiteSpace: "nowrap" }}
          >
            <span>+</span> Add New Property
          </Link>
        </div>
      </div>

      {/* Properties Table */}
      <AdminPropertyTable
        properties={properties}
        onApprove={handleApprove}
        onReject={handleReject}
        onDelete={handleDelete}
        onToggleOccupancy={handleToggleOccupancy}
        isLoading={isLoading}
      />
    </div>
  );
}

export default AdminPropertiesPage;
