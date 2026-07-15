import type { Listing } from "@/lib/types";
import { formatAccountAge } from "@/lib/format";
import { Stars } from "./Stars";

/**
 * SellerCard — seller identity and trust surface as an ordinary marketplace
 * would show it.
 *
 * Extraction hooks: `seller-age`, `seller-rating`, `seller-reviews`,
 * `seller-verified`. Each carries a machine value in `data-verid-value` so F2.1
 * reads numbers/booleans directly. `seller-verified` extends the documented
 * target list because `sellerVerified` is part of the AnalyzeRequest contract
 * but has no other natural DOM home.
 */
export function SellerCard({ listing }: { listing: Listing }) {
  const initial = listing.sellerName.charAt(0).toUpperCase();

  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-lift-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-magenta to-violet text-xl font-black text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-lg font-bold">{listing.sellerName}</p>
            <span
              data-verid-target="seller-verified"
              data-verid-value={String(listing.sellerVerified)}
            >
              {listing.sellerVerified ? (
                <span className="mk-tag bg-cobalt/10 text-cobalt">
                  ✓ Verified
                </span>
              ) : (
                <span className="mk-tag bg-tint text-ink-soft">Unverified</span>
              )}
            </span>
          </div>
          <p className="text-sm text-ink-soft">{listing.location}</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-canvas p-3">
          <dt className="text-xs font-semibold uppercase text-ink-soft">
            On Kora
          </dt>
          <dd
            data-verid-target="seller-age"
            data-verid-value={listing.sellerAccountAgeDays}
            className="mt-1 font-bold"
          >
            {formatAccountAge(listing.sellerAccountAgeDays)}
          </dd>
        </div>
        <div className="rounded-2xl bg-canvas p-3">
          <dt className="text-xs font-semibold uppercase text-ink-soft">
            Rating
          </dt>
          <dd
            data-verid-target="seller-rating"
            data-verid-value={listing.sellerRating ?? ""}
            className="mt-1 font-bold"
          >
            {listing.sellerRating !== null ? (
              <span className="inline-flex items-center gap-1">
                {listing.sellerRating.toFixed(1)}
                <Stars rating={listing.sellerRating} size={13} />
              </span>
            ) : (
              <span className="text-ink-soft">—</span>
            )}
          </dd>
        </div>
        <div className="rounded-2xl bg-canvas p-3">
          <dt className="text-xs font-semibold uppercase text-ink-soft">
            Reviews
          </dt>
          <dd
            data-verid-target="seller-reviews"
            data-verid-value={listing.sellerReviewCount}
            className="mt-1 font-bold"
          >
            {listing.sellerReviewCount}
          </dd>
        </div>
      </dl>
    </section>
  );
}
