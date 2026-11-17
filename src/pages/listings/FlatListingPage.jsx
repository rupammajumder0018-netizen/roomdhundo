import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ownerService } from "../../services/owner/index.js";
import { ROUTE_PATHS } from "../../routes/paths";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import ImageUploader from "../../components/listings/ImageUploader";

const FLAT_AMENITIES = [
  "Lift",
  "Reserved Parking",
  "Power Backup",
  "24x7 Security",
  "Gym",
  "Clubhouse",
  "Piped Gas",
  "Water Supply",
  "Swimming Pool",
  "Park / Green Area",
];

export default function FlatListingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = Boolean(editId);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [offerType, setOfferType] = useState("Rent");
  const [flatType, setFlatType] = useState("2 BHK");
  const [furnishing, setFurnishing] = useState("Semi-Furnished");
  const [bathrooms, setBathrooms] = useState(2);
  const [balconies, setBalconies] = useState(1);
  const [location, setLocation] = useState("");
  const [carpetArea, setCarpetArea] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [facing, setFacing] = useState("East");
  const [rentPrice, setRentPrice] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("1 Month");
  const [selectedAmenities, setSelectedAmenities] = useState(["Lift", "24x7 Security"]);
  const [bachelorsAllowed, setBachelorsAllowed] = useState(true);
  const [familyAllowed, setFamilyAllowed] = useState(true);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [images, setImages] = useState([]);
  const [ownerName, setOwnerName] = useState(profile?.full_name || "");
  const [ownerPhone, setOwnerPhone] = useState(profile?.phone || "");
  const [ownerAltPhone, setOwnerAltPhone] = useState("");

  // Load existing data in edit mode
  useEffect(() => {
    if (!isEdit || !user?.id) return;

    let isMounted = true;
    async function loadFlat() {
      setLoading(true);
      const { data, error } = await ownerService.fetchPropertyForEdit(editId, user.id);
      if (error) {
        setFormError(error.message || "Failed to load flat listing.");
      } else if (data && isMounted) {
        setName(data.name || "");
        setLocation(data.location || "");
        setImages(Array.isArray(data.images) ? data.images : []);
        setOwnerName(data.owner_name || "");
        setOwnerPhone(data.owner_phone || "");
        setOwnerAltPhone(data.owner_alt_phone || "");

        if (Array.isArray(data.room_types) && data.room_types.length > 0) {
          const r = data.room_types[0];
          setRentPrice(r.price_monthly ? String(r.price_monthly) : "");
        }
      }
      setLoading(false);
    }

    loadFlat();
    return () => {
      isMounted = false;
    };
  }, [isEdit, editId, user?.id]);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleNextStep = () => {
    setFormError("");
    if (currentStep === 1 && !name.trim()) {
      setFormError("Please enter the listing title.");
      return;
    }
    if (currentStep === 2 && !location.trim()) {
      setFormError("Please enter the locality or landmark.");
      return;
    }
    if (currentStep === 4 && (!rentPrice || Number(rentPrice) <= 0)) {
      setFormError("Please enter a valid monthly rent / price.");
      return;
    }
    if (currentStep < 9) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setFormError("");
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!ownerName.trim()) {
      setFormError("Please enter contact name.");
      setCurrentStep(8);
      return;
    }
    if (!ownerPhone.trim() || ownerPhone.replace(/\D/g, "").length !== 10) {
      setFormError("Please enter a valid 10-digit mobile number.");
      setCurrentStep(8);
      return;
    }

    setSubmitting(true);

    try {
      const description = `${offerType} ${flatType} flat in ${location}. ${furnishing}, ${bathrooms} baths, ${carpetArea ? carpetArea + " sq.ft." : ""}. Floor: ${floorNumber}/${totalFloors || "—"}. Facing: ${facing}. Deposit: ₹${securityDeposit || 0}. Maintenance: ₹${maintenance || 0}.`;

      const preferences = [];
      if (bachelorsAllowed) preferences.push("Bachelors Allowed");
      if (familyAllowed) preferences.push("Family Preferred");
      if (petsAllowed) preferences.push("Pets Allowed");

      const buildingCore = {
        name: name.trim(),
        location: location.trim(),
        type: "Flat",
        description,
        rules: preferences.join(", "),
        owner_name: ownerName.trim(),
        owner_phone: ownerPhone.trim(),
        owner_alt_phone: ownerAltPhone.trim() || null,
        owner_email: profile?.email || user?.email || null,
        images,
        facilities: [...selectedAmenities, furnishing],
        status: "pending",
      };

      const roomTypeInputs = [
        {
          name: `${flatType} Flat`,
          price_monthly: Number(rentPrice) || 0,
          occupancy: parseInt(flatType, 10) ? parseInt(flatType, 10) * 2 : 2,
          available_rooms: 1,
          total_rooms: 1,
        },
      ];

      const { success, error } = await ownerService.savePropertyListing({
        buildingCore,
        roomTypeInputs,
        isEdit,
        editId,
        ownerId: user.id,
      });

      if (!success) {
        throw error || new Error("Failed to save flat listing.");
      }

      navigate(ROUTE_PATHS.OWNER_DASHBOARD);
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    "1. Basics",
    "2. Location",
    "3. Layout",
    "4. Pricing",
    "5. Amenities",
    "6. Tenant Rules",
    "7. Photos",
    "8. Contact",
    "9. Review",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--rd-bg)] text-[var(--rd-text)]">
      <Header />

      <main className="flex-1">
        <div className="listing-wizard-page">
          <div className="listing-wizard-header">
            <div>
              <h1>{isEdit ? "Edit Flat Listing" : "List Your Flat / Apartment"}</h1>
              <p>Step {currentStep} of 9 — {stepsList[currentStep - 1]}</p>
            </div>
            <div className="listing-wizard-meta">
              <span className="listing-wizard-badge">Flat / Apartment</span>
              <Link to={ROUTE_PATHS.LIST_PROPERTY} style={{ fontSize: "12px", color: "var(--rd-muted, #3a6f86)" }}>
                ← Change Property Type
              </Link>
            </div>
          </div>

          {/* Steps Breadcrumbs */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              paddingBottom: "12px",
              marginBottom: "20px",
            }}
          >
            {stepsList.map((st, idx) => (
              <button
                key={st}
                type="button"
                onClick={() => setCurrentStep(idx + 1)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  background:
                    currentStep === idx + 1
                      ? "var(--rd-accent, #38A3A5)"
                      : currentStep > idx + 1
                      ? "var(--rd-surface-soft, #e6f7ef)"
                      : "transparent",
                  color:
                    currentStep === idx + 1
                      ? "#fff"
                      : "var(--rd-text, #22577A)",
                }}
              >
                {st}
              </button>
            ))}
          </div>

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

          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--rd-muted, #3a6f86)" }}>
              Loading listing...
            </div>
          ) : (
            <div className="wizard-card">
              {/* Step 1: Basics */}
              {currentStep === 1 && (
                <div>
                  <h2>Step 1: Basic Flat Details</h2>
                  <p className="wizard-card-lead">Specify property name and configuration.</p>
                  <div className="wizard-form-grid">
                    <div className="wizard-form-group full">
                      <label>Listing Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Spacious 2BHK in Greenwood Heights"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="wizard-form-group">
                      <label>Listing Offer</label>
                      <select value={offerType} onChange={(e) => setOfferType(e.target.value)}>
                        <option value="Rent">For Rent</option>
                        <option value="Sale">For Sale</option>
                      </select>
                    </div>
                    <div className="wizard-form-group">
                      <label>Flat Type</label>
                      <select value={flatType} onChange={(e) => setFlatType(e.target.value)}>
                        <option value="1 RK / Studio">1 RK / Studio</option>
                        <option value="1 BHK">1 BHK</option>
                        <option value="2 BHK">2 BHK</option>
                        <option value="3 BHK">3 BHK</option>
                        <option value="4+ BHK">4+ BHK</option>
                      </select>
                    </div>
                    <div className="wizard-form-group">
                      <label>Furnishing Status</label>
                      <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)}>
                        <option value="Furnished">Furnished</option>
                        <option value="Semi-Furnished">Semi-Furnished</option>
                        <option value="Unfurnished">Unfurnished</option>
                      </select>
                    </div>
                    <div className="wizard-form-group">
                      <label>Bathrooms</label>
                      <input
                        type="number"
                        min="1"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <div>
                  <h2>Step 2: Location & Neighborhood</h2>
                  <p className="wizard-card-lead">Enter the address where the flat is located.</p>
                  <div className="wizard-form-grid">
                    <div className="wizard-form-group full">
                      <label>Locality / Address / Landmark *</label>
                      <input
                        type="text"
                        placeholder="e.g. Sector 5, Salt Lake, Kolkata"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Layout & Size */}
              {currentStep === 3 && (
                <div>
                  <h2>Step 3: Layout & Floor Details</h2>
                  <p className="wizard-card-lead">Carpet area and floor details.</p>
                  <div className="wizard-form-grid">
                    <div className="wizard-form-group">
                      <label>Carpet Area (sq. ft.)</label>
                      <input
                        type="number"
                        placeholder="e.g. 950"
                        value={carpetArea}
                        onChange={(e) => setCarpetArea(e.target.value)}
                      />
                    </div>
                    <div className="wizard-form-group">
                      <label>Floor Number</label>
                      <input
                        type="number"
                        placeholder="e.g. 3"
                        value={floorNumber}
                        onChange={(e) => setFloorNumber(e.target.value)}
                      />
                    </div>
                    <div className="wizard-form-group">
                      <label>Total Floors in Building</label>
                      <input
                        type="number"
                        placeholder="e.g. 10"
                        value={totalFloors}
                        onChange={(e) => setTotalFloors(e.target.value)}
                      />
                    </div>
                    <div className="wizard-form-group">
                      <label>Facing Direction</label>
                      <select value={facing} onChange={(e) => setFacing(e.target.value)}>
                        <option value="East">East</option>
                        <option value="North">North</option>
                        <option value="North-East">North-East</option>
                        <option value="West">West</option>
                        <option value="South">South</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Pricing */}
              {currentStep === 4 && (
                <div>
                  <h2>Step 4: Pricing & Financials</h2>
                  <p className="wizard-card-lead">Rent, deposit, and maintenance terms.</p>
                  <div className="wizard-form-grid">
                    <div className="wizard-form-group">
                      <label>Monthly Rent / Price (₹) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 18000"
                        value={rentPrice}
                        onChange={(e) => setRentPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="wizard-form-group">
                      <label>Security Deposit (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 36000"
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(e.target.value)}
                      />
                    </div>
                    <div className="wizard-form-group">
                      <label>Monthly Maintenance (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1500"
                        value={maintenance}
                        onChange={(e) => setMaintenance(e.target.value)}
                      />
                    </div>
                    <div className="wizard-form-group">
                      <label>Notice Period</label>
                      <select value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)}>
                        <option value="15 Days">15 Days</option>
                        <option value="1 Month">1 Month</option>
                        <option value="2 Months">2 Months</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Amenities */}
              {currentStep === 5 && (
                <div>
                  <h2>Step 5: Society & Apartment Amenities</h2>
                  <p className="wizard-card-lead">Select amenities provided with the flat.</p>
                  <div className="wizard-chips">
                    {FLAT_AMENITIES.map((am) => (
                      <label key={am} className="wizard-chip">
                        <input
                          type="checkbox"
                          checked={selectedAmenities.includes(am)}
                          onChange={() => toggleAmenity(am)}
                        />
                        {am}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 6: Tenant Rules */}
              {currentStep === 6 && (
                <div>
                  <h2>Step 6: Tenant Preferences</h2>
                  <p className="wizard-card-lead">Indicate suitability and pet policy.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={bachelorsAllowed}
                        onChange={(e) => setBachelorsAllowed(e.target.checked)}
                      />
                      <strong>Bachelors Welcome</strong>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={familyAllowed}
                        onChange={(e) => setFamilyAllowed(e.target.checked)}
                      />
                      <strong>Families Preferred</strong>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={petsAllowed}
                        onChange={(e) => setPetsAllowed(e.target.checked)}
                      />
                      <strong>Pet-Friendly</strong>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 7: Photos */}
              {currentStep === 7 && (
                <div>
                  <h2>Step 7: Upload Photos</h2>
                  <p className="wizard-card-lead">Living room, bedroom, kitchen, and balcony.</p>
                  <ImageUploader
                    images={images}
                    onImagesChange={setImages}
                    userId={user?.id}
                    maxCount={6}
                  />
                </div>
              )}

              {/* Step 8: Contact */}
              {currentStep === 8 && (
                <div>
                  <h2>Step 8: Owner Contact</h2>
                  <p className="wizard-card-lead">Contact details for tenant enquiries.</p>
                  <div className="wizard-form-grid">
                    <div className="wizard-form-group">
                      <label>Contact Name *</label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="wizard-form-group">
                      <label>Mobile Number (10 digits) *</label>
                      <input
                        type="tel"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="wizard-form-group">
                      <label>Alternative Number</label>
                      <input
                        type="tel"
                        value={ownerAltPhone}
                        onChange={(e) => setOwnerAltPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 9: Review */}
              {currentStep === 9 && (
                <div>
                  <h2>Step 9: Review & Submit</h2>
                  <p className="wizard-card-lead">Check your details before publishing.</p>
                  <div style={{ background: "var(--rd-surface-soft, #e6f7ef)", padding: "18px", borderRadius: "12px", marginBottom: "16px" }}>
                    <p style={{ margin: "0 0 6px" }}><strong>Property:</strong> {name} ({offerType} - {flatType})</p>
                    <p style={{ margin: "0 0 6px" }}><strong>Location:</strong> {location}</p>
                    <p style={{ margin: "0 0 6px" }}><strong>Price:</strong> ₹{Number(rentPrice).toLocaleString()} / month</p>
                    <p style={{ margin: "0 0 6px" }}><strong>Furnishing:</strong> {furnishing}</p>
                    <p style={{ margin: "0 0 6px" }}><strong>Photos:</strong> {images.length} uploaded</p>
                    <p style={{ margin: 0 }}><strong>Contact:</strong> {ownerName} ({ownerPhone})</p>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--rd-muted, #3a6f86)" }}>
                    ℹ️ Flat listings are placed in pending review status for admin verification.
                  </p>
                </div>
              )}

              {/* Wizard Nav Controls */}
              <div className="wizard-footer-nav">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    className="owner-action-btn view"
                    onClick={handlePrevStep}
                    style={{ padding: "10px 20px" }}
                  >
                    ← Back
                  </button>
                ) : (
                  <Link to={ROUTE_PATHS.OWNER_DASHBOARD} className="owner-action-btn view" style={{ padding: "10px 20px" }}>
                    Cancel
                  </Link>
                )}

                {currentStep < 9 ? (
                  <button
                    type="button"
                    className="owner-action-btn edit"
                    onClick={handleNextStep}
                    style={{ padding: "10px 24px" }}
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="owner-action-btn edit"
                    disabled={submitting}
                    onClick={handleSubmit}
                    style={{ padding: "12px 32px", fontSize: "14px" }}
                  >
                    {submitting ? "Submitting..." : isEdit ? "Update Flat" : "Submit Flat for Review"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
