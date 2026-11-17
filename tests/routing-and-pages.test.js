import test from "node:test";
import assert from "node:assert/strict";
import { PATHS, propertyPath, searchPath } from "../src/routes/paths.js";
import {
  attachComputedFields,
  calculateDistanceKm,
  isRoomAvailable,
  roomMonthlyPriceList,
  ROOMDHUNDO_HUBS,
  fetchPublishedProperties,
  fetchPropertyById,
  fetchApprovedAgents,
} from "../src/services/properties/index.js";

// Test 1: Path Constants and URL Builders
test("Paths & Routing — URL builders generate compliant paths", () => {
  assert.equal(PATHS.HOME, "/");
  assert.equal(PATHS.SEARCH, "/search");
  assert.equal(PATHS.PROPERTY_DETAILS, "/property/:id");
  assert.equal(PATHS.POLICIES, "/policies");

  // Property path without room
  assert.equal(propertyPath("test-uuid-123"), "/property/test-uuid-123");
  assert.equal(propertyPath(""), "/");

  // Property path with room query parameter
  assert.equal(
    propertyPath("test-uuid-123", "room-uuid-456"),
    "/property/test-uuid-123?room=room-uuid-456"
  );

  // Search path with query parameters
  const searchUrl = searchPath({
    q: "MAKAUT",
    stay: "monthly",
    type: "PG",
    min: 2000,
    max: 6000,
    sort: "price-asc",
    hub: "Jaguli",
  });

  assert.match(searchUrl, /^\/search\?/);
  assert.match(searchUrl, /q=MAKAUT/);
  assert.match(searchUrl, /stay=monthly/);
  assert.match(searchUrl, /type=PG/);
  assert.match(searchUrl, /min=2000/);
  assert.match(searchUrl, /max=6000/);
  assert.match(searchUrl, /sort=price-asc/);
  assert.match(searchUrl, /hub=Jaguli/);
});

// Test 2: Distance Calculation (Haversine Formula)
test("Properties Service — calculateDistanceKm computes accurate distances between hubs", () => {
  const makaut = ROOMDHUNDO_HUBS.find((h) => h.name === "MAKAUT");
  const jaguli = ROOMDHUNDO_HUBS.find((h) => h.name === "Jaguli");

  assert.ok(makaut);
  assert.ok(jaguli);

  const dist = calculateDistanceKm(
    makaut.latitude,
    makaut.longitude,
    jaguli.latitude,
    jaguli.longitude
  );

  assert.equal(typeof dist, "number");
  // Approximate straight-line distance between MAKAUT campus and Jaguli is ~2.75 km
  assert.ok(dist > 2.0 && dist < 3.5, `Expected distance ~2.75km, received ${dist}`);

  // Returns null for invalid or missing coordinates
  assert.equal(calculateDistanceKm(null, null, 22.9, 88.5), null);
  assert.equal(calculateDistanceKm("abc", "def", 22.9, 88.5), null);
});

// Test 3: Room Availability Logic
test("Properties Service — isRoomAvailable respects occupancy and available count", () => {
  assert.equal(isRoomAvailable({ availability: "Available", available_rooms: 2 }), true);
  assert.equal(isRoomAvailable({ availability: "occupied", available_rooms: 2 }), false);
  assert.equal(isRoomAvailable({ availability: "unavailable", available_rooms: 1 }), false);
  assert.equal(isRoomAvailable({ availability: "Available", available_rooms: 0 }), false);
  assert.equal(isRoomAvailable(null), false);
});

// Test 4: Room Monthly Price Extraction
test("Properties Service — roomMonthlyPriceList extracts direct prices and occupancy rents", () => {
  // Direct price_value
  assert.deepEqual(roomMonthlyPriceList({ price_value: 4500 }), [4500]);

  // Occupancy options in room_details
  const rtWithOptions = {
    price_value: 5000,
    room_details: {
      occupancy_options: [
        { people: 1, rent: 6000 },
        { people: 2, rent: 4000 },
      ],
    },
  };
  assert.deepEqual(roomMonthlyPriceList(rtWithOptions), [6000, 4000]);

  // Empty or invalid room returns empty array
  assert.deepEqual(roomMonthlyPriceList({}), []);
  assert.deepEqual(roomMonthlyPriceList(null), []);
});

// Test 5: Computed Fields Decorator
test("Properties Service — attachComputedFields aggregates ratings, bounds, and facilities", () => {
  const rawBuilding = {
    id: "building-123",
    name: "Krishna PG",
    type: "PG",
    facility_tags: ["wifi", "couple-friendly", "food"],
    reviews: [{ rating: 5 }, { rating: 4 }],
    room_types: [
      {
        room_type: "Single Room",
        price_value: 5500,
        daily_price: 600,
        available_rooms: 2,
        availability: "Available",
      },
      {
        room_type: "Double Sharing",
        price_value: 3800,
        daily_price: 450,
        available_rooms: 1,
        availability: "Available",
      },
    ],
  };

  const computed = attachComputedFields(rawBuilding);

  assert.equal(computed.avgRating, "4.5");
  assert.equal(computed.reviewCount, 2);
  assert.equal(computed.minPrice, 3800);
  assert.equal(computed.maxPrice, 5500);
  assert.equal(computed.minDailyPrice, 450);
  assert.equal(computed.totalAvailable, 3);
  assert.deepEqual(computed.roomTypeNames, ["Single Room", "Double Sharing"]);
  assert.equal(computed.isCoupleFriendly, true);

  // Safe with null input
  assert.equal(attachComputedFields(null), null);
});

// Test 6: Safe error responses when Supabase is unconfigured
test("Properties Service — fetchPublishedProperties and fetchPropertyById return safe errors", async () => {
  if (!process.env.VITE_SUPABASE_URL) {
    const listRes = await fetchPublishedProperties();
    assert.equal(listRes.data, null);
    assert.ok(listRes.error);
    assert.match(listRes.error.message, /not configured/);

    const singleRes = await fetchPropertyById("some-uuid");
    assert.equal(singleRes.data, null);
    assert.ok(singleRes.error);
    assert.match(singleRes.error.message, /not configured/);

    const emptyIdRes = await fetchPropertyById("");
    assert.equal(emptyIdRes.data, null);
    assert.match(emptyIdRes.error.message, /required/);

    const agentsRes = await fetchApprovedAgents();
    assert.deepEqual(agentsRes.data, []);
    assert.equal(agentsRes.error, null);
  }
});

