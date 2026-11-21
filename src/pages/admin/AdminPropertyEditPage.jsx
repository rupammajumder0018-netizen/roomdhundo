import React, { useEffect, useState } from "react";
import { Link, useOutletContext, useParams, useNavigate } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import DynamicPropertyForm from "../../components/listings/DynamicPropertyForm.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { PATHS } from "../../routes/paths.js";
import { fetchAdminProperty } from "../../services/admin/adminService.js";

export default function AdminPropertyEditPage() {
  const { propertyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { onToggleMobileMenu } = useOutletContext() || {};

  const isNew = !propertyId || propertyId === "new";
  const [loading, setLoading] = useState(!isNew);
  const [propertyData, setPropertyData] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }

    let active = true;
    async function loadProperty() {
      setLoading(true);
      setLoadError("");
      const { data, error } = await fetchAdminProperty(propertyId);
      if (!active) return;

      if (error || !data) {
        setLoadError(error?.message || "Failed to load this property for editing.");
      } else {
        setPropertyData(data);
      }
      setLoading(false);
    }

    loadProperty();
    return () => {
      active = false;
    };
  }, [propertyId, isNew]);

  return (
    <div className="admin-page-container">
      <AdminHeader
        title={isNew ? "Add New Property" : "Edit Property Listing"}
        subtitle={
          isNew
            ? "Create and publish a new accommodation listing with dynamic industry-level specifications."
            : `Updating "${propertyData?.name || "Property"}" (${propertyData?.location || ""}).`
        }
        onToggleMobileMenu={onToggleMobileMenu}
      />

      <div style={{ marginBottom: "20px" }}>
        <Link
          to={PATHS.ADMIN_PROPERTIES}
          className="action-btn view-btn"
          style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}
        >
          ← Back to Properties
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--rd-muted, #64748b)" }}>
          Loading property details...
        </div>
      ) : loadError ? (
        <div
          style={{
            background: "#fee2e2",
            color: "#dc2626",
            padding: "20px",
            borderRadius: "12px",
            fontWeight: 600,
          }}
        >
          ⚠️ {loadError}
        </div>
      ) : (
        <DynamicPropertyForm
          initialData={propertyData}
          mode={isNew ? "create" : "edit"}
          userRole="admin"
          userId={user?.id}
          onSaveSuccess={() => {
            navigate(PATHS.ADMIN_PROPERTIES);
          }}
          onCancel={() => {
            navigate(PATHS.ADMIN_PROPERTIES);
          }}
        />
      )}
    </div>
  );
}
