// ============================================================
// ROOMDHUNDO LOCATION SYSTEM
// ============================================================

let userLocation = null;

// ------------------------------------------------------------
// GET USER'S CURRENT LOCATION
// ------------------------------------------------------------

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

                // Save temporarily for search
                localStorage.setItem(
                    "roomdhundo_user_location",
                    JSON.stringify(location)
                );

                resolve(location);
            },

            (error) => {

                let message = "Unable to get your location.";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = "Location permission was denied.";
                        break;

                    case error.POSITION_UNAVAILABLE:
                        message = "Your location is currently unavailable.";
                        break;

                    case error.TIMEOUT:
                        message = "Location request timed out.";
                        break;
                }

                reject(new Error(message));
            },

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000
            }
        );
    });
}


// ------------------------------------------------------------
// LOAD PREVIOUS LOCATION
// ------------------------------------------------------------

function loadSavedUserLocation() {

    try {

        const saved =
            localStorage.getItem("roomdhundo_user_location");

        if (!saved) {
            return null;
        }

        userLocation = JSON.parse(saved);

        return userLocation;

    } catch (error) {

        console.error(
            "Could not load saved location:",
            error
        );

        return null;
    }
}


// ------------------------------------------------------------
// CLEAR USER LOCATION
// ------------------------------------------------------------

function clearUserLocation() {

    userLocation = null;

    localStorage.removeItem(
        "roomdhundo_user_location"
    );
}


// ------------------------------------------------------------
// GET LOCATION
// ------------------------------------------------------------

function getCurrentUserLocation() {

    if (userLocation) {
        return userLocation;
    }

    return loadSavedUserLocation();
}


// ------------------------------------------------------------
// DISTANCE BETWEEN TWO GPS POINTS
// ------------------------------------------------------------

function calculateDistanceKm(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius = 6371;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)
        +
        Math.cos(
            lat1 * Math.PI / 180
        )
        *
        Math.cos(
            lat2 * Math.PI / 180
        )
        *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;
}


// ------------------------------------------------------------
// "USE MY LOCATION" BUTTON (nav dropdown)
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    const button =
        document.getElementById("useMyLocationBtn");

    const status =
        document.getElementById("locationStatus");

    if (!button) return;

    button.addEventListener("click", async () => {

        button.disabled = true;

        status.textContent =
            "Getting your location...";

        try {

            const location =
                await getUserLocation();

            console.log(
                "User latitude:",
                location.latitude
            );

            console.log(
                "User longitude:",
                location.longitude
            );

            status.textContent =
                "📍 Location detected";

            button.textContent =
                "📍 Location Active";

            // Start nearby property search
            if (typeof loadNearbyProperties === "function") {
                await loadNearbyProperties();
            }

        } catch (error) {

            console.error(error);

            status.textContent =
                "❌ " + error.message;

        } finally {

            button.disabled = false;
        }
    });

});