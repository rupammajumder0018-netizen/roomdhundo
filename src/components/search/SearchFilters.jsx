import React from "react";

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

        {/* Property Type Section */}
        <div className="filter-section">
          <h3>Property Type</h3>
          <div className="filter-checkbox-group">
            {PROPERTY_TYPES.map((pt) => (
              <label key={pt} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={propertyTypes.includes(pt)}
                  onChange={() => onPropertyTypeToggle(pt)}
                />
                <span>{pt}</span>
              </label>
            ))}
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

