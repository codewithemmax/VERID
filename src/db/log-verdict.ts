import { createClient } from '@supabase/supabase-js';
import { Verdict, SignalInput } from '../../../shared/types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export function logVerdict(verdict: Verdict, rawSignals: SignalInput): void {
  supabase.from('risk_logs').insert({
    score: verdict.score,
    band: verdict.band,
    confidence: verdict.confidence,
    signals: verdict.signals,
    raw_signal_vector: {
      sellerAccountAgeDays: rawSignals.sellerAccountAgeDays,
      sellerReviewCount: rawSignals.sellerReviewCount,
      offplatform_contact: rawSignals.offplatform_contact,
      image_synthetic_probability: rawSignals.image_synthetic_probability,
      price: rawSignals.price,
      categoryMedianPrice: rawSignals.categoryMedianPrice,
      urgency_score: rawSignals.urgency_score,
      description_specificity: rawSignals.description_specificity,
      review_template_similarity: rawSignals.review_template_similarity,
      review_product_mismatch: rawSignals.review_product_mismatch,
    },
  }).then(({ error }) => {
    if (error) console.error('[db] log failed:', error.message);
  });
}
