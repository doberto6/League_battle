import express from 'express';

const router = express.Router();

const matches = [];

router.get('/', (_req, res) => {
  res.json(matches.slice().reverse());
});

router.post('/', (req, res) => {
  const { player, opponent, result, turns } = req.body;

  if (!player || !opponent || !result || typeof turns !== 'number') {
    return res.status(400).json({ error: 'Invalid match payload' });
  }

  const record = {
    id: `match-${Date.now()}`,
    player,
    opponent,
    result,
    turns,
    playedAt: new Date().toISOString(),
  };

  matches.push(record);
  res.status(201).json(record);
});

router.delete('/', (_req, res) => {
  matches.length = 0;
  res.status(204).send();
});

export default router;
