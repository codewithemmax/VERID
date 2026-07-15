import { getServerSupabase } from "@/lib/supabase/server";
import type { Listing, ListingReview } from "@/lib/types";

/**
 * Reads the public marketplace from Supabase and maps rows → the shared
 * `Listing` shape the components consume. A listing is joined to its seller
 * profile; account age is computed at read time from the profile's created_at
 * so it never goes stale.
 */

const LISTING_SELECT =
  "id, title, subtitle, category, condition, location, description, price, category_median_price, images, reviews, profiles!inner(display_name, verified, rating, review_count, created_at)";

interface ProfileJoin {
  display_name: string;
  verified: boolean;
  rating: number | null;
  review_count: number;
  created_at: string;
}

interface ListingRow {
  id: string;
  title: string;
  subtitle: string | null;
  category: string;
  condition: string | null;
  location: string | null;
  description: string;
  price: number;
  category_median_price: number;
  images: string[] | null;
  reviews: ListingReview[] | null;
  // supabase types a joined relation as an array; !inner still returns one row.
  profiles: ProfileJoin | ProfileJoin[];
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function mapRow(row: ListingRow): Listing {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? "",
    category: row.category,
    condition: row.condition ?? "",
    location: row.location ?? "",
    sellerName: profile?.display_name ?? "Unknown seller",
    price: row.price,
    categoryMedianPrice: row.category_median_price,
    description: row.description,
    sellerAccountAgeDays: profile ? daysSince(profile.created_at) : 0,
    sellerRating: profile?.rating ?? null,
    sellerReviewCount: profile?.review_count ?? 0,
    sellerVerified: profile?.verified ?? false,
    images: row.images ?? [],
    reviews: row.reviews ?? [],
  };
}

export async function getAllListings(): Promise<Listing[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load listings: ${error.message}`);
  return (data as unknown as ListingRow[]).map(mapRow);
}

export async function getListingById(id: string): Promise<Listing | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load listing: ${error.message}`);
  if (!data) return null;
  return mapRow(data as unknown as ListingRow);
}
