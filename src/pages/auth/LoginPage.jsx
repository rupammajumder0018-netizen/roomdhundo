import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { differentEmailRoleMessage, accountKindFromRole } from "../../services/auth/index.js";

export function LoginPage() {
  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!email || !password) {
      setMessage({ text: "Please enter your email and password.", type: "error" });
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ text: "Please enter a valid email address.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "Logging in...", type: "info" });

    try {
      const result = await login({ email, password });

      if (!result.success) {
        setMessage({
          text: result.error?.message || "Invalid email or password.",
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      // Check role mismatch between selected role and actual registered profile role
      const actualKind = accountKindFromRole(result.profile?.role || "user");
      const wantedKind = accountKindFromRole(role);

      if (actualKind !== "admin" && wantedKind !== actualKind) {
        // Sign out to preserve role separation
        await loginWithGoogle ? null : null; // noop
        setMessage({
          text: differentEmailRoleMessage(actualKind, wantedKind),
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      setMessage({ text: "Login successful! Redirecting...", type: "success" });

      // Navigate to previous destination or appropriate role destination
      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      setMessage({
        text: err.message || "An unexpected error occurred. Please try again.",
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setMessage({ text: "Redirecting to Google...", type: "info" });
    setIsGoogleSubmitting(true);

    try {
      const result = await loginWithGoogle({ role });
      if (!result.success) {
        setMessage({
          text: result.error?.message || "Could not start Google sign-in.",
          type: "error",
        });
        setIsGoogleSubmitting(false);
      }
    } catch (err) {
      setMessage({
        text: err.message || "Google sign-in failed. Please try again.",
        type: "error",
      });
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-topbar">
          <Link to="/" className="auth-close-round" aria-label="Back to home">
            ×
          </Link>
          <div className="auth-brand" style={{ margin: 0 }}>
            <span className="auth-brand-mark" aria-hidden="true">
              ⌂
            </span>
            <span>Pg Dhundo</span>
          </div>
        </div>

        <h1>Sign In</h1>
        <p className="auth-subtitle">Welcome back. Enter your details to continue.</p>

        <form onSubmit={handleEmailLogin} noValidate>
          {/* Role Picker */}
          <div className="auth-role-picker" role="radiogroup" aria-label="Account type">
            <div className="auth-role-options">
              <label
                className={`auth-role-card ${role === "user" ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="loginRole"
                  value="user"
                  checked={role === "user"}
                  onChange={() => setRole("user")}
                />
                <span className="auth-role-title">As a Renter</span>
              </label>

              <label
                className={`auth-role-card ${role === "owner" ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="loginRole"
                  value="owner"
                  checked={role === "owner"}
                  onChange={() => setRole("owner")}
                />
                <span className="auth-role-title">As an Owner</span>
              </label>

              <label
                className={`auth-role-card ${role === "agent" ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="loginRole"
                  value="agent"
                  checked={role === "agent"}
                  onChange={() => setRole("agent")}
                />
                <span className="auth-role-title">As an Agent</span>
              </label>
            </div>
            <p className="auth-role-hint">
              Renter, Owner, and Agent each need a different email address.
            </p>
          </div>

          {/* Google OAuth Button */}
          <div className="google-auth-wrap">
            <button
              type="button"
              className="google-auth-btn"
              onClick={handleGoogleLogin}
              disabled={isGoogleSubmitting || isSubmitting}
              aria-label="Sign in with Google"
            >
              <svg
                className="google-auth-icon"
                viewBox="0 0 48 48"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.5l6.3 5.3C37.9 38.3 44 32.5 44 24c0-1.3-.1-2.5-.4-3.5z"
                />
              </svg>
              <span>
                {isGoogleSubmitting ? "Redirecting to Google..." : "Sign in with Google"}
              </span>
            </button>
          </div>

          <div className="auth-divider" role="separator">
            <span>or</span>
          </div>

          {/* Email Field */}
          <div className="auth-field">
            <label htmlFor="loginEmail">Email *</label>
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
                id="loginEmail"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="auth-field">
            <div className="auth-field-label-row">
              <label htmlFor="loginPassword">Password *</label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>
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
                id="loginPassword"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

          {/* Feedback Message */}
          {message.text && (
            <div className={`auth-message ${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting || isGoogleSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?
          <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </main>
  );
}

export default LoginPage;

