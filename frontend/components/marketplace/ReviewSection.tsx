import type { ListingReview } from "@/lib/types";
import { formatReviewDate } from "@/lib/format";
import { Stars } from "./Stars";

/**
 * ReviewSection — the marketplace shows reviewer names, as any real listing
 * does. But those names are PII and are ABSENT from the API contract.
 *
 * Extraction hooks: each review is a `data-verid-target="reviews"` element
 * carrying `data-verid-rating` and `data-verid-date`, with the body in a nested
 * `[data-verid-field="body"]`. The author name lives in a plain element with NO
 * verid marker, so F2.1 reads body/rating/date and never touches the name. This
 * is the DOM-level guarantee behind the "we store no PII" pitch.
 */
export function ReviewSection({ reviews }: { reviews: ListingReview[] }) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-extrabold">Reviews</h2>
        <span className="text-sm text-ink-soft">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </span>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-4 rounded-card border border-dashed border-line bg-surface/60 p-6 text-ink-soft">
          No reviews yet — this seller is new to Kora.
        </p>
      ) : (
        <ul className="mt-5 space-y-4" role="list">
          {reviews.map((review, i) => (
            <li
              key={i}
              data-verid-target="reviews"
              data-verid-rating={review.rating}
              data-verid-date={review.postedAt}
              className="rounded-card border border-line bg-surface p-5 shadow-lift-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Author name — displayed, but intentionally unmarked so
                      extraction never reads it into the payload. */}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint text-sm font-bold text-ink">
                    {review.author.charAt(0)}
                  </span>
                  <span className="font-semibold">{review.author}</span>
                </div>
                <Stars rating={review.rating} size={14} />
              </div>
              <p
                data-verid-field="body"
                className="mt-3 leading-relaxed text-ink/90"
              >
                {review.body}
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                {formatReviewDate(review.postedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
