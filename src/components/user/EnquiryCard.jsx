import React from "react";
import { Link } from "react-router-dom";
import { propertyPath } from "../../routes/paths.js";
import { EnquiryStatusBadge } from "./EnquiryStatusBadge.jsx";

/**
 * Card representing a single user enquiry.
 *
 * @param {Object} props
 * @param {Object} props.enquiry
 */
export function EnquiryCard({ enquiry }) {
  if (!enquiry) return null;

  const status = String(enquiry.status || "pending").trim().toLowerCase();
  const property = enquiry.property;
  const owner = enquiry.owner;

  const propertyId = enquiry.property_id || enquiry.building_id;
  const propertyName = property?.name || "Property Listing";
  const roomType = enquiry.room_type || "Room";

  const ownerName =
    owner?.full_name || property?.owner_name || "Property Owner";
  const rawPhone = property?.owner_phone || owner?.phone || "";
  const rawWhatsApp = property?.owner_whatsapp || rawPhone || "";

  const cleanPhone = String(rawPhone).replace(/\D/g, "");
  const cleanWhatsAppRaw = String(rawWhatsApp).replace(/\D/g, "");
  const cleanWhatsApp =
    cleanWhatsAppRaw.length === 10 ? `91${cleanWhatsAppRaw}` : cleanWhatsAppRaw;

  const canContactOwner = status === "accepted" || status === "contacted";

  const formattedDate = enquiry.created_at
    ? new Date(enquiry.created_at).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

  let statusMessage = "Your enquiry status has been updated.";
  if (status === "pending") {
    statusMessage = "Your enquiry is waiting for the owner's response.";
  } else if (status === "accepted") {
    statusMessage = "The owner has accepted your enquiry.";
  } else if (status === "contacted") {
    statusMessage = "The owner has marked this enquiry as contacted.";
  } else if (status === "rejected") {
    statusMessage = "The owner has rejected this enquiry.";
  }

  return (
    <article className="user-enquiry-card">
      <div className="user-enquiry-header">
        <div className="user-enquiry-property">
          <h3>
            {propertyId ? (
              <Link to={propertyPath(propertyId)}>{propertyName}</Link>
            ) : (
              propertyName
            )}
          </h3>
          <p>
            <span aria-hidden="true">🛏️</span> {roomType}
          </p>
        </div>

        <EnquiryStatusBadge status={status} />
      </div>

      <div className="user-enquiry-body">
        <div className="user-enquiry-detail">
          <span aria-hidden="true">👤</span>
          <span>
            <strong>Owner:</strong> {ownerName}
          </span>
        </div>

        {canContactOwner && (cleanPhone || cleanWhatsApp) && (
          <div className="user-enquiry-contact-actions">
            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="owner-contact-btn owner-call-btn"
              >
                📞 Call Owner
              </a>
            )}
            {cleanWhatsApp && (
              <a
                href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                  `Hello, I am following up on my enquiry for ${propertyName}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="owner-contact-btn owner-whatsapp-btn"
              >
                💬 WhatsApp Owner
              </a>
            )}
          </div>
        )}

        <div className="user-enquiry-message">
          <strong>Message sent:</strong>{" "}
          {enquiry.message || "I am interested in your room."}
        </div>
      </div>

      <div className="user-enquiry-footer">
        <span>{statusMessage}</span>
        <time dateTime={enquiry.created_at}>{formattedDate}</time>
      </div>
    </article>
  );
}

export default EnquiryCard;
