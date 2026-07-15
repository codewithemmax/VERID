"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarketHeader } from "@/components/marketplace/MarketHeader";
import { useAuth } from "@/context/AuthProvider";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <MarketHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 py-16">
        <h1 className="text-3xl font-extrabold">Welcome back</h1>
        <p className="mt-2 text-ink-soft">Log in to post and manage your listings.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="rounded-2xl bg-tint px-4 py-3 text-sm text-ink">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-2xl bg-magenta px-6 py-3.5 font-bold text-white shadow-lift transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-soft">
          New to Kora?{" "}
          <Link href="/signup" className="font-semibold text-magenta">
            Create an account
          </Link>
        </p>
      </main>
    </>
  );
}
