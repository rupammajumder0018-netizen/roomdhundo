import React from "react";

/**
 * Status badge for user enquiries.
 *
 * @param {Object} props
 * @param {string} props.status
 */
export function EnquiryStatusBadge({ status = "pending" }) {
  const normalized = String(status || "pending").trim().toLowerCase();
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <span className={`user-enquiry-status ${normalized}`}>
      {label}
    </span>
  );
}

export default EnquiryStatusBadge;
