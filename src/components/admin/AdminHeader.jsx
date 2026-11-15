import React from "react";
import { useAuth } from "../../hooks/useAuth.js";

export function AdminHeader({ title, subtitle, onToggleMobileMenu }) {
  const { user, profile } = useAuth();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Administrator";

  const initial = displayName.trim().charAt(0).toUpperCase() || "A";

  return (
    <>
      <div className="mobile-bar">
        <button
          type="button"
          id="mobileMenuBtn"
          className="mobile-menu-btn"
          aria-label="Open menu"
          onClick={onToggleMobileMenu}
        >
          ☰
        </button>
        <strong>Pg Dhundo Admin</strong>
      </div>

      <header className="topbar">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="admin-profile">
          <div className="profile-avatar">{initial}</div>
          <div>
            <strong>{displayName}</strong>
            <span>Administrator</span>
          </div>
        </div>
      </header>
    </>
  );
}

export default AdminHeader;
