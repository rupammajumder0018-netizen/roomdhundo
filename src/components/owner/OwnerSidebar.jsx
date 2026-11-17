import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTE_PATHS } from "../../routes/paths";

export default function OwnerSidebar({
  activeSection,
  setActiveSection,
  pendingEnquiriesCount = 0,
  isOpen = false,
  onClose = () => {},
}) {
  const { logout } = useAuth();

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    onClose();
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <div
        className={`owner-sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`owner-sidebar ${isOpen ? "open" : ""}`} aria-label="Owner navigation">
        <Link to={ROUTE_PATHS.HOME} className="owner-sidebar-logo">
          <div className="owner-sidebar-logo-icon">🏢</div>
          <div className="owner-sidebar-logo-text">
            <h2>Roomdhundo</h2>
            <span>Owner Portal</span>
          </div>
        </Link>

        <nav className="owner-sidebar-nav">
          <button
            type="button"
            className={`owner-nav-link ${activeSection === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
          >
            <span>📊</span> Dashboard
          </button>

          <button
            type="button"
            className={`owner-nav-link ${activeSection === "properties" ? "active" : ""}`}
            onClick={() => handleNavClick("properties")}
          >
            <span>🏠</span> My Properties
          </button>

          <button
            type="button"
            className={`owner-nav-link ${activeSection === "rooms" ? "active" : ""}`}
            onClick={() => handleNavClick("rooms")}
          >
            <span>🛏️</span> Room Availability
          </button>

          <button
            type="button"
            className={`owner-nav-link ${activeSection === "hotel-bookings" ? "active" : ""}`}
            onClick={() => handleNavClick("hotel-bookings")}
          >
            <span>🏨</span> Hotel Bookings
          </button>

          <button
            type="button"
            className={`owner-nav-link ${activeSection === "enquiries" ? "active" : ""}`}
            onClick={() => handleNavClick("enquiries")}
          >
            <span>💬</span> Enquiries
            {pendingEnquiriesCount > 0 && (
              <span className="notification-count" style={{
                background: "var(--rd-accent, #38A3A5)",
                color: "#fff",
                borderRadius: "50%",
                padding: "2px 6px",
                fontSize: "11px",
                marginLeft: "auto",
                fontWeight: 700
              }}>
                {pendingEnquiriesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`owner-nav-link ${activeSection === "profile" ? "active" : ""}`}
            onClick={() => handleNavClick("profile")}
          >
            <span>👤</span> Profile Settings
          </button>
        </nav>

        <div className="owner-sidebar-bottom">
          <div className="owner-help-box">
            <span style={{ fontSize: "18px" }}>💡</span>
            <div>
              <strong>Need Help?</strong>
              <p>Contact support or read our owner listing guides.</p>
            </div>
          </div>

          <Link to={ROUTE_PATHS.HOME} className="owner-sidebar-btn">
            <span>🌐</span> Back to Website
          </Link>

          <button
            type="button"
            className="owner-sidebar-btn logout"
            onClick={logout}
          >
            <span>🚪</span> Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
