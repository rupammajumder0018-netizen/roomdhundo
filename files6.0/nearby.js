// ============================================================
// ROOMDHUNDO NEARBY PROPERTIES
// Depends on: location.js (getCurrentUserLocation, calculateDistanceKm)
//             script.js (supabaseClient)
// ============================================================

async function loadNearbyProperties() {

    const location = getCurrentUserLocation();

    if (!location) {
        alert("Please enable your location first.");
        return [];
    }

    const { data, error } = await supabaseClient
        .from("buildings")
        .select("*, room_types(*), reviews(*)")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

    if (error) {
        console.error("Nearby property error:", error);
        return [];
    }

    const properties = data.map(property => {

        const distance = calculateDistanceKm(
            location.latitude,
            location.longitude,
            property.latitude,
            property.longitude
        );

        return {
            ...property,
            calculated_distance_km: distance
        };
    });

    properties.sort(
        (a, b) =>
            a.calculated_distance_km -
            b.calculated_distance_km
    );

    return properties;
}


function filterPropertiesByDistance(
    properties,
    maxDistance
) {
    return properties.filter(
        property =>
            property.calculated_distance_km <= maxDistance
    );
}


function formatDistance(distance) {

    if (distance == null || isNaN(distance)) {
        return "Distance unavailable";
    }

    if (distance < 1) {
        return `${Math.round(distance * 1000)} m away`;
    }

    return `${distance.toFixed(1)} km away`;
}