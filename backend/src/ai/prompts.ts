import type { AnalyzeRequest } from '../../../shared/types';

export function buildAnalysisPrompt(req: AnalyzeRequest): string {
  const reviewBlock = req.reviews.length === 0
    ? 'No reviews.'
    : req.reviews
        .map((r, i) => `Review ${i + 1} (rating ${r.rating}/5, posted ${r.postedAt}):\n${r.body}`)
        .join('\n\n');

  return `You are a fraud-detection assistant analysing a marketplace listing. Return ONLY a JSON object — no prose, no markdown fences, no explanation outside the JSON.

LISTING
Title: ${req.title}
Price: ${req.price} NGN
Description: ${req.description}

REVIEWS
${reviewBlock}

Analyse the listing text, description, and any images provided. Return exactly this JSON shape with these exact key names:

{
  "urgency_score": <0.0–1.0 — how strongly the listing pressures the buyer to act immediately (e.g. "only 1 left", "pay now or lose it", countdown language). 0 = no urgency, 1 = extreme pressure>,
  "description_specificity": <0.0–1.0 — how specific and detailed the description is about the actual product (model numbers, dimensions, condition, genuine photos). 0 = completely vague/generic, 1 = highly specific>,
  "offplatform_contact": <true if the listing or description asks the buyer to contact the seller via WhatsApp, phone number, email, Telegram, or any phrase like "message me directly" / "contact me outside" / "DM me". false otherwise>,
  "image_synthetic_probability": <0.0–1.0 — probability that the product images are stock photos, AI-generated, or not genuine photos of the actual item being sold. Look for: generic studio backgrounds, watermarks, inconsistent lighting/shadows, unnaturally perfect appearance, images that look like they came from a manufacturer catalogue rather than the seller's own photos. 0 = clearly genuine seller photos, 1 = clearly stock/AI/stolen>,
  "review_template_similarity": <0.0–1.0 — how similar the reviews are to each other in sentence structure, phrasing, and cadence. 0 = reviews are varied and natural, 1 = reviews are nearly identical templates with minor word substitutions>,
  "review_product_mismatch": <true if the reviews describe a clearly different product than what is listed (e.g. listing is a phone but reviews mention shoes). false if reviews match the listing or there are no reviews>
}

Be precise. Do not round to 0 or 1 unless the evidence is unambiguous. A legitimate listing with a new seller should score low on urgency and high on specificity.`;
}
