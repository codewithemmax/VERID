"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarketHeader } from "@/components/marketplace/MarketHeader";
import { useAuth } from "@/context/AuthProvider";

const API = process.env.NEXT_PUBLIC_VERID_API_URL ?? "http://localhost:3001";

type Step = "details" | "verify";

export default function SignupPage() {
  const { signUp, signIn } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Step 1 — collect details, send code
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Could not send code. Try again.");
        return;
      }
      setStep("verify");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  // Step 2 — verify code, then create account
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // Verify the code first
      const vRes = await fetch(`${API}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const vData = await vRes.json();
      if (!vRes.ok) {
        setError(vData.error?.message ?? "Verification failed.");
        return;
      }

      // Code correct — create the Supabase account
      const { error: signUpError } = await signUp(email, password, displayName.trim());
      if (signUpError) {
        setError(signUpError);
        return;
      }
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        // Account created but email confirmation may be required
        router.push("/login");
        return;
      }
      router.push("/sell");
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error?.message ?? "Could not resend code.");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <MarketHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 py-16">
        {step === "details" ? (
          <>
            <h1 className="text-3xl font-extrabold">Join Kora Market</h1>
            <p className="mt-2 text-ink-soft">
              Create an account to list your products for sale.
            </p>

            <form onSubmit={handleSendCode} className="mt-8 flex flex-col gap-4">
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

              <button
                type="submit"
                disabled={busy}
                className="mt-2 rounded-2xl bg-magenta px-6 py-3.5 font-bold text-white shadow-lift transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {busy ? "Sending code…" : "Continue"}
              </button>
            </form>

            <p className="mt-6 text-sm text-ink-soft">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-magenta">
                Log in
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold">Check your email</h1>
            <p className="mt-2 text-ink-soft">
              We sent a 6-digit code to <span className="font-semibold text-ink">{email}</span>. It expires in 10 minutes.
            </p>

            <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Verification code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="rounded-2xl border border-line bg-surface px-4 py-3 text-center text-2xl font-black tracking-widest outline-none focus:border-magenta"
                  placeholder="000000"
                />
              </label>

              {error && (
                <p className="rounded-2xl bg-tint px-4 py-3 text-sm text-ink">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="mt-2 rounded-2xl bg-magenta px-6 py-3.5 font-bold text-white shadow-lift transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {busy ? "Verifying…" : "Verify & create account"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3 text-sm text-ink-soft">
              <button
                type="button"
                onClick={() => { setStep("details"); setError(null); setCode(""); }}
                className="font-semibold text-ink-soft hover:text-ink"
              >
                ← Change email
              </button>
              <span>·</span>
              <button
                type="button"
                disabled={busy}
                onClick={handleResend}
                className="font-semibold text-magenta disabled:opacity-60"
              >
                Resend code
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
