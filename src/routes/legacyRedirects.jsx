import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";

/**
 * Redirects legacy `/search.html` to `/search`, preserving all query parameters.
 */
export function LegacySearchRedirect() {
  const location = useLocation();
  return <Navigate to={`/search${location.search}`} replace />;
}

/**
 * Redirects legacy `/property.html` to modern `/property/:id`, preserving `?room=` if present.
 */
export function LegacyPropertyRedirect() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");
  const room = searchParams.get("room");

  if (id) {
    const destination = room
      ? `/property/${id}?room=${encodeURIComponent(room)}`
      : `/property/${id}`;
    return <Navigate to={destination} replace />;
  }

  if (room) {
    return <Navigate to={`/hotel-room/${encodeURIComponent(room)}`} replace />;
  }

  return <Navigate to="/search" replace />;
}

/**
 * Notice displayed when a user visits a legacy URL for a dashboard or admin feature
 * that is scheduled for migration in upcoming phases.
 */
export function UnmigratedFeatureNotice({ featureName, phaseName = "Upcoming Phase" }) {
  return (
    <div
      style={{
        maxWidth: "680px",
        margin: "60px auto",
        padding: "36px 28px",
        background: "var(--rd-surface, #fff)",
        border: "1px solid var(--rd-border, #c6ead9)",
        borderRadius: "18px",
        textAlign: "center",
        boxShadow: "var(--rd-shadow, 0 14px 34px rgba(34, 87, 122, 0.10))",
      }}
    >
      <div style={{ fontSize: "40px", marginBottom: "16px" }}>🚧</div>
      <h2 style={{ fontSize: "24px", color: "var(--rd-text, #22577A)", marginBottom: "10px" }}>
        {featureName} Migration in Progress
      </h2>
      <p style={{ color: "var(--rd-muted, #3a6f86)", marginBottom: "24px", lineHeight: "1.6" }}>
        This section is currently queued for migration as part of {phaseName}.
        Public search, property details, and authentication are live.
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          to="/"
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            background: "var(--rd-accent-2, #22577A)",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Return Home
        </Link>
        <Link
          to="/search"
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "1px solid var(--rd-accent, #38A3A5)",
            color: "var(--rd-accent, #38A3A5)",
            fontWeight: 600,
          }}
        >
          Explore Properties
        </Link>
      </div>
    </div>
  );
}

