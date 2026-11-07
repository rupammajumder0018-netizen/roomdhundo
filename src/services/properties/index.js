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
    .eq("listing_status", "published")
    .order("created_at", { ascending: false });

  if (options.type) {
    query = query.eq("type", options.type);
  }

  if (typeof options.limit === "number") {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  return { data, error };
}

/**
 * Fetches a single property by ID with nested room types and reviews.
 *
 * @param {string} buildingId
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function fetchPropertyById(buildingId) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  if (!buildingId) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Property ID is required."),
    };
  }

  const { data, error } = await supabase
    .from("buildings")
    .select("*, room_types(*), reviews(*)")
    .eq("id", buildingId)
    .maybeSingle();

  return { data, error };
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
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  if (!userId) {
    return {
      data: null,
      error: new Error("[Roomdhundo] User ID is required."),
    };
  }

  const { data, error } = await supabase
    .from("saved_buildings")
    .select("building_id, buildings(*, room_types(*), reviews(*))")
    .eq("user_id", userId);

  return { data, error };
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

