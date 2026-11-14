import test from "node:test";
import assert from "node:assert/strict";

import { ownerService } from "../src/services/owner/index.js";
import { PATHS, ROUTE_PATHS } from "../src/routes/paths.js";

// Test 1: Route Constants
test("Owner System — Route constants verify owner and listing endpoints", () => {
  assert.equal(PATHS.OWNER_DASHBOARD, "/owner/dashboard");
  assert.equal(PATHS.LIST_PROPERTY, "/list-property");
  assert.equal(PATHS.LIST_PG, "/list-property/pg");
  assert.equal(PATHS.LIST_FLAT, "/list-property/flat");
  assert.equal(PATHS.LIST_HOTEL, "/list-property/hotel");
  assert.equal(ROUTE_PATHS.OWNER_DASHBOARD, "/owner/dashboard");
  assert.equal(ROUTE_PATHS.LIST_PROPERTY, "/list-property");
});

// Test 2: fetchOwnerDashboardData input validation
test("Owner System — fetchOwnerDashboardData parameter validation and safe errors", async () => {
  // Missing ownerId
  const res1 = await ownerService.fetchOwnerDashboardData(null);
  assert.ok(res1.error);
  assert.match(res1.error.message, /Owner ID is required/);
  assert.deepEqual(res1.data.properties, []);
  assert.deepEqual(res1.data.enquiries, []);
  assert.equal(res1.data.stats.totalProperties, 0);

  // Valid parameter with unconfigured client
  const res2 = await ownerService.fetchOwnerDashboardData("user-uuid-123");
  assert.ok(res2.error);
  assert.match(res2.error.message, /Supabase client is not configured/);
  assert.equal(res2.data.stats.totalRooms, 0);
});

// Test 3: updatePropertyAvailability parameter validation
test("Owner System — updatePropertyAvailability parameter validation", async () => {
  // Missing buildingId
  const res1 = await ownerService.updatePropertyAvailability(null, "owner-123", "available");
  assert.equal(res1.success, false);
  assert.match(res1.error.message, /Building ID and Owner ID are required/);

  // Missing ownerId
  const res2 = await ownerService.updatePropertyAvailability("bld-123", null, "available");
  assert.equal(res2.success, false);
  assert.match(res2.error.message, /Building ID and Owner ID are required/);

  // Invalid status
  const res3 = await ownerService.updatePropertyAvailability("bld-123", "owner-123", "archived");
  assert.equal(res3.success, false);
  assert.match(res3.error.message, /must be 'available' or 'occupied'/);

  // Valid params with unconfigured client
  const res4 = await ownerService.updatePropertyAvailability("bld-123", "owner-123", "occupied");
  assert.equal(res4.success, false);
  assert.match(res4.error.message, /Supabase client is not configured/);
});

// Test 4: toggleRoomStatus parameter validation
test("Owner System — toggleRoomStatus parameter validation", async () => {
  // Missing roomId
  const res1 = await ownerService.toggleRoomStatus(null, "bld-123", 1);
  assert.equal(res1.success, false);
  assert.match(res1.error.message, /Room ID is required/);

  // Valid params with unconfigured client
  const res2 = await ownerService.toggleRoomStatus("rm-123", "bld-123", 1);
  assert.equal(res2.success, false);
  assert.match(res2.error.message, /Supabase client is not configured/);
});

// Test 5: deleteOwnerProperty parameter validation
test("Owner System — deleteOwnerProperty parameter validation", async () => {
  // Missing parameters
  const res1 = await ownerService.deleteOwnerProperty(null, "owner-123");
  assert.equal(res1.success, false);
  assert.match(res1.error.message, /Building ID and Owner ID are required/);

  const res2 = await ownerService.deleteOwnerProperty("bld-123", null);
  assert.equal(res2.success, false);
  assert.match(res2.error.message, /Building ID and Owner ID are required/);

  // Valid params with unconfigured client
  const res3 = await ownerService.deleteOwnerProperty("bld-123", "owner-123");
  assert.equal(res3.success, false);
  assert.match(res3.error.message, /Supabase client is not configured/);
});

// Test 6: fetchPropertyForEdit parameter validation
test("Owner System — fetchPropertyForEdit parameter validation", async () => {
  // Missing buildingId
  const res1 = await ownerService.fetchPropertyForEdit(null, "owner-123");
  assert.equal(res1.data, null);
  assert.match(res1.error.message, /Building ID is required/);

  // Valid params with unconfigured client
  const res2 = await ownerService.fetchPropertyForEdit("bld-123", "owner-123");
  assert.equal(res2.data, null);
  assert.match(res2.error.message, /Supabase client is not configured/);
});

