import type { Listing } from "@/lib/types";
import { formatNaira } from "@/lib/format";

/**
 * ProductDetails — title, category, price and description.
 *
 * Extraction hooks: `title`, `price`, `description`. The price element also
 * carries the raw integer (`data-verid-value`) and the category baseline
 * (`data-verid-median`) so F2.1 never has to parse "₦" and thousands
 * separators, and so `categoryMedianPrice` has a DOM source. The overlay never
 * imports this data — it re-reads the DOM.
 */
export function ProductDetails({ listing }: { listing: Listing }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mk-tag bg-violet/10 text-violet">
          {listing.category}
        </span>
        <span className="mk-tag bg-cyan/10 text-cyan">{listing.condition}</span>
      </div>

      <h1
        data-verid-target="title"
        className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl"
      >
        {listing.title}
      </h1>
      <p className="mt-2 text-ink-soft">{listing.subtitle}</p>

      <div className="mt-6 flex items-end gap-3">
        <span
          data-verid-target="price"
          data-verid-value={listing.price}
          data-verid-median={listing.categoryMedianPrice}
          className="text-4xl font-black text-magenta"
        >
          {formatNaira(listing.price)}
        </span>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">
          About this item
        </h2>
        <p
          data-verid-target="description"
          className="mt-3 max-w-prose leading-relaxed text-ink/90"
        >
          {listing.description}
        </p>
      </div>
    </div>
  );
}
