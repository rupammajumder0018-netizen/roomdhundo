import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const { resetPassword } = useAuth();

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!email || !validateEmail(email)) {
      setMessage({ text: "Please enter a valid email address.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "Sending reset link...", type: "info" });

    try {
      const callbackUrl = `${window.location.origin}/reset-password`;
      const result = await resetPassword(email, callbackUrl);

      if (!result.success) {
        setMessage({
          text: result.error?.message || "Failed to send password reset email.",
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      setMessage({
        text: `Password reset link sent! Please check your inbox at ${email}. Click the link in that email to choose a new password.`,
        type: "success",
      });
      setIsSubmitting(false);
    } catch (err) {
      setMessage({
        text: err.message || "An unexpected error occurred. Please try again.",
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-topbar">
          <Link to="/login" className="auth-close-round" aria-label="Back to sign in">
            ←
          </Link>
          <div className="auth-brand" style={{ margin: 0 }}>
            <span className="auth-brand-mark" aria-hidden="true">
              ⌂
            </span>
            <span>Pg Dhundo</span>
          </div>
        </div>

        <h1>Reset Password</h1>
        <p className="auth-subtitle">
          Enter your registered email address and we'll send you a recovery link.
        </p>

        <form onSubmit={handleResetRequest} noValidate>
          <div className="auth-field">
            <label htmlFor="resetEmail">Email *</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 2v.2l8 5 8-5V8H4zm16 8V10.5l-7.4 4.6a1 1 0 0 1-1.2 0L4 10.5V16h16z"
                  />
                </svg>
              </span>
              <input
                type="email"
                id="resetEmail"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {message.text && (
            <div className={`auth-message ${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending reset link..." : "Send Reset Link"}
          </button>
        </form>

        <p className="auth-switch">
          Remembered your password?
          <Link to="/login">Sign In</Link>
        </p>
      </div>
    </main>
  );
}

export default ForgotPasswordPage;

