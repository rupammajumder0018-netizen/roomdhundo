
// ============================================================
// ROOMDHUNDO ADMIN PANEL
// SINGLE PAGE ADMIN.JS
// ============================================================
//
// Sections:
// 1. Dashboard
// 2. Properties
// 3. Registered Profiles
// 4. Reviews
// 5. Settings
//
// Real Supabase data only.
// Admin access verified through profiles.role.
// ============================================================


// ============================================================
// SUPABASE CONFIG
// ============================================================

const SUPABASE_URL =
    "https://vyusxdilgwrcgmqqvzsp.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dXN4ZGlsZ3dyY2dtcXF2enNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjYyNTYsImV4cCI6MjEwMjc0MjI1Nn0.X6FbzDad06d5-kj1aK4zQkPSPrrLUW_O7CdfZ-ghwrM";


// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// ============================================================
// GLOBAL STATE
// ============================================================

let buildings = [];
let profiles = [];
let reviews = [];
let enquiries = [];

let selectedProperty = null;
let selectedProfile = null;
let selectedReview = null;



// ============================================================
// GENERAL HELPERS
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            String(value ?? "");

    }

}


function formatDate(value) {

    if (!value) {

        return "—";

    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function formatPrice(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";

    }

    const number =
        Number(value);

    if (!Number.isFinite(number)) {

        return "—";

    }

    return (
        "₹" +
        number.toLocaleString("en-IN")
    );

}


function getInitial(
    name,
    fallback = "U"
) {

    const value =
        String(name || "")
            .trim();

    return (
        value.charAt(0) ||
        fallback
    ).toUpperCase();

}


// ============================================================
// PROPERTY HELPERS
// ============================================================

function getPropertyIcon(type) {

    switch (
        normalize(type)
    ) {

        case "pg":
            return "🏠";

        case "room":
            return "🛏️";

        case "mess":
            return "🍛";

        case "guest house":
        case "guest_house":
            return "🏡";

        case "flat":
            return "🏢";

        default:
            return "🏠";

    }

}


function getMinimumRent(property) {

    const rooms =
        Array.isArray(
            property?.room_types
        )
            ? property.room_types
            : [];

    const prices =
        rooms
            .map(
                room =>
                    Number(
                        room.price_value ??
                        room.room_rent ??
                        room.daily_price
                    )
            )
            .filter(
                value =>
                    Number.isFinite(value) &&
                    value > 0
            );

    if (!prices.length) {

        return null;

    }

    return Math.min(
        ...prices
    );

}


function getPropertyById(id) {

    return (
        buildings.find(
            building =>
                String(
                    building.id
                ) ===
                String(id)
        ) || null
    );

}


// ============================================================
// PROFILE ROLE HELPERS
// ============================================================

function getProfileRole(role) {

    const value =
        normalize(role);

    if (
        value === "owner" ||
        value === "landlord" ||
        value === "property owner" ||
        value === "property_owner"
    ) {

        return "owner";

    }

    if (
        value === "admin" ||
        value === "administrator" ||
        value === "super_admin"
    ) {

        return "admin";

    }

    return "user";

}


function getProfileRoleLabel(role) {

    const group =
        getProfileRole(role);

    if (group === "owner") {

        return "Owner";

    }

    if (group === "admin") {

        return "Admin";

    }

    return "User";

}


function getBuildingById(id) {

    return (
        buildings.find(
            building =>
                String(
                    building.id
                ) ===
                String(id)
        ) || null
    );

}


// ============================================================
// PAGE NAVIGATION
// ============================================================

function showSection(
    sectionName
) {

    document
        .querySelectorAll(
            ".admin-section"
        )
        .forEach(
            section => {

                section.classList.toggle(
                    "active-section",
                    section.dataset.sectionContent ===
                    sectionName
                );

            }
        );

    document
        .querySelectorAll(
            ".admin-nav .nav-item"
        )
        .forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.dataset.section ===
                    sectionName
                );

            }
        );

    updatePageHeader(
        sectionName
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (
        sectionName ===
        "dashboard"
    ) {

        renderDashboard();

    }

    else if (
        sectionName ===
        "properties"
    ) {

        renderPropertySection();

    }

    else if (
        sectionName ===
        "profiles"
    ) {

        renderProfileSection();

    }

    else if (
        sectionName ===
        "reviews"
    ) {

        renderReviewSection();

    }

    else if (sectionName === "enquiries") {
    renderEnquiriesSection();
}

    else if (
        sectionName ===
        "settings"
    ) {

        loadAdminSettings();

    }

}


// ============================================================
// PAGE HEADER
// ============================================================

function updatePageHeader(
    sectionName
) {

    const headers = {

        dashboard: {

            title:
                "Dashboard",

            subtitle:
                "Welcome back, Admin. Here's what's happening on RoomDhundo today."

        },

        properties: {

            title:
                "Properties",

            subtitle:
                "Manage the property listings currently available on RoomDhundo."

        },

        profiles: {

            title:
                "Registered Profiles",

            subtitle:
                "View all profiles registered on RoomDhundo."

        },

        reviews: {

            title:
                "Reviews",

            subtitle:
                "View reviews submitted for RoomDhundo properties."

        },

        settings: {

            title:
                "Settings",

            subtitle:
                "Manage your RoomDhundo administrator information."

        }

    };

    const header =
        headers[sectionName] ||
        headers.dashboard;

    setText(
        "pageTitle",
        header.title
    );

    setText(
        "pageSubtitle",
        header.subtitle
    );

}


// ============================================================
// LOAD ALL DATA
// ============================================================

async function loadAllData() {

    await loadBuildings();
    await loadProfiles();
    await loadReviews();
    await loadEnquiries();

    renderDashboard();
    renderPropertySection();
   renderProfileSection();
    renderReviewSection();
    renderEnquiriesSection();
}


// ============================================================
// LOAD BUILDINGS
// ============================================================

async function loadBuildings() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("buildings")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {

            console.error(
                "Buildings loading error:",
                error
            );

            buildings = [];

            const table =
                document.getElementById(
                    "propertyTableBody"
                );

            if (table) {

                table.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="empty-state"
                        >
                            Unable to load properties.
                            <br>
                            ${escapeHTML(error.message)}
                        </td>
                    </tr>
                `;

            }

            return;

        }

        buildings =
            Array.isArray(data)
                ? data
                : [];

        await loadRoomTypes();

        console.log(
            "Buildings loaded:",
            buildings.length
        );

    }

    catch (error) {

        console.error(
            "Buildings loading failed:",
            error
        );

        buildings = [];

    }

}


// ============================================================
// LOAD ROOM TYPES
// ============================================================

async function loadRoomTypes() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("room_types")
                .select(`
                    id,
                    building_id,
                    room_type,
                    price_value,
                    daily_price,
                    room_rent,
                    room_people,
                    available_rooms,
                    availability
                `);

        if (error) {

            console.warn(
                "Room types loading error:",
                error
            );

            buildings =
                buildings.map(
                    building => ({

                        ...building,

                        room_types: []

                    })
                );

            return;

        }

        const roomTypes =
            Array.isArray(data)
                ? data
                : [];

        buildings =
            buildings.map(
                building => ({

                    ...building,

                    room_types:
                        roomTypes.filter(
                            room =>
                                String(
                                    room.building_id
                                ) ===
                                String(
                                    building.id
                                )
                        )

                })
            );

    }

    catch (error) {

        console.warn(
            "Room types loading failed:",
            error
        );

        buildings =
            buildings.map(
                building => ({

                    ...building,

                    room_types: []

                })
            );

    }

}


// ============================================================
// LOAD PROFILES
// ============================================================

async function loadProfiles() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id, full_name, role, created_at"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {

            console.error(
                "Profiles loading error:",
                error
            );

            profiles = [];

            return;

        }

        profiles =
            Array.isArray(data)
                ? data
                : [];

    }

    catch (error) {

        console.error(
            "Profile loading failed:",
            error
        );

        profiles = [];

    }

}


// ============================================================
// LOAD REVIEWS
// ============================================================

async function loadReviews() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("reviews")
                .select(`
                    id,
                    building_id,
                    user_id,
                    reviewer_name,
                    rating,
                    comment,
                    created_at
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {

            console.error(
                "Reviews loading error:",
                error
            );

            reviews = [];

            return;

        }

        reviews =
            Array.isArray(data)
                ? data
                : [];

    }

    catch (error) {

        console.error(
            "Reviews loading failed:",
            error
        );

        reviews = [];

    }

}

// ============================================================
// LOAD ENQUIRIES
// ============================================================

