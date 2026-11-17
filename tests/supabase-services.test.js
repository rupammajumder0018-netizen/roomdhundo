import test from "node:test";
import assert from "node:assert/strict";

// Test 1: Test Client Unconfigured State
test("Supabase Client — Handles unconfigured state safely", async () => {
  const { supabase, isSupabaseConfigured, getSupabase } = await import(
    "../src/services/supabase/client.js"
  );

  assert.equal(typeof isSupabaseConfigured, "boolean");

  if (!isSupabaseConfigured) {
    assert.equal(supabase, null);
    assert.throws(
      () => getSupabase(),
      /Supabase client is not initialized/
    );
  } else {
    assert.ok(supabase);
    assert.equal(typeof supabase.from, "function");
  }
});

// Test 2: Mutation Helpers — Unknown column extraction and payload cloning
test("Mutation Helpers — Extracts unknown column names and clones payloads", async () => {
  const {
    cloneSupabasePayload,
    unknownColumnFromError,
    stripUnknownColumn,
  } = await import("../src/services/supabase/mutationHelpers.js");

  // PostgREST error format
  const postgrestErr =
    "Could not find the 'hotel_meta' column of 'buildings' in the schema cache";
  assert.equal(unknownColumnFromError(postgrestErr), "hotel_meta");

  // PostgreSQL column error format
  const pgErr = 'column "owner_email" does not exist';
  assert.equal(unknownColumnFromError(pgErr), "owner_email");

  // Non-matching error
  const otherErr = "duplicate key value violates unique constraint";
  assert.equal(unknownColumnFromError(otherErr), null);

  // Cloning payload
  const original = { name: "Grand Hotel", hotel_meta: { stars: 4 } };
  const cloned = cloneSupabasePayload(original);
  assert.deepEqual(cloned, original);
  assert.notEqual(cloned, original);

  // Array cloning
  const arr = [{ id: 1 }, { id: 2 }];
  const clonedArr = cloneSupabasePayload(arr);
  assert.deepEqual(clonedArr, arr);
  assert.notEqual(clonedArr, arr);

  // Column stripping (immutability check)
  const stripped = stripUnknownColumn(original, "hotel_meta");
  assert.equal(stripped.hotel_meta, undefined);
  assert.equal(original.hotel_meta.stars, 4); // Original unmodified
});

// Test 3: Storage Service — Validation and path generation
test("Storage Service — File validation and safe path generation", async () => {
  const {
    sanitizeStorageFileName,
    generateStoragePath,
    validateMediaFile,
    PROPERTY_IMAGES_BUCKET,
    MAX_IMAGE_SIZE_BYTES,
    MAX_VIDEO_SIZE_BYTES,
  } = await import("../src/services/storage/index.js");

  assert.equal(PROPERTY_IMAGES_BUCKET, "property-images");

  // File name sanitization
  assert.equal(
    sanitizeStorageFileName("my photo #1 (final)!.jpg"),
    "my_photo__1__final__.jpg"
  );

  // Path generation format: `${userId}/${timestamp}-${index}-${safeFileName}`
  const path = generateStoragePath("user-123", 2, "room photo.png");
  assert.match(path, /^user-123\/\d+-2-room_photo\.png$/);

  // Image size limit check
  const validImage = { name: "pic.jpg", type: "image/jpeg", size: 4 * 1024 * 1024 };
  const validRes = validateMediaFile(validImage);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.isImage, true);

  const oversizedImage = {
    name: "big.jpg",
    type: "image/jpeg",
    size: MAX_IMAGE_SIZE_BYTES + 1024,
  };
  const overImageRes = validateMediaFile(oversizedImage);
  assert.equal(overImageRes.valid, false);
  assert.match(overImageRes.error, /exceeds the 5MB size limit/);

  // Video size limit check
  const validVideo = {
    name: "tour.mp4",
    type: "video/mp4",
    size: 20 * 1024 * 1024,
  };
  assert.equal(validateMediaFile(validVideo).valid, true);

  const oversizedVideo = {
    name: "bigtour.mp4",
    type: "video/mp4",
    size: MAX_VIDEO_SIZE_BYTES + 1024,
  };
  const overVideoRes = validateMediaFile(oversizedVideo);
  assert.equal(overVideoRes.valid, false);
  assert.match(overVideoRes.error, /exceeds the 50MB size limit/);

  // Unsupported file type
  const pdfFile = { name: "doc.pdf", type: "application/pdf", size: 1024 };
  const pdfRes = validateMediaFile(pdfFile);
  assert.equal(pdfRes.valid, false);
  assert.match(pdfRes.error, /Only images and videos are allowed/);
});

// Test 4: Properties Service — Safe behavior when client unconfigured
test("Properties Service — Exports required functions and returns safe errors without throwing", async () => {
  const propertiesService = await import("../src/services/properties/index.js");

  assert.equal(typeof propertiesService.fetchPublishedProperties, "function");
  assert.equal(typeof propertiesService.fetchPropertyById, "function");
  assert.equal(typeof propertiesService.fetchOwnerProperties, "function");
  assert.equal(typeof propertiesService.fetchSavedProperties, "function");
  assert.equal(typeof propertiesService.toggleSavedProperty, "function");
  assert.equal(typeof propertiesService.createPropertyReview, "function");

  // When supabase is not configured, none of these should throw uncaught exceptions
  const result = await propertiesService.fetchPublishedProperties();
  assert.ok(result);
  if (!process.env.VITE_SUPABASE_URL) {
    assert.equal(result.data, null);
    assert.ok(result.error);
    assert.match(result.error.message, /not configured/);
  }
});

// Test 5: Bookings Service — Schema awareness and safe return
test("Bookings Service — Verified function exports and unmigrated table awareness", async () => {
  const bookingsService = await import("../src/services/bookings/index.js");

  assert.equal(typeof bookingsService.createHotelBooking, "function");
  assert.equal(typeof bookingsService.fetchUserHotelBookings, "function");
  assert.equal(typeof bookingsService.fetchOwnerHotelBookings, "function");
  assert.equal(typeof bookingsService.updateHotelBookingStatus, "function");

  const result = await bookingsService.fetchUserHotelBookings("user-uuid");
  assert.ok(result);
  if (!process.env.VITE_SUPABASE_URL) {
    assert.equal(result.data, null);
    assert.ok(result.error);
    assert.match(result.error.message, /not configured/);
  }
});

// Test 6: Enquiries Service — Exports and safe return
test("Enquiries Service — Verified function exports and safe error responses", async () => {
  const enquiriesService = await import("../src/services/enquiries/index.js");

  assert.equal(typeof enquiriesService.createEnquiry, "function");
  assert.equal(typeof enquiriesService.fetchUserEnquiries, "function");
  assert.equal(typeof enquiriesService.fetchOwnerEnquiries, "function");
  assert.equal(typeof enquiriesService.updateEnquiryStatus, "function");

  const result = await enquiriesService.fetchUserEnquiries("user-uuid");
  assert.ok(result);
  if (!process.env.VITE_SUPABASE_URL) {
    assert.equal(result.data, null);
    assert.ok(result.error);
    assert.match(result.error.message, /not configured/);
  }
});

// Test 7: Services Barrel Re-export
test("Services Index — Re-exports all required service domains", async () => {
  const services = await import("../src/services/index.js");

  assert.ok(services.propertiesService);
  assert.ok(services.bookingsService);
  assert.ok(services.enquiriesService);
  assert.ok(services.storageService);
  assert.ok(services.mutationHelpers);
});

