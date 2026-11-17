/**
 * Roomdhundo — Admin & Agent Operations Service
 * Centralized service module for platform moderation, statistics, user directory,
 * agent applications, enquiries, and reviews.
 */

import { supabase } from "../supabase/client.js";

/**
 * Normalizes role string to standard account kinds.
 *
 * @param {string} role
 * @returns {string} 'admin' | 'owner' | 'agent' | 'agent_pending' | 'renter'
 */
export function normalizeAdminRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (value === "admin" || value === "administrator" || value === "super_admin") {
    return "admin";
  }
  if (value === "owner" || value === "landlord" || value === "property owner") {
    return "owner";
  }
  if (value === "agent") {
    return "agent";
  }
  if (value === "agent_pending") {
    return "agent_pending";
  }
  return "renter";
}

/**
 * Returns human-readable label for a role.
 *
 * @param {string} role
 * @returns {string}
 */
export function getAdminRoleLabel(role) {
  const kind = normalizeAdminRole(role);
  switch (kind) {
    case "admin":
      return "Admin";
    case "owner":
      return "Owner";
    case "agent":
      return "Agent";
    case "agent_pending":
      return "Pending Agent";
    default:
      return "Renter";
  }
}

/**
 * Computes property display status matching legacy admin.js:1123-1129.
 *
 * @param {Object} property
 * @returns {"Pending review" | "Rejected" | "Archived" | "Live"}
 */
export function propertyDisplayStatus(property) {
  const status = String(property?.status || "").trim().toLowerCase();
  const listing = String(property?.listing_status || "").trim().toLowerCase();
  const verification = String(property?.verification_status || "").trim().toLowerCase();

  if (status === "pending" || listing === "pending" || verification === "pending") return "Pending review";
  if (status === "rejected" || listing === "rejected" || verification === "rejected") return "Rejected";
  if (status === "archived" || listing === "archived") return "Archived";
  return "Live";
}

