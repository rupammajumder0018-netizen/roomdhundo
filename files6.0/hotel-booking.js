(() => {
  const URL = "https://vyusxdilgwrcgmqqvzsp.supabase.co";
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGciOiJIUzI1NiIsInJlZiI6InZ5dXN4ZGlsZ3dyY2dtcXF2enNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjYyNTYsImV4cCI6MjEwMjc0MjI1Nn0.X6FbzDad06d5-kj1aK4zQkPSPrrLUW_O7CdfZ-ghwrM";
  const db = window.supabase.createClient(URL, KEY);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
  const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
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

  let user;
  let hotel;
  let rooms = [];
  let selectedRoom = null;
  let board = "room-only";
  let loadPromise = null;
  let authWired = false;

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

    const { data: auth } = await db.auth.getUser();
    user = auth?.user;
    if (!authWired) {
      authWired = true;
      db.auth.onAuthStateChange((_event, session) => {
        user = session?.user || null;
        const submit = document.querySelector("#hotelBookingForm .hotel-booking-submit");
        if (submit) {
          submit.disabled = false;
          submit.textContent = user ? "Book now" : "Log in to book";
        }
      });
    }

    if (!hotel) {
      const id = new URLSearchParams(location.search).get("id");
      if (!id) return;
      if (!loadPromise) {
        loadPromise = db.from("buildings").select("id,name,type,created_by,facility_tags,facilities,images,room_types(*)").eq("id", id).single();
      }
      const { data: building, error } = await loadPromise;
      if (error || !building || String(building.type).toLowerCase() !== "hotel") return;
      hotel = building;
      rooms = building.room_types || [];
    }

    renderStay();
  }

  function hasBreakfast() {
    const tags = (hotel.facility_tags || []).map((tag) => String(tag).toLowerCase());
    const labels = (hotel.facilities || []).map((label) => String(label).toLowerCase());
    return tags.includes("food") || labels.some((label) => /\bfood\b|breakfast|meal/.test(label));
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

    const breakfast = hasBreakfast();
    const pills = `
        <button type="button" class="hotel-board-pill is-active" data-board="room-only">Room only<br><small>Selected</small></button>
        <button type="button" class="hotel-board-pill${breakfast ? "" : " is-disabled"}" data-board="breakfast" ${breakfast ? "" : "disabled"}>Breakfast<br><small>${breakfast ? "Available" : "Not available"}</small></button>
    `;
    if (boardMount) boardMount.innerHTML = pills;
    section.innerHTML = `
      ${boardMount ? "" : `<h2>Select room and board type</h2><div class="hotel-board-pills">${pills}</div>`}
      <div class="hotel-room-pick" id="hotelRoomOptions"></div>
      <div id="hotelBookingFormMount"></div>
    `;

    const pillRoot = boardMount || section;
    pillRoot.querySelectorAll("[data-board]:not(:disabled)").forEach((btn) => {
      btn.addEventListener("click", () => {
        board = btn.dataset.board;
        pillRoot.querySelectorAll("[data-board]").forEach((el) => {
          el.classList.toggle("is-active", el === btn);
          const small = el.querySelector("small");
          if (!small || el.disabled || el.classList.contains("is-disabled")) return;
          if (el === btn) small.textContent = "Selected";
          else if (el.dataset.board === "breakfast") small.textContent = "Available";
          else small.textContent = "";
        });
        document.querySelectorAll(".hotel-room-board-label").forEach((el) => {
          el.textContent = board === "breakfast" ? "Breakfast" : "Room only";
        });
      });
    });

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
        </div>
        <div class="hotel-room-pick-body">
          <h3>${esc(room.room_type)}</h3>
          ${canBook && Number(room.available_rooms) <= 5
            ? `<p class="hotel-room-left">Only ${Number(room.available_rooms)} room${Number(room.available_rooms) === 1 ? "" : "s"} left</p>`
            : ""}
          <ul class="hotel-package-facts">
            <li class="hotel-room-board-label">${board === "breakfast" ? "Breakfast" : "Room only"}</li>
            <li>${Number(room.max_guests || room.room_people || 2)} guests</li>
            <li>${canBook ? `${Number(room.available_rooms)} available` : "Currently unavailable"}</li>
          </ul>
          <strong>${money(room.daily_price || room.hourly_price || room.price_value)} ${room.daily_price ? "/ night" : hourlyOffer(room).enabled ? "/ hour" : ""}</strong>
          ${hourlyOffer(room).enabled ? `<small>Hourly: ${hourlyOffer(room).hours.map((h) => `${h} hrs`).join(", ")}</small>` : ""}
          <button type="button" class="hotel-room-select" ${canBook ? "" : "disabled"}>Select room</button>
        </div>
      `;
      if (canBook) {
        card.querySelector(".hotel-room-select").addEventListener("click", () => selectRoom(room, card));
      }
      grid.append(card);
    });

    if (!rooms.length) {
      const empty = document.createElement("p");
      empty.textContent = "All room categories are currently unavailable. Please check again later.";
      grid.append(empty);
    }
  }

  function selectRoom(room, card) {
    selectedRoom = room;
    document.querySelectorAll(".hotel-room-pick-card").forEach((el) => el.classList.toggle("selected", el === card));
    renderForm();
    document.getElementById("hotelBookingFormMount")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderForm() {
    const mount = document.getElementById("hotelBookingFormMount");
    if (!selectedRoom || !mount) return;
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
          <input id="hbGuests" type="number" min="1" max="${Number(selectedRoom.max_guests || selectedRoom.room_people || 2)}" value="1" required>
        </label>
        <label class="full">Check-in date & time
          <input id="hbStart" type="datetime-local" min="${dateValue(new Date())}" value="${dateValue(new Date(Date.now() + 3600000))}" required>
        </label>
        <label id="hbEndWrap" class="full">Check-out date & time
          <input id="hbEnd" type="datetime-local" required>
        </label>
        <label id="hbHoursWrap" style="display:none">Number of hours
          <select id="hbHours">
            ${hourlyOffer(selectedRoom).hours.map((hours) => `<option value="${hours}">${hours} hours · ${money(hourlyOffer(selectedRoom).price * hours)}</option>`).join("")}
          </select>
        </label>
        <label>Your full name
          <input id="hbName" value="${esc(user?.user_metadata?.full_name || "")}" required>
        </label>
        <label>Phone number
          <input id="hbPhone" type="tel" pattern="[0-9+ ]{10,15}" required placeholder="Your contact number">
        </label>
        <div class="hotel-total full" id="hbTotal">Estimated total: ${money(0)}</div>
        <p class="hotel-booking-notice full">This is a booking request. The owner confirms it after review.</p>
        <button class="hotel-booking-submit full" type="submit">${user ? "Book now" : "Log in to book"}</button>
      </form>
    `;

    const form = mount.querySelector("form");
    const mode = form.querySelector("#hbMode");
    const start = form.querySelector("#hbStart");
    const end = form.querySelector("#hbEnd");
    end.value = dateValue(new Date(new Date(start.value).getTime() + 86400000));

    function calc() {
      const hourly = mode.value === "hourly";
      form.querySelector("#hbEndWrap").style.display = hourly ? "none" : "grid";
      form.querySelector("#hbHoursWrap").style.display = hourly ? "grid" : "none";
      const units = hourly
        ? Number(form.querySelector("#hbHours").value)
        : Math.max(1, Math.ceil((new Date(end.value) - new Date(start.value)) / 86400000));
      const rate = Number(hourly ? hourlyOffer(selectedRoom).price : selectedRoom.daily_price);
      const total = rate * units;
      form.querySelector("#hbTotal").textContent =
        `Estimated total: ${money(total)} (${money(rate)} × ${units} ${hourly ? "hours" : "nights"})`;
      return { hourly, units, rate, total };
    }

    mode.addEventListener("change", calc);
    ["input", "change"].forEach((evt) => {
      [start, end, form.querySelector("#hbHours")].forEach((el) => el.addEventListener(evt, calc));
    });
    calc();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
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
      if (!c.hourly && new Date(end.value) <= new Date(start.value)) {
        alert("Check-out must be after check-in.");
        return;
      }
      const button = form.querySelector("button[type=submit]");
      button.disabled = true;
      button.textContent = "Sending request...";
      const startAt = new Date(start.value).toISOString();
      const endAt = c.hourly
        ? new Date(new Date(start.value).getTime() + c.units * 3600000).toISOString()
        : new Date(end.value).toISOString();
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
