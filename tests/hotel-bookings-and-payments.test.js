import test from "node:test";
import assert from "node:assert/strict";

import {
  HOTEL_BOOKING_STATUS,
  BOOKING_STATUS,
  BREAKFAST_DEFAULT_FEE,
  hourlyOffer,
  hotelHasMeal,
  hotelMealPrice,
  roomTaxInfo,
  calculateStayQuote,
  validateHotelBookingInput,
  validateBookingInput,
  calculateHotelBookingStats,
  preparePaymentParameters,
  createHotelBooking,
  fetchUserHotelBookings,
  fetchOwnerHotelBookings,
  updateHotelBookingStatus,
  fetchAllHotelBookings,
  fetchBookingById,
  createBooking,
  adminUpdateHotelBooking,
  verifyPaymentWithServer,
} from "../src/services/bookings/index.js";

import { PATHS, paymentPath } from "../src/routes/paths.js";

test("Phase 9 Routes — Path constants and payment path builder", () => {
  assert.equal(PATHS.PAYMENT, "/payment");
  assert.equal(PATHS.ADMIN_HOTEL_BOOKINGS, "/admin/hotel-bookings");

  assert.equal(paymentPath(), "/payment");
  assert.equal(
    paymentPath("bkg-uuid-123"),
    "/payment?booking_id=bkg-uuid-123"
  );
  assert.equal(
    paymentPath("xyz 789"),
    "/payment?booking_id=xyz%20789"
  );
});

test("Hotel Bookings Service — hourlyOffer correctly parses room details", () => {
  const roomWithHourly = {
    hourly_price: 350,
    room_details: {
      hourly: {
        enabled: true,
        pricePerHour: 400,
        hours: [2, 4, 8],
      },
    },
  };
  const parsed = hourlyOffer(roomWithHourly);
  assert.equal(parsed.enabled, true);
  assert.equal(parsed.price, 400);
  assert.deepEqual(parsed.hours, [2, 4, 8]);

  // Fallback to room.hourly_price and default [3, 6, 12, 24]
  const roomFallback = {
    hourly_price: 250,
    room_details: {},
  };
  const parsedFallback = hourlyOffer(roomFallback);
  assert.equal(parsedFallback.enabled, true);
  assert.equal(parsedFallback.price, 250);
  assert.deepEqual(parsedFallback.hours, [3, 6, 12, 24]);

  // Disabled hourly offer
  const roomDisabled = {
    room_details: {
      hourly: {
        enabled: false,
        pricePerHour: 500,
      },
    },
  };
  assert.equal(hourlyOffer(roomDisabled).enabled, false);
});

test("Hotel Bookings Service — Meal availability and pricing", () => {
  const hotel = {
    facility_tags: ["wifi", "meal-breakfast", "meal-dinner"],
    facilities: ["Air Conditioning", "Lunch Available"],
    hotel_meta: {
      meal_prices: {
        lunch: 250,
        dinner: 400,
      },
    },
  };

  assert.equal(hotelHasMeal(hotel, "breakfast"), true);
  assert.equal(hotelHasMeal(hotel, "lunch"), true);
  assert.equal(hotelHasMeal(hotel, "dinner"), true);

  // Breakfast fallback to default 300 when no custom meta price
  assert.equal(hotelMealPrice(hotel, "breakfast"), BREAKFAST_DEFAULT_FEE);
  // Custom prices
  assert.equal(hotelMealPrice(hotel, "lunch"), 250);
  assert.equal(hotelMealPrice(hotel, "dinner"), 400);

  // Missing meal
  const emptyHotel = {};
  assert.equal(hotelHasMeal(emptyHotel, "dinner"), false);
  assert.equal(hotelMealPrice(emptyHotel, "dinner"), 0);
});

test("Hotel Bookings Service — Room tax info detection", () => {
  assert.deepEqual(roomTaxInfo({ room_details: { tax: "gst-12" } }), {
    mode: "exclusive",
    rate: 0.12,
    label: "GST 12%",
  });

  assert.deepEqual(roomTaxInfo({ room_details: { tax: "gst-18" } }), {
    mode: "exclusive",
    rate: 0.18,
    label: "GST 18%",
  });

  assert.deepEqual(roomTaxInfo({ room_details: { tax: "inclusive" } }), {
    mode: "inclusive",
    rate: 0.18,
    label: "GST 18%",
  });

  assert.deepEqual(roomTaxInfo({}), {
    mode: "inclusive",
    rate: 0.18,
    label: "GST 18%",
  });
});

