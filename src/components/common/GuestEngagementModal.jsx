import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, X } from "lucide-react";
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="guestPromptTitle"
    >
      <div className="guest-prompt-card">
        <button
          type="button"
          onClick={handleDismiss}
          className="guest-prompt-close-btn"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="guest-prompt-icon-badge" aria-hidden="true">
          <Building2 size={30} />
        </div>

        <h2 id="guestPromptTitle" className="guest-prompt-title">
          Welcome to Pg Dhundo!
        </h2>

        <p className="guest-prompt-desc">
          Enjoying your search? Sign in or register in seconds to contact owners,
          book hotel stays, and save your favorite PGs and flats!
        </p>

        <div className="guest-prompt-actions">
          <Link
            to={`${PATHS.SIGNUP}?returnTo=${returnUrl}`}
            onClick={handleDismiss}
            className="guest-prompt-btn-primary"
          >
            Create Free Account
          </Link>

          <Link
            to={`${PATHS.LOGIN}?returnTo=${returnUrl}`}
            onClick={handleDismiss}
            className="guest-prompt-btn-secondary"
          >
            Sign In with Email or Google
          </Link>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="guest-prompt-guest-link"
        >
          Continue browsing as guest
        </button>
      </div>
    </div>
  );
}

export default GuestEngagementModal;
