(() => {
    const GALLERY_CATEGORIES = [
        { id: "living", title: "Living Room" },
        { id: "bedrooms", title: "Bedrooms" },
        { id: "kitchen", title: "Kitchen" },
        { id: "bathroom", title: "Bathroom" },
        { id: "balcony", title: "Balcony" },
        { id: "exterior", title: "Exterior" }
    ];
    const MAX_PER_CATEGORY = 6;
    const MAX_SIZE = 5 * 1024 * 1024;
    const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
    const TOTAL_STEPS = 9;

    const gallery = {};
    GALLERY_CATEGORIES.forEach((cat) => {
        gallery[cat.id] = { existing: [], files: [] };
    });

    let currentStep = 1;
    let contactPrefillDone = false;

    function $(id) {
        return document.getElementById(id);
    }

    function val(id) {
        return ($(id)?.value || "").trim();
    }

    function radioValue(name) {
        return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
    }

    function setError(id, message) {
        const field = $(id);
        const err = document.querySelector(`[data-error-for="${id}"]`);
        field?.classList.toggle("is-invalid", !!message);
        if (id === "lpFlatType") {
            document.querySelectorAll('input[name="lpFlatType"]').forEach((el) => el.classList.toggle("is-invalid", !!message));
        }
        if (err) err.textContent = message || "";
    }

    function showBanner(message) {
        const banner = $("flFormBanner");
        if (!banner) return;
        banner.textContent = message || "";
        banner.classList.toggle("is-visible", !!message);
    }

    function numberOk(value, min, allowEmpty) {
        if (value === "" || value == null) return !!allowEmpty;
        const n = Number(value);
        return Number.isFinite(n) && n >= min;
    }

    function phoneOk(value) {
        return /^[6-9]\d{9}$/.test(value);
    }

    function goToStep(step) {
        currentStep = Math.min(TOTAL_STEPS, Math.max(1, step));
        document.querySelectorAll(".hl-step").forEach((panel) => {
            panel.classList.toggle("is-active", Number(panel.dataset.flStep) === currentStep);
        });
        document.querySelectorAll("[data-fl-goto]").forEach((btn) => {
            const n = Number(btn.dataset.flGoto);
            btn.classList.toggle("is-active", n === currentStep);
            btn.classList.toggle("is-done", n < currentStep);
        });
        if ($("flStepLabel")) $("flStepLabel").textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
        if ($("flBackBtn")) $("flBackBtn").hidden = currentStep === 1;
        if ($("flNextBtn")) $("flNextBtn").hidden = currentStep === TOTAL_STEPS;
        if ($("flSubmitBtn")) $("flSubmitBtn").hidden = currentStep !== TOTAL_STEPS;
        if (currentStep === TOTAL_STEPS) renderReview();
        if (currentStep === 2) {
            setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function thumb(src, onRemove, statusText) {
        const wrap = document.createElement("div");
        wrap.className = "hl-thumb";
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Flat photo";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.title = "Remove photo";
        btn.textContent = "×";
        btn.addEventListener("click", onRemove);
        wrap.append(img, btn);
        if (statusText) {
            wrap.title = statusText;
        }
        return wrap;
    }

    function renderGallery() {
        const mount = $("flGalleryMount");
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
            const status = document.createElement("p");
            status.className = "fl-upload-status";

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
                    }, "Already uploaded"));
                });
                store.files.forEach((file, index) => {
                    const url = URL.createObjectURL(file);
                    previews.appendChild(thumb(url, () => {
                        URL.revokeObjectURL(url);
                        store.files.splice(index, 1);
                        paint();
                    }, "Ready to upload"));
                });
                const total = store.existing.length + store.files.length;
                status.textContent = total
                    ? `${total} photo${total === 1 ? "" : "s"} · ${store.files.length} queued for upload`
                    : "No photos yet";
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
            box.append(drop, input, previews, status);
            mount.appendChild(box);
            paint();
        });
    }

    function selectedTenants() {
        return Array.from(document.querySelectorAll(".lpTenant:checked")).map((el) => el.value);
    }

    function photoCount() {
        return GALLERY_CATEGORIES.reduce((sum, cat) => sum + gallery[cat.id].existing.length + gallery[cat.id].files.length, 0);
    }

    function collectMeta() {
        return {
            flat_type: radioValue("lpFlatType"),
            property_status: radioValue("lpPropertyStatus"),
            address: val("lpAddress"),
            locality: val("lpLocality"),
            city: val("lpCity"),
            district: val("lpDistrict"),
            state: val("lpState"),
            postal_code: val("lpPostal"),
            landmark: val("lpLandmark"),
            maps_url: val("lpMapsUrl"),
            bedrooms: val("lpBedrooms"),
            bathrooms: val("lpBathrooms"),
            balconies: val("lpBalconies"),
            floor: val("lpFloor"),
            total_floors: val("lpTotalFloors"),
            built_up: val("lpBuiltUp"),
            parking: radioValue("lpParking"),
            monthly_rent: val("lpMonthlyRent"),
            deposit: val("lpDeposit"),
            maintenance: val("lpMaintenance"),
            available_from: val("lpAvailableFrom"),
            tenants: selectedTenants(),
            pets: radioValue("lpPets"),
            listed_by: radioValue("lpListedBy"),
            gallery: Object.fromEntries(GALLERY_CATEGORIES.map((cat) => [cat.id, gallery[cat.id].existing.slice()]))
        };
    }

    function syncHiddenFields() {
        const meta = collectMeta();
        const location = [meta.locality, meta.city, meta.district, meta.state, meta.postal_code].filter(Boolean).join(", ");
        if ($("lpLocation")) $("lpLocation").value = location || meta.address;
        const description = [
            val("lpName"),
            meta.flat_type,
            meta.property_status,
            meta.locality && `in ${meta.locality}`,
            meta.city
        ].filter(Boolean).join(" · ");
        if ($("lpDescription")) $("lpDescription").value = description;
        const rules = [
            `RD_META:${JSON.stringify(meta)}`,
            meta.address ? `Address: ${meta.address}` : "",
            meta.landmark ? `Landmark: ${meta.landmark}` : "",
            meta.maps_url ? `Maps: ${meta.maps_url}` : "",
            meta.tenants.length ? `Preferred tenants: ${meta.tenants.join(", ")}` : "",
            meta.pets ? `Pets allowed: ${meta.pets}` : "",
            meta.listed_by ? `Listed by: ${meta.listed_by}` : "",
            meta.available_from ? `Available from: ${meta.available_from}` : "",
            meta.deposit ? `Security deposit: ₹${meta.deposit}` : "",
            meta.maintenance ? `Maintenance: ₹${meta.maintenance} / month` : ""
        ].filter(Boolean);
        if ($("lpRules")) $("lpRules").value = rules.join("\n");

        const block = document.querySelector("#roomTypesContainer .room-type-block");
        if (block) {
            const typeInput = block.querySelector(".rtRoomType");
            const rentInput = block.querySelector(".rtRent");
            const peopleInput = block.querySelector(".rtPeople");
            const availableInput = block.querySelector(".rtAvailable");
            const metaInput = block.querySelector(".rtFlatMeta");
            if (typeInput) typeInput.value = meta.flat_type || "1 BHK";
            if (rentInput) rentInput.value = meta.monthly_rent || "0";
            if (peopleInput) peopleInput.value = String(Math.max(1, Number(meta.bedrooms) || 1));
            if (availableInput) availableInput.value = "1";
            if (metaInput) {
                metaInput.value = JSON.stringify({
                    bathrooms: Number(meta.bathrooms) || 0,
                    balconies: Number(meta.balconies) || 0,
                    floor: Number(meta.floor) || 0,
                    total_floors: Number(meta.total_floors) || 0,
                    built_up: Number(meta.built_up) || 0,
                    parking: meta.parking,
                    deposit: Number(meta.deposit) || 0,
                    maintenance: Number(meta.maintenance) || 0,
                    available_from: meta.available_from,
                    tenants: meta.tenants,
                    pets: meta.pets,
                    listed_by: meta.listed_by,
                    property_status: meta.property_status
                });
            }
        }
        return meta;
    }

    function validateStep(step) {
        let ok = true;
        showBanner("");
        const fail = (id, message) => {
            setError(id, message);
            ok = false;
        };

        if (step === 1) {
            ["lpName", "lpFlatType", "lpPropertyStatus", "lpFurnishing"].forEach((id) => setError(id, ""));
            if (!val("lpName") || val("lpName").length < 4) fail("lpName", "Enter a property title of at least 4 characters.");
            if (!radioValue("lpFlatType")) fail("lpFlatType", "Select a flat type.");
            if (!radioValue("lpPropertyStatus")) fail("lpPropertyStatus", "Select the property status.");
            if (!radioValue("lpFurnishing")) fail("lpFurnishing", "Select a furnishing status.");
        }

        if (step === 2) {
            ["lpAddress", "lpLocality", "lpCity", "lpDistrict", "lpState", "lpPostal", "lpMapsUrl"].forEach((id) => setError(id, ""));
            if (!val("lpAddress")) fail("lpAddress", "Enter the full property address.");
            if (!val("lpLocality")) fail("lpLocality", "Enter the area or locality.");
            if (!val("lpCity")) fail("lpCity", "Enter the city.");
            if (!val("lpDistrict")) fail("lpDistrict", "Enter the district.");
            if (!val("lpState")) fail("lpState", "Enter the state.");
            if (!/^[1-9][0-9]{5}$/.test(val("lpPostal"))) fail("lpPostal", "Enter a valid 6-digit PIN code.");
            if (val("lpMapsUrl") && !/^https?:\/\//i.test(val("lpMapsUrl"))) fail("lpMapsUrl", "Enter a full Google Maps URL, or leave this blank.");
        }

        if (step === 3) {
            ["lpBedrooms", "lpBathrooms", "lpBalconies", "lpFloor", "lpTotalFloors", "lpBuiltUp", "lpParking"].forEach((id) => setError(id, ""));
            if (!numberOk(val("lpBedrooms"), 0)) fail("lpBedrooms", "Enter the number of bedrooms.");
            if (!numberOk(val("lpBathrooms"), 0)) fail("lpBathrooms", "Enter the number of bathrooms.");
            if (!numberOk(val("lpBalconies"), 0)) fail("lpBalconies", "Enter the number of balconies.");
            if (!numberOk(val("lpFloor"), 0)) fail("lpFloor", "Enter the floor number.");
            if (!numberOk(val("lpTotalFloors"), 1)) fail("lpTotalFloors", "Enter total floors in the building.");
            if (numberOk(val("lpFloor"), 0) && numberOk(val("lpTotalFloors"), 1) && Number(val("lpFloor")) > Number(val("lpTotalFloors"))) {
                fail("lpFloor", "Floor number cannot be higher than total floors.");
            }
            if (!numberOk(val("lpBuiltUp"), 1)) fail("lpBuiltUp", "Enter built-up area in sq. ft.");
            if (!radioValue("lpParking")) fail("lpParking", "Select parking availability.");
        }

        if (step === 4) {
            ["lpMonthlyRent", "lpDeposit", "lpMaintenance", "lpAvailableFrom"].forEach((id) => setError(id, ""));
            if (!numberOk(val("lpMonthlyRent"), 1)) fail("lpMonthlyRent", "Enter monthly rent in rupees.");
            if (!numberOk(val("lpDeposit"), 0)) fail("lpDeposit", "Enter the security deposit, or 0.");
            if (!numberOk(val("lpMaintenance"), 0)) fail("lpMaintenance", "Enter monthly maintenance, or 0.");
            if (!val("lpAvailableFrom")) fail("lpAvailableFrom", "Choose the available-from date.");
        }

        if (step === 5) {
            setError("lpAmenities", "");
            if (!document.querySelector(".lpFacility[type='checkbox']:checked")) {
                fail("lpAmenities", "Select at least one amenity.");
            }
        }

        if (step === 6) {
            setError("lpTenants", "");
            setError("lpPets", "");
            if (!selectedTenants().length) fail("lpTenants", "Select at least one tenant preference.");
            if (!radioValue("lpPets")) fail("lpPets", "Say whether pets are allowed.");
        }

        if (step === 7) {
            setError("lpPhotos", "");
            if (photoCount() < 1) fail("lpPhotos", "Add at least one photo before continuing.");
        }

        if (step === 8) {
            ["lpListedBy", "lpOwnerName", "lpOwnerPhone"].forEach((id) => setError(id, ""));
            if (!radioValue("lpListedBy")) fail("lpListedBy", "Select whether you are the owner or a broker.");
            if (!val("lpOwnerName") || val("lpOwnerName").length < 2) fail("lpOwnerName", "Enter the full name.");
            if (!phoneOk(val("lpOwnerPhone"))) fail("lpOwnerPhone", "Enter a valid 10-digit Indian mobile number.");
        }

        if (!ok) showBanner("Please fix the highlighted fields before continuing.");
        return ok;
    }

    function rupee(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return "—";
        return `₹${n.toLocaleString("en-IN")}`;
    }

    function escape(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
    }

    function reviewSection(step, title, body) {
        return `
            <div class="fl-review-head">
                <h3>${escape(title)}</h3>
                <button type="button" class="hl-btn" data-fl-edit="${step}">Edit</button>
            </div>
            ${body}
        `;
    }

    function renderReview() {
        const mount = $("flReviewMount");
        if (!mount) return;
        const meta = syncHiddenFields();
        const furnishing = document.querySelector('input[name="lpFurnishing"]:checked')?.parentElement?.textContent.trim() || "—";
        const amenities = Array.from(document.querySelectorAll(".lpFacility[type='checkbox']:checked")).map((el) => el.dataset.label || el.value);
        const photos = [];
        GALLERY_CATEGORIES.forEach((cat) => {
            gallery[cat.id].existing.forEach((url) => photos.push(url));
            gallery[cat.id].files.forEach((file) => photos.push(URL.createObjectURL(file)));
        });
        mount.innerHTML = [
            reviewSection(1, "Basic details", `<dl><dt>Title</dt><dd>${escape(val("lpName"))}</dd><dt>Type</dt><dd>${escape(meta.flat_type)}</dd><dt>Status</dt><dd>${escape(meta.property_status)}</dd><dt>Furnishing</dt><dd>${escape(furnishing)}</dd></dl>`),
            reviewSection(2, "Location", `<dl><dt>Address</dt><dd>${escape([meta.address, meta.locality, meta.city, meta.district, meta.state, meta.postal_code].filter(Boolean).join(", "))}</dd><dt>Landmark</dt><dd>${escape(meta.landmark || "—")}</dd><dt>Maps</dt><dd>${escape(meta.maps_url || "Not added")}</dd></dl>`),
            reviewSection(3, "Configuration", `<dl><dt>Bedrooms</dt><dd>${escape(meta.bedrooms)}</dd><dt>Bathrooms</dt><dd>${escape(meta.bathrooms)}</dd><dt>Balconies</dt><dd>${escape(meta.balconies)}</dd><dt>Floor</dt><dd>${escape(meta.floor)} of ${escape(meta.total_floors)}</dd><dt>Built-up</dt><dd>${escape(meta.built_up)} sq. ft.</dd><dt>Parking</dt><dd>${escape(meta.parking)}</dd></dl>`),
            reviewSection(4, "Pricing", `<dl><dt>Monthly rent</dt><dd>${escape(rupee(meta.monthly_rent))}</dd><dt>Security deposit</dt><dd>${escape(rupee(meta.deposit))}</dd><dt>Maintenance</dt><dd>${escape(rupee(meta.maintenance))} / month</dd><dt>Available from</dt><dd>${escape(meta.available_from)}</dd></dl><p class="fl-fee-note">RoomDhundo’s 10% service fee is not included in these amounts.</p>`),
            reviewSection(5, "Amenities", `<p>${escape(amenities.join(", ") || "None selected")}</p>`),
            reviewSection(6, "Tenant preferences", `<dl><dt>Preferred tenants</dt><dd>${escape(meta.tenants.join(", ") || "—")}</dd><dt>Pets</dt><dd>${escape(meta.pets)}</dd></dl>`),
            reviewSection(7, "Photos", `${photos.length ? `<div class="fl-review-photos">${photos.map((src) => `<img src="${escape(src)}" alt="Listing photo">`).join("")}</div>` : "<p>No photos added.</p>"}`),
            reviewSection(8, "Contact", `<dl><dt>Listed by</dt><dd>${escape(meta.listed_by)}</dd><dt>Name</dt><dd>${escape(val("lpOwnerName"))}</dd><dt>Mobile</dt><dd>${escape(val("lpOwnerPhone"))}</dd></dl>`)
        ].join("");
        mount.querySelectorAll("[data-fl-edit]").forEach((btn) => {
            btn.addEventListener("click", () => goToStep(Number(btn.dataset.flEdit)));
        });
    }

    function digitsPhone(value) {
        const digits = String(value || "").replace(/\D/g, "");
        return digits.length >= 10 ? digits.slice(-10) : "";
    }

    async function prefillContact() {
        if (contactPrefillDone || !window.supabaseClient) return;
        contactPrefillDone = true;
        try {
            const { data } = await window.supabaseClient.auth.getUser();
            const user = data?.user;
            if (!user) return;
            if (!$("lpOwnerName")?.value) {
                $("lpOwnerName").value = user.user_metadata?.full_name || user.user_metadata?.name || "";
            }
            if (!$("lpOwnerPhone")?.value) {
                $("lpOwnerPhone").value = digitsPhone(
                    user.phone || user.user_metadata?.phone || user.user_metadata?.mobile
                );
            }

            let profile = null;
            const full = await window.supabaseClient
                .from("profiles")
                .select("full_name, name, phone, role")
                .eq("id", user.id)
                .maybeSingle();
            if (full.error) {
                const slim = await window.supabaseClient
                    .from("profiles")
                    .select("full_name, name, role")
                    .eq("id", user.id)
                    .maybeSingle();
                profile = slim.data;
            } else {
                profile = full.data;
            }
            if (profile?.full_name && !$("lpOwnerName").value) $("lpOwnerName").value = profile.full_name;
            else if (profile?.name && !$("lpOwnerName").value) $("lpOwnerName").value = profile.name;
            if (!$("lpOwnerPhone").value && profile?.phone) {
                $("lpOwnerPhone").value = digitsPhone(profile.phone);
            }
            if (!$("lpOwnerPhone").value) {
                const { data: listedRows } = await window.supabaseClient
                    .from("buildings")
                    .select("owner_phone, owner_name")
                    .eq("created_by", user.id)
                    .order("created_at", { ascending: false })
                    .limit(1);
                const listed = listedRows?.[0];
                if (listed?.owner_name && !$("lpOwnerName").value) $("lpOwnerName").value = listed.owner_name;
                if (listed?.owner_phone) $("lpOwnerPhone").value = digitsPhone(listed.owner_phone);
            }
            const role = String(profile?.role || localStorage.getItem("roomdhundo_role") || "").toLowerCase();
            if (role === "agent" && !radioValue("lpListedBy")) {
                const broker = document.querySelector('input[name="lpListedBy"][value="Broker / Agent"]');
                if (broker) broker.checked = true;
            } else if ((role === "owner" || role === "admin") && !radioValue("lpListedBy")) {
                const owner = document.querySelector('input[name="lpListedBy"][value="Property Owner"]');
                if (owner) owner.checked = true;
            }
        } catch (error) {
            console.error("Flat contact prefill error:", error);
        }
    }

    function hydrateMeta(property) {
        let meta = null;
        const rules = Array.isArray(property.rules) ? property.rules : [];
        const encoded = rules.find((rule) => String(rule).startsWith("RD_META:"));
        if (encoded) {
            try { meta = JSON.parse(String(encoded).slice(8)); } catch (error) { meta = null; }
        }
        const room = Array.isArray(property.room_types) ? property.room_types[0] : null;
        const details = room?.room_details && typeof room.room_details === "object" ? room.room_details : {};
        meta = { ...(details || {}), ...(meta || {}) };

        const assign = (id, value) => {
            if ($(id) && value != null && value !== "") $(id).value = value;
        };
        const checkRadio = (name, value) => {
            if (!value) return;
            const input = document.querySelector(`input[name="${name}"][value="${CSS.escape(String(value))}"]`);
            if (input) input.checked = true;
        };

        checkRadio("lpFlatType", meta.flat_type || room?.room_type);
        checkRadio("lpPropertyStatus", meta.property_status);
        assign("lpAddress", meta.address);
        assign("lpLocality", meta.locality);
        assign("lpCity", meta.city);
        assign("lpDistrict", meta.district);
        assign("lpState", meta.state);
        assign("lpPostal", meta.postal_code);
        assign("lpLandmark", meta.landmark);
        assign("lpMapsUrl", meta.maps_url);
        assign("lpBedrooms", meta.bedrooms ?? room?.room_people);
        assign("lpBathrooms", meta.bathrooms);
        assign("lpBalconies", meta.balconies);
        assign("lpFloor", meta.floor);
        assign("lpTotalFloors", meta.total_floors);
        assign("lpBuiltUp", meta.built_up ?? details.built_up);
        checkRadio("lpParking", meta.parking);
        assign("lpMonthlyRent", meta.monthly_rent || room?.room_rent || room?.price_value);
        assign("lpDeposit", meta.deposit);
        assign("lpMaintenance", meta.maintenance);
        assign("lpAvailableFrom", meta.available_from);
        checkRadio("lpPets", meta.pets);
        checkRadio("lpListedBy", meta.listed_by);
        (Array.isArray(meta.tenants) ? meta.tenants : []).forEach((tenant) => {
            const input = Array.from(document.querySelectorAll(".lpTenant")).find((el) => el.value === tenant);
            if (input) input.checked = true;
        });
        if (meta.gallery) {
            GALLERY_CATEGORIES.forEach((cat) => {
                gallery[cat.id].existing = Array.isArray(meta.gallery[cat.id]) ? meta.gallery[cat.id].filter(Boolean) : [];
            });
        } else if (Array.isArray(property.images)) {
            gallery.living.existing = property.images.filter(Boolean);
        }
        renderGallery();
        const badge = $("flStatusBadge");
        if (badge) badge.textContent = property.listing_status === "pending" ? "Pending review" : "Editing";
        syncHiddenFields();
    }

    window.applyFlatGalleryUploads = function applyFlatGalleryUploads(map) {
        GALLERY_CATEGORIES.forEach((cat) => {
            gallery[cat.id].existing = Array.isArray(map?.[cat.id]) ? map[cat.id].filter(Boolean) : gallery[cat.id].existing;
            gallery[cat.id].files = [];
        });
    };

    window.collectFlatGalleryMedia = function collectFlatGalleryMedia() {
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

    window.hydrateFlatListing = hydrateMeta;
    window.syncFlatListingHiddenFields = syncHiddenFields;
    window.validateFlatListing = function validateFlatListing() {
        for (let step = 1; step <= 8; step += 1) {
            if (!validateStep(step)) {
                goToStep(step);
                return false;
            }
        }
        return true;
    };

    document.addEventListener("DOMContentLoaded", () => {
        if (!$("flatListingWizard")) return;
        renderGallery();
        prefillContact();
        document.querySelectorAll("[data-fl-goto]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const target = Number(btn.dataset.flGoto);
                if (target > currentStep) {
                    for (let step = currentStep; step < target && step <= 8; step += 1) {
                        if (!validateStep(step)) {
                            goToStep(step);
                            return;
                        }
                    }
                }
                goToStep(target);
            });
        });
        $("flBackBtn")?.addEventListener("click", () => goToStep(currentStep - 1));
        $("flNextBtn")?.addEventListener("click", () => {
            if (currentStep <= 8 && !validateStep(currentStep)) return;
            goToStep(currentStep + 1);
        });
        document.getElementById("flTenantChoices")?.addEventListener("change", (event) => {
            const target = event.target;
            if (!target?.classList?.contains("lpTenant")) return;
            if (target.value === "Anyone" && target.checked) {
                document.querySelectorAll(".lpTenant").forEach((el) => {
                    if (el !== target) el.checked = false;
                });
            } else if (target.value !== "Anyone" && target.checked) {
                const anyone = document.querySelector('.lpTenant[value="Anyone"]');
                if (anyone) anyone.checked = false;
            }
        });
        goToStep(1);
    });
})();
