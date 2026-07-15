import Link from "next/link";
import { MarketHeader } from "@/components/marketplace/MarketHeader";
import { getAllListings } from "@/lib/listings";
import { formatNaira, percentBelowMedian } from "@/lib/format";
import { Stars } from "@/components/marketplace/Stars";
import type { Listing } from "@/lib/types";

// Reads live data from Supabase on every request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let listings: Listing[] = [];
  let loadError: string | null = null;
  try {
    listings = await getAllListings();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load listings.";
  }

  return (
    <>
      <MarketHeader />

      <main className="mx-auto max-w-6xl px-5 pb-20">
        {/* Hero */}
        <section className="relative mt-8 overflow-hidden rounded-card bg-gradient-to-br from-magenta via-violet to-cobalt px-8 py-14 text-white shadow-lift sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-cyan/40 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />
          <p className="relative mk-tag bg-white/15 text-white">
            Handmade · Vintage · One-of-a-kind
          </p>
          <h1 className="relative mt-4 max-w-2xl text-4xl font-black leading-[1.05] sm:text-6xl">
            Find something with a story.
          </h1>
          <p className="relative mt-4 max-w-xl text-lg text-white/85">
            Kora Market is where Nigerian makers, collectors and sellers meet
            buyers who care about the real thing.
          </p>
          <Link
            href="/sell"
            className="relative mt-6 inline-flex rounded-2xl bg-white px-6 py-3 font-bold text-magenta shadow-lift transition-transform hover:-translate-y-0.5"
          >
            Start selling
          </Link>
        </section>

        {/* Listing grid */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Fresh finds today
            </h2>
            <span className="text-sm font-semibold text-ink-soft">
              {listings.length} listing{listings.length === 1 ? "" : "s"}
            </span>
          </div>

          {loadError ? (
            <p className="mt-6 rounded-card border border-dashed border-line bg-surface/60 p-8 text-ink-soft">
              Couldn&apos;t load the marketplace. Check that Supabase env vars are
              set in <code>frontend/.env.local</code>.
              <span className="mt-2 block text-xs">{loadError}</span>
            </p>
          ) : listings.length === 0 ? (
            <div className="mt-6 rounded-card border border-dashed border-line bg-surface/60 p-8">
              <p className="font-semibold">No listings yet.</p>
              <p className="mt-1 text-ink-soft">
                Run <code>npm run seed</code> to load the three demo listings, or{" "}
                <Link href="/sell" className="font-semibold text-magenta">
                  post your own
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul
              className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
            >
              {listings.map((listing) => {
                const below = percentBelowMedian(
                  listing.price,
                  listing.categoryMedianPrice,
                );
                return (
                  <li key={listing.id}>
                    <Link
                      href={`/listing/${listing.id}`}
                      className="group block overflow-hidden rounded-card border border-line bg-surface shadow-lift-sm transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lift"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-tint">
                        {listing.images[0] && (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                          />
                        )}
                        <span className="absolute left-3 top-3 mk-tag bg-surface/90 text-ink shadow-lift-sm">
                          {listing.category}
                        </span>
                        {below >= 35 && (
                          <span className="absolute right-3 top-3 mk-tag bg-magenta text-white shadow-lift-sm">
                            {below}% off market
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="line-clamp-2 text-lg font-bold leading-snug">
                          {listing.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                          <span className="truncate">{listing.sellerName}</span>
                          {listing.sellerVerified && (
                            <span className="text-cobalt">✓</span>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xl font-black text-magenta">
                            {formatNaira(listing.price)}
                          </span>
                          {listing.sellerRating !== null && (
                            <span className="inline-flex items-center gap-1 text-sm font-semibold">
                              {listing.sellerRating.toFixed(1)}
                              <Stars rating={listing.sellerRating} size={12} />
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