test("Hotel Bookings Service — calculateStayQuote accurately quotes nightly and hourly stays", () => {
  const hotel = {
    facility_tags: ["meal-breakfast"],
    hotel_meta: {
      meal_prices: {
        breakfast: 200,
      },
    },
  };
  const room = {
    room_details: { tax: "exclusive" },
  };

  // Nightly quote: 2 nights at 1500 + breakfast for 2 nights (200*2 = 400) + 18% GST on (3000+400) = 612
  const quoteNightly = calculateStayQuote({
    hourly: false,
    units: 2,
    rate: 1500,
    selectedMeals: ["breakfast"],
    hotel,
    room,
  });

  assert.equal(quoteNightly.roomSubtotal, 3000);
  assert.equal(quoteNightly.mealsTotal, 400);
  assert.equal(quoteNightly.taxAmount, Math.round(3400 * 0.18));
  assert.equal(quoteNightly.total, 3000 + 400 + Math.round(3400 * 0.18));

  // Hourly quote: 3 hours at 300 + breakfast (1 session: 200) + 18% GST on (900+200) = 198
  const quoteHourly = calculateStayQuote({
    hourly: true,
    units: 3,
    rate: 300,
    selectedMeals: ["breakfast"],
    hotel,
    room,
  });

  assert.equal(quoteHourly.roomSubtotal, 900);
  assert.equal(quoteHourly.mealsTotal, 200);
  assert.equal(quoteHourly.taxAmount, Math.round(1100 * 0.18));
  assert.equal(quoteHourly.total, 900 + 200 + Math.round(1100 * 0.18));

  // Inclusive room rate: Room rate not taxed again, but extra meals are taxed
  const roomInclusive = { room_details: { tax: "inclusive" } };
  const quoteInclusive = calculateStayQuote({
    hourly: false,
    units: 1,
    rate: 2000,
    selectedMeals: ["breakfast"],
    hotel,
    room: roomInclusive,
  });

  assert.equal(quoteInclusive.roomSubtotal, 2000);
  assert.equal(quoteInclusive.mealsTotal, 200);
  assert.equal(quoteInclusive.taxAmount, Math.round(200 * 0.18)); // Tax on meals only
  assert.equal(quoteInclusive.total, 2000 + 200 + 36);
});

test("Hotel Booking Validation — validateHotelBookingInput enforces required fields and integrity", () => {
  const validPayload = {
    buildingId: "bld-1",
    roomTypeId: "rt-1",
    userId: "usr-1",
    ownerId: "own-1",
    guestName: "Wasim Akram",
    guestPhone: "9876543210",
    guestCount: 2,
    bookingMode: "nightly",
    checkIn: "2026-11-20T12:00:00Z",
    checkOut: "2026-11-22T11:00:00Z",
    nightsCount: 2,
    pricePerUnit: 1200,
    totalPrice: 2400,
  };

  const validRes = validateHotelBookingInput(validPayload);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.errors.length, 0);

  // Missing required IDs
  const invalidRes = validateHotelBookingInput({
    ...validPayload,
    buildingId: "",
    guestPhone: "123", // Too short
    checkOut: "2026-11-19T12:00:00Z", // Before checkin
    totalPrice: -50,
  });

  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.errors.some((e) => e.includes("building ID")));
  assert.ok(invalidRes.errors.some((e) => e.includes("phone number")));
  assert.ok(invalidRes.errors.some((e) => e.includes("after check-in")));
  assert.ok(invalidRes.errors.some((e) => e.includes("greater than zero")));
});

