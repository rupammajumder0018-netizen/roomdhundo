import React from "react";

export function AdminEnquiryTable({
  enquiries = [],
  onStatusChange,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="table-container">
        <p className="no-data-msg">Loading enquiries...</p>
      </div>
    );
  }

  if (!enquiries || enquiries.length === 0) {
    return (
      <div className="table-container">
        <p className="no-data-msg">No enquiries found.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Applicant / Tenant</th>
            <th>Contact Details</th>
            <th>Message</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {enquiries.map((enquiry) => {
            const propName = enquiry.buildings?.name || enquiry.property_name || "Unknown Property";
            const propLocation = enquiry.buildings?.location || "";
            const currentStatus = String(enquiry.status || "pending").toLowerCase();

            const dateStr = enquiry.created_at
              ? new Date(enquiry.created_at).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—";

            return (
              <tr key={enquiry.id}>
                <td data-label="Property">
                  <strong>{propName}</strong>
                  {propLocation && <span className="table-subtext">📍 {propLocation}</span>}
                </td>
                <td data-label="Applicant / Tenant">
                  <strong>{enquiry.name || "Prospective Tenant"}</strong>
                </td>
                <td data-label="Contact Details">
                  <div>📞 {enquiry.phone || "—"}</div>
                  {enquiry.email && <div className="table-subtext">✉️ {enquiry.email}</div>}
                </td>
                <td data-label="Message" className="table-msg-cell">
                  {enquiry.message ? (
                    <span title={enquiry.message}>{enquiry.message}</span>
                  ) : (
                    <span className="table-subtext">No message provided</span>
                  )}
                </td>
                <td data-label="Status">
                  <select
                    className="admin-status-select"
                    value={currentStatus}
                    onChange={(e) => onStatusChange(enquiry.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td data-label="Date">{dateStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminEnquiryTable;