async function loadEnquiries() {

    try {

        const { data, error } = await supabaseClient
            .from("enquiries")
            .select(`
                id,
                user_id,
                owner_id,
                property_id,
                room_type,
                message,
                status,
                created_at,
                updated_at,
                renter_phone
            `)
            .order("created_at", {
                ascending: false
            });


        if (error) {
            console.error("Error loading enquiries:", error);
            enquiries = [];
            return;
        }


        enquiries = Array.isArray(data)
            ? data
            : [];


        console.log(
            "Enquiries loaded:",
            enquiries.length
        );

    } catch (error) {

        console.error(
            "Unexpected error loading enquiries:",
            error
        );

        enquiries = [];
    }

}


// ============================================================
// DASHBOARD
// ============================================================

function renderDashboard() {

    const users =
        profiles.filter(
            profile =>
                getProfileRole(
                    profile.role
                ) === "user"
        ).length;

    const owners =
        profiles.filter(
            profile =>
                getProfileRole(
                    profile.role
                ) === "owner"
        ).length;

    setText(
        "dashboardTotalUsers",
        users
    );

    setText(
        "dashboardTotalOwners",
        owners
    );

    setText(
        "dashboardTotalProperties",
        buildings.length
    );

    setText(
        "dashboardTotalReviews",
        reviews.length
    );

    renderDashboardRecentProperties();

}


// ============================================================
// DASHBOARD RECENT PROPERTIES
// ============================================================

function renderDashboardRecentProperties() {

    const container =
        document.getElementById(
            "dashboardRecentProperties"
        );

    if (!container) {
        return;
    }

    const recent =
        buildings.slice(
            0,
            5
        );

    if (!recent.length) {

        container.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty-state"
                >
                    No properties available.
                </td>
            </tr>
        `;

        return;

    }

    container.innerHTML =
        recent
            .map(
                property => `

                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    property.name ||
                                    "Unnamed Property"
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                property.owner_name ||
                                "Not specified"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                property.location ||
                                "Not specified"
                            )}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="view-all-btn"
                                data-dashboard-property-id="${escapeHTML(
                                    property.id
                                )}"
                            >
                                View
                            </button>

                        </td>

                    </tr>

                `
            )
            .join("");

    container
        .querySelectorAll(
            "[data-dashboard-property-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showSection(
                            "properties"
                        );

                        openPropertyModal(
                            button.dataset
                                .dashboardPropertyId
                        );

                    }
                );

            }
        );

}


// ============================================================
// PROPERTIES
// ============================================================

function renderPropertySection() {

    const tableBody =
        document.getElementById(
            "propertyTableBody"
        );

    if (!tableBody) {
        return;
    }

    const search =
        normalize(
            document.getElementById(
                "propertySearch"
            )?.value
        );

    const selectedType =
        normalize(
            document.getElementById(
                "propertyTypeFilter"
            )?.value ||
            "all"
        );

    const sort =
        normalize(
            document.getElementById(
                "propertySort"
            )?.value ||
            "newest"
        );

    let list =
        buildings.filter(
            property => {

                const name =
                    normalize(
                        property.name
                    );

                const owner =
                    normalize(
                        property.owner_name
                    );

                const location =
                    normalize(
                        property.location
                    );

                const type =
                    normalize(
                        property.type
                    );

                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    owner.includes(search) ||
                    location.includes(search) ||
                    type.includes(search);

                const matchesType =
                    selectedType === "all" ||
                    type === selectedType;

                return (
                    matchesSearch &&
                    matchesType
                );

            }
        );

    if (
        sort ===
        "newest"
    ) {

        list.sort(
            (a, b) =>
                new Date(
                    b.created_at || 0
                ) -
                new Date(
                    a.created_at || 0
                )
        );

    }

    else if (
        sort ===
        "oldest"
    ) {

        list.sort(
            (a, b) =>
                new Date(
                    a.created_at || 0
                ) -
                new Date(
                    b.created_at || 0
                )
        );

    }

    else if (
        sort ===
        "price-low"
    ) {

        list.sort(
            (a, b) =>
                (
                    getMinimumRent(a) ??
                    Infinity
                ) -
                (
                    getMinimumRent(b) ??
                    Infinity
                )
        );

    }

    else if (
        sort ===
        "price-high"
    ) {

        list.sort(
            (a, b) =>
                (
                    getMinimumRent(b) ??
                    -Infinity
                ) -
                (
                    getMinimumRent(a) ??
                    -Infinity
                )
        );

    }

    setText(
        "propertiesTotalCount",
        buildings.length
    );

    setText(
        "propertyCount",
        `${list.length} ${
            list.length === 1
                ? "Property"
                : "Properties"
        }`
    );

    if (!list.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-state"
                >
                    No properties found.
                </td>
            </tr>
        `;

        return;

    }

    tableBody.innerHTML =
        list
            .map(
                property => {

                    const rooms =
                        Array.isArray(
                            property.room_types
                        )
                            ? property.room_types
                            : [];

                    const roomText =
                        rooms
                            .map(
                                room =>
                                    room.room_type
                            )
                            .filter(Boolean)
                            .join(", ") ||
                        "Property";

                    let image =
                        `
                            <span>
                                ${getPropertyIcon(
                                    property.type
                                )}
                            </span>
                        `;

                    if (
                        Array.isArray(
                            property.images
                        ) &&
                        property.images.length > 0 &&
                        property.images[0]
                    ) {

                        image =
                            `
                                <img
                                    src="${escapeHTML(
                                        property.images[0]
                                    )}"
                                    alt="${escapeHTML(
                                        property.name ||
                                        "Property"
                                    )}"
                                    style="
                                        width:48px;
                                        height:48px;
                                        object-fit:cover;
                                        border-radius:8px;
                                        display:block;
                                    "
                                    onerror="this.style.display='none';"
                                >
                            `;

                    }

                    return `
                        <tr>

                            <td>

                                <div class="property-info">

                                    <div class="property-image">
                                        ${image}
                                    </div>

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                property.name ||
                                                "Unnamed Property"
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                roomText
                                            )}
                                        </span>

                                    </div>

                                </div>

                            </td>

                            <td>
                                ${escapeHTML(
                                    property.type ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    property.owner_name ||
                                    "Not specified"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    property.location ||
                                    "Not specified"
                                )}
                            </td>

                            <td>
                                ${formatPrice(
                                    getMinimumRent(
                                        property
                                    )
                                )}
                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="action-btn view-btn"
                                    data-property-id="${escapeHTML(
                                        property.id
                                    )}"
                                >
                                    View
                                </button>

                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="action-btn delete-btn"
                                    data-property-id="${escapeHTML(
                                        property.id
                                    )}"
                                >
                                    🗑️ Delete
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

    attachPropertyButtons();

}


// ============================================================
// PROPERTY BUTTON EVENTS
// ============================================================

function attachPropertyButtons() {

    document
        .querySelectorAll(
            "#propertyTableBody .view-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openPropertyModal(
                            button.dataset.propertyId
                        );

                    }
                );

            }
        );

    document
        .querySelectorAll(
            "#propertyTableBody .delete-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteProperty(
                            button.dataset.propertyId
                        );

                    }
                );

            }
        );

}


// ============================================================
// PROPERTY MODAL
// ============================================================

function openPropertyModal(
    propertyId
) {

    const property =
        getPropertyById(
            propertyId
        );

    if (!property) {

        alert(
            "Property not found."
        );

        return;

    }

    selectedProperty =
        property;

    setText(
        "modalPropertyName",
        property.name ||
        "Property Details"
    );

    setText(
        "modalPropertyType",
        property.type ||
        "Property"
    );

    setText(
        "modalPropertyIcon",
        getPropertyIcon(
            property.type
        )
    );

    setText(
        "modalOwner",
        property.owner_name ||
        "Not specified"
    );

    setText(
        "modalLocation",
        property.location ||
        "Not specified"
    );

    setText(
        "modalRent",
        formatPrice(
            getMinimumRent(
                property
            )
        )
    );

    setText(
        "modalDescription",
        property.description ||
        "No description available."
    );

    openModalById(
        "propertyModal"
    );

}


// ============================================================
// DELETE PROPERTY
// ============================================================

// ============================================================
// DELETE PROPERTY
// ============================================================

async function deleteProperty(propertyId) {

    const property = getPropertyById(propertyId);

    if (!property) {
        alert("Property not found.");
        return;
    }

    const name = property.name || "this property";

    const confirmed = window.confirm(
        `Are you sure you want to permanently delete "${name}"?\n\n` +
        `This will delete the property, its rooms, reviews, and saved records.\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    try {

        // -----------------------------------------
        // 1. DELETE REVIEWS
        // -----------------------------------------

        const { error: reviewError } =
            await supabaseClient
                .from("reviews")
                .delete()
                .eq("building_id", propertyId);

        if (reviewError) {
            throw new Error(
                `Unable to delete reviews: ${reviewError.message}`
            );
        }


        // -----------------------------------------
        // 2. DELETE SAVED PROPERTY RECORDS
        // -----------------------------------------

        const { error: savedError } =
            await supabaseClient
                .from("saved_buildings")
                .delete()
                .eq("building_id", propertyId);

        if (savedError) {
            throw new Error(
                `Unable to delete saved property records: ${savedError.message}`
            );
        }


        // -----------------------------------------
        // 3. DELETE ROOM TYPES
        // -----------------------------------------

        const { error: roomError } =
            await supabaseClient
                .from("room_types")
                .delete()
                .eq("building_id", propertyId);

        if (roomError) {
            throw new Error(
                `Unable to delete room information: ${roomError.message}`
            );
        }


        // -----------------------------------------
        // 4. DELETE BUILDING
        // -----------------------------------------

        const { error: buildingError } =
            await supabaseClient
                .from("buildings")
                .delete()
                .eq("id", propertyId);

        if (buildingError) {
            throw new Error(
                `Unable to delete property: ${buildingError.message}`
            );
        }


        // -----------------------------------------
        // 5. VERIFY PROPERTY IS REALLY DELETED
        // -----------------------------------------

        const {
            data: verifyData,
            error: verifyError
        } =
            await supabaseClient
                .from("buildings")
                .select("id")
                .eq("id", propertyId)
                .maybeSingle();

        if (verifyError) {
            throw new Error(
                `Could not verify deletion: ${verifyError.message}`
            );
        }

        if (verifyData) {
            throw new Error(
                "The property still exists in the database."
            );
        }


        // -----------------------------------------
        // 6. UPDATE LOCAL DATA
        // -----------------------------------------

        buildings = buildings.filter(
            building =>
                String(building.id) !==
                String(propertyId)
        );

        reviews = reviews.filter(
            review =>
                String(review.building_id) !==
                String(propertyId)
        );

        selectedProperty = null;


        // -----------------------------------------
        // 7. CLOSE MODAL
        // -----------------------------------------

        closeModalById("propertyModal");


        // -----------------------------------------
        // 8. RELOAD DATA FROM SUPABASE
        // -----------------------------------------

        await loadAllData();


        // -----------------------------------------
        // 9. SUCCESS
        // -----------------------------------------

        alert(
            `"${name}" was permanently deleted successfully.`
        );

    }

    catch (error) {

        console.error(
            "Delete property error:",
            error
        );

        alert(
            `Property could not be deleted.\n\n${error.message}`
        );

    }

}


// ============================================================
// REGISTERED PROFILES
// ============================================================

function renderProfileSection() {

    const tableBody =
        document.getElementById(
            "profileTableBody"
        );

    if (!tableBody) {
        return;
    }

    const search =
        normalize(
            document.getElementById(
                "profileSearch"
            )?.value
        );

    const roleFilter =
        normalize(
            document.getElementById(
                "profileRoleFilter"
            )?.value ||
            "all"
        );

    const sort =
        normalize(
            document.getElementById(
                "profileSort"
            )?.value ||
            "newest"
        );

    let list =
        profiles.filter(
            profile => {

                const name =
                    normalize(
                        profile.full_name
                    );

                const role =
                    normalize(
                        profile.role
                    );

                const id =
                    normalize(
                        profile.id
                    );

                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    role.includes(search) ||
                    id.includes(search);

                const normalizedRole =
                    getProfileRole(
                        profile.role
                    );

                const matchesRole =
                    roleFilter === "all" ||
                    normalizedRole === roleFilter;

                return (
                    matchesSearch &&
                    matchesRole
                );

            }
        );

    if (
        sort ===
        "newest"
    ) {

        list.sort(
            (a, b) =>
                new Date(
                    b.created_at || 0
                ) -
                new Date(
                    a.created_at || 0
                )
        );

    }

    else if (
        sort ===
        "oldest"
    ) {

        list.sort(
            (a, b) =>
                new Date(
                    a.created_at || 0
                ) -
                new Date(
                    b.created_at || 0
                )
        );

    }

    else if (
        sort ===
        "name"
    ) {

        list.sort(
            (a, b) =>
                String(
                    a.full_name || ""
                ).localeCompare(
                    String(
                        b.full_name || ""
                    )
                )
        );

    }

    else if (
        sort ===
        "name-desc"
    ) {

        list.sort(
            (a, b) =>
                String(
                    b.full_name || ""
                ).localeCompare(
                    String(
                        a.full_name || ""
                    )
                )
        );

    }

    const users =
        profiles.filter(
            profile =>
                getProfileRole(
                    profile.role
                ) === "user"
        ).length;

    const owners =
        profiles.filter(
            profile =>
                getProfileRole(
                    profile.role
                ) === "owner"
        ).length;

    const admins =
        profiles.filter(
            profile =>
                getProfileRole(
                    profile.role
                ) === "admin"
        ).length;

    setText(
        "profilesAllCount",
        profiles.length
    );

    setText(
        "profilesUserCount",
        users
    );

    setText(
        "profilesOwnerCount",
        owners
    );

    setText(
        "profilesAdminCount",
        admins
    );

    setText(
        "profileCount",
        `${list.length} ${
            list.length === 1
                ? "Profile"
                : "Profiles"
        }`
    );

    if (!list.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-state"
                >
                    No profiles found.
                </td>
            </tr>
        `;

        return;

    }

    tableBody.innerHTML =
        list
            .map(
                profile => {

                    const name =
                        profile.full_name?.trim() ||
                        "Unnamed Profile";

                    const role =
                        getProfileRole(
                            profile.role
                        );

                    const label =
                        getProfileRoleLabel(
                            profile.role
                        );

                    return `
                        <tr>

                            <td>

                                <div class="user-info">

                                    <div class="user-avatar">
                                        ${escapeHTML(
                                            getInitial(
                                                name
                                            )
                                        )}
                                    </div>

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                name
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                label
                                            )}
                                        </span>

                                    </div>

                                </div>

                            </td>

                            <td>

                                <span
                                    class="status ${escapeHTML(
                                        role
                                    )}"
                                >
                                    ${escapeHTML(
                                        label
                                    )}
                                </span>

                            </td>

                            <td
                                style="
                                    max-width:280px;
                                    word-break:break-all;
                                    font-size:11px;
                                    color:#6b7280;
                                "
                            >
                                ${escapeHTML(
                                    profile.id
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    formatDate(
                                        profile.created_at
                                    )
                                )}
                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="action-btn profile-view-btn"
                                    data-profile-id="${escapeHTML(
                                        profile.id
                                    )}"
                                >
                                    View
                                </button>

                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="action-btn delete-btn profile-delete-btn"
                                    data-profile-id="${escapeHTML(
                                        profile.id
                                    )}"
                                >
                                    🗑️ Delete
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

    attachProfileButtons();

}


