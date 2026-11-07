import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="rd-card" style={{ textAlign: "center", padding: "48px 24px" }}>
      <h1 style={{ fontSize: "64px", fontWeight: "800", color: "var(--rd-accent)", marginBottom: "8px" }}>
        404
      </h1>
      <h2 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "12px" }}>
        Page Not Found
      </h2>
      <p style={{ color: "var(--rd-muted)", marginBottom: "24px", maxWidth: "480px", margin: "0 auto 24px" }}>
        The page you are looking for does not exist in the React application.
      </p>
      <Link
        to="/"
        style={{
          display: "inline-block",
          padding: "10px 20px",
          backgroundColor: "var(--rd-accent)",
          color: "#ffffff",
          borderRadius: "8px",
          fontWeight: "600",
        }}
      >
        &larr; Back to Home
      </Link>
    </div>
  );
}

