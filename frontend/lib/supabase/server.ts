import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server Supabase client — anonymous, no user session. Used by server
 * components to read the public marketplace (listings + profiles are
 * select-open under RLS). Never used for writes; never touches the service key.
 */
export function getServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local",
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
