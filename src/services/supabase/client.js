import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Roomdhundo] Supabase environment variables are missing.\n" +
      "Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.\n" +
      "Database and authentication operations will be unavailable until these are set."
  );
}

// Single instance of Supabase client across the application
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default supabase;

