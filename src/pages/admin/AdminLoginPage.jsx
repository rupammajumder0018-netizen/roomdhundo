import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { accountKindFromRole } from "../../services/auth/index.js";
import { PATHS } from "../../routes/paths.js";

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const { login, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!email || !password) {
      setMessage({ text: "Please enter your administrator email and password.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "Authenticating administrator credentials...", type: "info" });

    try {
      const result = await login({ email, password });

      if (!result.success) {
        setMessage({
          text: result.error?.message || "Invalid administrator credentials.",
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      // Verify that this account actually has the admin role in database
      const roleKind = accountKindFromRole(result.profile?.role || "");
      if (roleKind !== "admin") {
        await logout();
        setMessage({
          text: "Access denied. This account does not possess platform administrator privileges.",
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      setMessage({ text: "Administrator authenticated. Redirecting to console...", type: "success" });

      const destination = location.state?.from?.pathname || PATHS.ADMIN;
      // Force direct navigation so React Router mounts the admin layout cleanly
      window.location.href = destination;
    } catch (err) {
      setMessage({
        text: err.message || "An unexpected error occurred during admin authentication.",
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="auth-page"
      style={{
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <div
        className="auth-card"
        style={{
          maxWidth: "420px",
          width: "100%",
          padding: "36px 30px",
          background: "var(--rd-surface, #ffffff)",
          borderRadius: "16px",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12)",
          border: "1px solid var(--rd-border, #c6ead9)",
        }}
      >
        <div className="auth-topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div className="auth-brand" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <span
              className="auth-brand-mark"
              style={{
                background: "#22577A",
                color: "#ffffff",
                padding: "6px 10px",
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "14px",
              }}
            >
              🛡️ Admin
            </span>
            <span style={{ fontWeight: 800, fontSize: "18px", color: "var(--rd-text, #22577A)" }}>
              Pg Dhundo
            </span>
          </div>
          <Link to="/" style={{ color: "var(--rd-muted, #666)", textDecoration: "none", fontSize: "22px" }} aria-label="Back to home">
            ×
          </Link>
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--rd-text, #22577A)", marginBottom: "8px" }}>
          Administrator Sign In
        </h1>
        <p style={{ fontSize: "14px", color: "var(--rd-muted, #3a6f86)", marginBottom: "24px" }}>
          Restricted access for platform moderators and administrators.
        </p>

        {message.text && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "13px",
              fontWeight: 600,
              backgroundColor:
                message.type === "success"
                  ? "#e6f4ea"
                  : message.type === "info"
                  ? "#e8f0fe"
                  : "#fce8e6",
              color:
                message.type === "success"
                  ? "#137333"
                  : message.type === "info"
                  ? "#1a73e8"
                  : "#c5221f",
              border: `1px solid ${
                message.type === "success"
                  ? "#ceead6"
                  : message.type === "info"
                  ? "#d2e3fc"
                  : "#fad2cf"
              }`,
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAdminLogin} noValidate>
          <div className="auth-field" style={{ marginBottom: "18px" }}>
            <label
              htmlFor="adminEmail"
              style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--rd-text, #22577A)" }}
            >
              Admin Email
            </label>
            <input
              id="adminEmail"
              type="email"
              autoComplete="email"
              placeholder="admin@pgdhundo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid var(--rd-border, #c6ead9)",
                background: "var(--rd-surface, #fff)",
                color: "var(--rd-text, #22577A)",
                fontSize: "14px",
              }}
            />
          </div>

          <div className="auth-field" style={{ marginBottom: "24px" }}>
            <label
              htmlFor="adminPassword"
              style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--rd-text, #22577A)" }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="adminPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--rd-border, #c6ead9)",
                  background: "var(--rd-surface, #fff)",
                  color: "var(--rd-text, #22577A)",
                  fontSize: "14px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#666",
                }}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "13px",
              background: "var(--rd-accent-2, #22577A)",
              color: "#ffffff",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "15px",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
              transition: "background 0.2s ease",
            }}
          >
            {isSubmitting ? "Verifying..." : "Sign In to Admin Console"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--rd-border, #c6ead9)" }}>
          <Link
            to={PATHS.LOGIN}
            style={{ fontSize: "13px", color: "var(--rd-muted, #3a6f86)", textDecoration: "none" }}
          >
            ← Return to Standard User Login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default AdminLoginPage;
