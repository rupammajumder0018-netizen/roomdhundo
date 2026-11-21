import React, { useState, useEffect, useRef } from "react";
import ImageUploader from "./ImageUploader.jsx";
import {
  PROPERTY_CATEGORIES,
  CATEGORY_MAP_BY_ID,
  getCategoryById,
  toggleSubcategorySelection,
  resolveMainCategoryFromProperty,
} from "../../constants/categories.js";
import { savePropertyListing } from "../../services/owner/index.js";
import { saveAdminProperty } from "../../services/admin/adminService.js";

export default function DynamicPropertyForm({
  initialData = null,
  mode = "create", // "create" | "edit"
  userRole = "owner", // "admin" | "owner" | "agent"
  userId = null,
  onSaveSuccess,
  onCancel,
}) {
  const isEdit = mode === "edit" && Boolean(initialData?.id);
  const isAdmin = userRole === "admin";
  const errorRef = useRef(null);

  // 1. Category & Subcategory State
  const initialResolved = resolveMainCategoryFromProperty(initialData);
  const [selectedCategory, setSelectedCategory] = useState(
    initialResolved.category.id || "pg_hostels"
  );
  const [selectedSubcategories, setSelectedSubcategories] = useState(
    initialResolved.subcategories.length > 0 ? initialResolved.subcategories : ["PG"]
  );

  // 2. Basic Information
  const [name, setName] = useState(initialData?.name || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [landmark, setLandmark] = useState(initialData?.landmark || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [latitude, setLatitude] = useState(
    initialData?.latitude != null ? String(initialData.latitude) : ""
  );
  const [longitude, setLongitude] = useState(
    initialData?.longitude != null ? String(initialData.longitude) : ""
  );

  // 3. Contact Details
  const [listedBy, setListedBy] = useState(
    initialData?.listed_by || (isAdmin ? "Administrator" : userRole === "agent" ? "Authorized Agent" : "Property Owner")
  );
  const [ownerName, setOwnerName] = useState(initialData?.owner_name || "");
  const [ownerPhone, setOwnerPhone] = useState(initialData?.owner_phone || "");
  const [ownerAltPhone, setOwnerAltPhone] = useState(initialData?.owner_alt_phone || "");
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(
    initialData?.owner_whatsapp || initialData?.category_details?.owner_whatsapp || ""
  );
  const [ownerEmail, setOwnerEmail] = useState(initialData?.owner_email || "");

  // 4. Admin-Only Controls
  const [verificationStatus, setVerificationStatus] = useState(
    initialData?.verification_status || "approved"
  );
  const [listingStatus, setListingStatus] = useState(
    initialData?.listing_status || "published"
  );
  const [assignedCreatedBy, setAssignedCreatedBy] = useState(
    initialData?.created_by || userId || ""
  );

  // 5. Category-Specific Specifications State
  const initialMeta = initialData?.category_details || initialData?.hotel_meta || {};
  const [pgSpecs, setPgSpecs] = useState({
    genderPreference: initialMeta.genderPreference || "Boys Only",
    preferredTenants: initialMeta.preferredTenants || "Both Students & Working",
    foodAvailability: initialMeta.foodAvailability || "Included in Monthly Rent",
    foodType: initialMeta.foodType || "Veg & Non-Veg",
    mealsProvided: initialMeta.mealsProvided || ["Breakfast", "Dinner"],
    gateClosingTime: initialMeta.gateClosingTime || "10:00 PM",
    noticePeriod: initialMeta.noticePeriod || "1 Month",
    securityDeposit: initialMeta.securityDeposit != null ? String(initialMeta.securityDeposit) : "",
    rulesText: Array.isArray(initialData?.rules) ? initialData.rules.join("\n") : (initialData?.rules || ""),
  });

  const [hotelSpecs, setHotelSpecs] = useState({
    starRating: initialMeta.starRating || "3 Star",
    checkInTime: initialMeta.checkInTime || "12:00 PM",
    checkOutTime: initialMeta.checkOutTime || "11:00 AM",
    hourlyAllowed: initialMeta.hourlyAllowed || false,
    coupleFriendly: initialMeta.coupleFriendly !== false,
    petFriendly: initialMeta.petFriendly || false,
    cancellationPolicy: initialMeta.cancellationPolicy || "Free cancellation up to 24 hours before check-in",
    hotelRules: Array.isArray(initialData?.rules) ? initialData.rules.join("\n") : (initialData?.rules || ""),
  });

  const [flatSpecs, setFlatSpecs] = useState({
    bhk: initialMeta.bhk || "2 BHK",
    offerType: initialData?.flat_offer || initialMeta.offerType || "Rent",
    furnishing: initialData?.furnishing || initialMeta.furnishing || "Semi-Furnished",
    carpetArea: initialMeta.carpetArea != null ? String(initialMeta.carpetArea) : "",
    floorNumber: initialMeta.floorNumber != null ? String(initialMeta.floorNumber) : "",
    totalFloors: initialMeta.totalFloors != null ? String(initialMeta.totalFloors) : "",
    facing: initialMeta.facing || "East",
    bathrooms: initialMeta.bathrooms != null ? Number(initialMeta.bathrooms) : 2,
    balconies: initialMeta.balconies != null ? Number(initialMeta.balconies) : 1,
    preferredTenants: initialMeta.preferredTenants || "Family or Working Professionals",
    maintenanceCharges: initialMeta.maintenanceCharges != null ? String(initialMeta.maintenanceCharges) : "",
    securityDeposit: initialMeta.securityDeposit != null ? String(initialMeta.securityDeposit) : "",
    noticePeriod: initialMeta.noticePeriod || "1 Month",
  });

  const [eventSpecs, setEventSpecs] = useState({
    seatingCapacity: initialMeta.seatingCapacity != null ? String(initialMeta.seatingCapacity) : "250",
    floatingCapacity: initialMeta.floatingCapacity != null ? String(initialMeta.floatingCapacity) : "500",
    venueArea: initialMeta.venueArea != null ? String(initialMeta.venueArea) : "",
    eventTypes: initialMeta.eventTypes || [
      "Weddings & Receptions",
      "Birthday & Anniversary Parties",
      "Corporate Conferences & Seminars",
    ],
    cateringPolicy: initialMeta.cateringPolicy || "Both In-House & Outside Catering",
    foodAllowed: initialMeta.foodAllowed || "Veg & Non-Veg",
    alcoholPolicy: initialMeta.alcoholPolicy || "Allowed with Valid License",
    musicPolicy: initialMeta.musicPolicy || "Allowed (curfew 10:00 PM)",
    bridalRoomsCount: initialMeta.bridalRoomsCount != null ? Number(initialMeta.bridalRoomsCount) : 2,
    decorPolicy: initialMeta.decorPolicy || "Outside Decorators Allowed",
  });

  // 6. Facilities & Amenities State
  const currentCategoryDef = CATEGORY_MAP_BY_ID[selectedCategory] || PROPERTY_CATEGORIES[0];
  const [selectedAmenities, setSelectedAmenities] = useState(() => {
    if (Array.isArray(initialData?.facilities) && initialData.facilities.length > 0) {
      return initialData.facilities;
    }
    return currentCategoryDef.amenities.slice(0, 5).map((a) => a.label);
  });
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  // 7. Photos State
  const [images, setImages] = useState(
    Array.isArray(initialData?.images) ? initialData.images : []
  );

  // 8. Rooms / Units / Pricing State
  const initRoomsFromData = () => {
    const rawRooms = Array.isArray(initialData?.room_types) ? initialData.room_types : [];
    if (rawRooms.length > 0) {
      return rawRooms.map((r) => ({
        id: r.id || null,
        room_type: r.room_type || "",
        sharing_type: r.room_details?.sharing_type || (r.room_people === 1 ? "Single Room" : `${r.room_people} Sharing`),
        monthly_rent: r.price_value ?? r.room_rent ?? "",
        daily_price: r.daily_price ?? "",
        hourly_price: r.hourly_price ?? "",
        weekend_price: r.weekend_price ?? "",
        room_people: r.room_people || 1,
        available_rooms: r.available_rooms ?? 1,
        total_rooms: r.total_rooms ?? r.available_rooms ?? 1,
        attached_bath: r.room_details?.attached_bath !== false,
        ac_available: r.room_details?.ac_available || false,
        room_size: r.room_size ?? "",
      }));
    }

    // Default room template based on selected category
    if (selectedCategory === "pg_hostels") {
      return [
        {
          id: null,
          room_type: "Double Sharing Room",
          sharing_type: "2 Sharing / Double",
          monthly_rent: "5500",
          daily_price: "",
          room_people: 2,
          available_rooms: 2,
          total_rooms: 2,
          attached_bath: true,
          ac_available: false,
        },
      ];
    } else if (selectedCategory === "hotels_stays") {
      return [
        {
          id: null,
          room_type: "Deluxe AC Room",
          sharing_type: "",
          monthly_rent: "",
          daily_price: "1800",
          hourly_price: "",
          room_people: 2,
          available_rooms: 4,
          total_rooms: 4,
          attached_bath: true,
          ac_available: true,
        },
      ];
    } else if (selectedCategory === "flats_rentals") {
      return [
        {
          id: null,
          room_type: "2 BHK Flat",
          sharing_type: "",
          monthly_rent: "14000",
          daily_price: "",
          room_people: 4,
          available_rooms: 1,
          total_rooms: 1,
          attached_bath: true,
          ac_available: false,
        },
      ];
    } else {
      return [
        {
          id: null,
          room_type: "Main Banquet Hall",
          sharing_type: "",
          monthly_rent: "",
          daily_price: "25000",
          hourly_price: "3500",
          room_people: 250,
          available_rooms: 1,
          total_rooms: 1,
          attached_bath: true,
          ac_available: true,
        },
      ];
    }
  };

  const [rooms, setRooms] = useState(initRoomsFromData);

  // Status & UI State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // When switching category in CREATE mode, adapt amenities and room template
  const handleCategorySwitch = (newCategoryId) => {
    if (newCategoryId === selectedCategory) return;
    setSelectedCategory(newCategoryId);
    const newCatDef = CATEGORY_MAP_BY_ID[newCategoryId] || PROPERTY_CATEGORIES[0];

    // Default to the first subcategory or "All"
    setSelectedSubcategories([newCatDef.subcategories[1] || "All"]);

    // Update default amenities to match new category
    setSelectedAmenities(newCatDef.amenities.slice(0, 6).map((a) => a.label));

    // Update default room options
    if (newCategoryId === "pg_hostels") {
      setRooms([
        {
          id: null,
          room_type: "Double Sharing Room",
          sharing_type: "2 Sharing / Double",
          monthly_rent: "5500",
          daily_price: "",
          room_people: 2,
          available_rooms: 2,
          total_rooms: 2,
          attached_bath: true,
          ac_available: false,
        },
      ]);
    } else if (newCategoryId === "hotels_stays") {
      setRooms([
        {
          id: null,
          room_type: "Deluxe AC Room",
          sharing_type: "",
          monthly_rent: "",
          daily_price: "1800",
          hourly_price: "",
          room_people: 2,
          available_rooms: 4,
          total_rooms: 4,
          attached_bath: true,
          ac_available: true,
        },
      ]);
    } else if (newCategoryId === "flats_rentals") {
      setRooms([
        {
          id: null,
          room_type: "2 BHK Flat",
          sharing_type: "",
          monthly_rent: "14000",
          daily_price: "",
          room_people: 4,
          available_rooms: 1,
          total_rooms: 1,
          attached_bath: true,
          ac_available: false,
        },
      ]);
    } else {
      setRooms([
        {
          id: null,
          room_type: "Main Banquet Hall",
          sharing_type: "",
          monthly_rent: "",
          daily_price: "25000",
          hourly_price: "3500",
          room_people: 250,
          available_rooms: 1,
          total_rooms: 1,
          attached_bath: true,
          ac_available: true,
        },
      ]);
    }
  };

  // Subcategory toggle handler (strictly mutual exclusive with "All")
  const handleSubcategoryToggle = (sub) => {
    setSelectedSubcategories((prev) => toggleSubcategorySelection(prev, sub, true));
  };

  // Amenity toggle handler
  const handleAmenityToggle = (label) => {
    setSelectedAmenities((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handleAddCustomAmenity = () => {
    const val = customAmenityInput.trim();
    if (!val) return;
    if (!selectedAmenities.includes(val)) {
      setSelectedAmenities((prev) => [...prev, val]);
    }
    setCustomAmenityInput("");
  };

  // Room operations
  const handleAddRoom = () => {
    const isDaily = selectedCategory === "hotels_stays" || selectedCategory === "event_spaces";
    const newRoom = {
      id: null,
      room_type:
        selectedCategory === "pg_hostels"
          ? "Single Sharing Room"
          : selectedCategory === "hotels_stays"
          ? "Standard AC Room"
          : selectedCategory === "flats_rentals"
          ? "1 BHK Flat"
          : "Party Lawn",
      sharing_type: selectedCategory === "pg_hostels" ? "Single Room" : "",
      monthly_rent: isDaily ? "" : "6000",
      daily_price: isDaily ? "2000" : "",
      hourly_price: "",
      room_people: selectedCategory === "event_spaces" ? 100 : 2,
      available_rooms: 1,
      total_rooms: 1,
      attached_bath: true,
      ac_available: true,
    };
    setRooms([...rooms, newRoom]);
  };

  const handleUpdateRoom = (index, field, value) => {
    setRooms((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleRemoveRoom = (index) => {
    if (rooms.length <= 1) {
      alert("A listing must have at least one room or space option.");
      return;
    }
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validateForm = () => {
    if (!name.trim()) return "Please enter the property name.";
    if (!selectedCategory) return "Please choose a main category.";
    if (!selectedSubcategories.length) return "Please select at least one subcategory.";
    if (!location.trim()) return "Please enter the property location / address.";
    if (!ownerName.trim()) return "Please enter the contact person's name.";

    const digitsOnly = ownerPhone.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      return "Please enter a valid 10-digit primary mobile number.";
    }

    if (!rooms.length) return "Please add at least one room or space option.";

    const isDaily = selectedCategory === "hotels_stays" || selectedCategory === "event_spaces";
    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      if (!r.room_type?.trim()) {
        return `Please specify a name/title for option #${i + 1}.`;
      }
      if (isDaily) {
        const dPrice = Number(r.daily_price);
        if (!Number.isFinite(dPrice) || dPrice <= 0) {
          return `Please enter a valid rate for "${r.room_type}".`;
        }
      } else {
        const mRent = Number(r.monthly_rent);
        if (!Number.isFinite(mRent) || mRent <= 0) {
          return `Please enter a valid monthly rent/price for "${r.room_type}".`;
        }
      }
    }

    return null;
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);

    try {
      // 1. Gather dynamic category specifications
      let categoryDetails = {};
      let rulesArray = [];

      if (selectedCategory === "pg_hostels") {
        categoryDetails = { ...pgSpecs };
        rulesArray = pgSpecs.rulesText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (selectedCategory === "hotels_stays") {
        categoryDetails = { ...hotelSpecs };
        rulesArray = hotelSpecs.hotelRules
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (selectedCategory === "flats_rentals") {
        categoryDetails = { ...flatSpecs };
      } else if (selectedCategory === "event_spaces") {
        categoryDetails = { ...eventSpecs };
      }

      // Add WhatsApp to details
      if (ownerWhatsapp) {
        categoryDetails.owner_whatsapp = ownerWhatsapp.trim();
      }

      // Primary type to preserve legacy database query compatibility
      const primarySub = selectedSubcategories.find((s) => s !== "All") || currentCategoryDef.subcategories[1];
      const primaryType =
        selectedCategory === "pg_hostels"
          ? primarySub || "PG"
          : selectedCategory === "hotels_stays"
          ? primarySub || "Hotel"
          : selectedCategory === "flats_rentals"
          ? primarySub || "Flat"
          : primarySub || "Banquet Hall";

      // 2. Prepare Building Payload
      const buildingCore = {
        name: name.trim(),
        location: location.trim(),
        landmark: landmark.trim() || null,
        type: primaryType,
        category: selectedCategory,
        subcategories: selectedSubcategories,
        category_details: categoryDetails,
        hotel_meta: {
          category: selectedCategory,
          subcategories: selectedSubcategories,
          ...categoryDetails,
        },
        description: description.trim(),
        rules: rulesArray,
        facilities: selectedAmenities,
        facility_tags: selectedAmenities.map((a) =>
          a.toLowerCase().replace(/[\s/]+/g, "-").replace(/[^a-z0-9-]/g, "")
        ),
        images,
        owner_name: ownerName.trim(),
        owner_phone: ownerPhone.trim(),
        owner_alt_phone: ownerAltPhone.trim() || null,
        owner_whatsapp: ownerWhatsapp.trim() || null,
        owner_email: ownerEmail.trim() || null,
        listed_by: listedBy,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        ...(isAdmin
          ? {
              verification_status: verificationStatus,
              listing_status: listingStatus,
              created_by: assignedCreatedBy || userId,
            }
          : {}),
      };

      // 3. Prepare Room Types Payload
      const isDaily = selectedCategory === "hotels_stays" || selectedCategory === "event_spaces";
      const roomTypeInputs = rooms.map((r) => {
        const mRent = isDaily ? 0 : Number(r.monthly_rent || 0);
        const dRate = isDaily ? Number(r.daily_price || 0) : null;
        return {
          id: r.id || null,
          room_type: r.room_type.trim(),
          price_value: mRent,
          room_rent: mRent,
          daily_price: dRate,
          hourly_price: r.hourly_price ? Number(r.hourly_price) : null,
          weekend_price: r.weekend_price ? Number(r.weekend_price) : null,
          room_people: Number(r.room_people) || 1,
          available_rooms: Number(r.available_rooms) || 0,
          total_rooms: Number(r.total_rooms) || Number(r.available_rooms) || 1,
          availability: Number(r.available_rooms) > 0 ? "Available" : "Occupied",
          room_details: {
            sharing_type: r.sharing_type || null,
            attached_bath: r.attached_bath,
            ac_available: r.ac_available,
            room_size: r.room_size || null,
          },
        };
      });

      // 4. Save via Admin or Owner Service
      let result;
      if (isAdmin) {
        result = await saveAdminProperty({
          propertyId: isEdit ? initialData.id : "new",
          buildingCore,
          roomTypeInputs,
        });
      } else {
        result = await savePropertyListing({
          buildingCore,
          roomTypeInputs,
          isEdit,
          editId: isEdit ? initialData.id : null,
          ownerId: userId,
        });
      }

      if (!result.success) {
        throw result.error || new Error("Failed to save property listing.");
      }

      setSuccessMessage(
        isEdit
          ? "Property updated successfully!"
          : isAdmin
          ? "New property created and published successfully!"
          : "Property submitted successfully! It will be reviewed by admin."
      );

      if (onSaveSuccess) {
        onSaveSuccess(result.data || { id: result.propertyId || initialData?.id });
      }
    } catch (err) {
      console.error("[DynamicPropertyForm] Error saving property:", err);
      setFormError(err.message || "An unexpected error occurred while saving.");
      if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="dynamic-listing-form" onSubmit={handleSubmit} noValidate>
      {/* Alert Header */}
      <div ref={errorRef}>
        {formError && (
          <div className="dynamic-form-alert error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{formError}</span>
          </div>
        )}
        {successMessage && (
          <div className="dynamic-form-alert success" role="alert">
            <span className="alert-icon">✅</span>
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* SECTION 1: MAIN CATEGORY & SUBCATEGORIES */}
      <div className="dynamic-form-card">
        <div className="dynamic-card-header">
          <span className="card-step-badge">1</span>
          <div>
            <h3>Choose Property Category</h3>
            <p>Select the main category and all applicable subcategories for your property.</p>
          </div>
        </div>

        {/* 4 Main Categories Grid */}
        <div className="main-categories-selector" role="radiogroup" aria-label="Main Category">
          {PROPERTY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-select-card ${isSelected ? "selected" : ""}`}
                onClick={() => handleCategorySwitch(cat.id)}
                aria-checked={isSelected}
                role="radio"
              >
                <div className="cat-card-icon">{cat.icon}</div>
                <div className="cat-card-content">
                  <h4>{cat.name}</h4>
                  <p>{cat.description}</p>
                </div>
                <div className="cat-card-indicator">
                  {isSelected ? "✓ Selected" : "Select"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Subcategories Multi-Select Chips */}
        <div className="subcategories-container">
          <label className="subcat-label">
            <strong>Subcategories / Tags for {currentCategoryDef.name}</strong>
            <span className="subcat-hint">
              (Select "All" or pick specific types like gender or venue specifications)
            </span>
          </label>

          <div className="subcat-chips-grid">
            {currentCategoryDef.subcategories.map((sub) => {
              const isChipSelected = selectedSubcategories.includes(sub);
              return (
                <button
                  key={sub}
                  type="button"
                  className={`subcat-chip ${isChipSelected ? "active" : ""}`}
                  onClick={() => handleSubcategoryToggle(sub)}
                  aria-pressed={isChipSelected}
                >
                  {isChipSelected && <span className="chip-check">✓ </span>}
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: BASIC DETAILS */}
      <div className="dynamic-form-card">
        <div className="dynamic-card-header">
          <span className="card-step-badge">2</span>
          <div>
            <h3>Property Details</h3>
            <p>Provide the name, address, and an appealing description of your property.</p>
          </div>
        </div>

        <div className="form-fields-grid">
          <div className="form-field full-width">
            <label htmlFor="prop-name">
              Property Name <span className="required-star">*</span>
            </label>
            <input
              id="prop-name"
              type="text"
              className="dynamic-input"
              placeholder="e.g. Green Valley Luxury PG / Royal Orchid Hotel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-field full-width">
            <label htmlFor="prop-location">
              Location / Address <span className="required-star">*</span>
            </label>
            <input
              id="prop-location"
              type="text"
              className="dynamic-input"
              placeholder="e.g. Opposite of AARM, Simhat, Haringhata"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="form-field half-width">
            <label htmlFor="prop-landmark">Landmark (Optional)</label>
            <input
              id="prop-landmark"
              type="text"
              className="dynamic-input"
              placeholder="e.g. Near MAKAUT Main Gate"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </div>

          <div className="form-field half-width coordinates-field">
            <label>Map Coordinates (Optional)</label>
            <div className="coords-inputs">
              <input
                type="text"
                className="dynamic-input"
                placeholder="Latitude (e.g. 22.9570)"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
              <input
                type="text"
                className="dynamic-input"
                placeholder="Longitude (e.g. 88.5434)"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field full-width">
            <label htmlFor="prop-desc">Property Description</label>
            <textarea
              id="prop-desc"
              className="dynamic-textarea"
              rows={4}
              placeholder="Highlight nearby facilities, atmosphere, cleanliness, and special features..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: DYNAMIC CATEGORY-SPECIFIC SPECIFICATIONS */}
      <div className="dynamic-form-card">
        <div className="dynamic-card-header">
          <span className="card-step-badge">3</span>
          <div>
            <h3>{currentCategoryDef.name} Specifications</h3>
            <p>Industry-standard fields tailored exclusively for {currentCategoryDef.name}.</p>
          </div>
        </div>

        {/* 3A: PG & Hostels Specifications */}
        {selectedCategory === "pg_hostels" && (
          <div className="form-fields-grid category-specific-grid">
            <div className="form-field third-width">
              <label>Gender Preference</label>
              <select
                className="dynamic-select"
                value={pgSpecs.genderPreference}
                onChange={(e) => setPgSpecs({ ...pgSpecs, genderPreference: e.target.value })}
              >
                <option value="Boys Only">Boys Only</option>
                <option value="Girls Only">Girls Only</option>
                <option value="Co-ed / Any">Co-ed / Any</option>
              </select>
            </div>

            <div className="form-field third-width">
              <label>Preferred Tenants</label>
              <select
                className="dynamic-select"
                value={pgSpecs.preferredTenants}
                onChange={(e) => setPgSpecs({ ...pgSpecs, preferredTenants: e.target.value })}
              >
                <option value="Students Only">Students Only</option>
                <option value="Working Professionals">Working Professionals</option>
                <option value="Both Students & Working">Both Students & Working</option>
              </select>
            </div>

            <div className="form-field third-width">
              <label>Food & Mess Facility</label>
              <select
                className="dynamic-select"
                value={pgSpecs.foodAvailability}
                onChange={(e) => setPgSpecs({ ...pgSpecs, foodAvailability: e.target.value })}
              >
                <option value="Included in Monthly Rent">Included in Monthly Rent</option>
                <option value="Available as Add-on">Available as Add-on</option>
                <option value="Self-Cooking Kitchen Provided">Self-Cooking Kitchen Provided</option>
                <option value="No Food Provided">No Food Provided</option>
              </select>
            </div>

            <div className="form-field third-width">
              <label>Food Preference</label>
              <select
                className="dynamic-select"
                value={pgSpecs.foodType}
                onChange={(e) => setPgSpecs({ ...pgSpecs, foodType: e.target.value })}
              >
                <option value="Veg & Non-Veg">Veg & Non-Veg</option>
                <option value="Pure Veg">Pure Veg</option>
                <option value="Jain Food Available">Jain Food Available</option>
              </select>
            </div>

            <div className="form-field third-width">
              <label>Gate Closing / Curfew</label>
              <input
                type="text"
                className="dynamic-input"
                placeholder="e.g. 10:00 PM or No Curfew"
                value={pgSpecs.gateClosingTime}
                onChange={(e) => setPgSpecs({ ...pgSpecs, gateClosingTime: e.target.value })}
              />
            </div>

            <div className="form-field third-width">
              <label>Security Deposit (₹)</label>
              <input
                type="number"
                className="dynamic-input"
                placeholder="e.g. 5000"
                value={pgSpecs.securityDeposit}
                onChange={(e) => setPgSpecs({ ...pgSpecs, securityDeposit: e.target.value })}
              />
            </div>

            <div className="form-field full-width">
              <label>House Rules / Terms (One per line)</label>
              <textarea
                className="dynamic-textarea"
                rows={3}
                placeholder="e.g.&#10;No smoking inside premises&#10;Visitors allowed till 8 PM&#10;Silence hours after 11 PM"
                value={pgSpecs.rulesText}
                onChange={(e) => setPgSpecs({ ...pgSpecs, rulesText: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* 3B: Hotels & Stays Specifications */}
        {selectedCategory === "hotels_stays" && (
          <div className="form-fields-grid category-specific-grid">
            <div className="form-field third-width">
              <label>Star / Property Rating</label>
              <select
                className="dynamic-select"
                value={hotelSpecs.starRating}
                onChange={(e) => setHotelSpecs({ ...hotelSpecs, starRating: e.target.value })}
              >
                <option value="Budget / Standard">Budget / Standard</option>
                <option value="1 Star">1 Star</option>
                <option value="2 Star">2 Star</option>
                <option value="3 Star">3 Star</option>
                <option value="4 Star">4 Star</option>
                <option value="5 Star">5 Star</option>
                <option value="Boutique / Heritage">Boutique / Heritage</option>
              </select>
            </div>

            <div className="form-field third-width">
              <label>Check-In Time</label>
              <input
                type="text"
                className="dynamic-input"
                placeholder="e.g. 12:00 PM"
                value={hotelSpecs.checkInTime}
                onChange={(e) => setHotelSpecs({ ...hotelSpecs, checkInTime: e.target.value })}
              />
            </div>

            <div className="form-field third-width">
              <label>Check-Out Time</label>
              <input
                type="text"
                className="dynamic-input"
                placeholder="e.g. 11:00 AM"
                value={hotelSpecs.checkOutTime}
                onChange={(e) => setHotelSpecs({ ...hotelSpecs, checkOutTime: e.target.value })}
              />
            </div>

            <div className="form-field half-width">
              <label>Cancellation Policy</label>
              <select
                className="dynamic-select"
                value={hotelSpecs.cancellationPolicy}
                onChange={(e) => setHotelSpecs({ ...hotelSpecs, cancellationPolicy: e.target.value })}
              >
                <option value="Free cancellation up to 24 hours before check-in">
                  Free cancellation up to 24 hours before check-in
                </option>
                <option value="Moderate (50% refund up to 48 hours)">
                  Moderate (50% refund up to 48 hours)
                </option>
                <option value="Non-Refundable">Non-Refundable</option>
              </select>
            </div>

            <div className="form-field half-width boolean-switches">
              <label className="checkbox-toggle">
                <input
                  type="checkbox"
                  checked={hotelSpecs.coupleFriendly}
                  onChange={(e) => setHotelSpecs({ ...hotelSpecs, coupleFriendly: e.target.checked })}
                />
                <span>💑 Couple Friendly / Local IDs Accepted</span>
              </label>

              <label className="checkbox-toggle">
                <input
                  type="checkbox"
                  checked={hotelSpecs.hourlyAllowed}
                  onChange={(e) => setHotelSpecs({ ...hotelSpecs, hourlyAllowed: e.target.checked })}
                />
                <span>⏱️ Hourly / Day-Use Booking Allowed</span>
              </label>
            </div>

            <div className="form-field full-width">
              <label>Hotel Policies & Rules</label>
              <textarea
                className="dynamic-textarea"
                rows={3}
                placeholder="e.g. Government approved ID required at check-in. Outside food not allowed in restaurant."
                value={hotelSpecs.hotelRules}
                onChange={(e) => setHotelSpecs({ ...hotelSpecs, hotelRules: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* 3C: Flats & Rentals Specifications */}
        {selectedCategory === "flats_rentals" && (
          <div className="form-fields-grid category-specific-grid">
            <div className="form-field fourth-width">
              <label>BHK Configuration</label>
              <select
                className="dynamic-select"
                value={flatSpecs.bhk}
                onChange={(e) => setFlatSpecs({ ...flatSpecs, bhk: e.target.value })}
              >
                <option value="1 RK">1 RK</option>
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK">4 BHK</option>
                <option value="Penthouse / Villa">Penthouse / Villa</option>
              </select>
            </div>

            <div className="form-field fourth-width">
              <label>Offer Type</label>
              <select
                className="dynamic-select"
                value={flatSpecs.offerType}
                onChange={(e) => setFlatSpecs({ ...flatSpecs, offerType: e.target.value })}
              >
                <option value="Rent">For Rent</option>
                <option value="Sale">For Sale</option>
              </select>
            </div>

            <div className="form-field fourth-width">
              <label>Furnishing Status</label>
              <select
                className="dynamic-select"
                value={flatSpecs.furnishing}
                onChange={(e) => setFlatSpecs({ ...flatSpecs, furnishing: e.target.value })}
              >
                <option value="Fully Furnished">Fully Furnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>

            <div className="form-field fourth-width">
              <label>Carpet Area (sq ft)</label>
              <input
                type="number"
                className="dynamic-input"
                placeholder="e.g. 950"
                value={flatSpecs.carpetArea}
                onChange={(e) => setFlatSpecs({ ...flatSpecs, carpetArea: e.target.value })}
              />
            </div>

            <div className="form-field fourth-width">
              <label>Floor / Total Floors</label>
              <div className="dual-inputs">
                <input
                  type="text"
                  className="dynamic-input"
                  placeholder="Floor (e.g. 3)"
                  value={flatSpecs.floorNumber}
                  onChange={(e) => setFlatSpecs({ ...flatSpecs, floorNumber: e.target.value })}
                />
                <input
                  type="text"
                  className="dynamic-input"
                  placeholder="Total (e.g. 5)"
                  value={flatSpecs.totalFloors}
                  onChange={(e) => setFlatSpecs({ ...flatSpecs, totalFloors: e.target.value })}
                />
              </div>
            </div>

            <div className="form-field fourth-width">
              <label>Facing Direction</label>
              <select
                className="dynamic-select"
                value={flatSpecs.facing}
                onChange={(e) => setFlatSpecs({ ...flatSpecs, facing: e.target.value })}
              >
                <option value="East">East</option>
                <option value="North">North</option>
                <option value="North-East">North-East</option>
                <option value="West">West</option>
                <option value="South">South</option>
              </select>
            </div>

            <div className="form-field fourth-width">
              <label>Security Deposit (₹)</label>
              <input
                type="number"
                className="dynamic-input"
                placeholder="e.g. 25000"
                value={flatSpecs.securityDeposit}
                onChange={(e) => setFlatSpecs({ ...flatSpecs, securityDeposit: e.target.value })}
              />
            </div>

            <div className="form-field fourth-width">
              <label>Monthly Maintenance (₹)</label>
              <input
                type="number"
                className="dynamic-input"
                placeholder="e.g. 1500"
                value={flatSpecs.maintenanceCharges}
                onChange={(e) => setFlatSpecs({ ...flatSpecs, maintenanceCharges: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* 3D: Event Spaces Specifications */}
        {selectedCategory === "event_spaces" && (
          <div className="form-fields-grid category-specific-grid">
            <div className="form-field third-width">
              <label>Seating Capacity</label>
              <input
                type="number"
                className="dynamic-input"
                placeholder="Number of seated guests (e.g. 300)"
                value={eventSpecs.seatingCapacity}
                onChange={(e) => setEventSpecs({ ...eventSpecs, seatingCapacity: e.target.value })}
              />
            </div>

            <div className="form-field third-width">
              <label>Floating / Max Capacity</label>
              <input
                type="number"
                className="dynamic-input"
                placeholder="Floating capacity (e.g. 600)"
                value={eventSpecs.floatingCapacity}
                onChange={(e) => setEventSpecs({ ...eventSpecs, floatingCapacity: e.target.value })}
              />
            </div>

            <div className="form-field third-width">
              <label>Venue Area (sq ft)</label>
              <input
                type="text"
                className="dynamic-input"
                placeholder="e.g. 5,000 sq ft or 1 Acre"
                value={eventSpecs.venueArea}
                onChange={(e) => setEventSpecs({ ...eventSpecs, venueArea: e.target.value })}
              />
            </div>

            <div className="form-field half-width">
              <label>Catering Policy</label>
              <select
                className="dynamic-select"
                value={eventSpecs.cateringPolicy}
                onChange={(e) => setEventSpecs({ ...eventSpecs, cateringPolicy: e.target.value })}
              >
                <option value="In-House Catering Only">In-House Catering Only</option>
                <option value="Outside Catering Allowed">Outside Catering Allowed</option>
                <option value="Both In-House & Outside Catering">Both In-House & Outside Catering</option>
              </select>
            </div>

            <div className="form-field half-width">
              <label>Music / DJ Setup Policy</label>
              <select
                className="dynamic-select"
                value={eventSpecs.musicPolicy}
                onChange={(e) => setEventSpecs({ ...eventSpecs, musicPolicy: e.target.value })}
              >
                <option value="Allowed (curfew 10:00 PM)">Allowed (curfew 10:00 PM)</option>
                <option value="Allowed (Indoor halls only)">Allowed (Indoor halls only)</option>
                <option value="Acoustic / Soft music only">Acoustic / Soft music only</option>
                <option value="Not Allowed">Not Allowed</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: FACILITIES & AMENITIES */}
      <div className="dynamic-form-card">
        <div className="dynamic-card-header">
          <span className="card-step-badge">4</span>
          <div>
            <h3>Facilities & Amenities</h3>
            <p>Select features available at your property for renters and guests.</p>
          </div>
        </div>

        <div className="amenities-checklist">
          {currentCategoryDef.amenities.map((item) => {
            const isChecked = selectedAmenities.includes(item.label);
            return (
              <label
                key={item.id}
                className={`amenity-item-box ${isChecked ? "checked" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleAmenityToggle(item.label)}
                />
                <span className="amenity-icon">{item.icon}</span>
                <span className="amenity-name">{item.label}</span>
              </label>
            );
          })}
        </div>

        {/* Custom Amenity Adder */}
        <div className="custom-amenity-row">
          <input
            type="text"
            className="dynamic-input"
            placeholder="Add custom amenity (e.g. EV Charging Station, Jacuzzi)..."
            value={customAmenityInput}
            onChange={(e) => setCustomAmenityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomAmenity();
              }
            }}
          />
          <button
            type="button"
            className="secondary-btn"
            onClick={handleAddCustomAmenity}
          >
            + Add
          </button>
        </div>
      </div>

      {/* SECTION 5: PHOTOS */}
      <div className="dynamic-form-card">
        <div className="dynamic-card-header">
          <span className="card-step-badge">5</span>
          <div>
            <h3>Property Photos</h3>
            <p>High-quality images increase bookings by up to 80%. Upload exterior, rooms, and washroom photos.</p>
          </div>
        </div>

        <ImageUploader images={images} onChange={setImages} />
      </div>

      {/* SECTION 6: ROOMS, SPACES & PRICING */}
      <div className="dynamic-form-card">
        <div className="dynamic-card-header">
          <span className="card-step-badge">6</span>
          <div>
            <h3>
              {selectedCategory === "event_spaces"
                ? "Spaces, Halls & Pricing"
                : selectedCategory === "flats_rentals"
                ? "Units & Pricing"
                : "Rooms & Pricing"}
            </h3>
            <p>Configure room types, sharing options, and pricing rates.</p>
          </div>
        </div>

        <div className="rooms-container">
          {rooms.map((room, index) => {
            const isDaily = selectedCategory === "hotels_stays" || selectedCategory === "event_spaces";
            return (
              <div key={index} className="room-config-card">
                <div className="room-config-header">
                  <h4>Option #{index + 1}: {room.room_type || "Untitled Option"}</h4>
                  {rooms.length > 1 && (
                    <button
                      type="button"
                      className="room-remove-btn"
                      onClick={() => handleRemoveRoom(index)}
                      title="Remove this room option"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                <div className="form-fields-grid">
                  <div className="form-field half-width">
                    <label>
                      {selectedCategory === "event_spaces"
                        ? "Space / Hall Title"
                        : "Room Type / Title"}{" "}
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="dynamic-input"
                      placeholder="e.g. Deluxe AC Room / 2 Sharing / Grand Lawn"
                      value={room.room_type}
                      onChange={(e) => handleUpdateRoom(index, "room_type", e.target.value)}
                      required
                    />
                  </div>

                  {/* PG Sharing Selector */}
                  {selectedCategory === "pg_hostels" && (
                    <div className="form-field half-width">
                      <label>Sharing Type</label>
                      <select
                        className="dynamic-select"
                        value={room.sharing_type}
                        onChange={(e) => handleUpdateRoom(index, "sharing_type", e.target.value)}
                      >
                        <option value="Single Room">Single Room (1 Person)</option>
                        <option value="2 Sharing / Double">2 Sharing / Double</option>
                        <option value="3 Sharing / Triple">3 Sharing / Triple</option>
                        <option value="4+ Sharing">4+ Sharing</option>
                        <option value="Dormitory Bed">Dormitory Bed</option>
                      </select>
                    </div>
                  )}

                  {/* Pricing Input: Monthly for PG & Flats; Daily for Hotels & Events */}
                  {!isDaily ? (
                    <div className="form-field half-width">
                      <label>
                        Monthly Rent / Price (₹) <span className="required-star">*</span>
                      </label>
                      <input
                        type="number"
                        className="dynamic-input"
                        placeholder="e.g. 5000"
                        value={room.monthly_rent}
                        onChange={(e) => handleUpdateRoom(index, "monthly_rent", e.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <div className="form-field half-width">
                      <label>
                        {selectedCategory === "event_spaces"
                          ? "Day / Event Rate (₹)"
                          : "Nightly Rate (₹)"}{" "}
                        <span className="required-star">*</span>
                      </label>
                      <input
                        type="number"
                        className="dynamic-input"
                        placeholder={selectedCategory === "event_spaces" ? "e.g. 25000" : "e.g. 1800"}
                        value={room.daily_price}
                        onChange={(e) => handleUpdateRoom(index, "daily_price", e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* Available Units / Rooms */}
                  <div className="form-field fourth-width">
                    <label>
                      {selectedCategory === "pg_hostels"
                        ? "Available Beds"
                        : selectedCategory === "event_spaces"
                        ? "Available Slots"
                        : "Available Rooms"}{" "}
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="dynamic-input"
                      value={room.available_rooms}
                      onChange={(e) => handleUpdateRoom(index, "available_rooms", e.target.value)}
                      required
                    />
                  </div>

                  {/* Max People / Guests */}
                  <div className="form-field fourth-width">
                    <label>
                      {selectedCategory === "event_spaces" ? "Capacity" : "Max People"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="dynamic-input"
                      value={room.room_people}
                      onChange={(e) => handleUpdateRoom(index, "room_people", e.target.value)}
                    />
                  </div>

                  {/* Extra Switches for Room */}
                  <div className="form-field half-width room-switches">
                    <label className="checkbox-toggle">
                      <input
                        type="checkbox"
                        checked={room.attached_bath}
                        onChange={(e) => handleUpdateRoom(index, "attached_bath", e.target.checked)}
                      />
                      <span>🚿 Attached Bath</span>
                    </label>

                    <label className="checkbox-toggle">
                      <input
                        type="checkbox"
                        checked={room.ac_available}
                        onChange={(e) => handleUpdateRoom(index, "ac_available", e.target.checked)}
                      />
                      <span>❄️ AC Available</span>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            className="add-room-btn"
            onClick={handleAddRoom}
          >
            <span>+</span> Add Another Room / Space Option
          </button>
        </div>
      </div>

      {/* SECTION 7: CONTACT INFORMATION */}
      <div className="dynamic-form-card">
        <div className="dynamic-card-header">
          <span className="card-step-badge">7</span>
          <div>
            <h3>Contact Information</h3>
            <p>Direct contact details for interested renters and verification.</p>
          </div>
        </div>

        <div className="form-fields-grid">
          <div className="form-field third-width">
            <label>Listed By</label>
            <select
              className="dynamic-select"
              value={listedBy}
              onChange={(e) => setListedBy(e.target.value)}
            >
              <option value="Property Owner">Property Owner</option>
              <option value="Property Manager">Property Manager</option>
              <option value="Authorized Agent">Authorized Agent</option>
              {isAdmin && <option value="Administrator">Administrator</option>}
            </select>
          </div>

          <div className="form-field third-width">
            <label htmlFor="owner-name">
              Contact Person Name <span className="required-star">*</span>
            </label>
            <input
              id="owner-name"
              type="text"
              className="dynamic-input"
              placeholder="e.g. Ramesh Kumar"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
          </div>

          <div className="form-field third-width">
            <label htmlFor="owner-phone">
              Primary Mobile (10-digits) <span className="required-star">*</span>
            </label>
            <input
              id="owner-phone"
              type="tel"
              className="dynamic-input"
              placeholder="e.g. 9876543210"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-field third-width">
            <label htmlFor="owner-alt-phone">Alternate Phone (Optional)</label>
            <input
              id="owner-alt-phone"
              type="tel"
              className="dynamic-input"
              placeholder="e.g. 9123456789"
              value={ownerAltPhone}
              onChange={(e) => setOwnerAltPhone(e.target.value)}
            />
          </div>

          <div className="form-field third-width">
            <label htmlFor="owner-whatsapp">WhatsApp Number (Optional)</label>
            <input
              id="owner-whatsapp"
              type="tel"
              className="dynamic-input"
              placeholder="e.g. 9876543210"
              value={ownerWhatsapp}
              onChange={(e) => setOwnerWhatsapp(e.target.value)}
            />
          </div>

          <div className="form-field third-width">
            <label htmlFor="owner-email">Contact Email (Optional)</label>
            <input
              id="owner-email"
              type="email"
              className="dynamic-input"
              placeholder="e.g. contact@property.com"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 8: ADMIN-ONLY OVERRIDES */}
      {isAdmin && (
        <div className="dynamic-form-card admin-override-card">
          <div className="dynamic-card-header">
            <span className="card-step-badge admin-badge">🛡️</span>
            <div>
              <h3>Admin Moderation & Ownership Controls</h3>
              <p>Configure platform verification, visibility status, and property creator ownership.</p>
            </div>
          </div>

          <div className="form-fields-grid">
            <div className="form-field third-width">
              <label>Verification Status</label>
              <select
                className="dynamic-select"
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value)}
              >
                <option value="approved">Approved / Verified (Live)</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="form-field third-width">
              <label>Listing Status</label>
              <select
                className="dynamic-select"
                value={listingStatus}
                onChange={(e) => setListingStatus(e.target.value)}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-field third-width">
              <label>Created By User UUID</label>
              <input
                type="text"
                className="dynamic-input"
                placeholder="Owner or Agent User UUID"
                value={assignedCreatedBy}
                onChange={(e) => setAssignedCreatedBy(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION BUTTONS ROW */}
      <div className="form-submit-bar">
        {onCancel && (
          <button
            type="button"
            className="cancel-btn"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          className="primary-submit-btn"
          disabled={submitting}
        >
          {submitting
            ? "Saving Property..."
            : isEdit
            ? "Update Property Listing"
            : isAdmin
            ? "Publish Property Listing"
            : "Submit Property for Verification"}
        </button>
      </div>
    </form>
  );
}
