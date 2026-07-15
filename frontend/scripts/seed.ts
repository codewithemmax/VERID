/**
 * Seed the three crafted demo listings into Supabase as rows owned by demo
 * seller accounts. These are the deterministic demo anchors (clear / caution /
 * block). Run after applying supabase/migrations/0001_marketplace.sql:
 *
 *   npm run seed                (from frontend/)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 * frontend/.env.local. The service-role key bypasses RLS — this script is the
 * ONLY place it is used, and it never ships in the app bundle.
 *
 * Idempotent: re-running re-creates the demo sellers if missing, refreshes their
 * profiles, and replaces their listings.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SEED_LISTINGS, SEED_SELLERS } from "../lib/seed-listings";

// --- tiny .env.local loader (no dotenv dependency) -------------------------
function loadEnvLocal(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(here, "..", ".env.local");
  let raw: string;
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    console.error(`Missing ${envPath}. Copy .env.local.example and fill it in.`);
    process.exit(1);
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function findUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  // Demo project has few users; first page is plenty.
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) throw error;
  const match = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  return match?.id ?? null;
}

async function ensureUser(
  admin: SupabaseClient,
  email: string,
  password: string,
  displayName: string,
): Promise<string> {
  const existing = await findUserByEmail(admin, email);
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error || !data.user) {
    throw error ?? new Error(`Could not create user ${email}`);
  }
  return data.user.id;
}

async function main(): Promise<void> {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local",
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const seller of SEED_SELLERS) {
    const listing = SEED_LISTINGS.find((l) => l.id === seller.listingId);
    if (!listing) {
      throw new Error(`No seed listing for ${seller.listingId}`);
    }

    const userId = await ensureUser(
      admin,
      seller.email,
      seller.password,
      seller.displayName,
    );

    // Back-date created_at so the crafted account age holds; set reputation.
    const createdAt = new Date(
      Date.now() - seller.accountAgeDays * 86_400_000,
    ).toISOString();

    const { error: profileErr } = await admin.from("profiles").upsert({
      id: userId,
      display_name: seller.displayName,
      verified: seller.verified,
      rating: seller.rating,
      review_count: seller.reviewCount,
      created_at: createdAt,
    });
    if (profileErr) throw profileErr;

    // Replace this seller's listings for clean idempotency.
    const { error: delErr } = await admin
      .from("listings")
      .delete()
      .eq("seller_id", userId);
    if (delErr) throw delErr;

    const { error: insErr } = await admin.from("listings").insert({
      seller_id: userId,
      title: listing.title,
      subtitle: listing.subtitle,
      category: listing.category,
      condition: listing.condition,
      location: listing.location,
      description: listing.description,
      price: listing.price,
      category_median_price: listing.categoryMedianPrice,
      images: listing.images,
      reviews: listing.reviews,
    });
    if (insErr) throw insErr;

    console.log(
      `✓ seeded ${seller.displayName} → "${listing.title}" (${listing.expectedBand})`,
    );
  }

  console.log("\nDone. Three demo listings are live in the DB.");
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
