/**
/**
 * Roomdhundo — Owner Management Service
 *
 * Provides backend database operations for the Owner Dashboard, Property Management,
 * Room Availability, and Listing Wizards (PG, Flat, Hotel).
 * Ported from:
 * - `files6.0/owner-dashboard.js`
 * - `files6.0/script.js` (wireListPropertyForm, loadPropertyForEdit, uploadPropertyMedia)
 */

import { supabase } from "../supabase/client.js";
import { executeSafeMutation } from "../supabase/mutationHelpers.js";

/**
 * Fetches all dashboard data for a property owner:
 * - Listed properties with associated room_types and reviews
 * - Enquiries received for the owner's properties
 * - Aggregated dashboard metrics
 *
 * @param {string} ownerId Authenticated owner UUID
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function fetchOwnerDashboardData(ownerId) {
  const emptyState = {
    properties: [],
    enquiries: [],
    stats: {
      totalProperties: 0,
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      totalEnquiries: 0,
    },
  };

  if (!ownerId) {
    return {
      data: emptyState,
      error: new Error("[Roomdhundo] Owner ID is required."),
    };
  }

  if (!supabase) {
    return {
      data: emptyState,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  // 1. Fetch properties owned by this user
  const { data: properties, error: propError } = await supabase
    .from("buildings")
    .select("*, room_types(*), reviews(*)")
    .eq("created_by", ownerId)
    .order("created_at", { ascending: false });

  if (propError) {
    return { data: null, error: propError };
  }

  const propList = properties || [];

  // 2. Fetch enquiries received by this owner
  const { data: enquiries, error: enquiryError } = await supabase
    .from("enquiries")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (enquiryError) {
    return { data: null, error: enquiryError };
  }

  const enquiryList = enquiries || [];

  // Enrich enquiries with renter profiles if any
  const userIds = [
    ...new Set(enquiryList.map((e) => e.user_id).filter(Boolean)),
  ];

  let renterProfilesMap = {};
  if (userIds.length > 0) {
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .in("id", userIds);

    if (!profileErr && profiles) {
      profiles.forEach((p) => {
        renterProfilesMap[p.id] = p;
      });
    }
  }

  const enrichedEnquiries = enquiryList.map((enq) => {
    const matchedProp = propList.find((p) => p.id === (enq.property_id || enq.building_id));
    return {
      ...enq,
      property: matchedProp || null,
      renter: renterProfilesMap[enq.user_id] || null,
    };
  });

  // 3. Compute stats
  let totalRooms = 0;
  let availableRooms = 0;

  propList.forEach((prop) => {
    (prop.room_types || []).forEach((room) => {
      const avail = Number(room.available_rooms || 0);
      const total = Number(room.total_rooms || avail || 1);
      totalRooms += total;
      availableRooms += avail;
    });
  });

  const occupiedRooms = Math.max(0, totalRooms - availableRooms);

  return {
    data: {
      properties: propList,
      enquiries: enrichedEnquiries,
      stats: {
        totalProperties: propList.length,
        totalRooms,
        availableRooms,
        occupiedRooms,
        totalEnquiries: enquiryList.length,
      },
    },
    error: null,
  };
}

/**
 * Updates availability across all room types belonging to a specific building.
 *
 * @param {string} buildingId Building UUID
 * @param {string} ownerId Owner UUID
 * @param {'Available'|'Occupied'} newStatus Target availability status
 * @returns {Promise<{ error: Error|null }>}
 */
export async function updatePropertyAvailability(buildingId, ownerId, newStatus) {
  if (!buildingId || !ownerId) {
    return { success: false, error: new Error("[Roomdhundo] Building ID and Owner ID are required.") };
  }

  const normStatus = String(newStatus || "").toLowerCase();
  if (normStatus !== "available" && normStatus !== "occupied") {
    return { success: false, error: new Error("[Roomdhundo] Status must be 'available' or 'occupied'.") };
  }

  if (!supabase) {
    return { success: false, error: new Error("[Roomdhundo] Supabase client is not configured.") };
  }

  const isOccupied = normStatus === "occupied";
  const payload = isOccupied
    ? { available_rooms: 0, availability: "Occupied" }
    : { available_rooms: 1, availability: "Available" };

  const { error } = await supabase
    .from("room_types")
    .update(payload)
    .eq("building_id", buildingId);

  return { success: !error, error };
}

