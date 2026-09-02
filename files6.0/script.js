// =====================================================
// SUPABASE CONFIG
// The anon key is meant to be public in frontend code —
// Row Level Security policies on the tables control what
// it's actually allowed to read/write.
// =====================================================
const SUPABASE_URL = "https://vyusxdilgwrcgmqqvzsp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dXN4ZGlsZ3dyY2dtcXF2enNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjYyNTYsImV4cCI6MjEwMjc0MjI1Nn0.X6FbzDad06d5-kj1aK4zQkPSPrrLUW_O7CdfZ-ghwrM";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const COUPLE_FRIENDLY_TAG = "couple-friendly";
const COUPLE_FRIENDLY_LABEL = "💑 Couple Friendly";

function isCoupleFriendlyFacility(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .includes("couple");
}

function buildingHasCoupleFriendly(building) {
    const tags = building?.facility_tags || [];
    const labels = building?.facilities || [];
    return tags.some(isCoupleFriendlyFacility) || labels.some(isCoupleFriendlyFacility);
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

async function getCurrentUserFast() {
    const { data } = await supabaseClient.auth.getSession();
    return data.session?.user || null;
}

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
    const navAuthBtn = document.getElementById("navAuthBtn");
    if (!navAuthBtn) return;

    const currentUserId = user ? user.id : null;

    if (
        currentUserId === lastRenderedNavUserId &&
        navAuthBtn.dataset.navReady === "true"
    ) {
        return;
    }

    lastRenderedNavUserId = currentUserId;

    let navProfileWrap = navAuthBtn.closest(".nav-profile-wrap");

    if (!navProfileWrap) {
        navProfileWrap = document.createElement("div");
        navProfileWrap.className = "nav-profile-wrap";
        navAuthBtn.parentNode.insertBefore(navProfileWrap, navAuthBtn);
        navProfileWrap.appendChild(navAuthBtn);
    }

    navProfileWrap.querySelector("#navProfileMenu")?.remove();
    navAuthBtn.classList.remove("nav-profile-toggle");
    navAuthBtn.removeAttribute("aria-haspopup");
    navAuthBtn.onclick = null;

    if (!user) {
        navAuthBtn.textContent = "Log In / Sign Up";
        navAuthBtn.onclick = () => {
            openAuthModal();
        };
        navAuthBtn.dataset.navReady = "true";
        navAuthBtn.classList.add("nav-ready");
        return;
    }

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Profile fetch error:", error);
    }

    const displayName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email.split("@")[0];

    const isOwner =
        profile?.user_type === "owner" ||
        profile?.role === "owner";

    const roleLabel = isOwner ? "Owner" : "Renter";

    navAuthBtn.innerHTML = `
        <span class="nav-profile-info">
            <span class="nav-profile-name">${displayName}</span>
            <span class="nav-profile-role ${isOwner ? "owner" : "renter"}">${roleLabel}</span>
        </span>
        <span class="nav-profile-dots">⋮</span>
    `;
    navAuthBtn.classList.add("nav-profile-toggle");
    navAuthBtn.setAttribute("aria-label", "Account menu");
    navAuthBtn.setAttribute("aria-haspopup", "true");
    navAuthBtn.removeAttribute("href");

    const menu = document.createElement("div");
    menu.id = "navProfileMenu";
    menu.className = "nav-profile-menu";

    const menuItems = [];

    if (isOwner) {
        menuItems.push({
            icon: "👤",
            title: "My Profile",
            subtitle: "Owner Dashboard",
            action: () => {
                window.location.href = "owner-dashboard.html";
            }
        });
    } else {
        menuItems.push({
            icon: "👤",
            title: "My Profile",
            subtitle: "User Dashboard",
            action: () => {
                window.location.href = "user-dashboard.html";
            }
        });
    }

    menuItems.push({
        icon: "👥",
        title: "Add Another Account",
        subtitle: "Sign in with another account",
        action: () => {
            window.location.href = "login.html";
        }
    });

    menuItems.push({
        icon: "🚪",
        title: "Logout",
        subtitle: "Sign out of RoomDhundo",
        danger: true,
        action: async () => {
            const { error: signOutError } =
                await supabaseClient.auth.signOut();

            if (signOutError) {
                console.error("Logout error:", signOutError);
                alert("Unable to log out. Please try again.");
                return;
            }

            window.location.href = "index.html";
        }
    });

    menuItems.forEach((item) => {
        const menuItem = document.createElement("button");
        menuItem.type = "button";
        menuItem.className =
            "nav-profile-menu-item" + (item.danger ? " danger" : "");

        menuItem.innerHTML = `
            <span class="nav-profile-menu-icon">${item.icon}</span>
            <span class="nav-profile-menu-text">
                <strong>${item.title}</strong>
                <span>${item.subtitle}</span>
            </span>
        `;

        menuItem.addEventListener("click", (e) => {
            e.stopPropagation();
            menu.classList.remove("open");
            item.action();
        });

        menu.appendChild(menuItem);
    });

    navProfileWrap.appendChild(menu);

    navAuthBtn.onclick = (e) => {
        e.preventDefault?.();
        e.stopPropagation();
        menu.classList.toggle("open");
    };

    if (!navProfileOutsideClickBound) {
        document.addEventListener("click", (e) => {
            const openMenu = document.getElementById("navProfileMenu");
            if (!openMenu) return;
            const wrap = openMenu.closest(".nav-profile-wrap");
            if (wrap && !wrap.contains(e.target)) {
                openMenu.classList.remove("open");
            }
        });
        navProfileOutsideClickBound = true;
    }

    navAuthBtn.dataset.navReady = "true";
    navAuthBtn.classList.add("nav-ready");
}

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

