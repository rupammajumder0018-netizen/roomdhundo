import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchUserPgBookings, cancelPgBooking, BOOKING_STATUS } from "../../services/bookings/index.js";
import { PATHS } from "../../routes/paths.js";

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function UserPgBookingsSection({ userId }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await fetchUserPgBookings(userId);
      if (error) {
        setErrorMsg(error.message || "Failed to load your room bookings.");
      } else {
        setBookings(data || []);
      }
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancel = async (bookingId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this room reservation? The reserved bed will be released back to the property inventory."
    );
    if (!confirmCancel) return;

    setCancellingId(bookingId);
    setActionMessage("");

    try {
      const { success, error } = await cancelPgBooking({
        bookingId,
        userId,
        cancelReason: "Cancelled by renter from dashboard",
      });

      if (!success) {
        alert(error?.message || "Failed to cancel reservation.");
      } else {
        setActionMessage("Reservation cancelled successfully. Bed inventory restored.");
        loadBookings();
      }
    } catch (err) {
      alert(err.message || "Error cancelling reservation.");
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="account-section" style={{ marginTop: "24px" }}>
        <div className="section-head">
          <h3>My PG & Room Reservations</h3>
          <p>Loading your room bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-section" style={{ marginTop: "28px" }}>
      <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", color: "var(--rd-text, #22577a)" }}>
            🛏️ My PG & Hostel Reservations ({bookings.length})
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--rd-muted, #3a6f86)" }}>
            Track your reserved beds, sharing options, and monthly agreements.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
          {actionMessage}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
          {errorMsg}
        </div>
      )}

      {bookings.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center", background: "var(--rd-surface, #ffffff)", border: "1px solid var(--rd-border, #c6ead9)", borderRadius: "14px" }}>
          <p style={{ color: "var(--rd-muted, #3a6f86)", marginBottom: "14px", fontSize: "14px" }}>
            You haven't reserved any PG rooms or beds yet.
          </p>
          <Link
            to={PATHS.SEARCH}
            style={{
              display: "inline-block",
              padding: "9px 18px",
              borderRadius: "10px",
              background: "var(--rd-accent, #38a3a5)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "13.5px",
              textDecoration: "none",
            }}
          >
            Explore PGs & Hostels
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {bookings.map((b) => {
            const property = b.buildings;
            const room = b.room_types;
            const details = typeof b.booking_details === "object" && b.booking_details ? b.booking_details : {};
            const sharing = b.sharing_type || details.sharing_type || (b.occupancy_people ? `${b.occupancy_people} Sharing` : "Standard");
            const duration = Number(b.duration_months || details.duration_months || 1);
            const moveIn = b.check_in_date || details.move_in_date || null;
            const isCancelled = b.status === BOOKING_STATUS.CANCELLED;
            const isPaid = b.status === BOOKING_STATUS.PAID;

            return (
              <div
                key={b.id}
                style={{
                  background: "var(--rd-surface, #ffffff)",
                  border: "1px solid var(--rd-border, #c6ead9)",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                  opacity: isCancelled ? 0.65 : 1,
                }}
              >
                <div style={{ minWidth: "240px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "16px", color: "var(--rd-text, #22577a)" }}>
                      {property?.name || b.building_name || "PG Property"}
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: isPaid ? "#dcfce7" : isCancelled ? "#fee2e2" : "#fef3c7",
                        color: isPaid ? "#16a34a" : isCancelled ? "#dc2626" : "#b45309",
                      }}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div style={{ fontSize: "13.5px", color: "var(--rd-text, #22577a)", fontWeight: 600 }}>
                    {room?.room_type || b.room_type_label || "Room"} · <span style={{ color: "var(--rd-accent, #38a3a5)" }}>{sharing}</span>
                  </div>

                  <div style={{ fontSize: "12.5px", color: "var(--rd-muted, #3a6f86)", marginTop: "4px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <span>📍 {property?.location || "Location"}</span>
                    <span>⏱️ Duration: <strong>{duration} month{duration > 1 ? "s" : ""}</strong></span>
                    {moveIn && <span>📅 Move-in: <strong>{new Date(moveIn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>}
                  </div>
                </div>

                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--rd-accent, #38a3a5)" }}>
                      {formatMoney(b.total_amount)}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--rd-muted, #3a6f86)" }}>
                      ({formatMoney(b.monthly_rent)}/mo + fee)
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {!isCancelled && (
                      <Link
                        to={`/payment?booking_id=${b.id}`}
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 700,
                          padding: "6px 12px",
                          borderRadius: "8px",
                          background: "var(--rd-surface-soft, #e6f7ef)",
                          color: "var(--rd-accent-2, #22577a)",
                          textDecoration: "none",
                          border: "1px solid var(--rd-border, #c6ead9)",
                        }}
                      >
                        View Details
                      </Link>
                    )}

                    {!isCancelled && (
                      <button
                        type="button"
                        disabled={cancellingId === b.id}
                        onClick={() => handleCancel(b.id)}
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          padding: "6px 12px",
                          borderRadius: "8px",
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "none",
                          cursor: cancellingId === b.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {cancellingId === b.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserPgBookingsSection;
