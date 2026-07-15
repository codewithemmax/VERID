"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser";

/**
 * AuthProvider — wraps the Supabase auth session for the marketplace host.
 * This is host concern, entirely separate from Verid: the overlay never reads
 * auth state, and auth never reads Verid state.
 */
interface AuthState {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const NO_SUPABASE = "Auth unavailable — Supabase env is not configured.";

export function AuthProvider({ children }: { children: ReactNode }) {
  // Resolve the client once, tolerating missing env so the app still builds and
  // renders before credentials are set (auth is simply disabled until then).
  const [supabase] = useState(() => {
    try {
      return getBrowserSupabase();
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (!active) return;
        setUser(data.session?.user ?? null);
        setLoading(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      async signUp(email, password, displayName) {
        if (!supabase) return { error: NO_SUPABASE };
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        return { error: error ? error.message : null };
      },
      async signIn(email, password) {
        if (!supabase) return { error: NO_SUPABASE };
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error ? error.message : null };
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    }),
    [user, loading, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}
