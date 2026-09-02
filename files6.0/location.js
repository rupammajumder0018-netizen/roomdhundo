// ============================================================
// ROOMDHUNDO LOCATION SYSTEM
// Users pick only the areas we serve: MAKAUT, Jaguli, Haringhata.
// GPS is not used for the navbar. getUserLocation stays for listing a property.
// ============================================================

const LOCATION_NAME_KEY = "roomdhundo-location";
const LOCATION_COORDS_KEY = "roomdhundo_user_location";
const ACTIVE_HUB_KEY = "roomdhundo-active-hub";
const RECENT_KEY = "roomdhundo-recent-locations";
const DEFAULT_HUB_NAME = "MAKAUT";

const ROOMDHUNDO_HUBS = [
    {
        name: "MAKAUT",
        latitude: 22.95704,
        longitude: 88.54346,
        aliases: ["makaut", "wbut", "wbutech", "simhat", "makaut campus"]
    },
    {
        name: "Jaguli",
        latitude: 22.9328,
        longitude: 88.5383,
        aliases: ["jaguli", "jagulia", "jaguli more"]
    },
    {
        name: "Haringhata",
        latitude: 22.960,
        longitude: 88.567,
        aliases: ["haringhata", "haringhata bazar", "haringhata town"]
    }
];

const SERVED_AREA_NAMES = ROOMDHUNDO_HUBS.map((hub) => hub.name).join(", ");

let userLocation = null;

