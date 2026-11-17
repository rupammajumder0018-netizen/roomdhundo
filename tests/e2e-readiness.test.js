/**
 * Roomdhundo — Phase 11 End-to-End Readiness & Audit Verification
 *
 * Validates core application flows, contracts, and documents blocked live-environment checks.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { isSupabaseConfigured } from "../src/services/supabase/client.js";
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  accountKindFromRole,
  isListingOwnerRole,
} from "../src/services/auth/index.js";
import {
  calculateDistanceKm,
  isRoomAvailable,
  roomMonthlyPriceList,
  attachComputedFields,
} from "../src/services/properties/index.js";
import { savePropertyListing } from "../src/services/owner/index.js";
import {
  calculateStayQuote,
  hotelMealPrice,
  hourlyOffer,
  preparePaymentParameters,
  BOOKING_STATUS,
} from "../src/services/bookings/index.js";
import {
  validateAgentApplicationInput,
  propertyDisplayStatus,
} from "../src/services/admin/adminService.js";
import {
  validateMediaFile,
  generateStoragePath,
  sanitizeStorageFileName,
} from "../src/services/storage/index.js";
import { PATHS } from "../src/routes/paths.js";

// 1. AUTHENTICATION & OAUTH AUDIT
test("E2E Readiness — Auth input validation and error contracts", async () => {
  const emptyLogin = await signInWithEmail({ email: "", password: "" });
  assert.ok(!emptyLogin.user);
  assert.ok(emptyLogin.error);

  const emptySignup = await signUpWithEmail({ email: "", password: "", role: "user" });
  assert.ok(!emptySignup.user);
  assert.ok(emptySignup.error);

  assert.equal(accountKindFromRole("owner"), "owner");
  assert.equal(accountKindFromRole("agent"), "agent");
  assert.equal(accountKindFromRole("admin"), "admin");
  assert.equal(accountKindFromRole("unknown"), "user");

  assert.equal(isListingOwnerRole("owner"), true);
  assert.equal(isListingOwnerRole("admin"), true);
  assert.equal(isListingOwnerRole("user"), false);
});

test("E2E Readiness — Google OAuth & live Auth are BLOCKED without Supabase credentials", async () => {
  assert.equal(isSupabaseConfigured, false);
  const res = await signOut();
  assert.ok(res.error instanceof Error);
});

// 2. PUBLIC BROWSING & PROPERTY CALCULATION
test("E2E Readiness — Public browsing calculation and distance models", () => {
  const d = calculateDistanceKm(22.5726, 88.3639, 22.585, 88.38);
  assert.ok(d > 0 && d < 10);

  // Room availability checking
  assert.equal(isRoomAvailable({ available_rooms: 2 }), true);
  assert.equal(isRoomAvailable({ available_rooms: 0 }), false);
  assert.equal(isRoomAvailable({ availability: "occupied", available_rooms: 2 }), false);

  const prices = roomMonthlyPriceList({ price_value: 6000 });
  assert.deepEqual(prices, [6000]);

  const computed = attachComputedFields({
    room_types: [{ price_value: 5000, available_rooms: 2 }, { price_value: 9000, available_rooms: 1 }],
    reviews: [{ rating: 4 }, { rating: 5 }],
  });
  assert.equal(computed.avgRating, "4.5");
  assert.equal(computed.totalAvailable, 3);
});

// 3. OWNER WORKFLOWS & LISTING VALIDATION
test("E2E Readiness — Property listing validation protects data integrity", async () => {
  const missingOwner = await savePropertyListing({ ownerId: "" });
  assert.equal(missingOwner.success, false);
  assert.ok(missingOwner.error.message.includes("Owner ID is required"));

  const missingCore = await savePropertyListing({ ownerId: "own-1", buildingCore: {} });
  assert.equal(missingCore.success, false);
  assert.ok(missingCore.error.message.includes("Property name and location are required"));

  const missingRooms = await savePropertyListing({
    ownerId: "own-1",
    buildingCore: { name: "Cozy Stay", location: "Kolkata" },
    roomTypeInputs: [],
  });
  assert.equal(missingRooms.success, false);
  assert.ok(missingRooms.error.message.includes("At least one room type is required"));
});

// 4. ADMIN & AGENT WORKFLOWS
test("E2E Readiness — Admin dual-status resolution and agent validation", () => {
  assert.equal(propertyDisplayStatus({ listing_status: "published" }), "Live");
  assert.equal(propertyDisplayStatus({ verification_status: "pending", listing_status: "pending" }), "Pending review");
  assert.equal(propertyDisplayStatus({ verification_status: "rejected" }), "Rejected");

  const badAgent = validateAgentApplicationInput({});
  assert.equal(badAgent.valid, false);
  assert.ok(badAgent.errors.first_name);

  const goodAgent = validateAgentApplicationInput({
    first_name: "Rohan",
    last_name: "Sharma",
    phone: "9876543210",
    email: "rohan@example.com",
    location: "Salt Lake",
    pincode: "700091",
  });
  assert.equal(goodAgent.valid, true);
});

// 5. HOTEL BOOKING & RESERVATION WORKFLOWS
test("E2E Readiness — Hotel stay quotes and meal packages compute accurately", () => {
  const quote = calculateStayQuote({
    units: 2,
    rate: 2000,
    selectedMeals: ["breakfast"],
    hotel: {
      facilities: ["breakfast included"],
    },
  });

  assert.equal(quote.units, 2);
  assert.equal(quote.rate, 2000);
  assert.equal(quote.roomSubtotal, 4000);
  assert.equal(quote.mealsTotal, 600);
  assert.equal(quote.total, 4708);
});

// 6. PAYMENT POSTPONEMENT STATUS
test("E2E Readiness — Payment parameters verified sandbox-safe and postponed", () => {
  const p = preparePaymentParameters({
    bookingId: "bkg-999",
    amount: 3000,
  });
  assert.equal(p.isSandbox, true);
  assert.equal(p.amount, 300000);
  assert.equal(BOOKING_STATUS.PENDING, "pending");
});

// 7. STORAGE UPLOADS & FILE SAFETY
test("E2E Readiness — Media file validation and storage paths", () => {
  assert.equal(sanitizeStorageFileName("my image (1).jpg"), "my_image__1_.jpg");

  const path = generateStoragePath("usr-123", 0, "room.png");
  assert.ok(path.startsWith("usr-123/"));
  assert.ok(path.endsWith("-room.png"));

  const oversized = validateMediaFile({
    name: "huge.jpg",
    type: "image/jpeg",
    size: 10 * 1024 * 1024,
  });
  assert.equal(oversized.valid, false);

  const valid = validateMediaFile({
    name: "photo.jpg",
    type: "image/jpeg",
    size: 2 * 1024 * 1024,
  });
  assert.equal(valid.valid, true);
});

// 8. ROUTE GUARDS & PATH COVERAGE
test("E2E Readiness — All top-level paths defined in route registry", () => {
  const paths = [
    PATHS.HOME,
    PATHS.SEARCH,
    PATHS.LOGIN,
    PATHS.SIGNUP,
    PATHS.DASHBOARD,
    PATHS.OWNER_DASHBOARD,
    PATHS.ADMIN,
    PATHS.ADMIN_HOTEL_BOOKINGS,
    PATHS.PAYMENT,
  ];
  for (const p of paths) {
    assert.ok(typeof p === "string" && p.startsWith("/"));
  }
});
