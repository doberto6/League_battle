CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  player_champion TEXT NOT NULL,
  opponent_champion TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('player', 'enemy')),
  turns INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sprites (
  champion_id TEXT PRIMARY KEY,
  data_uri TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
