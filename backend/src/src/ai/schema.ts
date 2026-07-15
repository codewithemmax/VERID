// Groq's JSON mode asks the model to emit valid JSON — it doesn't enforce a
// shape at the API level. This parse is the only thing standing between a
// malformed response and a crashed route.

import { z } from 'zod';

export const ModelSignalSchema = z.object({
  urgency_score: z.number().min(0).max(1),
  description_specificity: z.number().min(0).max(1),
  offplatform_contact: z.boolean(),
  image_synthetic_probability: z.number().min(0).max(1),
  review_template_similarity: z.number().min(0).max(1),
  review_product_mismatch: z.boolean(),
});

export type ModelSignals = z.infer<typeof ModelSignalSchema>;
