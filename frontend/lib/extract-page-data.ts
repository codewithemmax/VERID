// F2.1 — DOM extraction utility.
// Reads data-verid-target attributes only — never CSS classes or IDs.
// Review author names are never read into the payload (PII).

import type { AnalyzeRequest } from "@shared/types";

function attr(el: Element, name: string): string {
  return el.getAttribute(name) ?? "";
}

export function extractPageData(): AnalyzeRequest | null {
  if (typeof document === "undefined") return null;

  const get = (target: string): Element | null =>
    document.querySelector(`[data-verid-target="${target}"]`);
  const getAll = (target: string): Element[] =>
    Array.from(document.querySelectorAll(`[data-verid-target="${target}"]`));

  const titleEl = get("title");
  const priceEl = get("price");
  const descEl = get("description");
  const ageEl = get("seller-age");
  const ratingEl = get("seller-rating");
  const reviewCountEl = get("seller-reviews");
  const verifiedEl = get("seller-verified");
  const reviewEls = getAll("reviews");
  const imageEls = getAll("images");

  if (!titleEl || !priceEl || !descEl) return null;

  const price = parseInt(attr(priceEl, "data-verid-value"), 10);
  const categoryMedianPrice = parseInt(attr(priceEl, "data-verid-median"), 10);
  const sellerAccountAgeDays = parseInt(attr(ageEl ?? document.createElement("span"), "data-verid-value"), 10);
  const ratingRaw = attr(ratingEl ?? document.createElement("span"), "data-verid-value");
  const sellerRating = ratingRaw === "" ? null : parseFloat(ratingRaw);
  const sellerReviewCount = parseInt(attr(reviewCountEl ?? document.createElement("span"), "data-verid-value"), 10) || 0;
  const sellerVerified = attr(verifiedEl ?? document.createElement("span"), "data-verid-value") === "true";

  const images = imageEls
    .map((el) => (el as HTMLImageElement).src)
    .filter((src) => src && src.startsWith("http"));

  // Reviews: read body, rating, date — never the author name.
  const reviews = reviewEls.map((el) => {
    const bodyEl = el.querySelector("[data-verid-field=\"body\"]");
    return {
      body: bodyEl?.textContent?.trim() ?? "",
      rating: parseInt(attr(el, "data-verid-rating"), 10) || 3,
      postedAt: attr(el, "data-verid-date"),
    };
  }).filter((r) => r.body.length > 0);

  return {
    title: titleEl.textContent?.trim() ?? "",
    price: isNaN(price) ? 0 : price,
    categoryMedianPrice: isNaN(categoryMedianPrice) ? 0 : categoryMedianPrice,
    description: descEl.textContent?.trim() ?? "",
    sellerAccountAgeDays: isNaN(sellerAccountAgeDays) ? 0 : sellerAccountAgeDays,
    sellerRating: sellerRating !== null && isNaN(sellerRating) ? null : sellerRating,
    sellerReviewCount,
    sellerVerified,
    images,
    reviews,
  };
}