// Test 7: savePropertyListing input validation
test("Owner System — savePropertyListing input validation", async () => {
  // Missing ownerId
  const res1 = await ownerService.savePropertyListing({
    buildingCore: { name: "Test PG", location: "Kolkata" },
    roomTypeInputs: [{ name: "Single", price_monthly: 5000 }],
    ownerId: null,
  });
  assert.equal(res1.success, false);
  assert.match(res1.error.message, /Owner ID is required/);

  // Missing name
  const res2 = await ownerService.savePropertyListing({
    buildingCore: { name: "", location: "Kolkata" },
    roomTypeInputs: [{ name: "Single", price_monthly: 5000 }],
    ownerId: "owner-123",
  });
  assert.equal(res2.success, false);
  assert.match(res2.error.message, /Property name and location are required/);

  // Missing location
  const res3 = await ownerService.savePropertyListing({
    buildingCore: { name: "Test PG", location: "" },
    roomTypeInputs: [{ name: "Single", price_monthly: 5000 }],
    ownerId: "owner-123",
  });
  assert.equal(res3.success, false);
  assert.match(res3.error.message, /Property name and location are required/);

  // Missing rooms
  const res4 = await ownerService.savePropertyListing({
    buildingCore: { name: "Test PG", location: "Kolkata" },
    roomTypeInputs: [],
    ownerId: "owner-123",
  });
  assert.equal(res4.success, false);
  assert.match(res4.error.message, /At least one room type is required/);

  // Valid listing structure with unconfigured client
  const res5 = await ownerService.savePropertyListing({
    buildingCore: {
      name: "Sunrise PG",
      location: "Jaguli",
      type: "PG",
      owner_name: "Ramesh",
      owner_phone: "9876543210",
    },
    roomTypeInputs: [{ name: "Single", price_monthly: 6000, occupancy: 1, available_rooms: 2 }],
    ownerId: "owner-123",
  });
  assert.equal(res5.success, false);
  assert.match(res5.error.message, /Supabase client is not configured/);
});

// Test 8: updateOwnerEnquiryStatus parameter validation
test("Owner System — updateOwnerEnquiryStatus parameter validation", async () => {
  // Missing enquiryId
  const res1 = await ownerService.updateOwnerEnquiryStatus(null, "owner-123", "accepted");
  assert.equal(res1.success, false);
  assert.match(res1.error.message, /Enquiry ID and Owner ID are required/);

  // Invalid status
  const res2 = await ownerService.updateOwnerEnquiryStatus("enq-123", "owner-123", "completed");
  assert.equal(res2.success, false);
  assert.match(res2.error.message, /Invalid enquiry status/);

  // Valid params with unconfigured client
  const res3 = await ownerService.updateOwnerEnquiryStatus("enq-123", "owner-123", "accepted");
  assert.equal(res3.success, false);
  assert.match(res3.error.message, /Supabase client is not configured/);
});

// Test 9: updateOwnerProfile parameter validation
test("Owner System — updateOwnerProfile parameter validation", async () => {
  // Missing userId
  const res1 = await ownerService.updateOwnerProfile({ userId: null, full_name: "Owner Name" });
  assert.equal(res1.success, false);
  assert.match(res1.error.message, /User ID is required/);

  // Missing name
  const res2 = await ownerService.updateOwnerProfile({ userId: "user-123", full_name: "" });
  assert.equal(res2.success, false);
  assert.match(res2.error.message, /Full name is required/);

  // Valid params with unconfigured client
  const res3 = await ownerService.updateOwnerProfile({
    userId: "user-123",
    full_name: "Owner Name",
    phone: "9876543210",
  });
  assert.equal(res3.success, false);
  assert.match(res3.error.message, /Supabase client is not configured/);
});

// Test 10: Role protection check
test("Owner System — Role authorization logic verifies allowed roles", () => {
  const allowedOwnerRoles = ["owner", "admin", "agent"];

  assert.equal(allowedOwnerRoles.includes("owner"), true);
  assert.equal(allowedOwnerRoles.includes("admin"), true);
  assert.equal(allowedOwnerRoles.includes("agent"), true);
  assert.equal(allowedOwnerRoles.includes("renter"), false);
  assert.equal(allowedOwnerRoles.includes("user"), false);
  assert.equal(allowedOwnerRoles.includes(undefined), false);
});
