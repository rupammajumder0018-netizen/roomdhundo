import test from "node:test";
import assert from "node:assert/strict";

import {
  occupancyOptionsFromRoom,
  roomBedCapacity,
  roomAvailableBeds,
  roomOccupiedBeds,
  isRoomAvailable,
  roomMonthlyPriceList,
  sharingFilterLabel,
} from "../src/services/properties/index.js";

import {
  validatePgBookingInput,
  createPgBooking,
  cancelPgBooking,
  PLATFORM_FEE_PERCENTAGE,
  BOOKING_STATUS,
} from "../src/services/bookings/index.js";

// Sample PG Room with 3 beds capacity and independent pricing options
const sample3BedRoom = {
  id: "room-uuid-3bed",
  room_type: "Standard 3-Bed AC Room",
  bed_capacity: 3,
  available_beds: 2,
  occupied_beds: 1,
  available_rooms: 2,
  price_value: 3500,
  room_rent: 3500,
  availability: "Available",
  room_details: {
    room_name: "Standard 3-Bed AC Room",
    bed_capacity: 3,
    total_beds: 3,
    available_beds: 2,
    occupied_beds: 1,
    occupancy_options: [
      { people: 1, label: "Single Occupancy", rent: 8000, pricingType: "room" },
      { people: 2, label: "Double Sharing", rent: 5000, pricingType: "person" },
      { people: 3, label: "Triple Sharing", rent: 3500, pricingType: "person" },
    ],
  },
};

test("PG Occupancy — Extracts independent occupancy options with pricing basis", () => {
  const options = occupancyOptionsFromRoom(sample3BedRoom);
  assert.equal(options.length, 3);

  assert.deepEqual(options[0], {
    people: 1,
    label: "Single Occupancy",
    rent: 8000,
    pricingType: "room",
  });

  assert.deepEqual(options[1], {
    people: 2,
    label: "Double Sharing",
    rent: 5000,
    pricingType: "person",
  });

  assert.deepEqual(options[2], {
    people: 3,
    label: "Triple Sharing",
    rent: 3500,
    pricingType: "person",
  });
});

test("PG Occupancy — Prices are independent and not auto-calculated from room total", () => {
  const options = occupancyOptionsFromRoom(sample3BedRoom);
  // Single is 8000 (not 3500 * 3 = 10500)
  assert.equal(options[0].rent, 8000);
  // Double is 5000 (not 8000 / 2 = 4000)
  assert.equal(options[1].rent, 5000);
  // Triple is 3500 (not 8000 / 3)
  assert.equal(options[2].rent, 3500);
});

test("PG Inventory — Accurate bed capacity, available beds, and occupied beds tracking", () => {
  assert.equal(roomBedCapacity(sample3BedRoom), 3);
  assert.equal(roomAvailableBeds(sample3BedRoom), 2);
  assert.equal(roomOccupiedBeds(sample3BedRoom), 1);
  assert.equal(isRoomAvailable(sample3BedRoom), true);

  // Full room (0 beds available)
  const fullRoom = {
    ...sample3BedRoom,
    available_beds: 0,
    available_rooms: 0,
    occupied_beds: 3,
    availability: "Occupied",
  };
  assert.equal(roomBedCapacity(fullRoom), 3);
  assert.equal(roomAvailableBeds(fullRoom), 0);
  assert.equal(roomOccupiedBeds(fullRoom), 3);
  assert.equal(isRoomAvailable(fullRoom), false);
});

test("PG Compatibility — Graceful fallback for legacy listings without explicit occupancy_options", () => {
  const legacyRoom = {
    room_type: "Double Room",
    room_people: 2,
    price_value: 4500,
    available_rooms: 1,
    room_details: {},
  };

  const options = occupancyOptionsFromRoom(legacyRoom);
  assert.equal(options.length, 1);
  assert.equal(options[0].people, 2);
  assert.equal(options[0].rent, 4500);
  assert.equal(options[0].pricingType, "person");

  assert.equal(roomBedCapacity(legacyRoom), 2);
  assert.equal(roomAvailableBeds(legacyRoom), 1);
  assert.equal(roomOccupiedBeds(legacyRoom), 1);
});

test("PG Booking Validation — validatePgBookingInput enforces required booking fields", () => {
  const validPayload = {
    userId: "user-123",
    buildingId: "bldg-456",
    roomTypeId: "room-789",
    buildingName: "Kalyani Boys Hostel",
    guestName: "Arjun Verma",
    guestPhone: "9876543210",
    sharingType: "Double Sharing",
    occupancyPeople: 2,
    durationMonths: 3,
    monthlyRent: 5000,
    platformFee: 500,
    totalAmount: 15500,
  };

  const res = validatePgBookingInput(validPayload);
  assert.equal(res.valid, true);
  assert.equal(res.errors.length, 0);

  // Missing guest name & invalid phone
  const invalidRes = validatePgBookingInput({
    ...validPayload,
    guestName: "",
    guestPhone: "123",
  });
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.errors.some((e) => e.includes("guest name")));
  assert.ok(invalidRes.errors.some((e) => e.includes("contact phone")));
});

test("PG Booking Calculation — Duration and platform fee math matches specification", () => {
  const monthlyRent = 5000;
  const duration = 3;
  const rentSubtotal = monthlyRent * duration; // 15000
  const platformFee = Math.round(monthlyRent * PLATFORM_FEE_PERCENTAGE); // 500 (10% of 1st month)
  const totalAmount = rentSubtotal + platformFee; // 15500

  assert.equal(rentSubtotal, 15000);
  assert.equal(platformFee, 500);
  assert.equal(totalAmount, 15500);
});

test("PG Booking Service — Returns safe errors without throwing when database is unconfigured", async () => {
  const bookingRes = await createPgBooking({
    userId: "u1",
    buildingId: "b1",
    roomTypeId: "r1",
    buildingName: "Sample PG",
    guestName: "Test User",
    guestPhone: "9876543210",
    monthlyRent: 5000,
    durationMonths: 1,
    totalAmount: 5500,
  });

  assert.equal(bookingRes.data, null);
  assert.ok(bookingRes.error instanceof Error);

  const cancelRes = await cancelPgBooking({
    bookingId: "test-booking-id",
    userId: "u1",
  });
  assert.equal(cancelRes.success, false);
  assert.ok(cancelRes.error instanceof Error);
});
