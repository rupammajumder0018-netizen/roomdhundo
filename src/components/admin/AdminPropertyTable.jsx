import React from "react";
import { Link } from "react-router-dom";
import {
  adminPropertyPrice,
  propertyDisplayStatus,
  isPropertyOccupied,
} from "../../services/admin/adminService.js";
import { adminPropertyEditPath } from "../../routes/paths.js";

export function AdminPropertyTable({
  properties = [],
  onApprove,
  onReject,
  onDelete,
  onToggleOccupancy,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="table-container">
        <p className="no-data-msg">Loading properties...</p>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="table-container">
        <p className="no-data-msg">No properties found matching current criteria.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Location</th>
            <th>Pricing</th>
            <th>Status</th>
            <th>Availability</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="propertyTableBody">
          {properties.map((property) => {
            const status = propertyDisplayStatus(property);
            const isOccupied = isPropertyOccupied(property);
            const statusClass =
              status === "Live"
                ? "status-live"
                : status === "Pending review"
                ? "status-pending"
                : status === "Rejected"
                ? "status-rejected"
                : "status-archived";

            const mainImage =
              Array.isArray(property.images) && property.images.length > 0
                ? property.images[0]
                : null;

            const isPending = status === "Pending review";

            return (
              <tr key={property.id} data-property-id={property.id}>
                <td data-label="Property">
                  <div className="table-prop-cell">
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={property.name}
                        className="table-thumb"
                        loading="lazy"
                      />
                    ) : (
                      <div className="table-thumb-placeholder">⌂</div>
                    )}
                    <div>
                      <strong>
                        <Link to={`/property/${property.id}`} target="_blank" rel="noreferrer">
                          {property.name}
                        </Link>
                      </strong>
                      <span className="table-subtext">ID: {property.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </td>
                <td data-label="Type">
                  <span className="badge-type">{property.type || "PG"}</span>
                </td>
                <td data-label="Location">{property.location || "—"}</td>
                <td data-label="Pricing">{adminPropertyPrice(property)}</td>
                <td data-label="Status">
                  <span className={`status-pill ${statusClass}`}>{status}</span>
                </td>
                <td data-label="Availability">
                  <button
                    type="button"
                    className={`toggle-occupancy-btn ${isOccupied ? "is-occupied" : "is-available"}`}
                    onClick={() => onToggleOccupancy && onToggleOccupancy(property.id, isOccupied)}
                    title={
                      isOccupied
                        ? "Currently Occupied / Unavailable — click to mark Available"
                        : "Currently Available — click to mark Occupied"
                    }
                  >
                    <span className="avail-dot" aria-hidden="true" />
                    <span>{isOccupied ? "Occupied" : "Available"}</span>
                  </button>
                </td>
                <td data-label="Actions">
                  <div className="table-actions">
                    <button
                      type="button"
                      className={`action-btn ${isOccupied ? "approve-btn" : "reject-btn"}`}
                      onClick={() => onToggleOccupancy && onToggleOccupancy(property.id, isOccupied)}
                      title={isOccupied ? "Toggle to Available" : "Toggle to Occupied"}
                    >
                      {isOccupied ? "Set Available" : "Set Occupied"}
                    </button>
                    {isPending && (
                      <>
                        <button
                          type="button"
                          className="action-btn approve-btn"
                          onClick={() => onApprove(property.id)}
                          title="Approve Listing"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="action-btn reject-btn"
                          onClick={() => onReject(property.id)}
                          title="Reject Listing"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {status === "Rejected" && (
                      <button
                        type="button"
                        className="action-btn approve-btn"
                        onClick={() => onApprove(property.id)}
                        title="Re-approve Listing"
                      >
                        Approve
                      </button>
                    )}
                    {status === "Live" && (
                      <button
                        type="button"
                        className="action-btn reject-btn"
                        onClick={() => onReject(property.id)}
                        title="Reject Listing"
                      >
                        Reject
                      </button>
                    )}
                    <Link
                      to={adminPropertyEditPath(property.id)}
                      className="action-btn edit-btn"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/property/${property.id}`}
                      className="action-btn view-btn"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      className="action-btn delete-btn"
                      onClick={() => onDelete(property.id, property.name)}
                      title="Delete Property"
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

export default AdminPropertyTable;
