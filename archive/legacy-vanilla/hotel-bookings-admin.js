(() => {
    const SUPABASE_URL = "https://vyusxdilgwrcgmqqvzsp.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dXN4ZGlsZ3dyY2dtcXF2enNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjYyNTYsImV4cCI6MjEwMjc0MjI1Nn0.X6FbzDad06d5-kj1aK4zQkPSPrrLUW_O7CdfZ-ghwrM";
    const db = typeof supabaseClient !== "undefined"
        ? supabaseClient
        : window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const SEEN_KEY = "rd-admin-hb-seen";
    const PAGE_SIZES = [10, 25, 50];
    const STATUS_LABEL = {
        pending: "Pending",
        confirmed: "Confirmed",
        rejected: "Rejected",
        cancelled: "Cancelled",
        completed: "Completed"
    };

    const state = {
        rows: [],
        filtered: [],
        page: 1,
        pageSize: 10,
        search: "",
        status: "",
        hotel: "",
        checkInFrom: "",
        checkInTo: "",
        sort: "newest",
        stat: "all",
        pauseRefresh: false,
        loading: false,
        error: "",
        lastUpdated: null,
        seenIds: new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || "[]")),
        newIds: new Set(),
        openMenuId: null,
        drawerId: null,
        priceManual: false
    };

    let searchTimer = null;
    let refreshTimer = null;

    const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));

    const dash = (value) => {
        const text = String(value ?? "").trim();
        return text ? text : "—";
    };

    const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

    const shortId = (id) => `#${String(id || "").replace(/-/g, "").slice(0, 4).toUpperCase() || "----"}`;

    const validDate = (value) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const formatDate = (value) => {
        const date = validDate(value);
        if (!date) return "—";
        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    const formatShortDate = (value) => {
        const date = validDate(value);
        if (!date) return "—";
        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    const formatTime = (value) => {
        const date = validDate(value);
        if (!date) return "";
        return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    const toLocalInput = (value) => {
        const date = validDate(value);
        if (!date) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const sameDay = (value, compare = new Date()) => {
        const date = validDate(value);
        if (!date) return false;
        return date.getFullYear() === compare.getFullYear()
            && date.getMonth() === compare.getMonth()
            && date.getDate() === compare.getDate();
    };

    const hotelName = (row) => dash(row.buildings?.name || "Hotel");
    const roomName = (row) => dash(row.room_types?.room_type || "Room");

    const ownerName = (row) => {
        const profileName = row._owner?.full_name || row._owner?.name || "";
        const listed = row.buildings?.owner_name || "";
        if (profileName && profileName !== row.buildings?.name) return profileName;
        if (listed && listed !== row.buildings?.name) return listed;
        return profileName || listed || "—";
    };

    const ownerPhone = (row) => row._owner?.phone || row._owner?.contact_phone || row.buildings?.owner_phone || "";

    const stayUnits = (row, startIso, endIso) => {
        const start = validDate(startIso || row.check_in);
        const end = validDate(endIso || row.check_out);
        if (!start || !end || end <= start) return 1;
        if ((row.booking_mode || "nightly") === "hourly") {
            return Math.max(1, Math.ceil((end - start) / 3600000));
        }
        return Math.max(1, Math.ceil((end - start) / 86400000));
    };

    const stayLabel = (row) => {
        const hourly = (row.booking_mode || "nightly") === "hourly";
        const units = hourly ? (row.hours_count || stayUnits(row)) : (row.nights_count || stayUnits(row));
        const unitWord = hourly
            ? (units === 1 ? "hour" : "hours")
            : (units === 1 ? "night" : "nights");
        return `${formatShortDate(row.check_in)} → ${formatShortDate(row.check_out)} · ${units} ${unitWord}`;
    };

    const phoneHref = (phone) => {
        const digits = String(phone || "").replace(/\D/g, "");
        return digits ? `tel:${digits}` : "";
    };

    const waHref = (phone) => {
        const digits = String(phone || "").replace(/\D/g, "");
        if (!digits) return "";
        const withCountry = digits.length === 10 ? `91${digits}` : digits;
        return `https://wa.me/${withCountry}`;
    };

    const qs = (id) => document.getElementById(id);
    const section = () => qs("hotelBookingsSection");
    const tbody = () => qs("adminHotelBookingsBody");

    function toast(message, type = "success") {
        let wrap = document.querySelector(".hb-toasts");
        if (!wrap) {
            wrap = document.createElement("div");
            wrap.className = "hb-toasts";
            wrap.setAttribute("role", "status");
            document.body.appendChild(wrap);
        }
        const note = document.createElement("div");
        note.className = `hb-toast ${type}`;
        note.textContent = message;
        wrap.appendChild(note);
        setTimeout(() => note.remove(), 3200);
    }

    function closeOverlays() {
        document.querySelector(".hb-drawer-back")?.remove();
        document.querySelector(".hb-drawer")?.remove();
        document.querySelector(".hb-dialog-back")?.remove();
        document.querySelector(".hb-dialog")?.remove();
        state.drawerId = null;
        state.openMenuId = null;
        renderTable();
    }

    function focusables(root) {
        return [...root.querySelectorAll("button, [href], input, select, textarea")].filter((el) => !el.disabled && el.offsetParent !== null);
    }

    function trapFocus(root) {
        const handler = (event) => {
            if (event.key !== "Tab") return;
            const items = focusables(root);
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        root.addEventListener("keydown", handler);
        focusables(root)[0]?.focus();
        return () => root.removeEventListener("keydown", handler);
    }

    // Fetch bookings with the same table used by the existing admin panel.
    async function fetchBookings() {
        const body = tbody();
        if (!body) return;
        state.loading = true;
        state.error = "";
        renderSkeleton();
        const { data: auth } = await db.auth.getUser();
        if (!auth?.user) {
            state.loading = false;
            body.innerHTML = `<tr><td colspan="8">Please log in as an administrator.</td></tr>`;
            return;
        }
        let { data, error } = await db
            .from("hotel_bookings")
            .select("*, buildings(name,owner_name,owner_phone), room_types(room_type,daily_price,hourly_price)")
            .order("created_at", { ascending: false });
        if (error) {
            const fallback = await db
                .from("hotel_bookings")
                .select("*, buildings(name,owner_name,owner_phone), room_types(room_type)")
                .order("created_at", { ascending: false });
            data = fallback.data;
            error = fallback.error;
        }
        if (error) {
            state.loading = false;
            state.error = error.message;
            renderError();
            return;
        }
        const incoming = data || [];
        if (state.rows.length) {
            incoming.forEach((row) => {
                if (row.status === "pending" && !state.seenIds.has(row.id)) state.newIds.add(row.id);
            });
        }
        incoming.forEach((row) => state.seenIds.add(row.id));
        sessionStorage.setItem(SEEN_KEY, JSON.stringify([...state.seenIds]));
        state.rows = incoming;
        await enrichOwners(state.rows);
        state.loading = false;
        state.lastUpdated = new Date();
        fillHotelFilter();
        applyFilters();
        renderAll();
    }

    async function enrichOwners(list) {
        const ids = [...new Set(list.map((row) => row.owner_id).filter(Boolean))];
        if (!ids.length) return;
        const { data, error } = await db.from("profiles").select("*").in("id", ids);
        if (error || !data) return;
        const map = Object.fromEntries(data.map((profile) => [profile.id, profile]));
        list.forEach((row) => {
            row._owner = map[row.owner_id] || null;
        });
    }

    function fillHotelFilter() {
        const select = qs("hbHotelFilter");
        if (!select) return;
        const current = select.value;
        const hotels = [...new Set(state.rows.map((row) => row.buildings?.name).filter(Boolean))].sort();
        select.innerHTML = `<option value="">All hotels</option>${hotels.map((name) => `<option value="${esc(name)}">${esc(name)}</option>`).join("")}`;
        if (hotels.includes(current)) select.value = current;
    }

    // Filter and sort in memory so the original fetch stays unchanged.
    function applyFilters() {
        const query = state.search.trim().toLowerCase();
        let list = state.rows.filter((row) => {
            if (state.status === "closed") {
                if (!["rejected", "cancelled"].includes(row.status)) return false;
            } else if (state.status && row.status !== state.status) return false;
            if (state.stat === "checkin-today" && !sameDay(row.check_in)) return false;
            if (state.stat === "revenue" && row.status !== "confirmed") return false;
            if (state.hotel && (row.buildings?.name || "") !== state.hotel) return false;
            const checkIn = validDate(row.check_in);
            if (state.checkInFrom && checkIn && checkIn < new Date(`${state.checkInFrom}T00:00:00`)) return false;
            if (state.checkInTo && checkIn && checkIn > new Date(`${state.checkInTo}T23:59:59`)) return false;
            if (!query) return true;
            const blob = [
                row.id,
                shortId(row.id),
                row.guest_name,
                row.guest_phone,
                row.buildings?.name,
                row.room_types?.room_type,
                ownerName(row),
                ownerPhone(row)
            ].join(" ").toLowerCase();
            return blob.includes(query);
        });

        list.sort((a, b) => {
            if (state.sort === "checkin") return (validDate(a.check_in) || 0) - (validDate(b.check_in) || 0);
            if (state.sort === "price-high") return Number(b.total_price || 0) - Number(a.total_price || 0);
            if (state.sort === "price-low") return Number(a.total_price || 0) - Number(b.total_price || 0);
            return (validDate(b.created_at) || 0) - (validDate(a.created_at) || 0);
        });

        state.filtered = list;
        const maxPage = Math.max(1, Math.ceil(list.length / state.pageSize) || 1);
        if (state.page > maxPage) state.page = maxPage;
    }

    function renderAll() {
        renderStats();
        renderTable();
        renderPager();
        renderUpdated();
        renderNavBadge();
    }

    function renderStats() {
        const rows = state.rows;
        const set = (id, value) => {
            const el = qs(id);
            if (el) el.textContent = value;
        };
        set("adminHotelBookingTotal", rows.length);
        set("adminHotelBookingPending", rows.filter((row) => row.status === "pending").length);
        set("adminHotelBookingConfirmed", rows.filter((row) => row.status === "confirmed").length);
        set("adminHotelBookingClosed", rows.filter((row) => ["rejected", "cancelled"].includes(row.status)).length);
        set("adminHotelBookingCheckins", rows.filter((row) => sameDay(row.check_in)).length);
        const revenue = rows
            .filter((row) => row.status === "confirmed")
            .reduce((sum, row) => sum + Number(row.total_price || 0), 0);
        set("adminHotelBookingRevenue", money(revenue));
        section()?.querySelectorAll("[data-hb-stat]").forEach((btn) => {
            btn.classList.toggle("is-active", btn.dataset.hbStat === state.stat);
        });
    }

    function renderNavBadge() {
        const badge = qs("adminHotelBookingsNavBadge");
        if (!badge) return;
        const pending = state.rows.filter((row) => row.status === "pending").length;
        badge.hidden = pending < 1;
        badge.textContent = String(pending);
    }

    function renderUpdated() {
        const el = qs("hbLastUpdated");
        if (!el) return;
        if (!state.lastUpdated) {
            el.textContent = "Last updated —";
            return;
        }
        el.textContent = `Last updated ${state.lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    }

    function renderSkeleton() {
        const body = tbody();
        if (!body) return;
        body.innerHTML = Array.from({ length: 6 }, () =>
            `<tr class="hb-skel">${"<td></td>".repeat(8)}</tr>`
        ).join("");
    }

    function renderError() {
        const body = tbody();
        if (!body) return;
        body.innerHTML = `
            <tr><td colspan="8">
                <div class="hb-error">
                    <p>${esc(state.error || "Could not load hotel bookings.")}</p>
                    <button type="button" class="hb-btn hb-btn-primary" data-hb-retry>Retry</button>
                </div>
            </td></tr>`;
    }

    function renderTable() {
        const body = tbody();
        if (!body || state.loading) return;
        if (state.error) {
            renderError();
            return;
        }
        if (!state.filtered.length) {
            body.innerHTML = `<tr><td colspan="8"><div class="hb-empty">No bookings match your filters. Try clearing search or date filters.</div></td></tr>`;
            return;
        }
        const start = (state.page - 1) * state.pageSize;
        const pageRows = state.filtered.slice(start, start + state.pageSize);
        body.innerHTML = pageRows.map((row) => {
            const phone = dash(row.guest_phone);
            const call = phoneHref(row.guest_phone);
            const wa = waHref(row.guest_phone);
            const ownerTel = phoneHref(ownerPhone(row));
            const isNew = state.newIds.has(row.id);
            return `
                <tr data-id="${esc(row.id)}">
                    <td data-label="Booking">
                        <button type="button" class="hb-id" data-copy-id="${esc(row.id)}" title="${esc(row.id)}">${esc(shortId(row.id))}</button>
                        ${isNew ? `<span class="hb-new">New</span>` : ""}
                    </td>
                    <td data-label="Guest">
                        <b>${esc(dash(row.guest_name))}</b>
                        <span class="hb-muted">${esc(phone)}</span>
                        <div class="hb-guest-links">
                            ${call ? `<a class="hb-icon-btn" href="${esc(call)}" aria-label="Call guest">📞</a>` : ""}
                            ${wa ? `<a class="hb-icon-btn" href="${esc(wa)}" target="_blank" rel="noopener" aria-label="WhatsApp guest">💬</a>` : ""}
                        </div>
                    </td>
                    <td data-label="Hotel / Room">
                        <b>${esc(hotelName(row))}</b>
                        <span class="hb-muted">${esc(roomName(row))}</span>
                    </td>
                    <td data-label="Stay">
                        <b>${esc(stayLabel(row))}</b>
                        <span class="hb-muted">${esc(formatTime(row.check_in))} – ${esc(formatTime(row.check_out))}</span>
                    </td>
                    <td data-label="Owner">
                        <b>${esc(ownerName(row))}</b>
                        <span class="hb-muted">${esc(dash(ownerPhone(row)))}</span>
                        ${ownerTel ? `<div class="hb-guest-links"><a class="hb-icon-btn" href="${esc(ownerTel)}" aria-label="Call owner">📞</a></div>` : ""}
                    </td>
                    <td class="hb-num" data-label="Price">
                        <b>${esc(money(row.total_price))}</b>
                        <span class="hb-muted">${esc(money(row.price_per_unit))} / ${(row.booking_mode || "nightly") === "hourly" ? "hour" : "night"}</span>
                    </td>
                    <td data-label="Status"><span class="hb-status ${esc(row.status || "pending")}">${esc(STATUS_LABEL[row.status] || dash(row.status))}</span></td>
                    <td data-label="Actions">
                        <div class="hb-actions">
                            ${row.status === "pending" ? `
                                <button type="button" class="hb-action confirm" data-quick="confirmed" data-id="${esc(row.id)}">Confirm</button>
                                <button type="button" class="hb-action reject" data-quick="rejected" data-id="${esc(row.id)}">Reject</button>
                            ` : ""}
                            <button type="button" class="hb-action" data-edit="${esc(row.id)}">View / Edit</button>
                            <button type="button" class="hb-icon-btn" data-menu="${esc(row.id)}" aria-label="More actions">⋯</button>
                            ${state.openMenuId === row.id ? `
                                <div class="hb-menu" role="menu">
                                    ${row.status !== "cancelled" && row.status !== "rejected" ? `<button type="button" data-quick="cancelled" data-id="${esc(row.id)}">Cancel</button>` : ""}
                                    <button type="button" data-copy-details="${esc(row.id)}">Copy details</button>
                                    ${call ? `<a href="${esc(call)}">Contact guest</a>` : `<button type="button" disabled>Contact guest</button>`}
                                    ${ownerTel ? `<a href="${esc(ownerTel)}">Contact owner</a>` : `<button type="button" disabled>Contact owner</button>`}
                                </div>
                            ` : ""}
                        </div>
                    </td>
                </tr>`;
        }).join("");
    }

    function renderPager() {
        const pager = qs("hbPager");
        if (!pager) return;
        const total = state.filtered.length;
        if (!total) {
            pager.hidden = true;
            return;
        }
        pager.hidden = false;
        const pages = Math.max(1, Math.ceil(total / state.pageSize));
        pager.innerHTML = `
            <span>Showing ${Math.min(total, (state.page - 1) * state.pageSize + 1)}–${Math.min(total, state.page * state.pageSize)} of ${total}</span>
            <div class="hb-pager-btns">
                <button type="button" class="hb-btn" data-page="prev" ${state.page <= 1 ? "disabled" : ""}>Prev</button>
                <span>Page ${state.page} / ${pages}</span>
                <button type="button" class="hb-btn" data-page="next" ${state.page >= pages ? "disabled" : ""}>Next</button>
                <select id="hbPageSize" aria-label="Rows per page">
                    ${PAGE_SIZES.map((size) => `<option value="${size}" ${size === state.pageSize ? "selected" : ""}>${size} / page</option>`).join("")}
                </select>
            </div>`;
    }

    async function persistUpdate(id, patch) {
        const { data: auth } = await db.auth.getUser();
        const { error } = await db.from("hotel_bookings").update({
            ...patch,
            updated_by: auth?.user?.id
        }).eq("id", id);
        return error;
    }

    async function optimisticStatus(id, status, extra = {}) {
        const row = state.rows.find((item) => item.id === id);
        if (!row) return;
        const previous = { ...row };
        Object.assign(row, { status, ...extra });
        applyFilters();
        renderAll();
        const error = await persistUpdate(id, { status, ...extra });
        if (error) {
            Object.assign(row, previous);
            applyFilters();
            renderAll();
            toast(`Could not update booking: ${error.message}`, "error");
            return false;
        }
        toast(`Booking ${STATUS_LABEL[status] || status}.`);
        return true;
    }

    function confirmDialog({ title, message, askReason = false, confirmLabel = "Confirm" }) {
        return new Promise((resolve) => {
            document.querySelector(".hb-dialog")?.remove();
            document.querySelector(".hb-dialog-back")?.remove();
            const back = document.createElement("div");
            back.className = "hb-dialog-back";
            const dialog = document.createElement("div");
            dialog.className = "hb-dialog";
            dialog.innerHTML = `
                <div class="hb-dialog-card" role="dialog" aria-modal="true" aria-labelledby="hbDialogTitle">
                    <h3 id="hbDialogTitle">${esc(title)}</h3>
                    <p>${esc(message)}</p>
                    ${askReason ? `<label>Reason (optional)<textarea id="hbDialogReason" rows="3"></textarea></label>` : ""}
                    <div class="hb-dialog-actions">
                        <button type="button" class="hb-btn" data-cancel>Cancel</button>
                        <button type="button" class="hb-btn hb-btn-primary" data-ok>${esc(confirmLabel)}</button>
                    </div>
                </div>`;
            document.body.append(back, dialog);
            const release = trapFocus(dialog);
            const finish = (value) => {
                release();
                back.remove();
                dialog.remove();
                resolve(value);
            };
            dialog.querySelector("[data-cancel]").addEventListener("click", () => finish(null));
            back.addEventListener("click", () => finish(null));
            dialog.querySelector("[data-ok]").addEventListener("click", () => {
                finish({ reason: qs("hbDialogReason")?.value.trim() || "" });
            });
        });
    }

    async function handleQuickStatus(id, status) {
        const labels = {
            confirmed: { title: "Confirm booking", message: "Mark this booking as confirmed?", confirmLabel: "Confirm" },
            rejected: { title: "Reject booking", message: "Reject this booking request?", askReason: true, confirmLabel: "Reject" },
            cancelled: { title: "Cancel booking", message: "Cancel this booking?", askReason: true, confirmLabel: "Cancel booking" }
        };
        const choice = await confirmDialog(labels[status] || { title: "Update status", message: `Set status to ${status}?` });
        if (!choice) return;
        const extra = {};
        if (choice.reason) extra.admin_note = choice.reason;
        await optimisticStatus(id, status, extra);
    }

    function copyText(text) {
        navigator.clipboard.writeText(text).then(
            () => toast("Copied."),
            () => toast("Could not copy.", "error")
        );
    }

    function detailsText(row) {
        return [
            `Booking ${shortId(row.id)} (${row.id})`,
            `Guest: ${dash(row.guest_name)} · ${dash(row.guest_phone)}`,
            `Hotel: ${hotelName(row)} · ${roomName(row)}`,
            `Stay: ${stayLabel(row)}`,
            `Owner: ${ownerName(row)} · ${dash(ownerPhone(row))}`,
            `Price: ${money(row.total_price)}`,
            `Status: ${STATUS_LABEL[row.status] || row.status}`
        ].join("\n");
    }

    async function overlappingConfirmed(row, startIso, endIso) {
        const { data, error } = await db
            .from("hotel_bookings")
            .select("id, check_in, check_out, status")
            .eq("room_type_id", row.room_type_id)
            .eq("status", "confirmed")
            .neq("id", row.id);
        if (error || !data) return [];
        const start = validDate(startIso);
        const end = validDate(endIso);
        return data.filter((item) => {
            const otherStart = validDate(item.check_in);
            const otherEnd = validDate(item.check_out);
            return start && end && otherStart && otherEnd && start < otherEnd && otherStart < end;
        });
    }

    function openDrawer(id) {
        const row = state.rows.find((item) => item.id === id);
        if (!row) return;
        closeOverlays();
        state.drawerId = id;
        state.priceManual = false;
        const hourly = (row.booking_mode || "nightly") === "hourly";
        const computed = stayUnits(row) * Number(row.price_per_unit || 0);
        const back = document.createElement("div");
        back.className = "hb-drawer-back";
        const drawer = document.createElement("div");
        drawer.className = "hb-drawer";
        drawer.setAttribute("role", "dialog");
        drawer.setAttribute("aria-modal", "true");
        drawer.innerHTML = `
            <div class="hb-drawer-head">
                <div>
                    <h2>Booking ${esc(shortId(row.id))}</h2>
                    <p class="hb-muted">${esc(STATUS_LABEL[row.status] || dash(row.status))}</p>
                </div>
                <button type="button" class="hb-btn" data-close-drawer aria-label="Close booking details">Close</button>
            </div>
            <dl>
                <dt>Guest</dt><dd>${esc(dash(row.guest_name))}<br>${esc(dash(row.guest_phone))}</dd>
                <dt>Owner</dt><dd>${esc(ownerName(row))}<br>${esc(dash(ownerPhone(row)))}</dd>
                <dt>Hotel / Room</dt><dd>${esc(hotelName(row))}<br>${esc(roomName(row))}</dd>
                <dt>Stay</dt><dd>${esc(stayLabel(row))}</dd>
                <dt>Guests</dt><dd>${esc(dash(row.guest_count))}</dd>
                <dt>Created</dt><dd>${esc(formatDate(row.created_at))} ${esc(formatTime(row.created_at))}</dd>
                <dt>Price</dt><dd>${esc(money(row.total_price))} · ${esc(money(row.price_per_unit))} / ${hourly ? "hour" : "night"}</dd>
            </dl>
            <form class="hb-form" id="hbDrawerForm">
                <label>Status
                    <select name="status">
                        ${Object.keys(STATUS_LABEL).map((status) => `<option value="${status}" ${row.status === status ? "selected" : ""}>${STATUS_LABEL[status]}</option>`).join("")}
                    </select>
                </label>
                <label>Check-in
                    <input name="check_in" type="datetime-local" value="${esc(toLocalInput(row.check_in))}" required>
                </label>
                <label>Check-out
                    <input name="check_out" type="datetime-local" value="${esc(toLocalInput(row.check_out))}" required>
                </label>
                <label>Total price (₹)
                    <input name="total_price" type="number" min="0" step="1" value="${esc(Number(row.total_price || 0))}">
                </label>
                <p class="hb-note" id="hbManualNote" hidden>Price was manually edited.</p>
                <label>Admin note
                    <textarea name="admin_note" rows="3">${esc(row.admin_note || "")}</textarea>
                </label>
                <div class="hb-drawer-actions">
                    <button type="button" class="hb-btn" data-close-drawer>Cancel</button>
                    <button type="submit" class="hb-btn hb-btn-primary" id="hbDrawerSave">Save</button>
                </div>
            </form>`;
        document.body.append(back, drawer);
        const release = trapFocus(drawer);
        const form = qs("hbDrawerForm");
        const totalInput = form.querySelector("[name=total_price]");
        const startInput = form.querySelector("[name=check_in]");
        const endInput = form.querySelector("[name=check_out]");
        const note = qs("hbManualNote");
        const recalc = () => {
            if (state.priceManual) return;
            const units = stayUnits(row, startInput.value, endInput.value);
            totalInput.value = String(units * Number(row.price_per_unit || 0));
        };
        totalInput.addEventListener("input", () => {
            const units = stayUnits(row, startInput.value, endInput.value);
            const auto = units * Number(row.price_per_unit || 0);
            state.priceManual = Number(totalInput.value) !== auto;
            note.hidden = !state.priceManual;
        });
        startInput.addEventListener("change", recalc);
        endInput.addEventListener("change", recalc);
        if (Number(row.total_price || 0) !== computed) {
            state.priceManual = true;
            note.hidden = false;
        }
        const close = () => {
            release();
            closeOverlays();
        };
        drawer.querySelectorAll("[data-close-drawer]").forEach((btn) => btn.addEventListener("click", close));
        back.addEventListener("click", close);
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const start = new Date(startInput.value);
            const end = new Date(endInput.value);
            const total = Number(totalInput.value);
            if (!(end > start)) {
                toast("Check-out must be after check-in.", "error");
                return;
            }
            if (!Number.isFinite(total) || total < 0) {
                toast("Price must be 0 or more.", "error");
                return;
            }
            const overlaps = await overlappingConfirmed(row, start.toISOString(), end.toISOString());
            if (overlaps.length) {
                const proceed = await confirmDialog({
                    title: "Overlapping stay",
                    message: "This room already has a confirmed booking in that window. Save anyway?",
                    confirmLabel: "Save anyway"
                });
                if (!proceed) return;
            }
            const saveBtn = qs("hbDrawerSave");
            saveBtn.disabled = true;
            saveBtn.textContent = "Saving...";
            const hourlyMode = (row.booking_mode || "nightly") === "hourly";
            const units = stayUnits(row, startInput.value, endInput.value);
            const patch = {
                status: form.status.value,
                check_in: start.toISOString(),
                check_out: end.toISOString(),
                total_price: total,
                hours_count: hourlyMode ? units : null,
                nights_count: hourlyMode ? null : units,
                admin_note: form.admin_note.value.trim() || null
            };
            const error = await persistUpdate(row.id, patch);
            saveBtn.disabled = false;
            saveBtn.textContent = "Save";
            if (error) {
                toast(`Could not save: ${error.message}`, "error");
                return;
            }
            Object.assign(row, patch);
            toast("Booking updated.");
            close();
            applyFilters();
            renderAll();
        });
    }

    function exportCsv() {
        const header = ["id", "guest_name", "guest_phone", "hotel", "room", "check_in", "check_out", "owner_name", "owner_phone", "total_price", "status"];
        const lines = [header.join(",")];
        state.filtered.forEach((row) => {
            const values = [
                row.id,
                row.guest_name,
                row.guest_phone,
                hotelName(row),
                roomName(row),
                row.check_in,
                row.check_out,
                ownerName(row),
                ownerPhone(row),
                row.total_price,
                row.status
            ].map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`);
            lines.push(values.join(","));
        });
        const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "hotel-bookings.csv";
        link.click();
        URL.revokeObjectURL(url);
        toast("CSV exported.");
    }

    function readToolbar() {
        state.search = qs("hbSearch")?.value || "";
        state.status = qs("hbStatusFilter")?.value || "";
        state.hotel = qs("hbHotelFilter")?.value || "";
        state.checkInFrom = qs("hbCheckInFrom")?.value || "";
        state.checkInTo = qs("hbCheckInTo")?.value || "";
        state.sort = qs("hbSort")?.value || "newest";
        state.page = 1;
        applyFilters();
        renderAll();
    }

    function wire() {
        const root = section();
        if (!root) return;
        qs("refreshAdminHotelBookings")?.addEventListener("click", fetchBookings);
        qs("hbClearFilters")?.addEventListener("click", () => {
            ["hbSearch", "hbStatusFilter", "hbHotelFilter", "hbCheckInFrom", "hbCheckInTo", "hbSort"].forEach((id) => {
                const el = qs(id);
                if (!el) return;
                el.value = id === "hbSort" ? "newest" : "";
            });
            state.stat = "all";
            readToolbar();
        });
        qs("hbExportCsv")?.addEventListener("click", exportCsv);
        qs("hbPauseRefresh")?.addEventListener("change", (event) => {
            state.pauseRefresh = event.target.checked;
        });
        qs("hbSearch")?.addEventListener("input", () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(readToolbar, 250);
        });
        ["hbStatusFilter", "hbHotelFilter", "hbCheckInFrom", "hbCheckInTo", "hbSort"].forEach((id) => {
            qs(id)?.addEventListener("change", readToolbar);
        });
        root.addEventListener("click", (event) => {
            const retry = event.target.closest("[data-hb-retry]");
            if (retry) fetchBookings();
            const stat = event.target.closest("[data-hb-stat]");
            if (stat) {
                state.stat = stat.dataset.hbStat;
                state.status = stat.dataset.hbStat === "closed"
                    ? "closed"
                    : ["pending", "confirmed"].includes(stat.dataset.hbStat)
                        ? stat.dataset.hbStat
                        : "";
                if (qs("hbStatusFilter")) qs("hbStatusFilter").value = ["pending", "confirmed"].includes(state.status) ? state.status : "";
                state.page = 1;
                applyFilters();
                renderAll();
            }
            const copyId = event.target.closest("[data-copy-id]");
            if (copyId) copyText(copyId.dataset.copyId);
            const edit = event.target.closest("[data-edit]");
            if (edit) openDrawer(edit.dataset.edit);
            const quick = event.target.closest("[data-quick]");
            if (quick) handleQuickStatus(quick.dataset.id, quick.dataset.quick);
            const menu = event.target.closest("[data-menu]");
            if (menu) {
                state.openMenuId = state.openMenuId === menu.dataset.menu ? null : menu.dataset.menu;
                renderTable();
            }
            const details = event.target.closest("[data-copy-details]");
            if (details) {
                const row = state.rows.find((item) => item.id === details.dataset.copyDetails);
                if (row) copyText(detailsText(row));
            }
            const pageBtn = event.target.closest("[data-page]");
            if (pageBtn) {
                const pages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
                state.page += pageBtn.dataset.page === "next" ? 1 : -1;
                state.page = Math.min(pages, Math.max(1, state.page));
                renderTable();
                renderPager();
            }
        });
        root.addEventListener("change", (event) => {
            if (event.target.id === "hbPageSize") {
                state.pageSize = Number(event.target.value) || 10;
                state.page = 1;
                applyFilters();
                renderAll();
            }
        });
        document.addEventListener("click", (event) => {
            if (!event.target.closest("[data-menu], .hb-menu")) {
                if (state.openMenuId) {
                    state.openMenuId = null;
                    renderTable();
                }
            }
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeOverlays();
            if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) {
                event.preventDefault();
                qs("hbSearch")?.focus();
            }
        });
        document.querySelectorAll('.admin-nav .nav-item[data-section="hotel-bookings"]').forEach((btn) => {
            btn.addEventListener("click", fetchBookings);
        });
        db.auth.onAuthStateChange(() => setTimeout(fetchBookings, 250));
        refreshTimer = setInterval(() => {
            if (state.pauseRefresh || document.hidden || state.drawerId) return;
            fetchBookings();
        }, 60000);
        setTimeout(fetchBookings, 400);
    }

    document.addEventListener("DOMContentLoaded", wire);
})();
