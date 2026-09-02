// ============================================================
// ROOMDHUNDO PROPERTY MAP
// OWNER LOCATION + RENTER PROPERTY MAP
// ============================================================


// ============================================================
// MAKAUT LOCATION
// ============================================================

// RoomDhundo MAKAUT reference point
const MAKAUT_LOCATION = {
    latitude: 22.944,
    longitude: 88.532
};


// ============================================================
// OWNER MAP
// ============================================================

let propertyMap = null;
let propertyMarker = null;


// ============================================================
// RENTER MAP
// ============================================================

let roomdhundoMap = null;
let roomMarkers = [];


// ============================================================
// CALCULATE DISTANCE FROM MAKAUT
// ============================================================

function calculatePropertyDistanceFromMAKAUT(
    latitude,
    longitude
) {

    const earthRadius = 6371;

    const dLat =
        (latitude - MAKAUT_LOCATION.latitude)
        * Math.PI / 180;

    const dLon =
        (longitude - MAKAUT_LOCATION.longitude)
        * Math.PI / 180;

    const lat1 =
        MAKAUT_LOCATION.latitude
        * Math.PI / 180;

    const lat2 =
        latitude
        * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)
        +
        Math.cos(lat1) *
        Math.cos(lat2) *
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


// ============================================================
// UPDATE DISTANCE FIELD
// ============================================================

function updatePropertyDistance(
    latitude,
    longitude
) {

    const distanceInput =
        document.getElementById("lpDistance");

    if (!distanceInput) {
        return;
    }

    const distance =
        calculatePropertyDistanceFromMAKAUT(
            latitude,
            longitude
        );

    distanceInput.value =
        distance.toFixed(1);

    console.log(
        "Distance from MAKAUT:",
        distance.toFixed(2),
        "km"
    );
}


// ============================================================
// SET PROPERTY LOCATION
// ============================================================

function setPropertyLocation(
    latitude,
    longitude
) {

    latitude = Number(latitude);
    longitude = Number(longitude);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return;
    }


    // Save latitude
    const latInput =
        document.getElementById(
            "propertyLatitude"
        );

    if (latInput) {
        latInput.value = latitude;
    }


    // Save longitude
    const lonInput =
        document.getElementById(
            "propertyLongitude"
        );

    if (lonInput) {
        lonInput.value = longitude;
    }


    // Calculate distance
    updatePropertyDistance(
        latitude,
        longitude
    );


    // Save global location object
    window.propertyLocationData = {
        latitude: latitude,
        longitude: longitude,
        accuracy: null
    };


    // Update map
    setPropertyMarker(
        latitude,
        longitude
    );
}


// ============================================================
// INITIALIZE OWNER MAP
// ============================================================

function initializePropertyMap(
    latitude = MAKAUT_LOCATION.latitude,
    longitude = MAKAUT_LOCATION.longitude
) {

    if (propertyMap) {

        propertyMap.setView(
            [latitude, longitude],
            16
        );

        return;
    }


    const mapElement =
        document.getElementById(
            "propertyMap"
        );

    if (!mapElement) {
        return;
    }


    propertyMap =
        L.map(
            "propertyMap"
        ).setView(
            [latitude, longitude],
            14
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(propertyMap);


    // Owner clicks map
    propertyMap.on(
        "click",
        function(event) {

            setPropertyLocation(
                event.latlng.lat,
                event.latlng.lng
            );

        }
    );


    // Fix Leaflet rendering
    setTimeout(() => {

        propertyMap.invalidateSize();

    }, 300);
}


// ============================================================
// PROPERTY MARKER
// ============================================================

function setPropertyMarker(
    latitude,
    longitude
) {

    if (!propertyMap) {

        initializePropertyMap(
            latitude,
            longitude
        );

    }


    if (!propertyMap) {
        return;
    }


    if (propertyMarker) {

        propertyMap.removeLayer(
            propertyMarker
        );

    }


    propertyMarker =
        L.marker([
            latitude,
            longitude
        ])
        .addTo(propertyMap);


    propertyMarker
        .bindPopup(
            "📍 Property Location"
        )
        .openPopup();


    propertyMap.setView(
        [latitude, longitude],
        16
    );


    const status =
        document.getElementById(
            "ownerLocationStatus"
        );

    if (status) {

        const distance =
            calculatePropertyDistanceFromMAKAUT(
                latitude,
                longitude
            );

        status.textContent =
            `✅ Location selected • ${distance.toFixed(1)} km from MAKAUT`;

    }
}


// ============================================================
// USE OWNER'S CURRENT LOCATION
// ============================================================

async function useOwnerCurrentLocation() {

    const status =
        document.getElementById(
            "ownerLocationStatus"
        );


    if (!navigator.geolocation) {

        if (status) {
            status.textContent =
                "❌ Geolocation is not supported by this browser.";
        }

        return;
    }


    if (status) {

        status.textContent =
            "📍 Detecting your location...";
    }


    navigator.geolocation.getCurrentPosition(

        function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            // Save location
            window.propertyLocationData = {

                latitude: latitude,

                longitude: longitude,

                accuracy:
                    position.coords.accuracy

            };


            // Put coordinates into fields
            const latInput =
                document.getElementById(
                    "propertyLatitude"
                );

            const lonInput =
                document.getElementById(
                    "propertyLongitude"
                );


            if (latInput) {
                latInput.value = latitude;
            }


            if (lonInput) {
                lonInput.value = longitude;
            }


            // Calculate distance
            updatePropertyDistance(
                latitude,
                longitude
            );


            // Show map
            initializePropertyMap(
                latitude,
                longitude
            );


            // Marker
            setPropertyMarker(
                latitude,
                longitude
            );


            if (status) {

                const distance =
                    calculatePropertyDistanceFromMAKAUT(
                        latitude,
                        longitude
                    );

                status.textContent =
                    `✅ Location detected • ${distance.toFixed(1)} km from MAKAUT`;

            }

        },

        function(error) {

            console.error(
                "Owner location error:",
                error
            );


            if (status) {

                status.textContent =
                    "❌ Unable to get your location. Please select the location on the map.";

            }

        },

        {
            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 60000

        }

    );
}


