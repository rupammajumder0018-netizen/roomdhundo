import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  fetchSavedProperties,
  toggleSavedProperty,
  attachComputedFields,
} from "../../services/properties/index.js";
import { PATHS } from "../../routes/paths.js";
import { SavedPropertyCard } from "../../components/user/SavedPropertyCard.jsx";

export function SavedPropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const loadSaved = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await fetchSavedProperties(user.id);
      if (fetchErr) {
        setError(fetchErr.message || "Failed to load saved properties.");
        setProperties([]);
      } else {
        const items = (data || [])
          .map((row) => (row.buildings ? attachComputedFields(row.buildings) : null))
          .filter(Boolean);
        setProperties(items);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const handleRemove = async (buildingId) => {
    if (!user?.id || !buildingId) return;
    setRemovingId(buildingId);

    try {
      const { error: removeErr } = await toggleSavedProperty(
        user.id,
        buildingId,
        true
      );

      if (removeErr) {
        alert("Failed to remove property: " + removeErr.message);
      } else {
        setProperties((prev) => prev.filter((p) => p.id !== buildingId));
      }
    } catch (err) {
      console.error("[Roomdhundo] Error removing saved property:", err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="saved-page">
      <div className="saved-header">
        <h1>❤️ Saved Properties</h1>
        <p>Properties you have saved for later.</p>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--rd-muted, #3a6f86)" }}>
            Loading your saved properties...
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "16px",
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "10px",
            color: "#b91c1c",
            marginBottom: "24px",
          }}
        >
          {error}
        </div>
      )}

      {!isLoading && !error && properties.length === 0 && (
        <div className="empty-saved" id="emptySaved">
          <div className="empty-icon" aria-hidden="true">
            ♡
          </div>
          <h2>No saved properties</h2>
          <p>Save properties you like and find them here later.</p>
          <Link to={PATHS.SEARCH}>Explore Properties</Link>
        </div>
      )}

      {!isLoading && !error && properties.length > 0 && (
        <div
          className="saved-properties-grid"
          id="savedPropertiesContainer"
        >
          {properties.map((prop) => (
            <SavedPropertyCard
              key={prop.id}
              property={prop}
              onRemove={handleRemove}
              isRemoving={removingId === prop.id}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default SavedPropertiesPage;
