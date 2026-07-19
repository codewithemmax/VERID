import type { AnalyzeRequest } from '../shared/types';

// ─── Tier 1: JSON-LD ────────────────────────────────────────────────────────

export function extractFromJsonLd(): Partial<AnalyzeRequest> {
  try {
    const scripts = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    );
    for (const script of scripts) {
      const data = JSON.parse(script.textContent ?? '{}');
      const product = data['@type'] === 'Product' ? data
        : Array.isArray(data['@graph'])
          ? data['@graph'].find((n: { '@type': string }) => n['@type'] === 'Product')
          : null;
      if (!product) continue;

      const price = Number(product.offers?.price ?? product.offers?.lowPrice ?? 0);
      const images: string[] = Array.isArray(product.image)
        ? product.image.map((i: string | { url: string }) =>
            typeof i === 'string' ? i : i.url)
        : product.image ? [product.image] : [];

      const reviews = Array.isArray(product.review)
        ? product.review.map((r: { reviewBody?: string; reviewRating?: { ratingValue?: number }; datePublished?: string }) => ({
            body:     r.reviewBody ?? '',
            rating:   Number(r.reviewRating?.ratingValue ?? 3),
            postedAt: r.datePublished ?? '',
          })).filter((r: { body: string }) => r.body.length > 0)
        : [];

      return {
        title:       product.name ?? '',
        price:       isNaN(price) ? 0 : price,
        description: product.description ?? '',
        images,
        reviews,
      };
    }
  } catch { /* malformed JSON-LD — fall through to DOM tier */ }
  return {};
}

// ─── Tier 2: DOM selectors ──────────────────────────────────────────────────

function tryQuery(selectors: string[]): string {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) return el.textContent.trim();
    } catch { /* bad selector */ }
  }
  return '';
}

function tryAttr(selectors: string[], attr: string): string {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      const val = el?.getAttribute(attr)?.trim();
      if (val) return val;
    } catch { /* bad selector */ }
  }
  return '';
}

export function extractFromDom(): Partial<AnalyzeRequest> {
  const result: Partial<AnalyzeRequest> = {};

  // Title
  const title = tryQuery([
    'h1[class*="name"]', '[data-qa="pdp-product-name"]',
    'h1[class*="title"]', 'h1',
  ]);
  if (title) result.title = title;

  // Price — strip currency symbols, parse number
  const priceText = tryQuery([
    '[data-qa="pdp-price"]', 'span[class*="price"]',
    '[class*="product-price"]', '[class*="prc"]',
  ]);
  if (priceText) {
    const num = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) result.price = num;
  }

  // Description
  const desc = tryQuery([
    '[data-qa="pdp-description"]', 'div[class*="description"]',
    '[class*="product-description"]', '[itemprop="description"]',
  ]);
  if (desc) result.description = desc;

  // Seller store page — presence of a /shop/ or /store/ link
  const hasStore = !!(
    document.querySelector('a[href*="/shop/"]') ||
    document.querySelector('a[href*="/store/"]') ||
    document.querySelector('a[href*="/seller/"]')
  );
  result.sellerHasStorePage = hasStore;

  // Seller listing count — text near seller name matching "N products"
  const sellerSection = document.querySelector(
    '[class*="seller"], [data-qa*="seller"], [class*="shop-info"]'
  );
  let listingCount = 0;
  if (sellerSection) {
    const match = sellerSection.textContent?.match(/(\d[\d,]*)\s*(?:products?|listings?|items?)/i);
    if (match) listingCount = parseInt(match[1].replace(/,/g, ''), 10);
  }
  result.sellerListingCount = listingCount;

  // Seller review count
  const reviewCountText = tryQuery([
    '[data-qa="pdp-seller-review-count"]', '[class*="review-count"]',
    '[class*="ratings-count"]',
  ]);
  if (reviewCountText) {
    const num = parseInt(reviewCountText.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) result.sellerReviewCount = num;
  }

  // Images from gallery
  const imgEls = Array.from(document.querySelectorAll<HTMLImageElement>(
    'img[class*="gallery"], img[data-qa*="image"], [class*="thumbnail"] img, [class*="gallery"] img'
  ));
  const images = [...new Set(
    imgEls
      .map(el => el.src || el.getAttribute('data-src') || '')
      .filter(src => src.startsWith('http') && !src.includes('placeholder'))
  )].slice(0, 5);
  if (images.length > 0) result.images = images;

  // Reviews from DOM
  const reviewEls = Array.from(document.querySelectorAll(
    '[data-qa="review-item"], [class*="review-item"], [class*="review__item"]'
  ));
  if (reviewEls.length > 0) {
    const reviews = reviewEls.slice(0, 10).map(el => {
      const body = el.querySelector('[class*="review-body"], [class*="content"], p')
        ?.textContent?.trim() ?? '';
      const ratingEl = el.querySelector('[class*="star"], [class*="rating"]');
      const ratingText = ratingEl?.getAttribute('aria-label') ?? ratingEl?.textContent ?? '3';
      const rating = parseFloat(ratingText.replace(/[^0-9.]/g, '')) || 3;
      const dateEl = el.querySelector('[class*="date"], time');
      const postedAt = dateEl?.getAttribute('datetime') ?? dateEl?.textContent?.trim() ?? '';
      return { body, rating: Math.min(5, Math.max(1, rating)), postedAt };
    }).filter(r => r.body.length > 0);
    if (reviews.length > 0) result.reviews = reviews;
  }

  return result;
}

// ─── Screenshot capture ─────────────────────────────────────────────────────

export async function captureScreenshot(): Promise<string | null> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' });
    return response?.dataUrl ?? null;
  } catch {
    return null;
  }
}

// ─── Merge all three tiers ───────────────────────────────────────────────────

export async function extractAll(): Promise<AnalyzeRequest> {
  const jsonLd = extractFromJsonLd();
  const dom    = extractFromDom();
  const screenshot = await captureScreenshot();

  // JSON-LD wins over DOM for the same field
  const merged = { ...dom, ...jsonLd };

  // Append screenshot to images for vision model
  const images = merged.images ?? [];
  if (screenshot) images.push(screenshot);

  return {
    title:               merged.title               ?? '',
    price:               merged.price               ?? 0,
    categoryMedianPrice: 0,                              // unavailable on real pages
    description:         merged.description         ?? '',
    sellerAccountAgeDays: 0,                             // unavailable on real pages
    sellerRating:        merged.sellerRating         ?? null,
    sellerReviewCount:   merged.sellerReviewCount    ?? 0,
    sellerVerified:      merged.sellerVerified       ?? false,
    sellerHasStorePage:  merged.sellerHasStorePage   ?? true,
    sellerListingCount:  merged.sellerListingCount   ?? 0,
    images:              images.slice(0, 4),             // cap at 4 to stay under TPM
    reviews:             merged.reviews              ?? [],
  };
}
