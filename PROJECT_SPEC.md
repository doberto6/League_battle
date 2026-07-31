# HexClash: Rift Tactics — Project Specification

A browser-based tactical battler that blends Pokémon-style turn-based battle UI with
League-of-Legends-inspired champions, classes, and abilities. This document is the
single source of truth for the project's architecture, conventions, and roadmap —
paste it into `.github/copilot-instructions.md` or keep it at the repo root so any
AI coding assistant (or new contributor) has full context.

## 1. Vision & constraints

- Turn-based, 1v1, Pokémon-battle-screen-style combat, but the "monsters" are original
  champions inspired by LoL archetypes (Fighter, Marksman, Mage, Assassin, Tank, Support).
- **IP safety is a hard constraint, not a nice-to-have:** no Riot Games splash art,
  sprites, or verbatim ability text ships in this app. Champions are represented by an
  original hex-portrait icon system (class icon + gradient), with an opt-in system for
  users to upload their own art per champion (already wired up for one champion using
  user-supplied pixel art). If this project is ever renamed/rebranded for public
  distribution, revisit champion names too.
- Full-stack: React frontend, Node/Express backend, Postgres for persistence, all
  containerized with Docker Compose for local dev, structured so it's easy to deploy later.
- Local-only for now. Hosting comes after the Docker split is solid (see Roadmap).

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast HMR, simple build, no framework lock-in |
| Styling | Plain CSS w/ custom properties (no Tailwind) | Full control over the Hextech visual identity |
| Icons | `lucide-react` | Lightweight, tree-shakeable |
| Backend | Node.js + Express | Small REST API, easy to reason about |
| Database | PostgreSQL 16 | Relational data (matches, sprites) fits fine, easy Docker image |
| Containerization | Docker + Docker Compose | One command to spin up db + api + web for any contributor |
| Dev tooling | `nodemon` (backend), Vite dev server (frontend) | Hot reload in containers via bind mounts |
| Later: hosting | Fly.io / Railway for API+DB, Vercel/Netlify or same host for frontend, or a single VPS behind Caddy | Deferred until local stack is solid |
| Later: motion/polish | Framer Motion or hand-rolled CSS keyframes | See §9 "making it feel real" |

## 3. Repository layout

```
hexclash/
├── docker-compose.yml
├── README.md
├── .gitignore
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                # tab nav + SpriteProvider
│       ├── index.css              # global theme (Hextech palette, hex-portrait, HUD, etc.)
│       ├── data/
│       │   ├── champions.js       # CHAMPIONS, CLASS_STYLE, TYPE_*, STATUS_* constants
│       │   └── customSprite.js    # any hard-coded base64 sprite(s)
│       ├── lib/
│       │   ├── battleEngine.js    # computeResult, chooseEnemyMove, freshBattler, hpColor
│       │   └── api.js             # fetch wrapper around the backend REST API
│       ├── context/
│       │   └── SpriteContext.jsx  # loads/saves custom champion sprites
│       └── components/
│           ├── HexPortrait.jsx
│           ├── StatBar.jsx
│           ├── RosterTab.jsx      # + ChampionModal, StatChip
│           ├── BattleTab.jsx      # + PickColumn
│           ├── BattleArena.jsx    # the actual battle loop UI
│           └── HistoryTab.jsx
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── db/
    │   └── init.sql               # schema, auto-run by the postgres image on first boot
    └── src/
        ├── index.js               # express app entry
        ├── db.js                  # pg Pool
        └── routes/
            ├── matches.js
            └── sprites.js
```

## 4. Data model (Postgres)

```sql
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  player_champion TEXT NOT NULL,
  opponent_champion TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('player', 'enemy')),
  turns INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sprites (
  champion_id TEXT PRIMARY KEY,
  data_uri TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 5. API contract

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/health` | — | liveness check |
| GET | `/api/matches` | — | returns match history, newest first |
| POST | `/api/matches` | `{ player, opponent, result, turns }` | `result` is `"player"` or `"enemy"` |
| DELETE | `/api/matches` | — | clears all history |
| GET | `/api/sprites` | — | returns `{ championId: dataUri }` map |
| PUT | `/api/sprites/:championId` | `{ dataUri }` | upsert a custom sprite (base64 data URI) |
| DELETE | `/api/sprites/:championId` | — | remove a custom sprite, falls back to icon/default |

## 6. Game design (already implemented in the prototype)

- **10 original champions** across the 6 classes above, each with 4 abilities (Q/W/E/R),
  mana costs, and a damage type: `physical | magic | true | heal | shield`.
- **Status effects:** `stun` (skip next action), `slow` (halved mana regen next turn),
  `root` (defender takes +15% damage on the next hit they take). Each ability that applies
  one has a hit chance.
- **Turn loop:** initiative by `speed` stat, strict alternation afterward, mana regenerates
  every turn, shields absorb damage before HP, crit chance ~12% for 1.5x damage.
- **UI:** champion-select screen → Pokémon-style two-corner HUD (HP/mana bars, status
  tags) → 4-button move grid → battle log → win/loss result panel.
