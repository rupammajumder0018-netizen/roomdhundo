/**
 * @file tests/admin-and-agent.test.js
 * Automated Unit & Contract Tests for Phase 8: Admin Management Console & Agent Operations
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { PATHS } from "../src/routes/paths.js";
import {
  normalizeAdminRole,
  getAdminRoleLabel,
  propertyDisplayStatus,
  validateAgentApplicationInput,
  updatePropertyVerificationStatus,
  updateAdminEnquiryStatus,
  updateAgentApplicationStatus,
  deleteAgentApplication,
  deleteAdminProperty,
  fetchAdminDashboardStats,
  fetchAdminProperties,
  fetchAdminProfiles,
  fetchAdminAgentApplications,
  fetchAdminEnquiries,
  fetchAdminReviews,
  fetchAdminEconomyDeals,
} from "../src/services/admin/adminService.js";

test("Admin & Agent — Path constants verify admin and agent routes", () => {
  assert.equal(PATHS.ADMIN, "/admin");
  assert.equal(PATHS.ADMIN_PROPERTIES, "/admin/properties");
  assert.equal(PATHS.ADMIN_PROFILES, "/admin/profiles");
  assert.equal(PATHS.ADMIN_AGENTS, "/admin/agents");
  assert.equal(PATHS.ADMIN_ENQUIRIES, "/admin/enquiries");
  assert.equal(PATHS.ADMIN_REVIEWS, "/admin/reviews");
  assert.equal(PATHS.ADMIN_ECONOMY, "/admin/economy");
  assert.equal(PATHS.ADMIN_SETTINGS, "/admin/settings");
  assert.equal(PATHS.BE_AN_AGENT, "/be-an-agent");
});

test("Admin Service — Role normalization and human-readable role labels", () => {
  // Role normalization
  assert.equal(normalizeAdminRole("admin"), "admin");
  assert.equal(normalizeAdminRole("ADMIN"), "admin");
  assert.equal(normalizeAdminRole("owner"), "owner");
  assert.equal(normalizeAdminRole("agent"), "agent");
  assert.equal(normalizeAdminRole("agent_pending"), "agent_pending");
  assert.equal(normalizeAdminRole("renter"), "renter");
  assert.equal(normalizeAdminRole("user"), "renter");
  assert.equal(normalizeAdminRole("unknown_role"), "renter");
  assert.equal(normalizeAdminRole(null), "renter");

  // Role labels
  assert.equal(getAdminRoleLabel("admin"), "Admin");
  assert.equal(getAdminRoleLabel("owner"), "Owner");
  assert.equal(getAdminRoleLabel("agent"), "Agent");
  assert.equal(getAdminRoleLabel("agent_pending"), "Pending Agent");
  assert.equal(getAdminRoleLabel("user"), "Renter");
  assert.equal(getAdminRoleLabel("renter"), "Renter");
});

test("Admin Service — Property display status resolution matches dual-status model", () => {
  // Pending review
  assert.equal(
    propertyDisplayStatus({ verification_status: "pending", listing_status: "pending" }),
    "Pending review"
  );
  assert.equal(
    propertyDisplayStatus({ verification_status: null, listing_status: "pending" }),
    "Pending review"
  );
  assert.equal(
    propertyDisplayStatus({ verification_status: "pending", listing_status: "published" }),
    "Pending review"
  );

  // Rejected
  assert.equal(
    propertyDisplayStatus({ verification_status: "rejected" }),
    "Rejected"
  );
  assert.equal(
    propertyDisplayStatus({ listing_status: "rejected" }),
    "Rejected"
  );

  // Archived
  assert.equal(
    propertyDisplayStatus({ listing_status: "archived" }),
    "Archived"
  );

  // Live / Published
  assert.equal(
    propertyDisplayStatus({ verification_status: "approved", listing_status: "published" }),
    "Live"
  );
  assert.equal(
    propertyDisplayStatus({ verification_status: "verified", listing_status: "published" }),
    "Live"
  );
  assert.equal(
    propertyDisplayStatus({ listing_status: "published" }),
    "Live"
  );

  // Default / Empty
  assert.equal(propertyDisplayStatus(null), "Live"); // Default legacy published
  assert.equal(propertyDisplayStatus({}), "Live");
});

test("Agent Operations — validateAgentApplicationInput enforces strict format rules", () => {
  // Missing required fields
  const emptyRes = validateAgentApplicationInput({});
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.errors.first_name);
  assert.ok(emptyRes.errors.last_name);
  assert.ok(emptyRes.errors.phone);
  assert.ok(emptyRes.errors.email);
  assert.ok(emptyRes.errors.location);
  assert.ok(emptyRes.errors.pincode);

  // Invalid phone (not 10 digits)
  const badPhone = validateAgentApplicationInput({
    first_name: "John",
    last_name: "Doe",
    phone: "12345",
    email: "john@example.com",
    location: "Kalyani",
    pincode: "741235",
  });
  assert.equal(badPhone.valid, false);
  assert.ok(badPhone.errors.phone.includes("10-digit"));

  // Invalid PIN (not 6 digits)
  const badPin = validateAgentApplicationInput({
    first_name: "John",
    last_name: "Doe",
    phone: "9876543210",
    email: "john@example.com",
    location: "Kalyani",
    pincode: "7412",
  });
  assert.equal(badPin.valid, false);
  assert.ok(badPin.errors.pincode.includes("6-digit"));

  // Invalid email
  const badEmail = validateAgentApplicationInput({
    first_name: "John",
    last_name: "Doe",
    phone: "9876543210",
    email: "not-an-email",
    location: "Kalyani",
    pincode: "741235",
  });
  assert.equal(badEmail.valid, false);
  assert.ok(badEmail.errors.email.includes("valid email"));

  // Valid inputs
  const validRes = validateAgentApplicationInput({
    first_name: "John",
    last_name: "Doe",
    phone: "9876543210",
    email: "john.doe@example.com",
    location: "Kalyani",
    pincode: "741235",
  });
  assert.equal(validRes.valid, true);
  assert.equal(Object.keys(validRes.errors).length, 0);
});

test("Admin Service — Property and Enquiry operations validate parameters", async () => {
  // Missing buildingId in updatePropertyVerificationStatus
  const propRes = await updatePropertyVerificationStatus("", "approved");
  assert.equal(propRes.success, false);
  assert.ok(propRes.error.message.includes("Property ID"));

  // Invalid action in updatePropertyVerificationStatus
  const badActionRes = await updatePropertyVerificationStatus("b-123", "invalid-action");
  assert.equal(badActionRes.success, false);
  assert.ok(badActionRes.error.message.includes("approved"));

  // Missing propertyId in deleteAdminProperty
  const delPropRes = await deleteAdminProperty("");
  assert.equal(delPropRes.success, false);
  assert.ok(delPropRes.error.message.includes("Property ID"));

  // Missing enquiryId in updateAdminEnquiryStatus
  const enqRes = await updateAdminEnquiryStatus("", "contacted");
  assert.equal(enqRes.success, false);
  assert.ok(enqRes.error.message.includes("Enquiry ID"));

  // Invalid status in updateAdminEnquiryStatus
  const badStatusRes = await updateAdminEnquiryStatus("e-123", "invalid-status");
  assert.equal(badStatusRes.success, false);
  assert.ok(badStatusRes.error.message.includes("Invalid enquiry status"));
});

test("Admin Service — Agent application operations validate parameters", async () => {
  // Missing applicationId in updateAgentApplicationStatus
  const appRes = await updateAgentApplicationStatus("", "u-123", "approved");
  assert.equal(appRes.success, false);
  assert.ok(appRes.error.message.includes("Application ID"));

  // Invalid action in updateAgentApplicationStatus
  const badAppActionRes = await updateAgentApplicationStatus("app-123", "u-123", "unknown");
  assert.equal(badAppActionRes.success, false);
  assert.ok(badAppActionRes.error.message.includes("Action must be either 'approved' or 'rejected'"));

  // Missing applicationId in deleteAgentApplication
  const delAppRes = await deleteAgentApplication("");
  assert.equal(delAppRes.success, false);
  assert.ok(delAppRes.error.message.includes("Application ID"));
});

test("Admin Service — Safe handling when Supabase is unconfigured", async () => {
  // All query functions must return safe { data, error } structures without crashing
  const stats = await fetchAdminDashboardStats();
  assert.ok(stats.error || stats.data != null);

  const props = await fetchAdminProperties();
  assert.ok(props.error || Array.isArray(props.data));

  const users = await fetchAdminProfiles();
  assert.ok(users.error || Array.isArray(users.data));

  const agents = await fetchAdminAgentApplications();
  assert.ok(agents.error || Array.isArray(agents.data));

  const enquiries = await fetchAdminEnquiries();
  assert.ok(enquiries.error || Array.isArray(enquiries.data));

  const reviews = await fetchAdminReviews();
  assert.ok(reviews.error || Array.isArray(reviews.data));

  const economy = await fetchAdminEconomyDeals();
  assert.ok(economy.error || Array.isArray(economy.data));
});
