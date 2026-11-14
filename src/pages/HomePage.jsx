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

const CATEGORY_MAP = {
  all: [],
  pgroom: ["PG", "Room"],
  hotel: ["Hotel", "Guest House"],
  flat: ["Flat"],
};

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
  const [flatOffer, setFlatOffer] = useState("rent");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
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

  const handleHeroSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (activeCategory !== "all") {
      const types = CATEGORY_MAP[activeCategory];
      if (types?.length === 1) sp.set("type", types[0]);
    }
    navigate(`/search?${sp.toString()}`);
  };

  // Filter properties client-side matching legacy script.js
  const filteredProperties = useMemo(() => {
    const agentFilterId = searchParams.get("agent");

    return properties.filter((b) => {
      // Agent filter if ?agent= is present
      if (agentFilterId && String(b.created_by) !== String(agentFilterId)) {
        return false;
      }

      // Category filter
      const allowedCategoryTypes = CATEGORY_MAP[activeCategory] || [];
      if (allowedCategoryTypes.length > 0 && !allowedCategoryTypes.includes(b.type)) {
        return false;
      }

      // Flat rent/sale offer filter
      if (activeCategory === "flat") {
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
        const price = b.minPrice;
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
            onClick={() => setActiveCategory("all")}
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

          <button
            type="button"
            className={`home-cat-tab ${activeCategory === "pgroom" ? "active" : ""}`}
            onClick={() => setActiveCategory("pgroom")}
            role="tab"
            aria-selected={activeCategory === "pgroom"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M3 20V8" />
              <path d="M3 14h18v6" />
              <path d="M21 14v-2a3 3 0 0 0-3-3h-7v5" />
              <circle cx="7" cy="11" r="1.6" />
            </svg>
            <span>PG / Room</span>
          </button>

          <button
            type="button"
            className={`home-cat-tab ${activeCategory === "hotel" ? "active" : ""}`}
            onClick={() => setActiveCategory("hotel")}
            role="tab"
            aria-selected={activeCategory === "hotel"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <rect x="5" y="3" width="14" height="18" rx="1" />
              <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
              <path d="M10 21v-3h4v3" />
            </svg>
            <span>Hotel</span>
          </button>

          <button
            type="button"
            className={`home-cat-tab ${activeCategory === "flat" ? "active" : ""}`}
            onClick={() => setActiveCategory("flat")}
            role="tab"
            aria-selected={activeCategory === "flat"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M3 11l9-7 9 7" />
              <path d="M5 10v10h14V10" />
              <path d="M10 20v-6h4v6" />
            </svg>
            <span>Flat</span>
          </button>
        </div>

        {/* Flat Rent / Sale Toggle */}
        {activeCategory === "flat" && (
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

        {/* Search Input and Filter Toggle */}
        <div className="home-search-panel">
          <form className="home-search-bar" onSubmit={handleHeroSearchSubmit}>
            <input
              type="text"
              placeholder={`Search verified stays near ${activeHub.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search properties"
            />
            <button type="submit" className="home-search-submit">
              Search
            </button>
            <button
              type="button"
              className={`home-filter-toggle-btn ${isFilterPanelOpen ? "is-open" : ""}`}
              onClick={() => setIsFilterPanelOpen((prev) => !prev)}
              aria-expanded={isFilterPanelOpen}
              aria-label="Toggle search filters"
            >
              Filters {isFilterPanelOpen ? "▴" : "▾"}
            </button>
          </form>

          {/* Collapsible Filter Panel */}
          {isFilterPanelOpen && (
            <div className="home-filter-panel" id="homeFilterPanel">
              <div className="home-filter-grid">
                <div className="home-filter-group">
                  <h3>Property Type</h3>
                  {["PG", "Room", "Hotel", "Flat", "Guest House"].map((type) => (
                    <label key={type}>
                      <input
                        type="checkbox"
                        checked={selectedPropertyTypes.includes(type)}
                        onChange={() => {
                          setSelectedPropertyTypes((prev) =>
                            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                          );
                        }}
                      />{" "}
                      {type}
                    </label>
                  ))}
                </div>

                <div className="home-filter-group">
                  <h3>Facilities</h3>
                  {[
                    { id: "wifi", label: "Wi-Fi" },
                    { id: "food", label: "Food" },
                    { id: "ac", label: "AC" },
                    { id: "kitchen", label: "Kitchen" },
                    { id: "couple-friendly", label: "Couple Friendly" },
                    { id: "furnished", label: "Furnished" },
                  ].map((fac) => (
                    <label key={fac.id}>
                      <input
                        type="checkbox"
                        checked={selectedFacilities.includes(fac.id)}
                        onChange={() => {
                          setSelectedFacilities((prev) =>
                            prev.includes(fac.id) ? prev.filter((f) => f !== fac.id) : [...prev, fac.id]
                          );
                        }}
                      />{" "}
                      {fac.label}
                    </label>
                  ))}
                </div>

                <div className="home-filter-group">
                  <h3>Monthly Budget</h3>
                  <div className="home-budget-inputs">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={minBudget}
                      onChange={(e) => setMinBudget(e.target.value)}
                    />
                    <span>–</span>
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="home-filter-actions">
                <button
                  type="button"
                  className="home-clear-filters"
                  onClick={() => {
                    setSelectedPropertyTypes([]);
                    setSelectedFacilities([]);
                    setMinBudget("");
                    setMaxBudget("");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PROPERTIES SECTION */}
      <section className="home-listings" aria-label="Available properties">
        <div className="home-listings-header">
          <p id="homeResultsCount">
            {isLoading
              ? "Loading properties..."
              : `Showing ${filteredProperties.length} ${
                  filteredProperties.length === 1 ? "stay" : "stays"
                } near ${activeHub.name}`}
          </p>
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
