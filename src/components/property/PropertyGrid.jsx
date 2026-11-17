import React from "react";
import { PropertyCard } from "./PropertyCard.jsx";

export function PropertyGrid({
  properties = [],
  activeHub,
  savedIds = [],
  onToggleSave,
  isDaily = false,
  className = "",
}) {
  return (
    <div className={`property-grid ${className}`}>
      {properties.map((building) => (
        <PropertyCard
          key={building.id}
          building={building}
          activeHub={activeHub}
          isSaved={savedIds.includes(building.id)}
          onToggleSave={onToggleSave}
          isDaily={isDaily}
        />
      ))}
    </div>
  );
}

export default PropertyGrid;

