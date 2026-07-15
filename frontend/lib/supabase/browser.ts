import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client — carries the signed-in user's session (persisted in
 * localStorage). Used by client components for auth and for owner-scoped writes
 * (posting a listing). Only the anon key is used here; it is public-safe and
 * everything sensitive is enforced by RLS in the database.
 */
let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local",
    );
  }

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}
