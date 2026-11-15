import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { PATHS } from "../../routes/paths.js";

export function AdminSidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate("/");
  };

  const navItems = [
    { to: PATHS.ADMIN, end: true, label: "📊 Dashboard" },
    { to: PATHS.ADMIN_PROPERTIES, label: "🏠 Properties" },
    { to: PATHS.ADMIN_PROFILES, label: "👤 Registered Profiles" },
    { to: PATHS.ADMIN_ENQUIRIES, label: "📩 Enquiries" },
    { to: PATHS.ADMIN_AGENTS, label: "🤝 Agents" },
    { to: PATHS.ADMIN_REVIEWS, label: "⭐ Reviews" },
    { to: PATHS.ADMIN_ECONOMY, label: "💰 Economy" },
    { to: PATHS.ADMIN_SETTINGS, label: "⚙️ Settings" },
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`} id="adminSidebar">
        <div className="admin-logo">
          <h2>Pg Dhundo</h2>
          <span>Admin Panel</span>
        </div>

        <nav className="admin-nav" aria-label="Admin Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link to="/" className="view-website-btn" onClick={onClose}>
            🌐 View Website
          </Link>
          <button
            type="button"
            id="adminLogoutBtn"
            onClick={handleLogout}
            style={{ display: "flex" }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="sidebar-backdrop"
          id="sidebarBackdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
}

export default AdminSidebar;
