// =====================================================
// SUPABASE CONFIG
// The anon key is meant to be public in frontend code —
// Row Level Security policies on the tables control what
// it's actually allowed to read/write.
// =====================================================
const SUPABASE_URL = "https://vyusxdilgwrcgmqqvzsp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dXN4ZGlsZ3dyY2dtcXF2enNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjYyNTYsImV4cCI6MjEwMjc0MjI1Nn0.X6FbzDad06d5-kj1aK4zQkPSPrrLUW_O7CdfZ-ghwrM";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// DATA HELPERS (buildings + room_types + reviews)
// =====================================================

// Adds computed fields on top of a raw building row + its nested
// room_types[] and reviews[] so the rest of the app has simple,
// ready-to-use values instead of re-deriving them everywhere.
function attachComputedFields(b) {
    const reviews = b.reviews || [];
    const roomTypes = b.room_types || [];

    const avgRating = reviews.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    const monthlyPrices = roomTypes.map(rt => rt.price_value);
    const dailyPrices = roomTypes.map(rt => rt.daily_price).filter(p => p != null);
    const totalAvailable = roomTypes.reduce((sum, rt) => sum + (rt.available_rooms || 0), 0);
    const roomTypeNames = [...new Set(roomTypes.map(rt => rt.room_type))];

    return {
        ...b,
        avgRating,
        reviewCount: reviews.length,
        minPrice: monthlyPrices.length ? Math.min(...monthlyPrices) : null,
        maxPrice: monthlyPrices.length ? Math.max(...monthlyPrices) : null,
        minDailyPrice: dailyPrices.length ? Math.min(...dailyPrices) : null,
        totalAvailable,
        roomTypeNames
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
    return data.map(attachComputedFields);
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
    return attachComputedFields(data);
}

async function getCurrentUser() {
    const { data } = await supabaseClient.auth.getUser();
    return data.user || null;
}


// =====================================================
// AUTH MODAL + NAV BUTTON
// =====================================================

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

    return {
        user,
        profile: data
    };
}


// =====================================================
// NAVBAR UPDATE
// =====================================================

async function updateNavForUser(user) {

    const navAuthBtn = document.getElementById("navAuthBtn");

    if (!navAuthBtn) return;


    // =================================================
    // NOT LOGGED IN
    // =================================================

    if (!user) {

        navAuthBtn.textContent = "Log In / Sign Up";

        navAuthBtn.onclick = () => {
            openAuthModal();
        };

        return;
    }


    // =================================================
    // GET USER PROFILE
    // =================================================

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();


    if (error) {

        console.error(
            "Profile fetch error:",
            error
        );

    }


    // =================================================
    // USER NAME
    // =================================================

    const name =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email.split("@")[0];


    // =================================================
    // USER TYPE
    // =================================================

    const userType =
        profile?.user_type ||
        profile?.role ||
        "renter";


    // =================================================
    // PROFILE BUTTON
    // =================================================

    navAuthBtn.textContent = `My Profile`;


    navAuthBtn.onclick = () => {

        // OWNER
        if (
            userType === "owner" ||
            profile?.role === "owner"
        ) {

            window.location.href =
                "owner-dashboard.html";

        }

        // RENTER
        else {

            window.location.href = "search.html?dashboard=renter";

        }

    };

}

// =====================================================
// AUTH MODAL
// =====================================================

function openAuthModal() {

    const authModal = document.getElementById("authModal");

    if (authModal) {
        authModal.style.display = "flex";
    }
}


function closeAuthModal() {

    const authModal = document.getElementById("authModal");

    if (authModal) {
        authModal.style.display = "none";
    }

    document.getElementById("loginForm")?.reset();
    document.getElementById("signupForm")?.reset();
}


function validateEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


// =====================================================
// AUTH UI
// =====================================================

