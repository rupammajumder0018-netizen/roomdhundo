/* =========================================================
   ROOMDHUNDO — OWNER DASHBOARD
   SUPABASE OWNER DATA
   ========================================================= */

const SUPABASE_URL =
    "https://vyusxdilgwrcgmqqvzsp.supabase.co";

/*
   IMPORTANT:
   Paste the SAME anon key that you already use
   in your main script.js.
*/
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dXN4ZGlsZ3dyY2dtcXF2enNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjYyNTYsImV4cCI6MjEwMjc0MjI1Nn0.X6FbzDad06d5-kj1aK4zQkPSPrrLUW_O7CdfZ-ghwrM";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


let currentUser = null;
let ownerProperties = [];


/* =========================================================
   PAGE START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupDashboardButtons();

        await initializeOwnerDashboard();

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeOwnerDashboard() {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();


    if (error) {

        console.error(
            "Auth error:",
            error
        );

        showDashboardError(
            error.message
        );

        return;

    }


    currentUser = data.user;


    if (!currentUser) {

        alert(
            "Please login as an owner first."
        );

        window.location.href =
            "index.html";

        return;

    }


    console.log(
        "Logged in owner:",
        currentUser.id
    );


    updateOwnerName(
        currentUser
    );


    await loadOwnerProperties();

}


/* =========================================================
   LOAD ONLY LOGGED-IN OWNER'S PROPERTIES
   ========================================================= */

async function loadOwnerProperties() {

    const {
        data,
        error
    } = await supabaseClient

        .from("buildings")

        .select(`
            *,
            room_types(*)
        `)

        .eq(
            "created_by",
            currentUser.id
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Property loading error:",
            error
        );

        showDashboardError(
            error.message
        );

        return;

    }


    ownerProperties =
        data || [];


    console.log(
        "Owner properties:",
        ownerProperties
    );


    renderProperties();

    renderRoomAvailability();

    updateDashboardStats();

    populatePropertyFilter();

}


/* =========================================================
   UPDATE OWNER NAME
   ========================================================= */

