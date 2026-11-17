import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export function Header() {
  const { user, profile, roleKind, isAuthenticated, logout } = useAuth();
  const [theme, setTheme] = useState("light");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const routerLocation = useLocation();
  const navigate = useNavigate();

  // Initialize theme from document or localStorage
  useEffect(() => {
    const currentTheme =
      document.documentElement.dataset.theme ||
      localStorage.getItem("roomdhundo-theme") ||
      "light";
    setTheme(currentTheme);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [routerLocation.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("roomdhundo-theme", nextTheme);
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const profileInitial =
    String(displayName || "U").trim().charAt(0).toUpperCase() || "U";

  const isOwner = roleKind === "owner";
  const isAgent = roleKind === "agent";
  const isAdmin = roleKind === "admin";

  const roleLabel = isOwner
    ? "Owner"
    : isAgent
    ? "Agent"
    : isAdmin
    ? "Admin"
    : "Renter";

  const roleClass = isOwner || isAgent || isAdmin ? "owner" : "renter";

  const dashboardPath = isAdmin
    ? "/admin"
    : isOwner || isAgent
    ? "/owner/dashboard"
    : "/dashboard";

  const handleLogout = async () => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main Navigation">
        {/* Left: Brand Logo */}
        <div className="nav-left">
          <Link to="/" className="logo" aria-label="Pg Dhundo Home">
            <span className="logo-icon" aria-hidden="true">🏠</span>
            <span className="logo-text">Pg Dhundo</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="nav-links nav-links-desktop">
          <Link
            to="/list-property"
            className={
              routerLocation.pathname.startsWith("/list-property")
                ? "nav-link is-active"
                : "nav-link"
            }
          >
            List Property
          </Link>

          <Link
            to="/saved"
            className={
              routerLocation.pathname === "/saved"
                ? "nav-link is-active"
                : "nav-link"
            }
          >
            Saved
          </Link>

          {/* User Profile Component or Auth Button */}
          {isAuthenticated ? (
            <div className="nav-profile-wrap" ref={menuRef}>
              <button
                type="button"
                className="nav-profile-toggle"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
              >
                <span className="nav-profile-avatar" aria-hidden="true">
                  {profileInitial}
                </span>

                <span className="nav-profile-info">
                  <span className="nav-profile-name">{displayName}</span>
                  <span className={`nav-profile-role ${roleClass}`}>
                    {roleLabel}
                  </span>
                </span>

                <span className="nav-profile-dots">⋮</span>
              </button>

              {isMenuOpen && (
                <div id="navProfileMenu" className="nav-profile-menu open">
                  <button
                    type="button"
                    className="nav-profile-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate(dashboardPath);
                    }}
                  >
                    <span className="nav-profile-menu-icon">{isAdmin ? "🛡️" : "👤"}</span>
                    <span className="nav-profile-menu-text">
                      <strong>{isAdmin ? "Admin Console" : "My Profile"}</strong>
                      <span>
                        {isAdmin
                          ? "Moderation & System Overview"
                          : isOwner
                          ? "Owner Dashboard"
                          : isAgent
                          ? "Agent listings"
                          : "User Dashboard"}
                      </span>
                    </span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      className="nav-profile-menu-item"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/owner/dashboard");
                      }}
                    >
                      <span className="nav-profile-menu-icon">🏠</span>
                      <span className="nav-profile-menu-text">
                        <strong>Owner Dashboard</strong>
                        <span>Manage properties and rooms</span>
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="nav-profile-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate("/login");
                    }}
                  >
                    <span className="nav-profile-menu-icon">👥</span>
                    <span className="nav-profile-menu-text">
                      <strong>Add Another Account</strong>
                      <span>Sign in with another account</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="nav-profile-menu-item danger"
                    onClick={handleLogout}
                  >
                    <span className="nav-profile-menu-icon">🚪</span>
                    <span className="nav-profile-menu-text">
                      <strong>Logout</strong>
                      <span>Sign out of Pg Dhundo</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div id="authLinks" className="auth-links">
              <Link to="/login" className="nav-auth-btn" id="navAuthBtn">
                Log In / Sign Up
              </Link>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="theme-toggle"
            id="themeToggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>

        {/* Mobile Actions: Theme Toggle + Hamburger Menu */}
        <div className="nav-mobile-actions">
          <button
            type="button"
            className="theme-toggle nav-mobile-theme-btn"
            id="mobileThemeToggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <button
            type="button"
            className={`nav-hamburger-btn ${isMobileMenuOpen ? "is-open" : ""}`}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobileNavDrawer"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-nav-backdrop ${isMobileMenuOpen ? "is-open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Navigation Drawer */}
      <div
        id="mobileNavDrawer"
        ref={mobileMenuRef}
        className={`mobile-nav-drawer ${isMobileMenuOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand">
            <span className="logo-icon" aria-hidden="true">🏠</span>
            <span className="logo-text">Pg Dhundo</span>
          </div>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* User Card inside Drawer */}
        <div className="mobile-drawer-user">
          {isAuthenticated ? (
            <div className="mobile-user-card">
              <span className="nav-profile-avatar" aria-hidden="true">
                {profileInitial}
              </span>
              <div className="mobile-user-details">
                <span className="mobile-user-name">{displayName}</span>
                <span className={`nav-profile-role ${roleClass}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
          ) : (
            <div className="mobile-guest-card">
              <p className="mobile-guest-title">Welcome to Pg Dhundo</p>
              <p className="mobile-guest-subtitle">Find verified rooms, PGs & flats with zero hassle.</p>
              <Link
                to="/login"
                className="mobile-auth-primary-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log In / Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Navigation Links inside Drawer */}
        <div className="mobile-drawer-links">
          <Link
            to="/"
            className={`mobile-drawer-link ${routerLocation.pathname === "/" ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="mobile-link-icon">🏠</span>
            <span>Home</span>
          </Link>

          <Link
            to="/list-property"
            className={`mobile-drawer-link ${
              routerLocation.pathname.startsWith("/list-property") ? "active" : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="mobile-link-icon">➕</span>
            <span>List Property</span>
          </Link>

          <Link
            to="/saved"
            className={`mobile-drawer-link ${
              routerLocation.pathname === "/saved" ? "active" : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="mobile-link-icon">❤️</span>
            <span>Saved Stays</span>
          </Link>

          <Link
            to="/be-an-agent"
            className={`mobile-drawer-link ${
              routerLocation.pathname === "/be-an-agent" ? "active" : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="mobile-link-icon">🤝</span>
            <span>Be an Agent</span>
          </Link>

          <Link
            to="/policies"
            className={`mobile-drawer-link ${
              routerLocation.pathname === "/policies" ? "active" : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="mobile-link-icon">📜</span>
            <span>Terms & Policies</span>
          </Link>
        </div>

        {/* Authenticated Links in Drawer */}
        {isAuthenticated && (
          <div className="mobile-drawer-account-section">
            <div className="mobile-drawer-section-title">Account</div>

            <Link
              to={dashboardPath}
              className="mobile-drawer-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="mobile-link-icon">{isAdmin ? "🛡️" : "👤"}</span>
              <span>{isAdmin ? "Admin Console" : isOwner || isAgent ? "Owner Dashboard" : "My Dashboard"}</span>
            </Link>

            <Link
              to="/login"
              className="mobile-drawer-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="mobile-link-icon">👥</span>
              <span>Switch / Add Account</span>
            </Link>

            <button
              type="button"
              className="mobile-drawer-link mobile-logout-btn"
              onClick={handleLogout}
            >
              <span className="mobile-link-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;


