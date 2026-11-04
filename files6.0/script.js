// =====================================================
// SUPABASE CONFIG
// The anon key is meant to be public in frontend code —
// Row Level Security policies on the tables control what
// it's actually allowed to read/write.
// =====================================================
const SUPABASE_URL = "https://vyusxdilgwrcgmqqvzsp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dXN4ZGlsZ3dyY2dtcXF2enNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjYyNTYsImV4cCI6MjEwMjc0MjI1Nn0.X6FbzDad06d5-kj1aK4zQkPSPrrLUW_O7CdfZ-ghwrM";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;
// =====================================================
// ROOMDHUNDO ADMIN ACCOUNT
// =====================================================

const ADMIN_EMAIL = "roomdhundo18@gmail.com";

function isAdminEmail(user) {
    return !!(
        user?.email &&
        user.email.trim().toLowerCase() ===
        ADMIN_EMAIL.trim().toLowerCase()
    );
}

const COUPLE_FRIENDLY_TAG = "couple-friendly";
const COUPLE_FRIENDLY_LABEL = "💑 Couple Friendly";
const FURNISHING_TAGS = ["furnished", "semi-furnished", "unfurnished"];
const FLAT_SALE_TAG = "flat-for-sale";
const FLAT_RENT_TAG = "flat-on-rent";

function isCoupleFriendlyFacility(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .includes("couple");
}

const FACILITY_TAG_LABELS = {
    wifi: "Wi-Fi",
    food: "Food",
    ac: "AC",
    laundry: "Laundry",
    parking: "🚗 Parking",
    bathroom: "🚿 Attached Bathroom",
    kitchen: "🍳 Attached Kitchen",
    "couple-friendly": COUPLE_FRIENDLY_LABEL,
    furnished: "🛋️ Furnished",
    "semi-furnished": "🪑 Semi Furnished",
    unfurnished: "🏠 Unfurnished"
};

function getBuildingFacilityLabels(building) {
    const labels = [];
    const seen = new Set();

    function add(raw) {
        const text = String(raw || "").trim();
        if (!text) return;
        const key = text
            .toLowerCase()
            .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
            .replace(/[^\p{L}\p{N}]+/gu, "-")
            .replace(/^-|-$/g, "");
        if (seen.has(key)) return;
        seen.add(key);
        labels.push(text);
    }

    (Array.isArray(building?.facilities) ? building.facilities : []).forEach(add);
    (Array.isArray(building?.facility_tags) ? building.facility_tags : []).forEach((tag) => {
        const normalized = String(tag || "").trim().toLowerCase();
        add(FACILITY_TAG_LABELS[normalized] || tag);
    });
    if (building?.isCoupleFriendly) add(COUPLE_FRIENDLY_LABEL);
    return labels;
}

function facilityKey(text) {
    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-|-$/g, "");
}

function getPresetFacilityKeys() {
    const keys = new Set();
    document.querySelectorAll(".lpFacility").forEach((el) => {
        keys.add(String(el.value || "").toLowerCase());
        keys.add(facilityKey(el.dataset.label || el.value));
    });
    Object.keys(FACILITY_TAG_LABELS).forEach((tag) => keys.add(tag));
    Object.values(FACILITY_TAG_LABELS).forEach((label) => keys.add(facilityKey(label)));
    return keys;
}

function collectCustomFacilities() {
    return Array.from(document.querySelectorAll(".lp-custom-facility-chip")).map((chip) => ({
        tag: chip.dataset.tag,
        label: chip.dataset.label
    })).filter((item) => item.tag && item.label);
}

