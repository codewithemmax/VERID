import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { DEGRADED_RESPONSE } from '../../../shared/types';

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

router.post('/', (req: Request, res: Response) => {
  const parsed = AnalyzeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { code: 'INVALID_REQUEST', message: parsed.error.issues[0].message },
    });
    return;
  }

  // Stub — wired fully in Phase 3 (B3.1)
  res.json(DEGRADED_RESPONSE);
});

export default router;
