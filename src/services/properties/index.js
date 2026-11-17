/**
 * Roomdhundo — Property & Listing Service
 *
 * Provides database access for properties (`buildings`), rooms (`room_types`),
 * saved properties (`saved_buildings`), and reviews (`reviews`).
 *
 * Scaffolding based on verified database queries from:
 * - `files6.0/script.js` (initHomePage, initSearchPage, initPropertyPage, initSavedPage)
 * - `files6.0/owner-dashboard.js` (loadOwnerProperties)
 * - `files6.0/admin.js` (loadProperties)
 */

import { supabase } from "../supabase/client.js";

/**
 * Standard served location hubs around MAKAUT, Jaguli, and Haringhata.
 */
export const ROOMDHUNDO_HUBS = [
  {
    name: "MAKAUT",
    latitude: 22.95704,
    longitude: 88.54346,
    aliases: ["makaut", "wbut", "wbutech", "simhat", "makaut campus"],
  },
  {
    name: "Jaguli",
    latitude: 22.9328,
    longitude: 88.5383,
    aliases: ["jaguli", "jagulia", "jaguli more"],
  },
  {
    name: "Haringhata",
    latitude: 22.96,
    longitude: 88.567,
    aliases: ["haringhata", "haringhata bazar", "haringhata town"],
  },
];

/**
 * Calculates straight-line distance in kilometers using the Haversine formula.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);

  if (!Number.isFinite(p1) || !Number.isFinite(l1) || !Number.isFinite(p2) || !Number.isFinite(l2)) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = ((p2 - p1) * Math.PI) / 180;
  const dLon = ((l2 - l1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1 * Math.PI) / 180) *
      Math.cos((p2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Checks whether a room type is available for booking.
 */
export function isRoomAvailable(rt) {
  if (!rt) return false;
  const status = String(rt.availability || "").trim().toLowerCase();
  if (status === "occupied" || status === "unavailable") return false;
  return Number(rt.available_rooms) > 0;
}

/**
 * Extracts monthly price list from room details.
 */
export function roomMonthlyPriceList(rt) {
  if (!rt) return [];
  const details = rt.room_details && typeof rt.room_details === "object" ? rt.room_details : {};
  const raw = Array.isArray(details.occupancy_options) ? details.occupancy_options : [];
  const fromOptions = raw
    .map((opt) => Number(opt.rent))
    .filter((rent) => Number.isFinite(rent) && rent > 0);

  if (fromOptions.length > 0) return fromOptions;
  const directPrice = Number(rt.price_value);
  return Number.isFinite(directPrice) ? [directPrice] : [];
}

/**
 * Decorates a raw building record with computed fields matching legacy script.js.
 *
 * @param {Object} b Raw building row
 * @returns {Object} Building with computed fields
 */
export function attachComputedFields(b) {
  if (!b) return null;
  const reviews = Array.isArray(b.reviews) ? b.reviews : [];
  const roomTypes = Array.isArray(b.room_types) ? b.room_types : [];

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : null;

  const monthlyPrices = roomTypes.flatMap((rt) => roomMonthlyPriceList(rt));
  const dailyPrices = roomTypes
    .map((rt) => (rt.daily_price != null ? Number(rt.daily_price) : null))
    .filter((p) => p != null && !Number.isNaN(p));

  const totalAvailable = roomTypes.reduce(
    (sum, rt) => sum + (isRoomAvailable(rt) ? Number(rt.available_rooms || 0) : 0),
    0
  );

  const roomTypeNames = [...new Set(roomTypes.map((rt) => rt.room_type).filter(Boolean))];

  const tags = Array.isArray(b.facility_tags) ? b.facility_tags : [];
  const facilities = Array.isArray(b.facilities) ? b.facilities : [];
  const isCoupleFriendly =
    tags.some((t) => /couple[- ]?friendly/i.test(String(t))) ||
    facilities.some((f) => /couple[- ]?friendly/i.test(String(f)));

  return {
    ...b,
    avgRating,
    reviewCount: reviews.length,
    minPrice: monthlyPrices.length ? Math.min(...monthlyPrices) : null,
    maxPrice: monthlyPrices.length ? Math.max(...monthlyPrices) : null,
    minDailyPrice: dailyPrices.length ? Math.min(...dailyPrices) : null,
    totalAvailable,
    roomTypeNames,
    isCoupleFriendly,
  };
}

export const FACILITY_TAG_LABELS = {
  wifi: "Wi-Fi",
  food: "Food",
  ac: "AC",
  laundry: "Laundry",
  parking: "🚗 Parking",
  bathroom: "🚿 Attached Bathroom",
  kitchen: "🍳 Attached Kitchen",
  "couple-friendly": "💑 Couple Friendly",
  furnished: "🛋️ Furnished",
  "semi-furnished": "🪑 Semi Furnished",
  unfurnished: "🏠 Unfurnished",
  "room-only": "Room only",
  breakfast: "Breakfast",
  "meal-breakfast": "Breakfast",
  "meal-lunch": "Lunch",
  "meal-dinner": "Dinner",
};

export function isCoupleFriendlyFacility(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .includes("couple");
}

export function isPubliclyListedBuilding(building) {
  if (!building) return false;
  // If the listing has explicit status or verification_status, check them
  const listing = String(building.listing_status || "published").trim().toLowerCase();
  const status = String(building.status || "approved").trim().toLowerCase();
  const verification = String(building.verification_status || "approved").trim().toLowerCase();

  // If status is rejected or archived, exclude it
  if (status === "rejected" || verification === "rejected" || listing === "rejected" || listing === "archived") {
    return false;
  }

  // All listings currently created or approved on the platform should display
  return true;
}