function addCustomFacilityChip(rawLabel, rawTag) {
    const list = document.getElementById("lpCustomFacilityList");
    if (!list) return false;

    const label = String(rawLabel || "").trim().replace(/\s+/g, " ");
    const tag = rawTag || facilityKey(label);
    if (!label || !tag) return false;
    if (Array.from(list.querySelectorAll(".lp-custom-facility-chip")).some((chip) => chip.dataset.tag === tag)) {
        return false;
    }

    const chip = document.createElement("span");
    chip.className = "lp-custom-facility-chip";
    chip.dataset.tag = tag;
    chip.dataset.label = label;

    const text = document.createElement("span");
    text.textContent = label;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "lp-custom-facility-remove";
    remove.setAttribute("aria-label", `Remove ${label}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => chip.remove());

    chip.append(text, remove);
    list.appendChild(chip);
    return true;
}

function addOwnerCustomFacility() {
    const input = document.getElementById("lpCustomFacilityInput");
    if (!input) return;

    const label = input.value.trim().replace(/\s+/g, " ");
    if (label.length < 2) {
        alert("Type a facility name of at least 2 characters.");
        return;
    }
    if (label.length > 40) {
        alert("Keep the facility name under 40 characters.");
        return;
    }

    const tag = facilityKey(label);
    if (!tag) {
        alert("Please enter a valid facility name.");
        return;
    }

    const presets = getPresetFacilityKeys();
    if (presets.has(tag) || presets.has(label.toLowerCase())) {
        alert("That facility is already in the list above. Tick the checkbox instead.");
        return;
    }

    if (!addCustomFacilityChip(label, tag)) {
        alert("You already added that facility.");
        return;
    }

    input.value = "";
    input.focus();
}

function restoreCustomFacilities(savedTags, savedLabels) {
    const list = document.getElementById("lpCustomFacilityList");
    if (list) list.innerHTML = "";

    const presets = getPresetFacilityKeys();
    const labels = Array.isArray(savedLabels) ? savedLabels : [];
    const tags = Array.isArray(savedTags) ? savedTags : [];
    const added = new Set();

    labels.forEach((label) => {
        const tag = facilityKey(label);
        if (!tag || presets.has(tag) || added.has(tag)) return;
        addCustomFacilityChip(String(label).trim(), tag);
        added.add(tag);
    });

    tags.forEach((rawTag) => {
        const tag = facilityKey(rawTag) || String(rawTag || "").toLowerCase();
        if (!tag || presets.has(tag) || presets.has(String(rawTag).toLowerCase()) || added.has(tag)) return;
        const matchingLabel = labels.find((label) => facilityKey(label) === tag);
        addCustomFacilityChip(matchingLabel || String(rawTag).replace(/-/g, " "), tag);
        added.add(tag);
    });
}

function wireCustomFacilities() {
    const addBtn = document.getElementById("lpAddCustomFacilityBtn");
    const input = document.getElementById("lpCustomFacilityInput");
    if (!addBtn || !input) return;

    addBtn.addEventListener("click", addOwnerCustomFacility);
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addOwnerCustomFacility();
        }
    });
}

function facilityPreviewBadgesHTML(building, limit = 3) {
    const all = getBuildingFacilityLabels(building);
    const couple = all.find(isCoupleFriendlyFacility);
    const others = all.filter((item) => item !== couple);
    const shown = couple
        ? [couple, ...others.slice(0, Math.max(0, limit - 1))]
        : others.slice(0, limit);
    return shown.map((item) => `<span>${item}</span>`).join("");
}

const LIST_SCROLL_KEY = "roomdhundo-list-scroll";

function listScrollPageKey() {
    return `${location.pathname}${location.search}`;
}

function readListScrollState() {
    try {
        return JSON.parse(sessionStorage.getItem(LIST_SCROLL_KEY) || "null");
    } catch (error) {
        return null;
    }
}

function saveListScrollState({ propertyId = null, visibleCount = null } = {}) {
    sessionStorage.setItem(LIST_SCROLL_KEY, JSON.stringify({
        page: listScrollPageKey(),
        path: location.pathname,
        scrollY: window.scrollY,
        propertyId,
        visibleCount,
        t: Date.now()
    }));
}

function bindListPropertyOpeners(root, getVisibleCount) {
    if (!root) return;

    root.querySelectorAll(".property-card[data-id], .saved-property-card[data-id], .hotel-package-card[data-id]").forEach((card) => {
        if (card.dataset.listOpenBound) return;
        card.dataset.listOpenBound = "true";

        const openProperty = (event) => {
            if (event.target.closest(".favorite, .remove-saved-btn, .compare-btn")) {
                event.stopPropagation();
                return;
            }

            const id = card.dataset.id;
            if (!id) return;

            saveListScrollState({
                propertyId: id,
                visibleCount: typeof getVisibleCount === "function" ? getVisibleCount() : null
            });

            if (event.target.closest("a[href*='property.html']")) return;

            event.preventDefault();
            window.location.href = `property.html?id=${encodeURIComponent(id)}`;
        };

        card.addEventListener("click", openProperty);
    });
}

function restoreListScrollState(getVisibleCountSetter) {
    const state = readListScrollState();
    if (!state) return null;

    const samePage = state.page === listScrollPageKey() || state.path === location.pathname;
    if (!samePage) return null;

    if (typeof getVisibleCountSetter === "function" && state.visibleCount) {
        getVisibleCountSetter(state.visibleCount);
    }

    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    const apply = () => {
        const card = state.propertyId
            ? document.querySelector(`.property-card[data-id="${state.propertyId}"], .saved-property-card[data-id="${state.propertyId}"], .hotel-package-card[data-id="${state.propertyId}"]`)
            : null;
        if (card) {
            card.scrollIntoView({ block: "center" });
        } else {
            window.scrollTo(0, Number(state.scrollY) || 0);
        }
    };

    requestAnimationFrame(() => requestAnimationFrame(apply));
    window.setTimeout(apply, 80);
    return state;
}

function buildingHasCoupleFriendly(building) {
    const tags = building?.facility_tags || [];
    const labels = building?.facilities || [];
    return tags.some(isCoupleFriendlyFacility) || labels.some(isCoupleFriendlyFacility);
}

function getActiveHubSafe() {
    return window.roomdhundoLocation?.getActiveHub?.() || { name: "MAKAUT" };
}

function getBuildingHubDistance(building) {
    const api = window.roomdhundoLocation;
    if (api?.getBuildingDistanceToHub) {
        return api.getBuildingDistanceToHub(building, getActiveHubSafe());
    }
    return Number(building?.distance_km);
}

function availabilityRank(building) {
    return Number(building?.totalAvailable || 0) > 0 ? 0 : 1;
}

function compareAvailability(a, b) {
    const byFlag = availabilityRank(a) - availabilityRank(b);
    if (byFlag) return byFlag;
    return Number(b?.totalAvailable || 0) - Number(a?.totalAvailable || 0);
}

function sortBuildingsForActiveHub(list) {
    return [...(list || [])].sort(compareAvailability);
}

function isHotelListing(building) {
    return String(building?.type || "").toLowerCase() === "hotel";
}

function isFlatListing(building) {
    return String(building?.type || "").toLowerCase() === "flat";
}

function isFlatForSale(building) {
    if (!isFlatListing(building)) return false;
    const tags = (building?.facility_tags || []).map((tag) => String(tag || "").toLowerCase());
    const labels = (building?.facilities || []).map((label) => String(label || "").toLowerCase());
    if (tags.includes(FLAT_RENT_TAG) || labels.includes("on rent")) return false;
    return tags.includes(FLAT_SALE_TAG) || labels.includes("for sale");
}

function hotelStarCount(building) {
    const tags = (building?.facility_tags || []).map((tag) => String(tag || "").toLowerCase());
    const blob = `${tags.join(" ")} ${getBuildingFacilityLabels(building).join(" ")}`.toLowerCase();
    for (let i = 5; i >= 1; i--) {
        if (tags.includes(`star-${i}`) || blob.includes(`${i} star`) || blob.includes(`⭐ ${i}`)) {
            return i;
        }
    }
    return 0;
}

function hotelStarsHtml(count) {
    const stars = Math.max(0, Math.min(5, Number(count) || 0));
    if (!stars) return "";
    return `<span class="hotel-star-row" aria-label="${stars} star hotel">${"★".repeat(stars)}</span>`;
}

function hotelHasBreakfast(building) {
    const tags = (building?.facility_tags || []).map((tag) => String(tag || "").toLowerCase());
    const labels = getBuildingFacilityLabels(building).map((label) => label.toLowerCase());
    return tags.includes("food") || labels.some((label) => /\bfood\b|breakfast|meal/.test(label));
}

function visibleListingRules(rules) {
    return (Array.isArray(rules) ? rules : []).filter((rule) => !String(rule).startsWith("RD_META:"));
}

function isPubliclyListedBuilding(building) {
    const status = String(building?.listing_status || "published").trim().toLowerCase();
    return !building?.listing_status || status === "published";
}

function hotelCheckTimes(building) {
    const rules = visibleListingRules(building?.rules);
    const checkIn = rules.find((rule) => /^check-in/i.test(String(rule))) || "Check-in from 12:00";
    const checkOut = rules.find((rule) => /^check-out/i.test(String(rule))) || "Check-out until 11:00";
    const timeFrom = (rule, fallback) => {
        const match = String(rule).match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
        return match ? match[1] : fallback;
    };
    return {
        checkIn,
        checkOut,
        checkInTime: timeFrom(checkIn, "12:00"),
        checkOutTime: timeFrom(checkOut, "11:00")
    };
}

function hotelStayWindow() {
    const checkIn = new Date();
    checkIn.setHours(14, 0, 0, 0);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 1);
    const fmt = (date) => date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });
    return {
        nights: 1,
        checkInLabel: fmt(checkIn),
        checkOutLabel: fmt(checkOut)
    };
}

function hotelPopularFacilities(building, limit = 6) {
    const labels = getBuildingFacilityLabels(building).filter((label) => {
        const key = facilityKey(label);
        return !key.includes("star");
    });
    const preferred = ["wifi", "wi-fi", "food", "ac", "parking", "cctv"];
    const ranked = [];
    preferred.forEach((key) => {
        const match = labels.find((label) => {
            const text = label.toLowerCase();
            return facilityKey(label).includes(key.replace("-", "")) || text.includes(key);
        });
        if (match && !ranked.includes(match)) ranked.push(match);
    });
    labels.forEach((label) => {
        if (ranked.length >= limit) return;
        if (!ranked.includes(label)) ranked.push(label);
    });
    return ranked.slice(0, limit);
}

function hotelNightlyPrice(building) {
    if (building?.minDailyPrice != null) return Number(building.minDailyPrice);
    if (building?.minPrice != null) return Number(building.minPrice);
    return null;
}

function hotelLocationLine(building) {
    const loc = building?.location ? escapePropertyHtml(building.location) : "";
    return loc || "Location not listed";
}

function hotelPackageCardHTML(building, { isSaved = false, extraClass = "", compare = false } = {}) {
    const name = escapePropertyHtml(building.name);
    const price = hotelNightlyPrice(building);
    const priceText = price != null ? `₹${Number(price).toLocaleString("en-IN")}` : "—";
    const stars = hotelStarCount(building);
    const starBadge = stars ? `${stars} Star` : "Hotel";
    const rating = building.avgRating ? String(building.avgRating) : "New";
    const reviews = Number(building.reviewCount || 0);
    const roomSummary = (building.roomTypeNames || []).slice(0, 3).join(", ") || "Hotel room";
    const board = hotelHasBreakfast(building) ? "Breakfast available" : "Room only";
    const photo = building.images && building.images[0]
        ? `<img src="${escapePropertyHtml(building.images[0])}" alt="${name}" loading="lazy">`
        : `<div class="image-placeholder">Hotel photo</div>`;
    const availability = building.totalAvailable > 0
        ? `${building.totalAvailable} ${building.totalAvailable === 1 ? "room" : "rooms"} available`
        : "Currently occupied";

    return `
        <article class="hotel-package-card ${extraClass}" data-id="${building.id}">
            <a class="hotel-package-photo" href="property.html?id=${building.id}" aria-label="View ${name}">
                ${photo}
                <div class="hotel-package-badges">
                    <span>Hotel</span>
                    <span>${escapePropertyHtml(starBadge)}</span>
                </div>
            </a>
            <div class="hotel-package-body">
                <div class="hotel-package-title-row">
                    <div>
                        <h2>${name} ${hotelStarsHtml(stars)}</h2>
                        <p class="hotel-package-location">${hotelLocationLine(building)}</p>
                    </div>
                    <button type="button" class="favorite${isSaved ? " saved" : ""}" data-id="${building.id}">${isSaved ? "♥" : "♡"}</button>
                </div>
                <div class="hotel-package-rating">
                    <strong>${escapePropertyHtml(rating)}</strong>
                    <span class="hotel-rating-dots" aria-hidden="true"></span>
                    <span>${reviews.toLocaleString("en-IN")} reviews</span>
                </div>
                <ul class="hotel-package-facts">
                    <li>${escapePropertyHtml(roomSummary)}</li>
                    <li>${escapePropertyHtml(board)}</li>
                    <li>${escapePropertyHtml(availability)}</li>
                </ul>
                <div class="hotel-package-price">
                    <strong>${priceText}</strong>
                    <span>/ night</span>
                </div>
                <div class="hotel-package-actions">
                    ${compare ? `<button type="button" class="compare-btn">Compare</button>` : ""}
                    <a class="hotel-package-cta" href="property.html?id=${building.id}">View hotel</a>
                </div>
            </div>
        </article>
    `;
}

function formatDistanceFromActiveHub(building, { includeLocation = false } = {}) {
    const location = String(building?.location || "").trim();
    if (location) return includeLocation ? `📍 ${location}` : location;
    return includeLocation ? "📍 Location not listed" : "";
}

function normalizeSearchText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getSearchTokens(query) {
    return normalizeSearchText(query).split(" ").filter((token) => token.length >= 2);
}

function getHubOnlyFromQuery(query) {
    let q = normalizeSearchText(query);
    if (!q) return null;

    q = q.replace(/^(near|nearby|around|in|at)\s+/, "");
    q = q.replace(/\s+(area|campus|town|bazar|more)$/, "");

    const api = window.roomdhundoLocation;
    if (api?.resolveServedHub) {
        const hub = api.resolveServedHub(q);
        if (hub) return hub;
    }

    const hubs = api?.hubs || [];
    return hubs.find((hub) => {
        const names = [hub.name, ...(hub.aliases || [])].map(normalizeSearchText);
        return names.includes(q);
    }) || null;
}

function applySearchHubQuietly(hub) {
    if (!hub) return;
    const api = window.roomdhundoLocation;
    if (api?.setLocation) {
        api.setLocation(hub.name, { save: true, remember: true, announce: false });
        return;
    }
    api?.setActiveHub?.(hub.name, { announce: false });
}

function buildingSearchHaystack(building) {
    return normalizeSearchText([
        building?.name,
        building?.location,
        building?.type,
        building?.description,
        building?.owner_name,
        ...(building?.roomTypeNames || []),
        ...(building?.facilities || []),
        ...(building?.facility_tags || []),
        ...((building?.room_types || []).map((rt) => rt.room_type))
    ].join(" "));
}

function buildingMatchesSearchQuery(building, query) {
    const q = normalizeSearchText(query);
    if (!q) return true;
    if (getHubOnlyFromQuery(q)) return true;

    const name = normalizeSearchText(building?.name);
    const haystack = buildingSearchHaystack(building);
    const tokens = getSearchTokens(q);

    if (name.includes(q) || haystack.includes(q)) return true;
    if (tokens.length && tokens.every((token) => name.includes(token))) return true;
    if (tokens.length && tokens.every((token) => haystack.includes(token))) return true;

    // A distinctive name fragment like "annapurna" should still find the listing.
    if (tokens.some((token) => token.length >= 4 && name.includes(token))) return true;

    return false;
}

function scoreBuildingSearchMatch(building, query) {
    const q = normalizeSearchText(query);
    const name = normalizeSearchText(building?.name);
    if (!q) return 0;
    if (name === q) return 100;
    if (name.startsWith(q)) return 90;
    if (name.includes(q)) return 80;

    const tokens = getSearchTokens(q);
    if (!tokens.length) return 0;
    const nameHits = tokens.filter((token) => name.includes(token)).length;
    if (nameHits === tokens.length) return 70;
    if (nameHits > 0) return 40 + nameHits * 5;
    return 10;
}

function sortBuildingsForHub(list) {
    return sortBuildingsForActiveHub(list);
}

function sortBuildingsBySearch(list, query) {
    if (!normalizeSearchText(query)) return sortBuildingsForActiveHub(list);

    return [...(list || [])].sort((a, b) => {
        const byAvailability = compareAvailability(a, b);
        if (byAvailability) return byAvailability;
        return scoreBuildingSearchMatch(b, query) - scoreBuildingSearchMatch(a, query);
    });
}

function ensureCoupleFriendlyFacilityFilter() {
    if (document.querySelector(`.facilityFilter[value="${COUPLE_FRIENDLY_TAG}"]`)) {
        return;
    }

    const filters = document.querySelectorAll(".facilityFilter");
    if (!filters.length) return;

    const last = filters[filters.length - 1];
    const wrap = last.closest("label") || last.parentElement;
    if (!wrap || !wrap.parentNode) return;

    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "facilityFilter";
    input.value = COUPLE_FRIENDLY_TAG;
    label.appendChild(input);
    label.appendChild(document.createTextNode(" Couple Friendly"));
    wrap.parentNode.appendChild(label);
}

// =====================================================
// DATA HELPERS (buildings + room_types + reviews)
// =====================================================
function isRoomAvailable(rt) {
    const status = String(rt.availability || "").trim().toLowerCase();
    if (status === "occupied" || status === "unavailable") return false;
    return Number(rt.available_rooms) > 0;
}

function occupancyOptionsFromRoom(rt) {
    const details = rt?.room_details && typeof rt.room_details === "object" ? rt.room_details : {};
    const raw = Array.isArray(details.occupancy_options) ? details.occupancy_options : [];
    return raw.map((option) => ({
        people: Number(option.people),
        rent: Number(option.rent),
        nightly: option.nightly == null || option.nightly === "" ? null : Number(option.nightly)
    })).filter((option) => option.people >= 1 && Number.isFinite(option.rent) && option.rent > 0);
}

function roomMonthlyPriceList(rt) {
    const options = occupancyOptionsFromRoom(rt);
    if (options.length) return options.map((option) => option.rent);
    const price = Number(rt?.price_value);
    return Number.isFinite(price) ? [price] : [];
}

function occupancyLabelFromOptions(options) {
    const people = [...new Set((options || []).map((option) => Number(option.people)).filter((n) => n >= 1))].sort((a, b) => a - b);
    if (!people.length) return "Flexible Sharing";
    return people.map((count) => (count === 1 ? "Single" : `${count} Sharing`)).join(" / ");
}

function attachComputedFields(b) {
    const reviews = b.reviews || [];
    const roomTypes = b.room_types || [];

    const avgRating = reviews.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    const monthlyPrices = roomTypes.flatMap(rt => roomMonthlyPriceList(rt));
    const dailyPrices = roomTypes.map(rt => rt.daily_price).filter(p => p != null);
    const totalAvailable = roomTypes.reduce(
        (sum, rt) => sum + (isRoomAvailable(rt) ? Number(rt.available_rooms) : 0),
        0
    );
    const roomTypeNames = [...new Set(roomTypes.map(rt => rt.room_type))];

    return {
        ...b,
        avgRating,
        reviewCount: reviews.length,
        minPrice: monthlyPrices.length ? Math.min(...monthlyPrices) : null,
        maxPrice: monthlyPrices.length ? Math.max(...monthlyPrices) : null,
        minDailyPrice: dailyPrices.length ? Math.min(...dailyPrices) : null,
        totalAvailable,
        roomTypeNames,
        isCoupleFriendly: buildingHasCoupleFriendly(b)
    };
}

async function fetchAllBuildings() {
    const { data, error } = await supabaseClient
      .from("buildings")
.select("*, room_types(*), reviews(*)")
.order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching buildings:", error);
        return [];
    }
    return (data || []).filter(isPubliclyListedBuilding).map(attachComputedFields);
}

async function fetchBuildingById(id) {
    const { data, error } = await supabaseClient
        .from("buildings")
        .select("*, room_types(*), reviews(*)")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching building:", error);
        return null;
    }
    if (!isPubliclyListedBuilding(data)) {
        const user = await getCurrentUser();
        const isOwner = user && String(user.id) === String(data.created_by);
        const isAdmin = user && (isAdminEmail(user) || (await fetchProfileRole(user.id)) === "admin");
        if (!isOwner && !isAdmin) return null;
    }
    return attachComputedFields(data);
}

async function getCurrentUser() {
    const fromSession = await getCurrentUserFast();
    if (fromSession) return fromSession;
    const { data } = await supabaseClient.auth.getUser();
    return data.user || null;
}

async function getCurrentUserFast() {
    const { data } = await supabaseClient.auth.getSession();
    return data.session?.user || null;
}

async function getSignedInUser() {
    const fromSession = await getCurrentUserFast();
    if (fromSession) return fromSession;
    try {
        return await getCurrentUser();
    } catch (error) {
        console.error("Auth user lookup error:", error);
        return null;
    }
}
window.getSignedInUser = getSignedInUser;

async function getCurrentUserProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Profile fetch error:", error);
    }

    return { user, profile: data };
}

let navProfileOutsideClickBound = false;
let lastRenderedNavUserId = "__unset__";

async function updateNavForUser(user) {

    const navAuthBtn =
        document.getElementById("navAuthBtn");

    if (!navAuthBtn) return;

    const currentUserId =
        user ? user.id : null;

    if (
        currentUserId === lastRenderedNavUserId &&
        navAuthBtn.dataset.navReady === "true"
    ) {
        return;
    }

    lastRenderedNavUserId =
        currentUserId;

    let navProfileWrap =
        navAuthBtn.closest(".nav-profile-wrap");

    if (!navProfileWrap) {

        navProfileWrap =
            document.createElement("div");

        navProfileWrap.className =
            "nav-profile-wrap";

        navAuthBtn.parentNode.insertBefore(
            navProfileWrap,
            navAuthBtn
        );

        navProfileWrap.appendChild(
            navAuthBtn
        );
    }

    navProfileWrap
        .querySelector("#navProfileMenu")
        ?.remove();

    navAuthBtn.classList.remove(
        "nav-profile-toggle"
    );

    navAuthBtn.removeAttribute(
        "aria-haspopup"
    );

    navAuthBtn.onclick = null;


    // =================================================
    // LOGGED OUT
    // =================================================

    if (!user) {

        navAuthBtn.textContent =
            "Log In / Sign Up";

        navAuthBtn.onclick = () => {
            openAuthModal();
        };

        navAuthBtn.dataset.navReady =
            "true";

        navAuthBtn.classList.add(
            "nav-ready"
        );

        return;
    }


    // =================================================
    // GET PROFILE
    // =================================================

    const {
        data: profile,
        error
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

    if (error) {
        console.error(
            "Profile fetch error:",
            error
        );
    }


    const displayName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User";


    const profileRole =
        String(
            profile?.role || "user"
        )
            .trim()
            .toLowerCase();


    // =================================================
    // ADMIN
    // EXACT ADMIN EMAIL + ADMIN ROLE
    // =================================================

    const isAdmin =
        isAdminEmail(user) &&
        profileRole === "admin";


    // =================================================
    // OWNER
    // =================================================

    const isOwner =
        !isAdmin &&
        profileRole === "owner";


    const isPendingAgent = !isAdmin && isPendingAgentUser(user, profileRole);
    const isAgent = !isAdmin && (profileRole === "agent" || isPendingAgent);

    const roleLabel =
        isAdmin
            ? "Super Admin"
            : isOwner
                ? "Owner"
                : isAgent
                    ? (profileRole === "agent" ? "Agent" : "Agent (pending)")
                    : "Renter";


    const roleClass =
        isAdmin
            ? "admin"
            : isOwner
                ? "owner"
                : isAgent
                    ? "owner"
                    : "renter";


    // =================================================
    // PROFILE BUTTON
    // =================================================

    const profileInitial =
        String(displayName || "U").trim().charAt(0).toUpperCase() || "U";

    navAuthBtn.innerHTML = `
        <span class="nav-profile-avatar" aria-hidden="true">
            ${escapePropertyHtml(profileInitial)}
        </span>

        <span class="nav-profile-info">

            <span class="nav-profile-name">
                ${escapePropertyHtml(displayName)}
            </span>

            <span class="nav-profile-role ${roleClass}">
                ${roleLabel}
            </span>

        </span>

        <span class="nav-profile-dots">
            ⋮
        </span>
    `;

    navAuthBtn.classList.add(
        "nav-profile-toggle"
    );

    navAuthBtn.setAttribute(
        "aria-label",
        "Account menu"
    );

    navAuthBtn.setAttribute(
        "aria-haspopup",
        "true"
    );

    navAuthBtn.removeAttribute(
        "href"
    );


    // =================================================
    // PROFILE MENU
    // =================================================

    const menu =
        document.createElement("div");

    menu.id =
        "navProfileMenu";

    menu.className =
        "nav-profile-menu";


    const menuItems = [];


    // =================================================
    // ADMIN MENU
    // =================================================

    if (isAdmin) {

        menuItems.push({

            icon: "👤",

            title: "My Profile",

            subtitle: "User Dashboard",

            action: () => {

                window.location.href =
                    "user-dashboard.html";

            }

        });


        menuItems.push({

            icon: "🏠",

            title: "Owner Dashboard",

            subtitle: "Manage properties and rooms",

            action: () => {

                window.location.href =
                    "owner-dashboard.html";

            }

        });


        menuItems.push({

            icon: "🛡️",

            title: "Admin Dashboard",

            subtitle: "Manage RoomDhundo",

            action: () => {

                window.location.href =
                    "admin.html";

            }

        });

    }


    // =================================================
    // OWNER MENU
    // =================================================

    else if (isOwner || profileRole === "agent") {

        menuItems.push({

            icon: "👤",

            title: "My Profile",

            subtitle: profileRole === "agent" ? "Agent listings" : "Owner Dashboard",

            action: () => {

                window.location.href =
                    "owner-dashboard.html";

            }

        });

    }


    // =================================================
    // NORMAL USER MENU
    // =================================================

    else {

        menuItems.push({

            icon: "👤",

            title: "My Profile",

            subtitle: "User Dashboard",

            action: () => {

                window.location.href =
                    "user-dashboard.html";

            }

        });

    }


    // =================================================
    // ADD ANOTHER ACCOUNT
    // =================================================

    menuItems.push({

        icon: "👥",

        title: "Add Another Account",

        subtitle: "Sign in with another account",

        action: () => {

            window.location.href =
                "login.html";

        }

    });


    // =================================================
    // LOGOUT
    // =================================================

    menuItems.push({

        icon: "🚪",

        title: "Logout",

        subtitle: "Sign out of RoomDhundo",

        danger: true,

        action: async () => {

            const {
                error: signOutError
            } =
                await supabaseClient
                    .auth
                    .signOut();

            if (signOutError) {

                console.error(
                    "Logout error:",
                    signOutError
                );

                alert(
                    "Unable to log out. Please try again."
                );

                return;
            }

            lastRenderedNavUserId =
                "__unset__";

            window.location.href =
                "index.html";

        }

    });


    // =================================================
    // CREATE MENU
    // =================================================

    menuItems.forEach(
        item => {

            const menuItem =
                document.createElement("button");

            menuItem.type =
                "button";

            menuItem.className =
    "nav-profile-menu-item" +
    (
        item.danger
            ? " danger"
            : ""
    ) +
    (
        isAdmin &&
        item.title === "Admin Dashboard"
            ? " admin-dashboard-item"
            : ""
    );

            menuItem.innerHTML = `
                <span class="nav-profile-menu-icon">
                    ${item.icon}
                </span>

                <span class="nav-profile-menu-text">

                    <strong>
                        ${item.title}
                    </strong>

                    <span>
                        ${item.subtitle}
                    </span>

                </span>
            `;

            menuItem.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    menu.classList.remove(
                        "open"
                    );

                    item.action();

                }
            );

            menu.appendChild(
                menuItem
            );

        }
    );


    navProfileWrap.appendChild(
        menu
    );


    // =================================================
    // OPEN / CLOSE MENU
    // =================================================

    navAuthBtn.onclick =
        event => {

            event.preventDefault();
            event.stopPropagation();

            menu.classList.toggle(
                "open"
            );

        };


    // =================================================
    // OUTSIDE CLICK
    // =================================================

    if (
        !navProfileOutsideClickBound
    ) {

        document.addEventListener(
            "click",
            event => {

                const openMenu =
                    document.getElementById(
                        "navProfileMenu"
                    );

                if (!openMenu) {
                    return;
                }

                const wrap =
                    openMenu.closest(
                        ".nav-profile-wrap"
                    );

                if (
                    wrap &&
                    !wrap.contains(
                        event.target
                    )
                ) {

                    openMenu.classList.remove(
                        "open"
                    );

                }

            }
        );

        navProfileOutsideClickBound =
            true;
    }

    navAuthBtn.dataset.navReady =
        "true";

    navAuthBtn.classList.add(
        "nav-ready"
    );

}

function openAuthModal() {
    const authModal = document.getElementById("authModal");
    if (authModal) {
        hideGuestLoginPrompt();
        authModal.style.display = "flex";
        authModal.classList.add("is-open");
        document.body.classList.add("auth-modal-open");
        const loginForm = document.getElementById("loginForm");
        const signupForm = document.getElementById("signupForm");
        if (loginForm?.classList.contains("auth-form") && loginForm.classList.contains("active")) {
            loginForm.style.display = "block";
        }
        if (signupForm?.classList.contains("auth-form") && !signupForm.classList.contains("active")) {
            signupForm.style.display = "none";
        }
    }
}

function closeAuthModal() {
    if (document.body.classList.contains("login-required")) {
        const authModal = document.getElementById("authModal");
        if (authModal) {
            authModal.style.display = "flex";
            authModal.classList.add("is-open");
        }
        return;
    }
    const authModal = document.getElementById("authModal");
    if (authModal) {
        authModal.style.display = "none";
        authModal.classList.remove("is-open");
    }
    document.body.classList.remove("auth-modal-open");
    document.getElementById("loginForm")?.reset();
    document.getElementById("signupForm")?.reset();
}

function getCurrentPageName() {
    return (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
}

function isOAuthCallbackPage() {
    const page = getCurrentPageName();
    const path = window.location.pathname.replace(/\/+$/, "");
    return page === "auth-callback.html" || path.endsWith("/auth/callback") || path.endsWith("/callback");
}

function isPublicAuthPage() {
    return ["login.html", "signup.html", "reset-password.html", "auth-callback.html"].includes(getCurrentPageName())
        || isOAuthCallbackPage();
}

function isExploreGatePage() {
    const page = getCurrentPageName();
    return [
        "",
        "index.html",
        "search.html",
        "property.html",
        "saved.html"
    ].includes(page);
}

function hideGuestLoginPrompt() {
    document.getElementById("loginPrompt")?.classList.remove("is-open");
}

function setLoginRequired(required) {
    document.body.classList.toggle("login-required", required);
    const closeBtn = document.getElementById("closeAuthBtn");
    if (closeBtn) closeBtn.hidden = required;
}

function ensureLoginPrompt() {
    let prompt = document.getElementById("loginPrompt");
    if (prompt) return prompt;

    prompt = document.createElement("div");
    prompt.id = "loginPrompt";
    prompt.className = "login-prompt";
    prompt.innerHTML = `
        <div class="login-prompt-card" role="dialog" aria-modal="true" aria-labelledby="loginPromptTitle">
            <h2 id="loginPromptTitle">Log in to explore</h2>
            <p>Create an account or log in to search listings, view properties, and contact owners.</p>
            <button type="button" class="login-prompt-btn" id="loginPromptBtn">Log In / Sign Up</button>
        </div>
    `;
    document.body.appendChild(prompt);

    document.getElementById("loginPromptBtn")?.addEventListener("click", () => {
        hideGuestLoginPrompt();
        openAuthModal();
    });

    return prompt;
}

function showCompulsoryLoginPrompt() {
    const authModal = document.getElementById("authModal");
    if (!authModal) {
        return;
    }
    setLoginRequired(true);
    ensureLoginPrompt().classList.add("is-open");
    openAuthModal();
}

function requireLoginToExplore(user) {
    if (!isExploreGatePage()) {
        setLoginRequired(false);
        return true;
    }

    if (isPublicAuthPage()) {
        setLoginRequired(false);
        return true;
    }

    if (user) {
        setLoginRequired(false);
        hideGuestLoginPrompt();
        closeAuthModal();
        return true;
    }

    setLoginRequired(true);
    const homeList = document.getElementById("homeResultsList");
    const homeCount = document.getElementById("homeResultsCount");
    if (homeList) homeList.innerHTML = "";
    if (homeCount) homeCount.textContent = "Log in to explore properties";

    showCompulsoryLoginPrompt();
    return false;
}

let explorePagesStarted = false;

async function initExplorePages() {
    if (explorePagesStarted) return;
    explorePagesStarted = true;

    if (document.getElementById("homeResultsList")) {
        await initHomePage();
    }
    if (document.getElementById("resultsList")) {
        await initSearchPage();
    }
    if (document.getElementById("propertyName")) {
        await initPropertyPage();
    }
    if (document.getElementById("savedPropertiesContainer")) {
        await initSavedPage();
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setAuthMessage(elementId, text) {
    let el = document.getElementById(elementId);
    if (!el) {
        const formId = elementId === "loginMessage" ? "loginForm" : "signupForm";
        const form = document.getElementById(formId);
        if (form) {
            el = document.createElement("p");
            el.id = elementId;
            el.className = "auth-message";
            const submit = form.querySelector("button[type='submit']");
            form.insertBefore(el, submit || null);
        }
    }
    if (el) el.textContent = text || "";
}

function unlockExploreAfterAuth() {
    setLoginRequired(false);
    hideGuestLoginPrompt();
    const authModal = document.getElementById("authModal");
    if (authModal) {
        authModal.style.display = "none";
        authModal.classList.remove("is-open");
    }
    document.body.classList.remove("auth-modal-open");
}

function injectAuthRolePickers() {
    function addPicker(form, groupName, required) {
        if (!form || form.querySelector("[data-auth-role-picker]")) return;

        const picker = document.createElement("div");
        picker.className = "auth-role-picker";
        picker.dataset.authRolePicker = "true";
        picker.innerHTML = `
            <p class="auth-role-heading">I am a</p>
            <div class="auth-role-options" role="radiogroup" aria-label="Choose account type">
                <label class="auth-role-card">
                    <input type="radio" name="${groupName}" value="user"${required ? " required" : ""}>
                    <span class="auth-role-title">Renter</span>
                    <span class="auth-role-desc">Find a place to stay</span>
                </label>
                <label class="auth-role-card">
                    <input type="radio" name="${groupName}" value="owner"${required ? " required" : ""}>
                    <span class="auth-role-title">Owner</span>
                    <span class="auth-role-desc">List my property</span>
                </label>
                <label class="auth-role-card">
                    <input type="radio" name="${groupName}" value="agent"${required ? " required" : ""}>
                    <span class="auth-role-title">Agent</span>
                    <span class="auth-role-desc">List for property owners</span>
                </label>
            </div>
        `;

        const submit = form.querySelector("button[type='submit']");
        const message = form.querySelector(".auth-message, #loginMessage, #signupMessage");
        form.insertBefore(picker, message || submit || null);
    }

    addPicker(document.getElementById("loginForm"), "loginRole", true);
    addPicker(document.getElementById("signupForm"), "signupRole", true);
}

function getSelectedAuthRole(formId) {
    const form = document.getElementById(formId);
    if (!form) return null;
    const checked = form.querySelector(".auth-role-picker input[type='radio']:checked");
    const value = checked?.value;
    return value === "owner" || value === "user" || value === "agent" ? value : null;
}

function getAppDirectoryPath() {
    const path = window.location.pathname;
    const marker = "/files6.0/";
    const index = path.indexOf(marker);
    if (index !== -1) return path.slice(0, index + marker.length - 1);
    if (path.replace(/\/+$/, "").endsWith("/files6.0")) return path.replace(/\/+$/, "");
    return "";
}

function getAuthCallbackUrl() {
    const directory = getAppDirectoryPath();
    if (directory) return `${window.location.origin}${directory}/auth-callback.html`;
    const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    if (isLocal) return `${window.location.origin}/auth-callback.html`;
    return `${window.location.origin}/auth/callback`;
}

function friendlyGoogleAuthError(error, fallback) {
    const code = String(error?.code || error?.name || "").toLowerCase();
    const message = String(error?.message || error?.error_description || fallback || "").toLowerCase();
    if (code.includes("access_denied") || message.includes("access_denied") || message.includes("cancelled") || message.includes("canceled")) {
        return "Google sign-in was cancelled. You can try again or use email instead.";
    }
    if (message.includes("expired") || message.includes("invalid code") || message.includes("code verifier")) {
        return "This Google sign-in link expired. Please try Continue with Google again.";
    }
    if (message.includes("network") || message.includes("fetch") || message.includes("failed to fetch")) {
        return "Network problem while signing in with Google. Check your connection and try again.";
    }
    if (error?.message) return error.message;
    return fallback || "Google sign-in failed. Please try again.";
}

function setGoogleAuthButtonsBusy(busy) {
    document.querySelectorAll(".google-auth-btn").forEach((button) => {
        button.disabled = !!busy;
        button.classList.toggle("is-loading", !!busy);
        button.setAttribute("aria-busy", busy ? "true" : "false");
        const label = button.querySelector("[data-google-label]");
        if (label) label.textContent = busy ? "Redirecting to Google..." : "Continue with Google";
    });
}

function injectGoogleAuthButtons() {
    ["loginForm", "signupForm"].forEach((formId) => {
        const form = document.getElementById(formId);
        if (!form || form.querySelector("[data-google-auth]")) return;

        const wrap = document.createElement("div");
        wrap.className = "google-auth-wrap";
        wrap.dataset.googleAuth = "true";
        wrap.innerHTML = `
            <div class="auth-divider" role="separator"><span>or</span></div>
            <button type="button" class="google-auth-btn" data-google-auth-btn data-google-message="${formId === "signupForm" ? "signupMessage" : "loginMessage"}" aria-label="Continue with Google">
                <svg class="google-auth-icon" viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.5l6.3 5.3C37.9 38.3 44 32.5 44 24c0-1.3-.1-2.5-.4-3.5z"/>
                </svg>
                <span data-google-label>Continue with Google</span>
            </button>
        `;
        form.appendChild(wrap);
    });
}

function storeAuthReturnUrl() {
    const url = new URL(window.location.href);
    url.hash = "";
    url.searchParams.delete("code");
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    url.searchParams.delete("state");
    sessionStorage.setItem("roomdhundo_auth_return", url.pathname + url.search);
}

function safePostAuthPath(role) {
    if (role === "agent" || role === "agent_pending") return "be-an-agent.html";
    if (role === "owner") return "owner-dashboard.html";
    const raw = sessionStorage.getItem("roomdhundo_auth_return") || "";
    sessionStorage.removeItem("roomdhundo_auth_return");
    try {
        const url = new URL(raw, window.location.origin);
        if (url.origin !== window.location.origin) return "index.html";
        const path = url.pathname + url.search;
        if (!path || path.includes("auth-callback") || path.endsWith("/auth/callback") || path.includes("login.html") || path.includes("signup.html")) {
            return "index.html";
        }
        return path;
    } catch (error) {
        return "index.html";
    }
}

async function ensureUserProfile(user, preferredRole) {
    if (!user?.id) return { profile: null, error: new Error("Missing session") };

    const requestedRole = preferredRole === "owner"
        ? "owner"
        : (preferredRole === "agent" || preferredRole === "agent_pending" ? "agent_pending" : "user");
    const googleName = String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim();

    const { data: profile, error: fetchError } = await supabaseClient
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .maybeSingle();

    if (fetchError) return { profile: null, error: fetchError };

    if (!profile) {
        const saved = await upsertProfileSafe(user.id, {
            full_name: googleName || null,
            role: requestedRole
        });
        if (saved.error) return { profile: null, error: saved.error };
        return { profile: { id: user.id, full_name: googleName || null, role: saved.role } };
    }

    const patch = {};
    if (!profile.full_name && googleName) patch.full_name = googleName;
    if (Object.keys(patch).length > 0) {
        const { error: updateError } = await supabaseClient
            .from("profiles")
            .update(patch)
            .eq("id", user.id);
        if (updateError) return { profile, error: updateError };
    }

    return { profile };
}

async function startGoogleSignIn(messageId) {
    const formId = messageId === "signupMessage" ? "signupForm" : "loginForm";
    const selectedRole = getSelectedAuthRole(formId);
    if (document.querySelector(`#${formId} .auth-role-picker`) && !selectedRole) {
        setAuthMessage(messageId, "Please choose whether you are a renter, an owner, or an agent.");
        return;
    }
    if (selectedRole === "owner" || selectedRole === "user" || selectedRole === "agent") {
        sessionStorage.setItem("roomdhundo_oauth_role", selectedRole);
    } else {
        sessionStorage.removeItem("roomdhundo_oauth_role");
    }
    storeAuthReturnUrl();
    setAuthMessage(messageId, "Redirecting to Google...");
    setGoogleAuthButtonsBusy(true);

    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: getAuthCallbackUrl(),
                queryParams: { prompt: "select_account" }
            }
        });
        if (error) throw error;
    } catch (error) {
        console.error("Google sign-in error:", error);
        setGoogleAuthButtonsBusy(false);
        setAuthMessage(messageId, friendlyGoogleAuthError(error, "Could not start Google sign-in."));
    }
}

function wireGoogleAuthButtons() {
    injectGoogleAuthButtons();
    document.querySelectorAll("[data-google-auth-btn]").forEach((button) => {
        if (button.dataset.googleWired) return;
        button.dataset.googleWired = "true";
        button.addEventListener("click", () => {
            startGoogleSignIn(button.dataset.googleMessage || "loginMessage");
        });
    });
}

function showGoogleAuthError(message) {
    setAuthMessage("loginMessage", message);
    if (document.getElementById("authModal") || document.getElementById("loginForm")) {
        openAuthModal();
    }
}

async function consumeOAuthRedirect() {
    if (isOAuthCallbackPage() || new URLSearchParams(window.location.search).has("code")) {
        window.__oauthHandling = true;
    }
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errorCode = params.get("error") || hashParams.get("error");
    const errorDescription = params.get("error_description") || hashParams.get("error_description");

    if (errorCode) {
        const message = friendlyGoogleAuthError(
            { code: errorCode, message: errorDescription },
            "Google sign-in was cancelled or failed."
        );
        history.replaceState({}, document.title, window.location.pathname);
        if (isOAuthCallbackPage()) {
            sessionStorage.setItem("roomdhundo_auth_error", message);
            window.location.replace("index.html");
            return { handled: true, ok: false, redirecting: true };
        }
        showGoogleAuthError(message);
        return { handled: true, ok: false };
    }

    const storedError = sessionStorage.getItem("roomdhundo_auth_error");
    if (storedError) {
        sessionStorage.removeItem("roomdhundo_auth_error");
        showGoogleAuthError(storedError);
    }

    const code = params.get("code");
    let session = (await supabaseClient.auth.getSession()).data.session;

    if (code && !session) {
        const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
        if (error) {
            console.error("OAuth code exchange error:", error);
            history.replaceState({}, document.title, window.location.pathname);
            const message = friendlyGoogleAuthError(error, "Could not complete Google sign-in.");
            if (isOAuthCallbackPage()) {
                sessionStorage.setItem("roomdhundo_auth_error", message);
                window.location.replace("index.html");
                return { handled: true, ok: false, redirecting: true };
            }
            showGoogleAuthError(message);
            return { handled: true, ok: false };
        }
        session = data.session;
    }

    if (code || isOAuthCallbackPage()) {
        history.replaceState({}, document.title, window.location.pathname);
    }

    if (!session?.user) {
        if (isOAuthCallbackPage()) {
            const message = "Google sign-in did not create a session. Please try again.";
            sessionStorage.setItem("roomdhundo_auth_error", message);
            window.location.replace("index.html");
            return { handled: true, ok: false, redirecting: true };
        }
        return { handled: false, ok: null };
    }

    if (!code && !isOAuthCallbackPage()) {
        return { handled: false, ok: true, session };
    }

    const pendingRole = sessionStorage.getItem("roomdhundo_oauth_role");
    sessionStorage.removeItem("roomdhundo_oauth_role");
    const { profile, error: profileError } = await ensureUserProfile(session.user, pendingRole);
    if (profileError) {
        console.error("Google profile error:", profileError);
        showGoogleAuthError("Signed in with Google, but we could not save your profile. Please try again.");
    }
    if (pendingRole === "agent") {
        markAgentPendingLock();
        try {
            await supabaseClient.auth.updateUser({
                data: { role: "agent", agent_status: "pending" }
            });
        } catch (metaError) {
            console.error("Agent metadata error:", metaError);
        }
    }

    const role = pendingRole === "agent"
        ? "agent_pending"
        : String(profile?.role || pendingRole || "user").toLowerCase();
    await updateNavForUser(session.user);
    unlockExploreAfterAuth();
    window.dispatchEvent(new CustomEvent("roomdhundo:auth-changed"));

    if (isOAuthCallbackPage() || code) {
        window.location.replace(safePostAuthPath(role));
        return { handled: true, ok: true, session, redirecting: true };
    }

    return { handled: true, ok: true, session };
}

