import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  fetchPublishedProperties,
  fetchSavedProperties,
  toggleSavedProperty,
  ROOMDHUNDO_HUBS,
} from "../services/properties/index.js";
import { useAuth } from "../hooks/useAuth.js";
import { SearchBar } from "../components/search/SearchBar.jsx";
import { SearchFilters } from "../components/search/SearchFilters.jsx";
import { PropertyCard } from "../components/property/PropertyCard.jsx";
import { LoadingState } from "../components/common/LoadingState.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [properties, setProperties] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // URL-driven Filter States
  const queryParam = searchParams.get("q") || "";
  const stayParam = searchParams.get("stay") === "daily" ? "daily" : "monthly";
  const typeParam = searchParams.get("type") || "";
  const minParam = searchParams.get("min") || "";
  const maxParam = searchParams.get("max") || "";
  const sortParam = searchParams.get("sort") || "recommended";
  const hubParam = searchParams.get("hub") || localStorage.getItem("roomdhundo-location") || "MAKAUT";

  // Local filter draft state
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [stayType, setStayType] = useState(stayParam);
  const [minPrice, setMinPrice] = useState(minParam);
  const [maxPrice, setMaxPrice] = useState(maxParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState(
    typeParam ? typeParam.split(",").map((s) => s.trim()) : []
  );
  const [selectedRoomTypes, setSelectedRoomTypes] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState([]);

  // Active Hub
  const activeHub = useMemo(
    () => ROOMDHUNDO_HUBS.find((h) => h.name.toLowerCase() === hubParam.toLowerCase()) || ROOMDHUNDO_HUBS[0],
    [hubParam]
  );

  // Synchronize internal state when URL changes
  useEffect(() => {
    setSearchQuery(queryParam);
    setStayType(stayParam);
    setMinPrice(minParam);
    setMaxPrice(maxParam);
    setSortBy(sortParam);
    if (typeParam) {
      setSelectedPropertyTypes(typeParam.split(",").map((s) => s.trim()));
    }
  }, [queryParam, stayParam, typeParam, minParam, maxParam, sortParam]);

  // Load properties and saved state
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadProperties() {
      try {
        const { data } = await fetchPublishedProperties();
        if (!isMounted) return;
        if (data) setProperties(data);

        if (user?.id) {
          const savedRes = await fetchSavedProperties(user.id);
          if (savedRes.data) {
            setSavedIds(savedRes.data.map((row) => row.building_id).filter(Boolean));
          }
        }
      } catch (err) {
        console.warn("[Roomdhundo] Error loading search properties:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProperties();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Apply filters to URL
  const updateUrlParams = (updates = {}) => {
    const nextParams = new URLSearchParams(searchParams);

    const merged = {
      q: searchQuery.trim(),
      stay: stayType,
      type: selectedPropertyTypes.join(","),
      min: minPrice,
      max: maxPrice,
      sort: sortBy,
      hub: activeHub.name,
      ...updates,
    };

    Object.entries(merged).forEach(([key, val]) => {
      if (val) {
        nextParams.set(key, val);
      } else {
        nextParams.delete(key);
      }
    });

    setSearchParams(nextParams, { replace: true });
  };

  const handleSearchSubmit = () => {
    updateUrlParams({ q: searchQuery.trim() });
  };

  const handleStayChange = (nextStay) => {
    setStayType(nextStay);
    updateUrlParams({ stay: nextStay });
  };

  const handleSortChange = (e) => {
    const nextSort = e.target.value;
    setSortBy(nextSort);
    updateUrlParams({ sort: nextSort });
  };

  const handlePropertyTypeToggle = (type) => {
    setSelectedPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleRoomTypeToggle = (roomType) => {
    setSelectedRoomTypes((prev) =>
      prev.includes(roomType) ? prev.filter((t) => t !== roomType) : [...prev, roomType]
    );
  };

  const handleFacilityToggle = (facId) => {
    setSelectedFacilities((prev) =>
      prev.includes(facId) ? prev.filter((f) => f !== facId) : [...prev, facId]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedPropertyTypes([]);
    setSelectedRoomTypes([]);
    setSelectedFacilities([]);
    setSortBy("recommended");
    setSearchParams(new URLSearchParams({ stay: stayType, hub: activeHub.name }), { replace: true });
  };

  const handleToggleSave = async (buildingId, currentStatus) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/search" } } });
      return;
    }
    const nextStatus = !currentStatus;
    setSavedIds((prev) =>
      nextStatus ? [...prev, buildingId] : prev.filter((id) => id !== buildingId)
    );
    await toggleSavedProperty(user.id, buildingId, currentStatus);
  };

  // Filter and sort listings
  const filteredAndSortedProperties = useMemo(() => {
    const isDaily = stayType === "daily";
    const q = searchQuery.toLowerCase().trim();
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    const filtered = properties.filter((b) => {
      // Query filter
      if (q) {
        const matchesName = String(b.name || "").toLowerCase().includes(q);
        const matchesLocation = String(b.location || "").toLowerCase().includes(q);
        if (!matchesName && !matchesLocation) return false;
      }

      const roomTypes = Array.isArray(b.room_types) ? b.room_types : [];

      // Daily mode filter: must have priced daily rooms
      if (isDaily) {
        const hasDailyRooms = roomTypes.some(
          (rt) => rt.daily_price != null && Number(rt.daily_price) > 0
        );
        if (!hasDailyRooms) return false;
      }

      // Budget filter
      if (min !== null || max !== null) {
        const priceFits = roomTypes.some((rt) => {
          const price = isDaily ? rt.daily_price : rt.price_value;
          if (price == null || price === "") return false;
          const numPrice = Number(price);
          if (min !== null && numPrice < min) return false;
          if (max !== null && numPrice > max) return false;
          return true;
        });
        if (!priceFits && roomTypes.length > 0) return false;
      }

      // Property type filter
      if (selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes(b.type)) {
        return false;
      }

      // Room type sharing filter
      if (selectedRoomTypes.length > 0) {
        const hasRoomType = roomTypes.some((rt) => selectedRoomTypes.includes(rt.room_type));
        if (!hasRoomType) return false;
      }

      // Facility filter
      if (selectedFacilities.length > 0) {
        const tags = Array.isArray(b.facility_tags) ? b.facility_tags : [];
        const labels = Array.isArray(b.facilities) ? b.facilities : [];
        const matchesAll = selectedFacilities.every(
          (fac) =>
            tags.includes(fac) ||
            labels.includes(fac) ||
            (fac === "couple-friendly" && b.isCoupleFriendly)
        );
        if (!matchesAll) return false;
      }

      return true;
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      const priceA = isDaily ? a.minDailyPrice || Infinity : a.minPrice || Infinity;
      const priceB = isDaily ? b.minDailyPrice || Infinity : b.minPrice || Infinity;

      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      if (sortBy === "rating") return (Number(b.avgRating) || 0) - (Number(a.avgRating) || 0);
      return 0; // Default: 'recommended' (preserves order)
    });
  }, [
    properties,
    searchQuery,
    stayType,
    minPrice,
    maxPrice,
    selectedPropertyTypes,
    selectedRoomTypes,
    selectedFacilities,
    sortBy,
  ]);

  return (
    <div className="search-page-wrapper">
      {/* SEARCH HEADER */}
      <section className="search-header">
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSearch={handleSearchSubmit}
          stay={stayType}
          onStayChange={handleStayChange}
          isFilterOpen={isFilterOpen}
          onToggleFilter={() => setIsFilterOpen((prev) => !prev)}
        />

        <SearchFilters
          isOpen={isFilterOpen}
          stay={stayType}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          propertyTypes={selectedPropertyTypes}
          onPropertyTypeToggle={handlePropertyTypeToggle}
          roomTypes={selectedRoomTypes}
          onRoomTypeToggle={handleRoomTypeToggle}
          facilities={selectedFacilities}
          onFacilityToggle={handleFacilityToggle}
          onApply={() => {
            updateUrlParams();
            setIsFilterOpen(false);
          }}
          onClear={handleClearFilters}
        />
      </section>

      {/* MAIN RESULTS CONTAINER */}
      <main className="search-container">
        <section className="results">
          <div className="results-top">
            <div>
              <h1>Accommodation near {activeHub.name}</h1>
              <p id="resultsCount">
                {isLoading
                  ? "Loading properties..."
                  : `Showing ${filteredAndSortedProperties.length} ${
                      filteredAndSortedProperties.length === 1 ? "property" : "properties"
                    }`}
              </p>
            </div>

            <div className="results-sort">
              <label htmlFor="sortSelect" className="sr-only">
                Sort results
              </label>
              <select
                id="sortSelect"
                value={sortBy}
                onChange={handleSortChange}
                aria-label="Sort search results"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <LoadingState message="Searching verified properties..." />
          ) : filteredAndSortedProperties.length > 0 ? (
            <div className="results-list" id="resultsList">
              {filteredAndSortedProperties.map((building) => (
                <PropertyCard
                  key={building.id}
                  building={building}
                  activeHub={activeHub}
                  isSaved={savedIds.includes(building.id)}
                  onToggleSave={handleToggleSave}
                  isDaily={stayType === "daily"}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No properties match your filters"
              message="Try broadening your search, removing price constraints, or switching stay duration."
              actionText="Reset Filters"
              onAction={handleClearFilters}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default SearchPage;

