import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export interface ExtractedSignals {
  urgency_score: number;
  bot_probability: number;
  image_risk: number;
}

export async function logRiskVerdict(score: number, signals: ExtractedSignals): Promise<void> {
  const { error } = await supabase.from('risk_verdicts').insert({
    score,
    urgency_score: signals.urgency_score,
    bot_probability: signals.bot_probability,
    image_risk: signals.image_risk,
    created_at: new Date().toISOString(),
  });
  if (error) console.error('[Supabase] Log failed:', error.message);
}