// ============================================================
// OWNER LOCATION BUTTONS
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const mapButton =
            document.getElementById(
                "openPropertyMapBtn"
            );

        const locationButton =
            document.getElementById(
                "usePropertyLocationBtn"
            );


        // ----------------------------------------
        // PICK LOCATION ON MAP
        // ----------------------------------------

        if (mapButton) {

            mapButton.addEventListener(
                "click",
                function() {

                    const latInput =
                        document.getElementById(
                            "propertyLatitude"
                        );

                    const lonInput =
                        document.getElementById(
                            "propertyLongitude"
                        );


                    const latitude =
                        parseFloat(
                            latInput?.value
                        ) ||
                        MAKAUT_LOCATION.latitude;


                    const longitude =
                        parseFloat(
                            lonInput?.value
                        ) ||
                        MAKAUT_LOCATION.longitude;


                    initializePropertyMap(
                        latitude,
                        longitude
                    );


                    document
                        .getElementById(
                            "propertyMap"
                        )
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });


                    setTimeout(() => {

                        propertyMap?.invalidateSize();

                    }, 400);

                }
            );

        }


        // ----------------------------------------
        // USE MY LOCATION
        // ----------------------------------------

        if (locationButton) {

            locationButton.addEventListener(
                "click",
                useOwnerCurrentLocation
            );

        }


        // ----------------------------------------
        // SHOW MAP INITIALLY
        // ----------------------------------------

        if (
            document.getElementById(
                "propertyMap"
            )
        ) {

            initializePropertyMap();

        }

    }
);


// ============================================================
// RENTER-FACING MAP
// ============================================================

function initializeRoomDhundoMap(
    latitude,
    longitude
) {

    if (roomdhundoMap) {

        roomdhundoMap.setView(
            [latitude, longitude],
            13
        );

        return;
    }


    roomdhundoMap =
        L.map(
            "roomdhundoMap"
        ).setView(
            [latitude, longitude],
            13
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(roomdhundoMap);

}


// ============================================================
// PROPERTY MARKER - RENTER
// ============================================================

function addPropertyLocationToMap(
    latitude,
    longitude,
    label = "📍 Property Location"
) {

    if (!roomdhundoMap) {
        return;
    }


    const marker =
        L.marker([
            latitude,
            longitude
        ])
        .addTo(roomdhundoMap)
        .bindPopup(label);


    roomMarkers.push(
        marker
    );
}


// ============================================================
// USER LOCATION - RENTER
// ============================================================

function addUserLocationToMap(
    latitude,
    longitude
) {

    if (!roomdhundoMap) {
        return;
    }


    L.circleMarker(
        [
            latitude,
            longitude
        ],
        {
            radius: 9,
            weight: 3
        }
    )
    .addTo(roomdhundoMap)
    .bindPopup(
        "📍 You are here"
    );

}


// ============================================================
// DIRECTIONS
// ============================================================

function openDirections(
    latitude,
    longitude
) {

    if (
        latitude == null ||
        longitude == null
    ) {

        alert(
            "Property location is not available."
        );

        return;
    }


    const destination =
        `${latitude},${longitude}`;


    const url =
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;


    window.open(
        url,
        "_blank"
    );

}