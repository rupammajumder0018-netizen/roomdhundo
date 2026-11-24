import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { accountKindLabel } from "../../services/auth/index.js";
import { fetchSavedPropertiesCount } from "../../services/properties/index.js";
import { fetchUserEnquiriesCount } from "../../services/enquiries/index.js";
import { PATHS } from "../../routes/paths.js";
import { UserDashboardHeader } from "../../components/user/UserDashboardHeader.jsx";
import { UserStatCards } from "../../components/user/UserStatCards.jsx";
import { UserProfileSection } from "../../components/user/UserProfileSection.jsx";
import { UserHotelBookingsSection } from "../../components/user/UserHotelBookingsSection.jsx";
import { UserPgBookingsSection } from "../../components/user/UserPgBookingsSection.jsx";

export function UserDashboardPage() {
  const { user, profile, roleKind, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [savedCount, setSavedCount] = useState(0);
  const [enquiryCount, setEnquiryCount] = useState(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  const loadCounts = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingCounts(true);
    try {
      const [savedRes, enquiryRes] = await Promise.all([
        fetchSavedPropertiesCount(user.id),
        fetchUserEnquiriesCount(user.id),
      ]);

      if (!savedRes.error) {
        setSavedCount(savedRes.count || 0);
      }
      if (!enquiryRes.error) {
        setEnquiryCount(enquiryRes.count || 0);
      }
    } catch (err) {
      console.error("[Roomdhundo] Error loading dashboard stats:", err);
    } finally {
      setIsLoadingCounts(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;
    await logout();
    navigate(PATHS.HOME);
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const roleLabel = accountKindLabel(roleKind);

  return (
    <main className="renter-dashboard">
      <div className="renter-dashboard-container">
        {/* HEADER */}
        <UserDashboardHeader
          displayName={displayName}
          roleLabel={roleLabel}
        />

        {/* STAT CARDS */}
        <UserStatCards
          savedCount={savedCount}
          enquiryCount={enquiryCount}
          roleLabel={roleLabel}
          isLoading={isLoadingCounts}
        />

        {/* MY PROFILE SECTION */}
        <UserProfileSection
          user={user}
          profile={profile}
          displayName={displayName}
          roleLabel={roleLabel}
          onProfileUpdated={refreshProfile}
        />

        {/* ACCOUNT OPTIONS */}
        <div className="renter-dashboard-section">
          <div className="dashboard-section-title">
            <div>
              <h2>Account</h2>
              <p>Access your saved properties and enquiries.</p>
            </div>
          </div>

          <div className="account-option-list">
            {/* EXPLORE */}
            <Link
              to={PATHS.SEARCH}
              className="renter-action-card"
              id="dashboardExploreBtn"
            >
              <span className="action-icon" aria-hidden="true">
                🔎
              </span>
              <span className="action-content">
                <strong>Explore Properties</strong>
                <small>Find rooms, PGs and other stays.</small>
              </span>
              <span className="action-arrow" aria-hidden="true">
                →
              </span>
            </Link>

            {/* SAVED */}
            <Link
              to={PATHS.SAVED}
              className="renter-action-card"
              id="dashboardSavedBtn"
            >
              <span className="action-icon" aria-hidden="true">
                ❤️
              </span>
              <span className="action-content">
                <strong>Saved Properties</strong>
                <small>View properties you have saved.</small>
              </span>
              <span className="action-arrow" aria-hidden="true">
                →
              </span>
            </Link>

            {/* MY ENQUIRIES */}
            <Link
              to={PATHS.ENQUIRIES}
              className="renter-action-card"
              id="dashboardEnquiriesBtn"
            >
              <span className="action-icon" aria-hidden="true">
                📩
              </span>
              <span className="action-content">
                <strong>My Enquiries</strong>
                <small>
                  Track the enquiries you have sent to property owners.
                </small>
              </span>
              <span className="action-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* NEED HELP */}
        <div className="renter-dashboard-section need-help-section">
          <div className="dashboard-section-title">
            <div>
              <h2>Need Help?</h2>
              <p>Have a question or need assistance? Contact Pg Dhundo.</p>
            </div>
          </div>

          <a
            href="https://wa.me/919382991409?text=Hello%20Pg%20Dhundo%2C%20I%20need%20help%20with%20my%20account."
            target="_blank"
            rel="noopener noreferrer"
            className="need-help-whatsapp-btn"
            id="needHelpWhatsAppBtn"
          >
            <span>💬</span> WhatsApp Pg Dhundo
            <span aria-hidden="true">→</span>
          </a>
        </div>

        {/* EXPLORE BANNER */}
        <div className="renter-explore-box">
          <div>
            <span className="dashboard-label">FIND YOUR NEXT STAY</span>
            <h2>Find a room that feels like home.</h2>
            <p>
              Explore rooms, PGs and other accommodation options around MAKAUT,
              Jaguli, and Haringhata.
            </p>
          </div>

          <Link to={PATHS.SEARCH} id="dashboardExploreMainBtn">
            Explore Properties →
          </Link>
        </div>

        {/* MY PG & ROOM RESERVATIONS */}
        {user?.id && <UserPgBookingsSection userId={user.id} />}

        {/* MY HOTEL BOOKINGS */}
        {user?.id && <UserHotelBookingsSection userId={user.id} />}

        {/* LOGOUT */}
        <div className="renter-logout-area">
          <button
            type="button"
            className="dashboard-logout-btn"
            id="dashboardLogoutBtn"
            onClick={handleLogout}
          >
            🚪 Log Out
          </button>
        </div>
      </div>
    </main>
  );
}

export default UserDashboardPage;
