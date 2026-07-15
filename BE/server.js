import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mentorRouter from './routes/mentor.js';

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/mentor', mentorRouter);

app.listen(PORT, () => {
  console.log(`BE listening on http://localhost:${PORT}`);
});
