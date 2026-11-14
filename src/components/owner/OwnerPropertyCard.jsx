import React from "react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../../routes/paths";

export default function OwnerPropertyCard({
  property,
  onToggleStatus,
  onDelete,
}) {
  const {
    id,
    name,
    type,
    location,
    images = [],
    room_types = [],
    verification_status,
  } = property;

  const firstImage = Array.isArray(images) && images.length > 0 ? images[0] : null;

  // Compute availability summary
  const totalRooms = room_types.reduce(
    (acc, r) => acc + (Number(r.total_rooms) || Number(r.available_rooms) || 1),
    0
  );
  const availableRooms = room_types.reduce(
    (acc, r) => acc + (Number(r.available_rooms) > 0 ? Number(r.available_rooms) : 0),
    0
  );

  const isAvailable = availableRooms > 0;

  // Minimum rent
  const minPrice = room_types.reduce((min, r) => {
    const rent = Number(r.price_monthly) || Number(r.price_per_night) || 0;
    if (rent > 0 && (min === 0 || rent < min)) return rent;
    return min;
  }, 0);

  // Status badge logic
  let badgeClass = isAvailable ? "available" : "occupied";
  let badgeText = isAvailable ? "🟢 Available" : "🔴 Occupied";

  if (verification_status === "pending") {
    badgeClass = "pending";
    badgeText = "⏳ Pending Review";
  } else if (verification_status === "rejected") {
    badgeClass = "rejected";
    badgeText = "❌ Rejected";
  }

  // Determine wizard edit route based on property type
  const normalizedType = String(type || "").toLowerCase().trim();
  let editPath = `${ROUTE_PATHS.LIST_PG}?edit=${id}`;
  if (normalizedType === "flat") {
    editPath = `${ROUTE_PATHS.LIST_FLAT}?edit=${id}`;
  } else if (normalizedType === "hotel") {
    editPath = `${ROUTE_PATHS.LIST_HOTEL}?edit=${id}`;
  }

  return (
    <div className="owner-property-card">
      <div className="owner-prop-image-wrap">
        {firstImage ? (
          <img src={firstImage} alt={name || "Property"} loading="lazy" />
        ) : (
          <div className="owner-prop-no-img">🏠</div>
        )}
        <span className={`owner-prop-badge ${badgeClass}`}>{badgeText}</span>
      </div>

      <div className="owner-prop-body">
        <div className="owner-prop-title-row">
          <h3>{name || "Untitled Property"}</h3>
          <span className="owner-prop-type-tag">{type || "PG"}</span>
        </div>

        <p className="owner-prop-location">
          <span>📍</span> {location || "Location not specified"}
        </p>

        <div className="owner-prop-metrics">
          <div className="owner-prop-metric">
            <span>Room Types</span>
            <strong>{room_types.length}</strong>
          </div>
          <div className="owner-prop-metric">
            <span>Avail. Rooms</span>
            <strong>
              {availableRooms} / {totalRooms}
            </strong>
          </div>
          <div className="owner-prop-metric">
            <span>Starting</span>
            <strong>{minPrice > 0 ? `₹${minPrice.toLocaleString()}` : "—"}</strong>
          </div>
        </div>

        <div className="owner-prop-quick-toggle">
          <button
            type="button"
            className={`owner-toggle-btn avail ${isAvailable ? "active" : ""}`}
            onClick={() => onToggleStatus(id, "available")}
          >
            Mark Available
          </button>
          <button
            type="button"
            className={`owner-toggle-btn occ ${!isAvailable ? "active" : ""}`}
            onClick={() => onToggleStatus(id, "occupied")}
          >
            Mark Occupied
          </button>
        </div>

        <div className="owner-prop-actions">
          <Link
            to={ROUTE_PATHS.PROPERTY_DETAILS.replace(":id", id)}
            className="owner-action-btn view"
          >
            View
          </Link>
          <Link to={editPath} className="owner-action-btn edit">
            Edit
          </Link>
          <button
            type="button"
            className="owner-action-btn delete"
            onClick={() => onDelete(id)}
            title="Delete listing"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