// ============================================================
// PROFILE BUTTONS
// ============================================================

function attachProfileButtons() {

    document
        .querySelectorAll(
            "#profileTableBody .profile-view-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openProfileModal(
                            button.dataset.profileId
                        );

                    }
                );

            }
        );

    document
        .querySelectorAll(
            "#profileTableBody .profile-delete-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteProfile(
                            button.dataset.profileId
                        );

                    }
                );

            }
        );

}


// ============================================================
// DELETE PROFILE
// ============================================================

// ============================================================
// DELETE PROFILE
// ============================================================

async function deleteProfile(profileId) {

    const profile = profiles.find(
        item =>
            String(item.id) ===
            String(profileId)
    );

    if (!profile) {
        alert("Profile not found.");
        return;
    }

    const name =
        profile.full_name?.trim() ||
        "this profile";

    const role =
        getProfileRole(profile.role);


    // -----------------------------------------
    // ADMIN PROTECTION
    // -----------------------------------------

    if (role === "admin") {

        alert(
            "Admin profiles cannot be deleted from this panel."
        );

        return;
    }


    const confirmed =
        window.confirm(
            `Are you sure you want to permanently delete "${name}"?\n\n` +
            `This will delete the profile record and related saved data.\n\n` +
            `This action cannot be undone.`
        );

    if (!confirmed) {
        return;
    }


    try {

        // -----------------------------------------
        // 1. DELETE SAVED BUILDINGS
        // -----------------------------------------

        const { error: savedError } =
            await supabaseClient
                .from("saved_buildings")
                .delete()
                .eq("user_id", profileId);

        if (savedError) {

            throw new Error(
                `Unable to delete saved properties: ${savedError.message}`
            );

        }


        // -----------------------------------------
        // 2. DELETE REVIEWS
        // -----------------------------------------

        const { error: reviewError } =
            await supabaseClient
                .from("reviews")
                .delete()
                .eq("user_id", profileId);

        if (reviewError) {

            throw new Error(
                `Unable to delete reviews: ${reviewError.message}`
            );

        }


        // -----------------------------------------
        // 3. DELETE PROFILE
        // -----------------------------------------

        const { error: profileError } =
            await supabaseClient
                .from("profiles")
                .delete()
                .eq("id", profileId);

        if (profileError) {

            throw new Error(
                `Unable to delete profile: ${profileError.message}`
            );

        }


        // -----------------------------------------
        // 4. VERIFY PROFILE IS REALLY DELETED
        // -----------------------------------------

        const {
            data: verifyData,
            error: verifyError
        } =
            await supabaseClient
                .from("profiles")
                .select("id")
                .eq("id", profileId)
                .maybeSingle();

        if (verifyError) {

            throw new Error(
                `Could not verify deletion: ${verifyError.message}`
            );

        }

        if (verifyData) {

            throw new Error(
                "The profile still exists in the database."
            );

        }


        // -----------------------------------------
        // 5. UPDATE LOCAL STATE
        // -----------------------------------------

        profiles =
            profiles.filter(
                item =>
                    String(item.id) !==
                    String(profileId)
            );

        selectedProfile = null;


        // -----------------------------------------
        // 6. CLOSE MODAL
        // -----------------------------------------

        closeModalById(
            "profileModal"
        );


        // -----------------------------------------
        // 7. REFRESH ADMIN DATA
        // -----------------------------------------

        await loadAllData();


        // -----------------------------------------
        // 8. SUCCESS
        // -----------------------------------------

        alert(
            `"${name}" profile was permanently deleted from RoomDhundo.`
        );

    }

    catch (error) {

        console.error(
            "Delete profile error:",
            error
        );

        alert(
            `Profile could not be deleted.\n\n${error.message}`
        );

    }

}


