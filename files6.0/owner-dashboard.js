/* =========================================================
   ROOMDHUNDO OWNER DASHBOARD
   Supabase Version
========================================================= */


/* =========================================================
   SUPABASE CONFIG
========================================================= */

/*
   IMPORTANT:

   Yahan apne Supabase project ki values daalo.

   Agar tumhare project me already supabase.js file hai,
   to is section ko uske according adjust kar sakte ho.
*/

const SUPABASE_URL = "YOUR_SUPABASE_URL";

const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";


const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/* =========================================================
   TABLE CONFIGURATION
========================================================= */

const TABLES = {

    properties: "properties",

    rooms: "rooms",

    reviews: "reviews",

    profile: "profile"

};


/* =========================================================
   COLUMN CONFIGURATION
========================================================= */

const COLUMNS = {

    propertyOwnerId: "owner_id",

    roomPropertyId: "property_id",

    reviewPropertyId: "property_id",

    reviewUserId: "user_id"

};


/* =========================================================
   GLOBAL DATA
========================================================= */

let currentUser = null;

let currentOwner = null;

let properties = [];

let rooms = [];

let reviews = [];


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeDashboard();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeDashboard() {

    try {

        console.log(
            "RoomDhundo Owner Dashboard initializing..."
        );


        setupNavigation();

        setupSidebar();

        setupModals();

        setupQuickActions();

        setupPropertyFilter();

        setupLogout();


        await checkAuthentication();


        if (!currentUser) {

            return;

        }


        await loadOwnerProfile();

        await loadProperties();

        await loadRooms();

        await loadReviews();


        updateDashboardStatistics();


        console.log(
            "Owner Dashboard initialized successfully."
        );


    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );

        showToast(
            "Unable to load dashboard."
        );

    }

}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Auth error:",
            error
        );

        return;

    }


    const session = data.session;


    if (!session) {

        console.warn(
            "No active session."
        );

        /*
            Change this URL according to your project.
        */

        window.location.href = "login.html";

        return;

    }


    currentUser = session.user;


    console.log(
        "Authenticated owner:",
        currentUser.id
    );

}


/* =========================================================
   OWNER PROFILE
========================================================= */

async function loadOwnerProfile() {

    if (!currentUser) {

        return;

    }


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from(TABLES.profile)

            .select("*")

            .eq("id", currentUser.id)

            .maybeSingle();


        if (error) {

            console.warn(
                "Profile load error:",
                error
            );

            setDefaultOwnerProfile();

            return;

        }


        currentOwner = data;


        const name =
            getProfileName(data) ||
            currentUser.user_metadata?.name ||
            currentUser.user_metadata?.full_name ||
            "Owner";


        updateOwnerUI(name);


    } catch (error) {

        console.error(
            "Owner profile error:",
            error
        );

        setDefaultOwnerProfile();

    }

}


/* =========================================================
   PROFILE NAME
========================================================= */

function getProfileName(profile) {

    if (!profile) {

        return null;

    }


    return (
        profile.name ||
        profile.full_name ||
        profile.username ||
        profile.display_name ||
        null
    );

}


/* =========================================================
   DEFAULT PROFILE
========================================================= */

function setDefaultOwnerProfile() {

    const name =
        currentUser?.user_metadata?.name ||
        currentUser?.user_metadata?.full_name ||
        "Owner";


    updateOwnerUI(name);

}


/* =========================================================
   UPDATE OWNER UI
========================================================= */

