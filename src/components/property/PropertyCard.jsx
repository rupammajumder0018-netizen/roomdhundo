import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BedDouble,
  Hotel,
  Building2,
  PartyPopper,
  Sparkles,
  Star,
  Users,
  MapPin,
  ArrowRight,
  Heart,
} from "lucide-react";
import {
  facilityPreviewBadges,
  occupancyOptionsFromRoom,
} from "../../services/properties/index.js";

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
    reviewCount = 0,
    roomTypeNames = [],
    flat_offer,
    totalAvailable,
    isCoupleFriendly,
  } = building;

  const typeLower = String(type || "").trim().toLowerCase();
  const categoryId = building.category || "";
  const isEventSpace = categoryId === "event_spaces" || typeLower.includes("event") || typeLower.includes("banquet");
  const isHotel = categoryId === "hotels_stays" || typeLower === "hotel" || typeLower === "guest house" || typeLower === "resort" || typeLower === "lodge";
  const isFlat = categoryId === "flats_rentals" || typeLower === "flat" || typeLower === "apartment";
  const forSale = isFlat && String(flat_offer || "").toLowerCase() === "sale";
  const offerBadge = isFlat ? (forSale ? "For sale" : "On rent") : null;

  // Type badge label & icon
  const typeLabel = building.primaryType || (
    isFlat
      ? "Flat"
      : isHotel
      ? typeLower === "guest house"
        ? "Guest House"
        : "Hotel"
      : isEventSpace
      ? "Event Space"
      : "PG / Hostel"
  );
  
  const TypeIcon = isFlat
    ? Building2
    : isHotel
    ? Hotel
    : isEventSpace
    ? PartyPopper
    : BedDouble;

  // Price formatting — never show ₹0 for hotels, event halls or daily stays
  const isDailyStay = isDaily || isHotel || isEventSpace || (!minPrice && minDailyPrice > 0);
  let price = minPrice;
  let unit = "/ month";

  if (forSale) {
    price = minPrice;
    unit = "";
  } else if (isDailyStay && minDailyPrice != null && minDailyPrice > 0) {
    price = minDailyPrice;
    unit = isEventSpace ? "/ day" : "/ night";
  } else if ((minPrice == null || minPrice <= 0) && minDailyPrice != null && minDailyPrice > 0) {
    price = minDailyPrice;
    unit = isEventSpace ? "/ day" : "/ night";
  } else if (minPrice != null && minPrice > 0) {
    price = minPrice;
    unit = "/ month";
  }

  const priceFormatted =
    price != null && price > 0 ? `₹${Number(price).toLocaleString("en-IN")}` : "—";
  const hasTieredRent = (building.room_types || []).some(
    (room) => occupancyOptionsFromRoom(room).length > 1
  );
  const priceLabel = forSale
    ? "Sale "
    : (building.room_types || []).length > 1 || hasTieredRent
    ? "From "
    : "";

  const mainImage = images && images.length > 0 ? images[0] : null;
  const facilityBadges = facilityPreviewBadges(building, 3);
  const roomTypeSummary = (roomTypeNames || []).join(" • ");

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(id, isSaved);
    }
  };

  return (
    <article className="property-card home-property-card" data-id={id}>
      {/* Media / Image Section */}
      <div className="property-card-media">
        <Link
          to={`/property/${id}`}
          className="property-image-link"
          aria-label={`View ${name}`}
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
                <Building2 size={36} className="placeholder-icon" />
                <span>Pg Dhundo Verified Stay</span>
              </div>
            )}
          </div>
          <div className="property-image-gradient" aria-hidden="true" />
        </Link>

        {/* Floating Badges on Image */}
        <div className="property-badges-overlay">
          <span className={`property-badge-type badge-${(type || "pg").toLowerCase()}`}>
            <span className="badge-icon">
              <TypeIcon size={12} />
            </span>
            <span>{typeLabel}</span>
          </span>

          {offerBadge && (
            <span className={`property-badge-offer ${forSale ? "is-sale" : "is-rent"}`}>
              {offerBadge}
            </span>
          )}

          {isCoupleFriendly && (
            <span className="property-badge-couple">
              <Users size={11} />
              <span>Couple Friendly</span>
            </span>
          )}
        </div>

        {/* Floating Favorite Heart Button */}
        <button
          type="button"
          className={`property-card-fav ${isSaved ? "is-saved" : ""}`}
          onClick={handleFavoriteClick}
          aria-label={isSaved ? "Remove from saved" : "Save property"}
          title={isSaved ? "Saved" : "Save"}
        >
          <Heart
            size={16}
            fill={isSaved ? "#ef4444" : "rgba(0, 0, 0, 0.25)"}
            color={isSaved ? "#ef4444" : "#ffffff"}
            strokeWidth={2.2}
          />
        </button>
      </div>

      {/* Content Section */}
      <div className="property-content">
        {/* Rating Meta Row */}
        <div className="property-meta-row">
          <div className="property-rating-chip">
            {avgRating ? (
              <>
                <Star size={11} className="star-icon" fill="#eab308" color="#ca8a04" />
                <span className="rating-value">{Number(avgRating).toFixed(1)}</span>
                <span className="rating-count">({reviewCount})</span>
              </>
            ) : (
              <span className="rating-new">
                <Sparkles size={11} className="sparkle-icon" />
                <span>New</span>
              </span>
            )}
          </div>
        </div>

        {/* Property Name */}
        <h3 className="property-title">
          <Link to={`/property/${id}`}>{name}</Link>
        </h3>

        {/* Location Row */}
        <p className="property-location-line">
          <MapPin size={13} className="pin-icon" />
          <span className="location-text">{location || "Location not listed"}</span>
        </p>

        {/* Room Types Summary */}
        {roomTypeSummary && (
          <div className="property-room-types" title={roomTypeSummary}>
            <BedDouble size={13} className="room-icon" />
            <span className="room-text">{roomTypeSummary}</span>
          </div>
        )}

        {/* Amenities / Facilities Chips */}
        {facilityBadges.length > 0 && (
          <div className="property-amenities-row">
            {facilityBadges.map((badge, idx) => (
              <span key={idx} className="property-amenity-chip">
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="property-card-divider" />

        {/* Footer: Price, Availability & CTA */}
        <div className="property-card-footer">
          <div className="property-price-block">
            <span className="price-prefix">{priceLabel ? `${priceLabel}` : "Starting"}</span>
            <div className="price-main">
              <strong className="price-amount">{priceFormatted}</strong>
              {unit && <span className="price-cycle">{unit}</span>}
            </div>
          </div>

          <div className="property-footer-actions">
            {totalAvailable != null && (
              <div
                className={`property-availability-tag ${
                  totalAvailable > 0 ? "is-available" : "is-occupied"
                }`}
              >
                <span className="avail-dot" aria-hidden="true" />
                <span>
                  {totalAvailable > 0
                    ? `${totalAvailable} ${
                        totalAvailable === 1
                          ? isFlat
                            ? "flat"
                            : "room"
                          : isFlat
                          ? "flats"
                          : "rooms"
                      } left`
                    : "Occupied"}
                </span>
              </div>
            )}

            <Link
              to={`/property/${id}`}
              className="property-view-cta"
              aria-label={`View details of ${name}`}
            >
              <span>View</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
