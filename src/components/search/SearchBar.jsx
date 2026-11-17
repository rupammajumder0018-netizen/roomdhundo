import React from "react";

export function SearchBar({
  query = "",
  onQueryChange,
  onSearch,
  stay = "monthly",
  onStayChange,
  isFilterOpen = false,
  onToggleFilter,
  showStayToggle = true,
  placeholder = "Where do you want to stay?",
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search properties by name or area"
        />
        <button
          type="button"
          onClick={onSearch}
          className="search-submit-btn"
          aria-label="Submit search"
        >
          Search
        </button>
      </div>

      {showStayToggle && (
        <div className="stay-selection" role="radiogroup" aria-label="Stay duration type">
          <button
            type="button"
            className={`search-stay-btn ${stay === "monthly" ? "active" : ""}`}
            onClick={() => onStayChange("monthly")}
            role="radio"
            aria-checked={stay === "monthly"}
          >
            Monthly
          </button>

          <button
            type="button"
            className={`search-stay-btn ${stay === "daily" ? "active" : ""}`}
            onClick={() => onStayChange("daily")}
            role="radio"
            aria-checked={stay === "daily"}
          >
            Daily / Nightly
          </button>

          {onToggleFilter && (
            <button
              type="button"
              className={`search-stay-btn filter-toggle-btn ${isFilterOpen ? "active" : ""}`}
              onClick={onToggleFilter}
              aria-expanded={isFilterOpen}
              aria-controls="searchFilterPanel"
            >
              Filters {isFilterOpen ? "▴" : "▾"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;

