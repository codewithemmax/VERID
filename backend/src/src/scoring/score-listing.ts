import { SignalInput, Verdict, Signal } from '../../../shared/types';
import { WEIGHTS, THRESHOLDS, MULTIPLIERS } from './weights';

function reviewBurstFired(reviews: { postedAt: string }[]): boolean {
  if (reviews.length < 2) return false;
  const times = reviews.map(r => new Date(r.postedAt).getTime()).sort((a, b) => a - b);
  const windowMs = THRESHOLDS.review_burst_window_hours * 60 * 60 * 1000;
  for (let i = 0; i < times.length; i++) {
    const inWindow = times.filter(t => t >= times[i] && t <= times[i] + windowMs).length;
    if (inWindow / reviews.length > THRESHOLDS.review_burst_ratio) return true;
  }
  return false;
}

export function scoreListing(signals: SignalInput): Verdict {
  const fired: Signal[] = [];

  // Layer 1 — Account
  if (signals.sellerAccountAgeDays < THRESHOLDS.new_account_days) {
    fired.push({ label: `Seller account is ${signals.sellerAccountAgeDays} days old`, weight: WEIGHTS.new_account });
  }
  if (signals.sellerReviewCount === 0 && signals.sellerAccountAgeDays < THRESHOLDS.no_history_days) {
    fired.push({ label: 'Seller has no review history', weight: WEIGHTS.no_history });
  }

  const layer1Points = fired.reduce((s, f) => s + f.weight, 0);

  // Layer 2 — Listing
  const layer2Start = fired.length;
  if (signals.offplatform_contact) {
    fired.push({ label: 'Seller requests off-platform contact', weight: WEIGHTS.offplatform_contact });
  }
  if (signals.image_synthetic_probability > THRESHOLDS.image_synthetic_probability) {
    fired.push({ label: 'Product images appear to be stock or AI-generated', weight: WEIGHTS.image_synthetic });
  }
  const priceRatio = (signals.price - signals.categoryMedianPrice) / signals.categoryMedianPrice;
  if (priceRatio < THRESHOLDS.price_anomaly_ratio) {
    fired.push({ label: `Price is ${Math.round(Math.abs(priceRatio) * 100)}% below market rate`, weight: WEIGHTS.price_anomaly });
  }
  if (signals.urgency_score > THRESHOLDS.urgency_score) {
    fired.push({ label: 'Listing uses urgency language to pressure buyers', weight: WEIGHTS.urgency_language });
  }
  if (signals.description_specificity < THRESHOLDS.description_specificity) {
    fired.push({ label: 'Product description is vague and lacks detail', weight: WEIGHTS.vague_description });
  }
  const layer2Points = fired.slice(layer2Start).reduce((s, f) => s + f.weight, 0);

  // Layer 3 — Reviews
  const layer3Start = fired.length;
  if (signals.review_template_similarity > THRESHOLDS.review_template_similarity) {
    fired.push({ label: 'Reviews appear templated or copy-pasted', weight: WEIGHTS.review_templating });
  }
  if (signals.review_product_mismatch) {
    fired.push({ label: 'Reviews describe a different product', weight: WEIGHTS.review_mismatch });
  }
  if (reviewBurstFired(signals.reviews)) {
    fired.push({ label: 'Most reviews were posted within 48 hours', weight: WEIGHTS.review_burst });
  }
  const layer3Points = fired.slice(layer3Start).reduce((s, f) => s + f.weight, 0);

  // Compounding
  const layersFired = [layer1Points, layer2Points, layer3Points].filter(p => p > 0).length;
  const multiplier = layersFired === 3 ? MULTIPLIERS.three_layers
    : layersFired === 2 ? MULTIPLIERS.two_layers
    : MULTIPLIERS.one_layer;

  const rawSum = layer1Points + layer2Points + layer3Points;
  let score = Math.min(100, Math.round(rawSum * multiplier));

  // Confidence — count resolvable signals (all signals we have data for)
  const resolvable = 9; // all 9 signals are always evaluated from the input
  const confidence: Verdict['confidence'] = resolvable >= THRESHOLDS.confidence_high ? 'high'
    : resolvable >= THRESHOLDS.confidence_medium ? 'medium'
    : 'low';

  if (confidence === 'low') score = Math.min(score, THRESHOLDS.low_confidence_score_cap);

  const band: Verdict['band'] = score >= THRESHOLDS.band_block ? 'block'
    : score >= THRESHOLDS.band_caution ? 'caution'
    : 'clear';

  fired.sort((a, b) => b.weight - a.weight);

  return { score, band, confidence, explanation: '', signals: fired };
}
