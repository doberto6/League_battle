import express from 'express';
import cors from 'cors';
import matchesRoutes from './routes/matches.js';
import spritesRoutes from './routes/sprites.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'hexclash-backend' });
});

app.use('/api/matches', matchesRoutes);
app.use('/api/sprites', spritesRoutes);

app.listen(port, () => {
  console.log(`Hexclash backend listening on port ${port}`);
});