function isListingOwnerRole(role) {
    const value = String(role || "").trim().toLowerCase();
    return value === "owner" || value === "admin" || value === "agent";
}

async function fetchProfileRole(userId) {
    if (!userId) return "user";
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
    if (error) {
        console.error("Role fetch error:", error);
        return "user";
    }
    return String(data?.role || "user").trim().toLowerCase();
}

async function upsertProfileSafe(userId, fields) {
    const requested = String(fields.role || "user").trim().toLowerCase();
    const roles = requested === "agent" || requested === "agent_pending"
        ? ["agent_pending", "user"]
        : [requested];
    let lastError = null;
    for (const role of roles) {
        const { error } = await supabaseClient.from("profiles").upsert({
            ...fields,
            id: userId,
            role
        });
        if (!error) return { role, error: null };
        lastError = error;
    }
    return { role: null, error: lastError };
}

async function fetchAgentApplicationStatus(userId) {
    if (!userId) return null;
    const { data, error } = await supabaseClient
        .from("agent_applications")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();
    if (error) return null;
    return String(data?.status || "").trim().toLowerCase() || null;
}

function markAgentPendingLock() {
    try {
        sessionStorage.setItem("roomdhundo_agent_lock", "pending");
        localStorage.setItem("roomdhundo_role", "agent_pending");
    } catch (error) {}
}

function clearAgentPendingLock() {
    try {
        sessionStorage.removeItem("roomdhundo_agent_lock");
        if (localStorage.getItem("roomdhundo_role") === "agent_pending") {
            localStorage.setItem("roomdhundo_role", "agent");
        }
    } catch (error) {}
}

function hasAgentPendingLock() {
    try {
        const lock = sessionStorage.getItem("roomdhundo_agent_lock");
        const stored = localStorage.getItem("roomdhundo_role");
        return lock === "pending" || lock === "rejected" || stored === "agent_pending";
    } catch (error) {
        return false;
    }
}

function goToAgentApplication() {
    markAgentPendingLock();
    if (getCurrentPageName() === "be-an-agent.html") return;
    document.documentElement.style.visibility = "hidden";
    window.location.replace("be-an-agent.html");
}

function isPendingAgentUser(user, profileRole) {
    const role = String(profileRole || "").trim().toLowerCase();
    if (role === "agent") return false;
    if (role === "agent_pending") return true;
    const metaRole = String(user?.user_metadata?.role || "").trim().toLowerCase();
    const metaStatus = String(user?.user_metadata?.agent_status || "").trim().toLowerCase();
    return metaRole === "agent" || metaStatus === "pending" || hasAgentPendingLock();
}

async function resolveAgentState(user, profileRole) {
    const role = String(profileRole || "").trim().toLowerCase();
    if (role === "agent") {
        clearAgentPendingLock();
        return "approved";
    }
    if (role === "agent_pending") return "pending";
    const appStatus = await fetchAgentApplicationStatus(user?.id);
    if (appStatus === "approved") {
        clearAgentPendingLock();
        return "approved";
    }
    if (appStatus === "pending") return "pending";
    if (appStatus === "rejected") return "rejected";
    const metaRole = String(user?.user_metadata?.role || "").trim().toLowerCase();
    const metaStatus = String(user?.user_metadata?.agent_status || "").trim().toLowerCase();
    if (metaRole === "agent" || metaStatus === "pending" || hasAgentPendingLock()) return "pending";
    return "none";
}

function ensureOwnerOnlyModal() {
    let modal = document.getElementById("ownerOnlyModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "ownerOnlyModal";
    modal.className = "owner-only-modal";
    modal.innerHTML = `
        <div class="owner-only-card" role="dialog" aria-labelledby="ownerOnlyTitle" aria-modal="true">
            <h2 id="ownerOnlyTitle">Owners only</h2>
            <p>This area is for owners and approved agents to list property. Renters can search, save, and contact hosts, but they cannot add listings.</p>
            <button type="button" class="owner-only-ok" id="ownerOnlyOk">OK, got it</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) hideOwnerOnlyModal();
    });
    document.getElementById("ownerOnlyOk")?.addEventListener("click", hideOwnerOnlyModal);
    return modal;
}

function showOwnerOnlyModal() {
    ensureOwnerOnlyModal().classList.add("is-open");
}

function hideOwnerOnlyModal() {
    document.getElementById("ownerOnlyModal")?.classList.remove("is-open");
}

async function canCurrentUserListProperty() {
    const user = await getSignedInUser();
    if (!user) return { ok: false, reason: "login" };
    const role = await fetchProfileRole(user.id);
    if (!isListingOwnerRole(role)) return { ok: false, reason: "renter" };
    return { ok: true, reason: "owner" };
}

function wireListPropertyAccess() {
    document.querySelectorAll('a[href="list-property.html"], a[href^="list-property.html"]').forEach((link) => {
        if (link.dataset.ownerOnlyWired === "true") return;
        link.dataset.ownerOnlyWired = "true";
        link.addEventListener("click", async (event) => {
            event.preventDefault();
            const href = link.getAttribute("href") || "list-property.html";
            const access = await canCurrentUserListProperty();
            if (access.reason === "login") {
                setAuthMessage("loginMessage", "Log in as an owner or approved agent to list a property.");
                openAuthModal();
                return;
            }
            if (!access.ok) {
                showOwnerOnlyModal();
                return;
            }
            window.location.href = href;
        });
    });
}

function restoreListPropertyForm() {
    const form = document.getElementById("listPropertyForm");
    if (form) {
        form.hidden = false;
        form.querySelectorAll("input, select, textarea, button").forEach((el) => {
            el.disabled = false;
        });
    }
    document.querySelector(".owner-only-panel")?.remove();
    hideOwnerOnlyModal();
    closeAuthModal();
}

async function restrictListPropertyPageForRenters() {
    if (!["list-pg.html", "list-hotel.html", "list-flat.html", "list-property.html"].includes(getCurrentPageName())) return true;
    const access = await canCurrentUserListProperty();
    if (access.ok) {
        restoreListPropertyForm();
        return true;
    }

    const form = document.getElementById("listPropertyForm");
    if (form) {
        form.hidden = true;
        form.querySelectorAll("input, select, textarea, button").forEach((el) => {
            el.disabled = true;
        });
    }

    const page = document.querySelector(".list-property-page");
    if (access.reason === "renter" && page && !page.querySelector(".owner-only-panel")) {
        const panel = document.createElement("div");
        panel.className = "owner-only-panel";
        panel.innerHTML = `
            <h2>This area is for the owners to list property</h2>
            <p>Your account is a renter account. Only owners can add PG, room, mess, or flat listings.</p>
            <a href="index.html" class="owner-only-home">Back to Home</a>
        `;
        page.appendChild(panel);
    }

    if (access.reason === "login") {
        openAuthModal();
    } else {
        showOwnerOnlyModal();
    }
    return false;
}

function wireAuthUI() {
    const authModal = document.getElementById("authModal");
    const closeAuthBtn = document.getElementById("closeAuthBtn");
    const tabLogin = document.getElementById("tabLogin");
    const tabSignup = document.getElementById("tabSignup");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (loginForm?.classList.contains("auth-form") && loginForm.classList.contains("active")) {
        loginForm.style.display = "block";
    }
    if (signupForm?.classList.contains("auth-form") && !signupForm.classList.contains("active")) {
        signupForm.style.display = "none";
    }

    injectAuthRolePickers();
    wireGoogleAuthButtons();

    closeAuthBtn?.addEventListener("click", closeAuthModal);

    authModal?.querySelector(".auth-modal-content")?.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    window.addEventListener("click", (e) => {
        if (e.target === authModal) {
            if (document.body.classList.contains("login-required")) {
                openAuthModal();
                return;
            }
            closeAuthModal();
        }
    });

    function switchTab(activeTab, inactiveTab, showForm, hideForm) {
        activeTab?.classList.add("active");
        inactiveTab?.classList.remove("active");
        showForm?.classList.add("active");
        hideForm?.classList.remove("active");
        if (showForm?.classList.contains("auth-form")) showForm.style.display = "block";
        if (hideForm?.classList.contains("auth-form")) hideForm.style.display = "none";
        setAuthMessage("loginMessage", "");
        setAuthMessage("signupMessage", "");
        showForm?.scrollIntoView({ block: "nearest" });
    }

    tabLogin?.addEventListener("click", () => {
        switchTab(tabLogin, tabSignup, loginForm, signupForm);
    });

    tabSignup?.addEventListener("click", () => {
        switchTab(tabSignup, tabLogin, signupForm, loginForm);
    });

loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email =
        document.getElementById("loginEmail")?.value.trim();

    const password =
        document.getElementById("loginPassword")?.value;

    const loginMessage =
        document.getElementById("loginMessage");


    // =================================================
    // VALIDATION
    // =================================================

    if (!email || !password) {
        setAuthMessage("loginMessage", "Please enter email and password.");
        return;
    }

    if (!validateEmail(email)) {
        setAuthMessage("loginMessage", "Please enter a valid email.");
        return;
    }

    const selectedLoginRole = getSelectedAuthRole("loginForm");
    if (document.querySelector("#loginForm .auth-role-picker") && !selectedLoginRole) {
        setAuthMessage("loginMessage", "Please choose whether you are a renter, an owner, or an agent.");
        return;
    }

    setAuthMessage("loginMessage", "Logging in...");
    if (selectedLoginRole === "agent") {
        markAgentPendingLock();
    }


    // =================================================
    // SUPABASE LOGIN
    // =================================================

    const {
        data,
        error
    } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });


    if (error) {

        console.error(
            "Login error:",
            error
        );

        setAuthMessage("loginMessage", error.message);

        return;
    }


    if (!data?.user) {

        setAuthMessage("loginMessage", "Login failed.");

        return;
    }

    if (selectedLoginRole === "agent") {
        goToAgentApplication();
        return;
    }


    // =================================================
    // GET PROFILE
    // =================================================

    const result =
        await getCurrentUserProfile();


    const loggedInUser =
        result?.user || data.user;


    const loggedInRole =
        String(
            result?.profile?.role || selectedLoginRole || "user"
        )
            .trim()
            .toLowerCase();

    if (result?.profile && !result.profile.role && selectedLoginRole && loggedInUser?.id) {
        await supabaseClient
            .from("profiles")
            .update({ role: selectedLoginRole })
            .eq("id", loggedInUser.id);
    }


    // =================================================
    // ADMIN CHECK
    // EXACT EMAIL + ADMIN ROLE
    // =================================================

    const isAdmin =
        isAdminEmail(loggedInUser) &&
        loggedInRole === "admin";


    // =================================================
    // UPDATE NAVIGATION
    // =================================================

    await updateNavForUser(
        loggedInUser
    );


    setAuthMessage("loginMessage", "Login successful!");
    unlockExploreAfterAuth();


    window.dispatchEvent(
        new CustomEvent(
            "roomdhundo:auth-changed"
        )
    );


    // =================================================
    // ADMIN
    // STAY ON MAIN WEBSITE
    // =================================================

    if (isAdmin) {

        alert(
            "Admin login successful!"
        );

        closeAuthModal();

        window.location.href =
            "index.html";

        return;
    }


    // =================================================
    // OWNER
    // =================================================

    if (
        loggedInRole === "owner"
    ) {

        alert(
            "Login successful!"
        );

        window.location.href =
            "owner-dashboard.html";

        return;
    }

    const agentState = await resolveAgentState(loggedInUser, loggedInRole);
    if (agentState === "approved") {
        window.location.replace("index.html");
        return;
    }
    if (agentState === "pending" || agentState === "rejected") {
        goToAgentApplication();
        return;
    }


    // =================================================
    // NORMAL USER
    // =================================================

    alert(
        "Login successful!"
    );

    window.location.href =
        "index.html";

});

    signupForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("signupName")?.value.trim();
        const email = document.getElementById("signupEmail")?.value.trim();
        const password = document.getElementById("signupPassword")?.value || "";
        const confirmField = document.getElementById("signupConfirmPassword");
        const confirmPassword = confirmField ? confirmField.value : password;

        if (!name || name.length < 2) {
            setAuthMessage("signupMessage", "Please enter your full name.");
            return;
        }

        if (!validateEmail(email)) {
            setAuthMessage("signupMessage", "Please enter a valid email.");
            return;
        }

        if (password.length < 6) {
            setAuthMessage("signupMessage", "Password must be at least 6 characters.");
            return;
        }

        if (confirmField && password !== confirmPassword) {
            setAuthMessage("signupMessage", "Passwords do not match.");
            return;
        }

        const selectedRole = getSelectedAuthRole("signupForm");
        if (!selectedRole) {
            setAuthMessage("signupMessage", "Please choose whether you are a renter, an owner, or an agent.");
            return;
        }

        setAuthMessage("signupMessage", "Creating your account...");
        if (selectedRole === "agent") {
            markAgentPendingLock();
        }

        const { data, error } =
            await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        role: selectedRole
                    }
                }
            });

        if (error) {
            console.error("Signup error:", error);
            setAuthMessage("signupMessage", error.message);
            return;
        }

        if (!data.user) {
            setAuthMessage("signupMessage", "Something went wrong.");
            return;
        }

        let session = data.session;

        if (!session) {
            const signInResult =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (!signInResult.error) {
                session = signInResult.data.session;
            }
        }

        const profileRole = selectedRole === "agent" ? "agent_pending" : selectedRole;
        const savedProfile = await upsertProfileSafe(data.user.id, {
            full_name: name,
            name,
            role: profileRole
        });
        if (savedProfile.error) {
            console.error("Profile creation error:", savedProfile.error);
        }
        if (selectedRole === "agent") {
            try {
                await supabaseClient.auth.updateUser({
                    data: { role: "agent", agent_status: "pending", full_name: name }
                });
            } catch (metaError) {
                console.error("Agent metadata error:", metaError);
            }
        }

        if (!session) {
            setAuthMessage(
                "signupMessage",
                selectedRole === "agent"
                    ? "Account created. Confirm your email, then log in as Agent to finish the application."
                    : "Account created! Please check your email to confirm your account before logging in."
            );

            alert(
                `Account created, ${name}!\n\n` +
                `We've sent a confirmation link to ${email}. ` +
                `Please confirm your email, then log in.`
            );

            return;
        }

        if (selectedRole === "agent") {
            goToAgentApplication();
            return;
        }

        localStorage.setItem("roomdhundo_role", selectedRole);
        setAuthMessage("signupMessage", "Account created successfully!");
        unlockExploreAfterAuth();
        alert(`Account created successfully!\n\nWelcome to RoomDhundo, ${name}!`);
        await updateNavForUser(session.user);
        window.dispatchEvent(new CustomEvent("roomdhundo:auth-changed"));
        if (selectedRole === "owner") {
            window.location.replace("owner-dashboard.html");
        } else {
            window.location.replace("index.html");
        }
    });
}

function wireHomeStayButtons() {
    const stayButtons = document.querySelectorAll(".stay-btn");
    stayButtons.forEach(button => {
        button.addEventListener("click", () => {
            stayButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
        });
    });
}

function wireHeroSearch() {
    const heroSearchInput = document.getElementById("heroSearchInput");
    const heroSearchBtn = document.getElementById("heroSearchBtn");
    const heroDailyBtn = document.getElementById("heroDailyBtn");
    const homeResultsList = document.getElementById("homeResultsList");

    // On the new homepage, search filters listings in place.
    // On any older layout without home cards, keep redirecting to Explore.
    if (homeResultsList) return;

    function goToSearch() {
        const query = heroSearchInput ? heroSearchInput.value.trim() : "";
        const stay = heroDailyBtn && heroDailyBtn.classList.contains("active") ? "daily" : "monthly";
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        params.set("stay", stay);
        window.location.href = `search.html?${params.toString()}`;
    }

    heroSearchBtn?.addEventListener("click", goToSearch);
    heroSearchInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") goToSearch();
    });
}

async function initHomePage() {
    const resultsList = document.getElementById("homeResultsList");
    const resultsCountEl = document.getElementById("homeResultsCount");
    const noResultsMessage = document.getElementById("homeNoResults");
    const searchInput = document.getElementById("heroSearchInput");
    const searchBtn = document.getElementById("heroSearchBtn");
    const monthlyBtn = document.getElementById("heroMonthlyBtn");
    const dailyBtn = document.getElementById("heroDailyBtn");
    const filterBtn = document.getElementById("homeFilterBtn");
    const filterPanel = document.getElementById("homeFilterPanel");
    const applyFiltersBtn = document.getElementById("homeApplyFiltersBtn");
    const clearFiltersBtn = document.getElementById("homeClearFiltersBtn");
    const backToTopBtn = document.getElementById("homeBackToTopBtn");

    if (!resultsList) return;

    resultsList.innerHTML = `<p class="no-results">Loading properties…</p>`;

    const allBuildings = await fetchAllBuildings();
    const currentUser = await getCurrentUser();
    let savedIds = await getSavedBuildingIds(currentUser ? currentUser.id : null);

    // Category tabs (All / PG-Room / Hotel / Flat) -> property types stored in buildings.type
    const CATEGORY_TYPES = {
        all: [],
        pgroom: ["PG", "Room"],
        hotel: ["Hotel", "Guest House"],
        flat: ["Flat"]
    };
    let activeCategory = "all";
    let flatOffer = "rent";
    const categoryTabs = document.querySelectorAll(".home-cat-tab");
    const flatOfferWrap = document.getElementById("homeFlatOffer");

    function syncFlatOfferButtons() {
        if (!flatOfferWrap) return;
        const show = activeCategory === "flat";
        flatOfferWrap.hidden = !show;
        flatOfferWrap.querySelectorAll("[data-flat-offer]").forEach((btn) => {
            const on = btn.dataset.flatOffer === flatOffer;
            btn.classList.toggle("is-active", on);
            btn.setAttribute("aria-selected", on ? "true" : "false");
        });
    }

    flatOfferWrap?.querySelectorAll("[data-flat-offer]").forEach((btn) => {
        btn.addEventListener("click", () => {
            flatOffer = btn.dataset.flatOffer === "sale" ? "sale" : "rent";
            syncFlatOfferButtons();
            resetPreviewAndRender();
        });
    });

    function updateFooterFeeNote() {
        document.querySelectorAll(".site-footer-fee, .site-footer-links").forEach((el) => {
            el.style.display = "";
        });
    }
    updateFooterFeeNote();
    syncFlatOfferButtons();

    categoryTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            activeCategory = tab.dataset.category || "all";
            updateFooterFeeNote();
            syncFlatOfferButtons();
            categoryTabs.forEach(t => {
                const on = t === tab;
                t.classList.toggle("active", on);
                t.setAttribute("aria-selected", on ? "true" : "false");
            });
            resetPreviewAndRender();
        });
    });

    function isDailyMode() {
        return !!(dailyBtn && dailyBtn.classList.contains("active"));
    }

    function readFilters() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const daily = isDailyMode();
        const minEl = document.getElementById("homeMinBudget");
        const maxEl = document.getElementById("homeMaxBudget");
        const min = minEl && minEl.value ? Number(minEl.value) : null;
        const max = maxEl && maxEl.value ? Number(maxEl.value) : null;
        const propertyTypes = Array.from(
            document.querySelectorAll(".homePropertyTypeFilter:checked")
        ).map(cb => cb.value);
        const facilities = Array.from(
            document.querySelectorAll(".homeFacilityFilter:checked")
        ).map(cb => cb.value);

        const categoryTypes = CATEGORY_TYPES[activeCategory] || [];

        const agentId = new URLSearchParams(window.location.search).get("agent") || "";
        return { query, daily, min, max, propertyTypes, facilities, categoryTypes, agentId };
    }

    function applyFilters(list, f) {
        return list.filter(b => {
            if (f.agentId && String(b.created_by) !== String(f.agentId)) return false;
            if (f.query && !buildingMatchesSearchQuery(b, f.query)) return false;

            const roomTypes = b.room_types || [];

            if (f.daily) {
                const hasNightly = roomTypes.some(rt =>
                    rt.daily_price != null && Number(rt.daily_price) > 0
                );
                if (!hasNightly) return false;
            }

            if (f.min !== null || f.max !== null) {
                const anyRoomFits = roomTypes.some(rt => {
                    const price = f.daily ? rt.daily_price : rt.price_value;
                    if (price == null || price === "") return false;
                    if (f.min !== null && price < f.min) return false;
                    if (f.max !== null && price > f.max) return false;
                    return true;
                });
                if (!anyRoomFits) return false;
            }

            if (f.categoryTypes.length > 0 && !f.categoryTypes.includes(b.type)) {
                return false;
            }

            if (f.propertyTypes.length > 0 && !f.propertyTypes.includes(b.type)) {
                return false;
            }

            if (f.facilities.length > 0) {
                const tags = b.facility_tags || [];
                const labels = b.facilities || [];
                const furnishingSelected = f.facilities.filter(tag => FURNISHING_TAGS.includes(tag));
                const otherFacilities = f.facilities.filter(tag => !FURNISHING_TAGS.includes(tag));

                const matchesTag = (tag) => {
                    if (tag === COUPLE_FRIENDLY_TAG || isCoupleFriendlyFacility(tag)) {
                        return buildingHasCoupleFriendly(b);
                    }
                    return tags.includes(tag) || labels.includes(tag);
                };

                if (otherFacilities.length > 0 && !otherFacilities.every(matchesTag)) {
                    return false;
                }

                if (furnishingSelected.length > 0 && !furnishingSelected.some(matchesTag)) {
                    return false;
                }
            }

            return true;
        });
    }

    function buildingCardHTML(b) {
        const isSaved = savedIds.includes(b.id);
        if (isHotelListing(b)) {
            return hotelPackageCardHTML(b, { isSaved, extraClass: "home-property-card" });
        }
        const facilityBadges = facilityPreviewBadgesHTML(b);
        const daily = isDailyMode();
        const forSale = isFlatForSale(b);
        const unit = forSale ? "" : daily ? "/ night" : "/ month";
        const price = daily && !forSale ? b.minDailyPrice : b.minPrice;
        const priceToShow = price != null ? `₹${Number(price).toLocaleString("en-IN")}` : "—";
        const priceLabel = forSale ? "Sale" : ((b.room_types || []).length > 1 ? "From" : "");
        const ratingLabel = b.avgRating ? `⭐ ${b.avgRating}` : "🆕 New";
        const roomTypeSummary = (b.roomTypeNames || []).join(", ");
        const offerBadge = isFlatListing(b)
            ? `<span class="flat-offer-badge">${forSale ? "For sale" : "On rent"}</span>`
            : "";

        return `
            <div class="property-card home-property-card" data-id="${b.id}">
                <a class="property-image-link" href="property.html?id=${b.id}" aria-label="View ${b.name}">
                <div class="property-image">
                    ${b.images && b.images.length > 0
                        ? `
                            <img
                                src="${b.images[0]}"
                                alt="${b.name}"
                                loading="lazy"
                                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                            >
                            <div class="image-placeholder" style="display:none;">Property Image</div>
                          `
                        : `<div class="image-placeholder">Property Image</div>`
                    }
                </div>
                </a>
                <div class="property-content">
                    <div class="property-title">
                        <div>
                            <h2>${b.name}</h2>
                            <p>${formatDistanceFromActiveHub(b, { includeLocation: true })}</p>
                            ${offerBadge}
                        </div>
                        <button class="favorite${isSaved ? " saved" : ""}" data-id="${b.id}">${isSaved ? "♥" : "♡"}</button>
                    </div>
                    <div class="rating">${ratingLabel} <span>(${b.reviewCount} reviews)</span></div>
                    <div class="price">
                        <strong>${priceLabel ? priceLabel + " " : ""}${priceToShow}</strong>
                        <span>${unit}</span>
                    </div>
                    <p>${roomTypeSummary}</p>
                    <div class="amenities">${facilityBadges}</div>
                    <div class="availability">${
                        b.totalAvailable > 0
                            ? `🟢 ${b.totalAvailable} ${b.totalAvailable === 1 ? (isFlatListing(b) ? "flat" : "room") : (isFlatListing(b) ? "flats" : "rooms")} available`
                            : "🔴 Currently occupied"
                    }</div>
                    <div class="card-actions">
                        <a href="property.html?id=${b.id}" class="view-btn">View Property</a>
                    </div>
                </div>
            </div>
        `;
    }

    function attachCardListeners() {
        resultsList.querySelectorAll(".favorite").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                const nowSaved = await toggleSavedBuilding(id);
                if (nowSaved === null) return;
                savedIds = nowSaved ? [...savedIds, id] : savedIds.filter(x => x !== id);
                btn.classList.toggle("saved", nowSaved);
                btn.textContent = nowSaved ? "♥" : "♡";
            });
        });
        bindListPropertyOpeners(resultsList);
    }

    function renderPage() {
        const filters = readFilters();
        const hub = getHubOnlyFromQuery(filters.query);
        if (hub) applySearchHubQuietly(hub);
        let list = sortBuildingsBySearch(applyFilters(allBuildings, filters), filters.query);
        if (activeCategory === "flat") {
            list = list.filter((b) => (flatOffer === "sale" ? isFlatForSale(b) : !isFlatForSale(b)));
        }

        resultsList.innerHTML = list.length
            ? list.map(buildingCardHTML).join("")
            : "";
        attachCardListeners();

        if (resultsCountEl) {
            const one = activeCategory === "flat"
                ? (flatOffer === "sale" ? "flat for sale" : "flat on rent")
                : "property";
            const many = activeCategory === "flat"
                ? (flatOffer === "sale" ? "flats for sale" : "flats on rent")
                : "properties";
            resultsCountEl.textContent = list.length === 0
                ? `0 ${many} found`
                : `${list.length} ${list.length === 1 ? one : many} found`;
        }

        if (noResultsMessage) {
            noResultsMessage.style.display = list.length === 0 ? "block" : "none";
            if (list.length === 0 && activeCategory === "flat") {
                noResultsMessage.textContent = flatOffer === "sale"
                    ? "No flats for sale match your search. Try On rent, or clear filters."
                    : "No flats on rent match your search. Try For sale, or clear filters.";
            } else if (list.length === 0) {
                noResultsMessage.textContent = "No properties match your search. Try clearing filters or searching another area.";
            }
        }

        resultsList.style.display = list.length === 0 ? "none" : "grid";

        updateBackToTopVisibility();
    }

    function resetPreviewAndRender({ scrollToResults = false } = {}) {
        renderPage();
        if (scrollToResults) {
            document.querySelector(".home-listings")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    function updateBackToTopVisibility() {
        if (!backToTopBtn) return;
        const shouldShow = window.scrollY > 420;
        backToTopBtn.hidden = !shouldShow;
    }

    monthlyBtn?.addEventListener("click", () => {
        monthlyBtn.classList.add("active");
        dailyBtn?.classList.remove("active");
        resetPreviewAndRender();
    });

    dailyBtn?.addEventListener("click", () => {
        dailyBtn.classList.add("active");
        monthlyBtn?.classList.remove("active");
        resetPreviewAndRender();
    });

    filterBtn?.addEventListener("click", () => {
        if (!filterPanel) return;
        const open = filterPanel.hasAttribute("hidden");
        if (open) filterPanel.removeAttribute("hidden");
        else filterPanel.setAttribute("hidden", "");
        filterBtn.setAttribute("aria-expanded", open ? "true" : "false");
        filterBtn.classList.toggle("active", open);
    });

    searchBtn?.addEventListener("click", () => {
        resetPreviewAndRender({ scrollToResults: true });
    });
    searchInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") resetPreviewAndRender({ scrollToResults: true });
    });
    applyFiltersBtn?.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 640px)").matches && filterPanel) {
            filterPanel.setAttribute("hidden", "");
            filterBtn?.setAttribute("aria-expanded", "false");
            filterBtn?.classList.remove("active");
            resetPreviewAndRender({ scrollToResults: true });
        } else {
            resetPreviewAndRender();
        }
    });

    clearFiltersBtn?.addEventListener("click", () => {
        document.querySelectorAll(".homePropertyTypeFilter, .homeFacilityFilter").forEach(cb => {
            cb.checked = false;
        });
        const minEl = document.getElementById("homeMinBudget");
        const maxEl = document.getElementById("homeMaxBudget");
        if (minEl) minEl.value = "";
        if (maxEl) maxEl.value = "";
        if (searchInput) searchInput.value = "";
        monthlyBtn?.classList.add("active");
        dailyBtn?.classList.remove("active");
        activeCategory = "all";
        updateFooterFeeNote();
        categoryTabs.forEach(t => {
            const on = t.dataset.category === "all";
            t.classList.toggle("active", on);
            t.setAttribute("aria-selected", on ? "true" : "false");
        });
        resetPreviewAndRender();
    });

    backToTopBtn?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

    window.addEventListener("roomdhundo:location-changed", renderPage);

    renderPage();
    restoreListScrollState();
}