// ============================================================
// PROFILE MODAL
// ============================================================

function openProfileModal(
    profileId
) {

    const profile =
        profiles.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    profileId
                )
        );

    if (!profile) {

        alert(
            "Profile not found."
        );

        return;

    }

    selectedProfile =
        profile;

    const name =
        profile.full_name?.trim() ||
        "Unnamed Profile";

    const role =
        getProfileRoleLabel(
            profile.role
        );

    setText(
        "modalProfileName",
        name
    );

    setText(
        "modalProfileRole",
        role
    );

    setText(
        "modalProfileAvatar",
        getInitial(
            name
        )
    );

    setText(
        "modalProfileFullName",
        name
    );

    setText(
        "modalProfileRoleDetail",
        role
    );

    setText(
        "modalProfileId",
        profile.id
    );

    setText(
        "modalProfileJoined",
        formatDate(
            profile.created_at
        )
    );

    openModalById(
        "profileModal"
    );

}


// ============================================================
// REVIEWS
// ============================================================

function renderReviewSection() {

    const tableBody =
        document.getElementById(
            "reviewTableBody"
        );

    if (!tableBody) {
        return;
    }

    const search =
        normalize(
            document.getElementById(
                "reviewSearch"
            )?.value
        );

    const ratingFilter =
        document.getElementById(
            "reviewRatingFilter"
        )?.value ||
        "all";

    const sort =
        normalize(
            document.getElementById(
                "reviewSort"
            )?.value ||
            "newest"
        );

    let list =
        reviews.filter(
            review => {

                const property =
                    getBuildingById(
                        review.building_id
                    );

                const reviewer =
                    normalize(
                        review.reviewer_name
                    );

                const propertyName =
                    normalize(
                        property?.name
                    );

                const comment =
                    normalize(
                        review.comment
                    );

                const matchesSearch =
                    !search ||
                    reviewer.includes(search) ||
                    propertyName.includes(search) ||
                    comment.includes(search);

                const matchesRating =
                    ratingFilter === "all" ||
                    Number(
                        review.rating
                    ) ===
                    Number(
                        ratingFilter
                    );

                return (
                    matchesSearch &&
                    matchesRating
                );

            }
        );

    if (
        sort ===
        "newest"
    ) {

        list.sort(
            (a, b) =>
                new Date(
                    b.created_at || 0
                ) -
                new Date(
                    a.created_at || 0
                )
        );

    }

    else if (
        sort ===
        "oldest"
    ) {

        list.sort(
            (a, b) =>
                new Date(
                    a.created_at || 0
                ) -
                new Date(
                    b.created_at || 0
                )
        );

    }

    else if (
        sort ===
        "highest"
    ) {

        list.sort(
            (a, b) =>
                Number(
                    b.rating || 0
                ) -
                Number(
                    a.rating || 0
                )
        );

    }

    else if (
        sort ===
        "lowest"
    ) {

        list.sort(
            (a, b) =>
                Number(
                    a.rating || 0
                ) -
                Number(
                    b.rating || 0
                )
        );

    }

    setText(
        "reviewsTotalCount",
        reviews.length
    );

    setText(
        "reviewCount",
        `${list.length} ${
            list.length === 1
                ? "Review"
                : "Reviews"
        }`
    );

    if (!list.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-state"
                >
                    No reviews found.
                </td>
            </tr>
        `;

        return;

    }

    tableBody.innerHTML =
        list
            .map(
                review => {

                    const property =
                        getBuildingById(
                            review.building_id
                        );

                    const rating =
                        Number(
                            review.rating || 0
                        );

                    const safeRating =
                        Math.max(
                            0,
                            Math.min(
                                rating,
                                5
                            )
                        );

                    const stars =
                        safeRating > 0
                            ? "⭐".repeat(
                                safeRating
                            )
                            : "—";

                    return `
                        <tr>

                            <td>

                                <strong>
                                    ${escapeHTML(
                                        review.reviewer_name ||
                                        "Anonymous"
                                    )}
                                </strong>

                            </td>

                            <td>

                                ${escapeHTML(
                                    property?.name ||
                                    "Property unavailable"
                                )}

                            </td>

                            <td>

                                ${stars}

                            </td>

                            <td
                                style="
                                    max-width:320px;
                                    white-space:nowrap;
                                    overflow:hidden;
                                    text-overflow:ellipsis;
                                "
                            >

                                ${escapeHTML(
                                    review.comment ||
                                    "No comment"
                                )}

                            </td>

                            <td>

                                ${escapeHTML(
                                    formatDate(
                                        review.created_at
                                    )
                                )}

                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="action-btn review-view-btn"
                                    data-review-id="${escapeHTML(
                                        review.id
                                    )}"
                                >
                                    View
                                </button>

                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="action-btn delete-btn review-delete-btn"
                                    data-review-id="${escapeHTML(
                                        review.id
                                    )}"
                                >
                                    🗑️ Delete
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

    attachReviewButtons();

}


// ============================================================
// REVIEW BUTTONS
// ============================================================

function attachReviewButtons() {

    document
        .querySelectorAll(
            "#reviewTableBody .review-view-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openReviewModal(
                            button.dataset.reviewId
                        );

                    }
                );

            }
        );

    document
        .querySelectorAll(
            "#reviewTableBody .review-delete-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteReview(
                            button.dataset.reviewId
                        );

                    }
                );

            }
        );

}


// ============================================================
// DELETE REVIEW
// ============================================================

async function deleteReview(
    reviewId
) {

    const review =
        reviews.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    reviewId
                )
        );

    if (!review) {

        alert(
            "Review not found."
        );

        return;

    }

    const reviewer =
        review.reviewer_name?.trim() ||
        "Anonymous";

    const confirmed =
        window.confirm(
            `Are you sure you want to permanently delete the review by "${reviewer}"?\n\nThis action cannot be undone.`
        );

    if (!confirmed) {
        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient
                .from("reviews")
                .delete()
                .eq(
                    "id",
                    reviewId
                );

        if (error) {

            console.error(
                "Delete review error:",
                error
            );

            alert(
                `Unable to delete review: ${error.message}`
            );

            return;

        }

        reviews =
            reviews.filter(
                item =>
                    String(
                        item.id
                    ) !==
                    String(
                        reviewId
                    )
            );

        selectedReview =
            null;

        closeModalById(
            "reviewModal"
        );

        renderDashboard();

        renderReviewSection();

        alert(
            "Review deleted successfully."
        );

    }

    catch (error) {

        console.error(
            "Delete review failed:",
            error
        );

        alert(
            "Something went wrong while deleting the review."
        );

    }

}


// ============================================================
// REVIEW MODAL
// ============================================================

