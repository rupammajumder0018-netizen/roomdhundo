import React, { useState, useEffect, useRef } from "react";
import ImageUploader from "./ImageUploader.jsx";
import { CategoryIcon } from "../common/CategoryIcon.jsx";
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

  const [commercialSpecs, setCommercialSpecs] = useState({
    // Basic Details & Ownership
    ownershipType: initialMeta.ownershipType || "Freehold",
    propertyCondition: initialMeta.propertyCondition || "Ready to Move",

    // Specifications
    totalArea: initialMeta.totalArea != null ? String(initialMeta.totalArea) : "",
    carpetArea: initialMeta.carpetArea != null ? String(initialMeta.carpetArea) : "",
    builtUpArea: initialMeta.builtUpArea != null ? String(initialMeta.builtUpArea) : "",
    totalFloors: initialMeta.totalFloors != null ? String(initialMeta.totalFloors) : "",
    floorNumber: initialMeta.floorNumber || "Ground Floor",
    roomsCabins: initialMeta.roomsCabins != null ? String(initialMeta.roomsCabins) : "",
    washrooms: initialMeta.washrooms != null ? String(initialMeta.washrooms) : "1",
    washroomType: initialMeta.washroomType || "Private",
    furnishingStatus: initialMeta.furnishingStatus || initialData?.furnishing || "Unfurnished",
    frontage: initialMeta.frontage != null ? String(initialMeta.frontage) : "",
    parking: initialMeta.parking || "Dedicated Parking Available",
    lift: initialMeta.lift || "Passenger Lift Available",
    roadAccess: initialMeta.roadAccess || "Main Road Facing",
    powerBackup: initialMeta.powerBackup || "Full Power Backup",
    powerCapacity: initialMeta.powerCapacity || "3-Phase Commercial Electric",

    // Business Usage & Permissions
    suitableBusinesses: initialMeta.suitableBusinesses || [
      "Retail Shop / Store",
      "Office Space / IT",
      "Showroom",
      "Clinic / Diagnostic",
      "Bank / ATM",
    ],
    permittedActivities: initialMeta.permittedActivities || "All Standard Commercial & Business Activities",
    previousUsage: initialMeta.previousUsage || "",
    usageRestrictions: initialMeta.usageRestrictions || "No Hazardous or Inflammable Materials",
    signboardPermission: initialMeta.signboardPermission || "Allowed on Building Facade",
    operatingHours: initialMeta.operatingHours || "24x7 Access Permitted",

    // Rental Pricing & Terms
    monthlyRent: initialMeta.monthlyRent != null ? String(initialMeta.monthlyRent) : "",
    securityDeposit: initialMeta.securityDeposit != null ? String(initialMeta.securityDeposit) : "",
    advancePayment: initialMeta.advancePayment != null ? String(initialMeta.advancePayment) : "",
    maintenanceCharges: initialMeta.maintenanceCharges != null ? String(initialMeta.maintenanceCharges) : "",
    maintenanceFrequency: initialMeta.maintenanceFrequency || "Monthly",
    electricityCharges: initialMeta.electricityCharges || "As per Commercial Meter",
    waterCharges: initialMeta.waterCharges || "Included in Rent",
    minRentalPeriod: initialMeta.minRentalPeriod || "11 Months",
    preferredLease: initialMeta.preferredLease || "3 Years",
    rentNegotiable: initialMeta.rentNegotiable !== false,
    rentFrequency: initialMeta.rentFrequency || "Monthly",

    // Subcategory-Specific Fields
    shopFrontage: initialMeta.shopFrontage != null ? String(initialMeta.shopFrontage) : "",
    shutterType: initialMeta.shutterType || "Motorized Rolling Shutter",
    groundFloorAccess: initialMeta.groundFloorAccess !== false,
    displayArea: initialMeta.displayArea != null ? String(initialMeta.displayArea) : "",
    cabinsCount: initialMeta.cabinsCount != null ? String(initialMeta.cabinsCount) : "",
    workstationsCount: initialMeta.workstationsCount != null ? String(initialMeta.workstationsCount) : "",
    conferenceRoom: initialMeta.conferenceRoom !== false,
    receptionArea: initialMeta.receptionArea !== false,
    desksCount: initialMeta.desksCount != null ? String(initialMeta.desksCount) : "",
    meetingRoomsCount: initialMeta.meetingRoomsCount != null ? String(initialMeta.meetingRoomsCount) : "",
    pantryAvailable: initialMeta.pantryAvailable !== false,
    storageArea: initialMeta.storageArea != null ? String(initialMeta.storageArea) : "",
    loadingDock: initialMeta.loadingDock || "Dedicated Loading Dock with Bay",
    truckAccess: initialMeta.truckAccess || "Heavy Truck & Trailer Accessible",
    ceilingHeight: initialMeta.ceilingHeight != null ? String(initialMeta.ceilingHeight) : "18 ft",
    floorLoadCapacity: initialMeta.floorLoadCapacity || "Heavy Duty (5 Tons/sqm)",
    kitchenSpace: initialMeta.kitchenSpace !== false,
    exhaustVentilation: initialMeta.exhaustVentilation || "Commercial Chimney & Exhaust Installed",
    diningCapacity: initialMeta.diningCapacity != null ? String(initialMeta.diningCapacity) : "",
    gasPipelinePermit: initialMeta.gasPipelinePermit || "Commercial Gas Line Permitted",
    industrialZone: initialMeta.industrialZone || "Approved Industrial Zone",
    transformerCapacity: initialMeta.transformerCapacity || "50 KVA Dedicated",
    buildingUnitsCount: initialMeta.buildingUnitsCount != null ? String(initialMeta.buildingUnitsCount) : "",
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
  const generateDefaultOccupancyOptions = (capacity, baseRent = 5000) => {
    const cap = Math.max(1, Math.min(6, Number(capacity) || 1));
    const tiers = [
      { people: 1, label: "Single Occupancy", defaultRent: 8000, pricingType: "room" },
      { people: 2, label: "Double Sharing", defaultRent: 5000, pricingType: "person" },
      { people: 3, label: "Triple Sharing", defaultRent: 3500, pricingType: "person" },
      { people: 4, label: "Four Sharing", defaultRent: 2800, pricingType: "person" },
      { people: 5, label: "5 Sharing", defaultRent: 2400, pricingType: "person" },
      { people: 6, label: "6 Sharing Dorm", defaultRent: 2000, pricingType: "person" },
    ];

    return tiers.slice(0, cap).map((t) => ({
      people: t.people,
      label: t.label,
      enabled: true,
      rent: String(t.defaultRent),
      pricingType: t.pricingType,
    }));
  };

  const initRoomsFromData = () => {
    const rawRooms = Array.isArray(initialData?.room_types) ? initialData.room_types : [];
    if (rawRooms.length > 0) {
      return rawRooms.map((r) => {
        const details = r.room_details && typeof r.room_details === "object" ? r.room_details : {};
        const savedOptions = Array.isArray(details.occupancy_options) ? details.occupancy_options : [];
        const cap = Number(r.bed_capacity || details.bed_capacity || r.room_people || 3);
        const mRent = r.price_value ?? r.room_rent ?? 5000;

        let occupancy_options = [];
        if (savedOptions.length > 0) {
          const defaultTiers = generateDefaultOccupancyOptions(cap, mRent);
          occupancy_options = defaultTiers.map((tier) => {
            const match = savedOptions.find((so) => Number(so.people) === tier.people);
            if (match) {
              return {
                ...tier,
                enabled: true,
                rent: String(match.rent ?? tier.rent),
                label: match.label || tier.label,
                pricingType: match.pricingType || tier.pricingType,
              };
            }
            return { ...tier, enabled: false };
          });
        } else {
          occupancy_options = generateDefaultOccupancyOptions(cap, mRent);
        }

        const availBeds = r.available_beds != null ? Number(r.available_beds) : (r.available_rooms != null ? Number(r.available_rooms) : cap);
        const totalBeds = r.total_beds != null ? Number(r.total_beds) : (r.total_rooms != null ? Number(r.total_rooms) : cap);
        const occBeds = r.occupied_beds != null ? Number(r.occupied_beds) : Math.max(0, totalBeds - availBeds);

        return {
          id: r.id || null,
          room_type: details.room_name || r.room_type || "",
          bed_capacity: cap,
          total_beds: totalBeds,
          available_beds: availBeds,
          occupied_beds: occBeds,
          occupancy_options,
          sharing_type: details.sharing_type || (r.room_people === 1 ? "Single Room" : `${r.room_people} Sharing`),
          monthly_rent: r.price_value ?? r.room_rent ?? "",
          daily_price: r.daily_price ?? "",
          hourly_price: r.hourly_price ?? "",
          weekend_price: r.weekend_price ?? "",
          room_people: cap,
          available_rooms: r.available_rooms ?? availBeds,
          total_rooms: r.total_rooms ?? totalBeds,
          attached_bath: details.attached_bath !== false,
          ac_available: details.ac_available || false,
          room_size: r.room_size ?? "",
        };
      });
    }

    // Default room template based on selected category
    if (selectedCategory === "pg_hostels") {
      return [
        {
          id: null,
          room_type: "Standard AC Room",
          bed_capacity: 3,
          total_beds: 3,
          available_beds: 3,
          occupied_beds: 0,
          occupancy_options: [
            { people: 1, label: "Single Occupancy", enabled: true, rent: "8000", pricingType: "room" },
            { people: 2, label: "Double Sharing", enabled: true, rent: "5000", pricingType: "person" },
            { people: 3, label: "Triple Sharing", enabled: true, rent: "3500", pricingType: "person" },
          ],
          sharing_type: "Single / Double / Triple Sharing",
          monthly_rent: "3500",
          daily_price: "",
          room_people: 3,
          available_rooms: 3,
          total_rooms: 3,
          attached_bath: true,
          ac_available: true,
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
    } else if (selectedCategory === "commercial") {
      return [
        {
          id: null,
          room_type: "Commercial Space / Retail Unit",
          sharing_type: "",
          monthly_rent: "25000",
          daily_price: "",
          hourly_price: "",
          room_people: 10,
          available_rooms: 1,
          total_rooms: 1,
          attached_bath: true,
          ac_available: true,
          room_size: "800 sq.ft",
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
          room_type: "Standard AC Room",
          bed_capacity: 3,
          total_beds: 3,
          available_beds: 3,
          occupied_beds: 0,
          occupancy_options: [
            { people: 1, label: "Single Occupancy", enabled: true, rent: "8000", pricingType: "room" },
            { people: 2, label: "Double Sharing", enabled: true, rent: "5000", pricingType: "person" },
            { people: 3, label: "Triple Sharing", enabled: true, rent: "3500", pricingType: "person" },
          ],
          sharing_type: "Single / Double / Triple Sharing",
          monthly_rent: "3500",
          daily_price: "",
          room_people: 3,
          available_rooms: 3,
          total_rooms: 3,
          attached_bath: true,
          ac_available: true,
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
    } else if (newCategoryId === "commercial") {
      setRooms([
        {
          id: null,
          room_type: "Commercial Space / Retail Unit",
          sharing_type: "",
          monthly_rent: "25000",
          daily_price: "",
          hourly_price: "",
          room_people: 10,
          available_rooms: 1,
          total_rooms: 1,
          attached_bath: true,
          ac_available: true,
          room_size: "800 sq.ft",
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
    const isPg = selectedCategory === "pg_hostels";
    const isCommercial = selectedCategory === "commercial";
    const newRoom = {
      id: null,
      room_type:
        isPg
          ? "Double Sharing Room"
          : selectedCategory === "hotels_stays"
          ? "Standard AC Room"
          : selectedCategory === "flats_rentals"
          ? "1 BHK Flat"
          : isCommercial
          ? "Commercial Unit / Shop / Cabin"
          : "Party Lawn",
      sharing_type: isPg ? "Single / Double Sharing" : "",
      monthly_rent: isDaily ? "" : isCommercial ? "25000" : "5000",
      daily_price: isDaily ? "2000" : "",
      hourly_price: "",
      bed_capacity: isPg ? 2 : (selectedCategory === "event_spaces" ? 100 : isCommercial ? 10 : 2),
      total_beds: isPg ? 2 : 1,
      available_beds: isPg ? 2 : 1,
      occupied_beds: 0,
      occupancy_options: isPg ? generateDefaultOccupancyOptions(2, 5000) : [],
      room_people: selectedCategory === "event_spaces" ? 100 : isCommercial ? 10 : 2,
      available_rooms: isPg ? 2 : 1,
      total_rooms: isPg ? 2 : 1,
      attached_bath: true,
      ac_available: true,
      room_size: isCommercial ? "600 sq.ft" : "",
    };
    setRooms([...rooms, newRoom]);
  };

  const handleUpdateRoom = (index, field, value) => {
    setRooms((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleUpdateOccupancyOption = (roomIndex, peopleCount, field, value) => {
    setRooms((prev) =>
      prev.map((room, rIdx) => {
        if (rIdx !== roomIndex) return room;
        const options = (room.occupancy_options || []).map((opt) =>
          opt.people === peopleCount ? { ...opt, [field]: value } : opt
        );
        return { ...room, occupancy_options: options };
      })
    );
  };

  const handleUpdateBedCapacity = (roomIndex, newCapacity) => {
    const cap = Math.max(1, Math.min(6, Number(newCapacity) || 1));
    setRooms((prev) =>
      prev.map((room, rIdx) => {
        if (rIdx !== roomIndex) return room;
        const existingOptions = room.occupancy_options || [];
        const baseRent = Number(existingOptions[0]?.rent) || Number(room.monthly_rent) || 5000;
        const newTemplate = generateDefaultOccupancyOptions(cap, baseRent);
        const updatedOptions = newTemplate.map((tier) => {
          const match = existingOptions.find((e) => e.people === tier.people);
          return match ? { ...match } : tier;
        });

        const newAvail = Math.min(cap, Number(room.available_beds != null ? room.available_beds : cap));
        return {
          ...room,
          bed_capacity: cap,
          total_beds: cap,
          available_beds: newAvail,
          occupied_beds: Math.max(0, cap - newAvail),
          room_people: cap,
          occupancy_options: updatedOptions,
        };
      })
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
    const isPg = selectedCategory === "pg_hostels";

    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      if (!r.room_type?.trim()) {
        return `Please specify a name/title for option #${i + 1}.`;
      }

      if (isPg) {
        const enabledOptions = (r.occupancy_options || []).filter((opt) => opt.enabled);
        if (enabledOptions.length === 0) {
          return `Please enable at least one occupancy option (e.g. Single, Double Sharing) for "${r.room_type}".`;
        }
        for (const opt of enabledOptions) {
          const rentVal = Number(opt.rent);
          if (!Number.isFinite(rentVal) || rentVal <= 0) {
            return `Please enter a valid monthly rent for "${opt.label}" on "${r.room_type}".`;
          }
        }
        const avail = Number(r.available_beds != null ? r.available_beds : r.available_rooms);
        const total = Number(r.total_beds != null ? r.total_beds : r.bed_capacity || 1);
        if (avail > total) {
          return `Available beds (${avail}) cannot exceed total beds (${total}) on "${r.room_type}".`;
        }
      } else if (isDaily) {
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
      } else if (selectedCategory === "commercial") {
        categoryDetails = { ...commercialSpecs };
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
          : selectedCategory === "commercial"
          ? primarySub || "Retail Shop"
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
      const isPg = selectedCategory === "pg_hostels";
      const roomTypeInputs = rooms.map((r) => {
        let mRent = 0;
        let dRate = null;
        let maxPeople = Number(r.room_people) || 1;
        let availRooms = Number(r.available_rooms) || 0;
        let totalRooms = Number(r.total_rooms) || 1;
        let availBeds = Number(r.available_beds != null ? r.available_beds : availRooms);
        let totalBeds = Number(r.total_beds != null ? r.total_beds : totalRooms);
        let occBeds = Math.max(0, totalBeds - availBeds);
        let occupancyOptionsPayload = [];
        let sharingSummary = r.sharing_type || "";

        if (isPg) {
          const enabledOpts = (r.occupancy_options || []).filter((o) => o.enabled && Number(o.rent) > 0);
          occupancyOptionsPayload = enabledOpts.map((o) => ({
            people: Number(o.people),
            label: o.label,
            rent: Number(o.rent),
            pricingType: o.pricingType || (Number(o.people) === 1 ? "room" : "person"),
          }));
          const rents = occupancyOptionsPayload.map((o) => o.rent);
          mRent = rents.length > 0 ? Math.min(...rents) : Number(r.monthly_rent || 0);
          maxPeople = Number(r.bed_capacity || r.room_people || 1);
          availRooms = availBeds;
          totalRooms = totalBeds;
          sharingSummary = occupancyOptionsPayload.map((o) => o.label).join(" / ");
        } else if (isDaily) {
          dRate = Number(r.daily_price || 0);
          availRooms = Number(r.available_rooms) || 0;
          totalRooms = Number(r.total_rooms) || 1;
        } else {
          mRent = Number(r.monthly_rent || 0);
          availRooms = Number(r.available_rooms) || 0;
          totalRooms = Number(r.total_rooms) || 1;
        }

        return {
          id: r.id || null,
          room_type: r.room_type.trim(),
          price_value: mRent,
          room_rent: mRent,
          daily_price: dRate,
          hourly_price: r.hourly_price ? Number(r.hourly_price) : null,
          weekend_price: r.weekend_price ? Number(r.weekend_price) : null,
          room_people: maxPeople,
          available_rooms: availRooms,
          total_rooms: totalRooms,
          available_beds: isPg ? availBeds : undefined,
          total_beds: isPg ? totalBeds : undefined,
          occupied_beds: isPg ? occBeds : undefined,
          bed_capacity: isPg ? maxPeople : undefined,
          availability: availRooms > 0 ? "Available" : "Occupied",
          room_details: {
            room_name: r.room_type.trim(),
            sharing_type: sharingSummary,
            bed_capacity: isPg ? maxPeople : undefined,
            available_beds: isPg ? availBeds : undefined,
            total_beds: isPg ? totalBeds : undefined,
            occupied_beds: isPg ? occBeds : undefined,
            occupancy_options: isPg ? occupancyOptionsPayload : undefined,
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
                <div className="cat-card-icon">
                  <CategoryIcon categoryId={cat.id} size={28} />
                </div>
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

        {/* 3E: Commercial Property Specifications & Business Terms */}
        {selectedCategory === "commercial" && (
          <div className="category-specific-commercial">
            {/* Subsection 1: Property Specifications */}
            <div className="commercial-form-section-title" style={{ margin: "14px 0 10px", fontWeight: 700, fontSize: "15px", color: "var(--rd-text, #22577a)" }}>
              📐 Property Dimensions & Specifications
            </div>
            <div className="form-fields-grid category-specific-grid">
              <div className="form-field fourth-width">
                <label>Total Area (sq. ft.) <span className="required-star">*</span></label>
                <input
                  type="number"
                  className="dynamic-input"
                  placeholder="e.g. 1200"
                  value={commercialSpecs.totalArea}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, totalArea: e.target.value })}
                  required
                />
              </div>

              <div className="form-field fourth-width">
                <label>Carpet Area (sq. ft.)</label>
                <input
                  type="number"
                  className="dynamic-input"
                  placeholder="e.g. 950"
                  value={commercialSpecs.carpetArea}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, carpetArea: e.target.value })}
                />
              </div>

              <div className="form-field fourth-width">
                <label>Built-Up Area (sq. ft.)</label>
                <input
                  type="number"
                  className="dynamic-input"
                  placeholder="e.g. 1100"
                  value={commercialSpecs.builtUpArea}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, builtUpArea: e.target.value })}
                />
              </div>

              <div className="form-field fourth-width">
                <label>Furnishing Status</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.furnishingStatus}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, furnishingStatus: e.target.value })}
                >
                  <option value="Unfurnished">Unfurnished / Bare Shell</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Fully Furnished">Fully Furnished</option>
                </select>
              </div>

              <div className="form-field fourth-width">
                <label>Located on Floor</label>
                <input
                  type="text"
                  className="dynamic-input"
                  placeholder="e.g. Ground Floor, 2nd Floor, Basement"
                  value={commercialSpecs.floorNumber}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, floorNumber: e.target.value })}
                />
              </div>

              <div className="form-field fourth-width">
                <label>Total Floors in Building</label>
                <input
                  type="number"
                  className="dynamic-input"
                  placeholder="e.g. 4"
                  value={commercialSpecs.totalFloors}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, totalFloors: e.target.value })}
                />
              </div>

              <div className="form-field fourth-width">
                <label>Rooms / Cabins</label>
                <input
                  type="number"
                  className="dynamic-input"
                  placeholder="e.g. 3"
                  value={commercialSpecs.roomsCabins}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, roomsCabins: e.target.value })}
                />
              </div>

              <div className="form-field fourth-width">
                <label>Washrooms Count & Type</label>
                <div className="dual-inputs">
                  <input
                    type="number"
                    className="dynamic-input"
                    placeholder="Count"
                    value={commercialSpecs.washrooms}
                    onChange={(e) => setCommercialSpecs({ ...commercialSpecs, washrooms: e.target.value })}
                  />
                  <select
                    className="dynamic-select"
                    value={commercialSpecs.washroomType}
                    onChange={(e) => setCommercialSpecs({ ...commercialSpecs, washroomType: e.target.value })}
                  >
                    <option value="Private">Private</option>
                    <option value="Common">Common</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              <div className="form-field fourth-width">
                <label>Frontage / Road Width (ft)</label>
                <input
                  type="text"
                  className="dynamic-input"
                  placeholder="e.g. 25 ft frontage"
                  value={commercialSpecs.frontage}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, frontage: e.target.value })}
                />
              </div>

              <div className="form-field fourth-width">
                <label>Property Condition</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.propertyCondition}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, propertyCondition: e.target.value })}
                >
                  <option value="Ready to Move">Ready to Move</option>
                  <option value="Under Renovation">Under Renovation</option>
                  <option value="Bare Shell">Bare Shell</option>
                  <option value="Newly Constructed">Newly Constructed</option>
                </select>
              </div>

              <div className="form-field fourth-width">
                <label>Road Access & Location</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.roadAccess}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, roadAccess: e.target.value })}
                >
                  <option value="Main Road Facing">Main Road Facing</option>
                  <option value="Corner Property">Corner Property</option>
                  <option value="High Street Commercial Hub">High Street Commercial Hub</option>
                  <option value="Inside Commercial Complex">Inside Commercial Complex</option>
                  <option value="Internal Arterial Road">Internal Arterial Road</option>
                </select>
              </div>

              <div className="form-field fourth-width">
                <label>Parking Availability</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.parking}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, parking: e.target.value })}
                >
                  <option value="Dedicated Parking Available">Dedicated Parking Available</option>
                  <option value="Covered Basement Parking">Covered Basement Parking</option>
                  <option value="Visitor Parking Available">Visitor Parking Available</option>
                  <option value="Public / On-Street Parking">Public / On-Street Parking</option>
                  <option value="No Dedicated Parking">No Dedicated Parking</option>
                </select>
              </div>

              <div className="form-field fourth-width">
                <label>Lift & Elevator</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.lift}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, lift: e.target.value })}
                >
                  <option value="Passenger + Service Lift">Passenger + Service Lift</option>
                  <option value="Passenger Lift Available">Passenger Lift Available</option>
                  <option value="Goods / Freight Lift">Goods / Freight Lift</option>
                  <option value="No Lift">No Lift</option>
                </select>
              </div>

              <div className="form-field fourth-width">
                <label>Power Backup & Electrical</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.powerBackup}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, powerBackup: e.target.value })}
                >
                  <option value="Full Power Backup">Full 24x7 Power Backup</option>
                  <option value="Partial Backup">Partial Backup (Lights & Fans)</option>
                  <option value="Dedicated Generator Provision">Dedicated Generator Provision</option>
                  <option value="None">No Power Backup</option>
                </select>
              </div>

              <div className="form-field fourth-width">
                <label>Power Load / Connection</label>
                <input
                  type="text"
                  className="dynamic-input"
                  placeholder="e.g. 15 KW 3-Phase Commercial"
                  value={commercialSpecs.powerCapacity}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, powerCapacity: e.target.value })}
                />
              </div>

              <div className="form-field fourth-width">
                <label>Ownership / Title Type</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.ownershipType}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, ownershipType: e.target.value })}
                >
                  <option value="Freehold">Freehold</option>
                  <option value="Leasehold">Leasehold</option>
                  <option value="Power of Attorney">Power of Attorney</option>
                </select>
              </div>
            </div>

            {/* Subsection 2: Subcategory-Specific Tailored Fields */}
            <div className="commercial-form-section-title" style={{ margin: "22px 0 10px", fontWeight: 700, fontSize: "15px", color: "var(--rd-text, #22577a)" }}>
              🏢 Subcategory-Specific Features (Tailored for {selectedSubcategories.filter(s => s !== "All").join(", ") || "Commercial Space"})
            </div>
            <div className="form-fields-grid category-specific-grid" style={{ background: "var(--rd-surface-soft, rgba(124, 58, 237, 0.04))", padding: "16px", borderRadius: "12px", border: "1px solid var(--rd-border, #e2e8f0)" }}>
              {/* Retail Shop Specifics */}
              {selectedSubcategories.some(s => s.toLowerCase().includes("shop") || s.toLowerCase().includes("retail")) && (
                <>
                  <div className="form-field third-width">
                    <label>Shop Frontage (ft)</label>
                    <input
                      type="text"
                      className="dynamic-input"
                      placeholder="e.g. 15 ft"
                      value={commercialSpecs.shopFrontage}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, shopFrontage: e.target.value })}
                    />
                  </div>
                  <div className="form-field third-width">
                    <label>Shutter Type</label>
                    <select
                      className="dynamic-select"
                      value={commercialSpecs.shutterType}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, shutterType: e.target.value })}
                    >
                      <option value="Motorized Rolling Shutter">Motorized Rolling Shutter</option>
                      <option value="Manual Rolling Shutter">Manual Rolling Shutter</option>
                      <option value="Toughened Glass Front with Shutter">Toughened Glass Front with Shutter</option>
                    </select>
                  </div>
                  <div className="form-field third-width" style={{ display: "flex", alignItems: "center", paddingTop: "24px" }}>
                    <label className="checkbox-toggle">
                      <input
                        type="checkbox"
                        checked={commercialSpecs.groundFloorAccess}
                        onChange={(e) => setCommercialSpecs({ ...commercialSpecs, groundFloorAccess: e.target.checked })}
                      />
                      <span>Direct Ground Floor Entry</span>
                    </label>
                  </div>
                </>
              )}

              {/* Showroom Specifics */}
              {selectedSubcategories.some(s => s.toLowerCase().includes("showroom")) && (
                <>
                  <div className="form-field half-width">
                    <label>Main Display / Showcase Area (sq. ft.)</label>
                    <input
                      type="text"
                      className="dynamic-input"
                      placeholder="e.g. 1800 sq ft"
                      value={commercialSpecs.displayArea}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, displayArea: e.target.value })}
                    />
                  </div>
                  <div className="form-field half-width">
                    <label>Display Facade Road Visibility</label>
                    <input
                      type="text"
                      className="dynamic-input"
                      placeholder="e.g. 40 ft Clear Glass Frontage on Highway"
                      value={commercialSpecs.roadAccess}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, roadAccess: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Office / Coworking Specifics */}
              {selectedSubcategories.some(s => s.toLowerCase().includes("office") || s.toLowerCase().includes("coworking")) && (
                <>
                  <div className="form-field fourth-width">
                    <label>Private Cabins</label>
                    <input
                      type="number"
                      className="dynamic-input"
                      placeholder="e.g. 4"
                      value={commercialSpecs.cabinsCount}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, cabinsCount: e.target.value })}
                    />
                  </div>
                  <div className="form-field fourth-width">
                    <label>Workstations / Desks</label>
                    <input
                      type="number"
                      className="dynamic-input"
                      placeholder="e.g. 24"
                      value={commercialSpecs.workstationsCount || commercialSpecs.desksCount}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, workstationsCount: e.target.value, desksCount: e.target.value })}
                    />
                  </div>
                  <div className="form-field fourth-width" style={{ display: "flex", alignItems: "center", paddingTop: "24px" }}>
                    <label className="checkbox-toggle">
                      <input
                        type="checkbox"
                        checked={commercialSpecs.conferenceRoom}
                        onChange={(e) => setCommercialSpecs({ ...commercialSpecs, conferenceRoom: e.target.checked })}
                      />
                      <span>Conference Room</span>
                    </label>
                  </div>
                  <div className="form-field fourth-width" style={{ display: "flex", alignItems: "center", paddingTop: "24px" }}>
                    <label className="checkbox-toggle">
                      <input
                        type="checkbox"
                        checked={commercialSpecs.receptionArea}
                        onChange={(e) => setCommercialSpecs({ ...commercialSpecs, receptionArea: e.target.checked })}
                      />
                      <span>Reception Desk</span>
                    </label>
                  </div>
                </>
              )}

              {/* Warehouse / Godown Specifics */}
              {selectedSubcategories.some(s => s.toLowerCase().includes("warehouse") || s.toLowerCase().includes("godown")) && (
                <>
                  <div className="form-field fourth-width">
                    <label>Clear Ceiling Height</label>
                    <input
                      type="text"
                      className="dynamic-input"
                      placeholder="e.g. 22 ft"
                      value={commercialSpecs.ceilingHeight}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, ceilingHeight: e.target.value })}
                    />
                  </div>
                  <div className="form-field fourth-width">
                    <label>Floor Load Capacity</label>
                    <input
                      type="text"
                      className="dynamic-input"
                      placeholder="e.g. 5 Ton / sq.m"
                      value={commercialSpecs.floorLoadCapacity}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, floorLoadCapacity: e.target.value })}
                    />
                  </div>
                  <div className="form-field fourth-width">
                    <label>Loading Dock / Bay</label>
                    <select
                      className="dynamic-select"
                      value={commercialSpecs.loadingDock}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, loadingDock: e.target.value })}
                    >
                      <option value="Dedicated Loading Dock with Bay">Dedicated Loading Dock with Bay</option>
                      <option value="Shared Loading Bay">Shared Loading Bay</option>
                      <option value="Ramp Access">Ramp Access for Forklifts</option>
                      <option value="None">Direct Ground Access</option>
                    </select>
                  </div>
                  <div className="form-field fourth-width">
                    <label>Heavy Vehicle Access</label>
                    <select
                      className="dynamic-select"
                      value={commercialSpecs.truckAccess}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, truckAccess: e.target.value })}
                    >
                      <option value="Heavy Truck & Trailer Accessible">Heavy Truck & Trailer Accessible</option>
                      <option value="Medium Commercial Vehicle (MCV)">Medium Commercial Vehicle (MCV)</option>
                      <option value="Small Commercial Vehicle (SCV)">Small Commercial Vehicle (SCV)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Restaurant / Food Space Specifics */}
              {selectedSubcategories.some(s => s.toLowerCase().includes("restaurant")) && (
                <>
                  <div className="form-field third-width">
                    <label>Seating / Dining Capacity</label>
                    <input
                      type="number"
                      className="dynamic-input"
                      placeholder="e.g. 80 persons"
                      value={commercialSpecs.diningCapacity}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, diningCapacity: e.target.value })}
                    />
                  </div>
                  <div className="form-field third-width">
                    <label>Exhaust & Ventilation</label>
                    <select
                      className="dynamic-select"
                      value={commercialSpecs.exhaustVentilation}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, exhaustVentilation: e.target.value })}
                    >
                      <option value="Commercial Chimney & Exhaust Installed">Commercial Chimney & Exhaust Installed</option>
                      <option value="Provision for Chimney Ducting">Provision for Chimney Ducting</option>
                      <option value="Standard Ventilation">Standard Ventilation</option>
                    </select>
                  </div>
                  <div className="form-field third-width" style={{ display: "flex", alignItems: "center", paddingTop: "24px" }}>
                    <label className="checkbox-toggle">
                      <input
                        type="checkbox"
                        checked={commercialSpecs.kitchenSpace}
                        onChange={(e) => setCommercialSpecs({ ...commercialSpecs, kitchenSpace: e.target.checked })}
                      />
                      <span>Dedicated Commercial Kitchen Space</span>
                    </label>
                  </div>
                </>
              )}

              {/* Industrial Space Specifics */}
              {selectedSubcategories.some(s => s.toLowerCase().includes("industrial")) && (
                <>
                  <div className="form-field half-width">
                    <label>Industrial Zone / Approval Status</label>
                    <input
                      type="text"
                      className="dynamic-input"
                      placeholder="e.g. Approved MIDC / WBIIDC Industrial Park"
                      value={commercialSpecs.industrialZone}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, industrialZone: e.target.value })}
                    />
                  </div>
                  <div className="form-field half-width">
                    <label>Dedicated Substation / Transformer</label>
                    <input
                      type="text"
                      className="dynamic-input"
                      placeholder="e.g. 100 KVA Dedicated Transformer"
                      value={commercialSpecs.transformerCapacity}
                      onChange={(e) => setCommercialSpecs({ ...commercialSpecs, transformerCapacity: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Commercial Building Specifics */}
              {selectedSubcategories.some(s => s.toLowerCase().includes("building")) && (
                <div className="form-field half-width">
                  <label>Total Commercial Units / Offices in Building</label>
                  <input
                    type="number"
                    className="dynamic-input"
                    placeholder="e.g. 16"
                    value={commercialSpecs.buildingUnitsCount}
                    onChange={(e) => setCommercialSpecs({ ...commercialSpecs, buildingUnitsCount: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Subsection 3: Business Usage & Permissions */}
            <div className="commercial-form-section-title" style={{ margin: "22px 0 10px", fontWeight: 700, fontSize: "15px", color: "var(--rd-text, #22577a)" }}>
              💼 Business Usage & Permissions
            </div>
            <div className="form-fields-grid category-specific-grid">
              <div className="form-field half-width">
                <label>Permitted Business Activities</label>
                <input
                  type="text"
                  className="dynamic-input"
                  placeholder="e.g. Retail, Corporate Office, Pathology Lab, Clinic"
                  value={commercialSpecs.permittedActivities}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, permittedActivities: e.target.value })}
                />
              </div>

              <div className="form-field half-width">
                <label>Usage Restrictions</label>
                <input
                  type="text"
                  className="dynamic-input"
                  placeholder="e.g. No hazardous or inflammable chemical storage"
                  value={commercialSpecs.usageRestrictions}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, usageRestrictions: e.target.value })}
                />
              </div>

              <div className="form-field third-width">
                <label>Signboard / Branding Permission</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.signboardPermission}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, signboardPermission: e.target.value })}
                >
                  <option value="Allowed on Building Facade">Allowed on Building Facade</option>
                  <option value="Allowed on Main Gate / Billboard">Allowed on Main Gate / Billboard</option>
                  <option value="Allowed Inside Premises Only">Allowed Inside Premises Only</option>
                  <option value="Subject to Society Approval">Subject to Society Approval</option>
                </select>
              </div>

              <div className="form-field third-width">
                <label>Permitted Operating Hours</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.operatingHours}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, operatingHours: e.target.value })}
                >
                  <option value="24x7 Access Permitted">24x7 Access Permitted</option>
                  <option value="6:00 AM - 11:00 PM">6:00 AM - 11:00 PM</option>
                  <option value="8:00 AM - 10:00 PM">8:00 AM - 10:00 PM</option>
                  <option value="Standard Business Hours (9 AM - 7 PM)">Standard Business Hours (9 AM - 7 PM)</option>
                </select>
              </div>

              <div className="form-field third-width">
                <label>Previous Usage / History (Optional)</label>
                <input
                  type="text"
                  className="dynamic-input"
                  placeholder="e.g. Previously occupied by Nationalised Bank"
                  value={commercialSpecs.previousUsage}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, previousUsage: e.target.value })}
                />
              </div>
            </div>

            {/* Subsection 4: Rental Pricing & Commercial Lease Terms */}
            <div className="commercial-form-section-title" style={{ margin: "22px 0 10px", fontWeight: 700, fontSize: "15px", color: "var(--rd-text, #22577a)" }}>
              💰 Commercial Rental Terms & Lease Agreement
            </div>
            <div className="form-fields-grid category-specific-grid">
              <div className="form-field fourth-width">
                <label>Monthly Rent (₹) <span className="required-star">*</span></label>
                <input
                  type="number"
                  className="dynamic-input"
                  placeholder="e.g. 25000"
                  value={commercialSpecs.monthlyRent}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, monthlyRent: e.target.value })}
                  required
                />
              </div>

              <div className="form-field fourth-width">
                <label>Security Deposit (₹)</label>
                <input
                  type="number"
                  className="dynamic-input"
                  placeholder="e.g. 75000"
                  value={commercialSpecs.securityDeposit}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, securityDeposit: e.target.value })}
                />
              </div>

              <div className="form-field fourth-width">
                <label>Advance Rent / Token (₹)</label>
                <input
                  type="number"
                  className="dynamic-input"
                  placeholder="e.g. 25000"
                  value={commercialSpecs.advancePayment}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, advancePayment: e.target.value })}
                />
              </div>

              <div className="form-field fourth-width">
                <label>Maintenance Charges (₹)</label>
                <div className="dual-inputs">
                  <input
                    type="number"
                    className="dynamic-input"
                    placeholder="Amount"
                    value={commercialSpecs.maintenanceCharges}
                    onChange={(e) => setCommercialSpecs({ ...commercialSpecs, maintenanceCharges: e.target.value })}
                  />
                  <select
                    className="dynamic-select"
                    value={commercialSpecs.maintenanceFrequency}
                    onChange={(e) => setCommercialSpecs({ ...commercialSpecs, maintenanceFrequency: e.target.value })}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="form-field fourth-width">
                <label>Electricity Charges</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.electricityCharges}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, electricityCharges: e.target.value })}
                >
                  <option value="As per Commercial Meter">As per Commercial Meter</option>
                  <option value="Fixed Commercial Unit Rate">Fixed Commercial Unit Rate</option>
                  <option value="Included in Rent">Included in Rent</option>
                </select>
              </div>

              <div className="form-field fourth-width">
                <label>Water Charges</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.waterCharges}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, waterCharges: e.target.value })}
                >
                  <option value="Included in Rent">Included in Rent</option>
                  <option value="As per Meter">As per Meter</option>
                  <option value="Fixed Monthly Charges">Fixed Monthly Charges</option>
                </select>
              </div>

              <div className="form-field fourth-width">
                <label>Minimum Lock-in Period</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.minRentalPeriod}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, minRentalPeriod: e.target.value })}
                >
                  <option value="6 Months">6 Months</option>
                  <option value="11 Months">11 Months</option>
                  <option value="1 Year">1 Year</option>
                  <option value="2 Years">2 Years</option>
                  <option value="3 Years">3 Years</option>
                  <option value="5 Years">5 Years</option>
                </select>
              </div>

              <div className="form-field fourth-width">
                <label>Preferred Lease Duration</label>
                <select
                  className="dynamic-select"
                  value={commercialSpecs.preferredLease}
                  onChange={(e) => setCommercialSpecs({ ...commercialSpecs, preferredLease: e.target.value })}
                >
                  <option value="11 Months (Standard Agreement)">11 Months (Standard Agreement)</option>
                  <option value="3 Years (Commercial Lease)">3 Years (Commercial Lease)</option>
                  <option value="5 Years (Long-Term Registered)">5 Years (Long-Term Registered)</option>
                  <option value="9 Years (Corporate Lease)">9 Years (Corporate Lease)</option>
                </select>
              </div>

              <div className="form-field half-width" style={{ display: "flex", alignItems: "center", paddingTop: "20px" }}>
                <label className="checkbox-toggle">
                  <input
                    type="checkbox"
                    checked={commercialSpecs.rentNegotiable}
                    onChange={(e) => setCommercialSpecs({ ...commercialSpecs, rentNegotiable: e.target.checked })}
                  />
                  <span>🤝 Rent and Lease Terms are Negotiable</span>
                </label>
              </div>
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

        <ImageUploader
          images={images}
          onChange={setImages}
          onImagesChange={setImages}
          userId={userId}
        />
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
                : selectedCategory === "commercial"
                ? "Rentable Commercial Units & Pricing"
                : "Rooms & Pricing"}
            </h3>
            <p>
              {selectedCategory === "commercial"
                ? "Configure distinct rentable units, shops, floors, or cabins with individual area, monthly lease pricing, and availability."
                : "Configure room types, sharing options, and pricing rates."}
            </p>
          </div>
        </div>

        <div className="rooms-container">
          {rooms.map((room, index) => {
            const isDaily = selectedCategory === "hotels_stays" || selectedCategory === "event_spaces";
            const isPg = selectedCategory === "pg_hostels";

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

                {isPg ? (
                  <div className="pg-room-config-body">
                    <div className="form-fields-grid">
                      <div className="form-field half-width">
                        <label>
                          Room Type / Title <span className="required-star">*</span>
                        </label>
                        <input
                          type="text"
                          className="dynamic-input"
                          placeholder="e.g. Deluxe AC Room / Room 101"
                          value={room.room_type}
                          onChange={(e) => handleUpdateRoom(index, "room_type", e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-field fourth-width">
                        <label>
                          Bed Capacity <span className="required-star">*</span>
                        </label>
                        <select
                          className="dynamic-select"
                          value={room.bed_capacity || 3}
                          onChange={(e) => handleUpdateBedCapacity(index, e.target.value)}
                        >
                          <option value="1">1 Bed (Single)</option>
                          <option value="2">2 Beds (Double)</option>
                          <option value="3">3 Beds (Triple)</option>
                          <option value="4">4 Beds (Four)</option>
                          <option value="5">5 Beds</option>
                          <option value="6">6 Beds (Dorm)</option>
                        </select>
                      </div>

                      <div className="form-field fourth-width">
                        <label>
                          Available Beds <span className="required-star">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={room.bed_capacity || 6}
                          className="dynamic-input"
                          value={room.available_beds != null ? room.available_beds : room.bed_capacity || 1}
                          onChange={(e) => {
                            const avail = Math.max(0, Number(e.target.value) || 0);
                            const total = Number(room.total_beds || room.bed_capacity || 1);
                            handleUpdateRoom(index, "available_beds", avail);
                            handleUpdateRoom(index, "occupied_beds", Math.max(0, total - avail));
                            handleUpdateRoom(index, "available_rooms", avail);
                          }}
                          required
                        />
                      </div>
                    </div>

                    {/* Bed Inventory Pill */}
                    <div
                      className="pg-inventory-summary-pill"
                      style={{
                        margin: "12px 0 16px",
                        padding: "10px 16px",
                        borderRadius: "10px",
                        background: "var(--rd-surface, #ffffff)",
                        border: "1px solid var(--rd-border, #c6ead9)",
                        display: "flex",
                        gap: "18px",
                        flexWrap: "wrap",
                        fontSize: "13px",
                      }}
                    >
                      <span>🛏️ Total Capacity: <strong>{room.bed_capacity || 1} beds</strong></span>
                      <span>🟢 Available: <strong style={{ color: "#16a34a" }}>{room.available_beds != null ? room.available_beds : room.bed_capacity || 1} beds</strong></span>
                      <span>🔴 Occupied: <strong style={{ color: "#dc2626" }}>{room.occupied_beds != null ? room.occupied_beds : Math.max(0, (room.bed_capacity || 1) - (room.available_beds || 0))} beds</strong></span>
                    </div>

                    {/* Occupancy-Based Independent Pricing Configuration */}
                    <div
                      className="pg-occupancy-pricing-box"
                      style={{
                        background: "var(--rd-surface, #ffffff)",
                        border: "1px solid var(--rd-border, #c6ead9)",
                        borderRadius: "12px",
                        padding: "16px",
                        margin: "14px 0",
                      }}
                    >
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ fontSize: "14px", color: "var(--rd-text, #22577a)" }}>
                          Occupancy Options & Independent Pricing
                        </strong>
                        <p style={{ fontSize: "12px", color: "var(--rd-muted, #3a6f86)", marginTop: "3px" }}>
                          Select which sharing options you offer for this room and enter independent monthly prices. Prices do not calculate automatically.
                        </p>
                      </div>

                      <div style={{ display: "grid", gap: "10px" }}>
                        {(room.occupancy_options || []).map((opt) => (
                          <div
                            key={opt.people}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "12px",
                              padding: "10px 14px",
                              borderRadius: "10px",
                              background: opt.enabled ? "var(--rd-surface-soft, #e6f7ef)" : "rgba(0,0,0,0.02)",
                              border: `1px solid ${opt.enabled ? "var(--rd-accent, #38a3a5)" : "var(--rd-border, #c6ead9)"}`,
                              flexWrap: "wrap",
                            }}
                          >
                            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", minWidth: "180px" }}>
                              <input
                                type="checkbox"
                                checked={!!opt.enabled}
                                onChange={(e) => handleUpdateOccupancyOption(index, opt.people, "enabled", e.target.checked)}
                              />
                              <span style={{ fontWeight: opt.enabled ? 700 : 500, color: "var(--rd-text, #22577a)", fontSize: "13.5px" }}>
                                {opt.label} ({opt.people} {opt.people === 1 ? "person" : "sharing"})
                              </span>
                            </label>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "12.5px", color: "var(--rd-muted, #3a6f86)" }}>Monthly Rent (₹):</span>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!opt.enabled}
                                  style={{
                                    width: "110px",
                                    padding: "6px 10px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--rd-border, #c6ead9)",
                                    background: opt.enabled ? "#ffffff" : "#f1f5f9",
                                    fontWeight: 700,
                                    color: "var(--rd-text, #22577a)",
                                  }}
                                  value={opt.rent ?? ""}
                                  placeholder="e.g. 5000"
                                  onChange={(e) => handleUpdateOccupancyOption(index, opt.people, "rent", e.target.value)}
                                />
                              </div>

                              <select
                                disabled={!opt.enabled}
                                value={opt.pricingType || (opt.people === 1 ? "room" : "person")}
                                onChange={(e) => handleUpdateOccupancyOption(index, opt.people, "pricingType", e.target.value)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  border: "1px solid var(--rd-border, #c6ead9)",
                                  background: opt.enabled ? "#ffffff" : "#f1f5f9",
                                  fontSize: "12.5px",
                                  color: "var(--rd-text, #22577a)",
                                }}
                              >
                                <option value="person">Per Person / Mo</option>
                                <option value="room">Per Room / Mo</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Room Switches */}
                    <div className="form-field half-width room-switches" style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
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
                ) : (
                  <div className="form-fields-grid">
                    <div className={selectedCategory === "commercial" ? "form-field third-width" : "form-field half-width"}>
                      <label>
                        {selectedCategory === "event_spaces"
                          ? "Space / Hall Title"
                          : selectedCategory === "commercial"
                          ? "Commercial Unit / Space Title"
                          : "Room Type / Title"}{" "}
                        <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        className="dynamic-input"
                        placeholder={
                          selectedCategory === "event_spaces"
                            ? "e.g. Deluxe AC Room / Grand Lawn"
                            : selectedCategory === "commercial"
                            ? "e.g. Ground Floor Shop A / Executive Cabin 1"
                            : "e.g. Deluxe AC Room / 2 Sharing Room"
                        }
                        value={room.room_type}
                        onChange={(e) => handleUpdateRoom(index, "room_type", e.target.value)}
                        required
                      />
                    </div>

                    {/* Unit Area for Commercial */}
                    {selectedCategory === "commercial" && (
                      <div className="form-field third-width">
                        <label>Unit Area (sq. ft.)</label>
                        <input
                          type="text"
                          className="dynamic-input"
                          placeholder="e.g. 650 sq ft"
                          value={room.room_size || ""}
                          onChange={(e) => handleUpdateRoom(index, "room_size", e.target.value)}
                        />
                      </div>
                    )}

                    {/* Pricing Input: Monthly for Flats & Commercial; Daily for Hotels & Events */}
                    {!isDaily ? (
                      <div className={selectedCategory === "commercial" ? "form-field third-width" : "form-field half-width"}>
                        <label>
                          Monthly Rent / Lease Rate (₹) <span className="required-star">*</span>
                        </label>
                        <input
                          type="number"
                          className="dynamic-input"
                          placeholder="e.g. 25000"
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
                        {selectedCategory === "event_spaces"
                          ? "Available Slots"
                          : selectedCategory === "commercial"
                          ? "Available Units"
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
                        {selectedCategory === "event_spaces"
                          ? "Capacity"
                          : selectedCategory === "commercial"
                          ? "Workstations / Capacity"
                          : "Max People"}
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
                        <span>{selectedCategory === "commercial" ? "🚽 Washroom Facility" : "🚿 Attached Bath"}</span>
                      </label>

                      <label className="checkbox-toggle">
                        <input
                          type="checkbox"
                          checked={room.ac_available}
                          onChange={(e) => handleUpdateRoom(index, "ac_available", e.target.checked)}
                        />
                        <span>{selectedCategory === "commercial" ? "❄️ Air Conditioned" : "❄️ AC Available"}</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            className="add-room-btn"
            onClick={handleAddRoom}
          >
            <span>+</span> {selectedCategory === "commercial" ? "Add Another Commercial Unit / Space" : "Add Another Room / Space Option"}
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
