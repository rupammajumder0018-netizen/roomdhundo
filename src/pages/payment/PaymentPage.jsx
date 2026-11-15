import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  fetchBookingById,
  preparePaymentParameters,
  BOOKING_STATUS,
} from "../../services/bookings/index.js";
import { PATHS } from "../../routes/paths.js";

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const bookingId = params.bookingId || searchParams.get("booking_id");

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      setIsLoading(false);
      setErrorMsg("No booking ID was provided.");
      return;
    }

    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await fetchBookingById(bookingId, user.id);

      if (error || !data) {
        setErrorMsg("We couldn't load this booking. It may not exist or does not belong to your account.");
      } else {
        setBooking(data);
      }
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred while loading your booking.");
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, user?.id]);

  useEffect(() => {
    if (!authLoading) {
      loadBooking();
    }
  }, [authLoading, loadBooking]);

  const handlePayNow = async () => {
    if (!booking) return;

    setIsProcessing(true);
    setPaymentNotice("");

    // Prepare sandbox parameters securely
    const paymentParams = preparePaymentParameters({
      bookingId: booking.id,
      amount: booking.total_amount,
      customerName: user?.user_metadata?.full_name || "",
      customerEmail: user?.email || "",
      customerPhone: user?.phone || "",
    });

    // Check gateway configuration
    if (!paymentParams.keyId) {
      setPaymentNotice(
        "Payment Gateway Notice: Razorpay test keys (VITE_RAZORPAY_KEY_ID) are not configured. As required by Phase 9 security rules, real money payments are disabled and client-side fake successes are forbidden. Server verification requires the verify-razorpay-payment Edge Function."
      );
      setIsProcessing(false);
      return;
    }

    // In sandbox test mode if key exists
    alert("Razorpay sandbox test mode initiated. Server-side verification is required to confirm payment.");
    setIsProcessing(false);
  };

  if (authLoading || isLoading) {
    return (
      <main className="payment-page">
        <div className="payment-container">
          <div className="payment-header">
            <h1>Complete Your Booking</h1>
            <p>Review your booking before payment.</p>
          </div>
          <div className="payment-card">
            <div className="payment-loading">Loading booking...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="payment-page">
        <div className="payment-container">
          <div className="payment-header">
            <h1>Complete Your Booking</h1>
          </div>
          <div className="payment-card">
            <div className="payment-error">
              <h2>Please log in</h2>
              <p style={{ margin: "12px 0 16px", color: "var(--rd-muted)" }}>
                You need to be logged in to continue with your booking.
              </p>
              <Link
                to={`${PATHS.LOGIN}?returnTo=${encodeURIComponent(
                  bookingId ? `/payment?booking_id=${bookingId}` : "/search"
                )}`}
                className="pay-now-btn"
                style={{ display: "inline-block", textAlign: "center" }}
              >
                Log In to Continue
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (errorMsg || !booking) {
    return (
      <main className="payment-page">
        <div className="payment-container">
          <div className="payment-header">
            <h1>Complete Your Booking</h1>
          </div>
          <div className="payment-card">
            <div className="payment-error">
              <h2>Booking Unavailable</h2>
              <p style={{ margin: "12px 0 16px", color: "var(--rd-muted)" }}>
                {errorMsg || "Booking not found."}
              </p>
              <Link to={PATHS.SEARCH} className="back-link">
                ← Back to Search
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (booking.status !== BOOKING_STATUS.PENDING) {
    return (
      <main className="payment-page">
        <div className="payment-container">
          <div className="payment-header">
            <h1>Complete Your Booking</h1>
          </div>
          <div className="payment-card">
            <div className="payment-error">
              <h2>Booking Already Processed</h2>
              <p style={{ margin: "12px 0 16px", color: "var(--rd-muted)" }}>
                This booking is currently marked as <strong>{booking.status}</strong> and is no longer pending payment.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <Link to={PATHS.DASHBOARD} className="back-link">
                  Go to Dashboard
                </Link>
                <span style={{ color: "var(--rd-muted)" }}>•</span>
                <Link to={PATHS.SEARCH} className="back-link">
                  Search Properties
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const property = booking.buildings;
  const room = booking.room_types;
  const roomRent = booking.monthly_rent || booking.room_rent || 0;
  const sharingCount = room?.room_people || 1;

  return (
    <main className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h1>Complete Your Booking</h1>
          <p>Review your booking before payment.</p>
        </div>

        <div className="payment-card">
          <div className="booking-property">
            <h2>{property?.name || booking.building_name || "Property"}</h2>
            <p>📍 {property?.location || "Accommodation location"}</p>
          </div>

          <div className="booking-room">
            <div>
              <div className="booking-room-name">
                {room?.room_type || booking.room_type_label || "Room"}
              </div>
              <div className="booking-room-type">
                {sharingCount} {sharingCount === 1 ? "person" : "people"} sharing
              </div>
            </div>
            <strong>{formatPrice(roomRent)}</strong>
          </div>

          <div className="price-breakdown">
            <div className="price-row">
              <span>Room rent</span>
              <strong>{formatPrice(roomRent)}</strong>
            </div>

            <div className="price-row">
              <span>Platform / service fee (10%)</span>
              <strong>{formatPrice(booking.platform_fee)}</strong>
            </div>

            <div className="price-row total">
              <span>Total</span>
              <strong>{formatPrice(booking.total_amount)}</strong>
            </div>
          </div>

          {paymentNotice && (
            <div className="payment-alert warning" role="alert">
              {paymentNotice}
            </div>
          )}

          <button
            type="button"
            className="pay-now-btn"
            id="payNowBtn"
            onClick={handlePayNow}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Pay Now"}
          </button>

          <div className="payment-note">
            Razorpay payment gateway integration is configured here.
          </div>
        </div>
      </div>
    </main>
  );
}

export default PaymentPage;