function openReviewModal(
    reviewId
) {

    const review =
        reviews.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    reviewId
                )
        );

    if (!review) {

        alert(
            "Review not found."
        );

        return;

    }

    selectedReview =
        review;

    const property =
        getBuildingById(
            review.building_id
        );

    const rating =
        Number(
            review.rating || 0
        );

    const safeRating =
        Math.max(
            0,
            Math.min(
                rating,
                5
            )
        );

    setText(
        "modalReviewTitle",
        "Review Details"
    );

    setText(
        "modalReviewProperty",
        property?.name ||
        "Property unavailable"
    );

    setText(
        "modalReviewerName",
        review.reviewer_name ||
        "Anonymous"
    );

    setText(
        "modalReviewRating",
        safeRating > 0
            ? `${"⭐".repeat(
                safeRating
            )} ${safeRating}/5`
            : "—"
    );

    setText(
        "modalReviewDate",
        formatDate(
            review.created_at
        )
    );

    setText(
        "modalReviewComment",
        review.comment ||
        "No comment provided."
    );

    openModalById(
        "reviewModal"
    );

}


// ============================================================
// MODAL HELPERS
// ============================================================

function openModalById(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.add(
        "show"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

}


function closeModalById(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "show"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

}


// ============================================================
// MODAL EVENTS
// ============================================================

function bindModalEvents() {

    document
        .querySelectorAll(
            ".modal-close"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const modal =
                            button.closest(
                                ".admin-modal"
                            );

                        if (modal) {

                            closeModalById(
                                modal.id
                            );

                        }

                    }
                );

            }
        );

    document
        .querySelectorAll(
            ".admin-modal"
        )
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            closeModalById(
                                modal.id
                            );

                        }

                    }
                );

            }
        );

    document
        .getElementById(
            "closePropertyBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                closeModalById(
                    "propertyModal"
                );

                selectedProperty =
                    null;

            }
        );

    document
        .getElementById(
            "closeProfileBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                closeModalById(
                    "profileModal"
                );

                selectedProfile =
                    null;

            }
        );

    document
        .getElementById(
            "closeReviewBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                closeModalById(
                    "reviewModal"
                );

                selectedReview =
                    null;

            }
        );
        const enquiryModal =
    document.getElementById("enquiryModal");

const closeEnquiryModal =
    document.getElementById("closeEnquiryModal");

const closeEnquiryBtn =
    document.getElementById("closeEnquiryBtn");


function closeEnquiryDetails() {

    if (!enquiryModal) return;

    enquiryModal.classList.remove("show");

    enquiryModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
    "";
}


if (closeEnquiryModal) {

    closeEnquiryModal.addEventListener(
        "click",
        closeEnquiryDetails
    );

}


if (closeEnquiryBtn) {

    closeEnquiryBtn.addEventListener(
        "click",
        closeEnquiryDetails
    );

}


if (enquiryModal) {

    enquiryModal.addEventListener(
        "click",
        (event) => {

            if (event.target === enquiryModal) {
                closeEnquiryDetails();
            }

        }
    );

}

}


// ============================================================
// FILTER EVENTS
// ============================================================

function bindFilterEvents() {

    document
        .getElementById(
            "propertySearch"
        )
        ?.addEventListener(
            "input",
            renderPropertySection
        );

    document
        .getElementById(
            "propertySearchBtn"
        )
        ?.addEventListener(
            "click",
            renderPropertySection
        );

    document
        .getElementById(
            "propertyTypeFilter"
        )
        ?.addEventListener(
            "change",
            renderPropertySection
        );

    document
        .getElementById(
            "propertySort"
        )
        ?.addEventListener(
            "change",
            renderPropertySection
        );

    document
        .getElementById(
            "profileSearch"
        )
        ?.addEventListener(
            "input",
            renderProfileSection
        );

    document
        .getElementById(
            "profileSearchBtn"
        )
        ?.addEventListener(
            "click",
            renderProfileSection
        );

    document
        .getElementById(
            "profileRoleFilter"
        )
        ?.addEventListener(
            "change",
            renderProfileSection
        );

    document
        .getElementById(
            "profileSort"
        )
        ?.addEventListener(
            "change",
            renderProfileSection
        );

    document
        .getElementById(
            "reviewSearch"
        )
        ?.addEventListener(
            "input",
            renderReviewSection
        );

    document
        .getElementById(
            "reviewSearchBtn"
        )
        ?.addEventListener(
            "click",
            renderReviewSection
        );

    document
        .getElementById(
            "reviewRatingFilter"
        )
        ?.addEventListener(
            "change",
            renderReviewSection
        );

    document
        .getElementById(
            "reviewSort"
        )
        ?.addEventListener(
            "change",
            renderReviewSection
        );

}

// ============================================================
// RENDER ENQUIRIES SECTION
// ============================================================

