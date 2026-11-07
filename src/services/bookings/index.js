/**
 * Roomdhundo — Hotel Booking Service
 *
 * Provides database operations for hotel bookings (`hotel_bookings`).
 *
 * ARCHITECTURAL NOTICE:
 * As documented in Phase 1 Audit, the `hotel_bookings` table is NOT defined
 * in repository SQL schema files (`files6.0/schema.sql` or `files6.0/SQL/*`).
 * It was provisioned directly in Supabase or via runtime migration.
 *
 * All functions below adhere strictly to verified column names found in:
 * - `files6.0/hotel-booking.js` (insert payload)
 * - `files6.0/hotel-bookings-user.js` (user query & display)
 * - `files6.0/hotel-bookings-owner.js` (owner query & status updates)
 * - `files6.0/hotel-bookings-admin.js` (admin query & conflict detection)
 */

import { supabase } from "../supabase/client.js";

export const HOTEL_BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
};

/**
 * Creates a hotel booking request.
 *
 * @param {Object} booking
 * @param {string} booking.buildingId Property UUID
 * @param {string} booking.roomTypeId Room type UUID
 * @param {string} booking.userId Guest user UUID
 * @param {string} booking.ownerId Property owner UUID
 * @param {string} booking.guestName Guest display name
 * @param {string} booking.guestPhone Guest mobile number
 * @param {number} booking.guestCount Number of guests
 * @param {'hourly'|'nightly'} booking.bookingMode Stay duration mode
 * @param {string} booking.checkIn ISO timestamp
 * @param {string} booking.checkOut ISO timestamp
 * @param {number|null} [booking.hoursCount] Number of hours (for hourly stay)
 * @param {number|null} [booking.nightsCount] Number of nights (for nightly stay)
 * @param {number} booking.pricePerUnit Rate per night or per hour
 * @param {number} booking.totalPrice Total calculated price
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createHotelBooking(booking) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const payload = {
    building_id: booking.buildingId,
    room_type_id: booking.roomTypeId,
    user_id: booking.userId,
    owner_id: booking.ownerId,
    guest_name: booking.guestName?.trim(),
    guest_phone: booking.guestPhone?.trim(),
    guest_count: Number(booking.guestCount || 1),
    booking_mode: booking.bookingMode,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
    hours_count: booking.bookingMode === "hourly" ? Number(booking.hoursCount) : null,
    nights_count: booking.bookingMode === "nightly" ? Number(booking.nightsCount) : null,
    price_per_unit: Number(booking.pricePerUnit),
    total_price: Number(booking.totalPrice),
    status: HOTEL_BOOKING_STATUS.PENDING,
  };

  const { data, error } = await supabase
    .from("hotel_bookings")
    .insert(payload)
    .select()
    .single();

  return { data, error };
}

/**
 * Fetches hotel bookings requested by a specific user.
 *
 * @param {string} userId
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchUserHotelBookings(userId) {
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
    .from("hotel_bookings")
    .select("*, buildings(name), room_types(room_type)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Fetches hotel booking requests for properties owned by a specific owner.
 *
 * @param {string} ownerId
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchOwnerHotelBookings(ownerId) {
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
    .from("hotel_bookings")
    .select("*, buildings(name), room_types(room_type)")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Updates a booking's status (approval, rejection, or cancellation).
 *
 * @param {Object} params
 * @param {string} params.bookingId Booking UUID
 * @param {string} params.status Target status
 * @param {string} [params.ownerNote] Optional note from owner
 * @param {string} [params.adminNote] Optional note from admin
 * @param {string} [params.updatedBy] User UUID who initiated the update
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateHotelBookingStatus({
  bookingId,
  status,
  ownerNote,
  adminNote,
  updatedBy,
}) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const patch = {
    status,
    ...(ownerNote !== undefined ? { owner_note: ownerNote } : {}),
    ...(adminNote !== undefined ? { admin_note: adminNote } : {}),
    ...(updatedBy ? { updated_by: updatedBy } : {}),
  };

  const { data, error } = await supabase
    .from("hotel_bookings")
    .update(patch)
    .eq("id", bookingId)
    .select()
    .single();

  return { data, error };
}

