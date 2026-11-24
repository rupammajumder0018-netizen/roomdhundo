import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Handshake,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Send,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  LogIn,
  UserPlus,
  ShieldCheck,
  Building,
  Compass,
} from "lucide-react";
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

  // Prefill user details from auth/profile
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

  // Check for existing agent application in database
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
          // Prefill with existing application data
          setFormData((prev) => ({
            ...prev,
            first_name: res.data.first_name || prev.first_name,
            last_name: res.data.last_name || prev.last_name,
            phone: res.data.phone || prev.phone,
            email: res.data.email || prev.email,
            location: res.data.location || prev.location,
            pincode: res.data.pincode || prev.pincode,
          }));
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

  // True only when the account role has actually been granted 'agent' privileges
  const isAlreadyAgent = role === "agent";
  const applicationStatus = existingApplication
    ? String(existingApplication.status).toLowerCase()
    : null;
  const isPending = !isAlreadyAgent && applicationStatus === "pending";
  const isRejected = !isAlreadyAgent && applicationStatus === "rejected";

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

  return (
    <main className="agent-apply-container">
      {/* Page Header */}
      <div className="agent-hero">
        <div className="agent-hero-icon-badge" aria-hidden="true">
          <Handshake size={30} />
        </div>
        <h1>Partner as a Pg Dhundo Agent</h1>
        <p>
          Connect property owners with students and professionals. List accommodations, manage bookings, and grow your local rental network.
        </p>
      </div>

      {/* State A: Guest / Unauthenticated */}
      {!isAuthenticated && !isLoadingApp && (
        <section className="agent-card agent-status-card">
          <div className="agent-status-icon-wrap status-guest" aria-hidden="true">
            <ShieldCheck size={36} />
          </div>
          <h2 className="agent-status-title">Sign In or Register to Apply</h2>
          <p className="agent-status-desc">
            To register as an accredited agent with Pg Dhundo, please sign in to your Agent account or create one now.
          </p>

          <div className="agent-benefits-grid">
            <div className="agent-benefit-item">
              <Building size={20} style={{ color: "var(--rd-accent)" }} />
              <h4>List Accommodations</h4>
              <p>Post and manage PG, Hostel, Flat, and Hotel listings across campuses and cities.</p>
            </div>
            <div className="agent-benefit-item">
              <ShieldCheck size={20} style={{ color: "var(--rd-accent)" }} />
              <h4>Verified Agent Badge</h4>
              <p>Gain credibility with prospective tenants searching for authentic stays.</p>
            </div>
            <div className="agent-benefit-item">
              <LayoutDashboard size={20} style={{ color: "var(--rd-accent)" }} />
              <h4>Dedicated Console</h4>
              <p>Track bookings, respond to customer enquiries, and monitor occupancy in real time.</p>
            </div>
          </div>

          <div className="agent-actions-wrap">
            <Link
              to={PATHS.LOGIN}
              state={{ from: { pathname: PATHS.BE_AN_AGENT } }}
              className="agent-btn agent-btn-primary"
            >
              <LogIn size={16} />
              <span>Sign In as Agent</span>
            </Link>
            <Link to={PATHS.SIGNUP} className="agent-btn agent-btn-secondary">
              <UserPlus size={16} />
              <span>Create Agent Account</span>
            </Link>
          </div>
        </section>
      )}

      {/* State B: Already Approved Agent */}
      {isAuthenticated && isAlreadyAgent && (
        <section className="agent-card agent-status-card">
          <div className="agent-status-icon-wrap status-approved" aria-hidden="true">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="agent-status-title">You are a Verified Agent!</h2>
          <p className="agent-status-desc">
            Your agent partnership is active and fully verified. You can list accommodations, manage inventory, and handle tenant requests from your dedicated console.
          </p>
          <div className="agent-actions-wrap">
            <Link to={PATHS.OWNER_DASHBOARD} className="agent-btn agent-btn-primary">
              <LayoutDashboard size={16} />
              <span>Go to Agent Dashboard</span>
            </Link>
            <Link to={PATHS.LIST_PROPERTY} className="agent-btn agent-btn-secondary">
              <PlusCircle size={16} />
              <span>List a New Property</span>
            </Link>
          </div>
        </section>
      )}

      {/* State C: Pending Approval */}
      {isAuthenticated && isPending && (
        <section className="agent-card agent-status-card" id="agentWaitingCard">
          <div className="agent-status-icon-wrap status-pending" aria-hidden="true">
            <Clock size={40} />
          </div>
          <h2 className="agent-status-title">Application Under Review</h2>
          <p className="agent-status-desc">
            Your agent registration request has been submitted to the Pg Dhundo administration team. We are verifying your details and will activate your account shortly.
          </p>

          <div className="agent-info-grid">
            <div className="agent-info-item">
              <span className="agent-info-label">Applicant Name</span>
              <span className="agent-info-val">
                {formData.first_name} {formData.last_name}
              </span>
            </div>
            <div className="agent-info-item">
              <span className="agent-info-label">Contact Phone</span>
              <span className="agent-info-val">{formData.phone || "—"}</span>
            </div>
            <div className="agent-info-item">
              <span className="agent-info-label">Email Address</span>
              <span className="agent-info-val">{formData.email || user?.email || "—"}</span>
            </div>
            <div className="agent-info-item">
              <span className="agent-info-label">Operating Area & PIN</span>
              <span className="agent-info-val">
                {formData.location || "—"} ({formData.pincode || "—"})
              </span>
            </div>
          </div>

          <div className="agent-actions-wrap">
            <Link to={PATHS.HOME} className="agent-btn agent-btn-secondary">
              <Compass size={16} />
              <span>Browse Website</span>
            </Link>
            <button
              type="button"
              className="agent-btn agent-btn-secondary"
              id="agentLogoutBtn"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </section>
      )}

      {/* State D: Application Form (New applicant or re-submitting rejected application) */}
      {isAuthenticated && !isAlreadyAgent && !isPending && (
        <section className="agent-card">
          {isRejected && (
            <div className="agent-alert-box alert-rejected" role="alert">
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Application Update Required:</strong> Your previous agent application was reviewed and not approved. Please verify your contact information and re-submit for review.
              </div>
            </div>
          )}

          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--rd-text)", marginBottom: "6px" }}>
              Agent Registration Details
            </h2>
            <p style={{ fontSize: "14px", color: "var(--rd-muted)", margin: 0 }}>
              Provide accurate contact details. Our team will verify your information before enabling listing permissions.
            </p>
          </div>

          <form className="agent-form" id="agentApplyForm" onSubmit={handleSubmit} noValidate>
            <div className="agent-form-row">
              <div className="agent-form-group">
                <label className="agent-label" htmlFor="agentFirstName">
                  <User size={15} />
                  <span>First Name <span className="agent-required">*</span></span>
                </label>
                <div className="agent-input-wrap">
                  <User size={16} className="agent-input-icon" />
                  <input
                    type="text"
                    id="agentFirstName"
                    name="first_name"
                    autoComplete="given-name"
                    placeholder="Enter first name"
                    className={`agent-input ${fieldErrors.first_name ? "has-error" : ""}`}
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                {fieldErrors.first_name && (
                  <span className="agent-field-error">{fieldErrors.first_name}</span>
                )}
              </div>

              <div className="agent-form-group">
                <label className="agent-label" htmlFor="agentLastName">
                  <User size={15} />
                  <span>Last Name <span className="agent-required">*</span></span>
                </label>
                <div className="agent-input-wrap">
                  <User size={16} className="agent-input-icon" />
                  <input
                    type="text"
                    id="agentLastName"
                    name="last_name"
                    autoComplete="family-name"
                    placeholder="Enter last name"
                    className={`agent-input ${fieldErrors.last_name ? "has-error" : ""}`}
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                {fieldErrors.last_name && (
                  <span className="agent-field-error">{fieldErrors.last_name}</span>
                )}
              </div>
            </div>

            <div className="agent-form-row">
              <div className="agent-form-group">
                <label className="agent-label" htmlFor="agentPhone">
                  <Phone size={15} />
                  <span>Phone Number <span className="agent-required">*</span></span>
                </label>
                <div className="agent-input-wrap">
                  <Phone size={16} className="agent-input-icon" />
                  <input
                    type="tel"
                    id="agentPhone"
                    name="phone"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    placeholder="10-digit mobile number"
                    className={`agent-input ${fieldErrors.phone ? "has-error" : ""}`}
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                {fieldErrors.phone && (
                  <span className="agent-field-error">{fieldErrors.phone}</span>
                )}
              </div>

              <div className="agent-form-group">
                <label className="agent-label" htmlFor="agentEmail">
                  <Mail size={15} />
                  <span>Email Address <span className="agent-required">*</span></span>
                </label>
                <div className="agent-input-wrap">
                  <Mail size={16} className="agent-input-icon" />
                  <input
                    type="email"
                    id="agentEmail"
                    name="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    className={`agent-input ${fieldErrors.email ? "has-error" : ""}`}
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <span className="agent-field-error">{fieldErrors.email}</span>
                )}
              </div>
            </div>

            <div className="agent-form-row">
              <div className="agent-form-group">
                <label className="agent-label" htmlFor="agentLocation">
                  <MapPin size={15} />
                  <span>Where are you situated? <span className="agent-required">*</span></span>
                </label>
                <div className="agent-input-wrap">
                  <MapPin size={16} className="agent-input-icon" />
                  <input
                    type="text"
                    id="agentLocation"
                    name="location"
                    placeholder="City / locality (e.g. Haringhata, Kolkata)"
                    className={`agent-input ${fieldErrors.location ? "has-error" : ""}`}
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
                {fieldErrors.location && (
                  <span className="agent-field-error">{fieldErrors.location}</span>
                )}
              </div>

              <div className="agent-form-group">
                <label className="agent-label" htmlFor="agentPincode">
                  <MapPin size={15} />
                  <span>Pin Code <span className="agent-required">*</span></span>
                </label>
                <div className="agent-input-wrap">
                  <MapPin size={16} className="agent-input-icon" />
                  <input
                    type="text"
                    id="agentPincode"
                    name="pincode"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength="6"
                    placeholder="6-digit pin code"
                    className={`agent-input ${fieldErrors.pincode ? "has-error" : ""}`}
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                  />
                </div>
                {fieldErrors.pincode && (
                  <span className="agent-field-error">{fieldErrors.pincode}</span>
                )}
              </div>
            </div>

            {submitError && (
              <div className="agent-alert-box alert-rejected" role="alert">
                <AlertCircle size={18} />
                <span>{submitError}</span>
              </div>
            )}

            <div style={{ marginTop: "12px" }}>
              <button
                type="submit"
                className="agent-btn agent-btn-primary"
                style={{ width: "100%", padding: "14px 24px" }}
                disabled={isSubmitting}
              >
                <Send size={16} />
                <span>{isSubmitting ? "Submitting Application..." : "Submit Agent Application"}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="agent-modal-backdrop" id="agentSuccessModal">
          <div
            className="agent-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agentSuccessTitle"
          >
            <div className="agent-status-icon-wrap status-approved" aria-hidden="true">
              <CheckCircle2 size={44} />
            </div>
            <h2 id="agentSuccessTitle" className="agent-status-title">
              Application Submitted!
            </h2>
            <p className="agent-status-desc">
              Your request to become a verified Pg Dhundo Agent has been received. Our team will review your application and activate your listing permissions shortly.
            </p>
            <button
              type="button"
              className="agent-btn agent-btn-primary"
              id="agentSuccessOk"
              style={{ width: "100%" }}
              onClick={() => setShowSuccessModal(false)}
            >
              <span>View Application Status</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default BeAnAgentPage;
