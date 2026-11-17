import React from "react";

export function LoadingState({ message = "Loading properties...", minHeight = "280px" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight,
        padding: "40px 20px",
        color: "var(--rd-muted, #3a6f86)",
        textAlign: "center",
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "3px solid var(--rd-border, #c6ead9)",
          borderTopColor: "var(--rd-accent, #38A3A5)",
          borderRadius: "50%",
          animation: "rd-spin 0.8s linear infinite",
          marginBottom: "16px",
        }}
      />
      <p style={{ fontSize: "15px", fontWeight: 500 }}>{message}</p>
      <style>{`
        @keyframes rd-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoadingState;

