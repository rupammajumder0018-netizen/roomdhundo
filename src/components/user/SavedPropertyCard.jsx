import React from "react";
import { Link } from "react-router-dom";
import { propertyPath } from "../../routes/paths.js";

/**
 * Single card for a saved property in the Saved Properties list.
 *
 * @param {Object} props
 * @param {Object} props.property
 * @param {Function} props.onRemove
 * @param {boolean} [props.isRemoving=false]
 */
export function SavedPropertyCard({ property, onRemove, isRemoving = false }) {
  if (!property) return null;

  const id = property.id;
  const name = property.name || "Accommodation";
  const location = property.location || "Location not listed";
  const mainImage =
    Array.isArray(property.images) && property.images.length > 0
      ? property.images[0]
      : "/images/krishna-pg-1.webp";

  const priceLabel =
    (property.room_types || []).length > 1 ? "From ₹" : "₹";
  const priceValue =
    property.minPrice != null
      ? Number(property.minPrice).toLocaleString("en-IN")
      : "—";

  return (
    <div className="saved-property-card" data-id={id}>
      <Link
        to={propertyPath(id)}
        className="property-image-link"
        aria-label={`View details for ${name}`}
      >
        <div className="saved-property-image">
          <img
            src={mainImage}
            alt={name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/krishna-pg-1.webp";
            }}
          />
        </div>
      </Link>

      <div className="saved-property-info">
        <h2>{name}</h2>
        <p className="saved-location">📍 {location}</p>
        <div className="saved-rating">
          {property.avgRating
            ? `⭐ ${property.avgRating} rating`
            : "🆕 New listing"}
        </div>

        <div className="saved-price">
          <strong>
            {priceLabel}
            {priceValue}
          </strong>
          <span>/ month</span>
        </div>

        <div className="saved-property-actions">
          <Link to={propertyPath(id)} className="view-saved-btn">
            View Details
          </Link>
          <button
            type="button"
            className="remove-saved-btn"
            onClick={() => onRemove(id)}
            disabled={isRemoving}
            aria-label={`Remove ${name} from saved properties`}
          >
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SavedPropertyCard;
