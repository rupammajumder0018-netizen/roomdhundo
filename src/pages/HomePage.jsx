import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchPublishedProperties,
  fetchApprovedAgents,
  toggleSavedProperty,
  fetchSavedProperties,
  ROOMDHUNDO_HUBS,
} from "../services/properties/index.js";
import { useAuth } from "../hooks/useAuth.js";
import { PropertyCard } from "../components/property/PropertyCard.jsx";
import { LoadingState } from "../components/common/LoadingState.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { CategoryIcon } from "../components/common/CategoryIcon.jsx";
import {
  PROPERTY_CATEGORIES,
  CATEGORY_MAP_BY_ID,
  getCategoryById,
  toggleSubcategorySelection,
  matchesCategoryFilter,
} from "../constants/categories.js";

export function HomePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedSubcategories, setSelectedSubcategories] = useState(["All"]);
  const [flatOffer, setFlatOffer] = useState("rent");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Active Hub from localStorage or query or default
  const activeHubName = searchParams.get("hub") || localStorage.getItem("roomdhundo-location") || "MAKAUT";
  const activeHub = useMemo(
    () => ROOMDHUNDO_HUBS.find((h) => h.name.toLowerCase() === activeHubName.toLowerCase()) || ROOMDHUNDO_HUBS[0],
    [activeHubName]
  );

  // Load properties, saved properties, and agents
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const [propsRes, agentsRes] = await Promise.all([
          fetchPublishedProperties(),
          fetchApprovedAgents(),
        ]);

        if (!isMounted) return;

        if (propsRes.data) {
          setProperties(propsRes.data);
        }
        if (agentsRes.data) {
          setAgents(agentsRes.data);
        }

        if (user?.id) {
          const savedRes = await fetchSavedProperties(user.id);
          if (savedRes.data) {
            setSavedIds(savedRes.data.map((row) => row.building_id).filter(Boolean));
          }
        }
      } catch (err) {
        console.warn("[Roomdhundo] Error loading homepage data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleSave = async (buildingId, currentStatus) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/" } } });
      return;
    }
    const nextStatus = !currentStatus;
    setSavedIds((prev) =>
      nextStatus ? [...prev, buildingId] : prev.filter((id) => id !== buildingId)
    );
    await toggleSavedProperty(user.id, buildingId, currentStatus);
  };

  const handleCategoryTabClick = (catId) => {
    setActiveCategory(catId);
    setSelectedSubcategories(["All"]);
  };

  const handleSubcategoryChipClick = (sub) => {
    setSelectedSubcategories((prev) => toggleSubcategorySelection(prev, sub, true));
  };

  const handleHeroSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (activeCategory !== "all") {
      sp.set("category", activeCategory);
      if (!selectedSubcategories.includes("All") && selectedSubcategories.length > 0) {
        sp.set("sub", selectedSubcategories.join(","));
      }
    }
    navigate(`/search?${sp.toString()}`);
  };

  const listingPrice = (building) => {
    if (
      building.isDailyStay ||
      activeCategory === "hotels_stays" ||
      activeCategory === "event_spaces"
    ) {
      const nightly = Number(building.minDailyPrice);
      if (Number.isFinite(nightly) && nightly > 0) return nightly;
    }
    const monthly = Number(building.minPrice);
    if (Number.isFinite(monthly) && monthly > 0) return monthly;
    const nightly = Number(building.minDailyPrice);
    if (Number.isFinite(nightly) && nightly > 0) return nightly;
    return null;
  };

  // Filter properties client-side matching dynamic categories
  const filteredProperties = useMemo(() => {
    const agentFilterId = searchParams.get("agent");

    const matched = properties.filter((b) => {
      // Agent filter if ?agent= is present
      if (agentFilterId && String(b.created_by) !== String(agentFilterId)) {
        return false;
      }

      // Dynamic Category & Subcategory filter using central matching logic
      if (!matchesCategoryFilter(b, activeCategory, selectedSubcategories)) {
        return false;
      }

      // Flat rent/sale offer filter
      if (activeCategory === "flats_rentals" || activeCategory === "flat") {
        const isSale = String(b.flat_offer || "").toLowerCase() === "sale";
        if (flatOffer === "sale" && !isSale) return false;
        if (flatOffer === "rent" && isSale) return false;
      }

      // Search query filter (name, location)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = String(b.name || "").toLowerCase().includes(q);
        const matchesLocation = String(b.location || "").toLowerCase().includes(q);
        if (!matchesName && !matchesLocation) return false;
      }

      // Property type checkboxes (from drawer)
      if (selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes(b.type)) {
        return false;
      }

      // Budget filter
      if (minBudget || maxBudget) {
        const min = minBudget ? Number(minBudget) : 0;
        const max = maxBudget ? Number(maxBudget) : Infinity;
        const price = b.minPrice || b.minDailyPrice;
        if (price == null || price < min || price > max) return false;
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

    if (!sortBy) return matched;

    const sorted = [...matched];
    if (sortBy === "price-asc" || sortBy === "price-desc") {
      sorted.sort((a, b) => {
        const priceA = listingPrice(a);
        const priceB = listingPrice(b);
        if (priceA == null && priceB == null) return 0;
        if (priceA == null) return 1;
        if (priceB == null) return -1;
        return sortBy === "price-asc" ? priceA - priceB : priceB - priceA;
      });
    } else if (sortBy === "rating") {
      sorted.sort((a, b) => {
        const ratingA = Number(a.avgRating);
        const ratingB = Number(b.avgRating);
        const hasA = Number.isFinite(ratingA) && ratingA > 0;
        const hasB = Number.isFinite(ratingB) && ratingB > 0;
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return ratingB - ratingA;
      });
    }
    return sorted;
  }, [
    properties,
    activeCategory,
    flatOffer,
    searchQuery,
    selectedPropertyTypes,
    minBudget,
    maxBudget,
    selectedFacilities,
    searchParams,
    sortBy,
  ]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="home-page-container">
      {/* HERO SECTION */}
      <section className="hero home-hero">
        <h1>Find a place that feels right.</h1>

        {/* Category Tabs */}
        <div className="home-category-tabs" role="tablist" aria-label="Property category">
          <button
            type="button"
            className={`home-cat-tab ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => handleCategoryTabClick("all")}
            role="tab"
            aria-selected={activeCategory === "all"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>All</span>
          </button>

          {PROPERTY_CATEGORIES.map((cat) => {
            const isTabActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`home-cat-tab ${isTabActive ? "active" : ""}`}
                onClick={() => handleCategoryTabClick(cat.id)}
                role="tab"
                aria-selected={isTabActive}
              >
                <span className="home-cat-icon">
                  <CategoryIcon categoryId={cat.id} size={18} />
                </span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Subcategory Chips Row */}
        {activeCategory !== "all" && getCategoryById(activeCategory) && (
          <div className="home-subcategory-chips-bar" role="toolbar" aria-label="Filter by subcategory">
            {getCategoryById(activeCategory).subcategories.map((sub) => {
              const isChipSelected = selectedSubcategories.includes(sub);
              return (
                <button
                  key={sub}
                  type="button"
                  className={`home-subcat-chip ${isChipSelected ? "is-active" : ""}`}
                  onClick={() => handleSubcategoryChipClick(sub)}
                  aria-pressed={isChipSelected}
                >
                  {isChipSelected && <span className="chip-check">✓ </span>}
                  {sub}
                </button>
              );
            })}
          </div>
        )}

        {/* Flat Rent / Sale Toggle */}
        {(activeCategory === "flats_rentals" || activeCategory === "flat") && (
          <div className="home-flat-offer" role="tablist" aria-label="Flat listing offer">
            <button
              type="button"
              className={`home-flat-offer-btn ${flatOffer === "rent" ? "is-active" : ""}`}
              onClick={() => setFlatOffer("rent")}
              role="tab"
              aria-selected={flatOffer === "rent"}
            >
              On rent
            </button>
            <button
              type="button"
              className={`home-flat-offer-btn ${flatOffer === "sale" ? "is-active" : ""}`}
              onClick={() => setFlatOffer("sale")}
              role="tab"
              aria-selected={flatOffer === "sale"}
            >
              For sale
            </button>
          </div>
        )}

        {/* Search Input */}
        <div className="home-search-panel">
          <form className="home-search-bar" onSubmit={handleHeroSearchSubmit}>
            <div className="home-search-input-wrapper">
              <svg
                className="home-search-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <select
                className="home-sort-select"
                aria-label="Sort listings in this section"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="">Sort</option>
                <option value="price-asc">Low to high</option>
                <option value="price-desc">High to low</option>
                <option value="rating">Rating</option>
              </select>
              <input
                type="text"
                id="heroSearchInput"
                placeholder="PG, landmark, or location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search properties"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="home-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search input"
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="home-search-submit" id="heroSearchBtn" aria-label="Search">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>
      </section>

      {/* PROPERTIES SECTION */}
      <section className="home-listings" aria-label="Available properties">
        <div className="home-listings-header">
          <div className="home-listings-header-left">
            <h2 className="home-results-heading">
              {activeCategory === "all"
                ? "Available Stays"
                : activeCategory === "pgroom"
                ? "PGs & Rooms"
                : activeCategory === "hotel"
                ? "Hotels & Guest Houses"
                : flatOffer === "sale"
                ? "Flats for Sale"
                : "Flats for Rent"}
            </h2>
            <p id="homeResultsCount" className="home-results-count">
              {isLoading
                ? "Loading properties..."
                : (() => {
                    const one =
                      activeCategory === "flat"
                        ? flatOffer === "sale"
                          ? "flat for sale"
                          : "flat on rent"
                        : "property";
                    const many =
                      activeCategory === "flat"
                        ? flatOffer === "sale"
                          ? "flats for sale"
                          : "flats on rent"
                        : "properties";
                    return filteredProperties.length === 0
                      ? `0 ${many} found`
                      : `${filteredProperties.length} ${
                          filteredProperties.length === 1 ? one : many
                        } found`;
                  })()}
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              className="home-clear-query-pill"
              onClick={() => setSearchQuery("")}
            >
              Clear filter ✕
            </button>
          )}
        </div>

        {isLoading ? (
          <LoadingState message="Finding verified stays..." />
        ) : filteredProperties.length > 0 ? (
          <div className="home-results-list" id="homeResultsList">
            {filteredProperties.map((building) => (
              <PropertyCard
                key={building.id}
                building={building}
                activeHub={activeHub}
                isSaved={savedIds.includes(building.id)}
                onToggleSave={handleToggleSave}
                isDaily={activeCategory === "hotel"}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No properties match your filters"
            message={`We couldn't find listings matching your current criteria near ${activeHub.name}. Try adjusting your search term or clearing filters.`}
            actionText="Clear All Filters"
            onAction={() => {
              setActiveCategory("all");
              setSearchQuery("");
              setSelectedPropertyTypes([]);
              setSelectedFacilities([]);
              setMinBudget("");
              setMaxBudget("");
              setSortBy("");
            }}
          />
        )}
      </section>

      {/* AGENTS SECTION */}
      {agents.length > 0 && (
        <section className="home-agents" id="homeAgentsSection" aria-label="Approved Agents">
          <div className="home-agents-header">
            <h2>Pg Dhundo Agents</h2>
            <p>Approved agents who list properties on behalf of owners.</p>
          </div>
          <div className="home-agents-list" id="homeAgentsList">
            {agents.map((agent) => {
              const fullName = `${agent.first_name || ""} ${agent.last_name || ""}`.trim() || "Verified Agent";
              return (
                <article key={agent.user_id} className="home-agent-card">
                  <p className="home-agent-badge">Pg Dhundo Agent</p>
                  <h3>{fullName}</h3>
                  <p className="home-agent-meta">{agent.location || "Verified Agent"}</p>
                  <Link
                    to={`/?agent=${encodeURIComponent(agent.user_id)}`}
                    className="home-agent-cta"
                  >
                    View properties
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* BACK TO TOP BUTTON */}
      {showBackToTop && (
        <button
          type="button"
          className="home-back-to-top"
          id="homeBackToTopBtn"
          onClick={scrollToTop}
          aria-label="Return to top"
          title="Return to top"
        >
          ↑ Top
        </button>
      )}
    </div>
  );
}

export default HomePage;
