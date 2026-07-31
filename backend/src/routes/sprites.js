import express from 'express';

const router = express.Router();

const sprites = {};

router.get('/', (_req, res) => {
  res.json(sprites);
});

router.put('/:championId', (req, res) => {
  const { championId } = req.params;
  const { dataUri } = req.body;

  if (!dataUri) {
    return res.status(400).json({ error: 'Missing dataUri' });
  }

  sprites[championId] = dataUri;
  res.json({ championId, dataUri });
});

router.delete('/:championId', (req, res) => {
  const { championId } = req.params;
  delete sprites[championId];
  res.status(204).send();
});

export default router;
