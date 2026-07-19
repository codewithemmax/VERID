import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Verdict, SignalInput } from '../../../shared/types';

// Deferred — created on first log call so a missing key at module load
// doesn't crash the server. logVerdict is fire-and-forget; if the client
// can't be created it logs locally and returns silently.
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.warn('[db] SUPABASE_URL or SUPABASE_SERVICE_KEY not set — verdict logging disabled');
    return null;
  }
  _supabase = createClient(url, key);
  return _supabase;
}

export function logVerdict(verdict: Verdict, rawSignals: SignalInput): void {
  const supabase = getSupabase();
  if (!supabase) return;

  supabase.from('risk_logs').insert({
    score: verdict.score,
    band: verdict.band,
    confidence: verdict.confidence,
    signals: verdict.signals,
    raw_signal_vector: {
      sellerHasStorePage:          rawSignals.sellerHasStorePage,
      sellerListingCount:          rawSignals.sellerListingCount,
      sellerReviewCount:           rawSignals.sellerReviewCount,
      offplatform_contact:         rawSignals.offplatform_contact,
      image_synthetic_probability: rawSignals.image_synthetic_probability,
      urgency_score:               rawSignals.urgency_score,
      description_specificity:     rawSignals.description_specificity,
      review_template_similarity:  rawSignals.review_template_similarity,
      review_product_mismatch:     rawSignals.review_product_mismatch,
    },
  }).then(({ error }) => {
    if (error) console.error('[db] log failed:', error.message);
  });
}
