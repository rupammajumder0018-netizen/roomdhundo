import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ownerService } from "../../services/owner/index.js";
import { ROUTE_PATHS } from "../../routes/paths";
import ImageUploader from "../../components/listings/ImageUploader";
import RoomTypeManager from "../../components/listings/RoomTypeManager";

const STANDARD_FACILITIES = [
  { value: "wifi", label: "📶 Wi-Fi" },
  { value: "food", label: "🍛 Food / Meals" },
  { value: "ac", label: "❄️ AC" },
  { value: "laundry", label: "🧺 Laundry" },
  { value: "parking", label: "🚗 Parking" },
  { value: "bathroom", label: "🚿 Attached Bathroom" },
  { value: "kitchen", label: "🍳 Attached Kitchen" },
  { value: "couple-friendly", label: "💑 Couple Friendly" },
];

export default function PgListingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = Boolean(editId);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("PG");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [listedBy, setListedBy] = useState("Property Owner");
  const [ownerName, setOwnerName] = useState(profile?.full_name || "");
  const [ownerPhone, setOwnerPhone] = useState(profile?.phone || "");
  const [ownerAltPhone, setOwnerAltPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState(profile?.email || user?.email || "");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [furnishing, setFurnishing] = useState("furnished");
  const [selectedFacilities, setSelectedFacilities] = useState(["wifi"]);
  const [customFacilityInput, setCustomFacilityInput] = useState("");
  const [customFacilities, setCustomFacilities] = useState([]);
  const [images, setImages] = useState([]);

  // Room types state
  const [roomTypes, setRoomTypes] = useState([
    {
      name: "Single Room",
      price_monthly: "",
      occupancy: 1,
      available_rooms: 1,
    },
  ]);

  // Load existing data in edit mode
  useEffect(() => {
    if (!isEdit || !user?.id) return;

    let isMounted = true;
    async function loadListing() {
      setLoading(true);
      const { data, error } = await ownerService.fetchPropertyForEdit(editId, user.id);
      if (error) {
        setFormError(error.message || "Failed to load property for editing.");
      } else if (data && isMounted) {
        setName(data.name || "");
        setLocation(data.location || "");
        setType(data.type || "PG");
        setDescription(data.description || "");
        setRules(data.rules || "");
        setOwnerName(data.owner_name || "");
        setOwnerPhone(data.owner_phone || "");
        setOwnerAltPhone(data.owner_alt_phone || "");
        setOwnerEmail(data.owner_email || "");
        setLatitude(data.latitude ? String(data.latitude) : "");
        setLongitude(data.longitude ? String(data.longitude) : "");
        setImages(Array.isArray(data.images) ? data.images : []);

        if (Array.isArray(data.facilities)) {
          setSelectedFacilities(data.facilities);
        }

        if (Array.isArray(data.room_types) && data.room_types.length > 0) {
          setRoomTypes(data.room_types);
        }
      }
      setLoading(false);
    }

    loadListing();
    return () => {
      isMounted = false;
    };
  }, [isEdit, editId, user?.id]);

  const handleFacilityToggle = (facilityVal) => {
    setSelectedFacilities((prev) =>
      prev.includes(facilityVal)
        ? prev.filter((f) => f !== facilityVal)
        : [...prev, facilityVal]
    );
  };

  const handleAddCustomFacility = () => {
    const val = customFacilityInput.trim();
    if (val && !customFacilities.includes(val)) {
      setCustomFacilities([...customFacilities, val]);
      setCustomFacilityInput("");
    }
  };

  const handleRemoveCustomFacility = (itemToRemove) => {
    setCustomFacilities(customFacilities.filter((item) => item !== itemToRemove));
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Please enter the property name.");
      return;
    }
    if (!location.trim()) {
      setFormError("Please enter the location or area.");
      return;
    }
    if (!ownerName.trim()) {
      setFormError("Please enter the property owner's name.");
      return;
    }
    if (!ownerPhone.trim() || ownerPhone.replace(/\D/g, "").length !== 10) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Validate rooms
    if (!roomTypes.length) {
      setFormError("Please configure at least one room type.");
      return;
    }
    for (let i = 0; i < roomTypes.length; i++) {
      const r = roomTypes[i];
      if (!r.name?.trim()) {
        setFormError(`Please name Room Option #${i + 1}.`);
        return;
      }
      if (!r.price_monthly || Number(r.price_monthly) <= 0) {
        setFormError(`Please set a valid monthly rent for ${r.name}.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      // Merge all facilities
      const combinedFacilities = [
        ...selectedFacilities,
        furnishing,
        ...customFacilities,
      ];

      const buildingCore = {
        name: name.trim(),
        location: location.trim(),
        type: type.trim(),
        description: description.trim(),
        rules: rules.trim(),
        owner_name: ownerName.trim(),
        owner_phone: ownerPhone.trim(),
        owner_alt_phone: ownerAltPhone.trim() || null,
        owner_email: ownerEmail.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        images,
        facilities: combinedFacilities,
        status: "pending",
      };

      const { success, error } = await ownerService.savePropertyListing({
        buildingCore,
        roomTypeInputs: roomTypes,
        isEdit,
        editId,
        ownerId: user.id,
      });

      if (!success) {
        throw error || new Error("Failed to save property listing.");
      }

      navigate(ROUTE_PATHS.OWNER_DASHBOARD);
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--rd-bg)] text-[var(--rd-text)]">
      <main>
        <div className="listing-wizard-page">
          <div className="listing-wizard-header">
            <div>
              <h1>{isEdit ? "Edit PG Listing" : "List Your PG / Room"}</h1>
              <p>
                Enter your accommodation details, facilities, photos, and available room options.
              </p>
            </div>
            <div className="listing-wizard-meta">
              <span className="listing-wizard-badge">PG / Hostel / Room</span>
              <Link to={ROUTE_PATHS.LIST_PROPERTY} style={{ fontSize: "12px", color: "var(--rd-muted, #3a6f86)" }}>
                ← Change Property Type
              </Link>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--rd-muted, #3a6f86)" }}>
              Loading listing details...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {formError && (
                <div
                  style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    padding: "14px 18px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {formError}
                </div>
              )}

              {/* Card 1: Basic Information */}
              <div className="wizard-card">
                <h2>1. Property Overview</h2>
                <p className="wizard-card-lead">Basic information seen in search results.</p>

                <div className="wizard-form-grid">
                  <div className="wizard-form-group">
                    <label htmlFor="pgName">PG / Property Name *</label>
                    <input
                      id="pgName"
                      type="text"
                      placeholder="e.g. Sunrise PG, Green View Hostel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="wizard-form-group">
                    <label htmlFor="pgLocation">Location / Area *</label>
                    <input
                      id="pgLocation"
                      type="text"
                      placeholder="e.g. Jaguli, near MAKAUT, Nadia"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="wizard-form-group">
                    <label htmlFor="pgType">Category</label>
                    <select
                      id="pgType"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="PG">Paying Guest (PG)</option>
                      <option value="Room">Single Room</option>
                      <option value="Mess">Mess / Hostel</option>
                      <option value="Guest House">Guest House</option>
                    </select>
                  </div>

                  <div className="wizard-form-group">
                    <label htmlFor="pgFurnishing">Furnishing Status</label>
                    <select
                      id="pgFurnishing"
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value)}
                    >
                      <option value="furnished">🛋️ Furnished</option>
                      <option value="semi-furnished">🪑 Semi-Furnished</option>
                      <option value="unfurnished">🏠 Unfurnished</option>
                    </select>
                  </div>

                  <div className="wizard-form-group full">
                    <label htmlFor="pgDescription">Description *</label>
                    <textarea
                      id="pgDescription"
                      rows="4"
                      placeholder="Describe what makes this accommodation comfortable and convenient for tenants..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="wizard-form-group full">
                    <label htmlFor="pgRules">House Rules (Optional)</label>
                    <textarea
                      id="pgRules"
                      rows="3"
                      placeholder="e.g. Gate closes at 10 PM. No smoking inside rooms."
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Facilities */}
              <div className="wizard-card">
                <h2>2. Amenities & Facilities</h2>
                <p className="wizard-card-lead">Select all amenities available at this property.</p>

                <div className="wizard-chips" style={{ marginBottom: "18px" }}>
                  {STANDARD_FACILITIES.map((fac) => (
                    <label key={fac.value} className="wizard-chip">
                      <input
                        type="checkbox"
                        checked={selectedFacilities.includes(fac.value)}
                        onChange={() => handleFacilityToggle(fac.value)}
                      />
                      {fac.label}
                    </label>
                  ))}
                </div>

                <div className="wizard-form-group">
                  <label htmlFor="customFac">Add Custom Amenity</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      id="customFac"
                      type="text"
                      placeholder="e.g. CCTV, Power backup, Geyser"
                      value={customFacilityInput}
                      onChange={(e) => setCustomFacilityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomFacility();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="owner-action-btn view"
                      style={{ flex: "0 0 auto", padding: "10px 16px" }}
                      onClick={handleAddCustomFacility}
                    >
                      Add
                    </button>
                  </div>

                  {customFacilities.length > 0 && (
                    <div className="wizard-chips" style={{ marginTop: "10px" }}>
                      {customFacilities.map((cf) => (
                        <span key={cf} className="wizard-chip">
                          {cf}
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomFacility(cf)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#dc2626",
                              marginLeft: "4px",
                            }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Photos */}
              <div className="wizard-card">
                <h2>3. Property Photos</h2>
                <p className="wizard-card-lead">Upload high quality photos of the property.</p>

                <ImageUploader
                  images={images}
                  onImagesChange={setImages}
                  userId={user?.id}
                  maxCount={5}
                />
              </div>

              {/* Card 4: Room Options & Rent */}
              <div className="wizard-card">
                <h2>4. Room Options & Pricing</h2>
                <p className="wizard-card-lead">Configure the room types and occupancy you offer.</p>

                <RoomTypeManager
                  roomTypes={roomTypes}
                  onChange={setRoomTypes}
                />
              </div>

              {/* Card 5: Owner / Contact Details */}
              <div className="wizard-card">
                <h2>5. Contact & Listing Ownership</h2>
                <p className="wizard-card-lead">Your contact information for renter calls and WhatsApp.</p>

                <div className="wizard-form-grid">
                  <div className="wizard-form-group">
                    <label>Listed By</label>
                    <select
                      value={listedBy}
                      onChange={(e) => setListedBy(e.target.value)}
                    >
                      <option value="Property Owner">I am the Property Owner</option>
                      <option value="Broker / Agent">I am an Agent / Caretaker</option>
                    </select>
                  </div>

                  <div className="wizard-form-group">
                    <label htmlFor="ownerName">Contact Name *</label>
                    <input
                      id="ownerName"
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="wizard-form-group">
                    <label htmlFor="ownerPhone">Mobile Phone (10 digits) *</label>
                    <input
                      id="ownerPhone"
                      type="tel"
                      placeholder="10-digit phone number"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="wizard-form-group">
                    <label htmlFor="ownerAltPhone">Alternative Phone (Optional)</label>
                    <input
                      id="ownerAltPhone"
                      type="tel"
                      placeholder="Alternative mobile number"
                      value={ownerAltPhone}
                      onChange={(e) => setOwnerAltPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="wizard-footer-nav">
                <Link to={ROUTE_PATHS.OWNER_DASHBOARD} className="owner-action-btn view" style={{ padding: "12px 24px" }}>
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="owner-action-btn edit"
                  disabled={submitting}
                  style={{ padding: "12px 32px", fontSize: "14px" }}
                >
                  {submitting
                    ? "Saving Listing..."
                    : isEdit
                    ? "Update Listing"
                    : "Publish PG Listing"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
