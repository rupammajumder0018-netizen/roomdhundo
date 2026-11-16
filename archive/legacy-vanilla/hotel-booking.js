(() => {
  const URL = "https://vyusxdilgwrcgmqqvzsp.supabase.co";
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dXN4ZGlsZ3dyY2dtcXF2enNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjYyNTYsImV4cCI6MjEwMjc0MjI1Nn0.X6FbzDad06d5-kj1aK4zQkPSPrrLUW_O7CdfZ-ghwrM";
  const db = window.supabaseClient || window.supabase.createClient(URL, KEY);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
  const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
  const BREAKFAST_FEE = 300;
  let refreshQuote = () => {};
  const MEAL_NAMES = ["breakfast", "lunch", "dinner"];
  function hourlyOffer(room) {
    const details = room?.room_details && typeof room.room_details === "object" ? room.room_details : {};
    const hourly = details.hourly && typeof details.hourly === "object" ? details.hourly : {};
    const price = Number(hourly.pricePerHour || room?.hourly_price || 0);
    const hours = Array.isArray(hourly.hours) && hourly.hours.length
      ? hourly.hours.map(Number).filter((n) => n > 0)
      : (price > 0 ? [3, 6, 12, 24] : []);
    return {
      enabled: hourly.enabled !== false && price > 0 && hours.length > 0,
      price,
      hours
    };
  }
  const dateValue = (d) => {
    const x = new Date(d);
    return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const datePart = (d) => dateValue(d).slice(0, 10);
  const timePart = (d) => dateValue(d).slice(11, 16);
  const fromParts = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr || "12:00"}`);

  let user;
  let hotel;
  let rooms = [];
  let selectedRoom = null;
  let selectedMeals = [];
  let loadPromise = null;
  let authWired = false;

  async function readSignedInUser() {
    if (typeof window.getSignedInUser === "function") {
      return window.getSignedInUser();
    }
    const session = (await db.auth.getSession()).data.session;
    if (session?.user) return session.user;
    const { data } = await db.auth.getUser();
    return data?.user || null;
  }

  function updateBookingButton() {
    const submit = document.querySelector("#hotelBookingForm .hotel-booking-submit");
    if (!submit) return;
    submit.disabled = false;
    submit.textContent = user ? "Book now" : "Log in to book";
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("roomdhundo:hotel-page", init);
  window.initHotelStay = init;

  async function init(buildingFromPage) {
    const fromPage = buildingFromPage && buildingFromPage.detail && buildingFromPage.detail.building
      ? buildingFromPage.detail.building
      : (buildingFromPage && buildingFromPage.room_types ? buildingFromPage : null);

    if (fromPage && String(fromPage.type).toLowerCase() === "hotel") {
      hotel = fromPage;
      rooms = fromPage.room_types || [];
    }

    if (!document.getElementById("roomTypesList") && !document.getElementById("hotelStayRooms")) return;

    user = await readSignedInUser();
    if (!authWired) {
      authWired = true;
      db.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") user = null;
        else if (session?.user) user = session.user;
        updateBookingButton();
      });
      window.addEventListener("roomdhundo:auth-changed", async () => {
        user = await readSignedInUser();
        updateBookingButton();
      });
    }

    if (!hotel) {
      const id = new URLSearchParams(location.search).get("id");
      if (!id) return;
      if (!loadPromise) {
        loadPromise = db.from("buildings").select("id,name,type,created_by,facility_tags,facilities,images,rules,hotel_meta,room_types(*)").eq("id", id).single();
      }
      const { data: building, error } = await loadPromise;
      if (error || !building || String(building.type).toLowerCase() !== "hotel") return;
      hotel = building;
      rooms = building.room_types || [];
    }

    if (selectedRoomId()) renderRoomPageBooking();
    else renderStay();
    updateBookingButton();
  }

  function selectedRoomId() {
    return new URLSearchParams(location.search).get("room");
  }

  function openRoomPage(room) {
    if (!hotel?.id || !room?.id) return;
    window.location.href = `property.html?id=${encodeURIComponent(hotel.id)}&room=${encodeURIComponent(room.id)}`;
  }

  function ensureSidebarFormMount() {
    let mount = document.getElementById("hotelBookingFormMount");
    if (mount) return mount;
    const card = document.querySelector(".booking-card");
    if (!card) return null;
    card.classList.add("hotel-room-booking-card");
    mount = document.createElement("div");
    mount.id = "hotelBookingFormMount";
    const contact = document.getElementById("contactOwnerBtn");
    if (contact) card.insertBefore(mount, contact);
    else card.appendChild(mount);
    return mount;
  }

  function hotelMeta() {
    if (typeof window.listingMetaFromBuilding === "function") return window.listingMetaFromBuilding(hotel) || {};
    return hotel?.hotel_meta && typeof hotel.hotel_meta === "object" ? hotel.hotel_meta : {};
  }

  function hasMeal(meal) {
    if (typeof window.hotelHasMeal === "function") return window.hotelHasMeal(hotel, meal);
    const tags = (hotel?.facility_tags || []).map((tag) => String(tag).toLowerCase());
    const labels = (hotel?.facilities || []).map((label) => String(label).toLowerCase());
    return tags.includes(`meal-${meal}`) || tags.includes(meal) || labels.includes(meal);
  }

  function mealPrice(meal) {
    if (typeof window.hotelMealPrice === "function") return window.hotelMealPrice(hotel, meal);
    const amount = Number(hotelMeta()?.meal_prices?.[meal]);
    if (Number.isFinite(amount) && amount >= 0) return amount;
    return meal === "breakfast" && hasMeal("breakfast") ? BREAKFAST_FEE : 0;
  }

  function paidMeals() {
    return MEAL_NAMES.filter((meal) => hasMeal(meal) && mealPrice(meal) > 0);
  }

  function includedMeals() {
    return MEAL_NAMES.filter((meal) => hasMeal(meal) && mealPrice(meal) <= 0);
  }

  function mealLabel(meal) {
    return meal.charAt(0).toUpperCase() + meal.slice(1);
  }

  function selectedMealText() {
    if (!selectedMeals.length) {
      const included = includedMeals();
      return included.length ? `Room only · ${included.map(mealLabel).join(", ")} included` : "Room only";
    }
    return selectedMeals.map((meal) => `${mealLabel(meal)} (+${money(mealPrice(meal))} + taxes)`).join(", ");
  }

  function wireBoardPills(root) {
    root.querySelectorAll("[data-board]:not(:disabled)").forEach((btn) => {
      btn.addEventListener("click", () => {
        const meal = btn.dataset.board;
        if (meal === "room-only") {
          selectedMeals = [];
        } else if (selectedMeals.includes(meal)) {
          selectedMeals = selectedMeals.filter((item) => item !== meal);
        } else {
          selectedMeals = [...selectedMeals, meal];
        }
        root.querySelectorAll("[data-board]").forEach((el) => {
          const on = el.dataset.board === "room-only" ? selectedMeals.length === 0 : selectedMeals.includes(el.dataset.board);
          el.classList.toggle("is-active", on);
          const small = el.querySelector("small");
          if (small && el.dataset.board === "room-only") small.textContent = on ? "Selected" : "";
        });
        document.querySelectorAll(".hotel-room-board-label").forEach((el) => {
          el.textContent = selectedMealText();
        });
        refreshQuote();
      });
    });
  }

  function boardPillsHtml() {
    const paid = paidMeals();
    const included = includedMeals();
    const includedNote = included.length
      ? `<p class="hotel-booking-notice">${included.map(mealLabel).join(", ")} included in the room rate.</p>`
      : "";
    if (!paid.length) {
      selectedMeals = [];
      return `<button type="button" class="hotel-board-pill is-active" data-board="room-only">Room only<br><small>${included.length ? "Meals included" : "No extra meals"}</small></button>${includedNote}`;
    }
    selectedMeals = selectedMeals.filter((meal) => paid.includes(meal));
    const mealButtons = paid.map((meal) => `
        <button type="button" class="hotel-board-pill${selectedMeals.includes(meal) ? " is-active" : ""}" data-board="${meal}">${esc(mealLabel(meal))}<br><span class="hotel-board-extra">+${money(mealPrice(meal))} + taxes</span></button>
    `).join("");
    return `
        <button type="button" class="hotel-board-pill${selectedMeals.length ? "" : " is-active"}" data-board="room-only">Room only<br><small>Selected</small></button>
        ${mealButtons}
        ${includedNote}
    `;
  }

  function roomTaxInfo(room) {
    const tax = String(room?.room_details?.tax || "inclusive").toLowerCase();
    if (tax === "gst-12") return { mode: "exclusive", rate: 0.12, label: "GST 12%" };
    if (tax === "gst-18") return { mode: "exclusive", rate: 0.18, label: "GST 18%" };
    if (tax === "exclusive") return { mode: "exclusive", rate: 0.18, label: "GST 18%" };
    return { mode: "inclusive", rate: 0.18, label: "GST 18%" };
  }

  function quoteStay({ hourly, units, rate }) {
    const roomSubtotal = Number(rate || 0) * Number(units || 0);
    const mealUnits = hourly ? 1 : Number(units || 0);
    const mealLines = selectedMeals.map((meal) => {
      const fee = mealPrice(meal);
      return { meal, fee, units: mealUnits, total: fee * mealUnits };
    }).filter((line) => line.fee > 0);
    const mealsTotal = mealLines.reduce((sum, line) => sum + line.total, 0);
    const breakfastLine = mealLines.find((line) => line.meal === "breakfast");
    const taxInfo = roomTaxInfo(selectedRoom);
    let taxable = 0;
    if (taxInfo.mode === "exclusive") taxable = roomSubtotal + mealsTotal;
    else taxable = mealsTotal;
    const taxAmount = Math.round(taxable * taxInfo.rate);
    const total = roomSubtotal + mealsTotal + taxAmount;
    return {
      hourly,
      units,
      rate,
      roomSubtotal,
      breakfast: breakfastLine ? breakfastLine.total : 0,
      breakfastUnits: breakfastLine ? breakfastLine.units : 0,
      mealLines,
      mealsTotal,
      taxAmount,
      taxLabel: taxInfo.label,
      taxMode: taxInfo.mode,
      total
    };
  }

  function renderRoomPageBooking() {
    document.getElementById("hotelBookingSection")?.remove();
    const roomId = selectedRoomId();
    selectedRoom = rooms.find((room) => String(room.id) === String(roomId)) || null;
    const wrap = ensureSidebarFormMount();
    if (!wrap) return;
    if (!selectedRoom) {
      wrap.innerHTML = `<p class="hotel-booking-notice">This room is no longer listed. Go back and pick another room.</p>`;
      return;
    }
    wrap.innerHTML = `
      <div class="hotel-board-pills hotel-board-pills-compact">${boardPillsHtml()}</div>
      <div id="hotelBookingFormInner"></div>
    `;
    wireBoardPills(wrap);
    renderForm();
  }

  function hasBreakfast() {
    if (typeof window.hotelHasBreakfast === "function") return window.hotelHasBreakfast(hotel);
    const tags = (hotel.facility_tags || []).map((tag) => String(tag).toLowerCase());
    const labels = (hotel.facilities || []).map((label) => String(label).toLowerCase());
    if (tags.includes("room-only") && !tags.includes("meal-breakfast") && !tags.includes("breakfast")) return false;
    return tags.includes("meal-breakfast") || tags.includes("breakfast") || labels.includes("breakfast");
  }

  function renderStay() {
    document.getElementById("hotelBookingSection")?.remove();
    const mount = document.getElementById("hotelStayRooms");
    const boardMount = document.getElementById("hotelBoardMount");
    const section = mount || document.createElement("section");
    if (!mount) {
      section.className = "hotel-booking-wrap";
      section.id = "hotelBookingSection";
      const roomList = document.getElementById("roomTypesList");
      roomList?.closest(".property-section")?.after(section)
        || document.querySelector(".property-main-content")?.prepend(section);
    }

    const pills = boardPillsHtml();
    if (boardMount) boardMount.innerHTML = pills;
    section.innerHTML = `
      ${boardMount ? "" : `<h2>Select room and board type</h2><div class="hotel-board-pills">${pills}</div>`}
      <div class="hotel-room-pick" id="hotelRoomOptions"></div>
    `;
    wireBoardPills(boardMount || section);

    const grid = section.querySelector("#hotelRoomOptions");
    const hotelPhotos = Array.isArray(hotel.images) ? hotel.images.filter(Boolean) : [];

    rooms.forEach((room) => {
      const canBook = Number(room.available_rooms ?? 0) > 0 && String(room.availability || "").toLowerCase() !== "occupied";
      const roomPhotos = Array.isArray(room.images) ? room.images.filter(Boolean) : [];
      const photo = roomPhotos[0] || hotelPhotos[0];
      const card = document.createElement("article");
      card.className = `hotel-room-pick-card${canBook ? "" : " is-unavailable"}`;
      card.innerHTML = `
        <div class="hotel-room-pick-photo">
          ${photo
            ? `<img src="${esc(photo)}" alt="${esc(room.room_type)}">`
            : `<div class="image-placeholder">No photos provided by the hotel</div>`}
          ${roomPhotos.length > 1 ? `<span class="hotel-room-photo-count">${roomPhotos.length} photos</span>` : ""}
        </div>
        <div class="hotel-room-pick-body">
          <h3>${esc(room.room_type || "Room")}</h3>
          ${canBook && Number(room.available_rooms) <= 5
            ? `<p class="hotel-room-left">Only ${Number(room.available_rooms)} room${Number(room.available_rooms) === 1 ? "" : "s"} left</p>`
            : ""}
          <ul class="hotel-package-facts">
            <li class="hotel-room-board-label">${esc(selectedMealText())}</li>
            <li>${Number(room.max_guests || room.room_people || 2)} guests</li>
            <li>${canBook ? `${Number(room.available_rooms)} available` : "Currently unavailable"}</li>
          </ul>
          <strong>${money(room.daily_price || room.hourly_price || room.price_value)} ${room.daily_price ? "/ night" : hourlyOffer(room).enabled ? "/ hour" : ""}</strong>
          ${hourlyOffer(room).enabled ? `<small>Hourly: ${hourlyOffer(room).hours.map((h) => `${h} hrs`).join(", ")}</small>` : ""}
          <button type="button" class="hotel-room-select">View photos & book</button>
        </div>
      `;
      card.addEventListener("click", () => openRoomPage(room));
      grid.append(card);
    });

    if (!rooms.length) {
      const empty = document.createElement("p");
      empty.textContent = "All room categories are currently unavailable. Please check again later.";
      grid.append(empty);
    }
  }

  function renderForm() {
    const mount = document.getElementById("hotelBookingFormInner") || document.getElementById("hotelBookingFormMount");
    if (!selectedRoom || !mount) return;
    const startDefault = new Date(Date.now() + 3600000);
    const endDefault = new Date(startDefault.getTime() + 86400000);
    mount.innerHTML = `
      <h3>Booking details</h3>
      <form class="hotel-booking-form" id="hotelBookingForm">
        <label>Stay type
          <select id="hbMode">
            <option value="nightly">Book by night</option>
            ${hourlyOffer(selectedRoom).enabled ? `<option value="hourly">Book by hour</option>` : ""}
          </select>
        </label>
        <label>Guests
          <input id="hbGuests" type="number" inputmode="numeric" min="1" max="${Number(selectedRoom.max_guests || selectedRoom.room_people || 2)}" value="1" required>
        </label>
        <div class="hotel-booking-datetime full" id="hbStartWrap">
          <label>Check-in date
            <input id="hbStartDate" type="date" min="${datePart(new Date())}" value="${datePart(startDefault)}" required>
          </label>
          <label>Check-in time
            <input id="hbStartTime" type="time" value="${timePart(startDefault)}" required>
          </label>
        </div>
        <div class="hotel-booking-datetime full" id="hbEndWrap">
          <label>Check-out date
            <input id="hbEndDate" type="date" value="${datePart(endDefault)}" required>
          </label>
          <label>Check-out time
            <input id="hbEndTime" type="time" value="${timePart(endDefault)}" required>
          </label>
        </div>
        <label id="hbHoursWrap" class="full" hidden>Number of hours
          <select id="hbHours">
            ${hourlyOffer(selectedRoom).hours.map((hours) => `<option value="${hours}">${hours} hours · ${money(hourlyOffer(selectedRoom).price * hours)}</option>`).join("")}
          </select>
        </label>
        <label class="full">Your full name
          <input id="hbName" autocomplete="name" value="${esc(user?.user_metadata?.full_name || "")}" required>
        </label>
        <label class="full">Phone number
          <input id="hbPhone" type="tel" inputmode="tel" autocomplete="tel" pattern="[0-9+ ]{10,15}" required placeholder="Your contact number">
        </label>
        <div class="hotel-total full" id="hbTotal"></div>
        <p class="hotel-booking-notice full">This is a booking request. The owner confirms it after review.</p>
        <button class="hotel-booking-submit full" type="submit">${user ? "Book now" : "Log in to book"}</button>
      </form>
    `;

    const form = mount.querySelector("form");
    const mode = form.querySelector("#hbMode");
    const startDate = form.querySelector("#hbStartDate");
    const startTime = form.querySelector("#hbStartTime");
    const endDate = form.querySelector("#hbEndDate");
    const endTime = form.querySelector("#hbEndTime");
    const hoursWrap = form.querySelector("#hbHoursWrap");
    const endWrap = form.querySelector("#hbEndWrap");

    function startAtDate() {
      return fromParts(startDate.value, startTime.value);
    }
    function endAtDate() {
      return fromParts(endDate.value, endTime.value);
    }

    function calc() {
      const hourly = mode.value === "hourly";
      endWrap.hidden = hourly;
      hoursWrap.hidden = !hourly;
      hoursWrap.style.display = hourly ? "grid" : "none";
      const startAt = startAtDate();
      const endAt = endAtDate();
      const units = hourly
        ? Number(form.querySelector("#hbHours").value)
        : Math.max(1, Math.ceil((endAt - startAt) / 86400000));
      const rate = Number(hourly ? hourlyOffer(selectedRoom).price : selectedRoom.daily_price);
      const quote = quoteStay({ hourly, units, rate });
      const unitLabel = hourly ? "hours" : "nights";
      const taxLine = quote.taxMode === "inclusive" && quote.mealsTotal
        ? `${quote.taxLabel} on meals: ${money(quote.taxAmount)}`
        : quote.taxMode === "exclusive"
          ? `${quote.taxLabel}: ${money(quote.taxAmount)}`
          : `${quote.taxLabel}: ${money(0)} (included in room rate)`;
      const mealHtml = quote.mealLines.length
        ? quote.mealLines.map((line) => `<div>${esc(mealLabel(line.meal))}: ${money(line.total)}${line.units > 1 ? ` (${money(line.fee)} × ${line.units} ${unitLabel})` : ""}</div>`).join("")
        : `<div>Meals: ${money(0)}</div>`;
      form.querySelector("#hbTotal").innerHTML = `
        <div class="hotel-total-breakdown">
          <div>Room: ${money(quote.roomSubtotal)} (${money(quote.rate)} × ${quote.units} ${unitLabel})</div>
          ${mealHtml}
          <div>${taxLine}</div>
          <div class="hotel-total-pay">Payable total: ${money(quote.total)}</div>
        </div>`;
      return quote;
    }

    refreshQuote = calc;
    mode.addEventListener("change", calc);
    ["input", "change"].forEach((evt) => {
      [startDate, startTime, endDate, endTime, form.querySelector("#hbHours")].filter(Boolean).forEach((el) => el.addEventListener(evt, calc));
    });
    calc();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      user = user || await readSignedInUser();
      if (!user) {
        alert("Please log in first, then submit your booking request.");
        document.getElementById("navAuthBtn")?.click();
        return;
      }
      const c = calc();
      if (!c.rate || c.rate < 1) {
        alert(`The owner has not added a ${c.hourly ? "hourly" : "nightly"} price for this room yet.`);
        return;
      }
      const startAtLocal = startAtDate();
      const endAtLocal = endAtDate();
      if (!c.hourly && endAtLocal <= startAtLocal) {
        alert("Check-out must be after check-in.");
        return;
      }
      const button = form.querySelector("button[type=submit]");
      button.disabled = true;
      button.textContent = "Sending request...";
      const startAt = startAtLocal.toISOString();
      const endAt = c.hourly
        ? new Date(startAtLocal.getTime() + c.units * 3600000).toISOString()
        : endAtLocal.toISOString();
      const { error } = await db.from("hotel_bookings").insert({
        building_id: hotel.id,
        room_type_id: selectedRoom.id,
        user_id: user.id,
        owner_id: hotel.created_by,
        guest_name: form.querySelector("#hbName").value.trim(),
        guest_phone: form.querySelector("#hbPhone").value.trim(),
        guest_count: Number(form.querySelector("#hbGuests").value),
        booking_mode: c.hourly ? "hourly" : "nightly",
        check_in: startAt,
        check_out: endAt,
        hours_count: c.hourly ? c.units : null,
        nights_count: c.hourly ? null : c.units,
        price_per_unit: c.rate,
        total_price: c.total,
        status: "pending"
      });
      button.disabled = false;
      button.textContent = "Book now";
      if (error) {
        console.error(error);
        alert(`Could not send booking request: ${error.message}`);
        return;
      }
      alert("Booking request sent. The owner will review and respond.");
      form.reset();
    });
  }
})();
