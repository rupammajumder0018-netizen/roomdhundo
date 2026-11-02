(() => {
    const GALLERY_CATEGORIES = [
        { id: "exterior", title: "Exterior Photos" },
        { id: "lobby", title: "Reception & Lobby" },
        { id: "facilities", title: "Facilities" },
        { id: "other", title: "Other Photos" }
    ];
    const EXAMPLE_ROOMS = [
        "Deluxe Room",
        "Premium Deluxe",
        "Family Premium Suite",
        "Corporate / Premium Suite"
    ];
    const MAX_PER_CATEGORY = 8;
    const MAX_SIZE = 5 * 1024 * 1024;
    const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

    const gallery = {};
    GALLERY_CATEGORIES.forEach((cat) => {
        gallery[cat.id] = { existing: [], files: [] };
    });

    let currentStep = 1;

    function $(id) {
        return document.getElementById(id);
    }

    function val(id) {
        return ($(id)?.value || "").trim();
    }

    function setError(id, message) {
        const field = $(id) || document.querySelector(`[name="${id}"]`);
        const err = document.querySelector(`[data-error-for="${id}"]`);
        field?.classList.toggle("is-invalid", !!message);
        if (id === "lpStar") {
            document.querySelectorAll(".lpStar").forEach((el) => el.classList.toggle("is-invalid", !!message));
        }
        if (err) err.textContent = message || "";
    }

    function selectedStar() {
        return document.querySelector(".lpStar:checked")?.value || "";
    }

    function showBanner(message) {
        const banner = $("hlFormBanner");
        if (!banner) return;
        banner.textContent = message || "";
        banner.classList.toggle("is-visible", !!message);
    }

    function goToStep(step) {
        currentStep = Math.min(3, Math.max(1, step));
        document.querySelectorAll(".hl-step").forEach((panel) => {
            panel.classList.toggle("is-active", Number(panel.dataset.hlStep) === currentStep);
        });
        document.querySelectorAll("[data-hl-goto]").forEach((btn) => {
            const n = Number(btn.dataset.hlGoto);
            btn.classList.toggle("is-active", n === currentStep);
            btn.classList.toggle("is-done", n < currentStep);
        });
        if ($("hlStepLabel")) $("hlStepLabel").textContent = `Step ${currentStep} of 3`;
        if ($("hlBackBtn")) $("hlBackBtn").hidden = currentStep === 1;
        if ($("hlNextBtn")) $("hlNextBtn").hidden = currentStep === 3;
        if ($("hlSubmitBtn")) $("hlSubmitBtn").hidden = currentStep !== 3;
        if (currentStep === 3) renderReview();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderGallery() {
        const mount = $("hlGalleryMount");
        if (!mount) return;
        mount.innerHTML = "";
        GALLERY_CATEGORIES.forEach((cat) => {
            const box = document.createElement("div");
            const drop = document.createElement("div");
            drop.className = "hl-drop";
            drop.tabIndex = 0;
            drop.innerHTML = `<p>${cat.title}</p><small>Drag and drop or click to upload</small>`;
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ACCEPT.join(",");
            input.multiple = true;
            input.hidden = true;
            const previews = document.createElement("div");
            previews.className = "hl-previews";

            const addFiles = (fileList) => {
                const store = gallery[cat.id];
                for (const file of Array.from(fileList || [])) {
                    if (store.existing.length + store.files.length >= MAX_PER_CATEGORY) {
                        showBanner(`You can add up to ${MAX_PER_CATEGORY} photos in ${cat.title}.`);
                        break;
                    }
                    if (!ACCEPT.includes(file.type)) {
                        showBanner(`${file.name} must be JPG, PNG or WebP.`);
                        continue;
                    }
                    if (file.size > MAX_SIZE) {
                        showBanner(`${file.name} is larger than 5MB.`);
                        continue;
                    }
                    store.files.push(file);
                }
                paint();
            };

            function paint() {
                previews.innerHTML = "";
                const store = gallery[cat.id];
                store.existing.forEach((url, index) => {
                    previews.appendChild(thumb(url, () => {
                        store.existing.splice(index, 1);
                        paint();
                    }));
                });
                store.files.forEach((file, index) => {
                    const url = URL.createObjectURL(file);
                    previews.appendChild(thumb(url, () => {
                        URL.revokeObjectURL(url);
                        store.files.splice(index, 1);
                        paint();
                    }));
                });
            }

            drop.addEventListener("click", () => input.click());
            drop.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    input.click();
                }
            });
            drop.addEventListener("dragover", (event) => {
                event.preventDefault();
                drop.classList.add("is-over");
            });
            drop.addEventListener("dragleave", () => drop.classList.remove("is-over"));
            drop.addEventListener("drop", (event) => {
                event.preventDefault();
                drop.classList.remove("is-over");
                addFiles(event.dataTransfer.files);
            });
            input.addEventListener("change", () => {
                addFiles(input.files);
                input.value = "";
            });
            box.append(drop, input, previews);
            mount.appendChild(box);
            paint();
        });
    }

    function thumb(src, onRemove) {
        const wrap = document.createElement("div");
        wrap.className = "hl-thumb";
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Hotel photo";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.title = "Remove photo";
        btn.textContent = "×";
        btn.addEventListener("click", onRemove);
        wrap.append(img, btn);
        return wrap;
    }

    function phoneOk(value) {
        return !value || /^[6-9]\d{9}$/.test(value);
    }

    function emailOk(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function positiveNumber(value, allowZero) {
        if (value === "" || value == null) return false;
        const n = Number(value);
        return Number.isFinite(n) && (allowZero ? n >= 0 : n > 0);
    }

    function validateStep(step) {
        let ok = true;
        showBanner("");
        const fail = (id, message) => {
            setError(id, message);
            ok = false;
        };

        if (step === 1) {
            ["lpName", "lpPropertySubtype", "lpStar", "lpDescription", "lpCountry", "lpState", "lpCity", "lpAddress", "lpOwnerPhone", "lpOwnerEmail", "lpOwnerName"].forEach((id) => setError(id, ""));
            if (!val("lpName")) fail("lpName", "Enter the hotel name.");
            if (!val("lpPropertySubtype")) fail("lpPropertySubtype", "Select a property type.");
            if (!selectedStar()) fail("lpStar", "Select a star category.");
            if (!val("lpDescription")) fail("lpDescription", "Add a hotel description.");
            if (!val("lpCountry")) fail("lpCountry", "Enter the country.");
            if (!val("lpState")) fail("lpState", "Enter the state.");
            if (!val("lpCity")) fail("lpCity", "Enter the city.");
            if (!val("lpAddress")) fail("lpAddress", "Enter the complete address.");
            if (!val("lpOwnerName")) fail("lpOwnerName", "Enter the owner or business name.");
            if (!val("lpOwnerPhone")) fail("lpOwnerPhone", "Enter a contact number.");
            else if (!phoneOk(val("lpOwnerPhone"))) fail("lpOwnerPhone", "Use a 10-digit Indian mobile number.");
            if (val("lpOwnerAltPhone") && !phoneOk(val("lpOwnerAltPhone"))) fail("lpOwnerPhone", "Alternate number must be a 10-digit mobile.");
            if (!val("lpOwnerEmail")) fail("lpOwnerEmail", "Enter an email address.");
            else if (!emailOk(val("lpOwnerEmail"))) fail("lpOwnerEmail", "Enter a valid email address.");
        }

        if (step === 2) {
            const blocks = Array.from(document.querySelectorAll(".room-type-block"));
            const boxErr = document.querySelector('[data-error-for="roomTypesContainer"]');
            if (boxErr) boxErr.textContent = "";
            if (!blocks.length) {
                if (boxErr) boxErr.textContent = "Add at least one room category with a price per night.";
                ok = false;
            }
            blocks.forEach((block) => {
                const name = block.querySelector(".rtRoomName")?.value.trim();
                const night = block.querySelector(".rtNightlyRent")?.value;
                const total = block.querySelector(".rtTotalRooms")?.value;
                const people = block.querySelector(".rtPeople")?.value;
                const available = block.querySelector(".rtAvailable")?.value;
                const nameErr = block.querySelector(".rt-name-error");
                const nightErr = block.querySelector(".rt-night-error");
                const totalErr = block.querySelector(".rt-total-error");
                const peopleErr = block.querySelector(".rt-people-error");
                if (nameErr) nameErr.textContent = name ? "" : "Enter a room name.";
                if (nightErr) nightErr.textContent = positiveNumber(night, false) ? "" : "Enter a price per night greater than 0.";
                if (totalErr) totalErr.textContent = Number.isInteger(Number(total)) && Number(total) > 0 ? "" : "Enter a whole number of rooms.";
                if (peopleErr) peopleErr.textContent = Number(people) > 0 ? "" : "Maximum occupancy must be greater than zero.";
                if (!name || !positiveNumber(night, false) || !Number.isInteger(Number(total)) || Number(total) < 1 || !(Number(people) > 0)) ok = false;
                if (available !== "" && (!Number.isInteger(Number(available)) || Number(available) < 0)) {
                    if (totalErr) totalErr.textContent = "Available rooms cannot be negative.";
                    ok = false;
                }
                const hourlyOn = block.querySelector(".rtOfferHourly")?.checked;
                const hourPrice = block.querySelector(".rtHourlyRent")?.value;
                const hourSlots = block.querySelectorAll(".rtHourSlot:checked").length;
                const hourErr = block.querySelector(".rt-hour-error");
                if (hourlyOn && (!positiveNumber(hourPrice, false) || hourSlots === 0)) {
                    if (hourErr) hourErr.textContent = "Enter a price per hour and select at least one hour slot.";
                    ok = false;
                } else if (hourErr) {
                    hourErr.textContent = "";
                }
                ["rtHourlyRent", "rtWeekendPrice", "rtExtraPerson", "rtSize"].forEach((cls) => {
                    const input = block.querySelector(`.${cls}`);
                    if (input?.value && Number(input.value) < 0) {
                        if (nightErr) nightErr.textContent = "Prices and sizes cannot be negative.";
                        ok = false;
                    }
                });
            });
        }

        if (!ok) showBanner("Please fix the highlighted fields before continuing.");
        return ok;
    }

    function collectMeta() {
        const galleryUrls = {};
        GALLERY_CATEGORIES.forEach((cat) => {
            galleryUrls[cat.id] = gallery[cat.id].existing.slice();
        });
        return {
            property_subtype: val("lpPropertySubtype"),
            star: Number(selectedStar() || 0),
            country: val("lpCountry"),
            state: val("lpState"),
            city: val("lpCity"),
            locality: val("lpLocality"),
            address: val("lpAddress"),
            postal_code: val("lpPostal"),
            maps_url: val("lpMapsUrl"),
            email: val("lpOwnerEmail"),
            website: val("lpWebsite"),
            cancellation: val("lpCancelPolicy"),
            child_policy: val("lpChildPolicy"),
            pet_policy: val("lpPetPolicy"),
            smoking_policy: val("lpSmokePolicy"),
            gallery: galleryUrls
        };
    }

    function syncHiddenFields() {
        const meta = collectMeta();
        const location = [meta.locality, meta.city, meta.state, meta.country].filter(Boolean).join(", ");
        if ($("lpLocation")) $("lpLocation").value = location || meta.address;
        const rules = [
            `RD_META:${JSON.stringify(meta)}`,
            $("lpCheckIn") ? `Check-in: ${window.formatTime12h ? formatTime12h($("lpCheckIn").value) : $("lpCheckIn").value}` : "",
            $("lpCheckOut") ? `Check-out: ${window.formatTime12h ? formatTime12h($("lpCheckOut").value) : $("lpCheckOut").value}` : "",
            `Cancellation: ${meta.cancellation}`,
            `Child policy: ${meta.child_policy}`,
            `Pet policy: ${meta.pet_policy}`,
            `Smoking: ${meta.smoking_policy}`,
            meta.address ? `Address: ${meta.address}` : "",
            meta.email ? `Email: ${meta.email}` : "",
            meta.website ? `Website: ${meta.website}` : "",
            meta.maps_url ? `Maps: ${meta.maps_url}` : ""
        ].filter(Boolean);
        if ($("lpRules")) $("lpRules").value = rules.join("\n");
        document.querySelectorAll(".room-type-block").forEach((block) => {
            const name = block.querySelector(".rtRoomName");
            const selectLike = block.querySelector(".rtRoomType");
            if (name && selectLike && name !== selectLike) selectLike.value = name.value;
            const rent = block.querySelector(".rtRent");
            if (rent) rent.value = "0";
        });
        return meta;
    }

    function renderReview() {
        const mount = $("hlReviewMount");
        if (!mount) return;
        syncHiddenFields();
        const meta = collectMeta();
        const facilities = Array.from(document.querySelectorAll(".lpFacility:checked")).map((el) => el.dataset.label || el.value);
        const rooms = Array.from(document.querySelectorAll(".room-type-block")).map((block) => {
            const name = block.querySelector(".rtRoomName")?.value.trim() || "Untitled room";
            const night = block.querySelector(".rtNightlyRent")?.value || "—";
            const total = block.querySelector(".rtTotalRooms")?.value || "—";
            const available = block.querySelector(".rtAvailable")?.value || "—";
            const people = block.querySelector(".rtPeople")?.value || "—";
            const hourlyOn = block.querySelector(".rtOfferHourly")?.checked;
            const hourPrice = block.querySelector(".rtHourlyRent")?.value;
            const slots = Array.from(block.querySelectorAll(".rtHourSlot:checked")).map((input) => `${input.value}h`);
            const hourlyText = hourlyOn && hourPrice
                ? ` · ₹${escape(hourPrice)} / hour (${escape(slots.join(", ") || "no slots")})`
                : "";
            return `<li><strong>${escape(name)}</strong> · ₹${escape(night)} / night${hourlyText} · ${escape(total)} rooms (${escape(available)} available) · max ${escape(people)}</li>`;
        });
        const photoCount = GALLERY_CATEGORIES.reduce((sum, cat) => sum + gallery[cat.id].existing.length + gallery[cat.id].files.length, 0);
        mount.innerHTML = `
            <h3>Hotel Information</h3>
            <dl>
                <dt>Name</dt><dd>${escape(val("lpName"))}</dd>
                <dt>Type</dt><dd>${escape(meta.property_subtype)} · ${escape(selectedStar())} star</dd>
                <dt>Description</dt><dd>${escape(val("lpDescription"))}</dd>
            </dl>
            <h3>Location &amp; Contact</h3>
            <dl>
                <dt>Address</dt><dd>${escape([meta.address, meta.locality, meta.city, meta.state, meta.country, meta.postal_code].filter(Boolean).join(", "))}</dd>
                <dt>Contact</dt><dd>${escape(val("lpOwnerName"))} · ${escape(val("lpOwnerPhone"))} · ${escape(meta.email)}</dd>
            </dl>
            <h3>Hotel Gallery</h3>
            <p>${photoCount} photo${photoCount === 1 ? "" : "s"} ready to upload.</p>
            <h3>Facilities &amp; Policies</h3>
            <p>${escape(facilities.join(", ") || "None selected")}</p>
            <p>Check-in ${escape($("lpCheckIn")?.value || "")} · Check-out ${escape($("lpCheckOut")?.value || "")}</p>
            <p>${escape(meta.cancellation)} · ${escape(meta.child_policy)} · ${escape(meta.pet_policy)} · ${escape(meta.smoking_policy)}</p>
            <h3>Room Categories</h3>
            <ul>${rooms.join("") || "<li>No rooms added</li>"}</ul>
        `;
    }

    function escape(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
    }

    function seedRooms() {
        const container = $("roomTypesContainer");
        if (!container || container.children.length > 0) return;
        if (typeof addRoomTypeBlock !== "function") return;
        EXAMPLE_ROOMS.forEach((name) => {
            addRoomTypeBlock();
            const block = container.lastElementChild;
            const input = block?.querySelector(".rtRoomName");
            if (input) input.value = name;
            const title = block?.querySelector(".rt-title");
            if (title) title.textContent = name;
            input?.addEventListener("input", () => {
                if (title) title.textContent = input.value.trim() || "Room category";
            });
        });
    }

    function hydrateMeta(property) {
        let meta = property.hotel_meta && typeof property.hotel_meta === "object" ? property.hotel_meta : null;
        const rules = Array.isArray(property.rules) ? property.rules : [];
        const encoded = rules.find((rule) => String(rule).startsWith("RD_META:"));
        if (!meta && encoded) {
            try { meta = JSON.parse(String(encoded).slice(8)); } catch (error) { meta = null; }
        }
        if (!meta) return;
        const assign = (id, value) => {
            if ($(id) && value != null && value !== "") $(id).value = value;
        };
        assign("lpPropertySubtype", meta.property_subtype);
        assign("lpCountry", meta.country);
        assign("lpState", meta.state);
        assign("lpCity", meta.city);
        assign("lpLocality", meta.locality);
        assign("lpAddress", meta.address);
        assign("lpPostal", meta.postal_code);
        assign("lpMapsUrl", meta.maps_url);
        assign("lpOwnerEmail", meta.email || property.owner_email);
        assign("lpWebsite", meta.website || property.website);
        assign("lpCancelPolicy", meta.cancellation);
        assign("lpChildPolicy", meta.child_policy);
        assign("lpPetPolicy", meta.pet_policy);
        assign("lpSmokePolicy", meta.smoking_policy);
        if (meta.star) {
            const star = document.querySelector(`.lpStar[value="${meta.star}"]`);
            if (star) star.checked = true;
        }
        if (meta.gallery) {
            GALLERY_CATEGORIES.forEach((cat) => {
                gallery[cat.id].existing = Array.isArray(meta.gallery[cat.id]) ? meta.gallery[cat.id].filter(Boolean) : [];
            });
        } else if (Array.isArray(property.images)) {
            gallery.other.existing = property.images.filter(Boolean);
        }
        renderGallery();
        const badge = $("hlStatusBadge");
        if (badge) badge.textContent = property.listing_status === "pending" ? "Pending Approval" : "Editing";
    }

    window.collectHotelGalleryMedia = function collectHotelGalleryMedia() {
        const existing = [];
        const files = [];
        const categorized = { existing: {}, files: {} };
        GALLERY_CATEGORIES.forEach((cat) => {
            categorized.existing[cat.id] = gallery[cat.id].existing.slice();
            categorized.files[cat.id] = gallery[cat.id].files.slice();
            existing.push(...gallery[cat.id].existing);
            files.push(...gallery[cat.id].files);
        });
        return { existing, files, categorized };
    };

    window.hydrateHotelListing = hydrateMeta;
    window.syncHotelListingHiddenFields = syncHiddenFields;
    window.validateHotelListing = function validateHotelListing() {
        if (!validateStep(1)) {
            goToStep(1);
            return false;
        }
        if (!validateStep(2)) {
            goToStep(2);
            return false;
        }
        return true;
    };

    document.addEventListener("DOMContentLoaded", () => {
        if (!$("hotelListingWizard")) return;
        renderGallery();
        document.querySelectorAll("[data-hl-goto]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const target = Number(btn.dataset.hlGoto);
                if (target > currentStep && !validateStep(currentStep)) return;
                goToStep(target);
            });
        });
        $("hlBackBtn")?.addEventListener("click", () => goToStep(currentStep - 1));
        $("hlNextBtn")?.addEventListener("click", () => {
            if (!validateStep(currentStep)) return;
            goToStep(currentStep + 1);
        });
        $("addRoomTypeBtn")?.addEventListener("click", () => {
            setTimeout(() => {
                const block = $("roomTypesContainer")?.lastElementChild;
                const title = block?.querySelector(".rt-title");
                if (title) title.textContent = "New room category";
            }, 0);
        });
        goToStep(1);
        if (!new URLSearchParams(window.location.search).get("edit")) {
            setTimeout(seedRooms, 0);
        }
    });
})();