function wireAuthUI() {

    const authModal = document.getElementById("authModal");
    const closeAuthBtn = document.getElementById("closeAuthBtn");

    const tabLogin = document.getElementById("tabLogin");
    const tabSignup = document.getElementById("tabSignup");

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");


    // CLOSE MODAL
    closeAuthBtn?.addEventListener("click", closeAuthModal);

    window.addEventListener("click", (e) => {

        if (e.target === authModal) {
            closeAuthModal();
        }

    });


    // SWITCH TAB
    function switchTab(activeTab, inactiveTab, showForm, hideForm) {

        activeTab?.classList.add("active");
        inactiveTab?.classList.remove("active");

        showForm?.classList.add("active");
        hideForm?.classList.remove("active");

    }


    tabLogin?.addEventListener("click", () => {

        switchTab(
            tabLogin,
            tabSignup,
            loginForm,
            signupForm
        );

    });


    tabSignup?.addEventListener("click", () => {

        switchTab(
            tabSignup,
            tabLogin,
            signupForm,
            loginForm
        );

    });


    // LOGIN
    loginForm?.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email =
            document.getElementById("loginEmail")?.value.trim();

        const password =
            document.getElementById("loginPassword")?.value;

        const loginMessage =
            document.getElementById("loginMessage");


        if (!email || !password) {

            if (loginMessage) {
                loginMessage.textContent =
                    "Please enter email and password.";
            }

            return;
        }


        if (!validateEmail(email)) {

            if (loginMessage) {
                loginMessage.textContent =
                    "Please enter a valid email.";
            }

            return;
        }


        if (loginMessage) {
            loginMessage.textContent = "Logging in...";
        }


        const { data, error } =
            await supabaseClient.auth.signInWithPassword({

                email,
                password

            });


        if (error) {

            console.error("Login error:", error);

            if (loginMessage) {
                loginMessage.textContent = error.message;
            }

            return;
        }


        if (loginMessage) {
            loginMessage.textContent =
                "Login successful!";
        }


        await updateNavForUser(data.user);


        alert("Login successful!");


        window.dispatchEvent(
            new CustomEvent("roomdhundo:auth-changed")
        );


        const result =
            await getCurrentUserProfile();

        if (result?.profile?.role === "owner") {

            window.location.href =
                "owner-dashboard.html";

        } else {
        
            window.location.href = "search.html";
        }

    });


    // SIGNUP
    signupForm?.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name =
            document.getElementById("signupName")?.value.trim();

        const email =
            document.getElementById("signupEmail")?.value.trim();

        const password =
            document.getElementById("signupPassword")?.value;

        const confirmPassword =
            document.getElementById("signupConfirmPassword")?.value;

        const signupMessage =
            document.getElementById("signupMessage");


        // VALIDATION

        if (!name || name.length < 2) {

            if (signupMessage) {
                signupMessage.textContent =
                    "Please enter your full name.";
            }

            return;
        }


        if (!validateEmail(email)) {

            if (signupMessage) {
                signupMessage.textContent =
                    "Please enter a valid email.";
            }

            return;
        }


        if (password.length < 6) {

            if (signupMessage) {
                signupMessage.textContent =
                    "Password must be at least 6 characters.";
            }

            return;
        }


        if (password !== confirmPassword) {

            if (signupMessage) {
                signupMessage.textContent =
                    "Passwords do not match.";
            }

            return;
        }


        // SHOW LOADING

        if (signupMessage) {
            signupMessage.textContent =
                "Creating your account...";
        }


        // SUPABASE SIGNUP

        const { data, error } =
            await supabaseClient.auth.signUp({

                email,
                password,

                options: {
                    data: {
                        full_name: name
                    }
                }

            });


        // ERROR

        if (error) {

            console.error(
                "Signup error:",
                error
            );

            if (signupMessage) {
                signupMessage.textContent =
                    error.message;
            }

            return;
        }


        if (!data.user) {

            if (signupMessage) {
                signupMessage.textContent =
                    "Something went wrong.";
            }

            return;
        }


        console.log(
            "Supabase user created:",
            data.user
        );


        // CREATE PROFILE

        const { error: profileError } =
            await supabaseClient
                .from("profiles")
                .upsert({

                    id: data.user.id,
                    full_name: name,
                    role: "user"

                });


        if (profileError) {

            console.error(
                "Profile creation error:",
                profileError
            );

            if (signupMessage) {
                signupMessage.textContent =
                    "Account created, but profile creation failed.";
            }

            return;
        }


        // =================================================
        // AUTO LOGIN
        //
        // signUp() only comes back with an active session if
        // "Confirm email" is OFF in the Supabase project's
        // Auth settings (Authentication -> Providers -> Email).
        // If it's ON, data.session is null and the user genuinely
        // isn't authenticated yet — no client-side trick can skip
        // that server-side check.
        //
        // We handle both cases honestly instead of always
        // showing "success" and redirecting to a page that
        // would just look logged-out.
        // =================================================

        let session = data.session;


        if (!session) {

            // Fallback attempt — covers edge cases where a
            // session wasn't returned but the account can
            // still sign in right away.

            const signInResult =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });


            if (!signInResult.error) {
                session = signInResult.data.session;
            }

        }


        if (!session) {

            // Confirmation is genuinely required — be honest
            // about it rather than faking a logged-in redirect.

            if (signupMessage) {

                signupMessage.textContent =
                    "Account created! Please check your email " +
                    "to confirm your account before logging in.";

            }

            alert(
                `Account created, ${name}!\n\n` +
                `We've sent a confirmation link to ${email}. ` +
                `Please confirm your email, then log in.`
            );

            closeAuthModal();

            return;

        }


        // SUCCESS — genuinely logged in

        if (signupMessage) {

            signupMessage.textContent =
                "🎉 Account created successfully!";

        }


        alert(
            `🎉 Account created successfully!\n\nWelcome to RoomDhundo, ${name}!`
        );

        await updateNavForUser(session.user);


        window.dispatchEvent(
            new CustomEvent("roomdhundo:auth-changed")
        );


        // REDIRECT
