import React from "react";
import { Star, Trash2 } from "lucide-react";

export function AdminReviewTable({
  reviews = [],
  onDelete,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="table-container">
        <p className="no-data-msg">Loading reviews...</p>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="table-container">
        <p className="no-data-msg">No customer reviews found.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Reviewer</th>
            <th>Rating</th>
            <th>Feedback</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((rev) => {
            const propName = rev.buildings?.name || "Property";
            const dateStr = rev.created_at
              ? new Date(rev.created_at).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—";

            return (
              <tr key={rev.id}>
                <td data-label="Property">
                  <strong>{propName}</strong>
                </td>
                <td data-label="Reviewer">
                  <strong>{rev.user_name || "Verified Tenant"}</strong>
                </td>
                <td data-label="Rating">
                  <span className="star-rating-pill">
                    <Star size={13} className="star-icon-inline" />
                    <span>{rev.rating || 5}/5</span>
                  </span>
                </td>
                <td data-label="Feedback" className="table-msg-cell">
                  {rev.comment ? (
                    <span title={rev.comment}>{rev.comment}</span>
                  ) : (
                    <span className="table-subtext">No comment</span>
                  )}
                </td>
                <td data-label="Date">{dateStr}</td>
                <td data-label="Actions">
                  <button
                    type="button"
                    className="action-btn delete-btn"
                    onClick={() => onDelete(rev.id)}
                    title="Delete Review"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminReviewTable;
