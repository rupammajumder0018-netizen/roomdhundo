import React, { useState } from "react";
import { Link } from "react-router-dom";
import { calculateDistanceKm } from "../../services/properties/index.js";
import { RatingStars } from "../common/RatingStars.jsx";

export function PropertyCard({
  building,
  activeHub,
  isSaved = false,
  onToggleSave,
  isDaily = false,
}) {
  const [imgError, setImgError] = useState(false);

  if (!building) return null;

  const {
    id,
    name,
    location,
    type,
    images = [],
    minPrice,
    minDailyPrice,
    avgRating,
    reviewCount,
    roomTypeNames = [],
    flat_offer,
  } = building;

  // Calculate distance from active hub if coordinates exist
  let distanceDisplay = null;
  if (activeHub?.latitude && building.latitude) {
    const dist = calculateDistanceKm(
      activeHub.latitude,
      activeHub.longitude,
      building.latitude,
      building.longitude
    );
    if (dist != null) {
      distanceDisplay = `${dist} km from ${activeHub.name}`;
    }
  } else if (building.distance_km != null) {
    distanceDisplay = `${building.distance_km} km from MAKAUT`;
  }

  const isFlat = String(type || "").toLowerCase() === "flat";
  const forSale = isFlat && String(flat_offer || "").toLowerCase() === "sale";
  const offerBadge = isFlat ? (forSale ? "For sale" : "On rent") : null;

  // Price formatting
  const price = isDaily && !forSale ? minDailyPrice : minPrice;
  const unit = forSale ? "" : isDaily ? "/ night" : "/ month";
  const priceFormatted =
    price != null ? `₹${Number(price).toLocaleString("en-IN")}` : "—";
  const priceLabel = forSale
    ? "Sale"
    : (building.room_types || []).length > 1
    ? "From "
    : "";

  const mainImage = images && images.length > 0 ? images[0] : null;

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(id, isSaved);
    }
  };

  return (
    <article className="property-card" data-id={id}>
      <Link
        to={`/property/${id}`}
        className="property-image-link"
        aria-label={`View details for ${name}`}
      >
        <div className="property-image">
          {mainImage && !imgError ? (
            <img
              src={mainImage}
              alt={name}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="image-placeholder">
              <span>⌂</span>
              <span>{name}</span>
            </div>
          )}

          {offerBadge && (
            <span className="flat-offer-badge" aria-label={`Listing offer: ${offerBadge}`}>
              {offerBadge}
            </span>
          )}

          <button
            type="button"
            className={`favorite ${isSaved ? "saved" : ""}`}
            onClick={handleFavoriteClick}
            aria-label={isSaved ? "Remove from saved" : "Save property"}
            title={isSaved ? "Saved" : "Save"}
          >
            {isSaved ? "♥" : "♡"}
          </button>
        </div>
      </Link>

      <div className="property-content">
        <div className="property-title">
          <div>
            <h2>
              <Link to={`/property/${id}`}>{name}</Link>
            </h2>
            <p className="property-card-location">
              📍 {location || "Location not listed"}
              {distanceDisplay && ` • ${distanceDisplay}`}
            </p>
          </div>
        </div>

        <div className="property-card-rating">
          <RatingStars rating={avgRating} reviewCount={reviewCount} />
        </div>

        <div className="property-card-bottom">
          <div className="price">
            <strong>
              {priceLabel}
              {priceFormatted}
            </strong>
            {unit && <span> {unit}</span>}
          </div>

          {roomTypeNames.length > 0 && (
            <div className="property-card-types" title={roomTypeNames.join(", ")}>
              {roomTypeNames.slice(0, 2).join(" • ")}
              {roomTypeNames.length > 2 && ` +${roomTypeNames.length - 2}`}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;