openRoleChoice();

    });

}


// =====================================================
// HOME PAGE - STAY TYPE TOGGLE
// =====================================================
function wireHomeStayButtons() {
    const stayButtons = document.querySelectorAll(".stay-btn");
    stayButtons.forEach(button => {
        button.addEventListener("click", () => {
            stayButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
        });
    });
}

// =====================================================
// HOME PAGE - HERO SEARCH -> search.html
// =====================================================
function wireHeroSearch() {
    const heroSearchInput = document.getElementById("heroSearchInput");
    const heroSearchBtn = document.getElementById("heroSearchBtn");
    const heroDailyBtn = document.getElementById("heroDailyBtn");

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

// =====================================================
// SEARCH PAGE - MONTHLY / DAILY FILTER PANELS
// =====================================================
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

// =====================================================
// SEARCH PAGE - GUEST COUNTER (daily filters)
// =====================================================
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

// =====================================================
// SAVED BUILDINGS (favorites) - shared helpers
// =====================================================
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

// =====================================================
// SEARCH PAGE - FILTER / SORT / RENDER ENGINE
// =====================================================
async function initSearchPage() {
    const resultsList = document.getElementById("resultsList");
    const resultsCountEl = document.getElementById("resultsCount");
    const noResultsMessage = document.getElementById("noResultsMessage");
    const sortSelect = document.getElementById("sortSelect");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const applyFiltersBtn = document.getElementById("applyFiltersBtn");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");

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
        const distanceEl = document.querySelector(".distanceFilter:checked");
        const maxDistance = distanceEl ? Number(distanceEl.value) : null;

        return { query, daily, min, max, roomTypes, propertyTypes, facilities, maxDistance };
    }

    function applyFilters(list, f) {
        return list.filter(b => {
            if (f.query) {
                const haystack = `${b.name} ${b.location}`.toLowerCase();
                if (!haystack.includes(f.query)) return false;
            }

            const roomTypes = b.room_types || [];

            // Price: building passes if AT LEAST ONE room type fits the budget
            if (f.min !== null || f.max !== null) {
                const anyRoomFits = roomTypes.some(rt => {
                    const price = f.daily ? rt.daily_price : rt.price_value;
                    if (f.min !== null && price < f.min) return false;
                    if (f.max !== null && price > f.max) return false;
                    return true;
                });
                if (!anyRoomFits) return false;
            }

            // Room type: building passes if it offers ANY of the selected types
            if (f.roomTypes.length > 0) {
                const hasMatchingRoomType = roomTypes.some(rt => f.roomTypes.includes(rt.room_type));
                if (!hasMatchingRoomType) return false;
            }

            if (f.propertyTypes.length > 0 && !f.propertyTypes.includes(b.type)) return false;
            if (f.maxDistance !== null && b.distance_km > f.maxDistance) return false;

            if (f.facilities.length > 0) {
                const tags = b.facility_tags || [];
                const hasAll = f.facilities.every(tag => tags.includes(tag));
                if (!hasAll) return false;
            }

            return true;
        });
    }

    function sortResults(list, sortKey) {
        const sorted = [...list];
        switch (sortKey) {
            case "price-asc": sorted.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity)); break;
            case "price-desc": sorted.sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity)); break;
            case "distance": sorted.sort((a, b) => a.distance_km - b.distance_km); break;
            case "rating": sorted.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0)); break;
            default: break; // "recommended" = newest first (already sorted by created_at)
        }
        return sorted;
    }

    function buildingCardHTML(b) {
        const isSaved = savedIds.includes(b.id);
        const facilityBadges = (b.facilities || []).slice(0, 3).map(f => `<span>${f}</span>`).join("");
        const daily = isDailyMode();
        const unit = daily ? "/ night" : "/ month";
        const price = daily ? b.minDailyPrice : b.minPrice;
        const priceToShow = price != null ? `₹${Number(price).toLocaleString("en-IN")}` : "—";
        const priceLabel = (b.room_types || []).length > 1 ? "From" : "";
        const ratingLabel = b.avgRating ? `⭐ ${b.avgRating}` : "🆕 New";
        const roomTypeSummary = b.roomTypeNames.join(", ");

        return `
            <div class="property-card" data-id="${b.id}">
                <div class="property-image">
                    ${b.images && b.images.length > 0
                        ? `<img src="${b.images[0]}" alt="${b.name}">`
                        : `<div class="image-placeholder">Property Image</div>`}
                </div>
                <div class="property-content">
                    <div class="property-title">
                        <div>
                            <h2>${b.name}</h2>
                            <p>📍 ${b.distance_km} km from MAKAUT</p>
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
                    <div class="availability">🟢 ${b.totalAvailable} ${b.totalAvailable === 1 ? "room" : "rooms"} available</div>
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
    }

    function renderPage() {
        const filters = readFilters();
        let list = applyFilters(allBuildings, filters);
        list = sortResults(list, sortSelect ? sortSelect.value : "recommended");

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

    // Prefill from URL params coming from the homepage hero search
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get("q");
    const stayParam = urlParams.get("stay");
    const typeParam = urlParams.get("type");
    if (qParam && searchInput) searchInput.value = qParam;
    if (typeParam) {
        document.querySelectorAll(".propertyTypeFilter").forEach(cb => {
            cb.checked = cb.value === typeParam;
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

    wireStayTypeToggle(renderPage);
    wireGuestCounter();

    applyFiltersBtn?.addEventListener("click", renderPage);
    sortSelect?.addEventListener("change", renderPage);
    searchBtn?.addEventListener("click", renderPage);
    searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") renderPage(); });

    clearFiltersBtn?.addEventListener("click", () => {
        document.querySelectorAll(".roomTypeFilter, .propertyTypeFilter, .facilityFilter").forEach(cb => cb.checked = false);
        document.querySelectorAll(".distanceFilter").forEach(r => r.checked = false);
        ["monthlyMin", "monthlyMax", "dailyMin", "dailyMax"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        if (searchInput) searchInput.value = "";
        if (sortSelect) sortSelect.value = "recommended";
        renderPage();
    });

    renderPage();
}

// =====================================================
// PROPERTY DETAIL PAGE
// =====================================================
async function initPropertyPage() {
    const buildingId = new URLSearchParams(window.location.search).get("id");
    const building = buildingId ? await fetchBuildingById(buildingId) : null;

    if (!building) {
        const main = document.querySelector(".property-page");
        if (main) main.innerHTML = `<p style="padding:60px 20px;text-align:center;">Property not found. <a href="search.html">Back to search</a></p>`;
        return;
    }

    const priceLabel = (building.room_types || []).length > 1 ? "From ₹" : "₹";
    const priceValue = building.minPrice != null ? Number(building.minPrice).toLocaleString("en-IN") : "—";

    document.getElementById("propertyPrice").textContent = `${priceLabel}${priceValue}`;
    document.getElementById("sidebarPropertyPrice").textContent = `${priceLabel}${priceValue}`;
    document.getElementById("propertyAvailability").textContent =
        (building.room_types || []).length > 1
            ? `${building.totalAvailable} rooms available across ${building.room_types.length} room types`
            : (building.room_types[0]?.availability || "Room available");
    document.getElementById("propertyName").textContent = building.name;
    document.title = `${building.name} | RoomDhundo`;
    document.getElementById("propertyLocation").textContent = `📍 ${building.distance_km} km from MAKAUT, ${building.location}`;
    document.getElementById("propertyRating").textContent = building.avgRating || "New";
    document.getElementById("propertyReviews").textContent = building.reviewCount;
    document.getElementById("propertyDescription").textContent = building.description || "";

    // --- Room types list ---
    const roomTypesList = document.getElementById("roomTypesList");
    roomTypesList.innerHTML = "";
    (building.room_types || []).forEach(rt => {
        const card = document.createElement("div");
        card.classList.add("room-type-card");
        card.innerHTML = `
            <div class="room-type-card-header">
                <h3>${rt.room_type}</h3>
                <div class="room-type-price">₹${Number(rt.price_value).toLocaleString("en-IN")}<span>/ month</span></div>
            </div>
            <div class="room-type-details">
                <span>${rt.room_people} ${rt.room_people === 1 ? "person" : "people"} sharing</span>
                <span>🟢 ${rt.available_rooms} ${rt.available_rooms === 1 ? "room" : "rooms"} available</span>
            </div>
        `;
        roomTypesList.appendChild(card);
    });

    const facilityGrid = document.getElementById("facilityGrid");
    facilityGrid.innerHTML = "";
    (building.facilities || []).forEach(facility => {
        const el = document.createElement("div");
        el.textContent = facility;
        facilityGrid.appendChild(el);
    });

    document.getElementById("propertyLocationDetails").textContent = building.location;
    document.getElementById("propertyDistance").textContent = `${building.distance_km} km from MAKAUT`;

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
    (building.rules || []).forEach(rule => {
        const li = document.createElement("li");
        li.textContent = rule;
        propertyRules.appendChild(li);
    });

    const ownerCard = document.getElementById("ownerCard");
    ownerCard.innerHTML = `
        <h2>Property Owner</h2>
        <div class="owner-name">${building.owner_name}</div>
        <div class="verification">${building.owner_verified ? "✓ Verified Owner" : "Owner"}</div>
        <p>Member since ${building.owner_member_since || "—"}</p>
        <button id="viewOwnerProfileBtn">View Owner Profile</button>
    `;

    const viewOwnerProfileBtn = document.getElementById("viewOwnerProfileBtn");
    const ownerModal = document.getElementById("ownerModal");
    viewOwnerProfileBtn?.addEventListener("click", () => {
        document.getElementById("modalOwnerName").textContent = building.owner_name;
        document.getElementById("modalOwnerRating").textContent = building.owner_verified ? "Verified" : "New";
        document.getElementById("modalMemberSince").textContent = building.owner_member_since || "—";
        if (ownerModal) ownerModal.style.display = "flex";
    });

    const closeOwnerModal = document.getElementById("closeOwnerModal");
    closeOwnerModal?.addEventListener("click", () => { if (ownerModal) ownerModal.style.display = "none"; });

    // --- Contact owner panel ---
    const contactOwnerBtn = document.getElementById("contactOwnerBtn");
    const contactPanel = document.getElementById("contactPanel");
    const closeContactBtn = document.getElementById("closeContactBtn");

    contactOwnerBtn?.addEventListener("click", () => {
        document.getElementById("contactOwnerName").textContent = building.owner_name;
        document.getElementById("contactOwnerRating").textContent = building.owner_verified ? "Verified Owner" : "New Owner";
        if (contactPanel) contactPanel.style.display = "block";
    });
    closeContactBtn?.addEventListener("click", () => { if (contactPanel) contactPanel.style.display = "none"; });

    document.getElementById("callOwnerBtn")?.addEventListener("click", () => {
        window.location.href = `tel:${building.owner_phone}`;
    });
    document.getElementById("whatsappOwnerBtn")?.addEventListener("click", () => {
        window.open(`https://wa.me/91${building.owner_whatsapp || building.owner_phone}`, "_blank");
    });
    document.getElementById("modalCallOwner")?.addEventListener("click", () => {
        window.location.href = `tel:${building.owner_phone}`;
    });
    document.getElementById("modalWhatsappOwner")?.addEventListener("click", () => {
        window.open(`https://wa.me/91${building.owner_whatsapp || building.owner_phone}`, "_blank");
    });

    document.getElementById("directionsBtn")?.addEventListener("click", () => {
        const loc = `${building.location}, ${building.distance_km} km from MAKAUT`;
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`, "_blank");
    });

    // --- Image gallery ---
    const mainPropertyImage = document.getElementById("mainPropertyImage");
    const smallPropertyImages = document.getElementById("smallPropertyImages");
    const galleryPrev = document.getElementById("galleryPrev");
    const galleryNext = document.getElementById("galleryNext");
    const galleryImages = (building.images && building.images.length > 0) ? building.images : ["images/krishna-pg-1.webp"];
    let currentImageIndex = 0;
    let galleryThumbnails = [];

    // Build thumbnails dynamically from THIS building's actual photos
    if (smallPropertyImages) {
        if (galleryImages.length > 1) {
            smallPropertyImages.innerHTML = galleryImages.map((src, i) => `
                <div class="gallery-thumbnail${i === 0 ? " active" : ""}" data-index="${i}">
                    <img src="${src}" alt="Property Image ${i + 1}">
                </div>
            `).join("");
        } else {
            smallPropertyImages.innerHTML = "";
        }
        galleryThumbnails = document.querySelectorAll(".gallery-thumbnail");
    }

    function showGalleryImage(index) {
        currentImageIndex = index;
        if (mainPropertyImage) mainPropertyImage.src = galleryImages[currentImageIndex % galleryImages.length];
        galleryThumbnails.forEach((thumb, i) => thumb.classList.toggle("active", i === currentImageIndex));
    }

    galleryThumbnails.forEach((thumb, index) => thumb.addEventListener("click", () => showGalleryImage(index)));
    galleryPrev?.addEventListener("click", () => showGalleryImage((currentImageIndex - 1 + galleryImages.length) % galleryImages.length));
    galleryNext?.addEventListener("click", () => showGalleryImage((currentImageIndex + 1) % galleryImages.length));
    if (galleryImages.length <= 1) {
        if (galleryPrev) galleryPrev.style.display = "none";
        if (galleryNext) galleryNext.style.display = "none";
    }
    if (mainPropertyImage) showGalleryImage(0);

    // --- Full-screen photo viewer ---
    const photoViewer = document.getElementById("photoViewer");
    const photoViewerImage = document.getElementById("photoViewerImage");
    const photoViewerClose = document.getElementById("photoViewerClose");
    const photoViewerPrev = document.getElementById("photoViewerPrev");
    const photoViewerNext = document.getElementById("photoViewerNext");

    mainPropertyImage?.addEventListener("click", () => {
        if (photoViewerImage) photoViewerImage.src = galleryImages[currentImageIndex];
        if (photoViewer) photoViewer.style.display = "flex";
    });
    photoViewerClose?.addEventListener("click", () => { if (photoViewer) photoViewer.style.display = "none"; });
    photoViewerPrev?.addEventListener("click", () => {
        showGalleryImage((currentImageIndex - 1 + galleryImages.length) % galleryImages.length);
        if (photoViewerImage) photoViewerImage.src = galleryImages[currentImageIndex];
    });
    photoViewerNext?.addEventListener("click", () => {
        showGalleryImage((currentImageIndex + 1) % galleryImages.length);
        if (photoViewerImage) photoViewerImage.src = galleryImages[currentImageIndex];
    });
    photoViewer?.addEventListener("click", (e) => { if (e.target === photoViewer) photoViewer.style.display = "none"; });
    photoViewerImage?.addEventListener("click", (e) => e.stopPropagation());

    // --- Save / unsave toggle ---
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

    // --- Write a review ---
    wireReviewForm(building.id);
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
        initPropertyPage(); // reloads reviews + updated average rating
    });
}

// =====================================================
// SAVED PROPERTIES PAGE
// =====================================================
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
        <div class="saved-property-card">
            <div class="saved-property-image">
                <img src="${(item.images && item.images[0]) || 'images/krishna-pg-1.webp'}" alt="${item.name}">
            </div>
            <div class="saved-property-info">
                <h2>${item.name}</h2>
                <p class="saved-location">📍 ${item.location}</p>
                <p class="saved-distance">${item.distance_km} km from MAKAUT</p>
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
            initSavedPage(); // re-render
        });
    });
}

// =====================================================
// IMAGE UPLOAD HELPER (Supabase Storage)
// =====================================================
async function uploadPropertyImages(files, userId) {
    const uploadedUrls = [];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

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

// =====================================================
// LIST PROPERTY PAGE (building + repeatable room types)
// =====================================================
function addRoomTypeBlock() {
    const container = document.getElementById("roomTypesContainer");
    const template = document.getElementById("roomTypeTemplate");
    if (!container || !template) return;

    const clone = template.content.cloneNode(true);
    const block = clone.querySelector(".room-type-block");

    block.querySelector(".remove-room-type-btn").addEventListener("click", () => {
        // Always keep at least one room type block
        if (container.querySelectorAll(".room-type-block").length > 1) {
            block.remove();
        } else {
            alert("You need at least one room type.");
        }
    });

    container.appendChild(clone);
}

function wireListPropertyForm() {
    const listPropertyForm = document.getElementById("listPropertyForm");
    if (!listPropertyForm) return;

    // Start with one room type block, and let "+ Add Another" add more
    addRoomTypeBlock();
    document.getElementById("addRoomTypeBtn")?.addEventListener("click", addRoomTypeBlock);

    listPropertyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const user = await getCurrentUser();
        if (!user) {
            alert("Please log in first — listings are tied to your account.");
            openAuthModal();
            return;
        }

        const roomTypeBlocks = Array.from(document.querySelectorAll(".room-type-block"));
        if (roomTypeBlocks.length === 0) {
            alert("Please add at least one room type.");
            return;
        }

        // Validate room type blocks before doing any uploads/inserts
        const roomTypeInputs = [];
        for (const block of roomTypeBlocks) {
            const roomType = block.querySelector(".rtRoomType").value;
            const rent = Number(block.querySelector(".rtRent").value);
            const people = Number(block.querySelector(".rtPeople").value) || 1;
            const available = Number(block.querySelector(".rtAvailable").value) || 1;

            if (!roomType || !rent) {
                alert("Please fill in every field for each room type.");
                return;
            }
            roomTypeInputs.push({ roomType, rent, people, available });
        }

        const submitBtn = listPropertyForm.querySelector(".lp-submit-btn");
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading photos…";

        const name = document.getElementById("lpName").value.trim();
        const location = document.getElementById("lpLocation").value.trim();
        const distanceKm = Number(document.getElementById("lpDistance").value);
        const type = document.getElementById("lpType").value;
        const description = document.getElementById("lpDescription").value.trim();
        const rulesRaw = document.getElementById("lpRules").value.trim();
        const ownerName = document.getElementById("lpOwnerName").value.trim();
        const ownerPhone = document.getElementById("lpOwnerPhone").value.trim();
        const imageFiles = document.getElementById("lpImages").files;

        const facilityCheckboxes = Array.from(document.querySelectorAll(".lpFacility:checked"));
        const facilityTags = facilityCheckboxes.map(cb => cb.value);
        const facilities = facilityCheckboxes.map(cb => cb.dataset.label);
        const rules = rulesRaw ? rulesRaw.split("\n").map(r => r.trim()).filter(Boolean) : [];

        let images = await uploadPropertyImages(imageFiles, user.id);
        if (images.length === 0) {
            images = ["images/krishna-pg-1.webp", "images/krishna-pg-2.webp"];
        }

        submitBtn.textContent = "Listing your property…";

        // Step 1: create the building
        const { data: newBuilding, error: buildingError } = await supabaseClient
            .from("buildings")
            .insert({
                name,
                location,
                distance_km: distanceKm,
                type,
                description,
                rules,
                facilities,
                facility_tags: facilityTags,
                images,
                owner_name: ownerName,
                owner_phone: ownerPhone,
                owner_whatsapp: ownerPhone,
                owner_verified: false,
                owner_member_since: String(new Date().getFullYear()),
                created_by: user.id
            })
            .select()
            .single();

        if (buildingError) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            alert(`Something went wrong listing your property: ${buildingError.message}`);
            return;
        }

        // Step 2: create each room type, linked to the new building
        const roomTypeRows = roomTypeInputs.map(rt => ({
            building_id: newBuilding.id,
            room_type: rt.roomType,
            price_value: rt.rent,
            daily_price: Math.round(rt.rent / 25),
            room_rent: rt.rent,
            room_people: rt.people,
            available_rooms: rt.available,
            availability: "Just listed"
        }));

        const { error: roomTypesError } = await supabaseClient.from("room_types").insert(roomTypeRows);

        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;

        if (roomTypesError) {
            alert(`Your property was created, but there was an issue adding room types: ${roomTypesError.message}`);
            return;
        }

        alert(`"${name}" has been listed! Taking you to search results.`);
        window.location.href = "search.html";
    });
}

// =====================================================
// RESET PASSWORD PAGE
// =====================================================
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

// =====================================================
// RENTER DASHBOARD
//
// Used in two places:
//   1. Embedded inside search.html, hidden unless the URL
//      has ?dashboard=renter (e.g. linked from the navbar).
//   2. Its own standalone page, user-dashboard.html — always
//      treated as dashboard mode since the whole page IS the
//      dashboard.
// =====================================================

async function initRenterDashboard() {

    const params = new URLSearchParams(
        window.location.search
    );

    const onOwnPage =
        window.location.pathname.endsWith("user-dashboard.html");

    const isDashboard =
        params.get("dashboard") === "renter" ||
        onOwnPage;

    const dashboard =
        document.getElementById("renterDashboard");

    const searchHeader =
        document.querySelector(".search-header");

    const searchContainer =
        document.querySelector(".search-container");

    if (!dashboard) return;

    // NORMAL SEARCH PAGE (dashboard section not requested)

    if (!isDashboard) {

        dashboard.style.display = "none";

        return;

    }

    // SHOW DASHBOARD

    dashboard.style.display = "block";

    if (searchHeader) {
        searchHeader.style.display = "none";
    }

    if (searchContainer) {
        searchContainer.style.display = "none";
    }

    const user = await getCurrentUser();

    if (!user) {

        window.location.href = "index.html";

        return;

    }

    // GET PROFILE

    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

    if (profileError) {
        console.error("Profile error:", profileError);
    }

    // OWNER ACCOUNTS BELONG ON THE OWNER DASHBOARD

    if (profile?.role === "owner") {

        window.location.href = "owner-dashboard.html";

        return;

    }

    // USER INFO

    const displayName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email.split("@")[0];

    const renterNameEl = document.getElementById("renterName");
    const renterFullNameEl = document.getElementById("renterFullName");
    const renterEmailEl = document.getElementById("renterEmail");

    if (renterNameEl) renterNameEl.textContent = displayName;
    if (renterFullNameEl) renterFullNameEl.textContent = displayName;
    if (renterEmailEl) renterEmailEl.textContent = user.email;

    // SAVED PROPERTIES COUNT

    const { data: saved, error: savedError } =
        await supabaseClient
            .from("saved_buildings")
            .select("id")
            .eq("user_id", user.id);

    if (savedError) {
        console.error("Saved property count error:", savedError);
    }

    const savedCountEl = document.getElementById("savedPropertyCount");
    if (savedCountEl) savedCountEl.textContent = saved?.length || 0;

    // TEMPORARY ENQUIRY COUNT

    const enquiryCountEl = document.getElementById("enquiryCount");
    if (enquiryCountEl) enquiryCountEl.textContent = "0";

    // EXPLORE BUTTONS

    document.getElementById(
        "dashboardExploreBtn"
    )?.addEventListener("click", () => {

        window.location.href = "search.html";

    });

    document.getElementById(
        "dashboardExploreMainBtn"
    )?.addEventListener("click", () => {

        window.location.href = "search.html";

    });

    // SAVED PROPERTIES BUTTON

    document.getElementById(
        "dashboardSavedBtn"
    )?.addEventListener("click", () => {

        window.location.href = "saved.html";

    });

    // ENQUIRIES BUTTON (not built yet)

    document.getElementById(
        "dashboardEnquiriesBtn"
    )?.addEventListener("click", () => {

        alert("My Enquiries will be available here.");

    });

    // LOGOUT BUTTON

    document.getElementById(
        "dashboardLogoutBtn"
    )?.addEventListener("click", async () => {

        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error("Logout error:", error);
            alert("Unable to log out. Please try again.");
            return;
        }

        window.location.href = "index.html";

    });

}

// =====================================================
// PAGE ROUTER
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    wireAuthUI();
    wireHomeStayButtons();
    wireHeroSearch();
    wireListPropertyForm();
    wireResetPasswordForm();
    wireRoleChoice();

    const currentUser = await getCurrentUser();

    updateNavForUser(currentUser);

    await initRenterDashboard();

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        updateNavForUser(session ? session.user : null);
    });

    if (document.getElementById("resultsList")) {
        await initSearchPage();
    }

    if (document.getElementById("propertyName")) {
        await initPropertyPage();
    }

    if (document.getElementById("savedPropertiesContainer")) {
        await initSavedPage();
    }

});

// =====================================================
// ROLE / PURPOSE SELECTION
// =====================================================

function openRoleChoice() {

    const modal = document.getElementById("roleChoiceModal");

    if (modal) {
        modal.style.display = "flex";
    }

}


function closeRoleChoice() {

    const modal = document.getElementById("roleChoiceModal");

    if (modal) {
        modal.style.display = "none";
    }

}


async function selectUserRole(role) {

    const user = await getCurrentUser();

    if (!user) {

        alert("Please log in first.");

        return;

    }


    // Show loading state

    const renterOption = document.getElementById("renterOption");
    const ownerOption = document.getElementById("ownerOption");

    if (renterOption) renterOption.disabled = true;
    if (ownerOption) ownerOption.disabled = true;


    // Update profile role

    const { error } = await supabaseClient
        .from("profiles")
        .update({
            role: role
        })
        .eq("id", user.id);


    if (error) {

        console.error("Role update error:", error);

        alert(
            "We couldn't save your selection. Please try again."
        );

        if (renterOption) renterOption.disabled = false;
        if (ownerOption) ownerOption.disabled = false;

        return;

    }


    // Save locally too

    localStorage.setItem("roomdhundo_role", role);


    // Redirect

    if (role === "owner") {

        window.location.href = "owner-dashboard.html";

    } else {

        window.location.href = "search.html";

    }

}


function wireRoleChoice() {

    const renterOption =
        document.getElementById("renterOption");

    const ownerOption =
        document.getElementById("ownerOption");

    const closeButton =
        document.getElementById("closeRoleChoice");

    const modal =
        document.getElementById("roleChoiceModal");


    renterOption?.addEventListener("click", () => {

        selectUserRole("user");

    });


    ownerOption?.addEventListener("click", () => {

        selectUserRole("owner");

    });


    closeButton?.addEventListener("click", () => {

        closeRoleChoice();

    });


    modal?.addEventListener("click", (event) => {

        if (event.target === modal) {

            closeRoleChoice();

        }

    });

}