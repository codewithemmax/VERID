"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";

/** Right-side header controls that depend on auth state. */
export function HeaderAuthNav() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return <span className="text-sm text-ink-soft">…</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
        >
          Log in
        </Link>
        <Link href="/signup" className="mk-tag bg-magenta text-white">
          Sign up
        </Link>
      </div>
    );
  }

  const name =
    (user.user_metadata?.display_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "you";

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/sell" className="mk-tag bg-violet/10 text-violet">
        + Sell
      </Link>
      <span className="hidden text-sm text-ink-soft sm:inline">
        Hi, <span className="font-semibold text-ink">{name}</span>
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        Log out
      </button>
    </div>
  );
}
