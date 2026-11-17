import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  hourlyOffer,
  hotelHasMeal,
  hotelMealPrice,
  calculateStayQuote,
  createHotelBooking,
  MEAL_NAMES,
} from "../../services/bookings/index.js";
import { PATHS } from "../../routes/paths.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeString(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function HotelStayBooking({ building, initialRoomId = null }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const rooms = useMemo(() => {
    return Array.isArray(building?.room_types) ? building.room_types : [];
  }, [building?.room_types]);

  // Selected room state
  const [selectedRoomId, setSelectedRoomId] = useState(() => {
    if (initialRoomId) return initialRoomId;
    const params = new URLSearchParams(location.search);
    return params.get("room") || null;
  });

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return rooms.find((r) => String(r.id) === String(selectedRoomId)) || null;
  }, [rooms, selectedRoomId]);

  // Board / meal selection
  const [selectedMeals, setSelectedMeals] = useState([]);

  // Form fields
  const [bookingMode, setBookingMode] = useState("nightly");
  const [guestCount, setGuestCount] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [hoursCount, setHoursCount] = useState(3);

  // Dates defaults: check-in in 1 hr, check-out in 25 hrs
  const [checkInDate, setCheckInDate] = useState(() => {
    const d = new Date(Date.now() + 3600000);
    return toDateString(d);
  });
  const [checkInTime, setCheckInTime] = useState(() => {
    const d = new Date(Date.now() + 3600000);
    return toTimeString(d);
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const d = new Date(Date.now() + 90000000);
    return toDateString(d);
  });
  const [checkOutTime, setCheckOutTime] = useState(() => {
    const d = new Date(Date.now() + 90000000);
    return toTimeString(d);
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sync user details when auth state becomes ready
  useEffect(() => {
    if (user && !guestName) {
      setGuestName(profile?.full_name || user.user_metadata?.full_name || "");
    }
    if (user && !guestPhone) {
      setGuestPhone(profile?.phone || profile?.contact_phone || "");
    }
  }, [user, profile, guestName, guestPhone]);

  // Update room selection when URL query param changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomParam = params.get("room");
    if (roomParam && roomParam !== selectedRoomId) {
      setSelectedRoomId(roomParam);
    }
  }, [location.search, selectedRoomId]);

  // Meal categorization
  const paidMeals = useMemo(() => {
    return MEAL_NAMES.filter(
      (m) => hotelHasMeal(building, m) && hotelMealPrice(building, m) > 0
    );
  }, [building]);

  const includedMeals = useMemo(() => {
    return MEAL_NAMES.filter(
      (m) => hotelHasMeal(building, m) && hotelMealPrice(building, m) <= 0
    );
  }, [building]);

  const toggleMeal = (meal) => {
    if (meal === "room-only") {
      setSelectedMeals([]);
      return;
    }
    setSelectedMeals((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]
    );
  };

  const selectedMealText = useMemo(() => {
    if (!selectedMeals.length) {
      return includedMeals.length
        ? `Room only · ${includedMeals.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")} included`
        : "Room only";
    }
    return selectedMeals
      .map(
        (m) =>
          `${m.charAt(0).toUpperCase() + m.slice(1)} (+${formatMoney(hotelMealPrice(building, m))} + taxes)`
      )
      .join(", ");
  }, [selectedMeals, includedMeals, building]);

  // Hourly offer for selected room
  const hourly = useMemo(() => {
    return hourlyOffer(selectedRoom);
  }, [selectedRoom]);

  // If hourly selected but room does not support hourly, fallback to nightly
  useEffect(() => {
    if (bookingMode === "hourly" && !hourly.enabled) {
      setBookingMode("nightly");
    }
  }, [bookingMode, hourly.enabled]);

  // Stay unit calculation
  const startAt = useMemo(() => {
    return new Date(`${checkInDate}T${checkInTime || "12:00"}`);
  }, [checkInDate, checkInTime]);

  const endAt = useMemo(() => {
    if (bookingMode === "hourly") {
      return new Date(startAt.getTime() + (Number(hoursCount) || 3) * 3600000);
    }
    return new Date(`${checkOutDate}T${checkOutTime || "12:00"}`);
  }, [bookingMode, startAt, hoursCount, checkOutDate, checkOutTime]);

  const stayUnits = useMemo(() => {
    if (bookingMode === "hourly") {
      return Number(hoursCount) || 3;
    }
    const msDiff = endAt - startAt;
    return Math.max(1, Math.ceil(msDiff / 86400000));
  }, [bookingMode, hoursCount, endAt, startAt]);

  const roomRate = useMemo(() => {
    if (!selectedRoom) return 0;
    if (bookingMode === "hourly") {
      return hourly.price;
    }
    return Number(selectedRoom.daily_price || selectedRoom.price_value || 0);
  }, [selectedRoom, bookingMode, hourly.price]);

  // Computed quote
  const quote = useMemo(() => {
    if (!selectedRoom) return null;
    return calculateStayQuote({
      hourly: bookingMode === "hourly",
      units: stayUnits,
      rate: roomRate,
      selectedMeals,
      hotel: building,
      room: selectedRoom,
    });
  }, [selectedRoom, bookingMode, stayUnits, roomRate, selectedMeals, building]);

  // Handlers
  const handleRoomSelect = (room) => {
    setSelectedRoomId(room.id);
    const sp = new URLSearchParams(location.search);
    sp.set("room", room.id);
    navigate({ search: sp.toString() }, { replace: true });
  };

  const handleClearSelectedRoom = () => {
    setSelectedRoomId(null);
    const sp = new URLSearchParams(location.search);
    sp.delete("room");
    navigate({ search: sp.toString() }, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (!user) {
      navigate(`${PATHS.LOGIN}?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    if (!selectedRoom) {
      setSubmitError("Please choose an available room first.");
      return;
    }

    if (!quote || quote.rate < 1) {
      setSubmitError(
        `The owner has not added a ${bookingMode === "hourly" ? "hourly" : "nightly"} price for this room yet.`
      );
      return;
    }

    if (bookingMode === "nightly" && endAt <= startAt) {
      setSubmitError("Check-out date and time must be after check-in.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        buildingId: building.id,
        roomTypeId: selectedRoom.id,
        userId: user.id,
        ownerId: building.created_by,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestCount: Number(guestCount),
        bookingMode,
        checkIn: startAt.toISOString(),
        checkOut: endAt.toISOString(),
        hoursCount: bookingMode === "hourly" ? quote.units : null,
        nightsCount: bookingMode === "nightly" ? quote.units : null,
        pricePerUnit: quote.rate,
        totalPrice: quote.total,
      };

      const { error } = await createHotelBooking(payload);

      if (error) {
        setSubmitError(error.message || "Could not send booking request.");
      } else {
        setSubmitSuccess(true);
      }
    } catch (err) {
      setSubmitError(err.message || "An unexpected error occurred while booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hotelPhotos = Array.isArray(building?.images) ? building.images.filter(Boolean) : [];

  return (
    <section className="hotel-booking-wrap" id="hotelStayRooms">
      <h2>Hotel Rooms & Stays</h2>
      <p className="hotel-booking-intro">
        Select your room category and customize your board package.
      </p>

      {/* BOARD PILLS */}
      <div className="hotel-board-pills" id="hotelBoardMount">
        <button
          type="button"
          className={`hotel-board-pill ${selectedMeals.length === 0 ? "is-active" : ""}`}
          onClick={() => toggleMeal("room-only")}
        >
          Room only
          <small>{includedMeals.length ? "Meals included" : "No extra meals"}</small>
        </button>

        {paidMeals.map((meal) => {
          const isActive = selectedMeals.includes(meal);
          const mealName = meal.charAt(0).toUpperCase() + meal.slice(1);
          return (
            <button
              key={meal}
              type="button"
              className={`hotel-board-pill ${isActive ? "is-active" : ""}`}
              onClick={() => toggleMeal(meal)}
            >
              {mealName}
              <span className="hotel-board-extra">
                +{formatMoney(hotelMealPrice(building, meal))} + taxes
              </span>
            </button>
          );
        })}
      </div>

      {includedMeals.length > 0 && (
        <p className="hotel-booking-notice">
          {includedMeals.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")} included in room rate.
        </p>
      )}

      {/* ROOM CATEGORY OPTIONS GRID */}
      <div className="hotel-room-grid" id="hotelRoomOptions">
        {rooms.map((room) => {
          const canBook =
            Number(room.available_rooms ?? 0) > 0 &&
            String(room.availability || "").toLowerCase() !== "occupied";
          const roomPhotos = Array.isArray(room.images) ? room.images.filter(Boolean) : [];
          const photo = roomPhotos[0] || hotelPhotos[0];
          const isSelected = selectedRoomId === room.id;
          const roomHourly = hourlyOffer(room);
          const maxGuests = Number(room.max_guests || room.room_people || 2);

          return (
            <article
              key={room.id}
              className={`hotel-room-pick-card ${!canBook ? "is-unavailable" : ""} ${
                isSelected ? "selected" : ""
              }`}
              style={{
                borderColor: isSelected ? "var(--rd-accent, #38A3A5)" : undefined,
                boxShadow: isSelected ? "0 0 0 2px var(--rd-accent, #38A3A5)" : undefined,
              }}
            >
              <div className="hotel-room-pick-photo">
                {photo ? (
                  <img src={photo} alt={room.room_type || "Hotel Room"} />
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--rd-muted)",
                      fontSize: "13px",
                    }}
                  >
                    No photos provided
                  </div>
                )}
                {roomPhotos.length > 1 && (
                  <span className="hotel-room-photo-count">{roomPhotos.length} photos</span>
                )}
              </div>

              <div className="hotel-room-pick-body">
                <h3>{room.room_type || "Room"}</h3>
                {canBook && Number(room.available_rooms) <= 5 && (
                  <p className="hotel-room-left">
                    Only {Number(room.available_rooms)} room
                    {Number(room.available_rooms) === 1 ? "" : "s"} left
                  </p>
                )}

                <ul className="hotel-package-facts">
                  <li>{selectedMealText}</li>
                  <li>👥 Up to {maxGuests} guests</li>
                  <li>{canBook ? `🟢 ${Number(room.available_rooms)} available` : "🔴 Currently unavailable"}</li>
                </ul>

                <strong>
                  {formatMoney(room.daily_price || room.hourly_price || room.price_value)}
                  {room.daily_price ? " / night" : roomHourly.enabled ? " / hour" : ""}
                </strong>

                {roomHourly.enabled && (
                  <small>
                    Hourly: {roomHourly.hours.map((h) => `${h} hrs`).join(", ")}
                  </small>
                )}

                <button
                  type="button"
                  className="hotel-room-select"
                  disabled={!canBook}
                  onClick={() => handleRoomSelect(room)}
                >
                  {isSelected ? "✓ Room Selected" : "Select & Book Room"}
                </button>
              </div>
            </article>
          );
        })}

        {rooms.length === 0 && (
          <p className="hotel-booking-notice">
            All room categories are currently unavailable. Please check again later.
          </p>
        )}
      </div>

      {/* SELECTED ROOM RESERVATION FORM */}
      {selectedRoom && (
        <div
          id="hotelBookingFormMount"
          style={{
            marginTop: "28px",
            paddingTop: "24px",
            borderTop: "2px dashed var(--rd-border, #d1d5db)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3>
              Reserve {selectedRoom.room_type || "Room"}
            </h3>
            <button
              type="button"
              onClick={handleClearSelectedRoom}
              style={{
                fontSize: "12px",
                color: "var(--rd-accent, #38A3A5)",
                fontWeight: 700,
                textDecoration: "underline",
              }}
            >
              Change Room
            </button>
          </div>

          {submitSuccess ? (
            <div
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "#dcfce7",
                color: "#166534",
                border: "1px solid #86efac",
              }}
            >
              <h4 style={{ margin: "0 0 6px", fontSize: "16px" }}>🎉 Booking Request Sent!</h4>
              <p style={{ margin: 0, fontSize: "14px" }}>
                Your booking request has been submitted to the hotel owner. You can track its status in your dashboard.
              </p>
            </div>
          ) : (
            <form className="hotel-booking-form" onSubmit={handleSubmit} id="hotelBookingForm">
              {submitError && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "#fee2e2",
                    color: "#991b1b",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {submitError}
                </div>
              )}

              <div className="hotel-booking-datetime">
                <label>
                  Stay Type
                  <select
                    id="hbMode"
                    value={bookingMode}
                    onChange={(e) => setBookingMode(e.target.value)}
                  >
                    <option value="nightly">Book by night</option>
                    {hourly.enabled && <option value="hourly">Book by hour</option>}
                  </select>
                </label>

                <label>
                  Guests
                  <input
                    id="hbGuests"
                    type="number"
                    min="1"
                    max={Number(selectedRoom.max_guests || selectedRoom.room_people || 2)}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
                    required
                  />
                </label>
              </div>

              {/* CHECK-IN */}
              <div className="hotel-booking-datetime">
                <label>
                  Check-in date
                  <input
                    id="hbStartDate"
                    type="date"
                    min={toDateString(new Date())}
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Check-in time
                  <input
                    id="hbStartTime"
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    required
                  />
                </label>
              </div>

              {/* NIGHTLY: CHECK-OUT | HOURLY: DURATION SELECT */}
              {bookingMode === "nightly" ? (
                <div className="hotel-booking-datetime">
                  <label>
                    Check-out date
                    <input
                      id="hbEndDate"
                      type="date"
                      min={checkInDate}
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Check-out time
                    <input
                      id="hbEndTime"
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      required
                    />
                  </label>
                </div>
              ) : (
                <label>
                  Number of hours
                  <select
                    id="hbHours"
                    value={hoursCount}
                    onChange={(e) => setHoursCount(Number(e.target.value))}
                  >
                    {hourly.hours.map((h) => (
                      <option key={h} value={h}>
                        {h} hours · {formatMoney(hourly.price * h)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* GUEST INFO */}
              <label>
                Your Full Name
                <input
                  id="hbName"
                  type="text"
                  autoComplete="name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Guest full name"
                  required
                />
              </label>

              <label>
                Phone Number
                <input
                  id="hbPhone"
                  type="tel"
                  autoComplete="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  required
                />
              </label>

              {/* REAL-TIME TOTAL BREAKDOWN */}
              {quote && (
                <div className="hotel-total" id="hbTotal">
                  <div className="hotel-total-breakdown">
                    <div>
                      Room: {formatMoney(quote.roomSubtotal)} ({formatMoney(quote.rate)} ×{" "}
                      {quote.units} {quote.hourly ? "hours" : "nights"})
                    </div>

                    {quote.mealLines.length > 0 ? (
                      quote.mealLines.map((line) => (
                        <div key={line.meal}>
                          {line.meal.charAt(0).toUpperCase() + line.meal.slice(1)}:{" "}
                          {formatMoney(line.total)}
                          {line.units > 1 &&
                            ` (${formatMoney(line.fee)} × ${line.units} ${
                              quote.hourly ? "sessions" : "nights"
                            })`}
                        </div>
                      ))
                    ) : (
                      <div>Meals: ₹0</div>
                    )}

                    <div>
                      {quote.taxMode === "inclusive" && quote.mealsTotal > 0
                        ? `${quote.taxLabel} on meals: ${formatMoney(quote.taxAmount)}`
                        : quote.taxMode === "exclusive"
                        ? `${quote.taxLabel}: ${formatMoney(quote.taxAmount)}`
                        : `${quote.taxLabel}: ₹0 (included in room rate)`}
                    </div>

                    <div className="hotel-total-pay">
                      Payable total: {formatMoney(quote.total)}
                    </div>
                  </div>
                </div>
              )}

              <p className="hotel-booking-notice">
                This is a booking request. The owner confirms it after review.
              </p>

              <button
                type="submit"
                className="hotel-booking-submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Sending request..."
                  : user
                  ? "Book now"
                  : "Log in to book"}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

export default HotelStayBooking;
