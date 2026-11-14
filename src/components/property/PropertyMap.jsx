import React, { useEffect, useRef, useState } from "react";

export function PropertyMap({
  latitude,
  longitude,
  propertyName = "Property Location",
  locationName = "",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(
    typeof window !== "undefined" && Boolean(window.L)
  );

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng);

  // Dynamically load Leaflet JS if not already available
  useEffect(() => {
    if (typeof window === "undefined" || window.L) {
      setLeafletLoaded(true);
      return;
    }

    const scriptId = "leaflet-js-cdn";
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.crossOrigin = "";
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", () => setLeafletLoaded(true));
    }
  }, []);

  // Initialize and tear down map instance
  useEffect(() => {
    if (!leafletLoaded || !hasValidCoords || !mapContainerRef.current) {
      return;
    }

    // Prevent duplicate map instances
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const L = window.L;
      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: false,
      }).setView([lat, lng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add Property Marker
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`<strong>${propertyName}</strong><br/>${locationName || "📍 Verified Location"}`).openPopup();

      mapInstanceRef.current = map;

      // Fix render sizing issue on initial load
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } catch (err) {
      console.warn("[Roomdhundo Map] Leaflet initialization error:", err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, hasValidCoords, lat, lng, propertyName, locationName]);

  if (!hasValidCoords) {
    return null;
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

  return (
    <section className="property-map-section" aria-label="Location Map" style={{ marginBottom: "36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h2 style={{ fontSize: "20px", color: "var(--rd-text, #22577A)" }}>
          Location & Surroundings
        </h2>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="map-directions-btn"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            padding: "6px 14px",
            borderRadius: "8px",
            background: "var(--rd-surface, #fff)",
            border: "1px solid var(--rd-accent, #38A3A5)",
            color: "var(--rd-accent, #38A3A5)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>Get Directions</span> ↗
        </a>
      </div>

      <div
        id="roomdhundoMap"
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "18px",
          border: "1px solid var(--rd-border, #c6ead9)",
          overflow: "hidden",
          boxShadow: "var(--rd-shadow, 0 14px 34px rgba(34, 87, 122, 0.08))",
        }}
      />
    </section>
  );
}

export default PropertyMap;

