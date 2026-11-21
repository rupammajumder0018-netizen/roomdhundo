/**
 * Roomdhundo — Centralized Property Categories & Dynamic Form Configuration
 *
 * Defines the 4 industry-standard categories and their strict subcategories:
 * 1. PG & Hostels
 * 2. Hotels & Stays
 * 3. Flats & Rentals
 * 4. Event Spaces
 *
 * Category selection rules:
 * - Each property belongs to ONE main category.
 * - Subcategories support multiple selections where applicable.
 * - Each subcategory list includes an "All" option.
 * - Selecting "All" is mutually exclusive with individual subcategories.
 */

export const PROPERTY_CATEGORIES = [
  {
    id: "pg_hostels",
    name: "PG & Hostels",
    shortName: "PG & Hostel",
    icon: "🛏️",
    badgeColor: "#38a3a5",
    description: "Paying guest accommodations, student hostels, and co-living spaces with meal options.",
    pricingUnit: "/ month",
    pricingLabel: "Monthly Rent",
    subcategories: [
      "All",
      "PG",
      "Only Boys PG",
      "Only Girls PG",
      "Boys Hostel",
      "Girls Hostel",
      "Co-living PG",
      "Student Mess",
    ],
    amenities: [
      { id: "wifi", label: "High-Speed Wi-Fi", icon: "📶" },
      { id: "food", label: "Food / Mess Included", icon: "🍛" },
      { id: "ac", label: "Air Conditioning (AC)", icon: "❄️" },
      { id: "laundry", label: "Washing Machine / Laundry", icon: "🧺" },
      { id: "parking", label: "Vehicle Parking", icon: "🚗" },
      { id: "bathroom", label: "Attached Bathroom", icon: "🚿" },
      { id: "kitchen", label: "Attached Kitchen / Refrigerator", icon: "🍳" },
      { id: "study_table", label: "Study Table & Chair", icon: "🪑" },
      { id: "wardrobe", label: "Personal Wardrobe", icon: "🚪" },
      { id: "power_backup", label: "Power Backup / Inverter", icon: "⚡" },
      { id: "cctv", label: "24x7 CCTV & Security", icon: "📹" },
      { id: "geyser", label: "Geyser / Hot Water", icon: "♨️" },
      { id: "ro_water", label: "RO Drinking Water", icon: "💧" },
      { id: "cleaning", label: "Daily Room Cleaning", icon: "🧹" },
      { id: "couple_friendly", label: "Couple Friendly", icon: "💑" },
    ],
  },
  {
    id: "hotels_stays",
    name: "Hotels & Stays",
    shortName: "Hotel & Stay",
    icon: "🏨",
    badgeColor: "#2563eb",
    description: "Budget & luxury hotels, resorts, lodges, and homestays with nightly or hourly booking.",
    pricingUnit: "/ night",
    pricingLabel: "Nightly Rate",
    subcategories: [
      "All",
      "Hotel",
      "Resort",
      "Guest House",
      "Lodge",
      "Homestay",
    ],
    amenities: [
      { id: "free_wifi", label: "Free High-Speed Wi-Fi", icon: "📶" },
      { id: "ac_rooms", label: "AC Rooms", icon: "❄️" },
      { id: "breakfast", label: "Complimentary Breakfast", icon: "☕" },
      { id: "front_desk", label: "24x7 Front Desk", icon: "🛎️" },
      { id: "room_service", label: "Room Service", icon: "🍽️" },
      { id: "attached_bath", label: "Attached Bathroom with Geyser", icon: "🚿" },
      { id: "parking", label: "Free On-Site Parking", icon: "🚗" },
      { id: "power_backup", label: "Power Backup / Generator", icon: "⚡" },
      { id: "lift", label: "Elevator / Lift", icon: "🛗" },
      { id: "restaurant", label: "In-House Restaurant & Bar", icon: "🍷" },
      { id: "housekeeping", label: "Daily Housekeeping", icon: "🧹" },
      { id: "smart_tv", label: "Smart TV with OTT", icon: "📺" },
      { id: "couple_friendly", label: "Couple Friendly / Local ID Accepted", icon: "💑" },
      { id: "swimming_pool", label: "Swimming Pool", icon: "🏊" },
    ],
  },
  {
    id: "flats_rentals",
    name: "Flats & Rentals",
    shortName: "Flat & Rental",
    icon: "🏢",
    badgeColor: "#059669",
    description: "1RK, 1BHK, 2BHK, 3BHK flats, independent houses, and builder floors for rent or sale.",
    pricingUnit: "/ month",
    pricingLabel: "Monthly Rent / Price",
    subcategories: [
      "All",
      "Flat",
      "Apartment",
      "Independent Room",
      "Independent House",
      "Studio Apartment",
    ],
    amenities: [
      { id: "lift", label: "Elevator / Lift", icon: "🛗" },
      { id: "reserved_parking", label: "Reserved Covered Parking", icon: "🚗" },
      { id: "power_backup", label: "Full Power Backup", icon: "⚡" },
      { id: "security", label: "24x7 Gated Security & CCTV", icon: "🛡️" },
      { id: "water_supply", label: "24x7 Running Water Supply", icon: "🚰" },
      { id: "piped_gas", label: "Piped Gas (PNG/IGL)", icon: "🔥" },
      { id: "gym", label: "Gymnasium & Fitness Area", icon: "🏋️" },
      { id: "clubhouse", label: "Clubhouse / Community Hall", icon: "🏛️" },
      { id: "swimming_pool", label: "Swimming Pool", icon: "🏊" },
      { id: "park", label: "Park / Green Jogging Area", icon: "🌳" },
      { id: "balcony", label: "Private Balcony", icon: "🌅" },
      { id: "pet_friendly", label: "Pet Friendly", icon: "🐾" },
    ],
  },
  {
    id: "event_spaces",
    name: "Event Spaces",
    shortName: "Event Space",
    icon: "🎉",
    badgeColor: "#d97706",
    description: "Banquet halls, wedding venues, conference rooms, and party halls for all occasions.",
    pricingUnit: "/ day",
    pricingLabel: "Day / Event Rate",
    subcategories: [
      "All",
      "Banquet Hall",
      "Party Hall",
      "Wedding Venue",
      "Conference Hall",
      "Meeting Hall",
    ],
    amenities: [
      { id: "central_ac", label: "Central Air Conditioning", icon: "❄️" },
      { id: "grand_stage", label: "Raised Stage / Platform", icon: "🎭" },
      { id: "sound_system", label: "Sound System / Mic & Speakers", icon: "🔊" },
      { id: "projector", label: "HD Projector & LED Display", icon: "📽️" },
      { id: "banquet_furniture", label: "Banquet Chairs & Round Tables", icon: "🪑" },
      { id: "power_backup", label: "Heavy Generator / Full Backup", icon: "⚡" },
      { id: "parking_ground", label: "Huge Parking Ground & Valet", icon: "🚗" },
      { id: "bridal_room", label: "Changing / Bridal / Green Rooms", icon: "💄" },
      { id: "inhouse_catering", label: "In-House Catering Available", icon: "👨‍🍳" },
      { id: "outside_catering", label: "Outside Catering Allowed", icon: "🍲" },
      { id: "dj_allowed", label: "Music / DJ Setup Allowed", icon: "🎶" },
      { id: "kitchen_area", label: "Large Cooking & Service Area", icon: "🍳" },
    ],
  },
];

