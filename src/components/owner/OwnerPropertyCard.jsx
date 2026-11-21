import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Building2,
  CheckCircle2,
  DoorClosed,
  Clock,
  XCircle,
  Trash2,
} from "lucide-react";
import { ROUTE_PATHS } from "../../routes/paths";
import { resolveMainCategoryFromProperty } from "../../constants/categories.js";

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
  let badgeLabel = isAvailable ? "Available" : "Occupied";
  let BadgeIcon = isAvailable ? CheckCircle2 : DoorClosed;

  if (verification_status === "pending") {
    badgeClass = "pending";
    badgeLabel = "Pending Review";
    BadgeIcon = Clock;
  } else if (verification_status === "rejected") {
    badgeClass = "rejected";
    badgeLabel = "Rejected";
    BadgeIcon = XCircle;
  }

  const { category, subcategories, primaryType } = resolveMainCategoryFromProperty(property);
  const editPath = `/list-property/create?edit=${id}`;

  return (
    <div className="owner-property-card">
      <div className="owner-prop-image-wrap">
        {firstImage ? (
          <img src={firstImage} alt={name || "Property"} loading="lazy" />
        ) : (
          <div className="owner-prop-no-img">
            <Building2 size={28} />
          </div>
        )}
        <span className={`owner-prop-badge ${badgeClass}`}>
          <BadgeIcon size={12} className="owner-badge-icon" />
          <span>{badgeLabel}</span>
        </span>
      </div>

      <div className="owner-prop-body">
        <div className="owner-prop-title-row">
          <h3>{name || "Untitled Property"}</h3>
          <span className="owner-prop-type-tag" title={category.name}>
            {primaryType || category.shortName}
          </span>
        </div>

        <p className="owner-prop-location">
          <MapPin size={13} className="owner-prop-loc-icon" />
          <span>{location || "Location not specified"}</span>
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
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
