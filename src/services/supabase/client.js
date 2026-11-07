import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) ||
  "";

const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_ANON_KEY) ||
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "[Roomdhundo] Supabase environment variables are missing.\n" +
      "Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.\n" +
      "Database and storage operations will be unavailable until these are set."
  );
}

// Single instance of Supabase client across the application
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Returns the centralized Supabase client instance.
 * Throws a descriptive error if the client is not configured.
 * Use this in service calls that require an active client.
 */
export function getSupabase() {
  if (!supabase) {
    throw new Error(
      "[Roomdhundo] Supabase client is not initialized. " +
        "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in .env.local."
    );
  }
  return supabase;
}

export default supabase;
