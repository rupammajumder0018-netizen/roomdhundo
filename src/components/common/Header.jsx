import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { ROOMDHUNDO_HUBS } from "../../services/properties/index.js";

export function Header({ activeHub, onHubChange }) {
  const { user, profile, roleKind, isAuthenticated, logout } = useAuth();
  const [theme, setTheme] = useState("light");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationRef = useRef(null);
  const routerLocation = useLocation();

  // Initialize theme from document or localStorage
  useEffect(() => {
    const currentTheme =
      document.documentElement.dataset.theme ||
      localStorage.getItem("roomdhundo-theme") ||
      "light";
    setTheme(currentTheme);
  }, []);

  // Close location dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setIsLocationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("roomdhundo-theme", nextTheme);
  };

  const handleSelectHub = (hubName) => {
    if (onHubChange) {
      onHubChange(hubName);
    }
    localStorage.setItem("roomdhundo-location", hubName);
    setIsLocationOpen(false);
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const currentHubName = activeHub?.name || activeHub || "MAKAUT";

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main Navigation">
        <div className="nav-left" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link to="/" className="logo" aria-label="Pg Dhundo Home">
            Pg Dhundo
          </Link>

          {/* Location Hub Picker */}
          <div
            className="nav-location-wrap"
            ref={locationRef}
            style={{ position: "relative" }}
          >
            <button
              type="button"
              className="nav-location-btn"
              onClick={() => setIsLocationOpen((prev) => !prev)}
              aria-expanded={isLocationOpen}
              aria-haspopup="listbox"
              aria-label="Select location area"
              title="Select area around MAKAUT, Jaguli, or Haringhata"
            >
              <span className="location-pin" aria-hidden="true">📍</span>
              <span className="nav-location-label" id="navLocationLabel">
                {currentHubName}
              </span>
              <span className="location-arrow" aria-hidden="true">▾</span>
            </button>

            {isLocationOpen && (
              <div
                className="nav-location-dropdown open"
                role="listbox"
                aria-labelledby="navLocationLabel"
              >
                <div className="nav-location-dropdown-header">
                  <strong>Served Areas</strong>
                  <span>Properties near colleges & hubs</span>
                </div>
                <div className="nav-location-chips">
                  {ROOMDHUNDO_HUBS.map((hub) => (
                    <button
                      key={hub.name}
                      type="button"
                      role="option"
                      aria-selected={currentHubName === hub.name}
                      className={`nav-location-chip ${
                        currentHubName === hub.name ? "is-active" : ""
                      }`}
                      onClick={() => handleSelectHub(hub.name)}
                    >
                      {hub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="nav-links">
          <Link
            to="/search"
            className={routerLocation.pathname === "/search" ? "nav-link is-active" : "nav-link"}
          >
            Search
          </Link>

          <Link
            to="/list-property.html"
            className="nav-link"
          >
            List Property
          </Link>

          <Link
            to="/saved"
            className={routerLocation.pathname === "/saved" ? "nav-link is-active" : "nav-link"}
          >
            Saved
          </Link>

          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={routerLocation.pathname === "/dashboard" ? "nav-link is-active" : "nav-link"}
            >
              Dashboard
            </Link>
          )}

          {/* Theme Toggle */}
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

          {/* Auth State Links */}
          <div className="auth-links" id="authLinks">
            {isAuthenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Link
                  to="/dashboard"
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--rd-text, #22577A)",
                    maxWidth: "140px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={`View dashboard for ${displayName}`}
                >
                  {displayName}
                </Link>

                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "var(--rd-surface-soft, #e6f7ef)",
                    color: "var(--rd-accent, #38A3A5)",
                    border: "1px solid var(--rd-border, #c6ead9)",
                  }}
                >
                  {roleKind}
                </span>

                <button
                  type="button"
                  onClick={() => logout()}
                  className="nav-auth-btn"
                  style={{
                    fontSize: "13px",
                    padding: "6px 12px",
                    background: "transparent",
                    border: "1px solid var(--rd-border, #c6ead9)",
                    color: "var(--rd-muted, #3a6f86)",
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" className="nav-auth-btn" id="navAuthBtn">
                Log In / Sign Up
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;