function renderEnquiriesSection() {

    const tableBody = document.getElementById("enquiryTableBody");

    const totalCount = document.getElementById("enquiriesTotalCount");
    const pendingCount = document.getElementById("enquiriesPendingCount");
    const acceptedCount = document.getElementById("enquiriesAcceptedCount");
    const contactedCount = document.getElementById("enquiriesContactedCount");
    const enquiryCount = document.getElementById("enquiryCount");


    if (!tableBody) return;


    // --------------------------------------------------------
    // COUNTS
    // --------------------------------------------------------

    const total = enquiries.length;

    const pending = enquiries.filter(
        enquiry => normalize(enquiry.status) === "pending"
    ).length;

    const accepted = enquiries.filter(
        enquiry => normalize(enquiry.status) === "accepted"
    ).length;

    const contacted = enquiries.filter(
        enquiry => normalize(enquiry.status) === "contacted"
    ).length;


    if (totalCount) {
        totalCount.textContent = total;
    }

    if (pendingCount) {
        pendingCount.textContent = pending;
    }

    if (acceptedCount) {
        acceptedCount.textContent = accepted;
    }

    if (contactedCount) {
        contactedCount.textContent = contacted;
    }

    if (enquiryCount) {
        enquiryCount.textContent =
            `${total} ${total === 1 ? "Enquiry" : "Enquiries"}`;
    }


    // --------------------------------------------------------
    // EMPTY STATE
    // --------------------------------------------------------

    if (!enquiries.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-state"
                >
                    No enquiries found.
                </td>
            </tr>
        `;

        return;
    }

const filteredEnquiries = getFilteredEnquiries();
    // --------------------------------------------------------
    // TABLE ROWS
    // --------------------------------------------------------

    tableBody.innerHTML = filteredEnquiries.map(enquiry => {

        const property = buildings.find(
            building =>
                String(building.id) === String(enquiry.property_id)
        );


        const owner = profiles.find(
            profile =>
                String(profile.id) === String(enquiry.owner_id)
        );


        const propertyName =
            property?.name ||
            property?.property_name ||
            "Unknown Property";


        const ownerName =
            owner?.full_name ||
            "Unknown Owner";


        const user = profiles.find(
            profile =>
                String(profile.id) === String(enquiry.user_id)
        );


        const userName =
            user?.full_name ||
            "Unknown User";


        const status =
            normalize(enquiry.status) || "pending";


        const formattedStatus =
            status.charAt(0).toUpperCase() +
            status.slice(1);


        const statusClass =
            `status-${status}`;


        return `
            <tr>

                <td>
                    <strong>
                        ${escapeHTML(userName)}
                    </strong>
                </td>


                <td>
                    ${escapeHTML(propertyName)}
                </td>


                <td>
                    ${escapeHTML(ownerName)}
                </td>


                <td>
                    <span class="status-badge ${statusClass}">
                        ${escapeHTML(formattedStatus)}
                    </span>
                </td>


                <td>
                    ${escapeHTML(
                        formatDate(enquiry.created_at)
                    )}
                </td>


                <td>

               <button
                        type="button"
                        class="review-btn"
                        onclick="openEnquiryModal('${enquiry.id}')"
                    >
                        View
                    </button>

                </td>


                <td>

                 <button
    type="button"
    class="action-btn delete-btn enquiry-delete-btn"
    data-enquiry-id="${escapeHTML(enquiry.id)}"
>
    🗑️ Delete
</button>

                </td>

            </tr>
        `;

    }).join("");
    attachEnquiryButtons();

}

// ============================================================
// ENQUIRY BUTTON EVENTS
// ============================================================

function attachEnquiryButtons() {

    document
        .querySelectorAll(
            "#enquiryTableBody .enquiry-view-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openEnquiryModal(
                            button.dataset.enquiryId
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "#enquiryTableBody .enquiry-delete-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteEnquiry(
                            button.dataset.enquiryId
                        );

                    }
                );

            }
        );

}

// ============================================================
// OPEN ENQUIRY MODAL
// ============================================================

function openEnquiryModal(enquiryId) {

    const enquiry = enquiries.find(
        item => String(item.id) === String(enquiryId)
    );

    if (!enquiry) {
        console.error("Enquiry not found:", enquiryId);
        return;
    }

    const modal = document.getElementById("enquiryModal");

    if (!modal) {
        console.error("Enquiry modal not found.");
        return;
    }


    // --------------------------------------------------------
    // FIND RELATED USER
    // --------------------------------------------------------

    const user = profiles.find(
        profile =>
            String(profile.id) === String(enquiry.user_id)
    );


    // --------------------------------------------------------
    // FIND RELATED OWNER
    // --------------------------------------------------------

    const owner = profiles.find(
        profile =>
            String(profile.id) === String(enquiry.owner_id)
    );


    // --------------------------------------------------------
    // FIND RELATED PROPERTY
    // --------------------------------------------------------

    const property = buildings.find(
        building =>
            String(building.id) === String(enquiry.property_id)
    );


    // --------------------------------------------------------
    // GET DISPLAY VALUES
    // --------------------------------------------------------

    const userName =
        user?.full_name ||
        "Unknown User";

    const ownerName =
        owner?.full_name ||
        "Unknown Owner";

    const propertyName =
        property?.name ||
        property?.property_name ||
        "Unknown Property";

    const roomType =
        enquiry.room_type ||
        "Not specified";

    const phone =
        enquiry.renter_phone ||
        "Not provided";

    const status =
        normalize(enquiry.status) ||
        "pending";

    const formattedStatus =
        status.charAt(0).toUpperCase() +
        status.slice(1);


    // --------------------------------------------------------
    // FILL MODAL
    // --------------------------------------------------------

    setText(
        "modalEnquiryUser",
        userName
    );

    setText(
        "modalEnquiryOwner",
        ownerName
    );

    setText(
        "modalEnquiryProperty",
        propertyName
    );

    const propertyLink =
    document.getElementById(
        "modalEnquiryPropertyDetail"
    );

if (propertyLink) {

    propertyLink.textContent =
        propertyName;

    if (property) {

        propertyLink.href =
            `property.html?id=${encodeURIComponent(
                property.id
            )}`;

    } else {

        propertyLink.removeAttribute(
            "href"
        );

    }

}

    setText(
        "modalEnquiryRoomType",
        roomType
    );

    setText(
        "modalEnquiryPhone",
        phone
    );

    setText(
        "modalEnquiryStatus",
        formattedStatus
    );

    setText(
        "modalEnquiryDate",
        formatDate(enquiry.created_at)
    );

    setText(
        "modalEnquiryUpdated",
        formatDate(enquiry.updated_at)
    );

    setText(
        "modalEnquiryMessage",
        enquiry.message ||
        "No message provided."
    );


    // --------------------------------------------------------
    // STATUS CLASS
    // --------------------------------------------------------

    const statusElement =
        document.getElementById(
            "modalEnquiryStatus"
        );

    if (statusElement) {

        statusElement.className =
            `status-badge status-${status}`;

    }


    // --------------------------------------------------------
// SHOW MODAL
// --------------------------------------------------------

modal.classList.add("show");

modal.setAttribute(
    "aria-hidden",
    "false"
);

document.body.style.overflow =
    "hidden";
}

// ============================================================
// DELETE ENQUIRY PERMANENTLY
// ============================================================

async function deleteEnquiry(enquiryId) {

    const enquiry = enquiries.find(
        item =>
            String(item.id) ===
            String(enquiryId)
    );

    if (!enquiry) {

        alert("Enquiry not found.");

        return;
    }


    // --------------------------------------------------------
    // RELATED INFORMATION
    // --------------------------------------------------------

    const property =
        buildings.find(
            building =>
                String(building.id) ===
                String(enquiry.property_id)
        );

    const user =
        profiles.find(
            profile =>
                String(profile.id) ===
                String(enquiry.user_id)
        );


    const propertyName =
        property?.name ||
        property?.property_name ||
        "Unknown Property";

    const userName =
        user?.full_name ||
        "Unknown User";


    // --------------------------------------------------------
    // CONFIRMATION
    // --------------------------------------------------------

    const confirmed =
        window.confirm(
            `Are you sure you want to permanently delete this enquiry?\n\n` +
            `User: ${userName}\n` +
            `Property: ${propertyName}\n\n` +
            `This enquiry will be deleted permanently from the database.\n\n` +
            `This action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        // ----------------------------------------------------
        // 1. DELETE FROM DATABASE
        // ----------------------------------------------------

        const {
            data: deletedRows,
            error: deleteError
        } =
            await supabaseClient
                .from("enquiries")
                .delete()
                .eq("id", enquiryId)
                .select("id");


        if (deleteError) {

            console.error(
                "Enquiry delete error:",
                deleteError
            );

            alert(
                `Enquiry could not be deleted.\n\n${deleteError.message}`
            );

            return;
        }


        // ----------------------------------------------------
        // 2. VERIFY DELETE ACTUALLY HAPPENED
        // ----------------------------------------------------

        if (
            !Array.isArray(deletedRows) ||
            deletedRows.length === 0
        ) {

            console.error(
                "Delete returned no rows:",
                deletedRows
            );

            alert(
                "The enquiry was not deleted from the database.\n\n" +
                "This is usually caused by Supabase Row Level Security (RLS) permissions."
            );

            return;
        }


        // ----------------------------------------------------
        // 3. CHECK DATABASE ONE MORE TIME
        // ----------------------------------------------------

        const {
            data: verifyData,
            error: verifyError
        } =
            await supabaseClient
                .from("enquiries")
                .select("id")
                .eq("id", enquiryId)
                .maybeSingle();


        if (verifyError) {

            console.error(
                "Enquiry deletion verification error:",
                verifyError
            );

            alert(
                `Delete verification failed.\n\n${verifyError.message}`
            );

            return;
        }


        if (verifyData) {

            alert(
                "The enquiry still exists in the database."
            );

            return;
        }


        // ----------------------------------------------------
        // 4. UPDATE LOCAL STATE
        // ----------------------------------------------------

        enquiries =
            enquiries.filter(
                item =>
                    String(item.id) !==
                    String(enquiryId)
            );


        // ----------------------------------------------------
        // 5. REFRESH ENQUIRY UI
        // ----------------------------------------------------

        renderEnquiriesSection();


        // ----------------------------------------------------
        // 6. SUCCESS
        // ----------------------------------------------------

        alert(
            "Enquiry permanently deleted successfully."
        );

    }

    catch (error) {

        console.error(
            "Permanent enquiry delete failed:",
            error
        );

        alert(
            `Something went wrong while deleting the enquiry.\n\n${error.message}`
        );

    }

}


// ============================================================
// FILTER ENQUIRIES
// ============================================================

function getFilteredEnquiries() {

    const searchInput = document.getElementById("enquirySearch");
    const statusFilter = document.getElementById("enquiryStatusFilter");
    const sortSelect = document.getElementById("enquirySort");

    const searchTerm = normalize(
        searchInput?.value || ""
    );

    const selectedStatus =
        normalize(statusFilter?.value || "all");

    const selectedSort =
        sortSelect?.value || "newest";


    let filtered = [...enquiries];


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (searchTerm) {

        filtered = filtered.filter(enquiry => {

            const property = buildings.find(
                building =>
                    String(building.id) === String(enquiry.property_id)
            );


            const owner = profiles.find(
                profile =>
                    String(profile.id) === String(enquiry.owner_id)
            );


            const user = profiles.find(
                profile =>
                    String(profile.id) === String(enquiry.user_id)
            );


            const propertyName =
                property?.name ||
                property?.property_name ||
                "";


            const ownerName =
                owner?.full_name ||
                "";


            const userName =
                user?.full_name ||
                "";


            const searchableText = normalize(`
                ${userName}
                ${ownerName}
                ${propertyName}
                ${enquiry.message || ""}
                ${enquiry.room_type || ""}
                ${enquiry.renter_phone || ""}
                ${enquiry.status || ""}
            `);


            return searchableText.includes(searchTerm);

        });

    }


    // --------------------------------------------------------
    // STATUS FILTER
    // --------------------------------------------------------

    if (selectedStatus !== "all") {

        filtered = filtered.filter(enquiry =>
            normalize(enquiry.status) === selectedStatus
        );

    }


    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    filtered.sort((a, b) => {

        const dateA =
            new Date(a.created_at || 0).getTime();

        const dateB =
            new Date(b.created_at || 0).getTime();


        if (selectedSort === "oldest") {
            return dateA - dateB;
        }


        return dateB - dateA;

    });


    return filtered;


}

// ============================================================
// BIND ENQUIRY FILTERS
// ============================================================

