import React from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main
      className="not-found-page"
      style={{
        maxWidth: "600px",
        margin: "80px auto",
        padding: "48px 24px",
        textAlign: "center",
        background: "var(--rd-surface, #fff)",
        borderRadius: "20px",
        border: "1px solid var(--rd-border, #c6ead9)",
        boxShadow: "var(--rd-shadow)",
      }}
    >
      <div style={{ fontSize: "64px", fontWeight: "800", color: "var(--rd-accent, #38A3A5)", marginBottom: "8px" }}>
        404
      </div>
      <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--rd-text, #22577A)", marginBottom: "12px" }}>
        Page Not Found
      </h1>
      <p style={{ color: "var(--rd-muted, #3a6f86)", marginBottom: "28px", lineHeight: "1.6" }}>
        We couldn't find the page you were looking for. The link may have changed, or the accommodation might no longer be available.
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          to="/"
          style={{
            padding: "10px 22px",
            background: "var(--rd-accent-2, #22577A)",
            color: "#ffffff",
            borderRadius: "10px",
            fontWeight: 600,
          }}
        >
          Return Home
        </Link>
        <Link
          to="/search"
          style={{
            padding: "10px 22px",
            background: "var(--rd-surface, #fff)",
            border: "1px solid var(--rd-accent, #38A3A5)",
            color: "var(--rd-accent, #38A3A5)",
            borderRadius: "10px",
            fontWeight: 600,
          }}
        >
          Explore Properties
        </Link>
      </div>
    </main>
  );
}

export default NotFoundPage;
