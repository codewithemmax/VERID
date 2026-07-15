import { Request, Response, NextFunction } from 'express';

const REQUIRED_FIELDS = ['text', 'price', 'images', 'reviews'] as const;

export function requireValidPayload(req: Request, res: Response, next: NextFunction): void {
  const missing = REQUIRED_FIELDS.filter(f => req.body[f] === undefined || req.body[f] === null);
  if (missing.length > 0) {
    res.status(400).json({ error: 'Missing required fields', missing });
    return;
  }
  next();
}
