import test from "node:test";
import assert from "node:assert/strict";

import {
  PROPERTY_CATEGORIES,
  CATEGORY_MAP_BY_ID,
  getCategoryById,
  toggleSubcategorySelection,
  resolveMainCategoryFromProperty,
  matchesCategoryFilter,
} from "../src/constants/categories.js";

import { isListingOwnerRole, accountKindFromRole } from "../src/services/auth/index.js";

test("Property Categories — Exactly 5 main categories in strict order", () => {
  assert.equal(PROPERTY_CATEGORIES.length, 5);

  assert.equal(PROPERTY_CATEGORIES[0].id, "pg_hostels");
  assert.equal(PROPERTY_CATEGORIES[0].name, "PG & Hostels");

  assert.equal(PROPERTY_CATEGORIES[1].id, "hotels_stays");
  assert.equal(PROPERTY_CATEGORIES[1].name, "Hotels & Stays");

  assert.equal(PROPERTY_CATEGORIES[2].id, "flats_rentals");
  assert.equal(PROPERTY_CATEGORIES[2].name, "Flats & Rentals");

  assert.equal(PROPERTY_CATEGORIES[3].id, "event_spaces");
  assert.equal(PROPERTY_CATEGORIES[3].name, "Event Spaces");

  assert.equal(PROPERTY_CATEGORIES[4].id, "commercial");
  assert.equal(PROPERTY_CATEGORIES[4].name, "Commercial");
});

test("Property Categories — Subcategory specifications match requirements", () => {
  const pg = CATEGORY_MAP_BY_ID.pg_hostels;
  assert.deepEqual(pg.subcategories, [
    "All",
    "PG",
    "Only Boys PG",
    "Only Girls PG",
    "Boys Hostel",
    "Girls Hostel",
    "Co-living PG",
    "Student Mess",
  ]);

  const hotels = CATEGORY_MAP_BY_ID.hotels_stays;
  assert.deepEqual(hotels.subcategories, [
    "All",
    "Hotel",
    "Resort",
    "Guest House",
    "Lodge",
    "Homestay",
  ]);

  const flats = CATEGORY_MAP_BY_ID.flats_rentals;
  assert.deepEqual(flats.subcategories, [
    "All",
    "Flat",
    "Apartment",
    "Independent Room",
    "Independent House",
    "Studio Apartment",
  ]);

  const events = CATEGORY_MAP_BY_ID.event_spaces;
  assert.deepEqual(events.subcategories, [
    "All",
    "Banquet Hall",
    "Party Hall",
    "Wedding Venue",
    "Conference Hall",
    "Meeting Hall",
  ]);

  const commercial = CATEGORY_MAP_BY_ID.commercial;
  assert.deepEqual(commercial.subcategories, [
    "All",
    "Retail Shop",
    "Showroom",
    "Office Space",
    "Coworking Space",
    "Warehouse",
    "Godown",
    "Restaurant Space",
    "Industrial Space",
    "Commercial Building",
  ]);
});

test("Subcategory Selection — Mutual exclusivity with 'All'", () => {
  // 1. When selecting "All", specific subcategories must be cleared
  const selectedAfterAll = toggleSubcategorySelection(["Only Boys PG", "Student Mess"], "All");
  assert.deepEqual(selectedAfterAll, ["All"]);

  // 2. When selecting an individual subcategory, "All" must be removed
  const selectedSpecific = toggleSubcategorySelection(["All"], "Only Boys PG");
  assert.deepEqual(selectedSpecific, ["Only Boys PG"]);

  // 3. Multi-selection of subcategories is supported
  const multiSelected = toggleSubcategorySelection(["Only Boys PG"], "PG");
  assert.deepEqual(multiSelected, ["Only Boys PG", "PG"]);

  // 4. Unselecting a subcategory removes it
  const unselected = toggleSubcategorySelection(["Only Boys PG", "PG"], "Only Boys PG");
  assert.deepEqual(unselected, ["PG"]);

  // 5. If all unchecked with defaultToAllOnEmpty, reverts to ["All"]
  const emptyReverted = toggleSubcategorySelection(["PG"], "PG", true);
  assert.deepEqual(emptyReverted, ["All"]);
});

