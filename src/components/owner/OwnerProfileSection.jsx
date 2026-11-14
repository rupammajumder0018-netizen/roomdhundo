import React, { useState } from "react";

export default function OwnerProfileSection({
  profile,
  propertiesCount = 0,
  onUpdateProfile,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const initial = (fullName || profile?.email || "O").charAt(0).toUpperCase();

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSaving(true);

    try {
      await onUpdateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      setSuccessMsg("Profile and listing contact updated successfully.");
      setIsEditing(false);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="owner-profile-card">
      {!isEditing ? (
        <div className="owner-profile-view">
          <div className="owner-profile-avatar-lg">{initial}</div>
          <div className="owner-profile-details">
            <h3>{profile?.full_name || "Property Owner"}</h3>
            <div className="owner-profile-row">
              <span>📧</span> {profile?.email || "No email on record"}
            </div>
            <div className="owner-profile-row">
              <span>📞</span> {profile?.phone || "No phone number set"}
            </div>
            <div className="owner-profile-row">
              <span>🏠</span> {propertiesCount} Listed Properties
            </div>
          </div>
          <button
            type="button"
            className="owner-action-btn edit"
            style={{ flex: "0 0 auto", padding: "10px 18px" }}
            onClick={() => {
              setFullName(profile?.full_name || "");
              setPhone(profile?.phone || "");
              setIsEditing(true);
            }}
          >
            ✏️ Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="owner-profile-form">
          <h3 style={{ margin: "0 0 10px", color: "var(--rd-text, #22577A)" }}>
            Edit Owner Profile
          </h3>

          {errorMsg && (
            <div style={{ color: "#dc2626", fontSize: "13px" }}>{errorMsg}</div>
          )}
          {successMsg && (
            <div style={{ color: "#15803d", fontSize: "13px" }}>{successMsg}</div>
          )}

          <div className="form-group">
            <label htmlFor="ownerFullName">Full Name</label>
            <input
              id="ownerFullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ownerPhone">Phone Number</label>
            <input
              id="ownerPhone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
            />
            <small style={{ color: "var(--rd-muted, #3a6f86)", fontSize: "11px" }}>
              Updating your phone will sync contact info across your active listings.
            </small>
          </div>

          <div className="owner-profile-btn-row">
            <button
              type="submit"
              className="owner-action-btn edit"
              disabled={isSaving}
              style={{ flex: 1, padding: "10px" }}
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
            <button
              type="button"
              className="owner-action-btn view"
              disabled={isSaving}
              onClick={() => setIsEditing(false)}
              style={{ flex: 1, padding: "10px" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