/**
 * Toggles an individual room type's availability status.
 *
 * @param {string} roomId Room UUID
 * @param {string} buildingId Building UUID
 * @param {number} currentAvailable Current available_rooms count
 * @returns {Promise<{ success: boolean, error: Error|null, newAvailable?: number, newStatus?: string }>}
 */
export async function toggleRoomStatus(roomId, buildingId, currentAvailable) {
  if (!roomId) {
    return { success: false, error: new Error("[Roomdhundo] Room ID is required.") };
  }
  if (!buildingId) {
    return { success: false, error: new Error("[Roomdhundo] Building ID is required.") };
  }

  if (!supabase) {
    return { success: false, error: new Error("[Roomdhundo] Supabase client is not configured.") };
  }

  const isCurrentlyAvailable = Number(currentAvailable) > 0;
  const newStatus = isCurrentlyAvailable ? "Occupied" : "Available";
  const newAvailable = isCurrentlyAvailable ? 0 : 1;

  const { error } = await supabase
    .from("room_types")
    .update({
      available_rooms: newAvailable,
      availability: newStatus,
    })
    .eq("id", roomId)
    .eq("building_id", buildingId);

  return { success: !error, error, newAvailable, newStatus };
}

/**
 * Permanently removes a property and its room types.
 *
 * @param {string} buildingId Building UUID
 * @param {string} ownerId Owner UUID
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function deleteOwnerProperty(buildingId, ownerId) {
  if (!buildingId || !ownerId) {
    return { success: false, error: new Error("[Roomdhundo] Building ID and Owner ID are required.") };
  }

  if (!supabase) {
    return { success: false, error: new Error("[Roomdhundo] Supabase client is not configured.") };
  }

  // 1. Delete associated room types first
  const { error: roomErr } = await supabase
    .from("room_types")
    .delete()
    .eq("building_id", buildingId);

  if (roomErr) {
    return { success: false, error: roomErr };
  }

  // 2. Delete the building record (scoped to ownerId for security)
  const { error: buildingErr } = await supabase
    .from("buildings")
    .delete()
    .eq("id", buildingId)
    .eq("created_by", ownerId);

  return { success: !buildingErr, error: buildingErr };
}

/**
 * Fetches an existing property along with its room types for editing.
 *
 * @param {string} buildingId
 * @param {string} ownerId
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function fetchPropertyForEdit(buildingId, ownerId, isAdmin = false) {
  if (!buildingId) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Building ID is required."),
    };
  }
  if (!ownerId && !isAdmin) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Owner ID is required."),
    };
  }

  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  let query = supabase
    .from("buildings")
    .select("*, room_types(*)")
    .eq("id", buildingId);

  if (!isAdmin && ownerId) {
    query = query.eq("created_by", ownerId);
  }

  const { data, error } = await query.maybeSingle();

  return { data, error };
}

/**
 * Saves a property listing (insert or update) along with its room types.
 *
 * @param {Object} params
 * @param {Object} params.buildingCore Normalized building fields
 * @param {Array<Object>} params.roomTypeInputs Array of room type definitions
 * @param {boolean} params.isEdit Whether updating an existing listing
 * @param {string} [params.editId] Building ID if editing
 * @param {string} params.ownerId Authenticated owner UUID
 * @param {boolean} [params.isAdmin=false] Whether called by an administrator
 * @returns {Promise<{ success: boolean, data: Object|null, error: Error|null }>}
 */
