import { Router, Request, Response } from 'express';
import { requireValidPayload } from '../middleware/requireValidPayload';

const router = Router();

router.post('/', requireValidPayload, (_req: Request, res: Response) => {
  // Placeholder — wired fully in Phase 4
  res.json({ score: 0, confidence: 'low', explanation: 'Analysis not yet implemented.' });
});

export default router;
