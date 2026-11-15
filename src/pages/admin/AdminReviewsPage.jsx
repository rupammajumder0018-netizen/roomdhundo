import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminReviewTable from "../../components/admin/AdminReviewTable.jsx";
import {
  fetchAdminReviews,
  deleteAdminReview,
} from "../../services/admin/adminService.js";

export function AdminReviewsPage() {
  const { onToggleMobileMenu } = useOutletContext();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminReviews();
      if (res.data) setReviews(res.data);
    } catch (err) {
      console.warn("[Roomdhundo] Error loading reviews:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    const res = await deleteAdminReview(reviewId);
    if (res.success) {
      setActionMessage({ type: "success", text: "Review deleted successfully." });
      loadReviews();
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Failed to delete review." });
    }
  };

  return (
    <div className="admin-page-container">
      <AdminHeader
        title="Reviews"
        subtitle="Moderate tenant feedback and ratings submitted across Pg Dhundo properties."
        onToggleMobileMenu={onToggleMobileMenu}
      />

      {actionMessage && (
        <div
          className={`admin-alert ${
            actionMessage.type === "success" ? "admin-alert-success" : "admin-alert-error"
          }`}
          role="alert"
        >
          {actionMessage.text}
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setActionMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      <AdminReviewTable
        reviews={reviews}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}

export default AdminReviewsPage;
