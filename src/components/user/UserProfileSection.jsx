import React, { useState } from "react";
import { updateUserProfile } from "../../services/auth/index.js";

/**
 * Profile overview and editing component for the User Dashboard.
 *
 * @param {Object} props
 * @param {Object} props.user Current auth user
 * @param {Object} props.profile Current public.profiles record
 * @param {string} props.displayName Formatted display name
 * @param {string} props.roleLabel Formatted role title
 * @param {Function} [props.onProfileUpdated] Callback to trigger refresh
 */
export function UserProfileSection({
  user,
  profile,
  displayName = "User",
  roleLabel = "Renter",
  onProfileUpdated,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  const handleOpenModal = () => {
    setNameInput(profile?.full_name || user?.user_metadata?.full_name || displayName);
    setEmailInput(user?.email || "");
    setFeedback({ text: "", type: "" });
    setIsEditing(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsEditing(false);
    setFeedback({ text: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    const cleanEmail = emailInput.trim();

    if (!cleanName || cleanName.length < 2) {
      setFeedback({
        text: "Please enter your full name (at least 2 characters).",
        type: "error",
      });
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFeedback({
        text: "Please enter a valid email address.",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    setFeedback({ text: "Updating your profile...", type: "info" });

    try {
      const { error, emailUpdated } = await updateUserProfile(user.id, {
        full_name: cleanName,
        email: cleanEmail,
      });

      if (error) {
        setFeedback({
          text: error.message || "Unable to update profile. Please try again.",
          type: "error",
        });
        setIsSaving(false);
        return;
      }

      setFeedback({
        text: emailUpdated
          ? "Profile updated. Please check your new email inbox if confirmation was sent."
          : "Profile updated successfully.",
        type: "success",
      });

      if (onProfileUpdated) {
        await onProfileUpdated();
      }

      setTimeout(() => {
        setIsEditing(false);
        setIsSaving(false);
      }, 1200);
    } catch (err) {
      setFeedback({
        text: err.message || "An unexpected error occurred.",
        type: "error",
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="renter-dashboard-section">
      <div className="dashboard-section-title">
        <div>
          <h2>My Profile</h2>
          <p>View and manage your Pg Dhundo account information.</p>
        </div>

        <button
          type="button"
          className="edit-profile-btn"
          id="editProfileBtn"
          onClick={handleOpenModal}
        >
          ✏️ Edit Profile
        </button>
      </div>

      <div className="renter-account-card">
        {/* NAME */}
        <div className="account-info-row">
          <span>Full Name</span>
          <strong id="renterFullName">{displayName}</strong>
        </div>

        {/* EMAIL */}
        <div className="account-info-row">
          <span>Email</span>
          <strong id="renterEmail">{user?.email || "—"}</strong>
        </div>

        {/* ACCOUNT TYPE */}
        <div className="account-info-row">
          <span>Account Type</span>
          <strong id="dashboardProfileRole">{roleLabel}</strong>
        </div>

        {/* STATUS */}
        <div className="account-info-row">
          <span>Status</span>
          <strong className="active-account">● Active</strong>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div
          className="profile-edit-modal show"
          id="profileEditModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profileEditTitle"
          onClick={(e) => {
            if (e.target.id === "profileEditModal") handleCloseModal();
          }}
        >
          <div className="profile-edit-modal-content">
            <div className="profile-edit-header">
              <div>
                <h2 id="profileEditTitle">Edit Profile</h2>
                <p>Update your Pg Dhundo account information.</p>
              </div>

              <button
                type="button"
                className="profile-edit-close"
                id="profileEditCloseBtn"
                onClick={handleCloseModal}
                aria-label="Close edit profile"
              >
                &times;
              </button>
            </div>

            <form id="profileEditForm" onSubmit={handleSubmit}>
              <div className="profile-edit-body">
                {/* FULL NAME */}
                <div className="edit-form-group">
                  <label htmlFor="editProfileName">Full Name</label>
                  <input
                    type="text"
                    id="editProfileName"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    minLength={2}
                    disabled={isSaving}
                  />
                </div>

                {/* EMAIL */}
                <div className="edit-form-group">
                  <label htmlFor="editProfileEmail">Email</label>
                  <input
                    type="email"
                    id="editProfileEmail"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    disabled={isSaving}
                  />
                  <small>
                    Changing your email may require confirmation from Supabase.
                  </small>
                </div>

                {feedback.text && (
                  <p
                    id="profileEditMessage"
                    className="profile-edit-message"
                    style={{
                      color:
                        feedback.type === "error"
                          ? "#dc2626"
                          : feedback.type === "success"
                          ? "#16a34a"
                          : "var(--rd-muted, #6b7280)",
                    }}
                  >
                    {feedback.text}
                  </p>
                )}
              </div>

              <div className="profile-edit-actions">
                <button
                  type="button"
                  className="profile-cancel-btn"
                  id="profileEditCancelBtn"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-save-btn"
                  id="profileEditSaveBtn"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "💾 Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfileSection;
