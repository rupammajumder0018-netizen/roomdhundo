import React from "react";
import { Link } from "react-router-dom";

export function EmptyState({
  title = "No properties found",
  message = "No properties match your search. Try clearing some filters or searching another area.",
  actionText,
  actionLink,
  onAction,
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        background: "var(--rd-surface, #ffffff)",
        border: "1px solid var(--rd-border, #c6ead9)",
        borderRadius: "18px",
        margin: "24px auto",
        maxWidth: "600px",
      }}
      role="region"
      aria-label="No results"
    >
      <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
      <h3 style={{ fontSize: "20px", color: "var(--rd-text, #22577A)", marginBottom: "8px" }}>
        {title}
      </h3>
      <p style={{ color: "var(--rd-muted, #3a6f86)", fontSize: "15px", marginBottom: actionText ? "20px" : 0 }}>
        {message}
      </p>

      {actionText && actionLink && (
        <Link
          to={actionLink}
          style={{
            display: "inline-block",
            padding: "10px 22px",
            background: "var(--rd-accent, #38A3A5)",
            color: "#ffffff",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionLink && (
        <button
          type="button"
          onClick={onAction}
          style={{
            padding: "10px 22px",
            background: "var(--rd-accent, #38A3A5)",
            color: "#ffffff",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;

