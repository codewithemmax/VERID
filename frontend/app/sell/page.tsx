"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketHeader } from "@/components/marketplace/MarketHeader";
import { useAuth } from "@/context/AuthProvider";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { CATEGORIES, medianForCategory } from "@/lib/categories";

export default function SellPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [condition, setCondition] = useState("New");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Gate to signed-in users.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <>
        <MarketHeader />
        <main className="mx-auto max-w-xl px-5 py-16 text-ink-soft">Loading…</main>
      </>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceInt = Math.round(Number(price));
    if (!Number.isFinite(priceInt) || priceInt <= 0) {
      setError("Enter a valid price in naira.");
      return;
    }

    const images = imagesText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 5);
    if (images.length === 0) {
      setError("Add at least one image URL (one per line).");
      return;
    }
    if (!images.every((u) => /^https?:\/\//i.test(u))) {
      setError("Image URLs must start with http:// or https://");
      return;
    }

    setBusy(true);
    const supabase = getBrowserSupabase();
    const { data, error: insertError } = await supabase
      .from("listings")
      .insert({
        seller_id: user!.id,
        title: title.trim(),
        subtitle: subtitle.trim(),
        category,
        condition: condition.trim(),
        location: location.trim(),
        description: description.trim(),
        price: priceInt,
        category_median_price: medianForCategory(category, priceInt),
        images,
        reviews: [],
      })
      .select("id")
      .single();
    setBusy(false);

    if (insertError || !data) {
      setError(insertError?.message ?? "Could not post your listing.");
      return;
    }
    router.push(`/listing/${data.id}`);
    router.refresh();
  }

  const field =
    "rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-magenta";

  return (
    <>
      <MarketHeader />
      <main className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="text-3xl font-extrabold sm:text-4xl">List a product</h1>
        <p className="mt-2 text-ink-soft">
          Your listing goes live instantly — and Verid analyses it just like any
          other.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={field}
              placeholder="e.g. Handmade beaded necklace"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">
              Subtitle <span className="text-ink-soft">(optional)</span>
            </span>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={field}
              placeholder="A short one-liner"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={field}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Condition</span>
              <input
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className={field}
                placeholder="New / Used — good…"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Price (₦)</span>
              <input
                type="number"
                min={1}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={field}
                placeholder="70000"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">
                Location <span className="text-ink-soft">(optional)</span>
              </span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={field}
                placeholder="Lagos"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Description</span>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className={`${field} resize-y`}
              placeholder="Describe your product honestly and clearly."
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Image URLs</span>
            <textarea
              required
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              rows={3}
              className={`${field} resize-y font-mono text-sm`}
              placeholder={"One URL per line (max 5)\nhttps://…/photo1.jpg"}
            />
            <span className="text-xs text-ink-soft">
              Paste public image links — one per line, up to 5.
            </span>
          </label>

          {error && (
            <p className="rounded-2xl bg-tint px-4 py-3 text-sm text-ink">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-2xl bg-magenta px-6 py-3.5 font-bold text-white shadow-lift transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Posting…" : "Post listing"}
          </button>
        </form>
      </main>
    </>
  );
}
