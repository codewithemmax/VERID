import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import analyzeRouter from './routes/analyze';
import emailVerifyRouter from './routes/email-verify';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow the Next.js dev server and any deployed frontend origin
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',');
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

app.use(express.json());
app.use('/api/analyze', analyzeRouter);
app.use('/api/auth', emailVerifyRouter);

// Error middleware — must be last
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.message);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
});

app.listen(PORT, () => console.log(`Verid backend on :${PORT}`));

export default app;
