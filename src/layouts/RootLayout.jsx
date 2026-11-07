import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";

export default function RootLayout() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("roomdhundo-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("roomdhundo-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <>
      <header className="rd-navbar">
        <Link to="/" className="rd-brand">
          Pg Dhundo
        </Link>
        <div className="rd-nav-actions">
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

