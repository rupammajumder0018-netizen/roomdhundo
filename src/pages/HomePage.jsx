import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase/client";

export default function HomePage() {
  const isSupabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  return (
    <div className="rd-card">
      <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "16px" }}>
        Roomdhundo — React + Vite Foundation
      </h1>
      <p style={{ fontSize: "16px", marginBottom: "24px", color: "var(--rd-muted)" }}>
        Phase 2 foundation established successfully. The application is running via React and Vite
        with client-side routing and centralized Supabase client configuration.
      </p>

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            background: "var(--rd-surface-soft)",
            border: "1px solid var(--rd-border)",
            borderRadius: "12px",
          }}
        >
          <strong style={{ display: "block", marginBottom: "4px" }}>Core Framework</strong>
          <span style={{ fontSize: "14px" }}>React + Vite + JavaScript (JSX)</span>
        </div>

        <div
          style={{
            padding: "16px 20px",
            background: "var(--rd-surface-soft)",
            border: "1px solid var(--rd-border)",
            borderRadius: "12px",
          }}
        >
          <strong style={{ display: "block", marginBottom: "4px" }}>Client Router</strong>
          <span style={{ fontSize: "14px" }}>React Router DOM v7</span>
        </div>

        <div
          style={{
            padding: "16px 20px",
            background: "var(--rd-surface-soft)",
            border: "1px solid var(--rd-border)",
            borderRadius: "12px",
          }}
        >
          <strong style={{ display: "block", marginBottom: "4px" }}>Supabase Client</strong>
          <span style={{ fontSize: "14px" }}>
            {isSupabaseConfigured ? (
              <span style={{ color: "var(--rd-accent)" }}>● Configured via Environment</span>
            ) : (
              <span style={{ color: "#eab308" }}>▲ Awaiting .env.local Configuration</span>
            )}
          </span>
        </div>

        <div
          style={{
            padding: "16px 20px",
            background: "var(--rd-surface-soft)",
            border: "1px solid var(--rd-border)",
            borderRadius: "12px",
          }}
        >
          <strong style={{ display: "block", marginBottom: "4px" }}>Original Application</strong>
          <span style={{ fontSize: "14px", color: "var(--rd-accent)" }}>
            ● Preserved intact in files6.0/
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Link
          to="/test-404-route"
          style={{
            padding: "10px 18px",
            background: "var(--rd-accent)",
            color: "#ffffff",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            display: "inline-block",
          }}
        >
          Test 404 Route
        </Link>
      </div>
    </div>
  );
}

