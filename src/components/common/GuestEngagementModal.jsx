import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { PATHS } from "../../routes/paths.js";

/**
 * GuestEngagementModal
 *
 * Prompts unauthenticated guests after 1.5 - 2 minutes of browsing
 * to log in or create an account for exclusive deals, saving properties,
 * direct owner connections, and hotel bookings.
 */
export function GuestEngagementModal() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // If user is logged in or loading, do not trigger
    if (isAuthenticated || isLoading) {
      setIsOpen(false);
      return;
    }

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem("roomdhundo_guest_prompt_dismissed");
    if (dismissed) return;

    // Trigger after 90 seconds (1.5 minutes) of browsing
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 90000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem("roomdhundo_guest_prompt_dismissed", "true");
  };

  if (!isOpen || isAuthenticated) return null;

  const returnUrl = encodeURIComponent(location.pathname + location.search);

  return (
    <div
      className="guest-prompt-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 10000,
        padding: "16px",
        animation: "fadeIn 0.25s ease-out",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guestPromptTitle"
    >
      <div
        className="guest-prompt-card"
        style={{
          background: "var(--rd-surface, #ffffff)",
          borderRadius: "20px",
          maxWidth: "440px",
          width: "100%",
          padding: "32px 28px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
          position: "relative",
          textAlign: "center",
          border: "1px solid var(--rd-border, #c6ead9)",
        }}
      >
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close dialog"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "26px",
            lineHeight: 1,
            color: "var(--rd-muted, #3a6f86)",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div style={{ fontSize: "44px", marginBottom: "14px" }}>🏡</div>

        <h2
          id="guestPromptTitle"
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "var(--rd-text, #22577A)",
            marginBottom: "10px",
          }}
        >
          Welcome to Pg Dhundo!
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: "var(--rd-muted, #3a6f86)",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          Enjoying your search? Sign in or register in seconds to contact owners,
          book hotel stays, and save your favorite PGs and flats!
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link
            to={`${PATHS.SIGNUP}?returnTo=${returnUrl}`}
            onClick={handleDismiss}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              background: "var(--rd-accent, #38A3A5)",
              color: "#ffffff",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "15px",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(56, 163, 165, 0.3)",
            }}
          >
            Create Free Account
          </Link>

          <Link
            to={`${PATHS.LOGIN}?returnTo=${returnUrl}`}
            onClick={handleDismiss}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              background: "var(--rd-surface-card, #f4fbf7)",
              color: "var(--rd-text, #22577A)",
              border: "1px solid var(--rd-border, #c6ead9)",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Sign In with Email or Google
          </Link>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            marginTop: "16px",
            background: "none",
            border: "none",
            fontSize: "13px",
            color: "var(--rd-muted, #3a6f86)",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Continue browsing as guest
        </button>
      </div>
    </div>
  );
}

export default GuestEngagementModal;