function normalizePlace(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getNavLocationLabel() {
    return document.getElementById("navLocationLabel");
}

function getHubByName(name) {
    if (!name) return null;
    return (
        ROOMDHUNDO_HUBS.find(
            (hub) => hub.name.toLowerCase() === String(name).toLowerCase()
        ) || null
    );
}

function isServedHubName(name) {
    return Boolean(getHubByName(name));
}

function resolveServedHub(query) {
    const q = normalizePlace(query);
    if (!q) return null;

    return (
        ROOMDHUNDO_HUBS.find((hub) => normalizePlace(hub.name) === q) ||
        ROOMDHUNDO_HUBS.find((hub) => hub.aliases.includes(q)) ||
        null
    );
}

function setActiveHub(hubName, { announce = true } = {}) {
    const hub = getHubByName(hubName) || getHubByName(DEFAULT_HUB_NAME);
    localStorage.setItem(ACTIVE_HUB_KEY, hub.name);

    if (announce) {
        window.dispatchEvent(
            new CustomEvent("roomdhundo:location-changed", {
                detail: { place: hub.name, hub, served: true }
            })
        );
    }

    return hub;
}

function getActiveHub() {
    return getHubByName(localStorage.getItem(ACTIVE_HUB_KEY)) || getHubByName(DEFAULT_HUB_NAME);
}

function applyHubToPill(hub, { save = true, remember = false, announce = true } = {}) {
    const label = getNavLocationLabel();
    if (label) {
        label.textContent = hub.name;
        label.title = hub.name;
    }

    const locationInput = document.getElementById("locationPillInput");
    if (locationInput) locationInput.value = hub.name;

    if (save) {
        localStorage.setItem(LOCATION_NAME_KEY, hub.name);
        localStorage.setItem(ACTIVE_HUB_KEY, hub.name);
    }

    if (remember) {
        addRecentLocation(hub.name);
    }

    if (announce) {
        window.dispatchEvent(
            new CustomEvent("roomdhundo:location-changed", {
                detail: { place: hub.name, hub, served: true }
            })
        );
    }

    return hub;
}

function setLocationLabel(place, options = {}) {
    const hub = resolveServedHub(place);
    if (!hub) return null;
    applyHubToPill(hub, options);
    return hub;
}

function chooseServedLocation(place, options = {}) {
    const hub = setLocationLabel(place, {
        save: true,
        remember: true,
        announce: true,
        ...options
    });

    return {
        ok: Boolean(hub),
        hub,
        message: hub
            ? `Showing properties near ${hub.name}.`
            : `Choose ${SERVED_AREA_NAMES}.`
    };
}

function addRecentLocation(place) {
    if (!isServedHubName(place)) return;

    let recent = [];

    try {
        recent = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch (error) {
        recent = [];
    }

    recent = recent.filter(
        (item) =>
            isServedHubName(item) &&
            String(item).toLowerCase() !== String(place).toLowerCase()
    );
    recent.unshift(place);
    recent = recent.slice(0, 3);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

function sanitizeSavedLocations() {
    const savedName = localStorage.getItem(LOCATION_NAME_KEY);
    if (savedName && !isServedHubName(savedName)) {
        localStorage.removeItem(LOCATION_NAME_KEY);
    }

    const savedHub = localStorage.getItem(ACTIVE_HUB_KEY);
    if (savedHub && !isServedHubName(savedHub)) {
        localStorage.setItem(ACTIVE_HUB_KEY, DEFAULT_HUB_NAME);
    }

    try {
        const recent = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
        localStorage.setItem(RECENT_KEY, JSON.stringify(recent.filter(isServedHubName).slice(0, 3)));
    } catch (error) {
        localStorage.removeItem(RECENT_KEY);
    }
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
}

function getHubDistances(latitude, longitude) {
    return ROOMDHUNDO_HUBS.map((hub) => ({
        hub,
        distanceKm: calculateDistanceKm(
            latitude,
            longitude,
            hub.latitude,
            hub.longitude
        )
    })).sort((a, b) => a.distanceKm - b.distanceKm);
}

function roundKm(distanceKm) {
    const value = Number(distanceKm);
    if (!Number.isFinite(value) || value < 0) return null;
    return Math.round(value * 10) / 10;
}

function hasValidServiceCoords(building) {
    const lat = Number(building?.latitude);
    const lng = Number(building?.longitude);

    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= 22.88 &&
        lat <= 23.05 &&
        lng >= 88.48 &&
        lng <= 88.65
    );
}

function getStoredMakautDistance(building) {
    const stored = Number(building?.distance_km);
    if (!Number.isFinite(stored) || stored < 0) return null;
    // Older bad GPS saves can be 40–2000 km. Keep only campus-scale values.
    if (stored > 20) return null;
    return stored;
}

function listingMatchesHub(building, hub) {
    const text = `${building?.location || ""} ${building?.name || ""}`.toLowerCase();
    return (
        text.includes(hub.name.toLowerCase()) ||
        hub.aliases.some((alias) => text.includes(alias))
    );
}

function getBuildingDistanceToHub(building, hub = getActiveHub()) {
    if (hasValidServiceCoords(building)) {
        return roundKm(
            calculateDistanceKm(
                hub.latitude,
                hub.longitude,
                Number(building.latitude),
                Number(building.longitude)
            )
        );
    }

    const fromMakaut = getStoredMakautDistance(building);
    const makaut = getHubByName("MAKAUT");

    if (hub.name === "MAKAUT") {
        if (fromMakaut != null) return roundKm(fromMakaut);
        return listingMatchesHub(building, hub) ? 0.8 : 3.5;
    }

    const hubOffset = calculateDistanceKm(
        makaut.latitude,
        makaut.longitude,
        hub.latitude,
        hub.longitude
    );

    if (listingMatchesHub(building, hub)) {
        return roundKm(fromMakaut != null ? Math.max(0.3, Math.abs(fromMakaut - hubOffset)) : 0.8);
    }

    if (fromMakaut != null) {
        // Listing was measured from MAKAUT. Estimate the other hub without adding fake kilometres.
        return roundKm(Math.max(0.3, Math.abs(fromMakaut - hubOffset)));
    }

    return roundKm(hubOffset + 1.2);
}

function sortBuildingsByActiveHub(buildings) {
    const hub = getActiveHub();
    return [...(buildings || [])].sort((a, b) => {
        return getBuildingDistanceToHub(a, hub) - getBuildingDistanceToHub(b, hub);
    });
}

function formatHubDistance(distanceKm) {
    if (distanceKm == null || Number.isNaN(Number(distanceKm))) return "—";
    return `${Number(distanceKm).toFixed(1)} km`;
}

function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by this browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                userLocation = location;
                localStorage.setItem(LOCATION_COORDS_KEY, JSON.stringify(location));
                resolve(location);
            },
            (error) => {
                let message = "Unable to get your location.";
                if (error.code === error.PERMISSION_DENIED) {
                    message = "Location permission was denied. Please allow location access in your browser.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = "Your location is currently unavailable.";
                } else if (error.code === error.TIMEOUT) {
                    message = "Location request timed out. Please try again.";
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });
}

function loadSavedUserLocation() {
    try {
        const saved = localStorage.getItem(LOCATION_COORDS_KEY);
        if (!saved) return null;
        userLocation = JSON.parse(saved);
        return userLocation;
    } catch (error) {
        return null;
    }
}

function getCurrentUserLocation() {
    if (userLocation) return userLocation;
    return loadSavedUserLocation();
}

window.roomdhundoLocation = {
    setLocation: setLocationLabel,
    chooseServedLocation,
    resolveServedHub,
    addRecentLocation,
    getUserLocation,
    getActiveHub,
    setActiveHub,
    getHubDistances,
    getBuildingDistanceToHub,
    sortBuildingsByActiveHub,
    formatHubDistance,
    hubs: ROOMDHUNDO_HUBS,
    servedAreaNames: SERVED_AREA_NAMES,
    key: LOCATION_NAME_KEY,
    recentKey: RECENT_KEY
};

document.addEventListener("DOMContentLoaded", () => {
    sanitizeSavedLocations();

    const savedName = localStorage.getItem(LOCATION_NAME_KEY);
    const savedHub =
        getHubByName(localStorage.getItem(ACTIVE_HUB_KEY)) || resolveServedHub(savedName);
    const hub = savedHub || getHubByName(DEFAULT_HUB_NAME);

    applyHubToPill(hub, {
        save: Boolean(savedHub),
        remember: false,
        announce: false
    });
});
