import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const { updatePassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (newPassword.length < 6) {
      setMessage({
        text: "Password must be at least 6 characters long.",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage({
        text: "Passwords do not match.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "Updating password...", type: "info" });

    try {
      const result = await updatePassword(newPassword);

      if (!result.success) {
        setMessage({
          text: `Couldn't update password: ${result.error?.message || "Unknown error"}. This link may have expired — please request a new reset link.`,
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      setMessage({
        text: "Your password has been updated successfully! Redirecting to sign in...",
        type: "success",
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
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

        <h1>Reset Your Password</h1>
        <p className="auth-subtitle">Enter a new password for your account below.</p>

        <form onSubmit={handlePasswordUpdate} noValidate>
          <div className="auth-field">
            <label htmlFor="newPassword">New Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-7-2a2 2 0 0 1 4 0v2h-4zm4 8a2 2 0 1 1-2-2 2 2 0 0 1 2 2z"
                  />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 5c5 0 9.3 3.1 11 7-1.7 3.9-6 7-11 7S2.7 15.9 1 12c1.7-3.9 6-7 11-7zm0 2C8.2 7 4.9 9.2 3.4 12 4.9 14.8 8.2 17 12 17s7.1-2.2 8.6-5C19.1 9.2 15.8 7 12 7zm0 2.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-7-2a2 2 0 0 1 4 0v2h-4zm4 8a2 2 0 1 1-2-2 2 2 0 0 1 2 2z"
                  />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="confirmNewPassword"
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
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
            {isSubmitting ? "Updating Password..." : "Update Password"}
          </button>

          <p className="auth-role-hint" style={{ marginTop: "16px", textAlign: "center" }}>
            If this link has expired, go back to{" "}
            <Link to="/forgot-password" style={{ color: "#38A3A5", fontWeight: 600 }}>
              Forgot password?
            </Link>{" "}
            to get a new one.
          </p>
        </form>
      </div>
    </main>
  );
}

export default ResetPasswordPage;

