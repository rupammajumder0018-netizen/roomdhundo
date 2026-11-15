/**
 * Roomdhundo — Application Route Path Constants
 * Centralized registry of application paths and parameterized builders.
 */

export const PATHS = {
  // Public Routes
  HOME: "/",
  SEARCH: "/search",
  PROPERTY_DETAILS: "/property/:id",
  HOTEL_ROOM: "/hotel-room/:roomId",
  PAYMENT: "/payment",
  POLICIES: "/policies",

  // Authentication Routes
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  AUTH_CALLBACK: "/auth/callback",

  // Authenticated Renter Routes (Scheduled for later phases)
  SAVED: "/saved",
  DASHBOARD: "/dashboard",
  ENQUIRIES: "/enquiries",
  BE_AN_AGENT: "/be-an-agent",

  // Owner & Agent Routes (Scheduled for later phases)
  OWNER_DASHBOARD: "/owner/dashboard",
  LIST_PROPERTY: "/list-property",
  LIST_PG: "/list-property/pg",
  LIST_FLAT: "/list-property/flat",
  LIST_HOTEL: "/list-property/hotel",

  // Admin Routes (Phase 8)
  ADMIN: "/admin",
  ADMIN_PROPERTIES: "/admin/properties",
  ADMIN_PROFILES: "/admin/profiles",
  ADMIN_ENQUIRIES: "/admin/enquiries",
  ADMIN_HOTEL_BOOKINGS: "/admin/hotel-bookings",
  ADMIN_AGENTS: "/admin/agents",
  ADMIN_REVIEWS: "/admin/reviews",
  ADMIN_ECONOMY: "/admin/economy",
  ADMIN_SETTINGS: "/admin/settings",
};

export const ROUTE_PATHS = PATHS;

/**
 * Builds a property detail link.
 *
 * @param {string} id Property UUID
 * @param {string} [roomId] Optional room UUID
 * @returns {string}
 */
export function propertyPath(id, roomId) {
  if (!id) return PATHS.HOME;
  if (roomId) return `/property/${id}?room=${encodeURIComponent(roomId)}`;
  return `/property/${id}`;
}

/**
 * Builds a payment checkout link.
 *
 * @param {string} bookingId
 * @returns {string}
 */
export function paymentPath(bookingId) {
  if (!bookingId) return PATHS.PAYMENT;
  return `${PATHS.PAYMENT}?booking_id=${encodeURIComponent(bookingId)}`;
}

/**
 * Builds a search query link with parameters.
 *
 * @param {Object} [params]
 * @returns {string}
 */
export function searchPath(params = {}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.stay) sp.set("stay", params.stay);
  if (params.type) sp.set("type", params.type);
  if (params.min != null) sp.set("min", String(params.min));
  if (params.max != null) sp.set("max", String(params.max));
  if (params.sort) sp.set("sort", params.sort);
  if (params.hub) sp.set("hub", params.hub);
  const query = sp.toString();
  return query ? `${PATHS.SEARCH}?${query}` : PATHS.SEARCH;
}