function updateOwnerUI(name) {

    const ownerName =
        document.getElementById("ownerName");

    const welcomeText =
        document.getElementById("welcomeText");

    const ownerAvatar =
        document.getElementById("ownerAvatar");


    if (ownerName) {

        ownerName.textContent = name;

    }


    if (welcomeText) {

        welcomeText.textContent =
            `Welcome back, ${name} 👋`;

    }


    if (ownerAvatar) {

        ownerAvatar.textContent =
            getInitials(name);

    }

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(name) {

    if (!name) {

        return "OW";

    }


    const words =
        name
            .trim()
            .split(/\s+/);


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


/* =========================================================
   LOAD PROPERTIES
========================================================= */

async function loadProperties() {

    if (!currentUser) {

        return;

    }


    const container =
        document.getElementById(
            "ownerProperties"
        );


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from(TABLES.properties)

            .select("*")

            .eq(
                COLUMNS.propertyOwnerId,
                currentUser.id
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        properties = data || [];


        renderProperties();

        populatePropertyFilter();


    } catch (error) {

        console.error(
            "Properties error:",
            error
        );


        if (container) {

            container.innerHTML = `

                <div class="empty-properties">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>
                        Unable to load properties
                    </h3>

                    <p>
                        ${escapeHTML(error.message || "Database error")}
                    </p>

                </div>

            `;

        }

    }

}


/* =========================================================
   RENDER PROPERTIES
========================================================= */

function renderProperties() {

    const container =
        document.getElementById(
            "ownerProperties"
        );


    if (!container) {

        return;

    }


    if (!properties.length) {

        container.innerHTML = `

            <div class="empty-properties">

                <i class="fa-solid fa-building"></i>

                <h3>
                    No properties yet
                </h3>

                <p>
                    Add your first property to get started.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        properties
            .map(
                property =>
                    createPropertyCard(property)
            )
            .join("");

}


/* =========================================================
   PROPERTY CARD
========================================================= */

function createPropertyCard(property) {

    const name =
        property.name ||
        property.property_name ||
        "Unnamed Property";


    const city =
        property.city ||
        "";


    const area =
        property.area ||
        property.locality ||
        "";


    const address =
        property.address ||
        property.location ||
        "";


    const type =
        property.property_type ||
        property.type ||
        "Property";


    const rent =
        property.rent ||
        property.price ||
        property.monthly_rent ||
        0;


    const image =
        property.image ||
        property.image_url ||
        property.cover_image ||
        "https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=80";


    const location =
        [area, city]
            .filter(Boolean)
            .join(", ") ||
        address ||
        "Location not available";


    return `

        <article class="property-card">

            <img
                class="property-image"
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(name)}"
                onerror="this.src='https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=80'"
            >


            <div class="property-body">

                <h3>
                    ${escapeHTML(name)}
                </h3>


                <div class="property-location">

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHTML(location)}

                </div>


                <div class="property-meta">

                    <span class="property-type">

                        ${escapeHTML(type)}

                    </span>


                    <span class="property-rent">

                        ₹${formatNumber(rent)}

                        <small>
                            / month
                        </small>

                    </span>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   LOAD ROOMS
========================================================= */

async function loadRooms() {

    try {

        if (!currentUser) {

            return;

        }


        if (!properties.length) {

            rooms = [];

            renderRooms();

            updateDashboardStatistics();

            return;

        }


        const propertyIds =
            properties.map(
                property => property.id
            );


        const {
            data,
            error
        } = await supabaseClient

            .from(TABLES.rooms)

            .select("*")

            .in(
                COLUMNS.roomPropertyId,
                propertyIds
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        rooms = data || [];


        renderRooms();

        updateDashboardStatistics();


    } catch (error) {

        console.error(
            "Rooms error:",
            error
        );


        const body =
            document.getElementById(
                "roomTableBody"
            );


        if (body) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="table-loading"
                    >

                        Unable to load rooms.

                    </td>

                </tr>

            `;

        }

    }

}


/* =========================================================
   RENDER ROOMS
========================================================= */

function renderRooms() {

    const body =
        document.getElementById(
            "roomTableBody"
        );


    if (!body) {

        return;

    }


    const selectedProperty =
        document.getElementById(
            "propertyFilter"
        )?.value || "all";


    let filteredRooms = rooms;


    if (selectedProperty !== "all") {

        filteredRooms =
            rooms.filter(
                room =>
                    String(
                        room.property_id
                    ) ===
                    String(
                        selectedProperty
                    )
            );

    }


    if (!filteredRooms.length) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="table-loading"
                >

                    No rooms found.

                </td>

            </tr>

        `;

        return;

    }


    body.innerHTML =
        filteredRooms
            .map(
                room =>
                    createRoomRow(room)
            )
            .join("");

}


/* =========================================================
   CREATE ROOM ROW
========================================================= */

function createRoomRow(room) {

    const property =
        properties.find(
            property =>
                String(property.id) ===
                String(room.property_id)
        );


    const propertyName =
        property?.name ||
        property?.property_name ||
        "Unknown Property";


    const roomNumber =
        room.room_number ||
        room.room_name ||
        room.number ||
        room.name ||
        `Room ${room.id}`;


    const rent =
        room.rent ||
        room.price ||
        room.monthly_rent ||
        property?.rent ||
        0;


    const people =
        room.capacity ||
        room.people ||
        room.max_people ||
        room.occupancy ||
        1;


    const status =
        normalizeRoomStatus(
            room.status
        );


    const statusClass =
        getStatusClass(status);


    return `

        <tr>

            <td>

                <span class="room-property-name">

                    ${escapeHTML(propertyName)}

                </span>

            </td>


            <td>

                <span class="room-number">

                    ${escapeHTML(String(roomNumber))}

                </span>

            </td>


            <td>

                <span class="room-rent">

                    ₹${formatNumber(rent)}

                </span>

            </td>


            <td>

                ${escapeHTML(String(people))}

            </td>


            <td>

                <span
                    class="status-badge ${statusClass}"
                >

                    <i class="fa-solid fa-circle"></i>

                    ${escapeHTML(capitalize(status))}

                </span>

            </td>


            <td>

                <select
                    class="status-select"
                    onchange="changeRoomStatus('${escapeAttribute(String(room.id))}', this.value)"
                >

                    <option
                        value="available"
                        ${status === "available" ? "selected" : ""}
                    >
                        Available
                    </option>

                    <option
                        value="occupied"
                        ${status === "occupied" ? "selected" : ""}
                    >
                        Occupied
                    </option>

                    <option
                        value="maintenance"
                        ${status === "maintenance" ? "selected" : ""}
                    >
                        Maintenance
                    </option>

                </select>

            </td>

        </tr>

    `;

}


/* =========================================================
   ROOM STATUS
========================================================= */

function normalizeRoomStatus(status) {

    const value =
        String(
            status || "available"
        )
        .toLowerCase()
        .trim();


    if (
        value === "occupied" ||
        value === "booked"
    ) {

        return "occupied";

    }


    if (
        value === "maintenance" ||
        value === "unavailable"
    ) {

        return "maintenance";

    }


    return "available";

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    if (status === "occupied") {

        return "status-occupied";

    }


    if (status === "maintenance") {

        return "status-maintenance";

    }


    return "status-available";

}


/* =========================================================
   CHANGE ROOM STATUS
========================================================= */

async function changeRoomStatus(
    roomId,
    newStatus
) {

    try {

        const {
            error
        } = await supabaseClient

            .from(TABLES.rooms)

            .update({
                status: newStatus
            })

            .eq(
                "id",
                roomId
            );


        if (error) {

            throw error;

        }


        const room =
            rooms.find(
                item =>
                    String(item.id) ===
                    String(roomId)
            );


        if (room) {

            room.status =
                newStatus;

        }


        renderRooms();

        updateDashboardStatistics();


        showToast(
            "Room status updated."
        );


    } catch (error) {

        console.error(
            "Room status error:",
            error
        );


        showToast(
            "Unable to update room status."
        );

    }

}


/* =========================================================
   PROPERTY FILTER
========================================================= */

function setupPropertyFilter() {

    const filter =
        document.getElementById(
            "propertyFilter"
        );


    if (!filter) {

        return;

    }


    filter.addEventListener(
        "change",
        () => {

            renderRooms();

        }
    );

}


/* =========================================================
   POPULATE PROPERTY FILTER
========================================================= */

function populatePropertyFilter() {

    const filter =
        document.getElementById(
            "propertyFilter"
        );


    if (!filter) {

        return;

    }


    filter.innerHTML = `

        <option value="all">
            All Properties
        </option>

    `;


    properties.forEach(
        property => {

            const name =
                property.name ||
                property.property_name ||
                "Unnamed Property";


            filter.insertAdjacentHTML(
                "beforeend",
                `
                    <option value="${escapeAttribute(String(property.id))}">
                        ${escapeHTML(name)}
                    </option>
                `
            );

        }
    );

}


/* =========================================================
   STATISTICS
========================================================= */

function updateDashboardStatistics() {

    const totalProperties =
        document.getElementById(
            "totalProperties"
        );


    const totalRooms =
        document.getElementById(
            "totalRooms"
        );


    const availableRooms =
        document.getElementById(
            "availableRooms"
        );


    const occupiedRooms =
        document.getElementById(
            "occupiedRooms"
        );


    const available =
        rooms.filter(
            room =>
                normalizeRoomStatus(
                    room.status
                ) === "available"
        ).length;


    const occupied =
        rooms.filter(
            room =>
                normalizeRoomStatus(
                    room.status
                ) === "occupied"
        ).length;


    if (totalProperties) {

        totalProperties.textContent =
            properties.length;

    }


    if (totalRooms) {

        totalRooms.textContent =
            rooms.length;

    }


    if (availableRooms) {

        availableRooms.textContent =
            available;

    }


    if (occupiedRooms) {

        occupiedRooms.textContent =
            occupied;

    }

}


/* =========================================================
   LOAD REVIEWS
========================================================= */

async function loadReviews() {

    const container =
        document.getElementById(
            "ownerReviews"
        );


    try {

        if (!properties.length) {

            reviews = [];

            renderReviews();

            return;

        }


        const propertyIds =
            properties.map(
                property =>
                    property.id
            );


        /*
            We load reviews only for
            the owner's properties.

            This is the important part
            that keeps one owner's reviews
            separate from another owner's reviews.
        */

        const {
            data,
            error
        } = await supabaseClient

            .from(TABLES.reviews)

            .select("*")

            .in(
                COLUMNS.reviewPropertyId,
                propertyIds
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        reviews = data || [];


        /*
            Load user/profile details
            separately so that the code
            does not depend on a Supabase
            foreign-key relationship.
        */

        await attachReviewUserDetails();


        renderReviews();

        updateReviewStatistics();


    } catch (error) {

        console.error(
            "Reviews error:",
            error
        );


        if (container) {

            container.innerHTML = `

                <div class="empty-properties">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>
                        Unable to load reviews
                    </h3>

                    <p>
                        ${escapeHTML(error.message || "Database error")}
                    </p>

                </div>

            `;

        }

    }

}


/* =========================================================
   ATTACH USER DETAILS
========================================================= */

async function attachReviewUserDetails() {

    if (!reviews.length) {

        return;

    }


    const userIds =
        [
            ...new Set(
                reviews
                    .map(
                        review =>
                            review.user_id ||
                            review.customer_id ||
                            review.userId
                    )
                    .filter(Boolean)
            )
        ];


    if (!userIds.length) {

        return;

    }


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from(TABLES.profile)

            .select("*")

            .in(
                "id",
                userIds
            );


        if (error) {

            console.warn(
                "Review profile loading error:",
                error
            );

            return;

        }


        const profiles =
            data || [];


        reviews =
            reviews.map(
                review => {

                    const userId =
                        review.user_id ||
                        review.customer_id ||
                        review.userId;


                    const profile =
                        profiles.find(
                            item =>
                                String(item.id) ===
                                String(userId)
                        );


                    return {

                        ...review,

                        reviewerProfile:
                            profile || null

                    };

                }
            );


    } catch (error) {

        console.warn(
            "Could not attach review users:",
            error
        );

    }

}


/* =========================================================
   RENDER REVIEWS
========================================================= */

function renderReviews() {

    const container =
        document.getElementById(
            "ownerReviews"
        );


    if (!container) {

        return;

    }


    if (!reviews.length) {

        container.innerHTML = `

            <div class="empty-properties">

                <i class="fa-regular fa-star"></i>

                <h3>
                    No reviews yet
                </h3>

                <p>
                    When users review your properties,
                    their reviews will appear here.
                </p>

            </div>

        `;

        updateReviewStatistics();

        return;

    }


    container.innerHTML =
        reviews
            .map(
                review =>
                    createReviewCard(review)
            )
            .join("");


    updateReviewStatistics();

}


/* =========================================================
   CREATE REVIEW CARD
========================================================= */

function createReviewCard(review) {

    const property =
        properties.find(
            item =>
                String(item.id) ===
                String(
                    review.property_id
                )
        );


    const propertyName =
        property?.name ||
        property?.property_name ||
        "Unknown Property";


    const propertyImage =
        property?.image ||
        property?.image_url ||
        property?.cover_image ||
        "https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=80";


    const propertyLocation =
        [
            property?.area ||
            property?.locality,

            property?.city
        ]
        .filter(Boolean)
        .join(", ") ||
        property?.address ||
        "Location not available";


    const propertyType =
        property?.property_type ||
        property?.type ||
        "Property";


    const rent =
        property?.rent ||
        property?.price ||
        property?.monthly_rent ||
        0;


    const profile =
        review.reviewerProfile;


    const reviewerName =
        getProfileName(profile) ||
        review.user_name ||
        review.customer_name ||
        "RoomDhundo User";


    const rating =
        Number(
            review.rating ||
            review.stars ||
            0
        );


    const reviewText =
        review.review ||
        review.comment ||
        review.message ||
        "No written review.";


    const date =
        formatDate(
            review.created_at
        );


    const stars =
        createStars(rating);


    return `

        <article class="review-card">

            <div class="review-top">

                <div class="reviewer">

                    <div class="reviewer-avatar">

                        ${escapeHTML(
                            getInitials(reviewerName)
                        )}

                    </div>


                    <div class="reviewer-info">

                        <strong>
                            ${escapeHTML(reviewerName)}
                        </strong>

                        <span>
                            Customer
                        </span>

                    </div>

                </div>


                <div>

                    <div class="review-stars">

                        ${stars}

                    </div>


                    <div class="review-date">

                        ${escapeHTML(date)}

                    </div>

                </div>

            </div>


            <!-- PROPERTY DETAILS -->

            <div class="review-property">

                <img
                    class="review-property-image"
                    src="${escapeAttribute(propertyImage)}"
                    alt="${escapeAttribute(propertyName)}"
                    onerror="this.src='https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=80'"
                >


                <div class="review-property-info">

                    <strong>

                        ${escapeHTML(propertyName)}

                    </strong>


                    <span>

                        <i class="fa-solid fa-location-dot"></i>

                        ${escapeHTML(propertyLocation)}

                    </span>


                    <span>

                        Type:
                        ${escapeHTML(propertyType)}

                    </span>


                    <span class="property-rent-line">

                        ₹${formatNumber(rent)}
                        / month

                    </span>

                </div>

            </div>


            <!-- REVIEW -->

            <p class="review-text">

                ${escapeHTML(reviewText)}

            </p>


            <div class="review-footer">

                <span
                    style="
                        color:#6b7280;
                        font-size:10px;
                    "
                >

                    Review for:
                    <strong>
                        ${escapeHTML(propertyName)}
                    </strong>

                </span>


                <button
                    class="view-review-btn"
                    type="button"
                    onclick="openReviewDetails('${escapeAttribute(String(review.id))}')"
                >

                    View Details

                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   CREATE STARS
========================================================= */

function createStars(rating) {

    const rounded =
        Math.round(
            Number(rating)
        );


    let html = "";


    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        if (i <= rounded) {

            html +=
                `<i class="fa-solid fa-star"></i>`;

        } else {

            html +=
                `<i class="fa-regular fa-star"></i>`;

        }

    }


    return html;

}


/* =========================================================
   REVIEW STATISTICS
========================================================= */

function updateReviewStatistics() {

    const averageElement =
        document.getElementById(
            "averageRating"
        );


    const totalText =
        document.getElementById(
            "totalReviewText"
        );


    const badge =
        document.getElementById(
            "reviewBadge"
        );


    if (!reviews.length) {

        if (averageElement) {

            averageElement.textContent =
                "0.0";

        }


        if (totalText) {

            totalText.textContent =
                "0 reviews";

        }


        if (badge) {

            badge.textContent =
                "0";

        }

        return;

    }


    const total =
        reviews.reduce(
            (
                sum,
                review
            ) =>
                sum +
                Number(
                    review.rating ||
                    review.stars ||
                    0
                ),
            0
        );


    const average =
        total /
        reviews.length;


    if (averageElement) {

        averageElement.textContent =
            average.toFixed(1);

    }


    if (totalText) {

        totalText.textContent =
            `${reviews.length} ${
                reviews.length === 1
                    ? "review"
                    : "reviews"
            }`;

    }


    if (badge) {

        badge.textContent =
            reviews.length;

    }

}


/* =========================================================
   REVIEW DETAIL MODAL
========================================================= */

function openReviewDetails(reviewId) {

    const review =
        reviews.find(
            item =>
                String(item.id) ===
                String(reviewId)
        );


    if (!review) {

        return;

    }


    const property =
        properties.find(
            item =>
                String(item.id) ===
                String(review.property_id)
        );


    const propertyName =
        property?.name ||
        property?.property_name ||
        "Unknown Property";


    const propertyImage =
        property?.image ||
        property?.image_url ||
        property?.cover_image ||
        "https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=80";


    const location =
        [
            property?.area ||
            property?.locality,

            property?.city
        ]
        .filter(Boolean)
        .join(", ") ||
        property?.address ||
        "Location not available";


    const reviewerName =
        getProfileName(
            review.reviewerProfile
        ) ||
        review.user_name ||
        review.customer_name ||
        "RoomDhundo User";


    const rating =
        Number(
            review.rating ||
            review.stars ||
            0
        );


    const reviewText =
        review.review ||
        review.comment ||
        review.message ||
        "No written review.";


    const propertyRent =
        property?.rent ||
        property?.price ||
        property?.monthly_rent ||
        0;


    const propertyType =
        property?.property_type ||
        property?.type ||
        "Property";


    const content =
        document.getElementById(
            "reviewModalContent"
        );


    if (!content) {

        return;

    }


    content.innerHTML = `

        <div class="review-detail-property">

            <img
                src="${escapeAttribute(propertyImage)}"
                alt="${escapeAttribute(propertyName)}"
                onerror="this.src='https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=80'"
            >


            <div>

                <h3>
                    ${escapeHTML(propertyName)}
                </h3>


                <p>

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHTML(location)}

                </p>


                <p>

                    Property Type:
                    ${escapeHTML(propertyType)}

                </p>


                <p>

                    Rent:
                    <strong>
                        ₹${formatNumber(propertyRent)}
                    </strong>
                    / month

                </p>

            </div>

        </div>


        <div class="detail-row">

            <strong>
                Reviewer
            </strong>

            <span>
                ${escapeHTML(reviewerName)}
            </span>

        </div>


        <div class="detail-row">

            <strong>
                Rating
            </strong>

            <span>

                <span class="review-stars">

                    ${createStars(rating)}

                </span>

                ${rating}/5

            </span>

        </div>


        <div class="detail-row">

            <strong>
                Review Date
            </strong>

            <span>
                ${escapeHTML(
                    formatDate(
                        review.created_at
                    )
                )}
            </span>

        </div>


        <div class="detail-row">

            <strong>
                Property ID
            </strong>

            <span>
                ${escapeHTML(
                    String(
                        review.property_id
                    )
                )}
            </span>

        </div>


        <div class="detail-review-text">

            <strong>
                Customer Review
            </strong>

            <p style="margin-top:8px;">

                ${escapeHTML(reviewText)}

            </p>

        </div>

    `;


    document
        .getElementById("reviewModal")
        ?.classList.add("show");

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const navLinks =
        document.querySelectorAll(
            ".nav-link"
        );


    navLinks.forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const sectionId =
                        link.dataset.section;


                    if (!sectionId) {

                        return;

                    }


                    switchSection(
                        sectionId
                    );


                    closeSidebarMobile();

                }
            );

        }
    );

}


/* =========================================================
   SWITCH SECTION
========================================================= */

function switchSection(sectionId) {

    const sections =
        document.querySelectorAll(
            ".content-section"
        );


    sections.forEach(
        section => {

            section.classList.remove(
                "active-section"
            );

        }
    );


    const target =
        document.getElementById(
            sectionId
        );


    if (target) {

        target.classList.add(
            "active-section"
        );

    }


    const navLinks =
        document.querySelectorAll(
            ".nav-link"
        );


    navLinks.forEach(
        link => {

            link.classList.remove(
                "active"
            );


            if (
                link.dataset.section ===
                sectionId
            ) {

                link.classList.add(
                    "active"
                );

            }

        }
    );


    updatePageTitle(
        sectionId
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   PAGE TITLE
========================================================= */

function updatePageTitle(sectionId) {

    const title =
        document.getElementById(
            "pageTitle"
        );


    const subtitle =
        document.getElementById(
            "pageSubtitle"
        );


    const pages = {

        dashboard: [
            "Owner Dashboard",
            "Manage your properties and rooms"
        ],

        enquiries: [
            "Enquiries",
            "Manage customer enquiries"
        ],

        bookings: [
            "Bookings",
            "Manage booking requests"
        ],

        profile: [
            "My Profile",
            "Manage your owner profile"
        ],

        settings: [
            "Settings",
            "Manage dashboard settings"
        ]

    };


    const data =
        pages[sectionId] ||
        pages.dashboard;


    if (title) {

        title.textContent =
            data[0];

    }


    if (subtitle) {

        subtitle.textContent =
            data[1];

    }

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const menuBtn =
        document.getElementById(
            "menuBtn"
        );


    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    menuBtn?.addEventListener(
        "click",
        () => {

            sidebar?.classList.toggle(
                "open"
            );

            overlay?.classList.toggle(
                "show"
            );

        }
    );


    overlay?.addEventListener(
        "click",
        closeSidebarMobile
    );

}


function closeSidebarMobile() {

    document
        .getElementById("sidebar")
        ?.classList.remove("open");


    document
        .getElementById("sidebarOverlay")
        ?.classList.remove("show");

}


/* =========================================================
   MODALS
========================================================= */

function setupModals() {

    const propertyModal =
        document.getElementById(
            "propertyModal"
        );


    const reviewModal =
        document.getElementById(
            "reviewModal"
        );


    document
        .getElementById(
            "addPropertyBtn"
        )
        ?.addEventListener(
            "click",
            openPropertyModal
        );


    document
        .getElementById(
            "addPropertyBtn2"
        )
        ?.addEventListener(
            "click",
            openPropertyModal
        );


    document
        .getElementById(
            "quickAddProperty"
        )
        ?.addEventListener(
            "click",
            openPropertyModal
        );


    document
        .getElementById(
            "closePropertyModal"
        )
        ?.addEventListener(
            "click",
            closePropertyModal
        );


    document
        .getElementById(
            "cancelPropertyBtn"
        )
        ?.addEventListener(
            "click",
            closePropertyModal
        );


    document
        .getElementById(
            "closeReviewModal"
        )
        ?.addEventListener(
            "click",
            () => {

                reviewModal?.classList.remove(
                    "show"
                );

            }
        );


    propertyModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                propertyModal
            ) {

                closePropertyModal();

            }

        }
    );


    reviewModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                reviewModal
            ) {

                reviewModal.classList.remove(
                    "show"
                );

            }

        }
    );


    document
        .getElementById(
            "propertyForm"
        )
        ?.addEventListener(
            "submit",
            handleAddProperty
        );

}


function openPropertyModal() {

    document
        .getElementById(
            "propertyModal"
        )
        ?.classList.add("show");

}


function closePropertyModal() {

    const modal =
        document.getElementById(
            "propertyModal"
        );


    modal?.classList.remove(
        "show"
    );


    const form =
        document.getElementById(
            "propertyForm"
        );


    form?.reset();


    const error =
        document.getElementById(
            "propertyFormError"
        );


    error?.classList.remove(
        "show"
    );

}


/* =========================================================
   ADD PROPERTY
========================================================= */

async function handleAddProperty(event) {

    event.preventDefault();


    if (!currentUser) {

        showToast(
            "You are not logged in."
        );

        return;

    }


    const name =
        document.getElementById(
            "propertyName"
        )?.value.trim();


    const city =
        document.getElementById(
            "propertyCity"
        )?.value.trim();


    const area =
        document.getElementById(
            "propertyArea"
        )?.value.trim();


    const address =
        document.getElementById(
            "propertyAddress"
        )?.value.trim();


    const type =
        document.getElementById(
            "propertyType"
        )?.value;


    const rent =
        document.getElementById(
            "propertyRent"
        )?.value;


    const image =
        document.getElementById(
            "propertyImage"
        )?.value.trim();


    const errorBox =
        document.getElementById(
            "propertyFormError"
        );


    const saveBtn =
        document.getElementById(
            "savePropertyBtn"
        );


    if (!name || !city || !address) {

        showFormError(
            "Please fill all required fields."
        );

        return;

    }


    try {

        saveBtn.disabled = true;

        saveBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Saving...

        `;


        /*
            IMPORTANT:

            If your properties table uses different
            column names, change this object.
        */

        const propertyData = {

            owner_id:
                currentUser.id,

            name:
                name,

            city:
                city,

            area:
                area,

            address:
                address,

            property_type:
                type,

            rent:
                rent
                    ? Number(rent)
                    : null,

            image:
                image || null

        };


        const {
            data,
            error
        } = await supabaseClient

            .from(TABLES.properties)

            .insert(
                propertyData
            )

            .select()
            .single();


        if (error) {

            throw error;

        }


        if (data) {

            properties.unshift(
                data
            );

        }


        renderProperties();

        populatePropertyFilter();

        updateDashboardStatistics();


        closePropertyModal();


        showToast(
            "Property added successfully."
        );


    } catch (error) {

        console.error(
            "Add property error:",
            error
        );


        showFormError(
            error.message ||
            "Unable to add property."
        );


    } finally {

        saveBtn.disabled = false;

        saveBtn.innerHTML = `

            <i class="fa-solid fa-plus"></i>

            Add Property

        `;

    }

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(message) {

    const errorBox =
        document.getElementById(
            "propertyFormError"
        );


    if (!errorBox) {

        return;

    }


    errorBox.textContent =
        message;


    errorBox.classList.add(
        "show"
    );

}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function setupQuickActions() {

    document
        .getElementById(
            "quickReviews"
        )
        ?.addEventListener(
            "click",
            () => {

                switchSection(
                    "dashboard"
                );


                setTimeout(
                    () => {

                        document
                            .getElementById(
                                "reviews"
                            )
                            ?.scrollIntoView({
                                behavior: "smooth"
                            });

                    },
                    100
                );

            }
        );


    document
        .getElementById(
            "quickBookings"
        )
        ?.addEventListener(
            "click",
            () => {

                switchSection(
                    "bookings"
                );

            }
        );


    document
        .getElementById(
            "quickProfile"
        )
        ?.addEventListener(
            "click",
            () => {

                switchSection(
                    "profile"
                );

            }
        );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    document
        .getElementById(
            "logoutBtn"
        )
        ?.addEventListener(
            "click",
            async () => {

                try {

                    const {
                        error
                    } =
                        await supabaseClient
                            .auth
                            .signOut();


                    if (error) {

                        throw error;

                    }


                    window.location.href =
                        "login.html";


                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    showToast(
                        "Logout failed."
                    );

                }

            }
        );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    const text =
        document.getElementById(
            "toastMessage"
        );


    if (!toast || !text) {

        return;

    }


    text.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {

        return "Date unavailable";

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Date unavailable";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(value) {

    const number =
        Number(value || 0);


    return number.toLocaleString(
        "en-IN"
    );

}


/* =========================================================
   CAPITALIZE
========================================================= */

function capitalize(value) {

    if (!value) {

        return "";

    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   ATTRIBUTE ESCAPE
========================================================= */

function escapeAttribute(value) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.changeRoomStatus =
    changeRoomStatus;


window.openReviewDetails =
    openReviewDetails;