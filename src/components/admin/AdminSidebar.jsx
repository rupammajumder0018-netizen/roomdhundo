import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Hotel,
  Users,
  Inbox,
  UserCheck,
  Star,
  TrendingUp,
  Settings,
  Globe,
  LogOut,
  ShieldCheck,
} from "lucide-react";
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
    { to: PATHS.ADMIN, end: true, label: "Dashboard", icon: LayoutDashboard },
    { to: PATHS.ADMIN_PROPERTIES, label: "Properties", icon: Building2 },
    { to: PATHS.ADMIN_HOTEL_BOOKINGS, label: "Hotel Bookings", icon: Hotel },
    { to: PATHS.ADMIN_PROFILES, label: "Registered Profiles", icon: Users },
    { to: PATHS.ADMIN_ENQUIRIES, label: "Enquiries", icon: Inbox },
    { to: PATHS.ADMIN_AGENTS, label: "Agents", icon: UserCheck },
    { to: PATHS.ADMIN_REVIEWS, label: "Reviews", icon: Star },
    { to: PATHS.ADMIN_ECONOMY, label: "Economy", icon: TrendingUp },
    { to: PATHS.ADMIN_SETTINGS, label: "Settings", icon: Settings },
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`} id="adminSidebar">
        <div className="admin-logo">
          <div className="admin-logo-badge">
            <ShieldCheck size={22} className="admin-brand-icon" />
          </div>
          <div className="admin-logo-text">
            <h2>Pg Dhundo</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                onClick={onClose}
              >
                <Icon size={18} className="nav-item-icon" />
                <span className="nav-item-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <Link to="/" className="view-website-btn" onClick={onClose}>
            <Globe size={16} />
            <span>View Website</span>
          </Link>
          <button
            type="button"
            id="adminLogoutBtn"
            onClick={handleLogout}
            style={{ display: "flex" }}
          >
            <LogOut size={16} />
            <span>Logout</span>
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