test("Backward Compatibility — Resolves legacy property records correctly", () => {
  // Legacy PG
  const pgRes = resolveMainCategoryFromProperty({ type: "PG" });
  assert.equal(pgRes.category.id, "pg_hostels");

  // Legacy Hotel
  const hotelRes = resolveMainCategoryFromProperty({ type: "Hotel" });
  assert.equal(hotelRes.category.id, "hotels_stays");

  // Legacy Guest House
  const ghRes = resolveMainCategoryFromProperty({ type: "Guest House" });
  assert.equal(ghRes.category.id, "hotels_stays");

  // Legacy Flat
  const flatRes = resolveMainCategoryFromProperty({ type: "Flat" });
  assert.equal(flatRes.category.id, "flats_rentals");

  // Legacy Event Hall
  const eventRes = resolveMainCategoryFromProperty({ type: "Event Hall" });
  assert.equal(eventRes.category.id, "event_spaces");

  // Commercial Retail Shop
  const shopRes = resolveMainCategoryFromProperty({ type: "Retail Shop" });
  assert.equal(shopRes.category.id, "commercial");

  // Commercial Office Space
  const officeRes = resolveMainCategoryFromProperty({ type: "Office Space" });
  assert.equal(officeRes.category.id, "commercial");

  // Commercial Warehouse
  const whRes = resolveMainCategoryFromProperty({ type: "Warehouse" });
  assert.equal(whRes.category.id, "commercial");

  // Modern property with explicit category and subcategories
  const modern = resolveMainCategoryFromProperty({
    category: "event_spaces",
    subcategories: ["Banquet Hall", "Wedding Venue"],
    type: "Banquet Hall",
  });
  assert.equal(modern.category.id, "event_spaces");
  assert.deepEqual(modern.subcategories, ["Banquet Hall", "Wedding Venue"]);

  // Modern commercial property
  const modernComm = resolveMainCategoryFromProperty({
    category: "commercial",
    subcategories: ["Retail Shop", "Showroom"],
    type: "Retail Shop",
  });
  assert.equal(modernComm.category.id, "commercial");
  assert.deepEqual(modernComm.subcategories, ["Retail Shop", "Showroom"]);
});

test("Category Filtering — matchesCategoryFilter respects main category and subcategories", () => {
  const property = {
    id: "prop-123",
    name: "Sunrise Boys PG",
    type: "Only Boys PG",
    category: "pg_hostels",
    subcategories: ["PG", "Only Boys PG"],
  };

  // Matches "all" categories
  assert.equal(matchesCategoryFilter(property, "all", ["All"]), true);

  // Matches its own category
  assert.equal(matchesCategoryFilter(property, "pg_hostels", ["All"]), true);

  // Does not match different category
  assert.equal(matchesCategoryFilter(property, "hotels_stays", ["All"]), false);
  assert.equal(matchesCategoryFilter(property, "commercial", ["All"]), false);

  // Matches specific subcategory
  assert.equal(matchesCategoryFilter(property, "pg_hostels", ["Only Boys PG"]), true);

  // Does not match unselected subcategory
  assert.equal(matchesCategoryFilter(property, "pg_hostels", ["Only Girls PG"]), false);

  // Commercial property filtering
  const commProp = {
    id: "comm-456",
    name: "Apex Business Center",
    type: "Office Space",
    category: "commercial",
    subcategories: ["Office Space", "Coworking Space"],
  };

  assert.equal(matchesCategoryFilter(commProp, "commercial", ["All"]), true);
  assert.equal(matchesCategoryFilter(commProp, "commercial", ["Office Space"]), true);
  assert.equal(matchesCategoryFilter(commProp, "commercial", ["Retail Shop"]), false);
  assert.equal(matchesCategoryFilter(commProp, "flats_rentals", ["All"]), false);
});

test("User Roles & Permissions — Authorization guards for property listing", () => {
  // Admin has full control
  assert.equal(isListingOwnerRole("admin"), true);
  assert.equal(accountKindFromRole("admin"), "admin");

  // Owner can list properties
  assert.equal(isListingOwnerRole("owner"), true);
  assert.equal(accountKindFromRole("owner"), "owner");

  // Agent can list properties
  assert.equal(isListingOwnerRole("agent"), true);
  assert.equal(accountKindFromRole("agent"), "agent");

  // Regular user / Renter must NOT have listing permissions
  assert.equal(isListingOwnerRole("user"), false);
  assert.equal(isListingOwnerRole("renter"), false);
  assert.equal(accountKindFromRole("user"), "user");
  assert.equal(accountKindFromRole("renter"), "user");
});

test("Photo Uploads — Media file validation enforces size and format limits", async () => {
  const { validateMediaFile } = await import("../src/services/storage/index.js");

  // Missing file
  const noFile = validateMediaFile(null);
  assert.equal(noFile.valid, false);

  // Valid image
  const validImage = { name: "living_room.jpg", type: "image/jpeg", size: 1024 * 1024 };
  assert.equal(validateMediaFile(validImage).valid, true);

  // Over-sized image (over 5MB)
  const hugeImage = { name: "huge.png", type: "image/png", size: 6 * 1024 * 1024 };
  const hugeRes = validateMediaFile(hugeImage);
  assert.equal(hugeRes.valid, false);
  assert.match(hugeRes.error, /exceeds the 5MB size limit/);

  // Unsupported file type
  const pdfFile = { name: "document.pdf", type: "application/pdf", size: 1024 };
  const pdfRes = validateMediaFile(pdfFile);
  assert.equal(pdfRes.valid, false);
  assert.match(pdfRes.error, /Unsupported file type/);
});