function bindEnquiryFilters() {

    const searchInput =
        document.getElementById("enquirySearch");

    const searchButton =
        document.getElementById("enquirySearchBtn");

    const statusFilter =
        document.getElementById("enquiryStatusFilter");

    const sortSelect =
        document.getElementById("enquirySort");


    // Search button
    if (searchButton) {

        searchButton.addEventListener("click", () => {

            renderEnquiriesSection();

        });

    }


    // Search while typing
    if (searchInput) {

        searchInput.addEventListener("input", () => {

            renderEnquiriesSection();

        });

    }


    // Status filter
    if (statusFilter) {

        statusFilter.addEventListener("change", () => {

            renderEnquiriesSection();

        });

    }


    // Sort
    if (sortSelect) {

        sortSelect.addEventListener("change", () => {

            renderEnquiriesSection();

        });

    }

}


// ============================================================
// ADMIN SETTINGS
// ============================================================

async function loadAdminSettings() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();

    if (error) {

        console.error(
            "Unable to get admin user:",
            error
        );

        setText(
            "settingsAdminEmail",
            "Unable to load email"
        );

        setText(
            "adminProfileEmail",
            "Admin"
        );

        return;

    }

    const user =
        data?.user;

    setText(
        "adminProfileEmail",
        user?.email ||
        "Admin"
    );

    if (!user) {

        setText(
            "settingsAdminEmail",
            "Not logged in"
        );

        return;

    }

    setText(
        "settingsAdminEmail",
        user.email ||
        "No email available"
    );

}


// ============================================================
// EDIT ADMIN INFORMATION
// ============================================================

function openEditAdminInformation() {

    const editEmail =
        document.getElementById(
            "editAdminEmail"
        );

    const message =
        document.getElementById(
            "editAdminMessage"
        );

    supabaseClient.auth
        .getUser()
        .then(
            ({
                data,
                error
            }) => {

                if (error) {

                    if (message) {

                        message.style.color =
                            "#dc2626";

                        message.textContent =
                            error.message;

                    }

                    return;

                }

                if (editEmail) {

                    editEmail.value =
                        data?.user?.email ||
                        "";

                }

                if (message) {

                    message.textContent =
                        "";

                }

                openModalById(
                    "editAdminModal"
                );

            }
        );

}


// ============================================================
// SAVE ADMIN INFORMATION
// ============================================================

async function handleEditAdminInformation(
    event
) {

    event.preventDefault();

    const emailInput =
        document.getElementById(
            "editAdminEmail"
        );

    const message =
        document.getElementById(
            "editAdminMessage"
        );

    const newEmail =
        emailInput?.value
            ?.trim();

    if (!newEmail) {

        if (message) {

            message.style.color =
                "#dc2626";

            message.textContent =
                "Please enter an email address.";

        }

        return;

    }

    if (message) {

        message.style.color =
            "#6b7280";

        message.textContent =
            "Saving changes...";

    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .updateUser({
                    email: newEmail
                });

        if (error) {

            console.error(
                "Email update error:",
                error
            );

            if (message) {

                message.style.color =
                    "#dc2626";

                message.textContent =
                    error.message;

            }

            return;

        }

        if (message) {

            message.style.color =
                "#16a34a";

            message.textContent =
                data?.user?.email === newEmail
                    ? "Email updated successfully."
                    : "Email update requested. Check your email to confirm the new address.";

        }

        setTimeout(
            async () => {

                closeModalById(
                    "editAdminModal"
                );

                await loadAdminSettings();

            },
            1400
        );

    }

    catch (error) {

        console.error(
            "Admin information update failed:",
            error
        );

        if (message) {

            message.style.color =
                "#dc2626";

            message.textContent =
                "Something went wrong while updating your information.";

        }

    }

}


// ============================================================
// ADMIN LOGIN
// ============================================================

function openAdminLogin() {

    const loginForm =
        document.getElementById(
            "adminLoginForm"
        );

    const signupForm =
        document.getElementById(
            "adminSignupForm"
        );

    const title =
        document.getElementById(
            "adminAuthTitle"
        );

    const subtitle =
        document.getElementById(
            "adminAuthSubtitle"
        );

    const loginMessage =
        document.getElementById(
            "adminLoginMessage"
        );

    const signupMessage =
        document.getElementById(
            "adminSignupMessage"
        );

    if (loginForm) {

        loginForm.style.display =
            "block";

    }

    if (signupForm) {

        signupForm.style.display =
            "none";

    }

    if (title) {

        title.textContent =
            "Admin Login";

    }

    if (subtitle) {

        subtitle.textContent =
            "Sign in with your administrator account.";

    }

    if (loginMessage) {

        loginMessage.textContent =
            "";

        loginMessage.style.color =
            "#dc2626";

    }

    if (signupMessage) {

        signupMessage.textContent =
            "";

    }

    openModalById(
        "adminAuthModal"
    );

}


// ============================================================
// ADMIN SIGNUP
// ============================================================

function openAdminSignup() {

    const loginForm =
        document.getElementById(
            "adminLoginForm"
        );

    const signupForm =
        document.getElementById(
            "adminSignupForm"
        );

    const title =
        document.getElementById(
            "adminAuthTitle"
        );

    const subtitle =
        document.getElementById(
            "adminAuthSubtitle"
        );

    const signupMessage =
        document.getElementById(
            "adminSignupMessage"
        );

    if (loginForm) {

        loginForm.style.display =
            "none";

    }

    if (signupForm) {

        signupForm.style.display =
            "block";

    }

    if (title) {

        title.textContent =
            "Create Account";

    }

    if (subtitle) {

        subtitle.textContent =
            "Create an account. Admin access must be granted separately.";

    }

    if (signupMessage) {

        signupMessage.textContent =
            "";

        signupMessage.style.color =
            "#dc2626";

    }

    openModalById(
        "adminAuthModal"
    );

}


// ============================================================
// AUTH EVENT BINDINGS
// ============================================================

function bindAuthEvents() {

    document
        .getElementById(
            "adminLoginBtn"
        )
        ?.addEventListener(
            "click",
            openAdminLogin
        );

    document
        .getElementById(
            "adminSignupBtn"
        )
        ?.addEventListener(
            "click",
            openAdminSignup
        );

    document
        .getElementById(
            "closeAdminAuthModal"
        )
        ?.addEventListener(
            "click",
            () => {

                closeModalById(
                    "adminAuthModal"
                );

            }
        );

    document
        .getElementById(
            "switchToSignup"
        )
        ?.addEventListener(
            "click",
            openAdminSignup
        );

    document
        .getElementById(
            "switchToLogin"
        )
        ?.addEventListener(
            "click",
            openAdminLogin
        );

    document
        .getElementById(
            "adminLoginForm"
        )
        ?.addEventListener(
            "submit",
            handleAdminLogin
        );

    document
        .getElementById(
            "adminSignupForm"
        )
        ?.addEventListener(
            "submit",
            handleAdminSignup
        );

    document
        .getElementById(
            "adminLogoutBtn"
        )
        ?.addEventListener(
            "click",
            handleAdminLogout
        );

    document
        .getElementById(
            "editAdminInformationBtn"
        )
        ?.addEventListener(
            "click",
            openEditAdminInformation
        );

    document
        .getElementById(
            "closeEditAdminModal"
        )
        ?.addEventListener(
            "click",
            () => {

                closeModalById(
                    "editAdminModal"
                );

            }
        );

    document
        .getElementById(
            "cancelEditAdminBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                closeModalById(
                    "editAdminModal"
                );

            }
        );

    document
        .getElementById(
            "editAdminForm"
        )
        ?.addEventListener(
            "submit",
            handleEditAdminInformation
        );

}


// ============================================================
// ADMIN LOGIN HANDLER
// ============================================================

async function handleAdminLogin(
    event
) {

    event.preventDefault();

    const emailInput =
        document.getElementById(
            "adminLoginEmail"
        );

    const passwordInput =
        document.getElementById(
            "adminLoginPassword"
        );

    const message =
        document.getElementById(
            "adminLoginMessage"
        );

    const email =
        emailInput?.value
            ?.trim();

    const password =
        passwordInput?.value;

    if (!email || !password) {

        if (message) {

            message.style.color =
                "#dc2626";

            message.textContent =
                "Please enter email and password.";

        }

        return;

    }

    if (message) {

        message.style.color =
            "#6b7280";

        message.textContent =
            "Signing in...";

    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({
                    email,
                    password
                });

        if (error) {

            if (message) {

                message.style.color =
                    "#dc2626";

                message.textContent =
                    error.message;

            }

            return;

        }

        const user =
            data?.user;

        if (!user) {

            if (message) {

                message.style.color =
                    "#dc2626";

                message.textContent =
                    "Login failed.";

            }

            return;

        }

        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id, full_name, role"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();

        if (profileError) {

            console.error(
                "Admin profile check error:",
                profileError
            );

            await supabaseClient.auth
                .signOut();

            if (message) {

                message.style.color =
                    "#dc2626";

                message.textContent =
                    "Unable to verify admin profile.";

            }

            return;

        }

        if (
            getProfileRole(
                profile?.role
            ) !== "admin"
        ) {

            await supabaseClient.auth
                .signOut();

            if (message) {

                message.style.color =
                    "#dc2626";

                message.textContent =
                    "This account does not have Admin access.";

            }

            return;

        }

        closeModalById(
            "adminAuthModal"
        );

        await updateAuthButtons();

        await loadAllData();

        await loadAdminSettings();

        alert(
            "Admin login successful."
        );

    }

    catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        if (message) {

            message.style.color =
                "#dc2626";

            message.textContent =
                "Something went wrong during login.";

        }

    }

}