export async function savePropertyListing({
  buildingCore,
  roomTypeInputs = [],
  isEdit = false,
  editId = null,
  ownerId,
  isAdmin = false,
}) {
  if (!ownerId && !isAdmin) {
    return { success: false, data: null, error: new Error("[Roomdhundo] Owner ID is required.") };
  }
  if (!buildingCore?.name || !buildingCore?.location) {
    return { success: false, data: null, error: new Error("[Roomdhundo] Property name and location are required.") };
  }
  if (!roomTypeInputs || roomTypeInputs.length === 0) {
    return { success: false, data: null, error: new Error("[Roomdhundo] At least one room type is required.") };
  }

  if (!supabase) {
    return { success: false, data: null, error: new Error("[Roomdhundo] Supabase client is not configured.") };
  }

  if (isEdit && editId) {
    // 1. Update building record
    const { data: updatedBuilding, error: buildingError } = await executeSafeMutation({
      client: supabase,
      table: "buildings",
      mode: "update",
      payload: buildingCore,
      applyFilters: (q) => (isAdmin ? q.eq("id", editId) : q.eq("id", editId).eq("created_by", ownerId)),
      allowStripping: true,
    });

    if (buildingError) return { success: false, data: null, error: buildingError };

    // 2. Synchronize room types
    const { data: existingRooms } = await supabase
      .from("room_types")
      .select("id")
      .eq("building_id", editId);

    const existingIds = (existingRooms || []).map((r) => String(r.id));
    const submittedIds = roomTypeInputs.filter((r) => r.id).map((r) => String(r.id));
    const removedIds = existingIds.filter((id) => !submittedIds.includes(id));

    // Delete removed rooms
    for (const remId of removedIds) {
      await supabase
        .from("room_types")
        .delete()
        .eq("id", remId)
        .eq("building_id", editId);
    }

    // Insert or update room types
    for (const room of roomTypeInputs) {
      const roomAvailBeds = room.available_beds != null ? Number(room.available_beds) : Number(room.available_rooms != null ? room.available_rooms : room.available || 1);
      const roomTotalBeds = room.total_beds != null ? Number(room.total_beds) : Number(room.total_rooms || room.totalRooms || room.available || 1);
      const roomBedCap = Number(room.bed_capacity || room.room_details?.bed_capacity || room.room_people || room.people || 1);

      const roomPayload = {
        room_type: room.room_type || room.roomType,
        price_value: Number(room.price_value || room.rent || 0),
        daily_price: room.daily_price || room.nightlyRent || null,
        hourly_price: room.hourly_price || room.hourlyPrice || null,
        weekend_price: room.weekend_price || room.weekendPrice || null,
        extra_person_charge: room.extra_person_charge || room.extraPerson || null,
        room_rent: Number(room.room_rent || room.rent || 0),
        room_people: Number(room.room_people || room.people || 1),
        bed_capacity: roomBedCap,
        available_beds: roomAvailBeds,
        total_beds: roomTotalBeds,
        occupied_beds: Number(room.occupied_beds != null ? room.occupied_beds : Math.max(0, roomTotalBeds - roomAvailBeds)),
        available_rooms: Number(room.available_rooms != null ? room.available_rooms : room.available || 1),
        total_rooms: Number(room.total_rooms || room.totalRooms || room.available || 1),
        room_size: room.room_size || room.roomSize || null,
        adults: room.adults || null,
        children: room.children || null,
        availability: room.availability || (room.available > 0 ? "Available" : "Occupied"),
        room_details: room.room_details || room.details || {},
        ...(room.images ? { images: room.images } : {}),
      };

      if (room.id) {
        await executeSafeMutation({
          client: supabase,
          table: "room_types",
          mode: "update",
          payload: roomPayload,
          applyFilters: (q) => q.eq("id", room.id).eq("building_id", editId),
          allowStripping: true,
        });
      } else {
        await executeSafeMutation({
          client: supabase,
          table: "room_types",
          mode: "insert",
          payload: { building_id: editId, ...roomPayload },
          allowStripping: true,
        });
      }
    }

    return { success: true, data: updatedBuilding, error: null };
  } else {
    // New listing insert
    const newBuildingPayload = {
      ...buildingCore,
      created_by: ownerId || null,
      owner_verified: isAdmin ? true : false,
      owner_member_since: String(new Date().getFullYear()),
      status: isAdmin ? (buildingCore.status || "approved") : "pending",
      verification_status: isAdmin ? (buildingCore.verification_status || "approved") : "pending",
    };

    const { data: newBuilding, error: insertBuildingErr } = await executeSafeMutation({
      client: supabase,
      table: "buildings",
      mode: "insert",
      payload: newBuildingPayload,
      allowStripping: true,
    });

    if (insertBuildingErr) return { success: false, data: null, error: insertBuildingErr };
    const insertedRow = Array.isArray(newBuilding) ? newBuilding[0] : newBuilding;
    if (!insertedRow?.id) {
      return { success: false, data: null, error: new Error("[Roomdhundo] Failed to create property record.") };
    }

    // Insert all room types
    const roomTypeRows = roomTypeInputs.map((room) => {
      const roomAvailBeds = room.available_beds != null ? Number(room.available_beds) : Number(room.available_rooms != null ? room.available_rooms : room.available || 1);
      const roomTotalBeds = room.total_beds != null ? Number(room.total_beds) : Number(room.total_rooms || room.totalRooms || room.available || 1);
      const roomBedCap = Number(room.bed_capacity || room.room_details?.bed_capacity || room.room_people || room.people || 1);

      return {
        building_id: insertedRow.id,
        room_type: room.room_type || room.roomType,
        price_value: Number(room.price_value || room.rent || 0),
        daily_price: room.daily_price || room.nightlyRent || null,
        hourly_price: room.hourly_price || room.hourlyPrice || null,
        weekend_price: room.weekend_price || room.weekendPrice || null,
        extra_person_charge: room.extra_person_charge || room.extraPerson || null,
        room_rent: Number(room.room_rent || room.rent || 0),
        room_people: Number(room.room_people || room.people || 1),
        bed_capacity: roomBedCap,
        available_beds: roomAvailBeds,
        total_beds: roomTotalBeds,
        occupied_beds: Number(room.occupied_beds != null ? room.occupied_beds : Math.max(0, roomTotalBeds - roomAvailBeds)),
        available_rooms: Number(room.available_rooms != null ? room.available_rooms : room.available || 1),
        total_rooms: Number(room.total_rooms || room.totalRooms || room.available || 1),
        room_size: room.room_size || room.roomSize || null,
        adults: room.adults || null,
        children: room.children || null,
        availability: "Just listed",
        room_details: room.room_details || room.details || {},
        ...(room.images ? { images: room.images } : {}),
      };
    });

    const { error: insertRoomsErr } = await executeSafeMutation({
      client: supabase,
      table: "room_types",
      mode: "insert",
      payload: roomTypeRows,
    });

    if (insertRoomsErr) return { success: false, data: newBuilding, error: insertRoomsErr };

    return { success: true, data: newBuilding, error: null };
  }
}