export function getBuildingFacilityLabels(building) {
  const labels = [];
  const seen = new Set();

  function add(raw) {
    const text = String(raw || "").trim();
    if (!text) return;
    const key = text
      .toLowerCase()
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "");
    if (seen.has(key)) return;
    seen.add(key);
    labels.push(text);
  }

  (Array.isArray(building?.facilities) ? building.facilities : []).forEach(add);
  (Array.isArray(building?.facility_tags) ? building.facility_tags : []).forEach((tag) => {
    const normalized = String(tag || "").trim().toLowerCase();
    add(FACILITY_TAG_LABELS[normalized] || tag);
  });
  return labels;
}

export function facilityPreviewBadges(building, limit = 3) {
  const all = getBuildingFacilityLabels(building);
  const couple = all.find(isCoupleFriendlyFacility);
  const others = all.filter((item) => item !== couple);
  const shown = couple
    ? [couple, ...others.slice(0, Math.max(0, limit - 1))]
    : others.slice(0, limit);
  return shown;
}

/**
 * Fetches approved agents to display on the homepage agent section.
 *
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchApprovedAgents() {
  if (!supabase) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("agent_applications")
    .select("user_id, first_name, last_name, location, phone")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

/**
 * Fetches published properties with associated room types and reviews.
 *
 * @param {Object} [options]
 * @param {string} [options.type] Filter by property type (PG, Flat, Hotel, etc.)
 * @param {number} [options.limit] Limit result count
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchPublishedProperties(options = {}) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  let query = supabase
    .from("buildings")
    .select("*, room_types(*), reviews(*)")
    .order("created_at", { ascending: false });

  if (options.type) {
    query = query.eq("type", options.type);
  }

  if (typeof options.limit === "number") {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  const filtered = Array.isArray(data) ? data.filter(isPubliclyListedBuilding) : data;
  const decorated = Array.isArray(filtered) ? filtered.map(attachComputedFields) : filtered;
  return { data: decorated, error };
}

/**
 * Fetches a single property by ID with nested room types and reviews.
 *
 * @param {string} buildingId
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function fetchPropertyById(buildingId) {
  if (!buildingId) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Property ID is required."),
    };
  }

  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { data, error } = await supabase
    .from("buildings")
    .select("*, room_types(*), reviews(*)")
    .eq("id", buildingId)
    .maybeSingle();

  return { data: data ? attachComputedFields(data) : null, error };
}

/**
 * Fetches all properties owned by a specific user.
 *
 * @param {string} ownerId User ID of the property owner
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchOwnerProperties(ownerId) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  if (!ownerId) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Owner ID is required."),
    };
  }

  const { data, error } = await supabase
    .from("buildings")
    .select("*, room_types(*), reviews(*)")
    .eq("created_by", ownerId)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Fetches saved properties for a renter.
 *
 * @param {string} userId
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchSavedProperties(userId) {
  if (!userId) {
    return {
      data: null,
      error: new Error("[Roomdhundo] User ID is required."),
    };
  }

  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { data, error } = await supabase
    .from("saved_buildings")
    .select("building_id, buildings(*, room_types(*), reviews(*))")
    .eq("user_id", userId);

  return { data, error };
}

/**
 * Fetches the count of saved properties for a renter.
 *
 * @param {string} userId
 * @returns {Promise<{ count: number, error: Error|null }>}
 */
export async function fetchSavedPropertiesCount(userId) {
  if (!userId) {
    return {
      count: 0,
      error: new Error("[Roomdhundo] User ID is required."),
    };
  }

  if (!supabase) {
    return {
      count: 0,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { count, error } = await supabase
    .from("saved_buildings")
    .select("building_id", { count: "exact", head: true })
    .eq("user_id", userId);

  return { count: Number.isFinite(count) ? count : 0, error };
}

/**
 * Toggles the saved status of a building for a user.
 *
 * @param {string} userId
 * @param {string} buildingId
 * @param {boolean} isCurrentlySaved
 * @returns {Promise<{ saved: boolean, error: Error|null }>}
 */
export async function toggleSavedProperty(userId, buildingId, isCurrentlySaved) {
  if (!supabase) {
    return {
      saved: isCurrentlySaved,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  if (isCurrentlySaved) {
    const { error } = await supabase
      .from("saved_buildings")
      .delete()
      .eq("user_id", userId)
      .eq("building_id", buildingId);

    return { saved: !error ? false : true, error };
  } else {
    const { error } = await supabase
      .from("saved_buildings")
      .insert({ user_id: userId, building_id: buildingId });

    return { saved: !error ? true : false, error };
  }
}

/**
 * Creates a review for a property.
 *
 * @param {Object} reviewData
 * @param {string} reviewData.buildingId
 * @param {string} reviewData.userId
 * @param {string} reviewData.reviewerName
 * @param {number} reviewData.rating
 * @param {string} reviewData.comment
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createPropertyReview({
  buildingId,
  userId,
  reviewerName,
  rating,
  comment,
}) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      building_id: buildingId,
      user_id: userId,
      reviewer_name: reviewerName,
      rating: Number(rating),
      comment: comment?.trim() || null,
      status: "published",
    })
    .select()
    .single();

  return { data, error };
}

