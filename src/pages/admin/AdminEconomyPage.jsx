import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import { fetchAdminEconomyDeals } from "../../services/admin/adminService.js";

export function AdminEconomyPage() {
  const { onToggleMobileMenu } = useOutletContext();
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadEconomy() {
      setIsLoading(true);
      try {
        const res = await fetchAdminEconomyDeals();
        if (!isMounted) return;
        if (res.data) setDeals(res.data);
      } catch (err) {
        console.warn("[Roomdhundo] Economy load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadEconomy();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="admin-page-container">
      <AdminHeader
        title="Economy"
        subtitle="Platform transaction insights, promotional deals, and subscription overview."
        onToggleMobileMenu={onToggleMobileMenu}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#22577A15", color: "#22577A" }}>
            💰
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Deals</span>
            <strong className="stat-value">{deals.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#38A3A515", color: "#38A3A5" }}>
            📈
          </div>
          <div className="stat-info">
            <span className="stat-label">Platform Margin</span>
            <strong className="stat-value">Standard</strong>
          </div>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? (
          <p className="no-data-msg">Loading economy deals...</p>
        ) : deals.length === 0 ? (
          <p className="no-data-msg">No active economy deals or packages registered yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Deal Title</th>
                <th>Category</th>
                <th>Price / Value</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td data-label="Deal Title">
                    <strong>{deal.title || "Special Deal"}</strong>
                  </td>
                  <td data-label="Category">{deal.category || "General"}</td>
                  <td data-label="Price / Value">
                    {deal.price ? `₹${Number(deal.price).toLocaleString("en-IN")}` : "Free"}
                  </td>
                  <td data-label="Status">
                    <span className="status-pill status-approved">{deal.status || "Active"}</span>
                  </td>
                  <td data-label="Created At">
                    {deal.created_at ? new Date(deal.created_at).toLocaleDateString("en-IN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminEconomyPage;
