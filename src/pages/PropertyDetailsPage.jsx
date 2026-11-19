import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  fetchPropertyById,
  toggleSavedProperty,
  fetchSavedProperties,
  createPropertyReview,
  occupancyOptionsFromRoom,
} from "../services/properties/index.js";
import { useAuth } from "../hooks/useAuth.js";
import { PropertyGallery } from "../components/property/PropertyGallery.jsx";
import { PropertyMap } from "../components/property/PropertyMap.jsx";
import { ContactOwnerModal } from "../components/property/ContactOwnerModal.jsx";
import { HotelStayBooking } from "../components/property/HotelStayBooking.jsx";
import { RatingStars } from "../components/common/RatingStars.jsx";
import { LoadingState } from "../components/common/LoadingState.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { PATHS } from "../routes/paths.js";

export function PropertyDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [building, setBuilding] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ text: "", type: "" });

  const roomId = searchParams.get("room");

  // Load property details
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadProperty() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await fetchPropertyById(id);
        if (!isMounted) return;

        if (error) {
          console.warn("[Roomdhundo] Error loading property:", error.message);
        }

        if (data) {
          setBuilding(data);
          document.title = `${data.name} | Pg Dhundo`;
        }

        if (user?.id) {
          const savedRes = await fetchSavedProperties(user.id);
          if (savedRes.data) {
            const hasSaved = savedRes.data.some((row) => row.building_id === id);
            setIsSaved(hasSaved);
          }
        }
      } catch (err) {
        console.error("[Roomdhundo] Unexpected error loading property:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProperty();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/property/${id}` } } });
      return;
    }
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    await toggleSavedProperty(user.id, id, isSaved);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewMessage({ text: "", type: "" });

    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/property/${id}` } } });
      return;
    }

    if (!reviewComment.trim()) {
      setReviewMessage({ text: "Please write a comment sharing your experience.", type: "error" });
      return;
    }

    setIsSubmittingReview(true);

    try {
      const reviewerName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Verified Renter";

      const { data, error } = await createPropertyReview({
        buildingId: id,
        userId: user.id,
        reviewerName,
        rating: reviewRating,
        comment: reviewComment,
      });

      if (error) {
        setReviewMessage({
          text: error.message || "Failed to submit review. Please try again.",
          type: "error",
        });
      } else {
        setReviewMessage({ text: "Thank you! Your review has been submitted.", type: "success" });
        setReviewComment("");
        // Optimistically add review to state
        if (data && building) {
          setBuilding((prev) => ({
            ...prev,
            reviews: [data, ...(prev.reviews || [])],
            reviewCount: (prev.reviewCount || 0) + 1,
          }));
        }
      }
    } catch (err) {
      setReviewMessage({ text: err.message || "An error occurred.", type: "error" });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading accommodation details..." minHeight="450px" />;
  }

  if (!building) {
    return (
      <EmptyState
        title="Property Not Found"
        message="The accommodation you are looking for does not exist or may have been unlisted."
        actionText="Back to Search"
        actionLink="/search"
      />
    );
  }

  const roomTypes = Array.isArray(building.room_types) ? building.room_types : [];
  const reviews = Array.isArray(building.reviews) ? building.reviews : [];
  const facilities = Array.isArray(building.facilities) ? building.facilities : [];
  const rules = Array.isArray(building.rules) ? building.rules : [];
  const images = Array.isArray(building.images) ? building.images : [];

  const typeLower = String(building.type || "").trim().toLowerCase();
  const isHotel = typeLower === "hotel" || typeLower === "guest house";
  const isEventHall = typeLower === "event hall";
  const isDaily = isHotel || isEventHall;
  const isFlat = typeLower === "flat";
  const forSale = isFlat && String(building.flat_offer || "").toLowerCase() === "sale";

  let priceUnit = forSale ? "" : isEventHall ? " / day" : isDaily ? " / night" : " / month";

  // Price formatting — handles daily stays and rentals without ever defaulting to ₹0
  let rawPrice = null;
  if (forSale && building.minPrice != null && building.minPrice > 0) {
    rawPrice = building.minPrice;
  } else if (isDaily && building.minDailyPrice != null && building.minDailyPrice > 0) {
    rawPrice = building.minDailyPrice;
  } else if (building.minPrice != null && building.minPrice > 0) {
    rawPrice = building.minPrice;
  } else if (building.minDailyPrice != null && building.minDailyPrice > 0) {
    rawPrice = building.minDailyPrice;
    priceUnit = isEventHall ? " / day" : " / night";
  }

  const hasTieredRent = roomTypes.some((rt) => occupancyOptionsFromRoom(rt).length > 1);
  const priceValue =
    rawPrice != null
      ? `₹${Number(rawPrice).toLocaleString("en-IN")}`
      : "—";
  const priceLabel = forSale ? "Sale " : (roomTypes.length > 1 || hasTieredRent ? "From " : "");

  // Availability display
  const isOccupied = building.totalAvailable === 0;
  const availabilityText = isOccupied
    ? "Occupied / Unavailable"
    : roomTypes.length > 1
    ? `${building.totalAvailable} rooms available across ${roomTypes.length} room types`
    : roomTypes[0]?.availability || "Room available";

  return (
    <div className="property-page-wrapper">
      <main className="property-page">
        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <button
            type="button"
            className="page-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Back to search results"
            title="Back to search results"
          >
            ← Back
          </button>
        </div>

        {/* PROPERTY HEADER */}
        <section className="property-header">
          <div>
            <h1 id="propertyName">{building.name}</h1>
            <p className="property-location" id="propertyLocation">
              📍 {building.location || "Location not listed"}
            </p>
            <div className="property-rating">
              <RatingStars rating={building.avgRating} reviewCount={building.reviewCount} />
            </div>
          </div>

          <button
            type="button"
            className={`save-property ${isSaved ? "saved" : ""}`}
            id="savePropertyBtn"
            onClick={handleToggleSave}
            aria-label={isSaved ? "Saved property" : "Save property"}
          >
            {isSaved ? "♥ Saved" : "♡ Save"}
          </button>
        </section>

        {/* IMAGE GALLERY */}
        <PropertyGallery images={images} propertyName={building.name} />

        {/* LEAFLET MAP */}
        {building.latitude && building.longitude && (
          <PropertyMap
            latitude={building.latitude}
            longitude={building.longitude}
            propertyName={building.name}
            locationName={building.location}
          />
        )}

        {/* TWO-COLUMN LAYOUT */}
        <div className="property-layout">
          {/* MAIN CONTENT (LEFT) */}
          <div className="property-main-content">
            {/* PRICING DETAILS */}
            <section className="property-section">
              <h2>Accommodation Details</h2>
              <div className="price-display">
                <strong id="propertyPrice">
                  {priceLabel}
                  {priceValue}
                </strong>
                <span id="propertyPriceUnit">{priceUnit}</span>
              </div>
            </section>

            {/* HOTEL STAYS & BOOKINGS OR GENERAL ROOM TYPES */}
            {isHotel ? (
              <HotelStayBooking building={building} />
            ) : (
              roomTypes.length > 0 && (
                <section className="property-section">
                  <h2>Available Room Types</h2>
                  <div className="room-types-list" id="roomTypesList">
                    {roomTypes.map((rt) => {
                      const shares = occupancyOptionsFromRoom(rt);
                      const roomCount = Number(rt.available_rooms);
                      const countLabel = Number.isFinite(roomCount)
                        ? `${roomCount} room${roomCount === 1 ? "" : "s"} available`
                        : "Available";
                      const roomName =
                        (rt.room_details && rt.room_details.room_name) || rt.room_type;
                      return (
                        <div
                          key={rt.id || rt.room_type}
                          className="room-type-card"
                          style={{
                            background: "var(--rd-surface, #fff)",
                            border: "1px solid var(--rd-border, #c6ead9)",
                            borderRadius: "14px",
                            padding: "18px",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "12px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: "16px", color: "var(--rd-text, #22577A)" }}>
                                {roomName}
                              </strong>
                              <p style={{ fontSize: "13px", color: "var(--rd-muted, #3a6f86)", marginTop: "4px" }}>
                                {countLabel}
                                {shares.length > 1 ? " · same room, choose a sharing type" : ""}
                              </p>
                            </div>
                            {shares.length === 0 && (
                              <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--rd-accent, #38A3A5)" }}>
                                  ₹{Number(rt.price_value || rt.price || 0).toLocaleString("en-IN")}
                                </span>
                                <span style={{ fontSize: "13px", color: "var(--rd-muted, #3a6f86)" }}> / mo</span>
                              </div>
                            )}
                          </div>
                          {shares.length > 0 && (
                            <div style={{ display: "grid", gap: "8px", marginTop: "14px" }}>
                              {shares.map((share) => (
                                <div
                                  key={share.people}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                    padding: "10px 12px",
                                    borderRadius: "10px",
                                    background: "var(--rd-surface-soft, #e6f7ef)",
                                  }}
                                >
                                  <span style={{ fontWeight: 700, color: "var(--rd-text, #22577A)" }}>
                                    {share.people === 1 ? "Single" : `${share.people} sharing`}
                                  </span>
                                  <span style={{ fontWeight: 700, color: "var(--rd-accent, #38A3A5)" }}>
                                    ₹{share.rent.toLocaleString("en-IN")}
                                    <span style={{ fontWeight: 600, color: "var(--rd-muted, #3a6f86)" }}> / mo</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )
            )}

            {/* FACILITIES */}
            {facilities.length > 0 && (
              <section className="property-section">
                <h2>Facilities & Amenities</h2>
                <div className="facility-grid" id="facilityGrid">
                  {facilities.map((fac, idx) => (
                    <div key={idx} className="facility-item">
                      <span className="facility-bullet" aria-hidden="true">✔</span>
                      <span>{fac}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* DESCRIPTION */}
            {building.description && (
              <section className="property-section">
                <h2>About this Property</h2>
                <p className="property-description" id="propertyDescription" style={{ lineHeight: "1.7" }}>
                  {building.description}
                </p>
              </section>
            )}

            {/* RULES */}
            {rules.length > 0 && (
              <section className="property-section">
                <h2>Property Rules</h2>
                <ul className="property-rules" id="propertyRules">
                  {rules.map((rule, idx) => (
                    <li key={idx}>• {rule}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* LOCATION DETAILS */}
            <section className="property-section">
              <h2>Location Information</h2>
              <p id="propertyLocationDetails" style={{ color: "var(--rd-muted, #3a6f86)" }}>
                {building.location || "Location not listed"}
              </p>
            </section>

            {/* REVIEWS & WRITE A REVIEW */}
            <section className="property-section">
              <h2>Reviews ({reviews.length})</h2>
              {reviews.length > 0 ? (
                <div id="reviewsContainer" style={{ marginBottom: "28px" }}>
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="review-item"
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid var(--rd-border, #c6ead9)",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <strong>{rev.reviewer_name || "Verified Student"}</strong>
                        <span style={{ color: "#f59e0b", fontSize: "14px" }}>
                          {"★".repeat(Number(rev.rating) || 5)}
                        </span>
                      </div>
                      <p style={{ fontSize: "14px", color: "var(--rd-text, #22577A)", lineHeight: "1.5" }}>
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--rd-muted, #3a6f86)", marginBottom: "20px" }}>
                  No reviews yet for this accommodation. Be the first to share your experience!
                </p>
              )}

              {/* WRITE REVIEW FORM */}
              <div
                className="write-review-box"
                style={{
                  background: "var(--rd-surface, #fff)",
                  border: "1px solid var(--rd-border, #c6ead9)",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <h3 style={{ fontSize: "16px", color: "var(--rd-text, #22577A)", marginBottom: "12px" }}>
                  Write a Review
                </h3>
                <form onSubmit={handleReviewSubmit}>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                      Rating
                    </label>
                    <div className="star-rating-input" id="starRatingInput">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star ${star <= reviewRating ? "is-selected" : ""}`}
                          onClick={() => setReviewRating(star)}
                          style={{
                            fontSize: "24px",
                            cursor: "pointer",
                            color: star <= reviewRating ? "#f59e0b" : "#cbd5e1",
                            marginRight: "4px",
                          }}
                          aria-label={`${star} star`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label htmlFor="reviewComment" style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                      Your Review
                    </label>
                    <textarea
                      id="reviewComment"
                      rows={3}
                      placeholder="Share your experience staying here (amenities, cleanliness, environment)..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid var(--rd-border, #c6ead9)",
                        background: "var(--rd-surface, #fff)",
                        color: "var(--rd-text, #22577A)",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  {reviewMessage.text && (
                    <p
                      style={{
                        fontSize: "13px",
                        marginBottom: "12px",
                        color: reviewMessage.type === "success" ? "#16a34a" : "#ef4444",
                      }}
                    >
                      {reviewMessage.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="lp-submit-btn"
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      background: "var(--rd-accent, #38A3A5)",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "none",
                    }}
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            </section>
          </div>

          {/* STICKY SIDEBAR (RIGHT) */}
          <aside className="property-sidebar">
            <div className="booking-card">
              <div className="sidebar-price">
                <span id="sidebarPropertyPrice">
                  {priceLabel}
                  {priceValue}
                </span>
                <span>{priceUnit}</span>
              </div>

              <div
                className={`availability-status ${isOccupied ? "is-occupied" : "is-available"}`}
                style={{
                  background: isOccupied ? "rgba(239, 68, 68, 0.12)" : undefined,
                  color: isOccupied ? "#ef4444" : undefined,
                  borderColor: isOccupied ? "rgba(239, 68, 68, 0.3)" : undefined,
                }}
              >
                {isOccupied ? "🔴" : "🟢"} <span id="propertyAvailability">{availabilityText}</span>
              </div>

              {isHotel && (
                <button
                  type="button"
                  className="hotel-room-select"
                  id="hotelStickyBook"
                  style={{ marginBottom: "12px", width: "100%" }}
                  onClick={() => {
                    document.getElementById("hotelStayRooms")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                >
                  🏨 Reserve a Room
                </button>
              )}

              <button
                type="button"
                className="contact-owner-btn"
                id="contactOwnerBtn"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate(`${PATHS.LOGIN}?returnTo=${encodeURIComponent(`/property/${id}`)}`);
                  } else {
                    setIsContactOpen(true);
                  }
                }}
              >
                📞 Contact Pg Dhundo
              </button>

              <div className="sidebar-reassurance">
                <p>🔒 Verified Listing</p>
                <p>⚡ Zero Brokerage directly from owner</p>
                <p>💬 Instant response via Pg Dhundo Connect</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* CONNECT / ENQUIRY MODAL */}
      <ContactOwnerModal
        building={building}
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}

export default PropertyDetailsPage;