test("Room Reservation Validation — validateBookingInput enforces rent, platform fee, and total amount", () => {
  const valid = validateBookingInput({
    userId: "usr-1",
    buildingId: "bld-1",
    buildingName: "Green Valley PG",
    monthlyRent: 8000,
    platformFee: 800,
    totalAmount: 8800,
  });
  assert.equal(valid.valid, true);

  const invalid = validateBookingInput({
    userId: "",
    buildingId: "bld-1",
    buildingName: "",
    monthlyRent: -100,
    platformFee: -10,
    totalAmount: 0,
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 4);
});

test("Admin Hotel Booking Stats — calculateHotelBookingStats aggregates correctly", () => {
  const todayStr = new Date().toISOString();
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString();

  const mockBookings = [
    { id: "1", status: "pending", check_in: todayStr, total_price: 2000 },
    { id: "2", status: "confirmed", check_in: todayStr, total_price: 3500 },
    { id: "3", status: "confirmed", check_in: yesterdayStr, total_price: 1500 },
    { id: "4", status: "rejected", check_in: yesterdayStr, total_price: 1000 },
    { id: "5", status: "cancelled", check_in: yesterdayStr, total_price: 1200 },
  ];

  const stats = calculateHotelBookingStats(mockBookings);
  assert.equal(stats.total, 5);
  assert.equal(stats.pending, 1);
  assert.equal(stats.confirmed, 2);
  assert.equal(stats.closed, 2); // rejected + cancelled
  assert.equal(stats.checkinsToday, 2);
  assert.equal(stats.revenue, 5000); // 3500 + 1500
});

test("Payment Security — preparePaymentParameters prevents live charge accidents", () => {
  const params = preparePaymentParameters({
    bookingId: "bkg-777",
    amount: 5500,
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "9876543210",
  });

  assert.equal(params.bookingId, "bkg-777");
  assert.equal(params.amount, 550000); // in paise
  assert.equal(params.currency, "INR");
  assert.equal(params.isSandbox, true);
  assert.equal(params.customer.name, "Jane Doe");
  assert.equal(params.notes.booking_id, "bkg-777");
});

test("Database Safety — Methods return safe error objects without throwing when unconfigured", async () => {
  const bkgRes = await createHotelBooking({
    buildingId: "bld-1",
    roomTypeId: "rt-1",
    userId: "usr-1",
    ownerId: "own-1",
    guestName: "Test User",
    guestPhone: "9876543210",
    guestCount: 1,
    bookingMode: "nightly",
    checkIn: "2026-12-01T12:00:00Z",
    checkOut: "2026-12-02T11:00:00Z",
    pricePerUnit: 1000,
    totalPrice: 1000,
  });
  assert.equal(bkgRes.data, null);
  assert.ok(bkgRes.error instanceof Error);

  const userBkgs = await fetchUserHotelBookings("user-1");
  assert.equal(userBkgs.data, null);
  assert.ok(userBkgs.error instanceof Error);

  const ownerBkgs = await fetchOwnerHotelBookings("owner-1");
  assert.equal(ownerBkgs.data, null);
  assert.ok(ownerBkgs.error instanceof Error);

  const statusRes = await updateHotelBookingStatus({
    bookingId: "bkg-1",
    status: HOTEL_BOOKING_STATUS.CONFIRMED,
  });
  assert.equal(statusRes.data, null);
  assert.ok(statusRes.error instanceof Error);

  const allBkgs = await fetchAllHotelBookings();
  assert.equal(allBkgs.data, null);
  assert.ok(allBkgs.error instanceof Error);

  const singleBkg = await fetchBookingById("bkg-1", "user-1");
  assert.equal(singleBkg.data, null);
  assert.ok(singleBkg.error instanceof Error);

  const createRes = await createBooking({
    userId: "usr-1",
    buildingId: "bld-1",
    buildingName: "Test Property",
    monthlyRent: 5000,
    platformFee: 500,
    totalAmount: 5500,
  });
  assert.equal(createRes.data, null);
  assert.ok(createRes.error instanceof Error);

  const adminUpdateRes = await adminUpdateHotelBooking({
    bookingId: "bkg-1",
    patch: { status: "confirmed" },
  });
  assert.equal(adminUpdateRes.data, null);
  assert.ok(adminUpdateRes.error instanceof Error);

  const verifyRes = await verifyPaymentWithServer({
    bookingId: "bkg-1",
    razorpayOrderId: "order_123",
    razorpayPaymentId: "pay_123",
    razorpaySignature: "sig_123",
  });
  assert.equal(verifyRes.verified, false);
});