/**
 * Map of category ID to category definition
 */
export const CATEGORY_MAP_BY_ID = PROPERTY_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat;
  return acc;
}, {});

/**
 * Resolves a category by ID or name
 *
 * @param {string} categoryIdOrName
 * @returns {Object|null}
 */
export function getCategoryById(categoryIdOrName) {
  if (!categoryIdOrName) return null;
  const key = String(categoryIdOrName).trim().toLowerCase();
  return (
    PROPERTY_CATEGORIES.find(
      (c) =>
        c.id.toLowerCase() === key ||
        c.name.toLowerCase() === key ||
        c.shortName.toLowerCase() === key
    ) || null
  );
}

/**
 * Handles toggling subcategory selections with the strict "All" mutual exclusivity rule:
 * - Selecting "All" clears all individual selections and selects only ["All"]
 * - Selecting any specific subcategory removes "All"
 * - If all individual subcategories are unselected, returns fallback (empty or ["All"])
 *
 * @param {Array<string>} currentSelections Current selected subcategories
 * @param {string} subcategory The subcategory to toggle
 * @param {boolean} [defaultToAllOnEmpty=true] Whether to revert to ["All"] when all are unchecked
 * @returns {Array<string>} New selected subcategories
 */
export function toggleSubcategorySelection(currentSelections = [], subcategory, defaultToAllOnEmpty = false) {
  const current = Array.isArray(currentSelections) ? [...currentSelections] : [];
  const target = String(subcategory || "").trim();

  if (!target) return current;

  if (target === "All") {
    // "All" is mutually exclusive with specific subcategories
    return ["All"];
  }

  // Deselect "All" if it was present
  const withoutAll = current.filter((item) => item !== "All");

  let next;
  if (withoutAll.includes(target)) {
    next = withoutAll.filter((item) => item !== target);
  } else {
    next = [...withoutAll, target];
  }

  if (next.length === 0 && defaultToAllOnEmpty) {
    return ["All"];
  }

  return next;
}

/**
 * Normalizes any legacy or database property record into the corresponding main category
 * and subcategories for 100% backward compatibility.
 *
 * @param {Object} property Property or building record
 * @returns {{ category: Object, subcategories: Array<string>, primaryType: string }}
 */