/**
 * Fetches admin dashboard high-level statistics across properties, users, and applications.
 *
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function fetchAdminDashboardStats() {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  try {
    const [buildingsRes, profilesRes, reviewsRes, enquiriesRes, agentsRes] = await Promise.all([
      supabase.from("buildings").select("id, status"),
      supabase.from("profiles").select("id, role"),
      supabase.from("reviews").select("id"),
      supabase.from("enquiries").select("id, status"),
      supabase.from("agent_applications").select("id, status"),
    ]);

    const buildings = buildingsRes.data || [];
    const profiles = profilesRes.data || [];
    const reviews = reviewsRes.data || [];
    const enquiries = enquiriesRes.data || [];
    const agents = agentsRes.data || [];

    const totalProperties = buildings.length;
    const verifiedProperties = buildings.filter((b) => {
      const v = String(b.status || b.verification_status || "").toLowerCase();
      return v === "approved" || v === "verified";
    }).length;
    const pendingProperties = buildings.filter((b) => {
      const status = propertyDisplayStatus(b);
      return status === "Pending review";
    }).length;

    const totalUsers = profiles.filter((p) => normalizeAdminRole(p.role) === "renter").length;
    const totalOwners = profiles.filter((p) => normalizeAdminRole(p.role) === "owner").length;
    const pendingOwners = profiles.filter(
      (p) =>
        normalizeAdminRole(p.role) === "owner" &&
        String(p.owner_approval_status || "pending").toLowerCase() === "pending"
    ).length;
    const approvedOwners = profiles.filter(
      (p) =>
        normalizeAdminRole(p.role) === "owner" &&
        String(p.owner_approval_status || "").toLowerCase() === "approved"
    ).length;
    const totalAgents = profiles.filter((p) => normalizeAdminRole(p.role) === "agent").length;

    const pendingAgents = agents.filter((a) => String(a.status || "").toLowerCase() === "pending").length;
    const approvedAgents = agents.filter((a) => String(a.status || "").toLowerCase() === "approved").length;

    return {
      data: {
        totalProperties,
        verifiedProperties,
        pendingProperties,
        totalUsers,
        totalOwners,
        pendingOwners,
        approvedOwners,
        totalAgents,
        pendingAgents,
        approvedAgents,
        totalEnquiries: enquiries.length,
        totalReviews: reviews.length,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Fetches properties for admin review and moderation.
 *
 * @param {Object} [options]
 * @param {string} [options.verificationFilter] 'all' | 'live' | 'pending' | 'rejected'
 * @param {string} [options.typeFilter] Property type ('all', 'PG', 'Room', 'Hotel', 'Flat')
 * @param {string} [options.searchQuery]
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchAdminProperties(options = {}) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  let query = supabase
    .from("buildings")
    .select("*, room_types(*), reviews(*)")
    .order("created_at", { ascending: false });

  if (options.typeFilter && options.typeFilter !== "all") {
    query = query.eq("type", options.typeFilter);
  }

  const { data, error } = await query;
  if (error) return { data: null, error };

  let list = data || [];

  // Filter client-side by moderation status
  if (options.verificationFilter && options.verificationFilter !== "all") {
    const vf = options.verificationFilter.toLowerCase();
    list = list.filter((b) => {
      const status = propertyDisplayStatus(b).toLowerCase();
      if (vf === "live") return status === "live";
      if (vf === "pending") return status === "pending review";
      if (vf === "rejected") return status === "rejected";
      return true;
    });
  }

  // Filter client-side by search query
  if (options.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.trim().toLowerCase();
    list = list.filter(
      (b) =>
        String(b.name || "").toLowerCase().includes(q) ||
        String(b.location || "").toLowerCase().includes(q)
    );
  }

  return { data: list, error: null };
}

/**
 * Approves or rejects a property listing.
 *
 * @param {string} propertyId
 * @param {"approved" | "rejected"} action
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function updatePropertyVerificationStatus(propertyId, action) {
  if (!propertyId) {
    return { success: false, error: new Error("Property ID is required.") };
  }

  const normalized = String(action || "").toLowerCase();
  if (normalized !== "approved" && normalized !== "rejected") {
    return {
      success: false,
      error: new Error("Action must be either 'approved' or 'rejected'."),
    };
  }

  if (!supabase) {
    return {
      success: false,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  // Update only columns that actually exist in the live schema ('status')
  const { error } = await supabase
    .from("buildings")
    .update({
      status: normalized,
    })
    .eq("id", propertyId);

  return { success: !error, error };
}

/**
 * Deletes a property listing by ID.
 *
 * @param {string} propertyId
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function deleteAdminProperty(propertyId) {
  if (!propertyId) {
    return { success: false, error: new Error("Property ID is required.") };
  }

  if (!supabase) {
    return {
      success: false,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { error } = await supabase.from("buildings").delete().eq("id", propertyId);
  return { success: !error, error };
}

/**
 * Fetches user profiles with server-side pagination, role filtering, and search.
 *
 * @param {Object} [options]
 * @param {string} [options.roleFilter] 'all' | 'renter' | 'owner' | 'agent' | 'admin'
 * @param {string} [options.searchQuery]
 * @param {number} [options.page=1] 1-based page number
 * @param {number} [options.pageSize=25] Records per page
 * @returns {Promise<{ data: Array<Object>|null, count: number, page: number, pageSize: number, totalPages: number, error: Error|null }>}
 */
