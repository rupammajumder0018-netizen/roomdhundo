import React, { useState, useEffect, useCallback } from "react";
import {
  fetchOwnerHotelBookings,
  updateHotelBookingStatus,
  HOTEL_BOOKING_STATUS,
} from "../../services/bookings/index.js";

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

export function OwnerHotelBookingsSection({ ownerId }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionInProgressId, setActionInProgressId] = useState(null);

  const loadBookings = useCallback(async () => {
    if (!ownerId) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await fetchOwnerHotelBookings(ownerId);
      if (error) {
        setErrorMsg(error.message || "Could not load booking requests.");
      } else {
        setBookings(data || []);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to load booking requests.");
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleRespond = async (bookingId, status) => {
    const isApprove = status === HOTEL_BOOKING_STATUS.CONFIRMED;
    const promptMsg = isApprove
      ? "Optional approval note for the guest:"
      : "Please enter a rejection reason:";
    const note = window.prompt(promptMsg, "");

    // If rejecting and user clicked Cancel, do not proceed
    if (!isApprove && note === null) return;

    setActionInProgressId(bookingId);

    try {
      const { error } = await updateHotelBookingStatus({
        bookingId,
        status,
        ownerNote: note ? note.trim() : null,
        updatedBy: ownerId,
      });

      if (error) {
        alert(`Could not update booking: ${error.message}`);
      } else {
        alert(isApprove ? "Booking confirmed." : "Booking rejected.");
        await loadBookings();
      }
    } catch (err) {
      alert(`Could not update booking: ${err.message}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <section className="section-block" id="hotel-bookings">
      <div className="section-header">
        <div>
          <h2>Hotel Booking Requests</h2>
          <p>
            Approve or reject requests for rooms in your hotels. Requests stay pending until you respond.
          </p>
        </div>
        <button
          type="button"
          className="view-all-btn"
          id="refreshOwnerHotelBookings"
          onClick={loadBookings}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="hotel-booking-wrap" style={{ margin: "16px 0 0" }}>
        <div className="hotel-booking-table-wrap">
          <table className="hotel-booking-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Hotel / Room</th>
                <th>Stay</th>
                <th>Guests</th>
                <th>Estimated Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="ownerHotelBookingsBody">
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "24px" }}>
                    Loading booking requests...
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#991b1b" }}>
                    {errorMsg}
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "32px", color: "var(--rd-muted)" }}>
                    No hotel booking requests yet.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const { inStr, outStr } = formatDateRange(b.check_in, b.check_out);
                  const isHourly = (b.booking_mode || "").toLowerCase() === "hourly";
                  const unitsLabel = isHourly
                    ? `${b.hours_count || 1} hours`
                    : `${b.nights_count || 1} nights`;
                  const isPending = b.status === "pending";
                  const isUpdating = actionInProgressId === b.id;

                  return (
                    <tr key={b.id}>
                      <td>
                        <b>{b.guest_name || "Guest"}</b>
                        <br />
                        <span style={{ color: "var(--rd-muted)" }}>
                          {b.guest_phone || "—"}
                        </span>
                      </td>
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
                        <span style={{ fontSize: "11px", color: "var(--rd-muted)" }}>
                          {b.booking_mode || "nightly"} · {unitsLabel}
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
                        {b.owner_note && (
                          <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--rd-muted)" }}>
                            Note: {b.owner_note}
                          </div>
                        )}
                      </td>
                      <td>
                        {isPending ? (
                          <div className="hotel-booking-actions">
                            <button
                              type="button"
                              className="approve"
                              disabled={isUpdating}
                              onClick={() => handleRespond(b.id, HOTEL_BOOKING_STATUS.CONFIRMED)}
                            >
                              {isUpdating ? "..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              className="reject"
                              disabled={isUpdating}
                              onClick={() => handleRespond(b.id, HOTEL_BOOKING_STATUS.REJECTED)}
                            >
                              {isUpdating ? "..." : "Reject"}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "var(--rd-muted)", fontSize: "12px" }}>
                            No action
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
      </div>
    </section>
  );
}

export default OwnerHotelBookingsSection;
