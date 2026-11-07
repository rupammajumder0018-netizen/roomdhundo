/**
 * Roomdhundo — Authentication Service
 *
 * Encapsulates Supabase Auth operations and profile synchronization.
 * Ported and verified against:
 * - `files6.0/script.js` (lines 1580–2710)
 * - `files6.0/schema.sql` (`public.handle_new_user()` trigger)
 */

import { supabase } from "../supabase/client.js";

/**
 * Normalizes any database role string into a recognized role kind:
 * 'admin', 'owner', 'agent', or 'user'.
 *
 * @param {string} role
 * @returns {'admin'|'owner'|'agent'|'user'}
 */
export function accountKindFromRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (value === "admin" || value === "administrator" || value === "super_admin") return "admin";
  if (value === "owner" || value === "landlord" || value === "property_owner") return "owner";
  if (value === "agent" || value === "agent_pending") return "agent";
  return "user";
}

/**
 * Returns human-readable label for an account kind.
 *
 * @param {string} kind
 * @returns {string}
 */
export function accountKindLabel(kind) {
  const normalized = accountKindFromRole(kind);
  if (normalized === "owner") return "Owner";
  if (normalized === "admin") return "Admin";
  if (normalized === "agent") return "Agent";
  return "Renter";
}

/**
 * Determines whether a role is authorized to list or manage properties.
 *
 * @param {string} role
 * @returns {boolean}
 */
export function isListingOwnerRole(role) {
  const kind = accountKindFromRole(role);
  return kind === "owner" || kind === "admin" || kind === "agent";
}

/**
 * Constructs a friendly error message when a user attempts to log in
 * with a role different from their registered account type.
 *
 * @param {string} actualKind
 * @param {string} wantedKind
 * @returns {string}
 */
export function differentEmailRoleMessage(actualKind, wantedKind) {
  return `This email is already registered as a ${accountKindLabel(actualKind)}. ` +
    `Sign in as ${accountKindLabel(actualKind)}, or use a different email to sign up as a ${accountKindLabel(wantedKind)}.`;
}

/**
 * Fetches the user profile from `public.profiles`.
 * Trusted source for user roles.
 *
 * @param {string} userId
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function fetchUserProfile(userId) {
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
    .from("profiles")
    .select("id, full_name, email, role, phone, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  return { data, error };
}

/**
 * Safely upserts user profile information.
 *
 * @param {string} userId
 * @param {Object} fields
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function upsertUserProfile(userId, fields = {}) {
  if (!userId) {
    return { data: null, error: new Error("User ID is required.") };
  }

  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const payload = {
    id: userId,
    ...(fields.full_name ? { full_name: fields.full_name } : {}),
    ...(fields.email ? { email: fields.email } : {}),
    ...(fields.phone ? { phone: fields.phone } : {}),
  };

  // Security: Only allow legitimate non-privileged role assignment on initial profile creation.
  // Explicitly disallow 'admin', 'administrator', or any unauthorized privileged role.
  if (fields.role) {
    const roleCandidate = String(fields.role).trim().toLowerCase();
    const allowedRoles = ["user", "owner", "agent_pending", "agent"];
    if (allowedRoles.includes(roleCandidate)) {
      payload.role = roleCandidate === "agent" ? "agent_pending" : roleCandidate;
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload)
    .select()
    .maybeSingle();

  return { data, error };
}

/**
 * Signs in a user using email and password.
 *
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function signInWithEmail({ email, password }) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  return { data, error };
}

/**
 * Registers a new user with email, password, and profile metadata.
 * Triggers `handle_new_user()` in Postgres to create `public.profiles` row.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.fullName
 * @param {'user'|'owner'|'agent'} [params.role='user']
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function signUpWithEmail({ email, password, fullName, role = "user" }) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  // Security: Restrict public signup roles to legitimate user accounts only.
  // Privileged roles like 'admin' cannot be obtained via signup metadata.
  const normalizedRole = String(role || "user").trim().toLowerCase();
  let signupRole = "user";
  if (normalizedRole === "owner") {
    signupRole = "owner";
  } else if (normalizedRole === "agent" || normalizedRole === "agent_pending") {
    signupRole = "agent_pending";
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName?.trim() || "",
        name: fullName?.trim() || "",
        role: signupRole,
      },
    },
  });

  return { data, error };
}

/**
 * Initiates Google OAuth sign-in flow.
 *
 * @param {Object} [params]
 * @param {string} [params.role='user'] Selected role intent ('user', 'owner', 'agent')
 * @param {string} [params.redirectTo] Target OAuth callback URL
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function signInWithGoogle({ role = "user", redirectTo } = {}) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const targetRedirect =
    redirectTo ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined);

  if (typeof sessionStorage !== "undefined" && role) {
    sessionStorage.setItem("roomdhundo_oauth_role", role);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: targetRedirect,
      queryParams: { prompt: "select_account" },
    },
  });

  return { data, error };
}

/**
 * Exchanges OAuth authorization code for a session.
 *
 * @param {string} code
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function exchangeOAuthCode(code) {
  if (!code) {
    return { data: null, error: new Error("Authorization code is required.") };
  }

  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  return { data, error };
}

/**
 * Signs out the currently authenticated user.
 *
 * @returns {Promise<{ error: Error|null }>}
 */
export async function signOut() {
  if (!supabase) {
    return {
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Sends a password recovery email.
 *
 * @param {string} email
 * @param {string} [redirectTo]
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function sendPasswordResetEmail(email, redirectTo) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const targetRedirect =
    redirectTo ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/reset-password`
      : undefined);

  const { data, error } = await supabase.auth.resetPasswordForEmail(
    email.trim(),
    {
      redirectTo: targetRedirect,
    }
  );

  return { data, error };
}

/**
 * Updates the password for the current user session (used during password recovery).
 *
 * @param {string} newPassword
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateUserPassword(newPassword) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("[Roomdhundo] Supabase client is not configured."),
    };
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}