- **Match history:** persisted, with win/loss/win-rate summary.
- **Sprites:** hex-shaped portraits default to a class icon + gradient; per-champion
  custom art can override this (currently backed by `window.storage` in the artifact
  prototype — this is exactly what routes #5 above replace).

## 7. Docker Compose architecture

Three services on one network: `frontend` (Vite dev server, port 5173) talks to
`backend` (Express API, port 4000) over REST, which talks to `db` (Postgres, port 5432)
over SQL. Both `frontend` and `backend` bind-mount their source directories so code
changes hot-reload without rebuilding the image; `db` uses a named volume so data
survives container restarts.

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: hexclash
      POSTGRES_PASSWORD: hexclash
      POSTGRES_DB: hexclash
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./backend/db/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hexclash"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://hexclash:hexclash@db:5432/hexclash
      PORT: 4000
      CORS_ORIGIN: http://localhost:5173
    ports: ["4000:4000"]
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://localhost:4000
    ports: ["5173:5173"]
    depends_on: [backend]
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  db-data:
```

## 8. Local dev workflow

1. `git init`, push to a remote, create a `develop` branch off `main`. Protect `main`
   (no direct pushes, PRs only, once you're past the very first commit).
2. Branch naming: `feature/<short-name>`, `fix/<short-name>`, `chore/<short-name>`,
   e.g. `feature/status-effects`, `fix/mana-regen-stale-closure`.
3. Commits: [Conventional Commits](https://www.conventionalcommits.org/) —
   `feat: add root status effect`, `fix: correct mana regen timing`, `docs: update spec`.
4. Day to day: `docker compose up --build` once, then just `docker compose up` — both
   app containers hot-reload on save. `docker compose logs -f backend` to tail logs.
5. DB access: `docker compose exec db psql -U hexclash` for ad-hoc queries.
6. Open a PR from `feature/*` into `develop`; squash-merge. Periodically merge
   `develop` → `main` and tag a release (`v0.1.0`, `v0.2.0`, ...).
7. Add a `.env.example` at the repo root once secrets/config diverge between
   local/staging/prod, and never commit the real `.env`.

## 9. Making it feel like a real game, not an AI demo

- Keep pushing the **specific** visual identity already in place (Hextech gold/navy/teal,
  hex-cut portraits and buttons, three-font type system: serif display / sans body / mono
  stats) rather than drifting toward generic gradient-card UI.
- **Juice:** damage number pop-ups, hit-stop (brief freeze-frame on crit), a proper
  screen-shake curve (already has a basic version — tune the easing), HP bar "ghost
  trail" that drains a beat behind the real value.
- **Audio:** menu blip, hit/crit/heal/shield SFX, a short victory/defeat stinger. Even
  simple self-recorded or CC0 sounds go a long way.
- **Texture:** subtle grain/vignette on panels instead of flat fills; avoid the
  "purple gradient + glassmorphism" AI-generic look.
- **Transitions:** in-universe loading/flavor text instead of a generic spinner.
- **Layout:** keep compositions a little asymmetric and considered rather than
  perfectly centered card grids.

## 10. Roadmap

- **Phase 0 — done:** single-file interactive prototype (React artifact) with the full
  battle loop, roster, match history, and a custom-sprite system.
- **Phase 1:** split into `frontend/` + `backend/`, stand up the REST API + Postgres,
  swap `window.storage` calls for `lib/api.js`.
- **Phase 2:** Dockerize both services + Postgres, `docker compose up` works end to end
  locally.
- **Phase 3:** visual/audio polish pass (§9).
- **Phase 4:** expand roster, add more custom sprites, sound design.
- **Phase 5 (optional):** accounts/auth, persistent per-user history, leaderboard.
- **Phase 6:** deploy — containers to Fly.io/Railway, or a VPS behind Caddy/nginx with
  TLS; frontend can stay containerized or move to a static host.

## 11. Feature backlog (unordered)

- More champions & abilities beyond the initial 10
- Additional status effects: silence, damage-over-time/burn, heal-block, decaying shields
- Best-of-3 matches, or a roguelike "Rift Run" ladder with rising difficulty
- 2v2 / 3v3 team battles
- Pre-battle loadout customization (items/runes)
- Class advantage matrix (Pokémon-type-chart style, e.g. Assassin > Mage, Tank > Assassin)
- Turn-by-turn replay viewer built from match history
- Global leaderboard (needs auth + backend ranking)
- Mobile-responsive layout / installable PWA
- Achievements
- Community sprite sharing (would need moderation — flag for later, not Phase 1-3)

## 12. IP guardrails (keep enforcing as the project grows)

- Never ship Riot Games' actual champion artwork, splash art, or verbatim ability/lore text.
- Sprites are either original icon art or sprites a user explicitly uploaded and has
  rights to use — never auto-sourced from the web.
- Champion names are used in a fan-inspired, non-commercial context. If this ever moves
  toward public hosting or monetization, revisit naming/branding to reduce trademark risk.