// ============================================================
// ADMIN SIGNUP HANDLER
// ============================================================

async function handleAdminSignup(
    event
) {

    event.preventDefault();

    const nameInput =
        document.getElementById(
            "adminSignupName"
        );

    const emailInput =
        document.getElementById(
            "adminSignupEmail"
        );

    const passwordInput =
        document.getElementById(
            "adminSignupPassword"
        );

    const message =
        document.getElementById(
            "adminSignupMessage"
        );

    const name =
        nameInput?.value
            ?.trim();

    const email =
        emailInput?.value
            ?.trim();

    const password =
        passwordInput?.value;

    if (
        !name ||
        name.length < 2
    ) {

        if (message) {

            message.style.color =
                "#dc2626";

            message.textContent =
                "Please enter your full name.";

        }

        return;

    }

    if (!email) {

        if (message) {

            message.style.color =
                "#dc2626";

            message.textContent =
                "Please enter your email.";

        }

        return;

    }

    if (
        !password ||
        password.length < 6
    ) {

        if (message) {

            message.style.color =
                "#dc2626";

            message.textContent =
                "Password must be at least 6 characters.";

        }

        return;

    }

    if (message) {

        message.style.color =
            "#6b7280";

        message.textContent =
            "Creating account...";

    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name:
                                name
                        }
                    }
                });

        if (error) {

            if (message) {

                message.style.color =
                    "#dc2626";

                message.textContent =
                    error.message;

            }

            return;

        }

        if (!data?.user) {

            if (message) {

                message.style.color =
                    "#dc2626";

                message.textContent =
                    "Unable to create account.";

            }

            return;

        }

        const {
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .upsert({
                    id:
                        data.user.id,

                    full_name:
                        name,

                    role:
                        "user"
                });

        if (profileError) {

            console.error(
                "Profile creation error:",
                profileError
            );

            if (message) {

                message.style.color =
                    "#dc2626";

                message.textContent =
                    `Account created, but profile creation failed: ${profileError.message}`;

            }

            return;

        }

        if (message) {

            message.style.color =
                "#16a34a";

            message.textContent =
                "Account created successfully. Admin role must be assigned separately.";

        }

        setTimeout(
            () => {

                openAdminLogin();

            },
            1500
        );

    }

    catch (error) {

        console.error(
            "Admin signup error:",
            error
        );

        if (message) {

            message.style.color =
                "#dc2626";

            message.textContent =
                "Something went wrong while creating the account.";

        }

    }

}


// ============================================================
// AUTH BUTTON STATE
// ============================================================

async function updateAuthButtons() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .getUser();

        if (error) {

            console.warn(
                "Auth state error:",
                error
            );

        }

        const user =
            data?.user;

        const loginBtn =
            document.getElementById(
                "adminLoginBtn"
            );

        const signupBtn =
            document.getElementById(
                "adminSignupBtn"
            );

        const logoutBtn =
            document.getElementById(
                "adminLogoutBtn"
            );

        if (!user) {

            if (loginBtn) {

                loginBtn.style.display =
                    "flex";

            }

            if (signupBtn) {

                signupBtn.style.display =
                    "flex";

            }

            if (logoutBtn) {

                logoutBtn.style.display =
                    "none";

            }

            return;

        }

        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id, role"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();

        if (
            profileError ||
            getProfileRole(
                profile?.role
            ) !== "admin"
        ) {

            if (loginBtn) {

                loginBtn.style.display =
                    "flex";

            }

            if (signupBtn) {

                signupBtn.style.display =
                    "flex";

            }

            if (logoutBtn) {

                logoutBtn.style.display =
                    "none";

            }

            return;

        }

        if (loginBtn) {

            loginBtn.style.display =
                "none";

        }

        if (signupBtn) {

            signupBtn.style.display =
                "none";

        }

        if (logoutBtn) {

            logoutBtn.style.display =
                "flex";

        }

    }

    catch (error) {

        console.error(
            "Auth button update error:",
            error
        );

    }

}


// ============================================================
// LOGOUT
// ============================================================

async function handleAdminLogout() {

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient.auth
                .signOut();

        if (error) {

            console.error(
                "Logout error:",
                error
            );

            alert(
                error.message
            );

            return;

        }

        selectedProperty =
            null;

        selectedProfile =
            null;

        selectedReview =
            null;

        buildings = [];
        profiles = [];
        reviews = [];

        await updateAuthButtons();

        closeModalById(
            "adminAuthModal"
        );

        setText(
            "adminProfileEmail",
            "Admin"
        );

        alert(
            "Logged out successfully."
        );

        openAdminLogin();

    }

    catch (error) {

        console.error(
            "Logout failed:",
            error
        );

        alert(
            "Something went wrong while logging out."
        );

    }

}


// ============================================================
// NAVIGATION EVENTS
// ============================================================

function bindNavigation() {

    document
        .querySelectorAll(
            ".admin-nav .nav-item[data-section]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const isAdmin =
                            await verifyAdminAccess();

                        if (!isAdmin) {

                            openAdminLogin();

                            return;

                        }

                        showSection(
                            button.dataset.section
                        );

                    }
                );

            }
        );

    document
        .querySelectorAll(
            "[data-section-target]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    async () => {

                        const isAdmin =
                            await verifyAdminAccess();

                        if (!isAdmin) {

                            openAdminLogin();

                            return;

                        }

                        showSection(
                            element.dataset
                                .sectionTarget
                        );

                    }
                );

            }
        );

}


// ============================================================
// KEYBOARD ACCESS FOR CLICKABLE CARDS
// ============================================================

function bindClickableCards() {

    document
        .querySelectorAll(
            ".clickable-card[data-section-target]"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key ===
                            "Enter" ||
                            event.key ===
                            " "
                        ) {

                            event.preventDefault();

                            verifyAdminAccess()
                                .then(
                                    isAdmin => {

                                        if (!isAdmin) {

                                            openAdminLogin();

                                            return;

                                        }

                                        showSection(
                                            card.dataset
                                                .sectionTarget
                                        );

                                    }
                                );

                        }

                    }
                );

            }
        );

}


// ============================================================
// ESCAPE KEY
// ============================================================

function bindEscapeKey() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }

            document
                .querySelectorAll(
                    ".admin-modal.show"
                )
                .forEach(
                    modal => {

                        closeModalById(
                            modal.id
                        );

                    }
                );

        }
    );

}


// ============================================================
// VERIFY ADMIN ACCESS
// ============================================================

async function verifyAdminAccess() {

    try {

        const {
            data: userData,
            error: userError
        } =
            await supabaseClient.auth.getUser();

        if (
            userError ||
            !userData?.user
        ) {

            return false;

        }

        const user =
            userData.user;

        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id, full_name, role"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();

        if (profileError) {

            console.error(
                "Admin verification error:",
                profileError
            );

            return false;

        }

        const role =
            getProfileRole(
                profile?.role
            );

        return role === "admin";

    }

    catch (error) {

        console.error(
            "Admin verification failed:",
            error
        );

        return false;

    }

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        bindNavigation();

        bindClickableCards();

        bindModalEvents();
        bindEnquiryFilters();

        bindFilterEvents();

        bindAuthEvents();

        bindEscapeKey();

        const isAdmin =
            await verifyAdminAccess();

        if (!isAdmin) {

            await updateAuthButtons();

            openAdminLogin();

            return;

        }

        showSection(
            "dashboard"
        );

        await updateAuthButtons();

        await loadAdminSettings();

        await loadAllData();

    }
);


// ============================================================
// REFRESH WHEN TAB BECOMES VISIBLE
// ============================================================

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            document.visibilityState !==
            "visible"
        ) {

            return;

        }

        const isAdmin =
            await verifyAdminAccess();

        if (!isAdmin) {

            await updateAuthButtons();

            return;

        }

        await loadAllData();

        await updateAuthButtons();

        await loadAdminSettings();

    }
);


// ============================================================
// DEBUG
// ============================================================

console.log(
    "RoomDhundo Admin Panel loaded successfully."
);