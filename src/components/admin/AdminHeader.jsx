import React from "react";
import { Menu, ShieldCheck } from "lucide-react";
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
          <Menu size={22} />
        </button>
        <div className="mobile-bar-brand">
          <ShieldCheck size={18} className="mobile-brand-icon" />
          <strong>Pg Dhundo Admin</strong>
        </div>
      </div>

      <header className="topbar">
        <div className="topbar-title-wrap">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="admin-profile">
          <div className="profile-avatar">{initial}</div>
          <div className="profile-meta">
            <strong>{displayName}</strong>
            <span className="profile-role-tag">
              <ShieldCheck size={12} />
              <span>Administrator</span>
            </span>
          </div>
        </div>
      </header>
    </>
  );
}

export default AdminHeader;
