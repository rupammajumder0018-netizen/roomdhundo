import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ownerService } from "../../services/owner/index.js";
import { ROUTE_PATHS } from "../../routes/paths";

import OwnerSidebar from "../../components/owner/OwnerSidebar";
import OwnerStatCards from "../../components/owner/OwnerStatCards";
import OwnerPropertyCard from "../../components/owner/OwnerPropertyCard";
import RoomAvailabilityTable from "../../components/owner/RoomAvailabilityTable";
import OwnerEnquiryCard from "../../components/owner/OwnerEnquiryCard";
import OwnerProfileSection from "../../components/owner/OwnerProfileSection";

export default function OwnerDashboardPage() {
  const { user, profile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    properties: [],
    enquiries: [],
    stats: {
      totalProperties: 0,
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      totalEnquiries: 0,
    },
  });

  // Enquiries filter & search state
  const [enquirySearch, setEnquirySearch] = useState("");
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState("all");

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchErr } = await ownerService.fetchOwnerDashboardData(user.id);
    if (fetchErr) {
      setError(fetchErr.message || "Failed to load owner dashboard.");
    } else if (data) {
      setDashboardData(data);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle property availability quick toggle
  const handleTogglePropertyAvailability = async (buildingId, newStatus) => {
    const { success, error: err } = await ownerService.updatePropertyAvailability(
      buildingId,
      user.id,
      newStatus
    );
    if (!success) {
      alert(err?.message || "Failed to update property status.");
    } else {
      loadData();
    }
  };

  // Handle room availability toggle
  const handleToggleRoomStatus = async (roomId, buildingId, currentAvailable) => {
    const { success, error: err } = await ownerService.toggleRoomStatus(
      roomId,
      buildingId,
      currentAvailable
    );
    if (!success) {
      alert(err?.message || "Failed to update room status.");
    } else {
      loadData();
    }
  };

  // Handle property deletion
  const handleDeleteProperty = async (buildingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this property? This will permanently remove all associated rooms and details."
    );
    if (!confirmed) return;

    const { success, error: err } = await ownerService.deleteOwnerProperty(
      buildingId,
      user.id
    );
    if (!success) {
      alert(err?.message || "Failed to delete property.");
    } else {
      loadData();
    }
  };

  // Handle enquiry status update
  const handleUpdateEnquiryStatus = async (enquiryId, newStatus) => {
    const { success, error: err } = await ownerService.updateOwnerEnquiryStatus(
      enquiryId,
      user.id,
      newStatus
    );
    if (!success) {
      alert(err?.message || "Failed to update enquiry status.");
    } else {
      loadData();
    }
  };

  // Handle owner profile update
  const handleUpdateProfile = async ({ full_name, phone }) => {
    const { success, error: err } = await ownerService.updateOwnerProfile({
      userId: user.id,
      full_name,
      phone,
    });
    if (!success) {
      throw err || new Error("Failed to update profile.");
    }
    if (refreshProfile) {
      await refreshProfile();
    }
    loadData();
  };

  // Count pending enquiries
  const pendingEnquiriesCount = useMemo(() => {
    return dashboardData.enquiries.filter((e) => e.status === "pending").length;
  }, [dashboardData.enquiries]);

  // Filtered enquiries list
  const filteredEnquiries = useMemo(() => {
    return dashboardData.enquiries.filter((enq) => {
      // Status filter
      if (enquiryStatusFilter !== "all" && enq.status !== enquiryStatusFilter) {
        return false;
      }
      // Text search
      if (enquirySearch.trim()) {
        const query = enquirySearch.toLowerCase();
        const renterName = (enq.renter?.full_name || "").toLowerCase();
        const renterPhone = (enq.renter?.phone || "").toLowerCase();
        const propName = (enq.property?.name || "").toLowerCase();
        const msg = (enq.message || "").toLowerCase();
        return (
          renterName.includes(query) ||
          renterPhone.includes(query) ||
          propName.includes(query) ||
          msg.includes(query)
        );
      }
      return true;
    });
  }, [dashboardData.enquiries, enquiryStatusFilter, enquirySearch]);

  const ownerName = profile?.full_name || user?.user_metadata?.full_name || "Owner";

  return (
    <div className="owner-dashboard-layout">
      <OwnerSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        pendingEnquiriesCount={pendingEnquiriesCount}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="owner-main-content">
        <header className="owner-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              type="button"
              className="owner-menu-toggle"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              ☰
            </button>
            <div className="owner-topbar-title">
              <h1>Owner Portal</h1>
              <p>Welcome back, {ownerName}</p>
            </div>
          </div>

          <div className="owner-topbar-right">
            <Link to={ROUTE_PATHS.LIST_PROPERTY} className="owner-add-prop-btn">
              <span>+</span> List New Property
            </Link>
          </div>
        </header>

        <main className="owner-dashboard-content">
          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                padding: "14px 18px",
                borderRadius: "12px",
                marginBottom: "20px",
                fontWeight: 600,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Section: Dashboard Overview */}
          <section id="dashboard" className="owner-section-block">
            <div className="owner-welcome-banner">
              <div className="owner-welcome-text">
                <h2>Welcome, {ownerName}!</h2>
                <p>Manage your listings, room occupancy, and incoming renter enquiries.</p>
              </div>
              <Link to={ROUTE_PATHS.LIST_PROPERTY} className="owner-add-prop-btn">
                <span>➕</span> Add Property
              </Link>
            </div>

            <OwnerStatCards
              totalProperties={dashboardData.stats.totalProperties}
              totalRooms={dashboardData.stats.totalRooms}
              availableRooms={dashboardData.stats.availableRooms}
              occupiedRooms={dashboardData.stats.occupiedRooms}
            />
          </section>

          {/* Section: My Properties */}
          <section id="properties" className="owner-section-block">
            <div className="owner-section-header">
              <div>
                <h2>My Properties</h2>
                <p>All active, pending, or occupied properties you have listed.</p>
              </div>
              <Link to={ROUTE_PATHS.LIST_PROPERTY} className="owner-action-btn edit" style={{ flex: "0 0 auto", padding: "8px 14px" }}>
                + Add Property
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--rd-muted, #3a6f86)" }}>
                Loading properties...
              </div>
            ) : dashboardData.properties.length === 0 ? (
              <div
                style={{
                  background: "var(--rd-surface, #ffffff)",
                  border: "1px dashed var(--rd-border, #c6ead9)",
                  borderRadius: "16px",
                  padding: "48px 24px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏢</div>
                <h3 style={{ margin: "0 0 6px", color: "var(--rd-text, #22577A)" }}>
                  No Properties Listed Yet
                </h3>
                <p style={{ color: "var(--rd-muted, #3a6f86)", margin: "0 0 18px", fontSize: "14px" }}>
                  Start by listing your PG, Flat, or Hotel to begin receiving bookings.
                </p>
                <Link to={ROUTE_PATHS.LIST_PROPERTY} className="owner-add-prop-btn" style={{ background: "var(--rd-accent, #38A3A5)", color: "#fff" }}>
                  List Your First Property
                </Link>
              </div>
            ) : (
              <div className="owner-property-grid">
                {dashboardData.properties.map((property) => (
                  <OwnerPropertyCard
                    key={property.id}
                    property={property}
                    onToggleStatus={handleTogglePropertyAvailability}
                    onDelete={handleDeleteProperty}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Section: Room Availability */}
          <section id="rooms" className="owner-section-block">
            <div className="owner-section-header">
              <div>
                <h2>Room & Bed Availability</h2>
                <p>Toggle individual rooms between Available and Occupied in real-time.</p>
              </div>
            </div>

            <RoomAvailabilityTable
              properties={dashboardData.properties}
              onToggleRoom={handleToggleRoomStatus}
            />
          </section>

          {/* Section: Enquiries */}
          <section id="enquiries" className="owner-section-block">
            <div className="owner-section-header">
              <div>
                <h2>Renter Enquiries ({dashboardData.enquiries.length})</h2>
                <p>Direct contact requests from prospective tenants.</p>
              </div>

              <div className="owner-enquiries-controls">
                <input
                  type="text"
                  className="owner-search-input"
                  placeholder="🔍 Search name, phone..."
                  value={enquirySearch}
                  onChange={(e) => setEnquirySearch(e.target.value)}
                />

                <select
                  className="owner-filter-select"
                  value={enquiryStatusFilter}
                  onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="contacted">Contacted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--rd-muted, #3a6f86)" }}>
                Loading enquiries...
              </div>
            ) : filteredEnquiries.length === 0 ? (
              <div
                style={{
                  background: "var(--rd-surface, #ffffff)",
                  border: "1px dashed var(--rd-border, #c6ead9)",
                  borderRadius: "16px",
                  padding: "40px 20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>💬</div>
                <h3 style={{ margin: "0 0 4px", color: "var(--rd-text, #22577A)" }}>
                  No Enquiries Found
                </h3>
                <p style={{ color: "var(--rd-muted, #3a6f86)", margin: 0, fontSize: "13px" }}>
                  {enquirySearch || enquiryStatusFilter !== "all"
                    ? "Try adjusting your search or filter."
                    : "When prospective renters enquire about your listings, they will appear here."}
                </p>
              </div>
            ) : (
              <div className="owner-enquiries-list">
                {filteredEnquiries.map((enquiry) => (
                  <OwnerEnquiryCard
                    key={enquiry.id}
                    enquiry={enquiry}
                    onUpdateStatus={handleUpdateEnquiryStatus}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Section: Profile */}
          <section id="profile" className="owner-section-block">
            <div className="owner-section-header">
              <div>
                <h2>Owner Profile & Contact Details</h2>
                <p>Update your contact phone number to sync across your listings.</p>
              </div>
            </div>

            <OwnerProfileSection
              profile={profile}
              propertiesCount={dashboardData.properties.length}
              onUpdateProfile={handleUpdateProfile}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
