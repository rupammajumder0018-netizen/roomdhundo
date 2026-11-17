import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  submitAgentApplication,
  fetchUserAgentApplication,
  validateAgentApplicationInput,
} from "../../services/admin/adminService.js";
import { PATHS } from "../../routes/paths.js";

export function BeAnAgentPage() {
  const { user, profile, role, roleKind, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    location: "",
    pincode: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Prefill user details if available
  useEffect(() => {
    if (user) {
      const email = user.email || "";
      const fullName = profile?.full_name || user.user_metadata?.full_name || "";
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      setFormData((prev) => ({
        ...prev,
        email: prev.email || email,
        first_name: prev.first_name || firstName,
        last_name: prev.last_name || lastName,
        phone: prev.phone || profile?.phone || "",
      }));
    }
  }, [user, profile]);

  // Check for existing agent application
  useEffect(() => {
    let isMounted = true;
    async function checkApp() {
      if (!user?.id) {
        setIsLoadingApp(false);
        return;
      }
      try {
        const res = await fetchUserAgentApplication(user.id);
        if (!isMounted) return;
        if (res.data) {
          setExistingApplication(res.data);
        }
      } catch (err) {
        console.warn("[Roomdhundo] Error checking agent application:", err);
      } finally {
        if (isMounted) setIsLoadingApp(false);
      }
    }

    checkApp();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // If already an agent
  const isAlreadyAgent = role === "agent" || roleKind === "agent";
  const isPending =
    role === "agent_pending" ||
    (existingApplication && String(existingApplication.status).toLowerCase() === "pending");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(PATHS.LOGIN, { state: { from: { pathname: PATHS.BE_AN_AGENT } } });
      return;
    }

    const { valid, errors } = validateAgentApplicationInput(formData);
    if (!valid) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await submitAgentApplication({
        ...formData,
        user_id: user.id,
      });

      if (res.success) {
        setShowSuccessModal(true);
        setExistingApplication({
          status: "pending",
          ...formData,
        });
      } else {
        setSubmitError(res.error?.message || "Could not submit application.");
      }
    } catch (err) {
      setSubmitError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!isAuthenticated && !isLoadingApp) {
    return (
      <main className="list-property-page agent-apply-main">
        <div className="list-property-header">
          <h1>Be an Agent</h1>
          <p>
            Please log in or create an account first to register as a Pg Dhundo agent.
          </p>
        </div>
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link to={PATHS.LOGIN} className="lp-submit-btn" style={{ display: "inline-block", textDecoration: "none" }}>
            Log In to Apply
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="list-property-page agent-apply-main">
      <div className="list-property-header">
        <h1>Be an Agent</h1>
        <p>
          Fill this form to register as a Pg Dhundo agent. You can list properties for owners after we approve your request.
        </p>
      </div>

      {isAlreadyAgent ? (
        <section className="agent-waiting-card">
          <div className="agent-success-mark" aria-hidden="true">✓</div>
          <h2>You are an Approved Agent!</h2>
          <p>Your agent account is active. You can list and manage accommodations on Pg Dhundo.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "18px" }}>
            <Link to={PATHS.OWNER_DASHBOARD} className="lp-submit-btn" style={{ textDecoration: "none" }}>
              Go to Agent Dashboard
            </Link>
            <Link to={PATHS.LIST_PROPERTY} className="lp-secondary-btn" style={{ textDecoration: "none" }}>
              List a Property
            </Link>
          </div>
        </section>
      ) : isPending ? (
        <section className="agent-waiting-card" id="agentWaitingCard">
          <div className="agent-success-mark" aria-hidden="true">✓</div>
          <h2>Request submitted</h2>
          <p>
            Your request for becoming an agent is submitted. Wait for the approval from Pg Dhundo. You cannot use the rest of the site until an admin approves you.
          </p>
          <button type="button" className="lp-secondary-btn" id="agentLogoutBtn" onClick={handleLogout}>
            Log out
          </button>
        </section>
      ) : (
        <form className="list-property-form" id="agentApplyForm" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="agentFirstName">First name</label>
              <input
                type="text"
                id="agentFirstName"
                name="first_name"
                autoComplete="given-name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              {fieldErrors.first_name && (
                <span className="field-error-text">{fieldErrors.first_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="agentLastName">Last name</label>
              <input
                type="text"
                id="agentLastName"
                name="last_name"
                autoComplete="family-name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
              {fieldErrors.last_name && (
                <span className="field-error-text">{fieldErrors.last_name}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="agentPhone">Phone number</label>
            <input
              type="tel"
              id="agentPhone"
              name="phone"
              inputMode="numeric"
              pattern="[0-9]{10}"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            {fieldErrors.phone && (
              <span className="field-error-text">{fieldErrors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="agentEmail">Email</label>
            <input
              type="email"
              id="agentEmail"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {fieldErrors.email && (
              <span className="field-error-text">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="agentLocation">Where are you situated?</label>
            <input
              type="text"
              id="agentLocation"
              name="location"
              placeholder="City / locality"
              value={formData.location}
              onChange={handleChange}
              required
            />
            {fieldErrors.location && (
              <span className="field-error-text">{fieldErrors.location}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="agentPincode">Pin code</label>
            <input
              type="text"
              id="agentPincode"
              name="pincode"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength="6"
              placeholder="6-digit pin code"
              value={formData.pincode}
              onChange={handleChange}
              required
            />
            {fieldErrors.pincode && (
              <span className="field-error-text">{fieldErrors.pincode}</span>
            )}
          </div>

          {submitError && <p className="auth-message auth-error">{submitError}</p>}

          <button type="submit" className="lp-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="agent-success-modal" id="agentSuccessModal">
          <div
            className="agent-success-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agentSuccessTitle"
          >
            <div className="agent-success-mark" aria-hidden="true">✓</div>
            <h2 id="agentSuccessTitle">Done</h2>
            <p>Your request for becoming an agent is submitted. Wait for the approval from Pg Dhundo.</p>
            <button
              type="button"
              className="lp-submit-btn"
              id="agentSuccessOk"
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default BeAnAgentPage;
