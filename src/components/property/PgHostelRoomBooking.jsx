import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  occupancyOptionsFromRoom,
  roomBedCapacity,
  roomAvailableBeds,
  roomOccupiedBeds,
  isRoomAvailable,
} from "../../services/properties/index.js";
import {
  createPgBooking,
  PLATFORM_FEE_PERCENTAGE,
} from "../../services/bookings/index.js";
import { PATHS } from "../../routes/paths.js";

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function PgHostelRoomBooking({ building, onBookingSuccess }) {
  const { user, profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roomTypes = useMemo(() => {
    return Array.isArray(building?.room_types) ? building.room_types : [];
  }, [building?.room_types]);

  // Active modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  // Booking form state
  const [durationMonths, setDurationMonths] = useState(1);
  const [checkInDate, setCheckInDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return toDateString(tomorrow);
  });
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [genderPreference, setGenderPreference] = useState("Any");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Pre-fill user data when user profile is loaded
  useEffect(() => {
    if (user) {
      if (!guestName) {
        setGuestName(profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "");
      }
      if (!guestPhone) {
        setGuestPhone(profile?.phone || profile?.contact_phone || user.phone || "");
      }
      if (!guestEmail) {
        setGuestEmail(user.email || "");
      }
    }
  }, [user, profile, guestName, guestPhone, guestEmail]);

  // Open booking modal for a specific room and occupancy option
  const handleOpenBooking = (room, option) => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`${PATHS.LOGIN}?returnTo=${returnUrl}`);
      return;
    }

    setSelectedRoom(room);
    setSelectedOption(option);
    setBookingError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    setSelectedOption(null);
    setBookingError("");
  };

  // Calculations for active booking modal
  const quote = useMemo(() => {
    if (!selectedOption) return { rent: 0, months: 1, subtotal: 0, fee: 0, total: 0 };
    const rent = Number(selectedOption.rent) || 0;
    const months = Math.max(1, Number(durationMonths) || 1);
    const subtotal = rent * months;
    // Platform fee (10% of 1 month's rent)
    const fee = Math.round(rent * PLATFORM_FEE_PERCENTAGE);
    const total = subtotal + fee;
    return { rent, months, subtotal, fee, total };
  }, [selectedOption, durationMonths]);

  // Submit PG Room Booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setBookingError("");

    if (!selectedRoom || !selectedOption) {
      setBookingError("Please select an occupancy option.");
      return;
    }

    const availBeds = roomAvailableBeds(selectedRoom);
    if (availBeds <= 0) {
      setBookingError("Sorry, all beds in this room are currently occupied.");
      return;
    }

    const cleanPhone = guestPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setBookingError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        userId: user.id,
        buildingId: building.id,
        roomTypeId: selectedRoom.id,
        buildingName: building.name,
        roomName: selectedRoom.room_details?.room_name || selectedRoom.room_type,
        sharingType: selectedOption.label,
        occupancyPeople: selectedOption.people,
        durationMonths: quote.months,
        pricingType: selectedOption.pricingType || "person",
        monthlyRent: quote.rent,
        platformFee: quote.fee,
        totalAmount: quote.total,
        checkInDate,
        guestName: guestName.trim(),
        guestPhone: cleanPhone,
        guestEmail: guestEmail.trim(),
        genderPreference,
        notes: notes.trim(),
      };

      const { data, error } = await createPgBooking(payload);

      if (error || !data) {
        throw error || new Error("Failed to create room booking.");
      }

      // Decrement local room beds in state if caller provided onBookingSuccess
      if (typeof onBookingSuccess === "function") {
        onBookingSuccess(selectedRoom.id, data);
      }

      handleCloseModal();
      // Redirect to payment confirmation page
      navigate(`/payment?booking_id=${data.id}`);
    } catch (err) {
      setBookingError(err.message || "An unexpected error occurred while booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="property-section" id="pgRoomsBookingSection">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Available Rooms & Occupancy Pricing</h2>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--rd-muted, #3a6f86)" }}>
            Choose your preferred sharing option. Bed availability is updated in real-time.
          </p>
        </div>
      </div>

      <div className="pg-rooms-booking-list" style={{ display: "grid", gap: "16px" }}>
        {roomTypes.map((room) => {
          const cap = roomBedCapacity(room);
          const availBeds = roomAvailableBeds(room);
          const isAvail = availBeds > 0;
          const options = occupancyOptionsFromRoom(room);
          const roomName = room.room_details?.room_name || room.room_type || "Standard Room";

          return (
            <div
              key={room.id || room.room_type}
              className="pg-room-booking-card"
              style={{
                background: "var(--rd-surface, #ffffff)",
                border: "1px solid var(--rd-border, #c6ead9)",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
              }}
            >
              {/* Room Header & Capacity Badges */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--rd-text, #22577a)", margin: 0 }}>
                    {roomName}
                  </h3>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background: isAvail ? "rgba(22, 163, 74, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        color: isAvail ? "#16a34a" : "#ef4444",
                        border: `1px solid ${isAvail ? "rgba(22, 163, 74, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                      }}
                    >
                      {isAvail ? `🟢 ${availBeds} of ${cap} Beds Available` : "🔴 All Beds Occupied"}
                    </span>

                    {room.room_details?.attached_bath && (
                      <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "999px", background: "var(--rd-surface-soft, #e6f7ef)", color: "var(--rd-text, #22577a)" }}>
                        🚿 Attached Washroom
                      </span>
                    )}

                    {room.room_details?.ac_available && (
                      <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "999px", background: "var(--rd-surface-soft, #e6f7ef)", color: "var(--rd-text, #22577a)" }}>
                        ❄️ AC Room
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "12.5px", color: "var(--rd-muted, #3a6f86)", display: "block" }}>
                    Bed Capacity
                  </span>
                  <strong style={{ fontSize: "16px", color: "var(--rd-text, #22577a)" }}>
                    {cap} {cap === 1 ? "Bed" : "Beds"}
                  </strong>
                </div>
              </div>

              {/* Occupancy Options Table */}
              <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
                {options.length === 0 ? (
                  <div style={{ padding: "12px", background: "var(--rd-surface-soft, #f8fafc)", borderRadius: "10px", fontSize: "13.5px", color: "var(--rd-muted, #64748b)" }}>
                    Monthly Rent: <strong>{formatMoney(room.price_value || room.room_rent)} / mo</strong>
                  </div>
                ) : (
                  options.map((opt) => {
                    const priceTypeLabel = opt.pricingType === "room" ? "per room / month" : "per person / month";
                    return (
                      <div
                        key={opt.people}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          background: isAvail ? "var(--rd-surface-soft, #e6f7ef)" : "rgba(0,0,0,0.03)",
                          border: "1px solid var(--rd-border, #c6ead9)",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "15px", color: "var(--rd-text, #22577a)" }}>
                              {opt.label}
                            </strong>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: opt.pricingType === "room" ? "#e0e7ff" : "#fef3c7",
                                color: opt.pricingType === "room" ? "#3730a3" : "#92400e",
                              }}
                            >
                              {opt.pricingType === "room" ? "Per Room" : "Per Person"}
                            </span>
                          </div>
                          <span style={{ fontSize: "12.5px", color: "var(--rd-muted, #3a6f86)" }}>
                            {opt.people === 1 ? "Single occupant in private room" : `${opt.people} persons sharing this room`}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--rd-accent, #38a3a5)" }}>
                              {formatMoney(opt.rent)}
                            </div>
                            <span style={{ fontSize: "12px", color: "var(--rd-muted, #3a6f86)" }}>
                              {priceTypeLabel}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={!isAvail}
                            onClick={() => handleOpenBooking(room, opt)}
                            style={{
                              padding: "9px 18px",
                              borderRadius: "10px",
                              background: isAvail ? "var(--rd-accent, #38a3a5)" : "#94a3b8",
                              color: "#ffffff",
                              border: "none",
                              fontWeight: 700,
                              fontSize: "13.5px",
                              cursor: isAvail ? "pointer" : "not-allowed",
                              boxShadow: isAvail ? "0 2px 8px rgba(56, 163, 165, 0.3)" : "none",
                              transition: "transform 0.15s ease",
                            }}
                          >
                            {isAvail ? "Book Bed" : "Full"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PG BOOKING MODAL */}
      {isModalOpen && selectedRoom && selectedOption && (
        <div
          className="guest-prompt-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pgBookingModalTitle"
          style={{ zIndex: 9999 }}
        >
          <div
            className="guest-prompt-card"
            style={{
              maxWidth: "520px",
              textAlign: "left",
              padding: "28px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <button
              type="button"
              className="guest-prompt-close-btn"
              onClick={handleCloseModal}
              aria-label="Close booking modal"
            >
              ✕
            </button>

            <h2 id="pgBookingModalTitle" style={{ fontSize: "20px", color: "var(--rd-text, #22577a)", margin: "0 0 6px" }}>
              Reserve Your Bed / Room
            </h2>
            <p style={{ fontSize: "13.5px", color: "var(--rd-muted, #3a6f86)", margin: "0 0 16px" }}>
              {building.name} · {selectedRoom.room_details?.room_name || selectedRoom.room_type}
            </p>

            <form onSubmit={handleConfirmBooking}>
              {/* Selected Sharing Tier Badge */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "var(--rd-surface-soft, #e6f7ef)",
                  border: "1px solid var(--rd-border, #c6ead9)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", color: "var(--rd-muted, #3a6f86)" }}>Selected Occupancy</div>
                  <strong style={{ fontSize: "15px", color: "var(--rd-text, #22577a)" }}>
                    {selectedOption.label} ({selectedOption.pricingType === "room" ? "Per Room" : "Per Person"})
                  </strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--rd-accent, #38a3a5)" }}>
                    {formatMoney(selectedOption.rent)}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--rd-muted, #3a6f86)" }}>/ month</div>
                </div>
              </div>

              {/* Duration & Move-in Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--rd-text, #22577a)", marginBottom: "4px" }}>
                    Duration (Months) *
                  </label>
                  <select
                    className="dynamic-select"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    required
                  >
                    <option value={1}>1 Month (Monthly)</option>
                    <option value={2}>2 Months</option>
                    <option value={3}>3 Months (Quarterly)</option>
                    <option value={6}>6 Months (Semester)</option>
                    <option value={11}>11 Months (Standard Agreement)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--rd-text, #22577a)", marginBottom: "4px" }}>
                    Expected Move-in Date *
                  </label>
                  <input
                    type="date"
                    className="dynamic-input"
                    value={checkInDate}
                    min={toDateString(new Date())}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Guest Details */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--rd-text, #22577a)", marginBottom: "4px" }}>
                  Resident Full Name *
                </label>
                <input
                  type="text"
                  className="dynamic-input"
                  placeholder="e.g. Rahul Sharma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--rd-text, #22577a)", marginBottom: "4px" }}>
                    Primary Mobile Number *
                  </label>
                  <input
                    type="tel"
                    className="dynamic-input"
                    placeholder="10-digit mobile"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--rd-text, #22577a)", marginBottom: "4px" }}>
                    Gender
                  </label>
                  <select
                    className="dynamic-select"
                    value={genderPreference}
                    onChange={(e) => setGenderPreference(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Any">Any</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--rd-text, #22577a)", marginBottom: "4px" }}>
                  Special Requests / Remarks (Optional)
                </label>
                <input
                  type="text"
                  className="dynamic-input"
                  placeholder="e.g. Vegetarian mess preferred, upper bunk, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Transparent Price Summary */}
              <div
                style={{
                  background: "var(--rd-surface-card, #f8fafc)",
                  border: "1px solid var(--rd-border, #cbd5e1)",
                  borderRadius: "12px",
                  padding: "14px",
                  marginBottom: "16px",
                  fontSize: "13.5px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Monthly Rent ({quote.months} month{quote.months > 1 ? "s" : ""})</span>
                  <strong>{formatMoney(quote.subtotal)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", color: "var(--rd-muted, #64748b)" }}>
                  <span>Platform & Service Fee (10% of 1st month)</span>
                  <span>{formatMoney(quote.fee)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "8px",
                    borderTop: "1px dashed var(--rd-border, #cbd5e1)",
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "var(--rd-text, #22577a)",
                  }}
                >
                  <span>Total Payable</span>
                  <span style={{ color: "var(--rd-accent, #38a3a5)" }}>{formatMoney(quote.total)}</span>
                </div>
              </div>

              {bookingError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    color: "#dc2626",
                    fontSize: "13px",
                    marginBottom: "14px",
                  }}
                >
                  {bookingError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #38A3A5 0%, #57CC99 100%)",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 700,
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(56, 163, 165, 0.35)",
                }}
              >
                {isSubmitting ? "Reserving Bed..." : `Confirm Reservation · ${formatMoney(quote.total)}`}
              </button>

              <p style={{ fontSize: "11.5px", color: "var(--rd-muted, #64748b)", textAlign: "center", margin: "10px 0 0" }}>
                🔒 1 Bed will be held exclusively for you. Overbooking is prevented.
              </p>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default PgHostelRoomBooking;