function updateOwnerName(user) {

    const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Owner";


    const firstName =
        name.split(" ")[0];


    const welcome =
        document.querySelector(
            ".welcome-section h2"
        );


    if (welcome) {

        welcome.textContent =
            `Welcome back, ${firstName} 👋`;

    }


    const profileName =
        document.querySelector(
            ".owner-info strong"
        );


    if (profileName) {

        profileName.textContent =
            name;

    }


    const avatar =
        document.querySelector(
            ".owner-avatar"
        );


    if (avatar) {

        const initials =
            name
                .split(" ")
                .map(word => word[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();


        avatar.textContent =
            initials;

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

        console.error(
            "#ownerProperties not found"
        );

        return;

    }


    container.innerHTML = "";


    if (
        ownerProperties.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-properties">

                <div class="empty-icon">
                    🏠
                </div>

                <h3>
                    No properties listed yet
                </h3>

                <p>
                    List your first property
                    to manage it here.
                </p>

                <button
                    class="add-property-btn"
                    onclick="goToAddProperty()"
                >
                    <i class="fa-solid fa-plus"></i>
                    List My Property
                </button>

            </div>

        `;

        return;

    }


    ownerProperties.forEach(
        property => {

            container.appendChild(
                createPropertyCard(
                    property
                )
            );

        }
    );

}


/* =========================================================
   CREATE PROPERTY CARD
   ========================================================= */

function createPropertyCard(
    property
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "owner-property-card";


    const rooms =
        property.room_types || [];


    const availableRooms =
        rooms.reduce(
            (
                total,
                room
            ) => {

                return total +
                    Number(
                        room.available_rooms || 0
                    );

            },
            0
        );


    const roomTypeCount =
        rooms.length;


    const prices =
        rooms
            .map(
                room =>
                    Number(
                        room.price_value || 0
                    )
            )
            .filter(
                price =>
                    price > 0
            );


    const minimumPrice =
        prices.length
            ? Math.min(...prices)
            : 0;


    /*
       Property is considered available
       when at least one room is available.
    */

    const isAvailable =
        availableRooms > 0;


    const image =
        property.images &&
        property.images.length
            ? property.images[0]
            : "";


    const imageHTML =
        image

            ? `
                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(property.name)}"
                >
              `

            : `
                <div class="property-no-image">
                    <i class="fa-solid fa-building"></i>
                </div>
              `;


    card.innerHTML = `

        <div class="owner-property-image">

            ${imageHTML}

            <span
                class="
                    property-status-badge
                    ${isAvailable
                        ? "available"
                        : "occupied"}
                "
            >

                ${
                    isAvailable
                        ? "🟢 Available"
                        : "🔴 Occupied"
                }

            </span>

        </div>


        <div class="owner-property-content">


            <div class="property-header">

                <div>

                    <h3>
                        ${escapeHtml(
                            property.name
                        )}
                    </h3>

                    <p class="property-location">

                        <i class="fa-solid fa-location-dot"></i>

                        ${escapeHtml(
                            property.location ||
                            "Location not provided"
                        )}

                    </p>

                </div>


                <span class="property-type">

                    ${escapeHtml(
                        property.type ||
                        "Property"
                    )}

                </span>

            </div>


            <div class="property-summary">


                <div>

                    <span>
                        Room Types
                    </span>

                    <strong>
                        ${roomTypeCount}
                    </strong>

                </div>


                <div>

                    <span>
                        Available Rooms
                    </span>

                    <strong>
                        ${availableRooms}
                    </strong>

                </div>


                <div>

                    <span>
                        Starting From
                    </span>

                    <strong>

                        ${
                            minimumPrice
                                ? "₹" +
                                  minimumPrice.toLocaleString(
                                      "en-IN"
                                  )
                                : "—"
                        }

                    </strong>

                </div>


            </div>


            <!-- =============================================
                 INDIVIDUAL PROPERTY MANAGE SECTION
                 ============================================= -->

            <div class="property-manage-section">

                <div class="manage-title">

                    <h4>
                        Manage Property
                    </h4>

                    <span>
                        Availability
                    </span>

                </div>


                <div class="availability-buttons">


                    <button
                        type="button"
                        class="
                            availability-btn
                            available-btn
                            ${isAvailable
                                ? "active"
                                : ""}
                        "
                        data-property-id="${property.id}"
                        onclick="
                            changePropertyStatus(
                                '${property.id}',
                                'Available'
                            )
                        "
                    >

                        🟢 Available

                    </button>


                    <button
                        type="button"
                        class="
                            availability-btn
                            occupied-btn
                            ${!isAvailable
                                ? "active"
                                : ""}
                        "
                        data-property-id="${property.id}"
                        onclick="
                            changePropertyStatus(
                                '${property.id}',
                                'Occupied'
                            )
                        "
                    >

                        🔴 Occupied

                    </button>


                </div>


                <div class="property-actions">


                    <button
                        type="button"
                        class="view-btn"
                        onclick="
                            viewProperty(
                                '${property.id}'
                            )
                        "
                    >

                        <i class="fa-solid fa-eye"></i>
                        View

                    </button>


                    <button
                        type="button"
                        class="edit-btn"
                        onclick="
                            editProperty(
                                '${property.id}'
                            )
                        "
                    >

                        <i class="fa-solid fa-pen"></i>
                        Edit

                    </button>


                </div>


            </div>


        </div>

    `;


    return card;

}


/* =========================================================
   CHANGE PROPERTY STATUS
   ========================================================= */

async function changePropertyStatus(
    buildingId,
    newStatus
) {

    const property =
        ownerProperties.find(
            item =>
                item.id === buildingId
        );


    if (!property) {

        alert(
            "Property not found."
        );

        return;

    }


    const rooms =
        property.room_types || [];


    if (rooms.length === 0) {

        alert(
            "This property does not have any room types."
        );

        return;

    }


    const confirmed =
        confirm(
            `Set "${property.name}" as ${newStatus}?`
        );


    if (!confirmed) {

        return;

    }


    /*
       OCCUPIED

       Every room type belonging to THIS
       property becomes occupied.

       We use building_id, so another
       owner's property is untouched.
    */

    if (
        newStatus === "Occupied"
    ) {

        const {
            error
        } = await supabaseClient

            .from("room_types")

            .update({

                available_rooms: 0,

                availability: "Occupied"

            })

            .eq(
                "building_id",
                buildingId
            );


        if (error) {

            console.error(
                error
            );

            alert(
                `Could not update property: ${error.message}`
            );

            return;

        }

    }


    /*
       AVAILABLE

       We change the room status to Available.

       We do NOT change the owner's original
       room quantity here.
    */

    if (
        newStatus === "Available"
    ) {

        const {
            error
        } = await supabaseClient

            .from("room_types")

            .update({

                availability: "Available"

            })

            .eq(
                "building_id",
                buildingId
            );


        if (error) {

            console.error(
                error
            );

            alert(
                `Could not update property: ${error.message}`
            );

            return;

        }

    }


    await loadOwnerProperties();


}


/* =========================================================
   ROOM AVAILABILITY TABLE
   ========================================================= */

function renderRoomAvailability(
    filter = "all"
) {

    const body =
        document.getElementById(
            "roomTableBody"
        );


    if (!body) return;


    body.innerHTML = "";


    const rows = [];


    ownerProperties.forEach(
        property => {

            const rooms =
                property.room_types || [];


            rooms.forEach(
                room => {

                    if (
                        filter !== "all" &&
                        property.id !== filter
                    ) {

                        return;

                    }


                    rows.push({

                        property,

                        room

                    });

                }
            );

        }
    );


    if (
        rows.length === 0
    ) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="text-align:center;"
                >

                    No rooms found.

                </td>

            </tr>

        `;

        return;

    }


    rows.forEach(
        ({
            property,
            room
        }) => {

            const available =
                Number(
                    room.available_rooms || 0
                );


            const status =
                available > 0
                    ? "Available"
                    : "Occupied";


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <strong>
                        ${escapeHtml(
                            property.name
                        )}
                    </strong>

                </td>


                <td>

                    ${escapeHtml(
                        room.room_type ||
                        "Room"
                    )}

                </td>


                <td>

                    ₹${Number(
                        room.price_value || 0
                    ).toLocaleString(
                        "en-IN"
                    )}

                </td>


                <td>

                    ${
                        room.room_people ||
                        "—"
                    }

                </td>


                <td>

                    <span
                        class="
                            room-status
                            ${
                                status === "Available"
                                    ? "available"
                                    : "occupied"
                            }
                        "
                    >

                        ${status}

                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="status-btn"
                        onclick="
                            toggleRoomStatus(
                                '${room.id}',
                                ${available},
                                '${property.id}'
                            )
                        "
                    >

                        ${
                            available > 0
                                ? "Mark Occupied"
                                : "Mark Available"
                        }

                    </button>

                </td>

            `;


            body.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   INDIVIDUAL ROOM STATUS
   ========================================================= */

async function toggleRoomStatus(
    roomId,
    currentAvailable,
    buildingId
) {

    const newStatus =
        currentAvailable > 0
            ? "Occupied"
            : "Available";


    const newAvailable =
        newStatus === "Occupied"
            ? 0
            : 1;


    const {
        error
    } = await supabaseClient

        .from("room_types")

        .update({

            available_rooms:
                newAvailable,

            availability:
                newStatus

        })

        .eq(
            "id",
            roomId
        )

        .eq(
            "building_id",
            buildingId
        );


    if (error) {

        console.error(
            error
        );

        alert(
            error.message
        );

        return;

    }


    await loadOwnerProperties();

}


/* =========================================================
   PROPERTY FILTER
   ========================================================= */

function populatePropertyFilter() {

    const filter =
        document.getElementById(
            "propertyFilter"
        );


    if (!filter) return;


    filter.innerHTML = `

        <option value="all">
            All Properties
        </option>

    `;


    ownerProperties.forEach(
        property => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                property.id;


            option.textContent =
                property.name;


            filter.appendChild(
                option
            );

        }
    );


    filter.onchange =
        () => {

            renderRoomAvailability(
                filter.value
            );

        };


    renderRoomAvailability(
        "all"
    );

}


/* =========================================================
   DASHBOARD STATISTICS
   ========================================================= */

function updateDashboardStats() {

    let totalRooms = 0;

    let availableRooms = 0;

    let occupiedRooms = 0;


    ownerProperties.forEach(
        property => {

            const rooms =
                property.room_types || [];


            rooms.forEach(
                room => {

                    const available =
                        Number(
                            room.available_rooms || 0
                        );


                    /*
                       Each room type row is counted
                       as one room entry for now.
                    */

                    totalRooms += 1;


                    if (
                        available > 0
                    ) {

                        availableRooms += 1;

                    } else {

                        occupiedRooms += 1;

                    }

                }
            );

        }
    );


    setText(
        "totalProperties",
        ownerProperties.length
    );


    setText(
        "totalRooms",
        totalRooms
    );


    setText(
        "availableRooms",
        availableRooms
    );


    setText(
        "occupiedRooms",
        occupiedRooms
    );

}


/* =========================================================
   VIEW PROPERTY
   ========================================================= */

function viewProperty(
    buildingId
) {

    window.location.href =
        `property.html?id=${encodeURIComponent(
            buildingId
        )}`;

}


/* =========================================================
   EDIT PROPERTY
   ========================================================= */

function editProperty(
    buildingId
) {

    window.location.href =
        `edit-property.html?id=${encodeURIComponent(
            buildingId
        )}`;

}


/* =========================================================
   ADD PROPERTY
   ========================================================= */

function goToAddProperty() {

    window.location.href =
        "list-property.html";

}


/* =========================================================
   DASHBOARD BUTTONS
   ========================================================= */

function setupDashboardButtons() {

    const addButton =
        document.getElementById(
            "addPropertyBtn"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            goToAddProperty
        );

    }


    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutOwner
        );

    }


    /*
       Quick Add Property button
    */

    document
        .querySelectorAll(
            ".quick-card"
        )
        .forEach(
            card => {

                const title =
                    card.querySelector(
                        "strong"
                    )?.textContent;


                if (
                    title ===
                    "Add Property"
                ) {

                    card.addEventListener(
                        "click",
                        goToAddProperty
                    );

                }

            }
        );

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutOwner() {

    const confirmed =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) return;


    const {
        error
    } = await supabaseClient.auth.signOut();


    if (error) {

        alert(
            error.message
        );

        return;

    }


    window.location.href =
        "index.html";

}


/* =========================================================
   HELPERS
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function showDashboardError(
    message
) {

    const container =
        document.getElementById(
            "ownerProperties"
        );


    if (!container) return;


    container.innerHTML = `

        <div class="dashboard-error">

            <h3>
                Unable to load your properties
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

            <button
                type="button"
                onclick="location.reload()"
            >
                Try Again
            </button>

        </div>

    `;

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}