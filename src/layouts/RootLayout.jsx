import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { accountKindLabel } from "../services/auth/index.js";

export default function RootLayout() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("roomdhundo-theme") || "light";
  });

  const { user, profile, role, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("roomdhundo-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const roleLabel = accountKindLabel(role);

  return (
    <>
      <header className="rd-navbar">
        <Link to="/" className="rd-brand">
          Pg Dhundo
        </Link>
        <div className="rd-nav-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {!isLoading && (
            isAuthenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  {displayName}{" "}
                  <small style={{ opacity: 0.75, fontWeight: 500 }}>({roleLabel})</small>
                </span>
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--rd-border)",
                    padding: "6px 14px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "inherit",
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Link
                  to="/login"
                  style={{
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "inherit",
                    padding: "6px 12px",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  style={{
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    background: "var(--rd-text)",
                    color: "var(--rd-bg)",
                    padding: "7px 16px",
                    borderRadius: "999px",
                  }}
                >
                  Sign Up
                </Link>
              </div>
            )
          )}

          <button
            type="button"
            className="rd-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <main className="rd-main">
        <Outlet />
      </main>

      <footer className="rd-footer">
        <p>&copy; {new Date().getFullYear()} Pg Dhundo (Roomdhundo). React + Vite Migration Foundation.</p>
      </footer>
    </>
  );
}
