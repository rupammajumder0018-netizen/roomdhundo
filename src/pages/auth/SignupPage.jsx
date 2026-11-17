import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export function SignupPage() {
  const [role, setRole] = useState("user");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!fullName || fullName.trim().length < 2) {
      setMessage({ text: "Please enter your full name (at least 2 characters).", type: "error" });
      return;
    }

    if (!email || !validateEmail(email)) {
      setMessage({ text: "Please enter a valid email address.", type: "error" });
      return;
    }

    if (!password || password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "Creating your account...", type: "info" });

    try {
      const result = await signup({
        email,
        password,
        fullName,
        role,
      });

      if (!result.success) {
        const errorText = `${result.error?.code || ""} ${result.error?.message || ""}`.toLowerCase();
        const isEmailTaken = /already registered|already been registered|user already|email.*exist|already exists/.test(
          errorText
        );

        setMessage({
          text: isEmailTaken
            ? "This email is already registered. Renter, Owner, and Agent accounts each need a different email."
            : result.error?.message || "Failed to create account.",
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      if (result.requiresEmailConfirmation) {
        setMessage({
          text:
            role === "agent"
              ? "Account created! Please check your email to confirm your account, then sign in as Agent to finish your application."
              : "Account created! Please check your email to confirm your account before logging in.",
          type: "success",
        });
        setIsSubmitting(false);
        return;
      }

      setMessage({ text: "Account created successfully! Redirecting...", type: "success" });
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    } catch (err) {
      setMessage({
        text: err.message || "An unexpected error occurred during signup.",
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setMessage({ text: "Redirecting to Google...", type: "info" });
    setIsGoogleSubmitting(true);

    try {
      const result = await loginWithGoogle({ role });
      if (!result.success) {
        setMessage({
          text: result.error?.message || "Could not start Google sign-up.",
          type: "error",
        });
        setIsGoogleSubmitting(false);
      }
    } catch (err) {
      setMessage({
        text: err.message || "Google sign-up failed. Please try again.",
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

        <h1>Sign Up</h1>
        <p className="auth-subtitle">Create your Pg Dhundo account to find or list a stay.</p>

        <form onSubmit={handleSignup} noValidate>
          {/* Role Picker */}
          <div className="auth-role-picker" role="radiogroup" aria-label="Account type">
            <div className="auth-role-options">
              <label
                className={`auth-role-card ${role === "user" ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="signupRole"
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
                  name="signupRole"
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
                  name="signupRole"
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
              onClick={handleGoogleSignup}
              disabled={isGoogleSubmitting || isSubmitting}
              aria-label="Sign up with Google"
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
                {isGoogleSubmitting ? "Redirecting to Google..." : "Sign up with Google"}
              </span>
            </button>
          </div>

          <div className="auth-divider" role="separator">
            <span>or</span>
          </div>

          {/* Full Name */}
          <div className="auth-field">
            <label htmlFor="signupName">Full name *</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z"
                  />
                </svg>
              </span>
              <input
                type="text"
                id="signupName"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="auth-field">
            <label htmlFor="signupEmail">Email *</label>
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
                id="signupEmail"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label htmlFor="signupPassword">Password *</label>
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
                id="signupPassword"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="auth-field">
            <label htmlFor="signupConfirmPassword">Confirm password *</label>
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
                type={showConfirmPassword ? "text" : "password"}
                id="signupConfirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?
          <Link to="/login">Sign In</Link>
        </p>
      </div>
    </main>
  );
}

export default SignupPage;

