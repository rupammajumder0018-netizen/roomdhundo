/**
 * Roomdhundo — Hotel Booking & Payment Service
 *
 * Provides database operations for:
 * 1. Hotel bookings (`hotel_bookings`) — Request/approval flow with hourly/nightly pricing,
 *    board/meal add-ons, and owner/admin moderation.
 * 2. Room reservations & payments (`bookings`) — General booking workflow with rent +
 *    10% platform fee and Razorpay gateway integration contract.
 *
 * ARCHITECTURAL NOTICE:
 * As documented in Phase 1 Audit:
 * - `hotel_bookings` was provisioned directly in Supabase or via runtime migration.
 * - `bookings` is defined in `files6.0/schema.sql` (lines 1450-1512).
 *
 * Adheres strictly to verified column names found in:
 * - `files6.0/hotel-booking.js`
 * - `files6.0/hotel-bookings-user.js`
 * - `files6.0/hotel-bookings-owner.js`
 * - `files6.0/hotel-bookings-admin.js`
 * - `files6.0/payment.html`
 */

import { supabase } from "../supabase/client.js";

export const HOTEL_BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
};

export const BOOKING_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

export const BREAKFAST_DEFAULT_FEE = 300;
export const MEAL_NAMES = ["breakfast", "lunch", "dinner"];
export const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% platform fee on PG & Flat bookings

// ============================================================
// HELPER CALCULATIONS & QUOTES (from files6.0/hotel-booking.js)
// ============================================================

/**
 * Extracts hourly booking offer configuration from a room type.
 *
 * @param {Object} room
 * @returns {{ enabled: boolean, price: number, hours: number[] }}
 */
export function hourlyOffer(room) {
  const details =
    room?.room_details && typeof room.room_details === "object"
      ? room.room_details
      : {};
  const hourly =
    details.hourly && typeof details.hourly === "object" ? details.hourly : {};
  const price = Number(hourly.pricePerHour || room?.hourly_price || 0);
  const hours =
    Array.isArray(hourly.hours) && hourly.hours.length
      ? hourly.hours.map(Number).filter((n) => n > 0)
      : price > 0
      ? [3, 6, 12, 24]
      : [];
  return {
    enabled: hourly.enabled !== false && price > 0 && hours.length > 0,
    price,
    hours,
  };
}

/**
 * Checks if a hotel offers a particular meal.
 *
 * @param {Object} hotel
 * @param {'breakfast'|'lunch'|'dinner'} meal
 * @returns {boolean}
 */
export function hotelHasMeal(hotel, meal) {
  const target = String(meal).toLowerCase();
  const tags = (hotel?.facility_tags || []).map((tag) => String(tag).toLowerCase());
  const labels = (hotel?.facilities || []).map((label) => String(label).toLowerCase());
  return (
    tags.includes(`meal-${target}`) ||
    tags.includes(target) ||
    labels.includes(target) ||
    labels.some((l) => l.includes(target))
  );
}

/**
 * Resolves the unit price for a given meal at a hotel.
 *
 * @param {Object} hotel
 * @param {'breakfast'|'lunch'|'dinner'} meal
 * @returns {number}
 */
export function hotelMealPrice(hotel, meal) {
  const meta =
    hotel?.hotel_meta && typeof hotel.hotel_meta === "object"
      ? hotel.hotel_meta
      : {};
  const amount = Number(meta?.meal_prices?.[meal]);
  if (Number.isFinite(amount) && amount >= 0) return amount;
  return meal === "breakfast" && hotelHasMeal(hotel, "breakfast") ? BREAKFAST_DEFAULT_FEE : 0;
}

/**
 * Resolves room tax configuration mode and rate.
 *
 * @param {Object} room
 * @returns {{ mode: 'inclusive'|'exclusive', rate: number, label: string }}
 */
export function roomTaxInfo(room) {
  const tax = String(room?.room_details?.tax || "inclusive").toLowerCase();
  if (tax === "gst-12") return { mode: "exclusive", rate: 0.12, label: "GST 12%" };
  if (tax === "gst-18" || tax === "exclusive") return { mode: "exclusive", rate: 0.18, label: "GST 18%" };
  return { mode: "inclusive", rate: 0.18, label: "GST 18%" };
}

/**
 * Calculates itemized stay quote matching legacy `quoteStay` logic.
 *
 * @param {Object} params
 * @param {boolean} params.hourly
 * @param {number} params.units Number of nights or hours
 * @param {number} params.rate Base room rate per night or hour
 * @param {string[]} [params.selectedMeals] List of selected meal names
 * @param {Object} [params.hotel] Hotel entity for meal price lookups
 * @param {Object} [params.room] Room entity for tax lookups
 * @returns {Object}
 */