export function resolveMainCategoryFromProperty(property) {
  if (!property) {
    const defaultCat = PROPERTY_CATEGORIES[0];
    return {
      category: defaultCat,
      subcategories: ["PG"],
      primaryType: "PG",
    };
  }

  // 1. Direct match if category field is already saved
  if (property.category) {
    const directCat = getCategoryById(property.category);
    if (directCat) {
      const subs = Array.isArray(property.subcategories) && property.subcategories.length > 0
        ? property.subcategories
        : [property.type || directCat.subcategories[1]];
      return {
        category: directCat,
        subcategories: subs,
        primaryType: property.type || subs[0] || directCat.subcategories[1],
      };
    }
  }

  // 2. Check metadata or hotel_meta if stored there
  const meta = property.category_details || property.hotel_meta || {};
  if (meta.category) {
    const metaCat = getCategoryById(meta.category);
    if (metaCat) {
      const subs = Array.isArray(meta.subcategories) && meta.subcategories.length > 0
        ? meta.subcategories
        : [property.type || metaCat.subcategories[1]];
      return {
        category: metaCat,
        subcategories: subs,
        primaryType: property.type || subs[0],
      };
    }
  }

  // 3. Infer from property.type string
  const rawType = String(property.type || "").trim().toLowerCase();

  // Event Spaces
  if (
    rawType.includes("event") ||
    rawType.includes("banquet") ||
    rawType.includes("hall") ||
    rawType.includes("venue") ||
    rawType.includes("party") ||
    rawType.includes("meeting") ||
    rawType.includes("conference")
  ) {
    const cat = CATEGORY_MAP_BY_ID.event_spaces;
    const match = cat.subcategories.find(
      (s) => s.toLowerCase() === rawType || rawType.includes(s.toLowerCase())
    ) || "Banquet Hall";
    return {
      category: cat,
      subcategories: [match],
      primaryType: match,
    };
  }

  // Flats & Rentals
  if (
    rawType.includes("flat") ||
    rawType.includes("apartment") ||
    rawType.includes("independent") ||
    rawType.includes("studio") ||
    rawType.includes("bhk") ||
    property.flat_offer
  ) {
    const cat = CATEGORY_MAP_BY_ID.flats_rentals;
    const match = cat.subcategories.find(
      (s) => s.toLowerCase() === rawType || rawType.includes(s.toLowerCase())
    ) || "Flat";
    return {
      category: cat,
      subcategories: [match],
      primaryType: match,
    };
  }

  // Hotels & Stays
  if (
    rawType.includes("hotel") ||
    rawType.includes("resort") ||
    rawType.includes("guest house") ||
    rawType.includes("lodge") ||
    rawType.includes("homestay")
  ) {
    const cat = CATEGORY_MAP_BY_ID.hotels_stays;
    const match = cat.subcategories.find(
      (s) => s.toLowerCase() === rawType || rawType.includes(s.toLowerCase())
    ) || (rawType.includes("guest house") ? "Guest House" : "Hotel");
    return {
      category: cat,
      subcategories: [match],
      primaryType: match,
    };
  }

  // Default: PG & Hostels
  const pgCat = CATEGORY_MAP_BY_ID.pg_hostels;
  let match = "PG";
  if (rawType.includes("mess")) match = "Student Mess";
  else if (rawType.includes("boys hostel") || (rawType.includes("hostel") && rawType.includes("boy"))) match = "Boys Hostel";
  else if (rawType.includes("girls hostel") || (rawType.includes("hostel") && rawType.includes("girl"))) match = "Girls Hostel";
  else if (rawType.includes("boys") || rawType.includes("male")) match = "Only Boys PG";
  else if (rawType.includes("girls") || rawType.includes("female")) match = "Only Girls PG";
  else if (rawType.includes("co-living") || rawType.includes("coliving")) match = "Co-living PG";

  return {
    category: pgCat,
    subcategories: [match],
    primaryType: match,
  };
}

/**
 * Checks whether a property matches the given category and subcategories
 *
 * @param {Object} property
 * @param {string} categoryId "all" or specific category id
 * @param {Array<string>} selectedSubcategories Filter subcategories
 * @returns {boolean}
 */
export function matchesCategoryFilter(property, categoryId = "all", selectedSubcategories = []) {
  if (!property) return false;

  const { category, subcategories, primaryType } = resolveMainCategoryFromProperty(property);

  // Main category check
  if (categoryId !== "all" && category.id !== categoryId) {
    return false;
  }

  // Subcategory check
  if (
    !selectedSubcategories ||
    selectedSubcategories.length === 0 ||
    selectedSubcategories.includes("All")
  ) {
    return true;
  }

  // Check if any selected subcategory matches property's subcategories or primaryType or raw type
  const propTypes = [
    ...(Array.isArray(subcategories) ? subcategories : []),
    primaryType,
    property.type,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase().trim());

  return selectedSubcategories.some((wanted) =>
    propTypes.includes(String(wanted).toLowerCase().trim())
  );
}
