import express from 'express';
import analyzeRouter from './routes/analyze';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/api/analyze', analyzeRouter);

app.listen(PORT, () => console.log(`Verid backend running on port ${PORT}`));

export default app;