export function calculateStayQuote({
  hourly = false,
  units = 1,
  rate = 0,
  selectedMeals = [],
  hotel = null,
  room = null,
}) {
  const validUnits = Math.max(1, Number(units) || 1);
  const validRate = Math.max(0, Number(rate) || 0);
  const roomSubtotal = validRate * validUnits;

  // In legacy implementation, meal fees are charged once per hour session or per night
  const mealUnits = hourly ? 1 : validUnits;
  const mealLines = (selectedMeals || []).map((meal) => {
    const fee = hotelMealPrice(hotel, meal);
    return { meal, fee, units: mealUnits, total: fee * mealUnits };
  }).filter((line) => line.fee > 0);

  const mealsTotal = mealLines.reduce((sum, line) => sum + line.total, 0);
  const breakfastLine = mealLines.find((line) => line.meal === "breakfast");
  const taxInfo = roomTaxInfo(room);

  let taxable = 0;
  if (taxInfo.mode === "exclusive") {
    taxable = roomSubtotal + mealsTotal;
  } else {
    // If room is GST inclusive, tax applies to extra meals added
    taxable = mealsTotal;
  }

  const taxAmount = Math.round(taxable * taxInfo.rate);
  const total = roomSubtotal + mealsTotal + taxAmount;

  return {
    hourly,
    units: validUnits,
    rate: validRate,
    roomSubtotal,
    breakfast: breakfastLine ? breakfastLine.total : 0,
    breakfastUnits: breakfastLine ? breakfastLine.units : 0,
    mealLines,
    mealsTotal,
    taxAmount,
    taxLabel: taxInfo.label,
    taxMode: taxInfo.mode,
    total,
  };
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validates parameters for creating a hotel booking request.
 *
 * @param {Object} input
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateHotelBookingInput(input) {
  const errors = [];
  if (!input) {
    return { valid: false, errors: ["Booking details are required."] };
  }

  if (!input.buildingId) errors.push("Hotel / building ID is required.");
  if (!input.roomTypeId) errors.push("Room category is required.");
  if (!input.userId) errors.push("User must be logged in to book.");
  if (!input.ownerId) errors.push("Owner ID is required.");

  const name = String(input.guestName || "").trim();
  if (!name || name.length < 2) {
    errors.push("Full guest name is required (minimum 2 characters).");
  }

  const phone = String(input.guestPhone || "").replace(/[^0-9+]/g, "");
  if (!phone || phone.length < 10 || phone.length > 15) {
    errors.push("A valid 10 to 15 digit contact phone number is required.");
  }

  const guests = Number(input.guestCount);
  if (!Number.isInteger(guests) || guests < 1) {
    errors.push("Guest count must be at least 1.");
  }

  if (!["hourly", "nightly"].includes(input.bookingMode)) {
    errors.push("Booking mode must be either 'hourly' or 'nightly'.");
  }

  const checkIn = new Date(input.checkIn);
  const checkOut = new Date(input.checkOut);

  if (Number.isNaN(checkIn.getTime())) {
    errors.push("Valid check-in date/time is required.");
  }
  if (Number.isNaN(checkOut.getTime())) {
    errors.push("Valid check-out date/time is required.");
  }

  if (checkIn && checkOut && checkOut <= checkIn) {
    errors.push("Check-out time must be after check-in time.");
  }

  const pricePerUnit = Number(input.pricePerUnit);
  if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
    errors.push("Room rate per unit must be greater than zero.");
  }

  const totalPrice = Number(input.totalPrice);
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    errors.push("Total price must be greater than zero.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates parameters for creating a room reservation booking in `public.bookings`.
 *
 * @param {Object} input
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBookingInput(input) {
  const errors = [];
  if (!input) {
    return { valid: false, errors: ["Booking payload is required."] };
  }

  if (!input.userId) errors.push("User ID is required.");
  if (!input.buildingId) errors.push("Building / property ID is required.");
  if (!input.buildingName?.trim()) errors.push("Building name is required.");

  const rent = Number(input.monthlyRent);
  if (!Number.isFinite(rent) || rent <= 0) {
    errors.push("Monthly rent must be greater than zero.");
  }

  const fee = Number(input.platformFee);
  if (!Number.isFinite(fee) || fee < 0) {
    errors.push("Platform fee must be a non-negative number.");
  }

  const total = Number(input.totalAmount);
  if (!Number.isFinite(total) || total <= 0) {
    errors.push("Total amount must be greater than zero.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// HOTEL BOOKINGS DATABASE OPERATIONS (`hotel_bookings`)
// ============================================================

/**
 * Creates a hotel booking request in `hotel_bookings`.
 *
 * @param {Object} booking
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createHotelBooking(booking) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const validation = validateHotelBookingInput(booking);
  if (!validation.valid) {
    return {
      data: null,
      error: new Error(validation.errors.join(" ")),
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

  if (!bookingId) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Booking ID is required."),
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

/**
 * Fetches all hotel bookings for the admin management console,
 * including owner profile enrichment matching legacy `files6.0/hotel-bookings-admin.js`.
 *
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchAllHotelBookings() {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  let { data, error } = await supabase
    .from("hotel_bookings")
    .select("*, buildings(name,owner_name,owner_phone), room_types(room_type,daily_price,hourly_price)")
    .order("created_at", { ascending: false });

  if (error) {
    // Graceful fallback for schemas where daily/hourly price might differ on room_types
    const fallback = await supabase
      .from("hotel_bookings")
      .select("*, buildings(name,owner_name,owner_phone), room_types(room_type)")
      .order("created_at", { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return { data: null, error };
  }

  // Enrich with owner profiles if owner_id exists
  const ownerIds = [...new Set(data.map((row) => row.owner_id).filter(Boolean))];
  if (ownerIds.length > 0) {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ownerIds);
      if (profiles && profiles.length > 0) {
        const profileMap = Object.fromEntries(
          profiles.map((p) => [p.id, p])
        );
        data.forEach((row) => {
          row._owner = profileMap[row.owner_id] || null;
        });
      }
    } catch (e) {
      console.warn("[Roomdhundo] Could not enrich owner profiles:", e);
    }
  }

  return { data, error: null };
}

/**
 * Checks for overlapping confirmed stays for a specific room type category.
 * Prevents overbooking rooms in the same window.
 *
 * @param {Object} params
 * @param {string} params.roomTypeId
 * @param {string|Date} params.checkIn
 * @param {string|Date} params.checkOut
 * @param {string} [params.excludeBookingId]
 * @returns {Promise<{ overlaps: Array<Object>, error: Error|null }>}
 */
export async function checkOverlappingConfirmedBookings({
  roomTypeId,
  checkIn,
  checkOut,
  excludeBookingId,
}) {
  if (!supabase) {
    return { overlaps: [], error: new Error("[Roomdhundo] Supabase client is not configured.") };
  }

  if (!roomTypeId) {
    return { overlaps: [], error: null };
  }

  let query = supabase
    .from("hotel_bookings")
    .select("id, check_in, check_out, status, guest_name")
    .eq("room_type_id", roomTypeId)
    .eq("status", HOTEL_BOOKING_STATUS.CONFIRMED);

  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { data, error } = await query;
  if (error || !data) return { overlaps: [], error };

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  const overlaps = data.filter((item) => {
    const itemStart = new Date(item.check_in);
    const itemEnd = new Date(item.check_out);
    return (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      !Number.isNaN(itemStart.getTime()) &&
      !Number.isNaN(itemEnd.getTime()) &&
      start < itemEnd &&
      itemStart < end
    );
  });

  return { overlaps, error: null };
}

/**
 * Computes administrative summary statistics across all hotel bookings.
 *
 * @param {Array<Object>} bookings
 * @returns {Object}
 */
export function calculateHotelBookingStats(bookings = []) {
  const rows = Array.isArray(bookings) ? bookings : [];
  const today = new Date();

  const isSameDay = (dateStr) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const total = rows.length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const confirmed = rows.filter((r) => r.status === "confirmed").length;
  const closed = rows.filter((r) => ["rejected", "cancelled"].includes(r.status)).length;
  const checkinsToday = rows.filter((r) => isSameDay(r.check_in)).length;
  const revenue = rows
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + Number(r.total_price || 0), 0);

  return {
    total,
    pending,
    confirmed,
    closed,
    checkinsToday,
    revenue,
  };
}

/**
 * Administrative update with audit logging and full detail modification.
 *
 * @param {Object} params
 * @param {string} params.bookingId
 * @param {Object} params.patch
 * @param {string} [params.updatedBy]
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function adminUpdateHotelBooking({ bookingId, patch = {}, updatedBy }) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  if (!bookingId) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Booking ID is required."),
    };
  }

  const updatePayload = {
    ...patch,
    ...(updatedBy ? { updated_by: updatedBy } : {}),
  };

  const { data, error } = await supabase
    .from("hotel_bookings")
    .update(updatePayload)
    .eq("id", bookingId)
    .select()
    .single();

  return { data, error };
}

// ============================================================
// ROOM RESERVATIONS & PAYMENTS DATABASE OPERATIONS (`bookings`)
// Matches files6.0/payment.html & files6.0/schema.sql (lines 1450-1512)
// ============================================================

/**
 * Fetches a room reservation booking record by ID and user ownership.
 *
 * @param {string} bookingId
 * @param {string} userId
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function fetchBookingById(bookingId, userId) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  if (!bookingId) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Booking ID is required."),
    };
  }

  let query = supabase
    .from("bookings")
    .select(`
      *,
      buildings (
        name,
        location,
        type
      ),
      room_types (
        room_type,
        room_people
      )
    `)
    .eq("id", bookingId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.single();
  return { data, error };
}

/**
 * Creates a room reservation booking record in `public.bookings`.
 *
 * @param {Object} booking
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createBooking(booking) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const validation = validateBookingInput(booking);
  if (!validation.valid) {
    return {
      data: null,
      error: new Error(validation.errors.join(" ")),
    };
  }

  const payload = {
    user_id: booking.userId,
    building_id: booking.buildingId,
    room_type_id: booking.roomTypeId || null,
    building_name: booking.buildingName.trim(),
    room_type_label: booking.roomTypeLabel?.trim() || null,
    monthly_rent: Number(booking.monthlyRent),
    platform_fee: Number(booking.platformFee),
    total_amount: Number(booking.totalAmount),
    status: BOOKING_STATUS.PENDING,
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert(payload)
    .select()
    .single();

  return { data, error };
}

/**
 * Payment Initiation Contract (Razorpay Sandbox / Test Mode).
 * Prepares transaction parameters securely without exposing live keys.
 *
 * @param {Object} params
 * @param {string} params.bookingId
 * @param {number} params.amount Total in INR
 * @param {string} [params.customerName]
 * @param {string} [params.customerEmail]
 * @param {string} [params.customerPhone]
 * @returns {{ orderId: string, currency: string, keyId: string|null, isSandbox: boolean }}
 */
export function preparePaymentParameters({
  bookingId,
  amount,
  customerName = "",
  customerEmail = "",
  customerPhone = "",
}) {
  const env =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env
      : typeof process !== "undefined" && process.env
      ? process.env
      : {};
  const keyId = env.VITE_RAZORPAY_KEY_ID || null;
  const isSandbox = !keyId || keyId.startsWith("rzp_test_");

  return {
    bookingId,
    amount: Math.round(Number(amount) * 100), // amount in paise
    currency: "INR",
    keyId,
    isSandbox,
    customer: {
      name: customerName,
      email: customerEmail,
      contact: customerPhone,
    },
    notes: {
      booking_id: bookingId,
      platform: "Roomdhundo",
    },
  };
}

/**
 * Payment verification specification.
 *
 * CRITICAL PAYMENT SECURITY:
 * Never trust browser callbacks or client-side responses as proof of payment.
 * As documented in `files6.0/schema.sql`:
 * "Starts as 'pending'; only flipped to 'paid' by the verify-razorpay-payment
 * Edge Function (using the service role key, which bypasses RLS) — never trust
 * the browser alone to mark a booking as paid."
 *
 * This function handles calling the backend verification endpoint if available,
 * and reports the requirement when not configured.
 *
 * @param {Object} paymentResult
 * @param {string} paymentResult.bookingId
 * @param {string} paymentResult.razorpayOrderId
 * @param {string} paymentResult.razorpayPaymentId
 * @param {string} paymentResult.razorpaySignature
 * @returns {Promise<{ verified: boolean, message: string, error?: Error }>}
 */
export async function verifyPaymentWithServer({
  bookingId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  if (!supabase) {
    return {
      verified: false,
      message: "Database and Edge Functions are not configured yet.",
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  try {
    // Attempt invoking the official Supabase Edge Function: verify-razorpay-payment
    const { data, error } = await supabase.functions.invoke("verify-razorpay-payment", {
      body: {
        booking_id: bookingId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      },
    });

    if (error) {
      return {
        verified: false,
        message:
          "Server verification failed or Edge Function 'verify-razorpay-payment' is not yet deployed.",
        error,
      };
    }

    return {
      verified: data?.status === "paid",
      message: data?.message || "Payment verified successfully by server.",
    };
  } catch (err) {
    return {
      verified: false,
      message: "Server verification encountered an error.",
      error: err,
    };
  }
}