function wireStayTypeToggle(onChange) {
    const monthlyBtn = document.getElementById("monthlyBtn");
    const dailyBtn = document.getElementById("dailyBtn");
    const monthlyFilters = document.getElementById("monthlyFilters");
    const dailyFilters = document.getElementById("dailyFilters");
    if (!(monthlyBtn && dailyBtn && monthlyFilters && dailyFilters)) return;

    monthlyBtn.addEventListener("click", () => {
        monthlyBtn.classList.add("active");
        dailyBtn.classList.remove("active");
        monthlyFilters.style.display = "block";
        dailyFilters.style.display = "none";
        if (onChange) onChange();
    });

    dailyBtn.addEventListener("click", () => {
        dailyBtn.classList.add("active");
        monthlyBtn.classList.remove("active");
        monthlyFilters.style.display = "none";
        dailyFilters.style.display = "block";
        if (onChange) onChange();
    });
}

function wireGuestCounter() {
    const plusGuest = document.getElementById("plusGuest");
    const minusGuest = document.getElementById("minusGuest");
    const guestCount = document.getElementById("guestCount");
    if (!(plusGuest && minusGuest && guestCount)) return;

    let guests = 1;
    plusGuest.addEventListener("click", () => {
        guests++;
        guestCount.textContent = guests;
    });
    minusGuest.addEventListener("click", () => {
        if (guests > 1) {
            guests--;
            guestCount.textContent = guests;
        }
    });
}

async function getSavedBuildingIds(userId) {
    if (!userId) return [];
    const { data, error } = await supabaseClient
        .from("saved_buildings")
        .select("building_id")
        .eq("user_id", userId);

    if (error) {
        console.error("Error fetching saved buildings:", error);
        return [];
    }
    return data.map(row => row.building_id);
}

async function toggleSavedBuilding(buildingId) {
    const user = await getCurrentUser();
    if (!user) {
        alert("Please log in to save properties.");
        openAuthModal();
        return null;
    }

    const savedIds = await getSavedBuildingIds(user.id);
    const alreadySaved = savedIds.includes(buildingId);

    if (alreadySaved) {
        const { error } = await supabaseClient
            .from("saved_buildings")
            .delete()
            .eq("user_id", user.id)
            .eq("building_id", buildingId);
        if (error) { console.error(error); return null; }
        return false;
    } else {
        const { error } = await supabaseClient
            .from("saved_buildings")
            .insert({ user_id: user.id, building_id: buildingId });
        if (error) { console.error(error); return null; }
        return true;
    }
}

async function initSearchPage() {
    const resultsList = document.getElementById("resultsList");
    const resultsCountEl = document.getElementById("resultsCount");
    const noResultsMessage = document.getElementById("noResultsMessage");
    const sortSelect = document.getElementById("sortSelect");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const applyFiltersBtn = document.getElementById("applyFiltersBtn");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");

    ensureCoupleFriendlyFacilityFilter();

    resultsList.innerHTML = `<p class="no-results">Loading properties…</p>`;

    const allBuildings = await fetchAllBuildings();
    const currentUser = await getCurrentUser();
    let savedIds = await getSavedBuildingIds(currentUser ? currentUser.id : null);

    function isDailyMode() {
        const dailyBtnEl = document.getElementById("dailyBtn");
        return !!(dailyBtnEl && dailyBtnEl.classList.contains("active"));
    }

    function readFilters() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const daily = isDailyMode();

        const minEl = document.getElementById(daily ? "dailyMin" : "monthlyMin");
        const maxEl = document.getElementById(daily ? "dailyMax" : "monthlyMax");
        const min = minEl && minEl.value ? Number(minEl.value) : null;
        const max = maxEl && maxEl.value ? Number(maxEl.value) : null;

        const roomTypes = Array.from(document.querySelectorAll(".roomTypeFilter:checked")).map(cb => cb.value);
        const propertyTypes = Array.from(document.querySelectorAll(".propertyTypeFilter:checked")).map(cb => cb.value);
        const facilities = Array.from(document.querySelectorAll(".facilityFilter:checked")).map(cb => cb.value);

        return { query, daily, min, max, roomTypes, propertyTypes, facilities };
    }

    function applyFilters(list, f) {
        return list.filter(b => {
            if (f.query && !buildingMatchesSearchQuery(b, f.query)) return false;

            const roomTypes = b.room_types || [];

            // Daily search only shows rooms the owner priced per night.
            if (f.daily) {
                const hasNightly = roomTypes.some(rt =>
                    rt.daily_price != null && Number(rt.daily_price) > 0
                );
                if (!hasNightly) return false;
            }

            if (f.min !== null || f.max !== null) {
                const anyRoomFits = roomTypes.some(rt => {
                    const price = f.daily ? rt.daily_price : rt.price_value;
                    if (price == null || price === "") return false;
                    if (f.min !== null && price < f.min) return false;
                    if (f.max !== null && price > f.max) return false;
                    return true;
                });
                if (!anyRoomFits) return false;
            }

            if (f.roomTypes.length > 0) {
                const hasMatchingRoomType = roomTypes.some(rt => f.roomTypes.includes(rt.room_type));
                if (!hasMatchingRoomType) return false;
            }

            if (f.propertyTypes.length > 0 && !f.propertyTypes.includes(b.type)) return false;

            if (f.facilities.length > 0) {
                const tags = b.facility_tags || [];
                const labels = b.facilities || [];
                const furnishingSelected = f.facilities.filter(tag => FURNISHING_TAGS.includes(tag));
                const otherFacilities = f.facilities.filter(tag => !FURNISHING_TAGS.includes(tag));

                const matchesTag = (tag) => {
                    if (tag === COUPLE_FRIENDLY_TAG || isCoupleFriendlyFacility(tag)) {
                        return buildingHasCoupleFriendly(b);
                    }
                    return tags.includes(tag) || labels.includes(tag);
                };

                if (otherFacilities.length > 0 && !otherFacilities.every(matchesTag)) {
                    return false;
                }

                // Furnished / semi / unfurnished: match ANY selected option.
                if (furnishingSelected.length > 0 && !furnishingSelected.some(matchesTag)) {
                    return false;
                }
            }

            return true;
        });
    }

    function sortResults(list, sortKey, query) {
        const sorted = [...list];
        switch (sortKey) {
            case "price-asc":
                sorted.sort((a, b) => {
                    const byAvailability = compareAvailability(a, b);
                    if (byAvailability) return byAvailability;
                    return (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity);
                });
                break;
            case "price-desc":
                sorted.sort((a, b) => {
                    const byAvailability = compareAvailability(a, b);
                    if (byAvailability) return byAvailability;
                    return (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity);
                });
                break;
            case "rating":
                sorted.sort((a, b) => {
                    const byAvailability = compareAvailability(a, b);
                    if (byAvailability) return byAvailability;
                    return (b.avgRating || 0) - (a.avgRating || 0);
                });
                break;
            default:
                return sortBuildingsBySearch(sorted, query);
        }
        return sorted;
    }

    function buildingCardHTML(b) {
        const isSaved = savedIds.includes(b.id);
        if (isHotelListing(b)) {
            return hotelPackageCardHTML(b, { isSaved, compare: true });
        }
        const facilityBadges = facilityPreviewBadgesHTML(b);
        const daily = isDailyMode();
        const forSale = isFlatForSale(b);
        const unit = forSale ? "" : daily ? "/ night" : "/ month";
        const price = daily && !forSale ? b.minDailyPrice : b.minPrice;
        const priceToShow = price != null ? `₹${Number(price).toLocaleString("en-IN")}` : "—";
        const priceLabel = forSale ? "Sale" : ((b.room_types || []).length > 1 ? "From" : "");
        const ratingLabel = b.avgRating ? `⭐ ${b.avgRating}` : "🆕 New";
        const roomTypeSummary = b.roomTypeNames.join(", ");
        const offerBadge = isFlatListing(b)
            ? `<span class="flat-offer-badge">${forSale ? "For sale" : "On rent"}</span>`
            : "";

        return `
            <div class="property-card" data-id="${b.id}">
                <a class="property-image-link" href="property.html?id=${b.id}" aria-label="View ${b.name}">
                <div class="property-image">
                    ${b.images && b.images.length > 0
    ? `
        <img
            src="${b.images[0]}"
            alt="${b.name}"
            loading="lazy"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        >
        <div
            class="image-placeholder"
            style="display:none;"
        >
            Property Image
        </div>
      `
    : `
        <div class="image-placeholder">
            Property Image
        </div>
      `
}
                </div>
                </a>
                <div class="property-content">
                    <div class="property-title">
                        <div>
                            <h2>${b.name}</h2>
                            <p>${formatDistanceFromActiveHub(b)}</p>
                            ${offerBadge}
                        </div>
                        <button class="favorite${isSaved ? " saved" : ""}" data-id="${b.id}">${isSaved ? "♥" : "♡"}</button>
                    </div>
                    <div class="rating">${ratingLabel} <span>(${b.reviewCount} reviews)</span></div>
                    <div class="price">
                        <strong>${priceLabel ? priceLabel + " " : ""}${priceToShow}</strong>
                        <span>${unit}</span>
                    </div>
                    <p>${roomTypeSummary}</p>
                    <div class="amenities">${facilityBadges}</div>
                    <div class="availability">${
                        b.totalAvailable > 0
                            ? `🟢 ${b.totalAvailable} ${b.totalAvailable === 1 ? (isFlatListing(b) ? "flat" : "room") : (isFlatListing(b) ? "flats" : "rooms")} available`
                            : "🔴 Currently occupied"
                    }</div>
                    <div class="card-actions">
                        <button class="compare-btn">Compare</button>
                        <a href="property.html?id=${b.id}" class="view-btn">View Property</a>
                    </div>
                </div>
            </div>
        `;
    }

    function attachCardListeners() {
        document.querySelectorAll(".favorite").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                const nowSaved = await toggleSavedBuilding(id);
                if (nowSaved === null) return;
                savedIds = nowSaved ? [...savedIds, id] : savedIds.filter(x => x !== id);
                btn.classList.toggle("saved", nowSaved);
                btn.textContent = nowSaved ? "♥" : "♡";
            });
        });
        bindListPropertyOpeners(resultsList);
    }

    function renderPage() {
        const filters = readFilters();
        const hub = getHubOnlyFromQuery(filters.query);
        if (hub) applySearchHubQuietly(hub);
        let list = applyFilters(allBuildings, filters);
        list = sortResults(list, sortSelect ? sortSelect.value : "recommended", filters.query);

        resultsList.innerHTML = list.map(buildingCardHTML).join("");
        attachCardListeners();

        if (resultsCountEl) {
            resultsCountEl.textContent = `${list.length} ${list.length === 1 ? "property" : "properties"} found`;
        }
        if (noResultsMessage) {
            noResultsMessage.style.display = list.length === 0 ? "block" : "none";
        }
        resultsList.style.display = list.length === 0 ? "none" : "block";
    }

    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get("q");
    const stayParam = urlParams.get("stay");
    const typeParam = urlParams.get("type");
    const minParam = urlParams.get("min");
    const maxParam = urlParams.get("max");

    if (qParam && searchInput) searchInput.value = qParam;

    if (typeParam) {
        const selectedTypes = typeParam.split(",").map(t => t.trim()).filter(Boolean);
        document.querySelectorAll(".propertyTypeFilter").forEach(cb => {
            cb.checked = selectedTypes.includes(cb.value);
        });
    }

    if (stayParam === "daily") {
        const dailyBtnEl = document.getElementById("dailyBtn");
        const monthlyBtnEl = document.getElementById("monthlyBtn");
        const monthlyFiltersEl = document.getElementById("monthlyFilters");
        const dailyFiltersEl = document.getElementById("dailyFilters");
        if (dailyBtnEl && monthlyBtnEl && monthlyFiltersEl && dailyFiltersEl) {
            dailyBtnEl.classList.add("active");
            monthlyBtnEl.classList.remove("active");
            monthlyFiltersEl.style.display = "none";
            dailyFiltersEl.style.display = "block";
        }
    }

    if (minParam || maxParam) {
        const daily = stayParam === "daily";
        const minEl = document.getElementById(daily ? "dailyMin" : "monthlyMin");
        const maxEl = document.getElementById(daily ? "dailyMax" : "monthlyMax");
        if (minParam && minEl) minEl.value = minParam;
        if (maxParam && maxEl) maxEl.value = maxParam;
    }

    wireStayTypeToggle(renderPage);
    wireGuestCounter();

    applyFiltersBtn?.addEventListener("click", renderPage);
    sortSelect?.addEventListener("change", renderPage);
    searchBtn?.addEventListener("click", renderPage);
    searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") renderPage(); });

    clearFiltersBtn?.addEventListener("click", () => {
        document.querySelectorAll(".roomTypeFilter, .propertyTypeFilter, .facilityFilter").forEach(cb => cb.checked = false);
        ["monthlyMin", "monthlyMax", "dailyMin", "dailyMax"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        if (searchInput) searchInput.value = "";
        if (sortSelect) sortSelect.value = "recommended";
        renderPage();
    });

    window.addEventListener("roomdhundo:location-changed", renderPage);

    renderPage();
    restoreListScrollState();
}

function getHotelRoomFromUrl(building) {
    if (!isHotelListing(building)) return null;
    const roomId = new URLSearchParams(window.location.search).get("room");
    if (!roomId) return null;
    return (building.room_types || []).find((rt) => String(rt.id) === String(roomId)) || null;
}

function setupHotelRoomDetailPage(building, room) {
    document.body.classList.add("is-hotel-room-page");
    document.body.classList.remove("is-hotel-page");
    const mapEl = document.getElementById("roomdhundoMap");
    if (mapEl) mapEl.style.display = "none";
    const roomTitle = `${room.room_type || "Room"} · ${building.name || "Hotel"}`;
    document.title = `${roomTitle} | RoomDhundo`;
    const nameEl = document.getElementById("propertyName");
    if (nameEl) nameEl.textContent = room.room_type || "Room";
    const locEl = document.getElementById("propertyLocation");
    if (locEl) locEl.textContent = building.name ? `${building.name} · ${building.location || ""}`.trim() : (building.location || "Location not listed");

    const nightly = Number(room.daily_price || 0);
    const hourly = Number(room.hourly_price || room.room_details?.hourly?.pricePerHour || 0);
    const priceText = nightly > 0
        ? `₹${nightly.toLocaleString("en-IN")}`
        : (hourly > 0 ? `₹${hourly.toLocaleString("en-IN")}` : "—");
    const unit = nightly > 0 ? "/ night" : (hourly > 0 ? "/ hour" : "");
    const priceEl = document.getElementById("propertyPrice");
    const unitEl = document.getElementById("propertyPriceUnit");
    const sidePrice = document.getElementById("sidebarPropertyPrice");
    const sideUnit = sidePrice?.nextElementSibling;
    if (priceEl) priceEl.textContent = priceText;
    if (unitEl) unitEl.textContent = unit;
    if (sidePrice) sidePrice.textContent = priceText;
    if (sideUnit && sideUnit.tagName === "SPAN") sideUnit.textContent = unit || "/ night";

    const canBook = isRoomAvailable(room);
    const availEl = document.getElementById("propertyAvailability");
    if (availEl) {
        availEl.textContent = canBook
            ? `${Number(room.available_rooms)} ${Number(room.available_rooms) === 1 ? "room" : "rooms"} available`
            : "Currently unavailable";
    }

    const details = room.room_details && typeof room.room_details === "object" ? room.room_details : {};
    const descEl = document.getElementById("propertyDescription");
    if (descEl) {
        const roomDesc = String(details.description || "").trim();
        descEl.textContent = roomDesc || building.description || "";
    }

    const roomTypesList = document.getElementById("roomTypesList");
    const roomSection = roomTypesList?.closest(".property-section");
    if (roomSection) {
        const heading = roomSection.querySelector("h2");
        if (heading) heading.textContent = "This room";
    }
    if (roomTypesList) {
        const beds = Array.isArray(details.beds) ? details.beds : [];
        const amenities = Array.isArray(details.amenities) ? details.amenities : [];
        roomTypesList.innerHTML = `
            <div class="room-type-card">
                <div class="room-type-card-header">
                    <h3>${escapePropertyHtml(room.room_type || "Room")}</h3>
                </div>
                <div class="room-type-details">
                    <span>${Number(room.max_guests || room.room_people || 2)} guests</span>
                    <span>${canBook ? `🟢 ${Number(room.available_rooms)} available` : "🔴 Currently unavailable"}</span>
                    ${beds.length ? `<span>Beds: ${escapePropertyHtml(beds.join(", "))}</span>` : ""}
                    ${amenities.length ? `<span>${escapePropertyHtml(amenities.join(" · "))}</span>` : ""}
                </div>
            </div>`;
    }

    if (typeof window.initHotelStay === "function") window.initHotelStay(building);
}