/**
 * Updates an owner's enquiry status (e.g. accepted, rejected, contacted).
 *
 * @param {string} enquiryId
 * @param {string} ownerId
 * @param {'pending'|'accepted'|'rejected'|'contacted'} newStatus
 * @returns {Promise<{ error: Error|null }>}
 */
export async function updateOwnerEnquiryStatus(enquiryId, ownerId, newStatus) {
  if (!enquiryId || !ownerId) {
    return { success: false, error: new Error("[Roomdhundo] Enquiry ID and Owner ID are required.") };
  }

  const validStatuses = ["pending", "accepted", "rejected", "contacted"];
  if (!validStatuses.includes(newStatus)) {
    return {
      success: false,
      error: new Error(
        `[Roomdhundo] Invalid enquiry status: "${newStatus}". Must be one of: ${validStatuses.join(", ")}.`
      ),
    };
  }

  if (!supabase) {
    return { success: false, error: new Error("[Roomdhundo] Supabase client is not configured.") };
  }

  const { error } = await supabase
    .from("enquiries")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enquiryId)
    .eq("owner_id", ownerId);

  return { success: !error, error };
}

/**
 * Updates owner profile name and synchronizes contact numbers across their properties.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.full_name
 * @param {string} [params.phone]
 * @returns {Promise<{ error: Error|null }>}
 */
export async function updateOwnerProfile({ userId, full_name, phone }) {
  if (!userId) {
    return { success: false, error: new Error("[Roomdhundo] User ID is required.") };
  }

  const cleanName = String(full_name || "").trim();
  if (!cleanName) {
    return { success: false, error: new Error("[Roomdhundo] Full name is required.") };
  }

  if (!supabase) {
    return { success: false, error: new Error("[Roomdhundo] Supabase client is not configured.") };
  }

  // 1. Update public.profiles
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ full_name: cleanName })
    .eq("id", userId);

  if (profileErr) return { success: false, error: profileErr };

  // 2. Update auth metadata
  try {
    await supabase.auth.updateUser({
      data: { full_name: cleanName },
    });
  } catch (e) {
    console.warn("Auth metadata update warning:", e);
  }

  // 3. Update phone across owner's listings if provided
  const cleanPhone = String(phone || "").trim();
  if (cleanPhone) {
    const { error: bldErr } = await supabase
      .from("buildings")
      .update({
        owner_phone: cleanPhone,
        owner_whatsapp: cleanPhone,
      })
      .eq("created_by", userId);

    if (bldErr) return { success: false, error: bldErr };
  }

  return { success: true, error: null };
}

export const ownerService = {
  fetchOwnerDashboardData,
  updatePropertyAvailability,
  toggleRoomStatus,
  deleteOwnerProperty,
  fetchPropertyForEdit,
  savePropertyListing,
  updateOwnerEnquiryStatus,
  updateOwnerProfile,
};

export default ownerService;
