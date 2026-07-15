import express, { Request, Response, NextFunction } from 'express';
import analyzeRouter from './routes/analyze';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/api/analyze', analyzeRouter);

// Error middleware — must be last
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.message);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
});

app.listen(PORT, () => console.log(`Verid backend on :${PORT}`));

export default app;
