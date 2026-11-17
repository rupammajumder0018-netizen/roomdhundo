import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { PATHS, propertyPath, searchPath, paymentPath } from "../src/routes/paths.js";
import * as services from "../src/services/index.js";

test("Consolidation — Route Registry Complete across all 9 Phases", () => {
  // Public
  assert.equal(PATHS.HOME, "/");
  assert.equal(PATHS.SEARCH, "/search");
  assert.equal(PATHS.PROPERTY_DETAILS, "/property/:id");
  assert.equal(PATHS.HOTEL_ROOM, "/hotel-room/:roomId");
  assert.equal(PATHS.POLICIES, "/policies");
  assert.equal(PATHS.PAYMENT, "/payment");

  // Auth
  assert.equal(PATHS.LOGIN, "/login");
  assert.equal(PATHS.SIGNUP, "/signup");
  assert.equal(PATHS.FORGOT_PASSWORD, "/forgot-password");
  assert.equal(PATHS.RESET_PASSWORD, "/reset-password");
  assert.equal(PATHS.AUTH_CALLBACK, "/auth/callback");

  // Renter
  assert.equal(PATHS.DASHBOARD, "/dashboard");
  assert.equal(PATHS.SAVED, "/saved");
  assert.equal(PATHS.ENQUIRIES, "/enquiries");
  assert.equal(PATHS.BE_AN_AGENT, "/be-an-agent");

  // Owner & Listings
  assert.equal(PATHS.OWNER_DASHBOARD, "/owner/dashboard");
  assert.equal(PATHS.LIST_PROPERTY, "/list-property");
  assert.equal(PATHS.LIST_PG, "/list-property/pg");
  assert.equal(PATHS.LIST_FLAT, "/list-property/flat");
  assert.equal(PATHS.LIST_HOTEL, "/list-property/hotel");

  // Admin
  assert.equal(PATHS.ADMIN, "/admin");
  assert.equal(PATHS.ADMIN_PROPERTIES, "/admin/properties");
  assert.equal(PATHS.ADMIN_PROFILES, "/admin/profiles");
  assert.equal(PATHS.ADMIN_ENQUIRIES, "/admin/enquiries");
  assert.equal(PATHS.ADMIN_HOTEL_BOOKINGS, "/admin/hotel-bookings");
  assert.equal(PATHS.ADMIN_AGENTS, "/admin/agents");
  assert.equal(PATHS.ADMIN_REVIEWS, "/admin/reviews");
  assert.equal(PATHS.ADMIN_ECONOMY, "/admin/economy");
  assert.equal(PATHS.ADMIN_SETTINGS, "/admin/settings");
});

test("Consolidation — URL Builders produce expected parameterized links", () => {
  assert.equal(propertyPath("prop-123"), "/property/prop-123");
  assert.equal(propertyPath("prop-123", "room-456"), "/property/prop-123?room=room-456");
  assert.equal(searchPath({ q: "Kalyani", stay: "monthly" }), "/search?q=Kalyani&stay=monthly");
  assert.equal(paymentPath("bkg-999"), "/payment?booking_id=bkg-999");
});

test("Consolidation — Services barrel re-exports all required domains", () => {
  assert.ok(services.authService);
  assert.ok(services.propertiesService);
  assert.ok(services.bookingsService);
  assert.ok(services.enquiriesService);
  assert.ok(services.ownerService);
  assert.ok(services.adminService);
  assert.ok(services.storageService);
  assert.ok(services.mutationHelpers);
});

test("Consolidation — package.json has zero references to legacy files6.0", () => {
  const pkgContent = fs.readFileSync(path.resolve("package.json"), "utf-8");
  assert.ok(
    !pkgContent.includes("files6.0"),
    "package.json must not reference files6.0 in any script or configuration"
  );
});

test("Consolidation — .gitignore protects local environment and credentials", () => {
  const gitignore = fs.readFileSync(path.resolve(".gitignore"), "utf-8");
  assert.ok(gitignore.includes(".env"));
  assert.ok(gitignore.includes(".env.local"));
  assert.ok(gitignore.includes(".env.*.local"));
  assert.ok(gitignore.includes("node_modules/"));
  assert.ok(gitignore.includes("dist/"));
});

test("Consolidation — Root index.html points to modern React entrypoint", () => {
  const indexHtml = fs.readFileSync(path.resolve("index.html"), "utf-8");
  assert.ok(indexHtml.includes('src="/src/main.jsx"'));
  assert.ok(indexHtml.includes('id="root"'));
  assert.ok(!indexHtml.includes("files6.0"));
});