function setupHotelPropertyPage(building) {
    if (!isHotelListing(building)) return;
    if (getHotelRoomFromUrl(building)) return;

    const page = document.querySelector(".property-page");
    if (!page || document.getElementById("hotelStayRoot")) return;

    document.body.classList.add("is-hotel-page");

    const images = Array.isArray(building.images)
        ? building.images.filter((src) => typeof src === "string" && src.trim())
        : [];
    const stars = hotelStarCount(building);
    const price = hotelNightlyPrice(building);
    const priceText = price != null ? `₹${Number(price).toLocaleString("en-IN")}` : "—";
    const rating = building.avgRating ? String(building.avgRating) : "New";
    const reviews = Number(building.reviewCount || 0);
    const times = hotelCheckTimes(building);
    const stay = hotelStayWindow();
    const breakfast = hotelHasBreakfast(building);
    const facilities = hotelPopularFacilities(building, 6);
    const photo = images[0]
        ? `<img id="hotelHeroImage" src="${escapePropertyHtml(images[0])}" alt="${escapePropertyHtml(building.name)}">`
        : `<div class="image-placeholder">Hotel photo</div>`;
    const starBadge = stars ? `${stars} Star` : "Hotel";

    const root = document.createElement("div");
    root.id = "hotelStayRoot";
    root.className = "hotel-stay";
    root.innerHTML = `
        <div class="hotel-stay-toolbar">
            <button type="button" class="hotel-back-link page-back-btn" id="hotelHeroBack" aria-label="Go to the previous page" title="Go to the previous page"><span aria-hidden="true">←</span></button>
            <button type="button" class="hotel-share-link" id="hotelHeroShare">Share</button>
        </div>
        <div class="hotel-stay-top">
            <div class="hotel-hero">
                ${photo}
                <div class="hotel-package-badges">
                    <span>Hotel</span>
                    <span>${escapePropertyHtml(starBadge)}</span>
                </div>
                <span class="hotel-photo-count" id="hotelPhotoCount">${images.length} photo${images.length === 1 ? "" : "s"}</span>
            </div>
            <div class="hotel-stay-summary">
                <h1>${escapePropertyHtml(building.name)} ${hotelStarsHtml(stars)}</h1>
                <div class="hotel-package-rating">
                    <strong>${escapePropertyHtml(rating)}</strong>
                    <span class="hotel-rating-dots" aria-hidden="true"></span>
                    <span>${reviews.toLocaleString("en-IN")} reviews</span>
                </div>
                <div class="hotel-check-row">
                    <div>
                        <span>Check-in</span>
                        <strong>${escapePropertyHtml(stay.checkInLabel)}</strong>
                        <small>from ${escapePropertyHtml(times.checkInTime)}</small>
                    </div>
                    <div class="hotel-check-nights">${stay.nights} night${stay.nights === 1 ? "" : "s"}</div>
                    <div>
                        <span>Check-out</span>
                        <strong>${escapePropertyHtml(stay.checkOutLabel)}</strong>
                        <small>until ${escapePropertyHtml(times.checkOutTime)}</small>
                    </div>
                </div>
                <div class="hotel-stay-links">
                    <button type="button" id="hotelViewDetails">View details</button>
                    <button type="button" id="hotelViewMap">View map</button>
                </div>
            </div>
        </div>
        <section class="hotel-rooms-block">
            <h2>Select room and board type</h2>
            <div class="hotel-board-pills" id="hotelBoardMount"></div>
            <div id="hotelStayRooms"></div>
        </section>
        <div class="hotel-sheet" id="hotelSheet" hidden>
            <div class="hotel-sheet-panel">
                <div class="hotel-sheet-head">
                    <strong>${escapePropertyHtml(building.name)}</strong>
                    <button type="button" id="hotelSheetClose" aria-label="Close">×</button>
                </div>
                <div class="hotel-sheet-tabs" role="tablist">
                    <button type="button" class="is-active" data-hotel-tab="overview">Overview</button>
                    <button type="button" data-hotel-tab="facilities">Facilities</button>
                    <button type="button" data-hotel-tab="reviews">Reviews</button>
                    <button type="button" data-hotel-tab="location">Location</button>
                </div>
                <div class="hotel-sheet-body">
                    <div class="hotel-tab-panel is-active" data-hotel-panel="overview">
                        <h3>Check-in and check-out</h3>
                        <p>${escapePropertyHtml(times.checkIn)}</p>
                        <p>${escapePropertyHtml(times.checkOut)}</p>
                        <h3>About this property</h3>
                        <p id="hotelSheetDescription"></p>
                    </div>
                    <div class="hotel-tab-panel" data-hotel-panel="facilities">
                        <h3>Facilities</h3>
                        <ul class="hotel-facility-list">
                            ${facilities.length
                                ? facilities.map((item) => `<li>${escapePropertyHtml(item)}</li>`).join("")
                                : "<li>No facilities listed yet.</li>"}
                        </ul>
                    </div>
                    <div class="hotel-tab-panel" data-hotel-panel="reviews" id="hotelSheetReviews"></div>
                    <div class="hotel-tab-panel" data-hotel-panel="location">
                        <p id="hotelSheetLocation"></p>
                        <div id="hotelSheetMapMount"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="hotel-sticky-bar">
            <div>
                <strong>${priceText}</strong>
                <span>/ night</span>
            </div>
            <button type="button" id="hotelStickyBook">Book now</button>
        </div>
    `;

    page.prepend(root);

    const desc = document.getElementById("propertyDescription");
    const sheetDesc = document.getElementById("hotelSheetDescription");
    if (sheetDesc) sheetDesc.textContent = desc?.textContent || building.description || "";

    const reviewsBox = document.getElementById("reviewsContainer");
    const writeReview = document.querySelector(".write-review-box");
    const sheetReviews = document.getElementById("hotelSheetReviews");
    if (sheetReviews) {
        if (reviewsBox) sheetReviews.appendChild(reviewsBox);
        if (writeReview) sheetReviews.appendChild(writeReview);
    }

    const locEl = document.getElementById("hotelSheetLocation");
    if (locEl) locEl.textContent = building.location || "Location not listed";

    const mapEl = document.getElementById("roomdhundoMap");
    const mapMount = document.getElementById("hotelSheetMapMount");
    if (mapEl && mapMount) mapMount.appendChild(mapEl);

    const sheet = document.getElementById("hotelSheet");
    const openSheet = (tab) => {
        sheet.hidden = false;
        sheet.querySelectorAll("[data-hotel-tab]").forEach((btn) => {
            btn.classList.toggle("is-active", btn.dataset.hotelTab === tab);
        });
        sheet.querySelectorAll("[data-hotel-panel]").forEach((panel) => {
            panel.classList.toggle("is-active", panel.dataset.hotelPanel === tab);
        });
        if (tab === "location" && mapEl) {
            mapEl.style.display = "block";
            mapEl.style.height = "280px";
        }
    };

    document.getElementById("hotelViewDetails")?.addEventListener("click", () => openSheet("overview"));
    document.getElementById("hotelViewMap")?.addEventListener("click", () => openSheet("location"));
    document.getElementById("hotelSheetClose")?.addEventListener("click", () => {
        sheet.hidden = true;
    });
    sheet.querySelectorAll("[data-hotel-tab]").forEach((btn) => {
        btn.addEventListener("click", () => openSheet(btn.dataset.hotelTab));
    });

    document.getElementById("hotelHeroBack")?.addEventListener("click", goToPreviousPage);
    document.getElementById("hotelHeroShare")?.addEventListener("click", async () => {
        const shareData = { title: building.name, url: window.location.href };
        try {
            if (navigator.share) await navigator.share(shareData);
            else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Link copied.");
            }
        } catch (error) {
            if (error?.name !== "AbortError") alert("Could not share this hotel.");
        }
    });
    document.getElementById("hotelStickyBook")?.addEventListener("click", () => {
        document.getElementById("hotelStayRooms")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    let photoIndex = 0;
    const heroImg = document.getElementById("hotelHeroImage");
    const photoCount = document.getElementById("hotelPhotoCount");
    const showPhoto = (index) => {
        if (!heroImg || images.length === 0) return;
        photoIndex = (index + images.length) % images.length;
        heroImg.src = images[photoIndex];
        if (photoCount) photoCount.textContent = `${images.length} photo${images.length === 1 ? "" : "s"}`;
    };
    heroImg?.addEventListener("click", () => showPhoto(photoIndex + 1));

    document.dispatchEvent(new CustomEvent("roomdhundo:hotel-page", { detail: { building } }));
    if (typeof window.initHotelStay === "function") window.initHotelStay(building);
}

async function initPropertyPage() {
    const buildingId = new URLSearchParams(window.location.search).get("id");
    const building = buildingId ? await fetchBuildingById(buildingId) : null;
   
  

    if (!building) {
        const main = document.querySelector(".property-page");
        if (main) main.innerHTML = `<p style="padding:60px 20px;text-align:center;">Property not found. <a href="search.html">Back to search</a></p>`;
        return;
    }

    document.querySelector(".breadcrumb a")?.addEventListener("click", goToPreviousPage);
    const hotelRoom = getHotelRoomFromUrl(building);

    const propertyVideosSection = document.getElementById("propertyVideosSection");
    const propertyVideos = document.getElementById("propertyVideos");
    const videos = Array.isArray(building.videos) ? building.videos : [];

    if (propertyVideosSection && propertyVideos) {
        if (videos.length > 0) {
            propertyVideosSection.style.display = "block";
            propertyVideos.innerHTML =
                videos.map(videoUrl => `
                <div class="property-video-card">
                    <video controls preload="metadata" playsinline>
                        <source src="${videoUrl}" type="video/mp4">
                        Your browser does not support video playback.
                    </video>
                </div>
            `).join("");
        } else {
            propertyVideosSection.style.display = "none";
            propertyVideos.innerHTML = "";
        }
    }

    const priceLabel = (building.room_types || []).length > 1 ? "From ₹" : "₹";
    const priceValue = building.minPrice != null ? Number(building.minPrice).toLocaleString("en-IN") : "—";

    document.getElementById("propertyPrice").textContent = `${priceLabel}${priceValue}`;
    document.getElementById("sidebarPropertyPrice").textContent = `${priceLabel}${priceValue}`;
    document.getElementById("propertyAvailability").textContent =
        building.totalAvailable === 0
            ? "Currently occupied"
            : (building.room_types || []).length > 1
                ? `${building.totalAvailable} rooms available across ${building.room_types.length} room types`
                : (building.room_types[0]?.availability || "Room available");
    document.getElementById("propertyName").textContent = building.name;
    document.title = `${building.name} | RoomDhundo`;
    document.getElementById("propertyLocation").textContent = building.location || "Location not listed";
    document.getElementById("propertyRating").textContent = building.avgRating || "New";
    document.getElementById("propertyReviews").textContent = building.reviewCount;
    document.getElementById("propertyDescription").textContent = building.description || "";

    const enquiryRoomType =
    document.getElementById(
        "enquiryRoomType"
    );

if (enquiryRoomType) {

    enquiryRoomType.innerHTML = `
        <option value="">
            Select a room type
        </option>
    `;

    (building.room_types || []).forEach(rt => {
        const occupancy = occupancyOptionsFromRoom(rt);
        if (occupancy.length) {
            occupancy.forEach((option) => {
                const el = document.createElement("option");
                const peopleLabel = option.people === 1 ? "Single" : `${option.people} sharing`;
                el.value = `${rt.room_type || "Room"} · ${peopleLabel}`;
                el.textContent = `${rt.room_type || "Room"} · ${peopleLabel} · ₹${Number(option.rent).toLocaleString("en-IN")}/month`;
                enquiryRoomType.appendChild(el);
            });
            return;
        }

        const option = document.createElement("option");
        option.value = rt.room_type || "";
        option.textContent = rt.room_type || "Room";
        enquiryRoomType.appendChild(option);
    });

}

 const roomTypesList = document.getElementById("roomTypesList");
roomTypesList.innerHTML = "";

if (!hotelRoom) (building.room_types || []).forEach(rt => {

    const card = document.createElement("div");
    card.classList.add("room-type-card");

    const occupancy = occupancyOptionsFromRoom(rt);
    const monthlyPrices = occupancy.length ? occupancy.map((option) => option.rent) : [Number(rt.price_value)];
    const fromPrice = monthlyPrices.filter((price) => Number.isFinite(price)).sort((a, b) => a - b)[0];
    const nightlyPrices = occupancy.map((option) => option.nightly).filter((price) => Number.isFinite(price) && price > 0);
    const nightlyAvailable = nightlyPrices.length > 0 || (rt.daily_price != null && Number(rt.daily_price) > 0);
    const nightlyValue = nightlyPrices.length ? Math.min(...nightlyPrices) : rt.daily_price;

    const nightlyHtml = nightlyAvailable
        ? `
            <div class="room-type-price">
                ₹${Number(nightlyValue).toLocaleString("en-IN")}
                <span>/ night</span>
            </div>
        `
        : "";

    const isAvailable = isRoomAvailable(rt);
    const occupancyHtml = occupancy.length
        ? `<ul class="room-occupancy-list">${occupancy.map((option) => `
            <li>
                <span>${option.people === 1 ? "Single occupancy" : `${option.people} sharing`}</span>
                <strong>₹${Number(option.rent).toLocaleString("en-IN")} / month${option.nightly ? ` · ₹${Number(option.nightly).toLocaleString("en-IN")} / night` : ""}</strong>
            </li>`).join("")}</ul>`
        : "";

    const roomImages = Array.isArray(rt.images) ? rt.images.filter(Boolean) : [];
    const roomImagesHtml = roomImages.length
        ? `<div class="room-type-gallery">${roomImages.map(url => `
            <a href="${url}" target="_blank" rel="noopener">
                <img src="${url}" alt="${escapePropertyHtml(rt.room_type)} photo" loading="lazy">
            </a>`).join("")}</div>`
        : "";

    card.innerHTML = `
        ${roomImagesHtml}
        <div class="room-type-card-header">

            <h3>${rt.room_type}</h3>

            <div class="room-type-price">
                ${occupancy.length > 1 ? "From " : ""}₹${Number(fromPrice || 0).toLocaleString("en-IN")}
                <span>/ month</span>
            </div>

            ${nightlyHtml}

        </div>

        <div class="room-type-details">

            <span>
                ${occupancy.length
                    ? occupancy.map((option) => (option.people === 1 ? "Single" : `${option.people} sharing`)).join(" or ")
                    : `${rt.room_people} ${rt.room_people === 1 ? "person" : "people"} sharing`}
            </span>

            <span>
                ${isAvailable
                    ? `🟢 ${rt.available_rooms} ${rt.available_rooms === 1 ? "room" : "rooms"} available`
                    : "🔴 Currently unavailable"
                }
            </span>

        </div>
        ${occupancyHtml}
    `;

    roomTypesList.appendChild(card);
});

    const facilityGrid = document.getElementById("facilityGrid");
    if (facilityGrid) {
        facilityGrid.innerHTML = "";
        const facilityLabels = getBuildingFacilityLabels(building);
        if (facilityLabels.length === 0) {
            const empty = document.createElement("p");
            empty.className = "facility-empty";
            empty.textContent = "No facilities listed for this property.";
            facilityGrid.appendChild(empty);
        } else {
            facilityLabels.forEach((label) => {
                const el = document.createElement("div");
                el.textContent = label;
                facilityGrid.appendChild(el);
            });
        }
    }

    document.getElementById("propertyLocationDetails").textContent = building.location || "Location not listed";
    const distanceEl = document.getElementById("propertyDistance");
    if (distanceEl) distanceEl.remove();

    // --------------------------------------------------------
    // MAP: show the listing's location, plus the visitor's own
    // location when we already have it saved.
    // --------------------------------------------------------
    const roomdhundoMapEl = document.getElementById("roomdhundoMap");
    if (roomdhundoMapEl) {
        roomdhundoMapEl.style.display = "none";
    }

    const reviewsContainer = document.getElementById("reviewsContainer");
    reviewsContainer.innerHTML = "";
    if ((building.reviews || []).length === 0) {
        reviewsContainer.innerHTML = `<p style="color:#888;">No reviews yet. Be the first to stay and leave one!</p>`;
    } else {
        building.reviews.forEach(review => {
            const card = document.createElement("div");
            card.classList.add("review-card");
            card.innerHTML = `
                <h3>${review.reviewer_name}</h3>
                <div>⭐ ${review.rating}/5</div>
                <p>${review.comment || ""}</p>
            `;
            reviewsContainer.appendChild(card);
        });
    }

    const propertyRules = document.getElementById("propertyRules");
    propertyRules.innerHTML = "";
    visibleListingRules(building.rules).forEach(rule => {
        const li = document.createElement("li");
        li.textContent = rule;
        propertyRules.appendChild(li);
    });

    const ownerCard = document.getElementById("ownerCard");
    ownerCard.innerHTML = `
        <div class="owner-card-header">
            <span class="owner-icon">👤</span>
            <div>
                <span class="owner-label">PROPERTY OWNER</span>
                <h3>${building.owner_name}</h3>
            </div>
        </div>
        <div class="owner-details">
            <div class="owner-detail">
                <span class="detail-icon">✓</span>
                <span>${building.owner_verified ? "Verified Owner" : "Owner"}</span>
            </div>
            <div class="owner-detail">
                <span class="detail-icon">📅</span>
                <span>Member since ${building.owner_member_since || "—"}</span>
            </div>
        </div>
        <button class="view-owner-profile-btn" id="viewOwnerProfileBtn">
            View Owner Profile <span>→</span>
        </button>
    `;

    const viewOwnerProfileBtn = document.getElementById("viewOwnerProfileBtn");
    const ownerModal = document.getElementById("ownerModal");
    viewOwnerProfileBtn?.addEventListener("click", () => {
        const modalOwnerName = document.getElementById("modalOwnerName");
        const modalOwnerRating = document.getElementById("modalOwnerRating");
        const modalMemberSince = document.getElementById("modalMemberSince");

        if (modalOwnerName) modalOwnerName.textContent = building.owner_name;
        if (modalOwnerRating) modalOwnerRating.textContent = building.owner_verified ? "✓ Verified Owner" : "New";
        if (modalMemberSince) modalMemberSince.textContent = `Member since ${building.owner_member_since || "—"}`;

        if (ownerModal) ownerModal.style.display = "flex";
    });

    const closeOwnerModal = document.getElementById("closeOwnerModal");
    closeOwnerModal?.addEventListener("click", () => { if (ownerModal) ownerModal.style.display = "none"; });
    ownerModal?.addEventListener("click", (e) => { if (e.target === ownerModal) ownerModal.style.display = "none"; });

    const contactOwnerBtn = document.getElementById("contactOwnerBtn");
    const contactPanel = document.getElementById("contactPanel");
    const closeContactBtn = document.getElementById("closeContactBtn");
    const submitEnquiryBtn = document.getElementById("submitEnquiryBtn");
   const renterPhone =
    document.getElementById("renterPhone");

const enquirySuccess =
    document.getElementById("enquirySuccess");

const contactPropertyName =
    document.getElementById("contactPropertyName");


    const ROOMDHUNDO_PHONE = "6295456503";
    const ROOMDHUNDO_WHATSAPP = "93829 91409";

    document.getElementById("callRoomDhundoBtn")?.addEventListener("click", () => {
        window.location.href = `tel:${ROOMDHUNDO_PHONE}`;
    });

    document.getElementById("whatsappRoomDhundoBtn")?.addEventListener("click", () => {
        const propertyName = building?.name || building?.property_name || "this property";
        const message = `Hello RoomDhundo, I am interested in ${propertyName}. I would like to connect with the property owner.`;
        const whatsappUrl = `https://wa.me/91${ROOMDHUNDO_WHATSAPP}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    });

    contactOwnerBtn?.addEventListener("click", async () => {
        const user = await getSignedInUser();

        if (!user) {
            alert("Please log in or create an account before contacting the owner.");
            return;
        }

        if (contactPropertyName) {
            contactPropertyName.textContent = building.name || "Selected Property";
        }

        if (renterPhone) {
            renterPhone.value = "";
        }

        if (enquiryRoomType) {
    enquiryRoomType.value = "";
}

        if (enquirySuccess) {
            enquirySuccess.style.display = "none";
        }

        if (submitEnquiryBtn) {
            submitEnquiryBtn.style.display = "block";
            submitEnquiryBtn.disabled = false;
            submitEnquiryBtn.textContent = "📩 Request Owner Connection";
        }

        if (contactPanel) {
            contactPanel.classList.add("is-open");
            contactPanel.style.display = "block";
            contactOwnerBtn?.setAttribute("aria-expanded", "true");
            contactPanel.scrollIntoView({ block: "nearest" });
        }
    });

    closeContactBtn?.addEventListener("click", () => {
        if (contactPanel) {
            contactPanel.classList.remove("is-open");
            contactPanel.style.display = "none";
            contactOwnerBtn?.setAttribute("aria-expanded", "false");
        }
    });

    submitEnquiryBtn?.addEventListener("click", async () => {
        const user = await getSignedInUser();

        if (!user) {
            alert("Please log in before submitting an enquiry.");
            return;
        }

        const phone = renterPhone?.value.trim();

        if (!phone) {
            alert("Please enter your phone number.");
            renterPhone?.focus();
            return;
        }

        const selectedRoomType =
    enquiryRoomType?.value.trim() || "";

if (!selectedRoomType) {

    alert(
        "Please select the room type you are interested in."
    );

    enquiryRoomType?.focus();

    return;
}

        if (!/^[6-9]\d{9}$/.test(phone)) {
            alert("Please enter a valid 10-digit Indian mobile number.");
            renterPhone?.focus();
            return;
        }

        submitEnquiryBtn.disabled = true;
        submitEnquiryBtn.textContent = "Submitting...";

        try {
            const { error: enquiryError } =
    await supabaseClient
        .from("enquiries")
        .insert({
    user_id: user.id,
    owner_id: building.created_by,
    property_id: building.id,
    room_type: selectedRoomType,
    renter_phone: phone,
    message: "I am interested in your room.",
    status: "pending"
});

            if (enquiryError) {
                console.error("Enquiry error:", enquiryError);
                alert("Unable to submit your enquiry. Please try again.");
                submitEnquiryBtn.disabled = false;
                submitEnquiryBtn.textContent = "📩 Request Owner Connection";
                return;
            }

            submitEnquiryBtn.style.display = "none";

            if (enquirySuccess) {
                enquirySuccess.style.display = "block";
            }
        } catch (error) {
            console.error("Unexpected enquiry error:", error);
            alert("Something went wrong. Please try again.");
            submitEnquiryBtn.disabled = false;
            submitEnquiryBtn.textContent = "📩 Request Owner Connection";
        }
    });

    /*
    document.getElementById("directionsBtn")?.addEventListener("click", () => {
        const lat = Number(building.latitude);
        const lng = Number(building.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            alert("Property location is not available.");
            return;
        }

        const visitorLocation =
            typeof getCurrentUserLocation === "function"
                ? getCurrentUserLocation()
                : null;

        if (typeof openDirections === "function") {
            openDirections(
                lat,
                lng,
                visitorLocation?.latitude,
                visitorLocation?.longitude
            );
            return;
        }

        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
            "_blank",
            "noopener,noreferrer"
        );
    });
    */

    const mainPropertyImage = document.getElementById("mainPropertyImage");
    const smallPropertyImages = document.getElementById("smallPropertyImages");
    const galleryPrev = document.getElementById("galleryPrev");
    const galleryNext = document.getElementById("galleryNext");

    const gallerySource = hotelRoom && Array.isArray(hotelRoom.images) && hotelRoom.images.length
        ? hotelRoom.images
        : building.images;
    const galleryImages = Array.isArray(gallerySource)
        ? gallerySource.filter(src => typeof src === "string" && src.trim() !== "")
        : [];

    let currentImageIndex = 0;
    let galleryThumbnails = [];

    function showGalleryImage(index) {
        if (galleryImages.length === 0) return;

        currentImageIndex = (index + galleryImages.length) % galleryImages.length;

        if (mainPropertyImage) {
            mainPropertyImage.src = galleryImages[currentImageIndex];
            mainPropertyImage.alt = `${hotelRoom?.room_type || building.name || "Property"} Image ${currentImageIndex + 1}`;
        }

        galleryThumbnails.forEach((thumb, i) => {
            thumb.classList.toggle("active", i === currentImageIndex);
        });
    }

    if (galleryImages.length === 0) {
        if (mainPropertyImage) {
            mainPropertyImage.removeAttribute("src");
            mainPropertyImage.alt = "No property image available";
            mainPropertyImage.style.display = "none";
        }

        if (smallPropertyImages) {
            smallPropertyImages.innerHTML = `
            <div class="no-property-image">
                🏠 No property images available
            </div>
        `;
        }

        if (galleryPrev) galleryPrev.style.display = "none";
        if (galleryNext) galleryNext.style.display = "none";
    } else {
        if (smallPropertyImages) {
            if (galleryImages.length > 1) {
                smallPropertyImages.innerHTML = galleryImages
                    .map((src, i) => `
                    <div class="gallery-thumbnail ${i === 0 ? "active" : ""}" data-index="${i}">
                        <img src="${src}" alt="Property Image ${i + 1}" loading="lazy">
                    </div>
                `)
                    .join("");
            } else {
                smallPropertyImages.innerHTML = "";
            }

            galleryThumbnails = smallPropertyImages.querySelectorAll(".gallery-thumbnail");
        }

        galleryThumbnails.forEach((thumb, index) => {
            thumb.addEventListener("click", () => {
                showGalleryImage(index);
            });
        });

        galleryPrev?.addEventListener("click", () => {
            showGalleryImage(currentImageIndex - 1);
        });

        galleryNext?.addEventListener("click", () => {
            showGalleryImage(currentImageIndex + 1);
        });

        if (galleryImages.length <= 1) {
            if (galleryPrev) galleryPrev.style.display = "none";
            if (galleryNext) galleryNext.style.display = "none";
        } else {
            if (galleryPrev) galleryPrev.style.display = "flex";
            if (galleryNext) galleryNext.style.display = "flex";
        }

        showGalleryImage(0);
    }

    const photoViewer = document.getElementById("photoViewer");
    const photoViewerImage = document.getElementById("photoViewerImage");
    const photoViewerClose = document.getElementById("photoViewerClose");
    const photoViewerPrev = document.getElementById("photoViewerPrev");
    const photoViewerNext = document.getElementById("photoViewerNext");

    mainPropertyImage?.addEventListener("click", () => {
        if (galleryImages.length === 0) return;
        if (photoViewerImage) {
            photoViewerImage.src = galleryImages[currentImageIndex];
        }
        if (photoViewer) {
            photoViewer.style.display = "flex";
        }
    });

    photoViewerClose?.addEventListener("click", () => {
        if (photoViewer) {
            photoViewer.style.display = "none";
        }
    });

    photoViewerPrev?.addEventListener("click", () => {
        if (galleryImages.length === 0) return;
        showGalleryImage(currentImageIndex - 1);
        if (photoViewerImage) {
            photoViewerImage.src = galleryImages[currentImageIndex];
        }
    });

    photoViewerNext?.addEventListener("click", () => {
        if (galleryImages.length === 0) return;
        showGalleryImage(currentImageIndex + 1);
        if (photoViewerImage) {
            photoViewerImage.src = galleryImages[currentImageIndex];
        }
    });

    photoViewer?.addEventListener("click", (e) => {
        if (e.target === photoViewer) {
            photoViewer.style.display = "none";
        }
    });

    photoViewerImage?.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    const savePropertyBtn = document.getElementById("savePropertyBtn");
    if (savePropertyBtn) {
        const currentUser = await getCurrentUser();
        const savedIds = await getSavedBuildingIds(currentUser ? currentUser.id : null);
        if (savedIds.includes(building.id)) {
            savePropertyBtn.classList.add("saved");
            savePropertyBtn.innerHTML = "♥ Saved";
        }

        savePropertyBtn.addEventListener("click", async () => {
            const nowSaved = await toggleSavedBuilding(building.id);
            if (nowSaved === null) return;
            savePropertyBtn.classList.toggle("saved", nowSaved);
            savePropertyBtn.innerHTML = nowSaved ? "♥ Saved" : "♡ Save";
        });
    }

    wireReviewForm(building.id);
    if (hotelRoom) setupHotelRoomDetailPage(building, hotelRoom);
    else setupHotelPropertyPage(building);
}

function wireReviewForm(buildingId) {
    const stars = document.querySelectorAll("#starRatingInput .star");
    const reviewComment = document.getElementById("reviewComment");
    const submitReviewBtn = document.getElementById("submitReviewBtn");
    if (!submitReviewBtn) return;

    let selectedRating = 0;

    function paintStars(upTo) {
        stars.forEach(s => s.classList.toggle("selected", Number(s.dataset.value) <= upTo));
    }

    stars.forEach(star => {
        star.addEventListener("click", () => {
            selectedRating = Number(star.dataset.value);
            paintStars(selectedRating);
        });
        star.addEventListener("mouseenter", () => {
            stars.forEach(s => s.classList.toggle("hovered", Number(s.dataset.value) <= Number(star.dataset.value)));
        });
        star.addEventListener("mouseleave", () => {
            stars.forEach(s => s.classList.remove("hovered"));
        });
    });

    submitReviewBtn.addEventListener("click", async () => {
        const user = await getCurrentUser();
        if (!user) {
            alert("Please log in to leave a review.");
            openAuthModal();
            return;
        }
        if (selectedRating === 0) {
            alert("Please select a star rating first.");
            return;
        }

        const comment = reviewComment.value.trim();
        const reviewerName = (user.user_metadata && user.user_metadata.full_name)
            ? user.user_metadata.full_name
            : user.email.split("@")[0];

        submitReviewBtn.disabled = true;
        submitReviewBtn.textContent = "Submitting…";

        const { error } = await supabaseClient.from("reviews").insert({
            building_id: buildingId,
            user_id: user.id,
            reviewer_name: reviewerName,
            rating: selectedRating,
            comment
        });

        submitReviewBtn.disabled = false;
        submitReviewBtn.textContent = "Submit Review";

        if (error) {
            alert(`Couldn't submit review: ${error.message}`);
            return;
        }

        alert("Thanks for your review!");
        reviewComment.value = "";
        selectedRating = 0;
        paintStars(0);
        initPropertyPage();
    });
}