function wireAuthUI() {
    const authModal = document.getElementById("authModal");
    const closeAuthBtn = document.getElementById("closeAuthBtn");
    const tabLogin = document.getElementById("tabLogin");
    const tabSignup = document.getElementById("tabSignup");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    closeAuthBtn?.addEventListener("click", closeAuthModal);

    window.addEventListener("click", (e) => {
        if (e.target === authModal) {
            closeAuthModal();
        }
    });

    function switchTab(activeTab, inactiveTab, showForm, hideForm) {
        activeTab?.classList.add("active");
        inactiveTab?.classList.remove("active");
        showForm?.classList.add("active");
        hideForm?.classList.remove("active");
    }

    tabLogin?.addEventListener("click", () => {
        switchTab(tabLogin, tabSignup, loginForm, signupForm);
    });

    tabSignup?.addEventListener("click", () => {
        switchTab(tabSignup, tabLogin, signupForm, loginForm);
    });

    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail")?.value.trim();
        const password = document.getElementById("loginPassword")?.value;
        const loginMessage = document.getElementById("loginMessage");

        if (!email || !password) {
            if (loginMessage) {
                loginMessage.textContent = "Please enter email and password.";
            }
            return;
        }

        if (!validateEmail(email)) {
            if (loginMessage) {
                loginMessage.textContent = "Please enter a valid email.";
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
            loginMessage.textContent = "Login successful!";
        }

        await updateNavForUser(data.user);
        alert("Login successful!");
        window.dispatchEvent(new CustomEvent("roomdhundo:auth-changed"));

        const result = await getCurrentUserProfile();

        if (result?.profile?.role === "owner") {
            window.location.href = "owner-dashboard.html";
        } else {
            window.location.href = "search.html";
        }
    });

    signupForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("signupName")?.value.trim();
        const email = document.getElementById("signupEmail")?.value.trim();
        const password = document.getElementById("signupPassword")?.value;
        const confirmPassword = document.getElementById("signupConfirmPassword")?.value;
        const signupMessage = document.getElementById("signupMessage");

        if (!name || name.length < 2) {
            if (signupMessage) {
                signupMessage.textContent = "Please enter your full name.";
            }
            return;
        }

        if (!validateEmail(email)) {
            if (signupMessage) {
                signupMessage.textContent = "Please enter a valid email.";
            }
            return;
        }

        if (password.length < 6) {
            if (signupMessage) {
                signupMessage.textContent = "Password must be at least 6 characters.";
            }
            return;
        }

        if (password !== confirmPassword) {
            if (signupMessage) {
                signupMessage.textContent = "Passwords do not match.";
            }
            return;
        }

        if (signupMessage) {
            signupMessage.textContent = "Creating your account...";
        }

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

        if (error) {
            console.error("Signup error:", error);
            if (signupMessage) {
                signupMessage.textContent = error.message;
            }
            return;
        }

        if (!data.user) {
            if (signupMessage) {
                signupMessage.textContent = "Something went wrong.";
            }
            return;
        }

        const { error: profileError } =
            await supabaseClient
                .from("profiles")
                .upsert({
                    id: data.user.id,
                    full_name: name,
                    role: "user"
                });

        if (profileError) {
            console.error("Profile creation error:", profileError);
            if (signupMessage) {
                signupMessage.textContent = "Account created, but profile creation failed.";
            }
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

        if (!session) {
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

        if (signupMessage) {
            signupMessage.textContent = "🎉 Account created successfully!";
        }

        alert(`🎉 Account created successfully!\n\nWelcome to RoomDhundo, ${name}!`);
        await updateNavForUser(session.user);
        window.dispatchEvent(new CustomEvent("roomdhundo:auth-changed"));
        openRoleChoice();
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

            if (f.min !== null || f.max !== null) {
                const anyRoomFits = roomTypes.some(rt => {
                    const price = f.daily ? rt.daily_price : rt.price_value;
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
            if (f.maxDistance !== null && b.distance_km > f.maxDistance) return false;

            if (f.facilities.length > 0) {
                const tags = b.facility_tags || [];
                const labels = b.facilities || [];
                const hasAll = f.facilities.every(tag => {
                    if (tag === COUPLE_FRIENDLY_TAG || isCoupleFriendlyFacility(tag)) {
                        return buildingHasCoupleFriendly(b);
                    }
                    return tags.includes(tag) || labels.includes(tag);
                });
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
            default: break;
        }
        return sorted;
    }

    function buildingCardHTML(b) {
        const isSaved = savedIds.includes(b.id);
        const allFacilities = b.facilities || [];
        const coupleFriendlyFacility = allFacilities.find(isCoupleFriendlyFacility)
            || (b.isCoupleFriendly ? COUPLE_FRIENDLY_LABEL : null);
        const otherFacilities = allFacilities.filter(f => f !== coupleFriendlyFacility);
        const facilitiesToShow = coupleFriendlyFacility
            ? [coupleFriendlyFacility, ...otherFacilities.slice(0, 2)]
            : otherFacilities.slice(0, 3);
        const facilityBadges = facilitiesToShow.map(f => `<span>${f}</span>`).join("");
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

async function initPropertyPage() {
    const buildingId = new URLSearchParams(window.location.search).get("id");
    const building = buildingId ? await fetchBuildingById(buildingId) : null;

    if (!building) {
        const main = document.querySelector(".property-page");
        if (main) main.innerHTML = `<p style="padding:60px 20px;text-align:center;">Property not found. <a href="search.html">Back to search</a></p>`;
        return;
    }

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
        (building.room_types || []).length > 1
            ? `${building.totalAvailable} rooms available across ${building.room_types.length} room types`
            : (building.room_types[0]?.availability || "Room available");
    document.getElementById("propertyName").textContent = building.name;
    document.title = `${building.name} | RoomDhundo`;
    document.getElementById("propertyLocation").textContent = `📍 ${building.distance_km} km from MAKAUT, ${building.location}`;
    document.getElementById("propertyRating").textContent = building.avgRating || "New";
    document.getElementById("propertyReviews").textContent = building.reviewCount;
    document.getElementById("propertyDescription").textContent = building.description || "";

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

    if (
        building.isCoupleFriendly &&
        !(building.facilities || []).some(isCoupleFriendlyFacility)
    ) {
        const el = document.createElement("div");
        el.textContent = COUPLE_FRIENDLY_LABEL;
        facilityGrid.appendChild(el);
    }

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
    const renterPhone = document.getElementById("renterPhone");
    const enquirySuccess = document.getElementById("enquirySuccess");
    const contactPropertyName = document.getElementById("contactPropertyName");

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
        const { data: { user } } = await supabaseClient.auth.getUser();

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

        if (enquirySuccess) {
            enquirySuccess.style.display = "none";
        }

        if (submitEnquiryBtn) {
            submitEnquiryBtn.style.display = "block";
            submitEnquiryBtn.disabled = false;
            submitEnquiryBtn.textContent = "📩 Request Owner Connection";
        }

        if (contactPanel) {
            contactPanel.style.display = "block";
        }
    });

    closeContactBtn?.addEventListener("click", () => {
        if (contactPanel) {
            contactPanel.style.display = "none";
        }
    });

    submitEnquiryBtn?.addEventListener("click", async () => {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            alert("Please log in before submitting an enquiry.");
            return;
        }

        const phone = renterPhone?.value.trim();

        if (!phone) {
            alert("Please enter your phone number.");
            renterPhone?.focus();
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
                        building_id: building.id,
                        renter_phone: phone,
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

    document.getElementById("directionsBtn")?.addEventListener("click", () => {
        const loc = `${building.location}, ${building.distance_km} km from MAKAUT`;
        window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`,
            "_blank"
        );
    });

    const mainPropertyImage = document.getElementById("mainPropertyImage");
    const smallPropertyImages = document.getElementById("smallPropertyImages");
    const galleryPrev = document.getElementById("galleryPrev");
    const galleryNext = document.getElementById("galleryNext");

    const galleryImages = Array.isArray(building.images)
        ? building.images.filter(src => typeof src === "string" && src.trim() !== "")
        : [];

    let currentImageIndex = 0;
    let galleryThumbnails = [];

    function showGalleryImage(index) {
        if (galleryImages.length === 0) return;

        currentImageIndex = (index + galleryImages.length) % galleryImages.length;

        if (mainPropertyImage) {
            mainPropertyImage.src = galleryImages[currentImageIndex];
            mainPropertyImage.alt = `${building.name || "Property"} Image ${currentImageIndex + 1}`;
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
            initSavedPage();
        });
    });
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
    const peopleInput = block.querySelector(".rtPeople");
    const availableInput = block.querySelector(".rtAvailable");

    if (roomData) {
        roomTypeSelect.value = roomData.room_type || "";
        rentInput.value = roomData.price_value ?? roomData.room_rent ?? "";
        if (nightlyRentInput) {
            nightlyRentInput.value = roomData.daily_price ?? "";
        }
        peopleInput.value = roomData.room_people ?? 1;
        availableInput.value = roomData.available_rooms ?? 0;
        availableInput.min = "0";
    } else {
        peopleInput.value = "1";
        availableInput.value = "1";
        availableInput.min = "1";
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
    document.getElementById("lpDistance").value = property.distance_km ?? "";
    document.getElementById("lpType").value = property.type || "";
    document.getElementById("lpDescription").value = property.description || "";
    document.getElementById("lpRules").value = Array.isArray(property.rules) ? property.rules.join("\n") : "";
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

    listPropertyExistingImages = Array.isArray(property.images) ? property.images.filter(Boolean) : [];
    listPropertyExistingVideos = Array.isArray(property.videos) ? property.videos.filter(Boolean) : [];
    renderExistingPropertyMedia();

    const roomContainer = document.getElementById("roomTypesContainer");
    if (roomContainer) {
        roomContainer.innerHTML = "";
        const roomTypes = Array.isArray(property.room_types) ? property.room_types : [];
        if (roomTypes.length > 0) {
            roomTypes.forEach(room => addRoomTypeBlock(room));
        } else {
            addRoomTypeBlock();
        }
    }

    return true;
}

function wireListPropertyForm() {
    const listPropertyForm = document.getElementById("listPropertyForm");
    if (!listPropertyForm) return;

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("edit");

    const initializeForm = async () => {
        const user = await getCurrentUser();
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
            if (roomContainer && roomContainer.children.length === 0) {
                addRoomTypeBlock();
            }
        }
    };

    initializeForm();

    document.getElementById("addRoomTypeBtn")?.addEventListener("click", () => {
        addRoomTypeBlock();
    });

    listPropertyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const user = await getCurrentUser();
        if (!user) {
            alert("Please log in first — listings are tied to your account.");
            openAuthModal();
            return;
        }

        const name = document.getElementById("lpName").value.trim();
        const location = document.getElementById("lpLocation").value.trim();
        const distanceKm = Number(document.getElementById("lpDistance").value);
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
        const facilityTags = facilityCheckboxes.map(checkbox => checkbox.value);
        const facilities = facilityCheckboxes.map(checkbox => checkbox.dataset.label);

        const rules = rulesRaw
            ? rulesRaw.split("\n").map(rule => rule.trim()).filter(Boolean)
            : [];

        const roomTypeBlocks = Array.from(document.querySelectorAll(".room-type-block"));
        if (roomTypeBlocks.length === 0) {
            alert("Please add at least one room type.");
            return;
        }

        const roomTypeInputs = [];

        for (const block of roomTypeBlocks) {
            const roomType = block.querySelector(".rtRoomType")?.value.trim();
            const rent = Number(block.querySelector(".rtRent")?.value);
            const nightlyRent = Number(block.querySelector(".rtNightlyRent")?.value);
            const people = Number(block.querySelector(".rtPeople")?.value);
            const available = Number(block.querySelector(".rtAvailable")?.value);

            if (!roomType) {
                alert("Please select a room type for every room.");
                return;
            }

            if (!Number.isFinite(rent) || rent <= 0) {
                alert("Please enter a valid monthly rent for every room type.");
                return;
            }

            if (!Number.isFinite(people) || people < 1) {
                alert("People sharing must be at least 1.");
                return;
            }

            if (!Number.isFinite(available) || available < 0) {
                alert("Available rooms cannot be negative.");
                return;
            }

            roomTypeInputs.push({
                id: block.dataset.roomId || null,
                roomType,
                rent,
                nightlyRent,
                people,
                available
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
            const newMediaFiles = mediaInput?.files ? Array.from(mediaInput.files) : [];
            let newImages = [];
            let newVideos = [];

            if (newMediaFiles.length > 0) {
                const newImageCount = newMediaFiles.filter(file => file.type.startsWith("image/")).length;
                const remainingImageSlots = Math.max(0, 5 - listPropertyExistingImages.length);

                if (newImageCount > remainingImageSlots) {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
                    }
                    alert(
                        `You can add only ${remainingImageSlots} more photo(s). Existing photos are already using ${listPropertyExistingImages.length} of 5 slots.`
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

            const finalImages = [...listPropertyExistingImages, ...newImages].slice(0, 5);
            const finalVideos = [...listPropertyExistingVideos, ...newVideos];

            if (listPropertyEditMode && listPropertyEditId) {
                if (submitButton) submitButton.textContent = "Updating property...";

                const { data: updatedBuilding, error: buildingError } =
                    await supabaseClient
                        .from("buildings")
                        .update({
                            name,
                            location,
                            distance_km: distanceKm,
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
                            owner_whatsapp: ownerPhone
                        })
                        .eq("id", listPropertyEditId)
                        .eq("created_by", user.id)
                        .select()
                        .single();

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
                    const availability = room.available > 0 ? "Available" : "Occupied";
                    const roomPayload = {
                        room_type: room.roomType,
                        price_value: room.rent,
                        daily_price: room.nightlyRent,
                        room_rent: room.rent,
                        room_people: room.people,
                        available_rooms: room.available,
                        availability
                    };

                    if (room.id) {
                        const { error: updateRoomError } =
                            await supabaseClient
                                .from("room_types")
                                .update(roomPayload)
                                .eq("id", room.id)
                                .eq("building_id", listPropertyEditId);

                        if (updateRoomError) {
                            throw new Error(`Could not update room type: ${updateRoomError.message}`);
                        }
                    } else {
                        const { error: insertRoomError } =
                            await supabaseClient
                                .from("room_types")
                                .insert({
                                    building_id: listPropertyEditId,
                                    ...roomPayload
                                });

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
                await supabaseClient
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
                        images: finalImages,
                        videos: finalVideos,
                        owner_name: ownerName,
                        owner_phone: ownerPhone,
                        owner_alt_phone: ownerAltPhone || null,
                        owner_whatsapp: ownerPhone,
                        owner_verified: false,
                        owner_member_since: String(new Date().getFullYear()),
                        created_by: user.id
                    })
                    .select()
                    .single();

            if (buildingError) throw new Error(buildingError.message);

            const roomTypeRows = roomTypeInputs.map(room => ({
                building_id: newBuilding.id,
                room_type: room.roomType,
                price_value: room.rent,
                daily_price: room.nightlyRent,
                room_rent: room.rent,
                room_people: room.people,
                available_rooms: room.available,
                availability: room.available > 0 ? "Just listed" : "Occupied"
            }));

            const { error: roomTypesError } =
                await supabaseClient.from("room_types").insert(roomTypeRows);

            if (roomTypesError) {
                throw new Error(`Your property was created, but there was an issue adding room types: ${roomTypesError.message}`);
            }

            alert(`"${name}" has been listed successfully!`);
            window.location.href = "search.html";
        } catch (error) {
            console.error("Property save/update error:", error);
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

async function initRenterDashboard() {
    const params = new URLSearchParams(window.location.search);
    const onOwnPage = window.location.pathname.endsWith("user-dashboard.html");
    const isDashboard = params.get("dashboard") === "renter" || onOwnPage;
    const dashboard = document.getElementById("renterDashboard");
    const searchHeader = document.querySelector(".search-header");
    const searchContainer = document.querySelector(".search-container");

    if (!dashboard) return;

    if (!isDashboard) {
        dashboard.style.display = "none";
        return;
    }

    dashboard.style.display = "block";
    if (searchHeader) searchHeader.style.display = "none";
    if (searchContainer) searchContainer.style.display = "none";

    const user = await getCurrentUser();
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const { data: profile, error: profileError } =
        await supabaseClient.from("profiles").select("*").eq("id", user.id).maybeSingle();

    if (profileError) console.error("Profile error:", profileError);

    if (profile?.role === "owner") {
        window.location.href = "owner-dashboard.html";
        return;
    }

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

    const { data: saved, error: savedError } =
        await supabaseClient.from("saved_buildings").select("id").eq("user_id", user.id);

    if (savedError) console.error("Saved property count error:", savedError);

    const savedCountEl = document.getElementById("savedPropertyCount");
    if (savedCountEl) savedCountEl.textContent = saved?.length || 0;

    const enquiryCountEl = document.getElementById("enquiryCount");
    if (enquiryCountEl) enquiryCountEl.textContent = "0";

    document.getElementById("dashboardExploreBtn")?.addEventListener("click", () => {
        window.location.href = "search.html";
    });

    document.getElementById("dashboardExploreMainBtn")?.addEventListener("click", () => {
        window.location.href = "search.html";
    });

    document.getElementById("dashboardSavedBtn")?.addEventListener("click", () => {
        window.location.href = "saved.html";
    });

    document.getElementById("dashboardEnquiriesBtn")?.addEventListener("click", () => {
        alert("My Enquiries will be available here.");
    });

    document.getElementById("dashboardLogoutBtn")?.addEventListener("click", async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error("Logout error:", error);
            alert("Unable to log out. Please try again.");
            return;
        }
        window.location.href = "index.html";
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    wireAuthUI();
    wireHomeStayButtons();
    wireHeroSearch();
    wireListPropertyForm();
    wireResetPasswordForm();
    wireRoleChoice();
    wireThemeToggle();

    const currentUser = await getCurrentUserFast();
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
    if (renterOption) renterOption.disabled = true;
    if (ownerOption) ownerOption.disabled = true;

    const { error } = await supabaseClient
        .from("profiles")
        .update({ role: role })
        .eq("id", user.id);

    if (error) {
        console.error("Role update error:", error);
        alert("We couldn't save your selection. Please try again.");
        if (renterOption) renterOption.disabled = false;
        if (ownerOption) ownerOption.disabled = false;
        return;
    }

    localStorage.setItem("roomdhundo_role", role);

    if (role === "owner") {
        window.location.href = "owner-dashboard.html";
    } else {
        window.location.href = "search.html";
    }
}

function wireRoleChoice() {
    const renterOption = document.getElementById("renterOption");
    const ownerOption = document.getElementById("ownerOption");
    const closeButton = document.getElementById("closeRoleChoice");
    const modal = document.getElementById("roleChoiceModal");

    renterOption?.addEventListener("click", () => selectUserRole("user"));
    ownerOption?.addEventListener("click", () => selectUserRole("owner"));
    closeButton?.addEventListener("click", () => closeRoleChoice());
    modal?.addEventListener("click", (event) => {
        if (event.target === modal) closeRoleChoice();
    });
}

function wireThemeToggle() {
    const storageKey = "roomdhundo-theme";
    const root = document.documentElement;
    const savedTheme = localStorage.getItem(storageKey);
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    function setTheme(theme) {
        root.dataset.theme = theme;
        localStorage.setItem(storageKey, theme);
        const button = document.querySelector(".theme-toggle");
        if (button) {
            const isDark = theme === "dark";
            button.textContent = isDark ? "☀" : "☾";
            button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
            button.title = button.getAttribute("aria-label");
        }
    }

    setTheme(savedTheme || systemTheme);

    const navLinks = document.querySelector(".nav-links");
    if (!navLinks || navLinks.querySelector(".theme-toggle")) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "theme-toggle";
    toggle.addEventListener("click", () => {
        setTheme(root.dataset.theme === "dark" ? "light" : "dark");
    });

    navLinks.insertBefore(toggle, navLinks.querySelector("#navAuthBtn") || null);
    setTheme(root.dataset.theme);
}
