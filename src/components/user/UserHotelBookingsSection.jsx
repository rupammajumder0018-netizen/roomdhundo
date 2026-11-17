import React, { useState, useEffect, useCallback } from "react";
import { fetchUserHotelBookings } from "../../services/bookings/index.js";

function formatDateRange(checkIn, checkOut) {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const inStr = Number.isNaN(inDate.getTime())
    ? "—"
    : inDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const outStr = Number.isNaN(outDate.getTime())
    ? "—"
    : outDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  return { inStr, outStr };
}

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function UserHotelBookingsSection({ userId }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadBookings = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await fetchUserHotelBookings(userId);
      if (error) {
        setErrorMsg(error.message || "Could not load your hotel bookings.");
      } else {
        setBookings(data || []);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to load bookings.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return (
    <section className="hotel-booking-wrap" id="myHotelBookings" style={{ marginTop: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div>
          <h2>My Hotel Bookings</h2>
          <p className="hotel-booking-intro" style={{ margin: 0 }}>
            Track your hotel booking requests and owner responses.
          </p>
        </div>
        <button
          type="button"
          onClick={loadBookings}
          style={{
            padding: "8px 14px",
            border: "1px solid var(--rd-border, #c6ead9)",
            borderRadius: "8px",
            background: "var(--rd-surface, #fff)",
            color: "var(--rd-text, #22577A)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="hotel-booking-table-wrap">
        <table className="hotel-booking-table">
          <thead>
            <tr>
              <th>Hotel / Room</th>
              <th>Stay</th>
              <th>Guests</th>
              <th>Total</th>
              <th>Status</th>
              <th>Owner Note</th>
            </tr>
          </thead>
          <tbody id="myHotelBookingsBody">
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>
                  Loading your bookings...
                </td>
              </tr>
            ) : errorMsg ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "#991b1b" }}>
                  {errorMsg}
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "var(--rd-muted)" }}>
                  You have not requested a hotel booking yet.
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const { inStr, outStr } = formatDateRange(b.check_in, b.check_out);
                return (
                  <tr key={b.id}>
                    <td>
                      <b>{b.buildings?.name || "Hotel"}</b>
                      <br />
                      <span style={{ color: "var(--rd-muted)" }}>
                        {b.room_types?.room_type || "Room"}
                      </span>
                    </td>
                    <td>
                      {inStr}
                      <br />
                      to {outStr}
                      <br />
                      <span style={{ fontSize: "11px", textTransform: "capitalize", color: "var(--rd-muted)" }}>
                        {b.booking_mode || "nightly"} stay
                      </span>
                    </td>
                    <td>{b.guest_count}</td>
                    <td>
                      <strong>{formatMoney(b.total_price)}</strong>
                    </td>
                    <td>
                      <span className={`hotel-status ${b.status || "pending"}`}>
                        {b.status || "pending"}
                      </span>
                    </td>
                    <td>
                      {b.owner_note || b.admin_note ? (
                        <span>{b.owner_note || b.admin_note}</span>
                      ) : (
                        <span style={{ color: "var(--rd-muted)", fontStyle: "italic" }}>
                          Waiting for owner response
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default UserHotelBookingsSection;