export async function fetchAdminProfiles(options = {}) {
  if (!supabase) {
    return {
      data: null,
      count: 0,
      page: 1,
      pageSize: 25,
      totalPages: 0,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const page = Math.max(1, Number(options.page) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(options.pageSize) || 25));
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Server-side role filter
  if (options.roleFilter && options.roleFilter !== "all") {
    const rf = options.roleFilter.toLowerCase();
    if (rf === "renter") {
      query = query.in("role", ["user", "renter"]);
    } else if (rf === "owner") {
      query = query.in("role", ["owner", "landlord"]);
    } else if (rf === "agent") {
      query = query.eq("role", "agent");
    } else if (rf === "agent_pending") {
      query = query.eq("role", "agent_pending");
    } else if (rf === "admin") {
      query = query.in("role", ["admin", "administrator"]);
    } else {
      query = query.eq("role", rf);
    }
  }

  // Server-side text search across full_name and email
  if (options.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.trim().replace(/[%_]/g, "");
    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    return {
      data: null,
      count: 0,
      page,
      pageSize,
      totalPages: 0,
      error,
    };
  }

  const totalCount = count != null ? count : (data || []).length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return {
    data: data || [],
    count: totalCount,
    page,
    pageSize,
    totalPages,
    error: null,
  };
}

/**
 * Updates an owner's approval status in public.profiles.
 * Requires administrator role in Postgres RLS.
 *
 * @param {string} userId UUID of the owner
 * @param {'approved' | 'rejected' | 'pending'} status
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function updateOwnerApprovalStatus(userId, status) {
  if (!userId) {
    return { success: false, error: new Error("User ID is required.") };
  }

  const normalized = String(status || "").trim().toLowerCase();
  if (!["approved", "rejected", "pending"].includes(normalized)) {
    return {
      success: false,
      error: new Error("Status must be 'approved', 'rejected', or 'pending'."),
    };
  }

  if (!supabase) {
    return {
      success: false,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ owner_approval_status: normalized, updated_at: new Date().toISOString() })
    .eq("id", userId);

  return { success: !error, error };
}

/**
 * Fetches enquiries across properties for administrative oversight.
 *
 * @param {Object} [options]
 * @param {string} [options.statusFilter] 'all' | 'pending' | 'accepted' | 'rejected' | 'contacted'
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchAdminEnquiries(options = {}) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  let query = supabase
    .from("enquiries")
    .select("*, buildings(name, location)")
    .order("created_at", { ascending: false });

  if (options.statusFilter && options.statusFilter !== "all") {
    query = query.eq("status", options.statusFilter.toLowerCase());
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

/**
 * Updates an enquiry's status from the admin console.
 *
 * @param {string} enquiryId
 * @param {string} status 'pending' | 'accepted' | 'rejected' | 'contacted'
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function updateAdminEnquiryStatus(enquiryId, status) {
  if (!enquiryId) {
    return { success: false, error: new Error("Enquiry ID is required.") };
  }

  const validStatuses = ["pending", "accepted", "rejected", "contacted"];
  const safeStatus = String(status || "").trim().toLowerCase();
  if (!validStatuses.includes(safeStatus)) {
    return {
      success: false,
      error: new Error(`Invalid enquiry status: ${status}. Must be one of: ${validStatuses.join(", ")}`),
    };
  }

  if (!supabase) {
    return {
      success: false,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { error } = await supabase
    .from("enquiries")
    .update({ status: safeStatus })
    .eq("id", enquiryId);

  return { success: !error, error };
}

/**
 * Fetches all reviews across properties.
 *
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchAdminReviews() {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*, buildings(name, location)")
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

/**
 * Deletes a review from the administrative console.
 *
 * @param {string} reviewId
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function deleteAdminReview(reviewId) {
  if (!reviewId) {
    return { success: false, error: new Error("Review ID is required.") };
  }

  if (!supabase) {
    return {
      success: false,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  return { success: !error, error };
}

/**
 * Fetches agent applications.
 *
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchAdminAgentApplications() {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { data, error } = await supabase
    .from("agent_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

/**
 * Approves or rejects an agent application and updates the user's profile role.
 *
 * @param {string} applicationId
 * @param {string} userId
 * @param {"approved" | "rejected"} action
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function updateAgentApplicationStatus(applicationId, userId, action) {
  if (!applicationId) {
    return { success: false, error: new Error("Application ID is required.") };
  }

  const normalized = String(action || "").toLowerCase();
  if (normalized !== "approved" && normalized !== "rejected") {
    return {
      success: false,
      error: new Error("Action must be either 'approved' or 'rejected'."),
    };
  }

  if (!supabase) {
    return {
      success: false,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { error: appError } = await supabase
    .from("agent_applications")
    .update({
      status: normalized,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (appError) {
    return { success: false, error: appError };
  }

  if (userId) {
    const nextRole = normalized === "approved" ? "agent" : "user";
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", userId);

    if (profileError) {
      console.warn("[Roomdhundo] Role update after agent review warning:", profileError);
    }
  }

  return { success: true, error: null };
}

/**
 * Deletes an agent application and reverts the user to standard renter/user.
 *
 * @param {string} applicationId
 * @param {string} [userId]
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function deleteAgentApplication(applicationId, userId) {
  if (!applicationId) {
    return { success: false, error: new Error("Application ID is required.") };
  }

  if (!supabase) {
    return {
      success: false,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { error: deleteError } = await supabase
    .from("agent_applications")
    .delete()
    .eq("id", applicationId);

  if (!deleteError && userId) {
    await supabase.from("profiles").update({ role: "user" }).eq("id", userId);
  }

  return { success: !deleteError, error: deleteError };
}

/**
 * Validates agent application input fields.
 *
 * @param {Object} input
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateAgentApplicationInput(input = {}) {
  const errors = {};
  const firstName = String(input.first_name || "").trim();
  const lastName = String(input.last_name || "").trim();
  const phone = String(input.phone || "").trim();
  const email = String(input.email || "").trim();
  const location = String(input.location || "").trim();
  const pincode = String(input.pincode || "").trim();

  if (firstName.length < 2) {
    errors.first_name = "First name must be at least 2 characters.";
  }
  if (lastName.length < 1) {
    errors.last_name = "Last name is required.";
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    errors.phone = "Phone must be a valid 10-digit mobile number.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!location) {
    errors.location = "Please enter your location.";
  }
  if (!/^[0-9]{6}$/.test(pincode)) {
    errors.pincode = "Pin code must be a 6-digit numeric postal code.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Submits a new agent application for approval.
 *
 * @param {Object} applicationData
 * @param {string} applicationData.user_id
 * @param {string} applicationData.first_name
 * @param {string} applicationData.last_name
 * @param {string} applicationData.phone
 * @param {string} applicationData.email
 * @param {string} applicationData.location
 * @param {string} applicationData.pincode
 * @returns {Promise<{ success: boolean, error: Error|null, errors?: Object }>}
 */
export async function submitAgentApplication(applicationData) {
  const { valid, errors } = validateAgentApplicationInput(applicationData);
  if (!valid) {
    return { success: false, error: new Error("Validation failed."), errors };
  }

  if (!applicationData.user_id) {
    return { success: false, error: new Error("User ID is required.") };
  }

  if (!supabase) {
    return {
      success: false,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const payload = {
    user_id: applicationData.user_id,
    first_name: applicationData.first_name.trim(),
    last_name: applicationData.last_name.trim(),
    phone: applicationData.phone.trim(),
    email: applicationData.email.trim(),
    location: applicationData.location.trim(),
    pincode: applicationData.pincode.trim(),
    status: "pending",
  };

  const { error: appError } = await supabase
    .from("agent_applications")
    .upsert(payload, { onConflict: "user_id" });

  if (appError) {
    return { success: false, error: appError };
  }

  // Update profile role to agent_pending
  const fullName = `${payload.first_name} ${payload.last_name}`.trim();
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: applicationData.user_id,
      full_name: fullName,
      role: "agent_pending",
    });

  if (profileError) {
    console.warn("[Roomdhundo] Agent pending role update fallback:", profileError);
  }

  return { success: true, error: null };
}

/**
 * Fetches an existing agent application for a user.
 *
 * @param {string} userId
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function fetchUserAgentApplication(userId) {
  if (!userId) {
    return { data: null, error: new Error("User ID is required.") };
  }

  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { data, error } = await supabase
    .from("agent_applications")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return { data: data || null, error };
}

/**
 * Fetches economy deals for administrative insight.
 *
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchAdminEconomyDeals() {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  try {
    const { data, error } = await supabase
      .from("economy_deals")
      .select("*")
      .order("created_at", { ascending: false });

    return { data: data || [], error };
  } catch (err) {
    return { data: [], error: err };
  }
}
