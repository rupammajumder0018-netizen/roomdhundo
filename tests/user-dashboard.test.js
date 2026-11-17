import test from "node:test";
import assert from "node:assert/strict";

import {
  updateUserProfile,
  accountKindLabel,
  accountKindFromRole,
} from "../src/services/auth/index.js";
import {
  fetchSavedProperties,
  fetchSavedPropertiesCount,
  toggleSavedProperty,
} from "../src/services/properties/index.js";
import {
  fetchUserEnquiries,
  fetchUserEnquiriesCount,
  fetchUserEnquiriesWithDetails,
} from "../src/services/enquiries/index.js";
import { PATHS } from "../src/routes/paths.js";

test("User Dashboard — PATHS constants verify renter routes", () => {
  assert.equal(PATHS.DASHBOARD, "/dashboard");
  assert.equal(PATHS.SAVED, "/saved");
  assert.equal(PATHS.ENQUIRIES, "/enquiries");
});

test("User Dashboard — updateUserProfile input validation and security checks", async () => {
  // Missing userId
  const res1 = await updateUserProfile(null, { full_name: "Test User" });
  assert.ok(res1.error);
  assert.match(res1.error.message, /User ID is required/);

  // Missing or empty name
  const res2 = await updateUserProfile("user-123", { full_name: "" });
  assert.ok(res2.error);
  assert.match(res2.error.message, /at least 2 characters/);

  const res3 = await updateUserProfile("user-123", { full_name: "A" });
  assert.ok(res3.error);
  assert.match(res3.error.message, /at least 2 characters/);

  // When unconfigured, returns safe error instead of crashing
  const res4 = await updateUserProfile("user-123", { full_name: "John Doe" });
  assert.ok(res4.error);
  assert.equal(res4.data, null);
});

test("User Dashboard — Saved Properties operations validate required parameters", async () => {
  // fetchSavedProperties requires userId
  const res1 = await fetchSavedProperties(null);
  assert.ok(res1.error);
  assert.match(res1.error.message, /User ID is required/);

  // fetchSavedPropertiesCount requires userId
  const res2 = await fetchSavedPropertiesCount(null);
  assert.ok(res2.error);
  assert.equal(res2.count, 0);

  // toggleSavedProperty handles unconfigured client safely
  const res3 = await toggleSavedProperty("user-123", "bld-456", true);
  assert.ok(res3.error);
  assert.equal(res3.saved, true); // Returns previous state on failure
});

test("User Dashboard — User Enquiries service operations validate parameters", async () => {
  // fetchUserEnquiries requires userId
  const res1 = await fetchUserEnquiries(null);
  assert.ok(res1.error);
  assert.match(res1.error.message, /User ID is required/);

  // fetchUserEnquiriesCount requires userId
  const res2 = await fetchUserEnquiriesCount(null);
  assert.ok(res2.error);
  assert.equal(res2.count, 0);

  // fetchUserEnquiriesWithDetails requires userId
  const res3 = await fetchUserEnquiriesWithDetails(null);
  assert.ok(res3.error);
  assert.match(res3.error.message, /User ID is required/);

  // Safe error when unconfigured
  const res4 = await fetchUserEnquiriesWithDetails("user-123");
  assert.ok(res4.error);
  assert.equal(res4.data, null);
});

test("User Dashboard — Contact and Phone sanitization logic", () => {
  // Clean phone logic matching EnquiryCard
  const sanitizePhone = (raw) => String(raw || "").replace(/\D/g, "");
  const formatWhatsApp = (raw) => {
    const digits = sanitizePhone(raw);
    return digits.length === 10 ? `91${digits}` : digits;
  };

  assert.equal(sanitizePhone("+91 93829-91409"), "919382991409");
  assert.equal(sanitizePhone("9876543210"), "9876543210");
  assert.equal(formatWhatsApp("9876543210"), "919876543210");
  assert.equal(formatWhatsApp("919876543210"), "919876543210");
  assert.equal(formatWhatsApp(""), "");
});

test("User Dashboard — Account labels and role normalization", () => {
  assert.equal(accountKindLabel("user"), "Renter");
  assert.equal(accountKindLabel("renter"), "Renter");
  assert.equal(accountKindLabel("owner"), "Owner");
  assert.equal(accountKindLabel("admin"), "Admin");
  assert.equal(accountKindLabel("agent"), "Agent");

  assert.equal(accountKindFromRole("renter"), "user");
  assert.equal(accountKindFromRole("owner"), "owner");
  assert.equal(accountKindFromRole("admin"), "admin");
});
