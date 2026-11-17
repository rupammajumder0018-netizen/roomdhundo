import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ownerService } from "../../services/owner/index.js";
import { ROUTE_PATHS } from "../../routes/paths";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import ImageUploader from "../../components/listings/ImageUploader";
import RoomTypeManager from "../../components/listings/RoomTypeManager";

const HOTEL_FACILITIES = [
  "Free Wi-Fi",
  "Free Breakfast",
  "AC Rooms",
  "Room Service",
  "24x7 Front Desk",
  "Attached Bathroom",
  "Hot Water / Geyser",
  "Elevator / Lift",
  "Parking",
  "Power Backup",
  "Couple Friendly",
  "Restaurant / Dining",
];

export default function HotelListingPage() {
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
  const [starRating, setStarRating] = useState("3");
  const [location, setLocation] = useState("");
  const [checkInTime, setCheckInTime] = useState("12:00 PM");
  const [checkOutTime, setCheckOutTime] = useState("11:00 AM");
  const [description, setDescription] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState(["Free Wi-Fi", "AC Rooms", "24x7 Front Desk"]);
  const [images, setImages] = useState([]);
  const [ownerName, setOwnerName] = useState(profile?.full_name || "");
  const [ownerPhone, setOwnerPhone] = useState(profile?.phone || "");

  // Rooms state
  const [roomTypes, setRoomTypes] = useState([
    {
      name: "Deluxe AC Room",
      price_per_night: "1800",
      price_monthly: "35000",
      occupancy: 2,
      available_rooms: 4,
    },
  ]);

  // Load existing data in edit mode
  useEffect(() => {
    if (!isEdit || !user?.id) return;

    let isMounted = true;
    async function loadHotel() {
      setLoading(true);
      const { data, error } = await ownerService.fetchPropertyForEdit(editId, user.id);
      if (error) {
        setFormError(error.message || "Failed to load hotel listing.");
      } else if (data && isMounted) {
        setName(data.name || "");
        setLocation(data.location || "");
        setDescription(data.description || "");
        setImages(Array.isArray(data.images) ? data.images : []);
        setOwnerName(data.owner_name || "");
        setOwnerPhone(data.owner_phone || "");

        if (Array.isArray(data.facilities)) {
          setSelectedFacilities(data.facilities);
        }

        if (Array.isArray(data.room_types) && data.room_types.length > 0) {
          setRoomTypes(data.room_types);
        }
      }
      setLoading(false);
    }

    loadHotel();
    return () => {
      isMounted = false;
    };
  }, [isEdit, editId, user?.id]);

  const toggleFacility = (facility) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const handleNextStep = () => {
    setFormError("");
    if (currentStep === 1) {
      if (!name.trim()) {
        setFormError("Please enter the hotel name.");
        return;
      }
      if (!location.trim()) {
        setFormError("Please enter the hotel location.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!roomTypes.length) {
        setFormError("Please configure at least one room category.");
        return;
      }
      for (let i = 0; i < roomTypes.length; i++) {
        const r = roomTypes[i];
        if (!r.name?.trim()) {
          setFormError(`Please name Room Option #${i + 1}.`);
          return;
        }
        if (!r.price_per_night || Number(r.price_per_night) <= 0) {
          setFormError(`Please enter a valid nightly rate for ${r.name}.`);
          return;
        }
      }
    }
    if (currentStep < 3) {
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
      setCurrentStep(1);
      return;
    }
    if (!ownerPhone.trim() || ownerPhone.replace(/\D/g, "").length !== 10) {
      setFormError("Please enter a valid 10-digit mobile number.");
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);

    try {
      const fullDescription = `${description ? description + "\n\n" : ""}Check-in: ${checkInTime} | Check-out: ${checkOutTime} | Rating: ${starRating} Star`;

      const buildingCore = {
        name: name.trim(),
        location: location.trim(),
        type: "Hotel",
        description: fullDescription.trim(),
        rules: `Check-in: ${checkInTime}, Check-out: ${checkOutTime}. Valid government ID required at check-in.`,
        owner_name: ownerName.trim(),
        owner_phone: ownerPhone.trim(),
        owner_email: profile?.email || user?.email || null,
        images,
        facilities: [...selectedFacilities, `${starRating} Star`],
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
        throw error || new Error("Failed to save hotel listing.");
      }

      navigate(ROUTE_PATHS.OWNER_DASHBOARD);
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--rd-bg)] text-[var(--rd-text)]">
      <Header />

      <main className="flex-1">
        <div className="listing-wizard-page">
          <div className="listing-wizard-header">
            <div>
              <h1>{isEdit ? "Edit Hotel Listing" : "List Your Hotel / Guest House"}</h1>
              <p>Step {currentStep} of 3 — {currentStep === 1 ? "Hotel Information" : currentStep === 2 ? "Rooms & Rates" : "Review & Publish"}</p>
            </div>
            <div className="listing-wizard-meta">
              <span className="listing-wizard-badge">Hotel / Guest House</span>
              <Link to={ROUTE_PATHS.LIST_PROPERTY} style={{ fontSize: "12px", color: "var(--rd-muted, #3a6f86)" }}>
                ← Change Property Type
              </Link>
            </div>
          </div>

          {/* Progress bar */}
          <div className="wizard-progress-bar" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className={`wizard-progress-step ${currentStep === 1 ? "active" : currentStep > 1 ? "done" : ""}`} onClick={() => setCurrentStep(1)}>
              <span className="wizard-step-num">1</span>
              <div><strong>Hotel Details</strong></div>
            </div>
            <div className={`wizard-progress-step ${currentStep === 2 ? "active" : currentStep > 2 ? "done" : ""}`} onClick={() => setCurrentStep(2)}>
              <span className="wizard-step-num">2</span>
              <div><strong>Rooms & Rates</strong></div>
            </div>
            <div className={`wizard-progress-step ${currentStep === 3 ? "active" : ""}`} onClick={() => setCurrentStep(3)}>
              <span className="wizard-step-num">3</span>
              <div><strong>Review & Publish</strong></div>
            </div>
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
              Loading hotel details...
            </div>
          ) : (
            <div className="wizard-card">
              {/* Step 1: Hotel Info */}
              {currentStep === 1 && (
                <div>
                  <h2>Step 1: Hotel Details & Amenities</h2>
                  <p className="wizard-card-lead">Name, star rating, timing, and facilities.</p>

                  <div className="wizard-form-grid">
                    <div className="wizard-form-group">
                      <label>Hotel Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Grand Palace Hotel & Suites"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="wizard-form-group">
                      <label>Star Rating</label>
                      <select value={starRating} onChange={(e) => setStarRating(e.target.value)}>
                        <option value="1">⭐ 1 Star</option>
                        <option value="2">⭐⭐ 2 Star</option>
                        <option value="3">⭐⭐⭐ 3 Star</option>
                        <option value="4">⭐⭐⭐⭐ 4 Star</option>
                        <option value="5">⭐⭐⭐⭐⭐ 5 Star</option>
                      </select>
                    </div>

                    <div className="wizard-form-group full">
                      <label>Address / Location *</label>
                      <input
                        type="text"
                        placeholder="e.g. Near City Center, Station Road"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                      />
                    </div>

                    <div className="wizard-form-group">
                      <label>Check-in Time</label>
                      <input
                        type="text"
                        placeholder="12:00 PM"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                      />
                    </div>

                    <div className="wizard-form-group">
                      <label>Check-out Time</label>
                      <input
                        type="text"
                        placeholder="11:00 AM"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                      />
                    </div>

                    <div className="wizard-form-group full">
                      <label>Hotel Description</label>
                      <textarea
                        rows="4"
                        placeholder="Tell guests about your hotel atmosphere, dining options, and guest services..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="wizard-form-group full">
                      <label>Facilities & Services</label>
                      <div className="wizard-chips">
                        {HOTEL_FACILITIES.map((fac) => (
                          <label key={fac} className="wizard-chip">
                            <input
                              type="checkbox"
                              checked={selectedFacilities.includes(fac)}
                              onChange={() => toggleFacility(fac)}
                            />
                            {fac}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="wizard-form-group full">
                      <ImageUploader
                        images={images}
                        onImagesChange={setImages}
                        userId={user?.id}
                        maxCount={8}
                        label="Hotel & Lobby Photos"
                        hint="Upload photos of hotel exterior, reception, and amenities."
                      />
                    </div>

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
                      <label>Contact Phone (10 digits) *</label>
                      <input
                        type="tel"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Rooms & Rates */}
              {currentStep === 2 && (
                <div>
                  <h2>Step 2: Room Categories & Nightly Rates</h2>
                  <p className="wizard-card-lead">Define room types, pricing per night, and capacity.</p>

                  <RoomTypeManager
                    roomTypes={roomTypes}
                    onChange={setRoomTypes}
                    showNightlyRate={true}
                  />
                </div>
              )}

              {/* Step 3: Review & Publish */}
              {currentStep === 3 && (
                <div>
                  <h2>Step 3: Review & Publish</h2>
                  <p className="wizard-card-lead">Verify your hotel details before publishing.</p>

                  <div style={{ background: "var(--rd-surface-soft, #e6f7ef)", padding: "18px", borderRadius: "12px", marginBottom: "16px" }}>
                    <p style={{ margin: "0 0 6px" }}><strong>Hotel:</strong> {name} ({starRating} Star)</p>
                    <p style={{ margin: "0 0 6px" }}><strong>Location:</strong> {location}</p>
                    <p style={{ margin: "0 0 6px" }}><strong>Timing:</strong> Check-in {checkInTime} / Check-out {checkOutTime}</p>
                    <p style={{ margin: "0 0 6px" }}><strong>Rooms Configured:</strong> {roomTypes.length} categories</p>
                    <p style={{ margin: "0 0 6px" }}><strong>Photos:</strong> {images.length} uploaded</p>
                    <p style={{ margin: 0 }}><strong>Manager Contact:</strong> {ownerName} ({ownerPhone})</p>
                  </div>
                </div>
              )}

              {/* Footer nav */}
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

                {currentStep < 3 ? (
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
                    {submitting ? "Publishing..." : isEdit ? "Update Hotel" : "Publish Hotel Listing"}
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
