import React from "react";
import {
  PROPERTY_CATEGORIES,
  getCategoryById,
  toggleSubcategorySelection,
} from "../../constants/categories.js";

export const PROPERTY_TYPES = ["PG", "Room", "Flat", "Hotel", "Mess", "Guest House"];
export const ROOM_TYPES = ["Single", "Double Sharing", "Triple Sharing", "4+ Sharing"];
export const FACILITY_OPTIONS = [
  { id: "wifi", label: "Wi-Fi" },
  { id: "food", label: "Food" },
  { id: "ac", label: "AC" },
  { id: "bathroom", label: "Attached Bathroom" },
  { id: "kitchen", label: "Attached Kitchen" },
  { id: "couple-friendly", label: "Couple Friendly" },
  { id: "furnished", label: "Furnished" },
  { id: "semi-furnished", label: "Semi Furnished" },
  { id: "unfurnished", label: "Unfurnished" },
  { id: "laundry", label: "Laundry" },
  { id: "parking", label: "Parking" },
];

export function SearchFilters({
  isOpen,
  stay = "monthly",
  selectedCategory = "all",
  onCategoryChange,
  selectedSubcategories = ["All"],
  onSubcategoryToggle,
  minPrice = "",
  maxPrice = "",
  onMinPriceChange,
  onMaxPriceChange,
  propertyTypes = [],
  onPropertyTypeToggle,
  roomTypes = [],
  onRoomTypeToggle,
  facilities = [],
  onFacilityToggle,
  onApply,
  onClear,
}) {
  if (!isOpen) return null;

  const currentCatDef = getCategoryById(selectedCategory);

  return (
    <div
      className="search-filter-panel"
      id="searchFilterPanel"
      role="region"
      aria-label="Filter Options"
    >
      <div className="filter-header">
        <h2>Filters</h2>
        <button
          type="button"
          onClick={onClear}
          id="clearFiltersBtn"
          className="clear-filters-btn"
        >
          Clear all
        </button>
      </div>

      <div className="search-filter-grid">
        {/* Main Category Section */}
        <div className="filter-section">
          <h3>Main Category</h3>
          <div className="filter-category-select">
            <select
              className="dynamic-select"
              value={selectedCategory}
              onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
              aria-label="Filter by main category"
            >
              <option value="all">All Categories</option>
              {PROPERTY_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subcategories Section */}
        {currentCatDef && (
          <div className="filter-section" style={{ gridColumn: "span 2" }}>
            <h3>Subcategories for {currentCatDef.name}</h3>
            <div className="filter-chips-wrap" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {currentCatDef.subcategories.map((sub) => {
                const isSelected = selectedSubcategories.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    className={`home-subcat-chip ${isSelected ? "is-active" : ""}`}
                    onClick={() => onSubcategoryToggle && onSubcategoryToggle(sub)}
                    aria-pressed={isSelected}
                    style={{ fontSize: "12px", padding: "4px 10px" }}
                  >
                    {isSelected && <span className="chip-check">✓ </span>}
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Budget Section */}
        <div className="filter-section">
          <h3>{stay === "daily" ? "Budget / Night" : "Budget / Month"}</h3>
          <div className="price-inputs">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              aria-label="Minimum price"
            />
            <span>–</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              aria-label="Maximum price"
            />
          </div>
        </div>

        {/* Room Type Section (Monthly focus) */}
        {stay === "monthly" && (
          <div className="filter-section">
            <h3>Room Sharing</h3>
            <div className="filter-checkbox-group">
              {ROOM_TYPES.map((rt) => (
                <label key={rt} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={roomTypes.includes(rt)}
                    onChange={() => onRoomTypeToggle(rt)}
                  />
                  <span>{rt}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Facilities Section */}
        <div className="filter-section">
          <h3>Facilities</h3>
          <div className="filter-checkbox-group">
            {FACILITY_OPTIONS.map((fac) => (
              <label key={fac.id} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={facilities.includes(fac.id)}
                  onChange={() => onFacilityToggle(fac.id)}
                />
                <span>{fac.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="filter-actions-bar">
        <button
          type="button"
          onClick={onApply}
          className="apply-filter"
          id="applyFiltersBtn"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

export default SearchFilters;
