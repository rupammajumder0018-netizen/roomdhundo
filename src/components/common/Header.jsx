import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export function Header() {
  const { user, profile, roleKind, isAuthenticated, logout } = useAuth();
  const [theme, setTheme] = useState("light");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
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

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main Navigation">
        <div className="nav-left">
          <Link to="/" className="logo" aria-label="Pg Dhundo Home">
            Pg Dhundo
          </Link>
        </div>

        <div className="nav-links">
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
                      navigate(
                        isAdmin
                          ? "/admin"
                          : isOwner || isAgent
                          ? "/owner/dashboard"
                          : "/dashboard"
                      );
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
        </div>
      </nav>
    </header>
  );
}

export default Header;

