import React from "react";

export default function OwnerEnquiryCard({
  enquiry,
  onUpdateStatus,
}) {
  const {
    id,
    created_at,
    status = "pending",
    message,
    property,
    room_type,
    renter,
  } = enquiry;

  const renterName = renter?.full_name || "Prospective Tenant";
  const renterPhone = renter?.phone || "";
  const renterEmail = renter?.email || "";
  const initial = renterName.charAt(0).toUpperCase();

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const cleanPhone = renterPhone.replace(/\D/g, "");
  const whatsappNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  return (
    <div className="owner-enquiry-card">
      <div className="owner-enquiry-header">
        <div className="owner-enquiry-renter">
          <div className="owner-renter-avatar">{initial}</div>
          <div className="owner-renter-info">
            <h3>{renterName}</h3>
            <p>{renterPhone || renterEmail || "Contact not provided"}</p>
          </div>
        </div>
        <span className={`owner-enquiry-status-pill ${status}`}>{status}</span>
      </div>

      <div className="owner-enquiry-body">
        <div className="owner-enquiry-detail">
          <div className="owner-enquiry-detail-icon">🏢</div>
          <div>
            <span>Property</span>
            <strong>{property?.name || "Property Listing"}</strong>
          </div>
        </div>

        <div className="owner-enquiry-detail">
          <div className="owner-enquiry-detail-icon">🛏️</div>
          <div>
            <span>Room Preference</span>
            <strong>{room_type?.name || "Any Available Room"}</strong>
          </div>
        </div>

        <div className="owner-enquiry-detail">
          <div className="owner-enquiry-detail-icon">📅</div>
          <div>
            <span>Received On</span>
            <strong>{formattedDate || "Recent"}</strong>
          </div>
        </div>

        {message && (
          <div className="owner-enquiry-msg">
            <span>Renter Note</span>
            <p>{message}</p>
          </div>
        )}
      </div>

      <div className="owner-enquiry-actions">
        {cleanPhone && (
          <>
            <a href={`tel:${cleanPhone}`} className="owner-enq-btn call">
              <span>📞</span> Call
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="owner-enq-btn whatsapp"
            >
              <span>💬</span> WhatsApp
            </a>
          </>
        )}

        {status === "pending" && (
          <>
            <button
              type="button"
              className="owner-enq-btn accept"
              onClick={() => onUpdateStatus(id, "accepted")}
            >
              ✓ Accept
            </button>
            <button
              type="button"
              className="owner-enq-btn reject"
              onClick={() => onUpdateStatus(id, "rejected")}
            >
              ✕ Reject
            </button>
          </>
        )}

        {status === "accepted" && (
          <button
            type="button"
            className="owner-enq-btn contacted"
            onClick={() => onUpdateStatus(id, "contacted")}
          >
            Mark Contacted
          </button>
        )}
      </div>
    </div>
  );
}