async function initSavedPage() {
    const savedPropertiesContainer = document.getElementById("savedPropertiesContainer");
    const emptySaved = document.getElementById("emptySaved");
    const user = await getCurrentUser();

    if (!user) {
        emptySaved.querySelector("h2").textContent = "Log in to see your saved properties";
        emptySaved.querySelector("p").textContent = "Your saved list is tied to your account.";
        emptySaved.style.display = "block";
        savedPropertiesContainer.style.display = "none";
        return;
    }

    const { data, error } = await supabaseClient
        .from("saved_buildings")
        .select("building_id, buildings(*, room_types(*), reviews(*))")
        .eq("user_id", user.id);

    if (error) {
        console.error("Error loading saved properties:", error);
        return;
    }

    const items = data.map(row => attachComputedFields(row.buildings)).filter(Boolean);

    if (items.length === 0) {
        emptySaved.style.display = "block";
        savedPropertiesContainer.style.display = "none";
        return;
    }

    emptySaved.style.display = "none";
    savedPropertiesContainer.style.display = "grid";
    savedPropertiesContainer.innerHTML = items.map(item => {
        const priceLabel = (item.room_types || []).length > 1 ? "From ₹" : "₹";
        const priceValue = item.minPrice != null ? Number(item.minPrice).toLocaleString("en-IN") : "—";
        return `
        <div class="saved-property-card" data-id="${item.id}">
            <a class="property-image-link" href="property.html?id=${item.id}" aria-label="View ${item.name}">
            <div class="saved-property-image">
                <img src="${(item.images && item.images[0]) || 'images/krishna-pg-1.webp'}" alt="${item.name}">
            </div>
            </a>
            <div class="saved-property-info">
                <h2>${item.name}</h2>
                <p class="saved-location">📍 ${item.location || "Location not listed"}</p>
                <div class="saved-rating">${item.avgRating ? `⭐ ${item.avgRating} rating` : "🆕 New listing"}</div>
                <div class="saved-price">
                    <strong>${priceLabel}${priceValue}</strong>
                    <span>/ month</span>
                </div>
                <div class="saved-property-actions">
                    <a href="property.html?id=${item.id}" class="view-saved-btn">View Details</a>
                    <button class="remove-saved-btn" data-id="${item.id}">Remove</button>
                </div>
            </div>
        </div>
        `;
    }).join("");

    document.querySelectorAll(".remove-saved-btn").forEach(button => {
        button.addEventListener("click", async () => {
            await supabaseClient
                .from("saved_buildings")
                .delete()
                .eq("user_id", user.id)
                .eq("building_id", button.dataset.id);
            initSavedPage();
        });
    });

    bindListPropertyOpeners(savedPropertiesContainer);
    restoreListScrollState();
}

async function uploadPropertyImages(files, userId) {
    const uploadedUrls = [];
    const maxSizeBytes = 5 * 1024 * 1024;

    for (let i = 0; i < files.length && i < 5; i++) {
        const file = files[i];

        if (file.size > maxSizeBytes) {
            console.warn(`Skipping ${file.name} — over 5MB.`);
            continue;
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const path = `${userId}/${Date.now()}-${i}-${safeName}`;

        const { error: uploadError } = await supabaseClient
            .storage
            .from("property-images")
            .upload(path, file);

        if (uploadError) {
            console.error(`Error uploading ${file.name}:`, uploadError);
            continue;
        }

        const { data: publicUrlData } = supabaseClient
            .storage
            .from("property-images")
            .getPublicUrl(path);

        if (publicUrlData?.publicUrl) {
            uploadedUrls.push(publicUrlData.publicUrl);
        }
    }

    return uploadedUrls;
}

async function uploadPropertyMedia(files, userId) {
    const images = [];
    const videos = [];
    const maxImageSize = 5 * 1024 * 1024;
    const maxVideoSize = 50 * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
            console.warn("Unsupported file:", file.name);
            continue;
        }

        if (isImage && file.size > maxImageSize) {
            alert(`${file.name} is larger than 5MB.`);
            continue;
        }

        if (isVideo && file.size > maxVideoSize) {
            alert(`${file.name} is larger than 50MB.`);
            continue;
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${userId}/${Date.now()}-${i}-${safeName}`;

        const { error: uploadError } = await supabaseClient
            .storage
            .from("property-images")
            .upload(path, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
        }

        const { data: publicUrlData } = supabaseClient
            .storage
            .from("property-images")
            .getPublicUrl(path);

        const publicUrl = publicUrlData?.publicUrl;
        if (!publicUrl) continue;

        if (isImage) images.push(publicUrl);
        if (isVideo) videos.push(publicUrl);
    }

    return { images, videos };
}

let listPropertyEditMode = false;
let listPropertyEditId = null;
let listPropertyExistingImages = [];
let listPropertyExistingVideos = [];

function escapePropertyHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* ============================================================
   SEPARATE LISTING FORMS
   list-pg.html, list-hotel.html and list-flat.html each have their
   own form. The page sets the hidden #lpType field (PG / Hotel / Flat).
   ============================================================ */
const LISTING_FORM_PAGES = {
    PG: "list-pg.html",
    Hotel: "list-hotel.html",
    Flat: "list-flat.html"
};

function getListingFormPageForType(type) {
    return LISTING_FORM_PAGES[type] || LISTING_FORM_PAGES.PG;
}

function formatTime12h(value) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ""));
    if (!match) return "";
    let hours = Number(match[1]);
    const suffix = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${match[2]} ${suffix}`;
}
window.formatTime12h = formatTime12h;

function parseTime12h(text) {
    const match = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(String(text || ""));
    if (!match) return "";
    let hours = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hours += 12;
    return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

/* ============================================================
   PER-ROOM IMAGES (hotel form)
   Each room block keeps its own saved photos (block._roomExistingImages)
   and newly picked files (block._roomNewFiles).
   ============================================================ */
const MAX_ROOM_IMAGES = 5;
const MAX_ROOM_IMAGE_SIZE = 5 * 1024 * 1024;

function wireRoomImages(block, roomData) {
    const input = block.querySelector(".rtImages");
    const addBtn = block.querySelector(".rtAddImageBtn");
    const previews = block.querySelector(".rtImagePreviews");
    if (!input || !addBtn || !previews) return;

    block._roomExistingImages = Array.isArray(roomData?.images)
        ? roomData.images.filter(Boolean)
        : [];
    block._roomNewFiles = [];

    function render() {
        previews.innerHTML = "";

        block._roomExistingImages.forEach((url, index) => {
            previews.appendChild(makeThumb(url, () => {
                block._roomExistingImages.splice(index, 1);
                render();
            }));
        });

        block._roomNewFiles.forEach((file, index) => {
            const url = URL.createObjectURL(file);
            previews.appendChild(makeThumb(url, () => {
                URL.revokeObjectURL(url);
                block._roomNewFiles.splice(index, 1);
                render();
            }));
        });

        const total = block._roomExistingImages.length + block._roomNewFiles.length;
        addBtn.disabled = total >= MAX_ROOM_IMAGES;
        addBtn.textContent = total >= MAX_ROOM_IMAGES
            ? "Maximum photos added"
            : total > 0 ? "+ Add Another Image" : "+ Add Image";
    }

    function makeThumb(src, onRemove) {
        const wrap = document.createElement("div");
        wrap.className = "rt-image-thumb";
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Room photo";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.title = "Remove photo";
        remove.textContent = "×";
        remove.addEventListener("click", onRemove);
        wrap.append(img, remove);
        return wrap;
    }

    addBtn.addEventListener("click", () => input.click());

    input.addEventListener("change", () => {
        const picked = Array.from(input.files || []);
        input.value = "";

        for (const file of picked) {
            const total = block._roomExistingImages.length + block._roomNewFiles.length;
            if (total >= MAX_ROOM_IMAGES) {
                alert(`You can add up to ${MAX_ROOM_IMAGES} photos per room.`);
                break;
            }
            if (!file.type.startsWith("image/")) {
                alert(`${file.name} is not an image.`);
                continue;
            }
            if (file.size > MAX_ROOM_IMAGE_SIZE) {
                alert(`${file.name} is larger than 5MB.`);
                continue;
            }
            block._roomNewFiles.push(file);
        }
        render();
    });

    render();
}

function collectHourlyStayOptions(block) {
    const enabled = !!block.querySelector(".rtOfferHourly")?.checked;
    const pricePerHour = Number(block.querySelector(".rtHourlyRent")?.value);
    const hours = Array.from(block.querySelectorAll(".rtHourSlot:checked"))
        .map((input) => Number(input.value))
        .filter((value) => Number.isFinite(value) && value > 0)
        .sort((a, b) => a - b);
    return {
        enabled,
        pricePerHour: Number.isFinite(pricePerHour) && pricePerHour > 0 ? pricePerHour : 0,
        hours
    };
}

function wireHourlyStayOptions(block) {
    const toggle = block.querySelector(".rtOfferHourly");
    const fields = block.querySelector(".rt-hourly-fields");
    const priceInput = block.querySelector(".rtHourlyRent");
    const preview = block.querySelector(".rtHourlyPreview");
    if (!toggle || !fields) return;

    function refresh() {
        fields.hidden = !toggle.checked;
        if (priceInput) priceInput.disabled = !toggle.checked;
        const offer = collectHourlyStayOptions(block);
        if (!preview) return;
        if (!toggle.checked) {
            preview.textContent = "";
            return;
        }
        if (!offer.pricePerHour || !offer.hours.length) {
            preview.textContent = "Select hour slots and enter a price per hour.";
            return;
        }
        preview.textContent = offer.hours
            .map((hours) => `${hours} hrs = ₹${(offer.pricePerHour * hours).toLocaleString("en-IN")}`)
            .join(" · ");
    }

    toggle.addEventListener("change", refresh);
    priceInput?.addEventListener("input", refresh);
    block.querySelectorAll(".rtHourSlot").forEach((input) => input.addEventListener("change", refresh));
    refresh();
}

function addRoomTypeBlock(roomData = null) {
    const container = document.getElementById("roomTypesContainer");
    const template = document.getElementById("roomTypeTemplate");
    if (!container || !template) return;

    const clone = template.content.cloneNode(true);
    const block = clone.querySelector(".room-type-block");
    if (!block) return;

    if (roomData?.id) {
        block.dataset.roomId = roomData.id;
    }

    const roomTypeSelect = block.querySelector(".rtRoomType");
    const rentInput = block.querySelector(".rtRent");
    const nightlyRentInput = block.querySelector(".rtNightlyRent");
    const offerNightly = block.querySelector(".rtOfferNightly");
    const peopleInput = block.querySelector(".rtPeople");
    const availableInput = block.querySelector(".rtAvailable");

    function syncNightlyOffer() {
        const enabled = !!(offerNightly && offerNightly.checked);
        const group = block.querySelector(".rtNightlyGroup");
        if (group) group.hidden = !enabled;
        if (nightlyRentInput) {
            nightlyRentInput.disabled = !enabled;
            if (!enabled) {
                nightlyRentInput.removeAttribute("required");
            }
        }
    }

    if (roomData) {
        if (roomTypeSelect) roomTypeSelect.value = roomData.room_type || "";
        const roomName = block.querySelector(".rtRoomName");
        if (roomName) roomName.value = roomData.room_type || "";
        if (rentInput) rentInput.value = roomData.price_value ?? roomData.room_rent ?? "";
        const hasNightly = roomData.daily_price != null && Number(roomData.daily_price) > 0;
        if (offerNightly) offerNightly.checked = hasNightly || block.dataset.alwaysNightly === "true";
        if (nightlyRentInput && (hasNightly || roomData.daily_price)) {
            nightlyRentInput.value = roomData.daily_price;
        }
        if (peopleInput) peopleInput.value = roomData.room_people ?? 1;
        if (availableInput) {
            availableInput.value = roomData.available_rooms ?? 0;
            availableInput.min = "0";
        }
        const details = roomData.room_details && typeof roomData.room_details === "object" ? roomData.room_details : {};
        const setVal = (cls, value) => {
            const el = block.querySelector(cls);
            if (el && value != null && value !== "") el.value = value;
        };
        setVal(".rtDescription", details.description || roomData.description);
        setVal(".rtSize", roomData.room_size);
        setVal(".rtAdults", roomData.adults);
        setVal(".rtChildren", roomData.children);
        setVal(".rtHourlyRent", details.hourly?.pricePerHour ?? roomData.hourly_price);
        const offerHourly = block.querySelector(".rtOfferHourly");
        const hourlyEnabled = details.hourly?.enabled === true
            || Number(details.hourly?.pricePerHour || roomData.hourly_price) > 0;
        if (offerHourly) offerHourly.checked = hourlyEnabled;
        const hourValues = Array.isArray(details.hourly?.hours) && details.hourly.hours.length
            ? details.hourly.hours.map(String)
            : ["3", "6"];
        block.querySelectorAll(".rtHourSlot").forEach((input) => {
            input.checked = hourValues.includes(input.value);
        });
        setVal(".rtWeekendPrice", roomData.weekend_price);
        setVal(".rtExtraPerson", roomData.extra_person_charge);
        setVal(".rtTotalRooms", roomData.total_rooms || roomData.available_rooms);
        setVal(".rtStatus", roomData.availability);
        setVal(".rtTax", details.tax);
        const markChecked = (cls, values) => {
            const wanted = new Set((values || []).map(String));
            block.querySelectorAll(cls).forEach((input) => {
                input.checked = wanted.has(input.value);
            });
        };
        markChecked(".rtBed", details.beds);
        markChecked(".rtAmenity", details.amenities);
        const title = block.querySelector(".rt-title");
        if (title && roomData.room_type) title.textContent = roomData.room_type;
    } else {
        if (peopleInput) peopleInput.value = "1";
        if (availableInput) {
            availableInput.value = "1";
            availableInput.min = "1";
        }
    }

    wireRoomImages(block, roomData);
    wireHourlyStayOptions(block);

    // Hotel rooms are always priced per night
    if (block.dataset.alwaysNightly === "true" && offerNightly) {
        offerNightly.checked = true;
    }

    offerNightly?.addEventListener("change", syncNightlyOffer);
    syncNightlyOffer();

    const flexibleToggle = block.querySelector(".rtFlexibleOccupancy");
    const occupancyGroup = block.querySelector(".rtOccupancyGroup");
    const occupancyRows = block.querySelector(".rt-occupancy-rows");
    const simplePricing = block.querySelector(".rtSimplePricing");

    function occupancyRowEl(people = "2", rent = "", nightly = "") {
        const row = document.createElement("div");
        row.className = "rt-occupancy-row";
        row.innerHTML = `
            <div class="form-group">
                <label>Sharing for</label>
                <select class="rtOccPeople">
                    <option value="1">1 person (single)</option>
                    <option value="2">2 sharing</option>
                    <option value="3">3 sharing</option>
                    <option value="4">4 sharing</option>
                    <option value="5">5 sharing</option>
                </select>
            </div>
            <div class="form-group">
                <label>Monthly rent (₹)</label>
                <input type="number" class="rtOccRent" min="1" placeholder="e.g. 3000" required>
            </div>
            <div class="form-group">
                <label>Per night (optional)</label>
                <input type="number" class="rtOccNightly" min="0" placeholder="optional">
            </div>
            <button type="button" class="rtRemoveOccupancy" title="Remove this sharing price">&times;</button>
        `;
        row.querySelector(".rtOccPeople").value = String(people);
        if (rent !== "" && rent != null) row.querySelector(".rtOccRent").value = rent;
        if (nightly !== "" && nightly != null) row.querySelector(".rtOccNightly").value = nightly;
        row.querySelector(".rtRemoveOccupancy").addEventListener("click", () => {
            const rows = occupancyRows.querySelectorAll(".rt-occupancy-row");
            if (rows.length <= 2) {
                alert("Keep at least two sharing prices, or turn off “same room, different sharing prices”.");
                return;
            }
            row.remove();
        });
        return row;
    }

    function syncFlexibleOccupancy() {
        const on = !!(flexibleToggle && flexibleToggle.checked);
        if (occupancyGroup) occupancyGroup.hidden = !on;
        if (simplePricing) simplePricing.hidden = on;
        if (rentInput) {
            rentInput.required = !on;
            rentInput.disabled = on;
        }
        if (peopleInput) {
            peopleInput.required = !on;
            peopleInput.disabled = on;
        }
        occupancyRows?.querySelectorAll(".rtOccRent").forEach((input) => {
            input.required = on;
        });
        if (on && occupancyRows && occupancyRows.children.length === 0) {
            occupancyRows.append(occupancyRowEl("2"), occupancyRowEl("3"));
        }
        if (on && roomTypeSelect && (!roomTypeSelect.value || roomTypeSelect.value === "Double Sharing" || roomTypeSelect.value === "Triple Sharing")) {
            const flexOption = Array.from(roomTypeSelect.options).find((option) => option.value === "Flexible Sharing");
            if (flexOption) roomTypeSelect.value = "Flexible Sharing";
        }
    }

    if (flexibleToggle && occupancyRows) {
        const existingOccupancy = occupancyOptionsFromRoom(roomData || {});
        if (existingOccupancy.length >= 2) {
            flexibleToggle.checked = true;
            occupancyRows.innerHTML = "";
            existingOccupancy.forEach((option) => {
                occupancyRows.append(occupancyRowEl(option.people, option.rent, option.nightly || ""));
            });
        }
        flexibleToggle.addEventListener("change", syncFlexibleOccupancy);
        roomTypeSelect?.addEventListener("change", () => {
            if (roomTypeSelect.value === "Flexible Sharing" && !flexibleToggle.checked) {
                flexibleToggle.checked = true;
                syncFlexibleOccupancy();
            }
        });
        block.querySelector(".rtAddOccupancy")?.addEventListener("click", () => {
            const used = new Set(Array.from(occupancyRows.querySelectorAll(".rtOccPeople")).map((el) => el.value));
            const next = ["2", "3", "4", "1", "5"].find((value) => !used.has(value)) || "4";
            occupancyRows.append(occupancyRowEl(next));
            syncFlexibleOccupancy();
        });
        syncFlexibleOccupancy();
    }

    block.querySelector(".remove-room-type-btn")?.addEventListener("click", () => {
        const allBlocks = container.querySelectorAll(".room-type-block");
        if (allBlocks.length <= 1) {
            alert("You need at least one room type.");
            return;
        }
        block.remove();
    });

    container.appendChild(clone);
    if (typeof syncFlatOfferLabels === "function") syncFlatOfferLabels();
}

function renderExistingPropertyMedia() {
    const fileInput = document.getElementById("lpImages");
    if (!fileInput) return;

    let preview = document.getElementById("existingPropertyMediaPreview");

    if (!preview) {
        preview = document.createElement("div");
        preview.id = "existingPropertyMediaPreview";
        preview.style.marginTop = "12px";
        preview.style.display = "flex";
        preview.style.flexDirection = "column";
        preview.style.gap = "10px";
        fileInput.parentNode?.appendChild(preview);
    }

    preview.innerHTML = "";

    const totalImages = listPropertyExistingImages.length;
    const totalVideos = listPropertyExistingVideos.length;

    if (!listPropertyEditMode || (totalImages === 0 && totalVideos === 0)) {
        return;
    }

    const heading = document.createElement("div");
    heading.style.fontWeight = "600";
    heading.style.fontSize = "13px";
    heading.textContent = `Existing media (${totalImages} photos, ${totalVideos} videos)`;
    preview.appendChild(heading);

    listPropertyExistingImages.forEach((url, index) => {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.gap = "10px";
        item.style.padding = "8px";
        item.style.border = "1px solid #e5e7eb";
        item.style.borderRadius = "8px";

        const image = document.createElement("img");
        image.src = url;
        image.alt = `Property photo ${index + 1}`;
        image.style.width = "70px";
        image.style.height = "55px";
        image.style.objectFit = "cover";
        image.style.borderRadius = "6px";

        const label = document.createElement("span");
        label.textContent = `Photo ${index + 1}`;
        label.style.flex = "1";
        label.style.fontSize = "13px";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.style.border = "1px solid #fecaca";
        removeButton.style.background = "#fef2f2";
        removeButton.style.color = "#dc2626";
        removeButton.style.padding = "6px 10px";
        removeButton.style.borderRadius = "6px";
        removeButton.style.cursor = "pointer";

        removeButton.addEventListener("click", () => {
            listPropertyExistingImages = listPropertyExistingImages.filter((_, i) => i !== index);
            renderExistingPropertyMedia();
        });

        item.appendChild(image);
        item.appendChild(label);
        item.appendChild(removeButton);
        preview.appendChild(item);
    });

    listPropertyExistingVideos.forEach((url, index) => {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.gap = "10px";
        item.style.padding = "8px";
        item.style.border = "1px solid #e5e7eb";
        item.style.borderRadius = "8px";

        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        video.preload = "metadata";
        video.style.width = "100px";
        video.style.height = "60px";
        video.style.objectFit = "cover";
        video.style.borderRadius = "6px";

        const label = document.createElement("span");
        label.textContent = `Video ${index + 1}`;
        label.style.flex = "1";
        label.style.fontSize = "13px";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.style.border = "1px solid #fecaca";
        removeButton.style.background = "#fef2f2";
        removeButton.style.color = "#dc2626";
        removeButton.style.padding = "6px 10px";
        removeButton.style.borderRadius = "6px";
        removeButton.style.cursor = "pointer";

        removeButton.addEventListener("click", () => {
            listPropertyExistingVideos = listPropertyExistingVideos.filter((_, i) => i !== index);
            renderExistingPropertyMedia();
        });

        item.appendChild(video);
        item.appendChild(label);
        item.appendChild(removeButton);
        preview.appendChild(item);
    });
}

async function loadPropertyForEdit(buildingId, user) {
    const { data: property, error } = await supabaseClient
        .from("buildings")
        .select(`*, room_types(*)`)
        .eq("id", buildingId)
        .eq("created_by", user.id)
        .single();

    if (error || !property) {
        console.error("Edit property loading error:", error);
        alert("Unable to load this property. Please try again.");
        window.location.href = "owner-dashboard.html";
        return false;
    }

    const pageType = document.getElementById("lpType")?.value || "";
    if (pageType && property.type && property.type !== pageType) {
        window.location.replace(
            `${getListingFormPageForType(property.type)}?edit=${encodeURIComponent(property.id)}`
        );
        return false;
    }

    listPropertyEditMode = true;
    listPropertyEditId = property.id;

    const pageTitle = document.querySelector(".list-property-header h1");
    const pageSubtitle = document.querySelector(".list-property-header p");
    if (pageTitle) pageTitle.textContent = "Edit Your Property";
    if (pageSubtitle) {
        pageSubtitle.textContent = "Update only the information you want to change. Your existing information will remain unchanged.";
    }

    const submitButton = document.querySelector(".lp-submit-btn");
    if (submitButton) submitButton.textContent = "Update Property";

    document.getElementById("lpName").value = property.name || "";
    document.getElementById("lpLocation").value = property.location || "";
    if (!document.getElementById("lpType").value) {
        document.getElementById("lpType").value = property.type || "";
    }
    document.getElementById("lpDescription").value = property.description || "";
    const savedRules = visibleListingRules(property.rules);
    const checkInInput = document.getElementById("lpCheckIn");
    const checkOutInput = document.getElementById("lpCheckOut");
    const plainRules = savedRules.filter(rule => {
        if (checkInInput && /^check-in:/i.test(rule)) {
            checkInInput.value = parseTime12h(rule);
            return false;
        }
        if (checkOutInput && /^check-out:/i.test(rule)) {
            checkOutInput.value = parseTime12h(rule);
            return false;
        }
        return true;
    });
    if (document.getElementById("lpRules")) {
        document.getElementById("lpRules").value = plainRules.join("\n");
    }
    const flatOfferSale = document.querySelector('input[name="lpFlatOffer"][value="sale"]');
    const flatOfferRent = document.querySelector('input[name="lpFlatOffer"][value="rent"]');
    if (flatOfferSale && flatOfferRent) {
        const sale = isFlatForSale(property);
        flatOfferSale.checked = sale;
        flatOfferRent.checked = !sale;
        syncFlatOfferLabels();
    }

    document.getElementById("lpOwnerName").value = property.owner_name || "";
    document.getElementById("lpOwnerPhone").value = property.owner_phone || "";
    document.getElementById("lpOwnerAltPhone").value = property.owner_alt_phone || "";

    const savedFacilityTags = Array.isArray(property.facility_tags) ? property.facility_tags : [];
    const savedFacilities = Array.isArray(property.facilities) ? property.facilities : [];

    document.querySelectorAll(".lpFacility").forEach(checkbox => {
        const value = checkbox.value;
        const label = checkbox.dataset.label;

        checkbox.checked =
            savedFacilityTags.includes(value) ||
            savedFacilities.includes(label) ||
            (
                value === COUPLE_FRIENDLY_TAG &&
                (
                    savedFacilityTags.some(isCoupleFriendlyFacility) ||
                    savedFacilities.some(isCoupleFriendlyFacility)
                )
            );
    });

    restoreCustomFacilities(savedFacilityTags, savedFacilities);

    listPropertyExistingImages = Array.isArray(property.images) ? property.images.filter(Boolean) : [];
    listPropertyExistingVideos = Array.isArray(property.videos) ? property.videos.filter(Boolean) : [];
    renderExistingPropertyMedia();

    const roomContainer = document.getElementById("roomTypesContainer");
    if (roomContainer) {
        roomContainer.innerHTML = "";
        const roomTypes = Array.isArray(property.room_types) ? property.room_types : [];
        if (roomTypes.length > 0) {
            roomTypes.forEach(room => addRoomTypeBlock(room));
        } else if (!document.getElementById("hotelListingWizard") && !document.getElementById("flatListingWizard")) {
            addRoomTypeBlock();
        }
    }

    if (typeof window.hydrateHotelListing === "function") {
        window.hydrateHotelListing(property);
    }
    if (typeof window.hydrateFlatListing === "function") {
        window.hydrateFlatListing(property);
    }

    return true;
}

function cloneSupabasePayload(payload) {
    if (Array.isArray(payload)) return payload.map((row) => ({ ...row }));
    return { ...payload };
}

function unknownColumnFromError(message) {
    const text = String(message || "");
    return text.match(/Could not find the '([^']+)' column/i)?.[1]
        || text.match(/'([^']+)' column of/i)?.[1]
        || text.match(/column "([^"]+)"/i)?.[1]
        || null;
}

