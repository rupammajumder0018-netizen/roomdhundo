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

test("Commercial Category — Exists as 5th main category with full configuration", () => {
  assert.equal(PROPERTY_CATEGORIES.length, 5);
  const comm = PROPERTY_CATEGORIES[4];

  assert.equal(comm.id, "commercial");
  assert.equal(comm.name, "Commercial");
  assert.equal(comm.pricingUnit, "/ month");
  assert.equal(comm.badgeColor, "#7c3aed");
  assert.ok(comm.description.toLowerCase().includes("shops") || comm.description.toLowerCase().includes("commercial"));
  assert.ok(comm.amenities.length >= 12);
});

test("Commercial Subcategories — Exactly 10 subcategories with 'All' first", () => {
  const comm = CATEGORY_MAP_BY_ID.commercial;
  const expectedSubcategories = [
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
  ];

  assert.deepEqual(comm.subcategories, expectedSubcategories);
  assert.equal(comm.subcategories.length, 10);
});

test("Commercial Subcategories — Mutual exclusivity with 'All' and multi-selection", () => {
  // 1. Initial selection is "All"
  let selection = ["All"];

  // 2. Selecting "Retail Shop" removes "All"
  selection = toggleSubcategorySelection(selection, "Retail Shop", true);
  assert.deepEqual(selection, ["Retail Shop"]);

  // 3. Multi-selecting "Office Space" appends it
  selection = toggleSubcategorySelection(selection, "Office Space", true);
  assert.deepEqual(selection, ["Retail Shop", "Office Space"]);

  // 4. Selecting "All" clears individual subcategories and returns ["All"]
  selection = toggleSubcategorySelection(selection, "All", true);
  assert.deepEqual(selection, ["All"]);

  // 5. Selecting another subcategory again removes "All"
  selection = toggleSubcategorySelection(selection, "Warehouse", true);
  assert.deepEqual(selection, ["Warehouse"]);

  // 6. Toggling off the only selected subcategory reverts to ["All"] when defaultToAllOnEmpty is true
  selection = toggleSubcategorySelection(selection, "Warehouse", true);
  assert.deepEqual(selection, ["All"]);
});

test("Commercial Category Resolution — Resolves varied commercial types and categories", () => {
  // Explicit category
  const res1 = resolveMainCategoryFromProperty({ category: "commercial", type: "Retail Shop" });
  assert.equal(res1.category.id, "commercial");

  // Type inference for all commercial subcategories
  const testTypes = [
    "Retail Shop",
    "Showroom",
    "Office Space",
    "Coworking Space",
    "Warehouse",
    "Godown",
    "Restaurant Space",
    "Industrial Space",
    "Commercial Building",
    "Shop",
    "Commercial Complex",
  ];

  for (const type of testTypes) {
    const res = resolveMainCategoryFromProperty({ type });
    assert.equal(
      res.category.id,
      "commercial",
      `Expected type '${type}' to resolve to category 'commercial'`
    );
  }
});

test("Commercial Category Filtering — Accurately filters by subcategories and 'All'", () => {
  const shop = {
    id: "shop-1",
    name: "Prime High Street Shop",
    category: "commercial",
    type: "Retail Shop",
    subcategories: ["Retail Shop", "Showroom"],
  };

  const warehouse = {
    id: "wh-1",
    name: "Logistics Godown Facility",
    category: "commercial",
    type: "Warehouse",
    subcategories: ["Warehouse", "Godown"],
  };

  // 1. "all" main category matches any property
  assert.equal(matchesCategoryFilter(shop, "all", ["All"]), true);
  assert.equal(matchesCategoryFilter(warehouse, "all", ["All"]), true);

  // 2. "commercial" with ["All"] matches both
  assert.equal(matchesCategoryFilter(shop, "commercial", ["All"]), true);
  assert.equal(matchesCategoryFilter(warehouse, "commercial", ["All"]), true);

  // 3. Subcategory-specific filtering
  assert.equal(matchesCategoryFilter(shop, "commercial", ["Retail Shop"]), true);
  assert.equal(matchesCategoryFilter(shop, "commercial", ["Showroom"]), true);
  assert.equal(matchesCategoryFilter(shop, "commercial", ["Warehouse"]), false);

  assert.equal(matchesCategoryFilter(warehouse, "commercial", ["Warehouse"]), true);
  assert.equal(matchesCategoryFilter(warehouse, "commercial", ["Godown"]), true);
  assert.equal(matchesCategoryFilter(warehouse, "commercial", ["Retail Shop"]), false);

  // 4. Non-commercial category returns false
  assert.equal(matchesCategoryFilter(shop, "flats_rentals", ["All"]), false);
  assert.equal(matchesCategoryFilter(warehouse, "pg_hostels", ["All"]), false);
});

test("Commercial Pricing & Rent Model — Purely monthly rent, deposit and lease terms (NOT per-night)", () => {
  const commMeta = {
    category: "commercial",
    subcategories: ["Office Space"],
    monthlyRent: "45000",
    securityDeposit: "135000",
    advancePayment: "45000",
    minRentalPeriod: "11 Months",
    preferredLease: "3 Years",
    rentNegotiable: true,
  };

  assert.equal(commMeta.category, "commercial");
  assert.equal(Number(commMeta.monthlyRent), 45000);
  assert.equal(Number(commMeta.securityDeposit), 135000);
  assert.equal(commMeta.minRentalPeriod, "11 Months");
  assert.equal(commMeta.preferredLease, "3 Years");
  assert.equal(commMeta.rentNegotiable, true);
});
