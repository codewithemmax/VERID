import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { DEGRADED_RESPONSE } from '../../../shared/types';
import { extractSignals } from '../ai/groq-client';
import { assembleSignals } from '../ai/assemble-signals';
import { scoreListing } from '../scoring/score-listing';
import { buildExplanation } from '../ai/build-explanation';
import { logVerdict } from '../db/log-verdict';

const ReviewSchema = z.object({
  body: z.string(),
  rating: z.number().min(1).max(5),
  postedAt: z.string(),
});

export const AnalyzeRequestSchema = z.object({
  title: z.string(),
  price: z.number().int(),
  categoryMedianPrice: z.number(),
  description: z.string(),
  sellerAccountAgeDays: z.number().int(),
  sellerRating: z.number().min(0).max(5).nullable(),
  sellerReviewCount: z.number().int(),
  sellerVerified: z.boolean(),
  images: z.array(z.string().url()),
  reviews: z.array(ReviewSchema),
});

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const parsed = AnalyzeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { code: 'INVALID_REQUEST', message: parsed.error.issues[0].message },
    });
    return;
  }

  const analyzeReq = parsed.data;

  try {
    const { signals: modelSignals } = await extractSignals(analyzeReq);
    const signalInput = assembleSignals(analyzeReq, modelSignals);
    const verdict = scoreListing(signalInput);
    verdict.explanation = buildExplanation(verdict.band, verdict.signals);

    logVerdict(verdict, signalInput); // fire-and-forget, never awaited

    res.json(verdict);
  } catch {
    // Should not reach here — extractSignals never throws — but belt-and-suspenders.
    res.json(DEGRADED_RESPONSE);
  }
});

export default router;