function stripUnknownColumn(payload, column) {
    if (Array.isArray(payload)) {
        return payload.map((row) => {
            const next = { ...row };
            delete next[column];
            return next;
        });
    }
    const next = { ...payload };
    delete next[column];
    return next;
}

async function supabaseMutateWithoutUnknownColumns(table, mode, payload, applyFilters) {
    let body = cloneSupabasePayload(payload);
    for (let attempt = 0; attempt < 16; attempt++) {
        let query = supabaseClient.from(table)[mode](body);
        if (typeof applyFilters === "function") query = applyFilters(query);
        const result = await (mode === "insert" && !Array.isArray(body)
            ? query.select().single()
            : query.select());
        if (!result.error) return result;
        const column = unknownColumnFromError(result.error.message);
        const sample = Array.isArray(body) ? body[0] || {} : body;
        if (column && Object.prototype.hasOwnProperty.call(sample, column)) {
            body = stripUnknownColumn(body, column);
            continue;
        }
        return result;
    }
    return { error: new Error("Could not save because of unknown database columns.") };
}

function syncFlatOfferLabels() {
    const offer = document.querySelector('input[name="lpFlatOffer"]:checked')?.value === "sale" ? "sale" : "rent";
    document.querySelectorAll(".rtRent").forEach((input) => {
        const label = input.closest(".form-group")?.querySelector("label");
        if (label && /rent|sale price/i.test(label.textContent)) {
            label.textContent = offer === "sale" ? "Sale Price (₹)" : "Monthly Rent (₹)";
        }
        if (offer === "sale") input.placeholder = "e.g. 3500000";
        else if (input.placeholder.includes("3500000") || input.placeholder.includes("12000")) {
            input.placeholder = "e.g. 12000";
        }
    });
}

function wireFlatOfferType() {
    const radios = document.querySelectorAll('input[name="lpFlatOffer"]');
    if (!radios.length) return;
    radios.forEach((radio) => radio.addEventListener("change", syncFlatOfferLabels));
    syncFlatOfferLabels();
}

function goToPreviousPage(event) {
    event?.preventDefault();
    try {
        if (document.referrer) {
            const url = new URL(document.referrer);
            const samePage = url.href.split("#")[0] === location.href.split("#")[0];
            if (url.origin === location.origin && !samePage) {
                if (window.history.length > 1) {
                    window.history.back();
                    return;
                }
                window.location.href = url.href;
                return;
            }
        }
    } catch (error) {
        console.error("Back navigation error:", error);
    }
    if (window.history.length > 1) {
        window.history.back();
    }
}

function wireSiteBackButton() {
    const page = getCurrentPageName();
    if (["", "index.html"].includes(page)) return;

    document.querySelectorAll(".breadcrumb a, .dashboard-back-home, .back-home-btn, #hotelHeroBack").forEach((el) => {
        if (el.dataset.siteBackWired === "true") return;
        el.dataset.siteBackWired = "true";
        el.addEventListener("click", goToPreviousPage);
    });
}

function wireListPropertyForm() {
    const listPropertyForm = document.getElementById("listPropertyForm");
    if (!listPropertyForm) return;

    wireCustomFacilities();
    wireFlatOfferType();

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("edit");

    const initializeForm = async () => {
        const allowed = await restrictListPropertyPageForRenters();
        if (!allowed) return;

        const user = await getSignedInUser();
        if (!user) return;

        if (editId) {
            const loaded = await loadPropertyForEdit(editId, user);
            if (!loaded) return;
        } else {
            listPropertyEditMode = false;
            listPropertyEditId = null;
            listPropertyExistingImages = [];
            listPropertyExistingVideos = [];

            const roomContainer = document.getElementById("roomTypesContainer");
            if (
                roomContainer
                && roomContainer.children.length === 0
                && !document.getElementById("hotelListingWizard")
                && !document.getElementById("flatListingWizard")
            ) {
                addRoomTypeBlock();
            }
            window.dispatchEvent(new Event("hotel-listing:loaded"));
        }
    };

    initializeForm();
    window.addEventListener("roomdhundo:auth-changed", () => {
        initializeForm();
    });

    document.getElementById("addRoomTypeBtn")?.addEventListener("click", () => {
        addRoomTypeBlock();
    });

    listPropertyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const user = await getSignedInUser();
        if (!user) {
            alert("Please log in first — listings are tied to your account.");
            openAuthModal();
            return;
        }

        const access = await canCurrentUserListProperty();
        if (!access.ok) {
            showOwnerOnlyModal();
            return;
        }

        const isHotelWizard = !!document.getElementById("hotelListingWizard");
        const isFlatWizard = !!document.getElementById("flatListingWizard");
        if (isHotelWizard && typeof window.syncHotelListingHiddenFields === "function") {
            window.syncHotelListingHiddenFields();
        }
        if (isFlatWizard && typeof window.syncFlatListingHiddenFields === "function") {
            window.syncFlatListingHiddenFields();
        }
        if (isHotelWizard && typeof window.validateHotelListing === "function" && !window.validateHotelListing()) {
            return;
        }
        if (isFlatWizard && typeof window.validateFlatListing === "function" && !window.validateFlatListing()) {
            return;
        }

        const name = document.getElementById("lpName").value.trim();
        const location = document.getElementById("lpLocation").value.trim();
        const type = document.getElementById("lpType").value;
        const description = document.getElementById("lpDescription").value.trim();
        const rulesRaw = document.getElementById("lpRules").value.trim();
        const ownerName = document.getElementById("lpOwnerName").value.trim();
        const ownerPhone = document.getElementById("lpOwnerPhone").value.trim();
        const ownerAltPhone = document.getElementById("lpOwnerAltPhone").value.trim();

        if (!name) {
            alert("Please enter the property name.");
            return;
        }

        if (!location) {
            alert("Please enter the property location.");
            return;
        }

        if (!type) {
            alert("Please select a property type.");
            return;
        }

        if (!ownerName) {
            alert("Please enter the owner/business name.");
            return;
        }

        if (ownerPhone && !/^[6-9]\d{9}$/.test(ownerPhone)) {
            alert("Please enter a valid 10-digit owner phone number.");
            return;
        }

        if (ownerAltPhone && !/^[6-9]\d{9}$/.test(ownerAltPhone)) {
            alert("Please enter a valid alternative phone number.");
            return;
        }

        const facilityCheckboxes = Array.from(document.querySelectorAll(".lpFacility:checked"));
        const customFacilities = collectCustomFacilities();
        const facilityTags = [
            ...facilityCheckboxes.map(checkbox => checkbox.value),
            ...customFacilities.map(item => item.tag)
        ];
        const facilities = [
            ...facilityCheckboxes.map(checkbox => checkbox.dataset.label),
            ...customFacilities.map(item => item.label)
        ];
        const starValue = document.querySelector(".lpStar:checked")?.value;
        if (starValue) {
            facilityTags.push(`star-${starValue}`);
            facilities.push(`⭐ ${starValue} Star`);
        }

        if (String(type).toLowerCase() === "flat") {
            const offer = document.querySelector('input[name="lpFlatOffer"]:checked')?.value === "sale" ? "sale" : "rent";
            const cleanedTags = facilityTags.filter((tag) => tag !== FLAT_SALE_TAG && tag !== FLAT_RENT_TAG);
            const cleanedLabels = facilities.filter((label) => label !== "For Sale" && label !== "On Rent");
            cleanedTags.push(offer === "sale" ? FLAT_SALE_TAG : FLAT_RENT_TAG);
            cleanedLabels.push(offer === "sale" ? "For Sale" : "On Rent");
            facilityTags.length = 0;
            facilities.length = 0;
            facilityTags.push(...cleanedTags);
            facilities.push(...cleanedLabels);
        }

        const rules = rulesRaw
            ? rulesRaw.split("\n").map(rule => rule.trim()).filter(Boolean)
            : [];

        // Hotel form only: check-in / check-out times are saved as the first two rules
        const checkInValue = document.getElementById("lpCheckIn")?.value;
        const checkOutValue = document.getElementById("lpCheckOut")?.value;
        if (document.getElementById("lpCheckIn")) {
            if (!checkInValue || !checkOutValue) {
                alert("Please enter the hotel check-in and check-out times.");
                return;
            }
            if (!rules.some((rule) => /^check-in:/i.test(rule))) {
                rules.unshift(
                    `Check-in: ${formatTime12h(checkInValue)}`,
                    `Check-out: ${formatTime12h(checkOutValue)}`
                );
            }
        }

        const roomTypeBlocks = Array.from(document.querySelectorAll(".room-type-block"));
        if (roomTypeBlocks.length === 0) {
            alert("Please add at least one room type with a price per night.");
            return;
        }

        const roomTypeInputs = [];

        for (const block of roomTypeBlocks) {
            const flexible = !!block.querySelector(".rtFlexibleOccupancy")?.checked;
            let roomType = block.querySelector(".rtRoomType")?.value.trim();
            let rent = Number(block.querySelector(".rtRent")?.value);
            const offerNightly = block.querySelector(".rtOfferNightly")?.checked;
            const nightlyRaw = block.querySelector(".rtNightlyRent")?.value.trim();
            let people = Number(block.querySelector(".rtPeople")?.value);
            const available = Number(block.querySelector(".rtAvailable")?.value);
            let occupancyOptions = [];

            if (flexible) {
                occupancyOptions = Array.from(block.querySelectorAll(".rt-occupancy-row")).map((row) => ({
                    people: Number(row.querySelector(".rtOccPeople")?.value),
                    rent: Number(row.querySelector(".rtOccRent")?.value),
                    nightly: row.querySelector(".rtOccNightly")?.value === "" ? null : Number(row.querySelector(".rtOccNightly")?.value)
                }));
                const peopleSet = new Set(occupancyOptions.map((option) => option.people));
                if (occupancyOptions.length < 2) {
                    alert("Add at least two sharing prices for the same room, or turn off “same room, different sharing prices”.");
                    return;
                }
                if (peopleSet.size !== occupancyOptions.length) {
                    alert("Each sharing option on the same room must be a different occupancy (for example 2 sharing and 3 sharing).");
                    return;
                }
                if (occupancyOptions.some((option) => !Number.isFinite(option.people) || option.people < 1 || !Number.isFinite(option.rent) || option.rent <= 0)) {
                    alert("Enter a valid monthly rent for every sharing option on this room.");
                    return;
                }
                if (occupancyOptions.some((option) => option.nightly != null && (!Number.isFinite(option.nightly) || option.nightly < 0))) {
                    alert("Nightly prices on sharing options must be valid numbers, or left blank.");
                    return;
                }
                people = Math.max(...occupancyOptions.map((option) => option.people));
                rent = Math.min(...occupancyOptions.map((option) => option.rent));
                roomType = occupancyLabelFromOptions(occupancyOptions);
            }

            if (!roomType) {
                alert("Please select a room type for every room.");
                return;
            }


const isHotel = String(type).toLowerCase() === "hotel";

if (isHotel) {
    // Hotel rooms can have no monthly rent.
    // Their nightly price is validated separately below.
    if (!Number.isFinite(rent) || rent < 0) {
        alert("Please enter a valid monthly rent.");
        return;
    }
} else {
    if (!Number.isFinite(rent) || rent <= 0) {
        const saleFlat = String(type).toLowerCase() === "flat"
            && document.querySelector('input[name="lpFlatOffer"]:checked')?.value === "sale";
        alert(saleFlat
            ? "Please enter a valid sale price for every flat option."
            : "Please enter a valid monthly rent for every room type.");
        return;
    }
}


            let nightlyRent = null;
            if (flexible) {
                const occupancyNightly = occupancyOptions.map((option) => option.nightly).filter((price) => Number.isFinite(price) && price > 0);
                nightlyRent = occupancyNightly.length ? Math.min(...occupancyNightly) : null;
            } else if (offerNightly) {
                nightlyRent = Number(nightlyRaw);
                if (!Number.isFinite(nightlyRent) || nightlyRent <= 0) {
                    alert("Enter a valid price per night, or uncheck nightly stay.");
                    return;
                }
            }

            if (!Number.isFinite(people) || people < 1) {
                alert("People sharing must be at least 1.");
                return;
            }

            if (!Number.isFinite(available) || available < 0) {
                alert("Available rooms cannot be negative.");
                return;
            }

            const hourlyOffer = collectHourlyStayOptions(block);
            if (hourlyOffer.enabled && (!hourlyOffer.pricePerHour || hourlyOffer.hours.length === 0)) {
                alert(`Choose hour slots and a price per hour for "${roomType}", or turn off hourly stay.`);
                return;
            }

            let flatMeta = {};
            const flatMetaRaw = block.querySelector(".rtFlatMeta")?.value;
            if (flatMetaRaw) {
                try { flatMeta = JSON.parse(flatMetaRaw) || {}; } catch (error) { flatMeta = {}; }
            }

            roomTypeInputs.push({
                id: block.dataset.roomId || null,
                roomType,
                rent,
                nightlyRent,
                people,
                available,
                hourlyPrice: hourlyOffer.enabled ? hourlyOffer.pricePerHour : null,
                weekendPrice: block.querySelector(".rtWeekendPrice")?.value === "" ? null : Number(block.querySelector(".rtWeekendPrice")?.value),
                extraPerson: block.querySelector(".rtExtraPerson")?.value === "" ? null : Number(block.querySelector(".rtExtraPerson")?.value),
                totalRooms: Number(block.querySelector(".rtTotalRooms")?.value) || available,
                roomSize: block.querySelector(".rtSize")?.value === "" ? null : Number(block.querySelector(".rtSize")?.value),
                adults: block.querySelector(".rtAdults")?.value === "" ? null : Number(block.querySelector(".rtAdults")?.value),
                children: block.querySelector(".rtChildren")?.value === "" ? null : Number(block.querySelector(".rtChildren")?.value),
                status: block.querySelector(".rtStatus")?.value || (available > 0 ? "Available" : "Occupied"),
                details: {
                    description: block.querySelector(".rtDescription")?.value.trim() || "",
                    beds: Array.from(block.querySelectorAll(".rtBed:checked")).map((input) => input.value),
                    amenities: Array.from(block.querySelectorAll(".rtAmenity:checked")).map((input) => input.value),
                    tax: block.querySelector(".rtTax")?.value || "inclusive",
                    hourly: hourlyOffer,
                    occupancy_options: occupancyOptions,
                    ...flatMeta
                },
                hasImageField: !!block.querySelector(".rtImages"),
                existingImages: block._roomExistingImages || [],
                newImageFiles: block._roomNewFiles || []
            });
        }

        const submitButton = listPropertyForm.querySelector(".lp-submit-btn");
        const originalButtonText = submitButton ? submitButton.textContent : "";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = listPropertyEditMode
                ? "Updating property..."
                : "Uploading photos...";
        }

        try {
            const mediaInput = document.getElementById("lpImages");
            const hotelMedia = isHotelWizard && typeof window.collectHotelGalleryMedia === "function"
                ? window.collectHotelGalleryMedia()
                : null;
            const flatMedia = isFlatWizard && typeof window.collectFlatGalleryMedia === "function"
                ? window.collectFlatGalleryMedia()
                : null;
            const galleryMedia = hotelMedia || flatMedia;
            if (galleryMedia) listPropertyExistingImages = galleryMedia.existing;
            const newMediaFiles = galleryMedia
                ? galleryMedia.files
                : (mediaInput?.files ? Array.from(mediaInput.files) : []);
            let newImages = [];
            let newVideos = [];
            let hotelGalleryMap = galleryMedia?.categorized?.existing
                ? { ...galleryMedia.categorized.existing }
                : null;
            const imageCap = isHotelWizard || isFlatWizard ? 36 : 5;

            if (galleryMedia?.categorized) {
                if (submitButton) submitButton.textContent = isFlatWizard ? "Uploading flat photos..." : "Uploading hotel photos...";
                hotelGalleryMap = {};
                for (const [category, files] of Object.entries(galleryMedia.categorized.files || {})) {
                    const existing = galleryMedia.categorized.existing[category] || [];
                    let uploaded = [];
                    if (files.length) {
                        const result = await uploadPropertyMedia(files, user.id);
                        uploaded = result.images || [];
                    }
                    hotelGalleryMap[category] = [...existing, ...uploaded];
                    newImages.push(...uploaded);
                }
            } else if (newMediaFiles.length > 0) {
                const newImageCount = newMediaFiles.filter(file => file.type.startsWith("image/")).length;
                const remainingImageSlots = Math.max(0, imageCap - listPropertyExistingImages.length);

                if (newImageCount > remainingImageSlots) {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
                    }
                    alert(
                        `You can add only ${remainingImageSlots} more photo(s). Existing photos are already using ${listPropertyExistingImages.length} of ${imageCap} slots.`
                    );
                    return;
                }

                if (submitButton) {
                    submitButton.textContent = listPropertyEditMode
                        ? "Uploading new media..."
                        : "Uploading photos...";
                }

                const uploadedMedia = await uploadPropertyMedia(newMediaFiles, user.id);
                newImages = uploadedMedia.images || [];
                newVideos = uploadedMedia.videos || [];
            }

            // Upload each hotel room's own photos
            for (const room of roomTypeInputs) {
                if (!room.hasImageField) continue;
                let uploadedRoomImages = [];
                if (room.newImageFiles.length > 0) {
                    if (submitButton) submitButton.textContent = "Uploading room photos...";
                    const uploaded = await uploadPropertyMedia(room.newImageFiles, user.id);
                    uploadedRoomImages = uploaded.images || [];
                }
                room.images = [...room.existingImages, ...uploadedRoomImages].slice(0, MAX_ROOM_IMAGES);
            }

            const finalImages = (hotelGalleryMap
                ? Object.values(hotelGalleryMap).flat()
                : [...listPropertyExistingImages, ...newImages]).slice(0, imageCap);
            const finalVideos = [...listPropertyExistingVideos, ...newVideos];
            if (isFlatWizard && hotelGalleryMap && typeof window.applyFlatGalleryUploads === "function") {
                window.applyFlatGalleryUploads(hotelGalleryMap);
                if (typeof window.syncFlatListingHiddenFields === "function") {
                    window.syncFlatListingHiddenFields();
                    const refreshed = document.getElementById("lpRules")?.value.trim();
                    if (refreshed) {
                        rules.splice(0, rules.length, ...refreshed.split("\n").map((rule) => rule.trim()).filter(Boolean));
                    }
                }
            }
            const hotelMeta = isHotelWizard && typeof window.syncHotelListingHiddenFields === "function"
                ? { ...window.syncHotelListingHiddenFields(), gallery: hotelGalleryMap || {} }
                : null;
            const latitude = Number(document.getElementById("propertyLatitude")?.value);
            const longitude = Number(document.getElementById("propertyLongitude")?.value);
            const buildingCore = {
                name,
                location,
                distance_km: 0,
                type,
                description,
                rules,
                facilities,
                facility_tags: facilityTags,
                images: finalImages,
                videos: finalVideos,
                owner_name: ownerName,
                owner_phone: ownerPhone,
                owner_alt_phone: ownerAltPhone || null,
                owner_whatsapp: ownerPhone,
                owner_email: document.getElementById("lpOwnerEmail")?.value.trim() || null,
                website: document.getElementById("lpWebsite")?.value.trim() || null,
                latitude: Number.isFinite(latitude) ? latitude : null,
                longitude: Number.isFinite(longitude) ? longitude : null,
                hotel_meta: hotelMeta
            };

            function roomDbPayload(room, isNew) {
                const availability = room.status || (room.available > 0 ? (isNew ? "Just listed" : "Available") : "Occupied");
                return {
                    room_type: room.roomType,
                    price_value: Number.isFinite(room.rent) ? room.rent : 0,
                    daily_price: room.nightlyRent,
                    hourly_price: Number.isFinite(room.hourlyPrice) ? room.hourlyPrice : null,
                    weekend_price: Number.isFinite(room.weekendPrice) ? room.weekendPrice : null,
                    extra_person_charge: Number.isFinite(room.extraPerson) ? room.extraPerson : null,
                    room_rent: Number.isFinite(room.rent) ? room.rent : 0,
                    room_people: room.people,
                    available_rooms: room.available,
                    total_rooms: Number.isFinite(room.totalRooms) ? room.totalRooms : room.available,
                    room_size: Number.isFinite(room.roomSize) ? room.roomSize : null,
                    adults: Number.isFinite(room.adults) ? room.adults : null,
                    children: Number.isFinite(room.children) ? room.children : null,
                    availability,
                    room_details: room.details || {},
                    ...(room.hasImageField ? { images: room.images || [] } : {})
                };
            }

            if (listPropertyEditMode && listPropertyEditId) {
                if (submitButton) submitButton.textContent = "Updating property...";

                const { data: updatedBuilding, error: buildingError } =
                    await supabaseMutateWithoutUnknownColumns(
                        "buildings",
                        "update",
                        buildingCore,
                        (query) => query.eq("id", listPropertyEditId).eq("created_by", user.id)
                    );

                if (buildingError) throw new Error(buildingError.message);
                if (!updatedBuilding) throw new Error("The property could not be updated.");

                const { data: existingRoomRows, error: existingRoomsError } =
                    await supabaseClient
                        .from("room_types")
                        .select("id")
                        .eq("building_id", listPropertyEditId);

                if (existingRoomsError) throw new Error(existingRoomsError.message);

                const existingRoomIds = (existingRoomRows || []).map(room => String(room.id));
                const submittedExistingIds = roomTypeInputs.filter(room => room.id).map(room => String(room.id));
                const removedRoomIds = existingRoomIds.filter(id => !submittedExistingIds.includes(id));

                for (const removedId of removedRoomIds) {
                    const { error: deleteRoomError } =
                        await supabaseClient
                            .from("room_types")
                            .delete()
                            .eq("id", removedId)
                            .eq("building_id", listPropertyEditId);

                    if (deleteRoomError) {
                        throw new Error(`Could not remove a room type: ${deleteRoomError.message}`);
                    }
                }

                for (const room of roomTypeInputs) {
                    const roomPayload = roomDbPayload(room, false);

                    if (room.id) {
                        const { error: updateRoomError } =
                            await supabaseMutateWithoutUnknownColumns(
                                "room_types",
                                "update",
                                roomPayload,
                                (query) => query.eq("id", room.id).eq("building_id", listPropertyEditId)
                            );

                        if (updateRoomError) {
                            throw new Error(`Could not update room type: ${updateRoomError.message}`);
                        }
                    } else {
                        const { error: insertRoomError } =
                            await supabaseMutateWithoutUnknownColumns(
                                "room_types",
                                "insert",
                                { building_id: listPropertyEditId, ...roomPayload }
                            );

                        if (insertRoomError) {
                            throw new Error(`Could not add new room type: ${insertRoomError.message}`);
                        }
                    }
                }

                alert(`"${name}" has been updated successfully!`);
                window.location.href = "owner-dashboard.html";
                return;
            }

            if (submitButton) submitButton.textContent = "Listing your property...";

            const { data: newBuilding, error: buildingError } =
                await supabaseMutateWithoutUnknownColumns(
                    "buildings",
                    "insert",
                    {
                        ...buildingCore,
                        owner_verified: false,
                        owner_member_since: String(new Date().getFullYear()),
                        created_by: user.id,
                        listing_status: isFlatWizard ? "pending" : "published",
                        verification_status: isFlatWizard ? "pending" : "approved"
                    }
                );

            if (buildingError) throw new Error(buildingError.message);
            if (!newBuilding?.id) throw new Error("The hotel was not saved. Please try again.");

            const roomTypeRows = roomTypeInputs.map(room => ({
                building_id: newBuilding.id,
                ...roomDbPayload(room, true)
            }));

            const { error: roomTypesError } =
                await supabaseMutateWithoutUnknownColumns("room_types", "insert", roomTypeRows);

            if (roomTypesError) {
                throw new Error(`Your property was created, but there was an issue adding room types: ${roomTypesError.message}`);
            }

            if (isHotelWizard) {
                const viewBtn = document.getElementById("hlViewHotelBtn");
                if (viewBtn) viewBtn.href = `property.html?id=${encodeURIComponent(newBuilding.id)}`;
                const badge = document.getElementById("hlStatusBadge");
                if (badge) badge.textContent = "Listed";
                const success = document.getElementById("hlSuccess");
                if (success) {
                    const title = success.querySelector("h2");
                    const copy = success.querySelector("p");
                    if (title) title.textContent = "Hotel listed successfully";
                    if (copy) copy.textContent = "Your hotel is now visible to guests on RoomDhundo.";
                    success.classList.add("is-visible");
                    document.getElementById("listPropertyForm")?.setAttribute("hidden", "hidden");
                    document.getElementById("hlNav")?.setAttribute("hidden", "hidden");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    return;
                }
            }

            if (isFlatWizard) {
                const success = document.getElementById("flSuccess");
                if (success) {
                    const copy = success.querySelector("p");
                    if (copy) {
                        copy.textContent = "Your flat was submitted for admin review. It will not appear in search until RoomDhundo approves it.";
                    }
                    const badge = document.getElementById("flStatusBadge");
                    if (badge) badge.textContent = "Pending review";
                    success.classList.add("is-visible");
                    document.getElementById("listPropertyForm")?.setAttribute("hidden", "hidden");
                    document.getElementById("flNav")?.setAttribute("hidden", "hidden");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    return;
                }
            }

            alert(`"${name}" has been listed successfully!`);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Property save/update error:", error);
            const banner = document.getElementById("hlFormBanner") || document.getElementById("flFormBanner");
            if (banner) {
                banner.textContent = error.message || "Could not save this listing. Please try again.";
                banner.classList.add("is-visible");
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
            alert(`Something went wrong: ${error.message}`);

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText || (listPropertyEditMode ? "Update Property" : "List My Property");
            }
        }
    });
}

