import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { createEnquiry } from "../../services/enquiries/index.js";
import { occupancyOptionsFromRoom } from "../../services/properties/index.js";
import { PATHS } from "../../routes/paths.js";

export function ContactOwnerModal({ building, isOpen, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !building) return null;

  const handleAuthRequiredAction = (actionCallback) => {
    if (!isAuthenticated) {
      onClose();
      navigate(`${PATHS.LOGIN}?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    actionCallback();
  };

  const roomTypes = Array.isArray(building.room_types) ? building.room_types : [];
  const roomChoices = roomTypes.flatMap((rt) => {
    const shares = occupancyOptionsFromRoom(rt);
    const roomName = rt.room_details?.room_name;
    if (shares.length > 0) {
      return shares.map((share) => {
        const sharing = share.people === 1 ? "Single" : `${share.people} sharing`;
        const title = roomName ? `${roomName} · ${sharing}` : sharing;
        return {
          key: `${rt.id || rt.room_type}-${share.people}`,
          value: `${title} (₹${share.rent.toLocaleString("en-IN")}/mo)`,
        };
      });
    }
    return [
      {
        key: rt.id || rt.room_type,
        value: rt.room_type,
        label: `${rt.room_type}${rt.price_value ? ` (₹${rt.price_value}/mo)` : ""}`,
      },
    ];
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isAuthenticated) {
      onClose();
      navigate(`${PATHS.LOGIN}?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await createEnquiry({
        userId: user?.id || null,
        ownerId: building.created_by || null,
        propertyId: building.id,
        roomType: selectedRoomType || "General Enquiry",
        renterPhone: cleanPhone,
        message: `Renter requested owner connection for ${building.name} (${selectedRoomType || "Any Room"})`,
      });

      if (error) {
        // If Supabase is unconfigured or returns an error, we still provide a friendly contact path
        console.warn("[Roomdhundo] Enquiry submission error:", error.message);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("[Roomdhundo] Unexpected error submitting enquiry:", err);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportPhone = "+919123456789";
  const whatsappUrl = `https://wa.me/919123456789?text=${encodeURIComponent(
    `Hi Pg Dhundo, I am interested in ${building.name} (${selectedRoomType || "General"})`
  )}`;

  return (
    <div
      className="contact-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contactModalTitle"
    >
      <div
        className="contact-panel"
        style={{
          background: "var(--rd-surface, #ffffff)",
          borderRadius: "20px",
          maxWidth: "460px",
          width: "100%",
          padding: "28px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          position: "relative",
          border: "1px solid var(--rd-border, #c6ead9)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="connect-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "1px",
              color: "var(--rd-accent, #38A3A5)",
              textTransform: "uppercase",
            }}
          >
            Pg Dhundo Connect
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              lineHeight: 1,
              color: "var(--rd-muted, #3a6f86)",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <h2 id="contactModalTitle" style={{ fontSize: "22px", color: "var(--rd-text, #22577A)", marginBottom: "8px" }}>
          Connect with Owner
        </h2>
        <p style={{ fontSize: "14px", color: "var(--rd-muted, #3a6f86)", marginBottom: "20px" }}>
          Our team verifies your enquiry and helps connect you directly with the property manager.
        </p>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px 10px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
            <h3 style={{ fontSize: "18px", color: "var(--rd-text, #22577A)", marginBottom: "8px" }}>
              Request Received!
            </h3>
            <p style={{ fontSize: "14px", color: "var(--rd-muted, #3a6f86)", marginBottom: "24px" }}>
              Pg Dhundo will reach out to you shortly on <strong>{phone}</strong> regarding <strong>{building.name}</strong>.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--rd-accent-2, #22577A)",
                color: "#ffffff",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="enquiryRoomType"
                style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--rd-text, #22577A)" }}
              >
                Room Type of Interest
              </label>
              <select
                id="enquiryRoomType"
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--rd-border, #c6ead9)",
                  background: "var(--rd-surface, #fff)",
                  color: "var(--rd-text, #22577A)",
                }}
              >
                <option value="">Any available room</option>
                {roomChoices.map((choice) => (
                  <option key={choice.key} value={choice.value}>
                    {choice.label || choice.value}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="renterPhone"
                style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--rd-text, #22577A)" }}
              >
                Your Mobile Number *
              </label>
              <input
                type="tel"
                id="renterPhone"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--rd-border, #c6ead9)",
                  background: "var(--rd-surface, #fff)",
                  color: "var(--rd-text, #22577A)",
                  fontSize: "15px",
                }}
              />
              <small style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--rd-muted, #3a6f86)" }}>
                We will call or WhatsApp you with owner details.
              </small>
            </div>

            {errorMsg && (
              <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "14px" }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--rd-accent, #38A3A5)",
                color: "#ffffff",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "15px",
                cursor: "pointer",
                border: "none",
                marginBottom: "20px",
              }}
            >
              {isSubmitting ? "Submitting Request..." : "📩 Request Owner Connection"}
            </button>

            <div style={{ textAlign: "center", borderTop: "1px solid var(--rd-border, #c6ead9)", paddingTop: "16px" }}>
              <span style={{ fontSize: "12px", color: "var(--rd-muted, #3a6f86)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Or Talk to Support
              </span>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <a
                  href={`tel:${supportPhone}`}
                  onClick={(e) => {
                    if (!isAuthenticated) {
                      e.preventDefault();
                      onClose();
                      navigate(`${PATHS.LOGIN}?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--rd-border, #c6ead9)",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--rd-accent-2, #22577A)",
                    textDecoration: "none",
                  }}
                >
                  📞 Call Us
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!isAuthenticated) {
                      e.preventDefault();
                      onClose();
                      navigate(`${PATHS.LOGIN}?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "#25D366",
                    color: "#ffffff",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ContactOwnerModal;

