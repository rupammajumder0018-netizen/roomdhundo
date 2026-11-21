import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { fetchPropertyForEdit } from "../../services/owner/index.js";
import DynamicPropertyForm from "../../components/listings/DynamicPropertyForm.jsx";
import { ROUTE_PATHS } from "../../routes/paths.js";
import { PROPERTY_CATEGORIES, getCategoryById } from "../../constants/categories.js";

export default function PropertyListingFormPage({ defaultCategory = null }) {
  const { user, roleKind, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("edit");
  const isEdit = Boolean(editId);
  const categoryParam = searchParams.get("category") || defaultCategory || "pg_hostels";

  const [loading, setLoading] = useState(isEdit);
  const [propertyData, setPropertyData] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }

    let active = true;
    async function loadData() {
      setLoading(true);
      setLoadError("");
      const { data, error } = await fetchPropertyForEdit(editId, user?.id, isAdmin);
      if (!active) return;

      if (error || !data) {
        setLoadError(error?.message || "Failed to load property details for editing.");
      } else {
        setPropertyData(data);
      }
      setLoading(false);
    }

    if (user?.id) {
      loadData();
    }

    return () => {
      active = false;
    };
  }, [editId, isEdit, user?.id, isAdmin]);

  // If a default category is provided and not editing, seed initialData with that category
  const initialFormSeed = propertyData || {
    category: categoryParam,
  };

  const redirectDashboard = isAdmin ? "/admin/properties" : "/owner/dashboard";

  return (
    <div className="bg-[var(--rd-bg)] text-[var(--rd-text)] min-h-screen py-8">
      <div className="listing-form-wrapper" style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 20px" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <Link
            to={isEdit ? redirectDashboard : ROUTE_PATHS.LIST_PROPERTY}
            className="secondary-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
          >
            ← {isEdit ? "Back to Dashboard" : "Back to Categories"}
          </Link>

          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: "999px",
              background: "var(--rd-surface-soft, #f1f5f9)",
              color: "var(--rd-text, #22577a)",
              border: "1px solid var(--rd-border, #cbd5e1)",
            }}
          >
            {isAdmin ? "Admin Listing Mode" : roleKind === "agent" ? "Agent Listing Mode" : "Owner Listing Mode"}
          </span>
        </div>

        {/* Page Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px 0", color: "var(--rd-text, #22577a)" }}>
            {isEdit ? "Edit Property Listing" : "List Your Property"}
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: "var(--rd-muted, #3a6f86)" }}>
            {isEdit
              ? `Updating listing for "${propertyData?.name || "Property"}"`
              : "Complete the dynamic specifications below. Your listing will be reviewed and published across Pg Dhundo."}
          </p>
        </div>

        {/* Form Body */}
        {loading ? (
          <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--rd-muted, #3a6f86)" }}>
            Loading property details...
          </div>
        ) : loadError ? (
          <div
            style={{
              background: "#fee2e2",
              color: "#dc2626",
              padding: "24px",
              borderRadius: "14px",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            ⚠️ {loadError}
            <div style={{ marginTop: "16px" }}>
              <Link to={redirectDashboard} className="secondary-btn" style={{ textDecoration: "none" }}>
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <DynamicPropertyForm
            initialData={initialFormSeed}
            mode={isEdit ? "edit" : "create"}
            userRole={isAdmin ? "admin" : roleKind === "agent" ? "agent" : "owner"}
            userId={user?.id}
            onSaveSuccess={() => {
              navigate(redirectDashboard);
            }}
            onCancel={() => {
              navigate(redirectDashboard);
            }}
          />
        )}
      </div>
    </div>
  );
}