function wireResetPasswordForm() {
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    if (!resetPasswordForm) return;

    resetPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById("newPassword").value;
        const confirmNewPassword = document.getElementById("confirmNewPassword").value;

        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            alert("Passwords do not match.");
            return;
        }

        const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

        if (error) {
            alert(`Couldn't update password: ${error.message}\n\nThis link may have expired — go back and click "Forgot password?" again to get a new one.`);
            return;
        }

        alert("Password updated! You can now log in with your new password.");
        window.location.href = "index.html";
    });
}




document.addEventListener("DOMContentLoaded", async () => {
    window.addEventListener("pageshow", (event) => {
        if (event.persisted) restoreListScrollState();
    });

    wireMobileNav();
    wireThemeToggle();
    wireSiteBackButton();
    wireAuthUI();
    wireListPropertyAccess();
    wireHomeStayButtons();
    wireHeroSearch();
    wireListPropertyForm();
    wireResetPasswordForm();
    wireRoleChoice();
    wireChatbot();

    const oauthResult = await consumeOAuthRedirect();
    if (oauthResult?.redirecting) return;

    const currentUser = await getCurrentUserFast();
    await enforceAgentPendingGate(currentUser);
    updateNavForUser(currentUser);

        if (typeof initRenterDashboard === "function") {
        await initRenterDashboard();
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        updateNavForUser(session ? session.user : null);
        if (event === "INITIAL_SESSION") return;
        if (window.__oauthHandling) return;

        if (event === "SIGNED_IN") {
            const choseAgent = getSelectedAuthRole("loginForm") === "agent" || getSelectedAuthRole("signupForm") === "agent";
            if (choseAgent || hasAgentPendingLock()) {
                goToAgentApplication();
                return;
            }
            if (requireLoginToExplore(session?.user || null)) {
                closeAuthModal();
                hideGuestLoginPrompt();
                initExplorePages();
            }
            return;
        }

        if (event === "SIGNED_OUT") {
            explorePagesStarted = false;
            if (isExploreGatePage()) {
                requireLoginToExplore(null);
            }
        }
    });

    if (requireLoginToExplore(currentUser)) {
        await initExplorePages();
    }
    await showAgentListingBanner(currentUser);
});

async function enforceAgentPendingGate(user) {
    const page = getCurrentPageName();
    const allowed = ["be-an-agent.html", "login.html", "signup.html", "reset-password.html", "auth-callback.html", "policies.html"];
    if (allowed.includes(page)) return;
    if (!user?.id) {
        if (hasAgentPendingLock()) goToAgentApplication();
        return;
    }
    const role = await fetchProfileRole(user.id);
    if (role === "agent") {
        clearAgentPendingLock();
        return;
    }
    const agentState = await resolveAgentState(user, role);
    if (agentState === "approved") return;
    if (agentState === "pending" || agentState === "rejected" || hasAgentPendingLock()) {
        goToAgentApplication();
    }
}

async function showAgentListingBanner(user) {
    if (!user?.id) return;
    if (!["list-pg.html", "list-hotel.html", "list-flat.html", "list-property.html"].includes(getCurrentPageName())) return;
    const role = await fetchProfileRole(user.id);
    if (role !== "agent") return;
    const form = document.getElementById("listPropertyForm");
    if (!form || form.querySelector(".agent-list-banner")) return;
    const banner = document.createElement("div");
    banner.className = "agent-list-banner";
    banner.innerHTML = "<strong>Listing as an agent.</strong> Fill the owner name and phone with the actual property owner. You are registering this listing in your agent account.";
    form.prepend(banner);
    const ownerHeading = Array.from(form.querySelectorAll("h2, .lp-section-title")).find((el) => /owner contact/i.test(el.textContent || ""));
    if (ownerHeading) ownerHeading.textContent = "Property owner contact";
}

function openRoleChoice() {
    const modal = document.getElementById("roleChoiceModal");
    if (modal) modal.style.display = "flex";
}

function closeRoleChoice() {
    const modal = document.getElementById("roleChoiceModal");
    if (modal) modal.style.display = "none";
}

async function selectUserRole(role) {
    const user = await getCurrentUser();
    if (!user) {
        alert("Please log in first.");
        return;
    }

    const renterOption = document.getElementById("renterOption");
    const ownerOption = document.getElementById("ownerOption");
    const agentOption = document.getElementById("agentOption");
    if (renterOption) renterOption.disabled = true;
    if (ownerOption) ownerOption.disabled = true;
    if (agentOption) agentOption.disabled = true;

    const savedRole = role === "agent" ? "agent_pending" : role;
    const savedProfile = await upsertProfileSafe(user.id, { role: savedRole });
    if (savedProfile.error) {
        console.error("Role update error:", savedProfile.error);
        if (role !== "agent") {
            alert("We couldn't save your selection. Please try again.");
            if (renterOption) renterOption.disabled = false;
            if (ownerOption) ownerOption.disabled = false;
            if (agentOption) agentOption.disabled = false;
            return;
        }
    }
    if (role === "agent") {
        try {
            await supabaseClient.auth.updateUser({
                data: { role: "agent", agent_status: "pending" }
            });
        } catch (metaError) {
            console.error("Agent metadata error:", metaError);
        }
        goToAgentApplication();
        return;
    }

    localStorage.setItem("roomdhundo_role", role);

    if (role === "owner") {
        window.location.replace("owner-dashboard.html");
    } else {
        window.location.replace("index.html");
    }
}

function wireRoleChoice() {
    const renterOption = document.getElementById("renterOption");
    const ownerOption = document.getElementById("ownerOption");
    const closeButton = document.getElementById("closeRoleChoice");
    const modal = document.getElementById("roleChoiceModal");

    renterOption?.addEventListener("click", () => selectUserRole("user"));
    ownerOption?.addEventListener("click", () => selectUserRole("owner"));
    document.getElementById("agentOption")?.addEventListener("click", () => selectUserRole("agent"));
    closeButton?.addEventListener("click", () => closeRoleChoice());
    modal?.addEventListener("click", (event) => {
        if (event.target === modal) closeRoleChoice();
    });
}

function wireChatbot() {
    const toggle = document.getElementById("chatbotToggle");
    const chatbot = document.getElementById("chatbot");
    const closeBtn = document.getElementById("chatbotClose");
    const messages = document.getElementById("chatbotMessages");
    const options = document.getElementById("chatbotOptions");
    const input = document.getElementById("chatbotInput");
    const sendBtn = document.getElementById("chatbotSend");

    if (!toggle || !chatbot) return;

    const EMAIL = "roomdhundo18@gmail.com";
    const WHATSAPP_NUMBER = "9382991409";
    const WHATSAPP_MESSAGE = "Hello RoomDhundo, I need help with a query.";
    const WHATSAPP_URL =
        `https://wa.me/91${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    const EMAIL_URL =
        `mailto:${EMAIL}?subject=${encodeURIComponent("RoomDhundo enquiry")}&body=${encodeURIComponent("Hello RoomDhundo,\n\nI need help with a query.\n")}`;

    const FAQ_ITEMS = [
        {
            question: "How do I contact a property owner?",
            answer: "Open the property you are interested in and use the Contact Owner option. You can submit your enquiry with your phone number after logging in, and RoomDhundo will help connect you with the owner."
        },
        {
            question: "How do I list my property?",
            answer: "Click List Property from the navigation menu and log in to your account. Then enter your property details, room information, facilities, rent, photos, and other required information before submitting the listing."
        },
        {
            question: "Do I need an account?",
            answer: "You need to log in or create an account to explore properties, save listings, contact owners, and manage your enquiries."
        },
        {
            question: "How does RoomDhundo work?",
            answer: "RoomDhundo helps you discover accommodation such as PGs, rooms, messes, guest houses, hotels, and flats. Search by location and your requirements, compare available properties, view details, and contact the owner through RoomDhundo. A one-time 10% service fee applies to PG and flat bookings only, not hotels."
        },
        {
            question: "How can I report a problem?",
            answer: "You can contact the RoomDhundo team through WhatsApp or Email. Tell us about the issue and include the relevant property name or details so we can assist you properly."
        }
    ];

    function openChat() {
        chatbot.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close RoomDhundo Chat");
        input?.focus();
    }

    function closeChat() {
        chatbot.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open RoomDhundo Chat");
    }

    function scrollMessages() {
        if (!messages) return;
        messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(text, from) {
        if (!messages) return;

        const row = document.createElement("div");
        row.className = `chat-message ${from === "user" ? "user-message" : "bot-message"}`;

        if (from !== "user") {
            const avatar = document.createElement("div");
            avatar.className = "message-avatar";
            avatar.textContent = "🏠";
            row.appendChild(avatar);
        }

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = text;
        row.appendChild(bubble);
        messages.appendChild(row);
        scrollMessages();
    }

    function openWhatsApp(fromButton) {
        if (fromButton) addMessage("WhatsApp RoomDhundo", "user");
        addMessage("Opening WhatsApp so you can message RoomDhundo.", "bot");
        window.open(WHATSAPP_URL, "_blank");
        promptContinue();
    }

    function openEmail(fromButton) {
        if (fromButton) addMessage("Email RoomDhundo", "user");
        addMessage(`Opening your email app to write to ${EMAIL}.`, "bot");
        window.location.href = EMAIL_URL;
        promptContinue();
    }

    function showMainOptions() {
        if (!options) return;

        options.innerHTML = `
            <button type="button" class="chatbot-option" id="chatbotFaqBtn">❓ Common Questions</button>
            <button type="button" class="chatbot-option" id="chatbotWhatsAppBtn">💬 WhatsApp RoomDhundo</button>
            <button type="button" class="chatbot-option" id="chatbotEmailBtn">📧 Email RoomDhundo</button>
        `;

        document.getElementById("chatbotFaqBtn")?.addEventListener("click", showFaqMenu);
        document.getElementById("chatbotWhatsAppBtn")?.addEventListener("click", () => openWhatsApp(true));
        document.getElementById("chatbotEmailBtn")?.addEventListener("click", () => openEmail(true));
        if (messages) messages.appendChild(options);
        scrollMessages();
    }

    function promptContinue() {
        addMessage("How can we help you today?", "bot");
        showMainOptions();
    }

    function showFaqMenu() {
        addMessage("Common Questions", "user");
        addMessage("Please choose a question:", "bot");

        if (!options) return;

        options.innerHTML = FAQ_ITEMS.map((item, index) => `
            <button type="button" class="chatbot-option chatbot-faq-item" data-faq="${index}">
                ${index + 1}. ${item.question}
            </button>
        `).join("") + `
            <button type="button" class="chatbot-option" id="chatbotBackBtn">← Back</button>
        `;

        options.querySelectorAll(".chatbot-faq-item").forEach((btn) => {
            btn.addEventListener("click", () => {
                const faq = FAQ_ITEMS[Number(btn.dataset.faq)];
                if (!faq) return;
                addMessage(faq.question, "user");
                addMessage(faq.answer, "bot");
                promptContinue();
            });
        });

        document.getElementById("chatbotBackBtn")?.addEventListener("click", () => {
            addMessage("Back", "user");
            addMessage("How can we help you today?", "bot");
            showMainOptions();
        });

        if (messages) messages.appendChild(options);
        scrollMessages();
    }

    function findFaqMatch(text) {
        const q = text.toLowerCase();

        if (q.includes("contact") && q.includes("owner")) return FAQ_ITEMS[0];
        if (q.includes("list") && q.includes("property")) return FAQ_ITEMS[1];
        if (q.includes("account") || q.includes("sign up") || q.includes("login") || q.includes("log in")) {
            return FAQ_ITEMS[2];
        }
        if (q.includes("how does") || q.includes("how do you work") || q.includes("what is roomdhundo")) {
            return FAQ_ITEMS[3];
        }
        if (q.includes("report") || q.includes("problem") || q.includes("issue") || q.includes("complaint")) {
            return FAQ_ITEMS[4];
        }
        return null;
    }

    function botReply(text) {
        const q = text.toLowerCase();
        const faq = findFaqMatch(text);

        if (faq) {
            addMessage(faq.answer, "bot");
            promptContinue();
            return;
        }

        if (q.includes("whatsapp") || q.includes("wa")) {
            openWhatsApp();
            return;
        }

        if (q.includes("email") || q.includes("mail") || q.includes("gmail")) {
            openEmail();
            return;
        }

        if (q.includes("faq") || q.includes("question") || q.includes("help")) {
            showFaqMenu();
            return;
        }

        addMessage(
            "I can help with common questions, WhatsApp, or email. Please choose an option below, or ask one of the FAQ questions.",
            "bot"
        );
        showMainOptions();
    }

    function sendUserMessage() {
        const text = input?.value.trim();
        if (!text) return;
        addMessage(text, "user");
        input.value = "";
        botReply(text);
    }

    toggle.addEventListener("click", () => {
        if (chatbot.classList.contains("open")) closeChat();
        else openChat();
    });

    closeBtn?.addEventListener("click", closeChat);

    document.getElementById("chatbotFaqBtn")?.addEventListener("click", showFaqMenu);
    document.getElementById("chatbotWhatsAppBtn")?.addEventListener("click", () => openWhatsApp(true));
    document.getElementById("chatbotEmailBtn")?.addEventListener("click", () => openEmail(true));

    sendBtn?.addEventListener("click", sendUserMessage);
    input?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendUserMessage();
    });
}

function wireMobileNav() {
    const navbar = document.querySelector(".navbar");
    const navLinks = document.querySelector(".nav-links");
    if (!navbar || !navLinks || navbar.querySelector(".nav-menu-toggle")) return;

    const tools = document.createElement("div");
    tools.className = "nav-mobile-tools";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-menu-toggle";
    toggle.setAttribute("aria-label", "Open menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = "<span></span><span></span><span></span>";

    const existingTheme = navbar.querySelector(".theme-toggle");
    if (existingTheme) tools.appendChild(existingTheme);
    tools.appendChild(toggle);
    navbar.appendChild(tools);

    function closeMenu() {
        navbar.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
    }

    toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const open = navbar.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    navLinks.addEventListener("click", (event) => {
        if (event.target.closest(".nav-profile-menu, .nav-profile-toggle")) return;
        if (event.target.closest("a, #navAuthBtn")) closeMenu();
    });

    document.addEventListener("click", (event) => {
        if (!navbar.contains(event.target)) closeMenu();
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) closeMenu();
    });
}

function wireThemeToggle() {
    const storageKey = "roomdhundo-theme";
    const root = document.documentElement;
    const savedTheme = localStorage.getItem(storageKey);
    const initialTheme = savedTheme || root.dataset.theme || "light";

    function setTheme(theme) {
        const next = theme === "light" ? "light" : "dark";
        root.dataset.theme = next;
        localStorage.setItem(storageKey, next);
        document.querySelectorAll(".theme-toggle").forEach((button) => {
            const isDark = next === "dark";
            button.textContent = isDark ? "☀️" : "🌙";
            button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
            button.title = button.getAttribute("aria-label");
        });
    }

    let toggle = document.querySelector(".theme-toggle");
    if (!toggle) {
        const navLinks = document.querySelector(".nav-links");
        if (!navLinks) {
            setTheme(initialTheme);
            return;
        }
        toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "theme-toggle";
        navLinks.insertBefore(toggle, navLinks.querySelector("#navAuthBtn") || null);
    }

    const tools = document.querySelector(".nav-mobile-tools");
    const menuToggle = tools?.querySelector(".nav-menu-toggle");
    if (tools && toggle.parentElement !== tools) {
        tools.insertBefore(toggle, menuToggle || null);
    }

    document.querySelectorAll(".theme-toggle").forEach((button) => {
        if (button.dataset.themeWired) return;
        button.dataset.themeWired = "true";
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            setTheme(root.dataset.theme === "dark" ? "light" : "dark");
        });
    });

    setTheme(initialTheme);
}

// ============================================================
// OWNER PROPERTY LOCATION (list-property.html "pick on map")
// ============================================================

let propertyLocationData = {
    latitude: null,
    longitude: null,
    accuracy: null
};


// ------------------------------------------------------------
// USE OWNER'S CURRENT LOCATION
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    const ownerUseLocationBtn =
        document.getElementById("ownerUseLocationBtn");

    if (!ownerUseLocationBtn) return;

    ownerUseLocationBtn.addEventListener(
        "click",
        async () => {

            const status =
                document.getElementById(
                    "ownerLocationStatus"
                );

            try {

                ownerUseLocationBtn.disabled = true;

                status.textContent =
                    "📍 Detecting location...";

                const location =
                    await getUserLocation();

                propertyLocationData = {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy
                };

                document.getElementById(
                    "propertyLatitude"
                ).value =
                    location.latitude;

                document.getElementById(
                    "propertyLongitude"
                ).value =
                    location.longitude;

                status.textContent =
                    `✅ Location detected`;

            } catch (error) {

                console.error(error);

                status.textContent =
                    "❌ " + error.message;

            } finally {

                ownerUseLocationBtn.disabled =
                    false;
            }
        }
    );
});