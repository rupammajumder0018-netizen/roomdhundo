import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { fetchUserEnquiriesWithDetails } from "../../services/enquiries/index.js";
import { PATHS } from "../../routes/paths.js";
import { EnquiryCard } from "../../components/user/EnquiryCard.jsx";

export function UserEnquiriesPage() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const loadEnquiries = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await fetchUserEnquiriesWithDetails(
        user.id
      );

      if (fetchErr) {
        setError(fetchErr.message || "Failed to load enquiries.");
        setEnquiries([]);
      } else {
        setEnquiries(data || []);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  // Statistics
  const stats = useMemo(() => {
    const total = enquiries.length;
    let pending = 0;
    let accepted = 0;
    let contacted = 0;
    let rejected = 0;

    enquiries.forEach((item) => {
      const st = String(item.status || "").toLowerCase();
      if (st === "pending") pending++;
      else if (st === "accepted") accepted++;
      else if (st === "contacted") contacted++;
      else if (st === "rejected" || st === "cancelled") rejected++;
    });

    return { total, pending, accepted, contacted, rejected };
  }, [enquiries]);

  // Filtered List
  const filteredEnquiries = useMemo(() => {
    if (activeFilter === "all") return enquiries;
    return enquiries.filter((item) => {
      const st = String(item.status || "").toLowerCase();
      if (activeFilter === "rejected") {
        return st === "rejected" || st === "cancelled";
      }
      return st === activeFilter;
    });
  }, [enquiries, activeFilter]);

  return (
    <main className="enquiries-page">
      <div className="enquiries-container">
        {/* HEADER */}
        <section className="enquiries-header">
          <div>
            <span className="dashboard-label">MY ACCOUNT</span>
            <h1>My Enquiries</h1>
            <p>Track the properties and owners you have contacted.</p>
          </div>
        </section>

        {/* STATS GRID */}
        <section className="enquiry-stats-grid">
          {/* TOTAL */}
          <div className="enquiry-stat-card">
            <div className="enquiry-stat-icon total" aria-hidden="true">
              ✉️
            </div>
            <div>
              <span>Total Enquiries</span>
              <strong id="userTotalEnquiries">{stats.total}</strong>
            </div>
          </div>

          {/* PENDING */}
          <div className="enquiry-stat-card">
            <div className="enquiry-stat-icon pending" aria-hidden="true">
              ⏳
            </div>
            <div>
              <span>Pending</span>
              <strong id="userPendingEnquiries">{stats.pending}</strong>
            </div>
          </div>

          {/* ACCEPTED */}
          <div className="enquiry-stat-card">
            <div className="enquiry-stat-icon accepted" aria-hidden="true">
              ✅
            </div>
            <div>
              <span>Accepted</span>
              <strong id="userAcceptedEnquiries">{stats.accepted}</strong>
            </div>
          </div>

          {/* CONTACTED */}
          <div className="enquiry-stat-card">
            <div className="enquiry-stat-icon contacted" aria-hidden="true">
              📞
            </div>
            <div>
              <span>Contacted</span>
              <strong id="userContactedEnquiries">{stats.contacted}</strong>
            </div>
          </div>

          {/* REJECTED */}
          <div className="enquiry-stat-card">
            <div className="enquiry-stat-icon rejected" aria-hidden="true">
              ❌
            </div>
            <div>
              <span>Rejected</span>
              <strong id="userRejectedEnquiries">{stats.rejected}</strong>
            </div>
          </div>
        </section>

        {/* FILTER BAR */}
        {enquiries.length > 0 && (
          <div className="enquiries-filter-bar">
            <button
              type="button"
              className={`enquiries-filter-chip ${
                activeFilter === "all" ? "is-active" : ""
              }`}
              onClick={() => setActiveFilter("all")}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              className={`enquiries-filter-chip ${
                activeFilter === "pending" ? "is-active" : ""
              }`}
              onClick={() => setActiveFilter("pending")}
            >
              Pending ({stats.pending})
            </button>
            <button
              type="button"
              className={`enquiries-filter-chip ${
                activeFilter === "accepted" ? "is-active" : ""
              }`}
              onClick={() => setActiveFilter("accepted")}
            >
              Accepted ({stats.accepted})
            </button>
            <button
              type="button"
              className={`enquiries-filter-chip ${
                activeFilter === "contacted" ? "is-active" : ""
              }`}
              onClick={() => setActiveFilter("contacted")}
            >
              Contacted ({stats.contacted})
            </button>
            <button
              type="button"
              className={`enquiries-filter-chip ${
                activeFilter === "rejected" ? "is-active" : ""
              }`}
              onClick={() => setActiveFilter("rejected")}
            >
              Rejected ({stats.rejected})
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "var(--rd-muted, #3a6f86)" }}>
              Loading your enquiries...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div
            style={{
              padding: "16px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "10px",
              color: "#b91c1c",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && !error && enquiries.length === 0 && (
          <div className="user-enquiries-empty">
            <div className="user-enquiries-empty-icon" aria-hidden="true">
              ✉️
            </div>
            <h3>No enquiries yet</h3>
            <p>
              When you contact a property owner, your enquiry will appear here.
            </p>
            <Link to={PATHS.SEARCH} className="explore-properties-btn">
              Explore Properties
            </Link>
          </div>
        )}

        {/* LIST */}
        {!isLoading && !error && enquiries.length > 0 && (
          <section className="user-enquiries-section">
            <div className="user-enquiries-list" id="userEnquiriesList">
              {filteredEnquiries.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <p style={{ color: "var(--rd-muted, #3a6f86)" }}>
                    No enquiries match the selected filter.
                  </p>
                </div>
              ) : (
                filteredEnquiries.map((enquiry) => (
                  <EnquiryCard key={enquiry.id} enquiry={enquiry} />
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default UserEnquiriesPage;
