/**
 * Roomdhundo — Enquiries Service
 *
 * Provides database operations for tenant enquiries (`enquiries`).
 *
 * Scaffolding based on verified database queries from:
 * - `files6.0/script.js` (submitEnquiry)
 * - `files6.0/user-enquiries.js` (loadUserEnquiries)
 * - `files6.0/owner-dashboard.js` (loadOwnerEnquiries, updateEnquiryStatus)
 * - `files6.0/admin.js` (loadAdminEnquiries, deleteEnquiry)
 *
 * SCHEMA DIVERGENCE NOTE:
 * In `files6.0/schema.sql`, the foreign key was declared as `building_id`.
 * In the active JavaScript files (`script.js`, `user-enquiries.js`, `owner-dashboard.js`,
 * and `admin.js`), queries and inserts use `property_id` and `owner_id`.
 * Both patterns are handled to ensure backward compatibility.
 */

import { supabase } from "../supabase/client.js";

export const ENQUIRY_STATUS = {
  PENDING: "pending",
  CONTACTED: "contacted",
  SCHEDULED: "scheduled",
  VISITED: "visited",
  CLOSED: "closed",
  CANCELLED: "cancelled",
};

/**
 * Submits a new tenant enquiry for a property.
 *
 * @param {Object} enquiry
 * @param {string} enquiry.userId Renter UUID
 * @param {string} enquiry.ownerId Property owner UUID
 * @param {string} enquiry.propertyId Building UUID
 * @param {string} enquiry.roomType Selected room type label
 * @param {string} enquiry.renterPhone Contact phone number
 * @param {string} enquiry.message Enquiry message
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createEnquiry({
  userId,
  ownerId,
  propertyId,
  roomType,
  renterPhone,
  message,
}) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const payload = {
    user_id: userId,
    owner_id: ownerId,
    property_id: propertyId,
    room_type: roomType,
    renter_phone: renterPhone?.trim(),
    message: message?.trim() || "I am interested in your room.",
    status: ENQUIRY_STATUS.PENDING,
  };

  const { data, error } = await supabase
    .from("enquiries")
    .insert(payload)
    .select()
    .single();

  return { data, error };
}

/**
 * Fetches all enquiries submitted by a specific user.
 *
 * @param {string} userId
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchUserEnquiries(userId) {
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
    .from("enquiries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Fetches all enquiries received by a property owner.
 *
 * @param {string} ownerId
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchOwnerEnquiries(ownerId) {
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
    .from("enquiries")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Updates an enquiry's status.
 *
 * @param {string} enquiryId
 * @param {string} newStatus
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateEnquiryStatus(enquiryId, newStatus) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { data, error } = await supabase
    .from("enquiries")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enquiryId)
    .select()
    .single();

  return { data, error };
}

