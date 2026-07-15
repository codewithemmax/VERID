"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarketHeader } from "@/components/marketplace/MarketHeader";
import { useAuth } from "@/context/AuthProvider";

export default function SignupPage() {
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const { error: signUpError } = await signUp(email, password, displayName.trim());
    if (signUpError) {
      setBusy(false);
      setError(signUpError);
      return;
    }
    // If the project has email confirmation off, signing in now gives a session.
    const { error: signInError } = await signIn(email, password);
    setBusy(false);
    if (signInError) {
      setNotice(
        "Account created. Please confirm your email, then log in to start selling.",
      );
      return;
    }
    router.push("/sell");
    router.refresh();
  }

  return (
    <>
      <MarketHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 py-16">
        <h1 className="text-3xl font-extrabold">Join Kora Market</h1>
        <p className="mt-2 text-ink-soft">
          Create an account to list your products for sale.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Display name</span>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-magenta"
              placeholder="e.g. Ada's Craft Store"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-magenta"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-magenta"
              placeholder="At least 6 characters"
            />
          </label>

          {error && (
            <p className="rounded-2xl bg-tint px-4 py-3 text-sm text-ink">{error}</p>
          )}
          {notice && (
            <p className="rounded-2xl bg-violet/10 px-4 py-3 text-sm text-violet">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-2xl bg-magenta px-6 py-3.5 font-bold text-white shadow-lift transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-magenta">
            Log in
          </Link>
        </p>
      </main>
    </>
  );
}
