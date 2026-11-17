import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminStatCards from "../../components/admin/AdminStatCards.jsx";
import AdminPropertyTable from "../../components/admin/AdminPropertyTable.jsx";
import {
  fetchAdminDashboardStats,
  fetchAdminProperties,
  updatePropertyVerificationStatus,
  deleteAdminProperty,
} from "../../services/admin/adminService.js";
import { PATHS } from "../../routes/paths.js";

export function AdminDashboardPage() {
  const { onToggleMobileMenu } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [statsRes, propsRes] = await Promise.all([
          fetchAdminDashboardStats(),
          fetchAdminProperties({ verificationFilter: "pending" }),
        ]);

        if (!isMounted) return;
        if (statsRes.data) setStats(statsRes.data);
        if (propsRes.data) setPendingProperties(propsRes.data.slice(0, 5));
      } catch (err) {
        console.warn("[Roomdhundo] Admin dashboard load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleApprove = async (id) => {
    const res = await updatePropertyVerificationStatus(id, "approved");
    if (res.success) {
      setPendingProperties((prev) => prev.filter((p) => p.id !== id));
      setActionMessage({ type: "success", text: "Property listing approved and published." });
      const statsRes = await fetchAdminDashboardStats();
      if (statsRes.data) setStats(statsRes.data);
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Failed to approve property." });
    }
  };

  const handleReject = async (id) => {
    const res = await updatePropertyVerificationStatus(id, "rejected");
    if (res.success) {
      setPendingProperties((prev) => prev.filter((p) => p.id !== id));
      setActionMessage({ type: "success", text: "Property listing rejected." });
      const statsRes = await fetchAdminDashboardStats();
      if (statsRes.data) setStats(statsRes.data);
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Failed to reject property." });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name || "this property"}"?`)) return;
    const res = await deleteAdminProperty(id);
    if (res.success) {
      setPendingProperties((prev) => prev.filter((p) => p.id !== id));
      setActionMessage({ type: "success", text: "Property deleted successfully." });
      const statsRes = await fetchAdminDashboardStats();
      if (statsRes.data) setStats(statsRes.data);
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Failed to delete property." });
    }
  };

  return (
    <div className="admin-page-container">
      <AdminHeader
        title="Dashboard"
        subtitle="Welcome back, Admin. Here's what's happening on Pg Dhundo today."
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

      {/* Statistics Grid */}
      <AdminStatCards stats={stats} />

      {/* Moderation Quick Overview */}
      <section className="admin-card-section">
        <div className="section-header">
          <div>
            <h2>Pending Property Approvals</h2>
            <p>New listings submitted by owners requiring administrative verification.</p>
          </div>
          <Link to={PATHS.ADMIN_PROPERTIES} className="view-all-btn">
            View All Properties →
          </Link>
        </div>

        <AdminPropertyTable
          properties={pendingProperties}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </section>
    </div>
  );
}

export default AdminDashboardPage;
