import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sword, Shield, Wand2, Target, Zap, Heart, Trophy, History,
  Swords, ChevronRight, RotateCcw, Trash2, X, Loader2, Info
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* ------------------------------------------------------------------ */

const CLASS_STYLE = {
  Fighter:  { icon: Sword,  accent: "#E8703A", grad: ["#E8703A", "#8C3A1C"] },
  Marksman: { icon: Target, accent: "#3FB950", grad: ["#3FB950", "#1B5E28"] },
  Mage:     { icon: Wand2,  accent: "#6C8EF5", grad: ["#6C8EF5", "#2C3E9E"] },
  Assassin: { icon: Zap,    accent: "#C061E8", grad: ["#C061E8", "#5A2470"] },
  Tank:     { icon: Shield, accent: "#4FB8C8", grad: ["#4FB8C8", "#1B5E66"] },
  Support:  { icon: Heart,  accent: "#F0C36B", grad: ["#F0C36B", "#8C6A1C"] },
};

const TYPE_LABEL = { physical: "Physical", magic: "Magic", true: "True", heal: "Heal", shield: "Shield" };
const TYPE_COLOR = { physical: "#E8703A", magic: "#6C8EF5", true: "#F0E6D2", heal: "#3FB950", shield: "#4FB8C8" };

const STATUS_LABEL = { stun: "Stuns", slow: "Slows", root: "Roots" };
const STATUS_COLOR = { stun: "#F0C36B", slow: "#4FB8C8", root: "#C061E8" };
const STATUS_DESC = {
  stun: "target loses their next action",
  slow: "target's mana regen is halved next turn",
  root: "target takes bonus damage on their next hit taken",
};

const CHAMPIONS = [
  {
    id: "garen", name: "Garen", title: "The Might of Demacia", class: "Fighter",
    hp: 620, atk: 65, ap: 0, armor: 45, mr: 32, speed: 60,
    abilities: [
      { key: "Q", name: "Decisive Strike", type: "physical", cost: 0, power: 85, desc: "A precise strike empowered by resolve." },
      { key: "W", name: "Courage", type: "shield", cost: 25, power: 80, desc: "Braces for impact, raising a protective ward." },
      { key: "E", name: "Judgment", type: "physical", cost: 30, power: 100, desc: "Spins his blade through everything nearby." },
      { key: "R", name: "Demacian Justice", type: "true", cost: 100, power: 150, desc: "Channels overwhelming force into one blow." },
    ],
  },
  {
    id: "ashe", name: "Ashe", title: "The Frost Archer", class: "Marksman",
    hp: 480, atk: 70, ap: 0, armor: 28, mr: 26, speed: 68,
    abilities: [
      { key: "Q", name: "Focused Volley", type: "physical", cost: 20, power: 90, desc: "A charged shot fired with practiced precision." },
      { key: "W", name: "Frost Shot", type: "physical", cost: 0, power: 60, desc: "A quick arrow tipped with chilling frost.", effect: { type: "slow", chance: 0.85 } },
      { key: "E", name: "Volley", type: "physical", cost: 25, power: 75, desc: "A spread of arrows raining onto the target." },
      { key: "R", name: "Crystal Arrow", type: "physical", cost: 100, power: 160, desc: "One devastating shot fired from afar.", effect: { type: "stun", chance: 1 } },
    ],
  },
  {
    id: "lux", name: "Lux", title: "The Lady of Luminosity", class: "Mage",
    hp: 440, atk: 45, ap: 90, armor: 24, mr: 30, speed: 62,
    abilities: [
      { key: "Q", name: "Light Binding", type: "magic", cost: 20, power: 80, desc: "A beam of light that catches her foe.", effect: { type: "root", chance: 0.75 } },
      { key: "W", name: "Prismatic Barrier", type: "shield", cost: 25, power: 90, desc: "A shimmering barrier of pure light." },
      { key: "E", name: "Lucent Singularity", type: "magic", cost: 30, power: 85, desc: "A pulsing orb of concentrated light energy." },
      { key: "R", name: "Final Spark", type: "magic", cost: 100, power: 175, desc: "An enormous beam of radiant power." },
    ],
  },
  {
    id: "darius", name: "Darius", title: "The Hand of Noxus", class: "Fighter",
    hp: 580, atk: 75, ap: 0, armor: 40, mr: 28, speed: 58,
    abilities: [
      { key: "Q", name: "Decimate", type: "physical", cost: 20, power: 95, desc: "A wide, brutal swing of his axe." },
      { key: "W", name: "Crippling Strike", type: "physical", cost: 15, power: 70, desc: "A vicious blow meant to weaken." },
      { key: "E", name: "Apprehend", type: "physical", cost: 20, power: 65, desc: "Drags his foe in with the hook of his axe.", effect: { type: "root", chance: 0.7 } },
      { key: "R", name: "Noxian Guillotine", type: "true", cost: 100, power: 145, desc: "An executioner's strike, merciless and final." },
    ],
  },
  {
    id: "yasuo", name: "Yasuo", title: "The Unforgiven", class: "Assassin",
    hp: 490, atk: 68, ap: 0, armor: 30, mr: 28, speed: 72,
    abilities: [
      { key: "Q", name: "Steel Tempest", type: "physical", cost: 0, power: 80, desc: "A sweeping thrust of his blade." },
      { key: "W", name: "Wind Wall", type: "shield", cost: 30, power: 70, desc: "A wall of wind that turns aside danger." },
      { key: "E", name: "Sweeping Blade", type: "physical", cost: 20, power: 65, desc: "A swift dash-strike through his target." },
      { key: "R", name: "Last Breath", type: "physical", cost: 100, power: 165, desc: "A relentless flurry that leaves no opening." },
    ],
  },
  {
    id: "soraka", name: "Soraka", title: "The Starchild", class: "Support",
    hp: 460, atk: 40, ap: 75, armor: 22, mr: 30, speed: 60,
    abilities: [
      { key: "Q", name: "Starcall", type: "magic", cost: 20, power: 65, desc: "Calls down a fragment of a falling star." },
      { key: "W", name: "Astral Infusion", type: "heal", cost: 30, power: 100, desc: "Channels celestial energy into restoration." },
      { key: "E", name: "Equinox", type: "magic", cost: 25, power: 55, desc: "A field of starlight that suppresses her foe.", effect: { type: "stun", chance: 0.6 } },
      { key: "R", name: "Wish", type: "heal", cost: 100, power: 220, desc: "A powerful blessing that mends deep wounds." },
    ],
  },
  {
    id: "malphite", name: "Malphite", title: "Shard of the Monolith", class: "Tank",
    hp: 700, atk: 55, ap: 40, armor: 55, mr: 40, speed: 50,
    abilities: [
      { key: "Q", name: "Seismic Shard", type: "magic", cost: 20, power: 70, desc: "A shard of stone that saps the target's footing.", effect: { type: "slow", chance: 0.75 } },
      { key: "W", name: "Bulwark", type: "shield", cost: 25, power: 100, desc: "Hardens his rocky hide against incoming harm." },
      { key: "E", name: "Ground Slam", type: "physical", cost: 20, power: 60, desc: "A thunderous slam that shakes the earth." },
      { key: "R", name: "Unstoppable Force", type: "physical", cost: 100, power: 135, desc: "A relentless charge ending in cataclysm.", effect: { type: "stun", chance: 0.8 } },
    ],
  },
  {
    id: "katarina", name: "Katarina", title: "The Sinister Blade", class: "Assassin",
    hp: 470, atk: 65, ap: 55, armor: 26, mr: 26, speed: 74,
    abilities: [
      { key: "Q", name: "Bouncing Blade", type: "physical", cost: 15, power: 75, desc: "A dagger thrown with lethal precision." },
      { key: "W", name: "Sinister Steel", type: "physical", cost: 20, power: 65, desc: "Twin blades cast in a deadly line." },
      { key: "E", name: "Shunpo", type: "shield", cost: 15, power: 60, desc: "A blink strike that repositions in an instant." },
      { key: "R", name: "Death Lotus", type: "true", cost: 100, power: 155, desc: "A whirlwind of blades, relentless and fast." },
    ],
  },
  {
    id: "jinx", name: "Jinx", title: "The Loose Cannon", class: "Marksman",
    hp: 460, atk: 72, ap: 0, armor: 24, mr: 24, speed: 66,
    abilities: [
      { key: "Q", name: "Switcheroo", type: "shield", cost: 0, power: 50, desc: "Swaps weapons, readying a different approach." },
      { key: "W", name: "Zap!", type: "physical", cost: 20, power: 90, desc: "A long-range shock blast that rarely misses." },
      { key: "E", name: "Flame Chompers", type: "physical", cost: 25, power: 60, desc: "Explosive charges tossed at her foe's feet.", effect: { type: "root", chance: 0.7 } },
      { key: "R", name: "Death Rocket", type: "physical", cost: 100, power: 170, desc: "A rocket that hits harder the weaker the target." },
    ],
  },
  {
    id: "thresh", name: "Thresh", title: "The Chain Warden", class: "Support",
    hp: 540, atk: 50, ap: 50, armor: 38, mr: 34, speed: 56,
    abilities: [
      { key: "Q", name: "Death Sentence", type: "magic", cost: 25, power: 80, desc: "A hooked chain that drags his foe close.", effect: { type: "root", chance: 0.75 } },
      { key: "W", name: "Dark Passage", type: "shield", cost: 20, power: 85, desc: "A lantern's light offers brief protection." },
      { key: "E", name: "Flay", type: "physical", cost: 15, power: 55, desc: "A sweeping strike with his heavy chain." },
      { key: "R", name: "The Box", type: "magic", cost: 100, power: 150, desc: "Walls of spectral energy close in around his foe.", effect: { type: "slow", chance: 0.85 } },
    ],
  },
];

const MAX_MANA = 100;
const MANA_REGEN = 22;

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function computeResult(attacker, defender, ability) {
  if (ability.type === "heal") {
    return { heal: Math.round(ability.power * (0.6 + attacker.ap / 220)) };
  }
  if (ability.type === "shield") {
    return { shield: Math.round(ability.power * (0.6 + (attacker.ap + attacker.atk) / 260)) };
  }
  let raw;
  if (ability.type === "physical") raw = ability.power * (0.55 + attacker.atk / 110);
  else if (ability.type === "magic") raw = ability.power * (0.55 + attacker.ap / 110);
  else raw = ability.power * 0.85; // true damage, flat-ish

  let mitigation = 1;
  if (ability.type === "physical") mitigation = 100 / (100 + defender.armor);
  if (ability.type === "magic") mitigation = 100 / (100 + defender.mr);

  let dmg = raw * mitigation * (0.9 + Math.random() * 0.2);
  const crit = ability.type !== "true" && Math.random() < 0.12;
  if (crit) dmg *= 1.5;

  let statusApplied = null;
  if (ability.effect && Math.random() < ability.effect.chance) {
    statusApplied = ability.effect.type;
  }

  return { damage: Math.max(1, Math.round(dmg)), crit, statusApplied };
}

function chooseEnemyMove(champion, mana, hp, maxHp) {
  const affordable = champion.abilities.filter((a) => a.cost <= mana);
  if (affordable.length === 0) {
    return champion.abilities.reduce((a, b) => (a.cost < b.cost ? a : b));
  }
  const support = affordable.find((a) => a.type === "heal" || a.type === "shield");
  if (hp / maxHp < 0.35 && support && Math.random() < 0.7) return support;
  const damaging = affordable.filter((a) => ["physical", "magic", "true"].includes(a.type));
  if (damaging.length) {
    damaging.sort((a, b) => b.power - a.power);
    return Math.random() < 0.55 ? damaging[0] : damaging[Math.floor(Math.random() * damaging.length)];
  }
  return affordable[Math.floor(Math.random() * affordable.length)];
}

function freshBattler(champ) {
  return { hp: champ.hp, maxHp: champ.hp, mana: MAX_MANA, shield: 0, stunned: false, slowed: false, vulnerable: false };
}

/* ------------------------------------------------------------------ */
/* SMALL UI PIECES                                                     */
/* ------------------------------------------------------------------ */

function HexPortrait({ champion, size = 76, dimmed = false, selected = false }) {
  const style = CLASS_STYLE[champion.class];
  const Icon = style.icon;
  return (
    <div
      className="hex-portrait"
      style={{
        width: size,
        height: size * 1.06,
        background: `linear-gradient(155deg, ${style.grad[0]}, ${style.grad[1]})`,
        opacity: dimmed ? 0.35 : 1,
        boxShadow: selected ? `0 0 0 3px #F0E6D2, 0 0 18px ${style.accent}` : "0 0 0 2px rgba(240,230,210,0.25)",
      }}
    >
      <Icon size={size * 0.42} color="#0A0E14" strokeWidth={2.25} />
    </div>
  );
}

function StatBar({ value, max, color, label, sub }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="statbar-wrap">
      {label && <div className="statbar-label">{label}</div>}
      <div className="statbar-track">
        <div className="statbar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {sub && <div className="statbar-sub">{sub}</div>}
    </div>
  );
}

function hpColor(pct) {
  if (pct > 0.5) return "#3FB950";
  if (pct > 0.2) return "#E3B341";
  return "#F85149";
}

/* ------------------------------------------------------------------ */
/* MAIN APP                                                            */
/* ------------------------------------------------------------------ */

export default function HexClash() {
  const [tab, setTab] = useState("battle");

  return (
    <div className="app">
      <style>{CSS}</style>

      <header className="topbar">
        <div className="brand">
          <div className="brand-hex">
            <Swords size={18} color="#0A0E14" strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <span className="brand-title">HEXCLASH</span>
            <span className="brand-sub">Rift Tactics</span>
          </div>
        </div>
        <nav className="tabs">
          <TabButton active={tab === "battle"} onClick={() => setTab("battle")} icon={Swords} label="Battle" />
          <TabButton active={tab === "roster"} onClick={() => setTab("roster")} icon={Shield} label="Champions" />
          <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={History} label="Match History" />
        </nav>
      </header>

      <main className="main">
        {tab === "battle" && <BattleTab />}
        {tab === "roster" && <RosterTab />}
        {tab === "history" && <HistoryTab />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button className={`tab-btn ${active ? "tab-btn-active" : ""}`} onClick={onClick}>
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* ROSTER TAB                                                          */
/* ------------------------------------------------------------------ */

function RosterTab() {
  const [detail, setDetail] = useState(null);
  return (
    <div className="roster-tab">
      <div className="section-heading">
        <h2>Champion Roster</h2>
        <p>Ten champions, six classes. Tap a portrait for full stats and abilities.</p>
      </div>
      <div className="roster-grid">
        {CHAMPIONS.map((c) => (
          <button key={c.id} className="roster-card" onClick={() => setDetail(c)}>
            <HexPortrait champion={c} size={64} />
            <div className="roster-card-name">{c.name}</div>
            <div className="roster-card-class" style={{ color: CLASS_STYLE[c.class].accent }}>{c.class}</div>
          </button>
        ))}
      </div>
      {detail && <ChampionModal champion={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function ChampionModal({ champion, onClose }) {
  const style = CLASS_STYLE[champion.class];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="modal-head">
          <HexPortrait champion={champion} size={88} />
          <div>
            <div className="modal-name">{champion.name}</div>
            <div className="modal-title">{champion.title}</div>
            <div className="modal-class" style={{ color: style.accent }}>{champion.class}</div>
          </div>
        </div>
        <div className="modal-stats">
          <StatChip label="Health" value={champion.hp} color="#3FB950" />
          <StatChip label="Attack" value={champion.atk} color="#E8703A" />
          <StatChip label="Power" value={champion.ap} color="#6C8EF5" />
          <StatChip label="Armor" value={champion.armor} color="#C8AA6E" />
          <StatChip label="Resist" value={champion.mr} color="#4FB8C8" />
          <StatChip label="Speed" value={champion.speed} color="#F0C36B" />
        </div>
        <div className="modal-abilities">
          {champion.abilities.map((a) => (
            <div className="ability-row" key={a.key}>
              <div className="ability-key">{a.key}</div>
              <div className="ability-info">
                <div className="ability-name-row">
                  <span className="ability-name">{a.name}</span>
                  <span className="ability-type" style={{ color: TYPE_COLOR[a.type] }}>{TYPE_LABEL[a.type]}</span>
                </div>
                <div className="ability-desc">{a.desc}</div>
                {a.effect && (
                  <div className="ability-status" style={{ color: STATUS_COLOR[a.effect.type] }}>
                    {STATUS_LABEL[a.effect.type]} ({Math.round(a.effect.chance * 100)}% chance) — {STATUS_DESC[a.effect.type]}
                  </div>
                )}
              </div>
              <div className="ability-cost">{a.cost} mana</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div className="stat-chip">
      <div className="stat-chip-value" style={{ color }}>{value}</div>
      <div className="stat-chip-label">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BATTLE TAB                                                          */
/* ------------------------------------------------------------------ */

function BattleTab() {
  const [phase, setPhase] = useState("select"); // select | battle
  const [playerChamp, setPlayerChamp] = useState(null);
  const [enemyChamp, setEnemyChamp] = useState(null);

  function randomizeEnemy() {
    const pool = CHAMPIONS.filter((c) => c.id !== playerChamp?.id);
    setEnemyChamp(pool[Math.floor(Math.random() * pool.length)]);
  }

  if (phase === "battle" && playerChamp && enemyChamp) {
    return (
      <BattleArena
        playerChamp={playerChamp}
        enemyChamp={enemyChamp}
        onExit={() => setPhase("select")}
        onRematch={(newEnemy) => {
          if (newEnemy) setEnemyChamp(newEnemy);
        }}
      />
    );
  }

  return (
    <div className="select-tab">
      <div className="section-heading">
        <h2>Choose Your Champion</h2>
        <p>Pick a fighter for each side, then step into the arena.</p>
      </div>

      <div className="select-columns">
        <PickColumn
          title="Your Champion"
          picked={playerChamp}
          onPick={setPlayerChamp}
          exclude={enemyChamp?.id}
        />
        <div className="vs-mark">VS</div>
        <PickColumn
          title="Opponent"
          picked={enemyChamp}
          onPick={setEnemyChamp}
          exclude={playerChamp?.id}
          onRandom={playerChamp ? randomizeEnemy : null}
        />
      </div>

      <button
        className="start-btn"
        disabled={!playerChamp || !enemyChamp}
        onClick={() => setPhase("battle")}
      >
        Enter the Rift <ChevronRight size={18} />
      </button>
    </div>
  );
}

function PickColumn({ title, picked, onPick, exclude, onRandom }) {
  return (
    <div className="pick-col">
      <div className="pick-col-title">{title}</div>
      {picked ? (
        <div className="pick-preview">
          <HexPortrait champion={picked} size={72} selected />
          <div className="pick-preview-name">{picked.name}</div>
          <button className="pick-change" onClick={() => onPick(null)}>Change</button>
        </div>
      ) : (
        <>
          <div className="pick-grid">
            {CHAMPIONS.filter((c) => c.id !== exclude).map((c) => (
              <button key={c.id} className="pick-item" onClick={() => onPick(c)} title={c.name}>
                <HexPortrait champion={c} size={48} />
              </button>
            ))}
          </div>
          {onRandom && (
            <button className="pick-random" onClick={onRandom}>
              <RotateCcw size={13} /> Randomize
            </button>
          )}
        </>
      )}
    </div>
  );
}

function BattleArena({ playerChamp, enemyChamp, onExit }) {
  const [player, setPlayer] = useState(() => freshBattler(playerChamp));
  const [enemy, setEnemy] = useState(() => freshBattler(enemyChamp));
  const [turn, setTurn] = useState(playerChamp.speed >= enemyChamp.speed ? "player" : "enemy");
  const [log, setLog] = useState([`A wild battle begins! ${playerChamp.name} vs ${enemyChamp.name}.`]);
  const [over, setOver] = useState(null); // null | 'player' | 'enemy'
  const [flash, setFlash] = useState(null); // 'player' | 'enemy' for hit shake
  const savedRef = useRef(false);
  const logEndRef = useRef(null);
  const turnCountRef = useRef(0);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  function pushLog(msg) {
    setLog((l) => [...l, msg]);
  }

  const saveMatch = useCallback(async (result) => {
    if (savedRef.current) return;
    savedRef.current = true;
    try {
      const id = `match:${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await window.storage.set(id, JSON.stringify({
        date: new Date().toISOString(),
        player: playerChamp.name,
        opponent: enemyChamp.name,
        result,
        turns: turnCountRef.current,
      }), false);
    } catch (e) {
      console.error("Failed to save match", e);
    }
  }, [playerChamp, enemyChamp]);

  useEffect(() => {
    if (over) saveMatch(over);
  }, [over, saveMatch]);

  // Turn-start handling: mana regen, stun skip, and (on enemy's turn) the AI's move
  useEffect(() => {
    if (over) return;
    const isPlayerTurn = turn === "player";
    const state = isPlayerTurn ? player : enemy;
    const champ = isPlayerTurn ? playerChamp : enemyChamp;
    const setState = isPlayerTurn ? setPlayer : setEnemy;
    const regenAmount = state.slowed ? Math.round(MANA_REGEN / 2) : MANA_REGEN;
    const regenedMana = Math.min(MAX_MANA, state.mana + regenAmount);

    if (state.stunned) {
      const t = setTimeout(() => {
        pushLog(`${champ.name} is stunned and can't act!`);
        setState((s) => ({ ...s, stunned: false, slowed: false, mana: regenedMana }));
        setTurn(isPlayerTurn ? "enemy" : "player");
      }, 750);
      return () => clearTimeout(t);
    }

    setState((s) => ({ ...s, mana: regenedMana, slowed: false }));

    if (!isPlayerTurn) {
      const t = setTimeout(() => {
        const ability = chooseEnemyMove(enemyChamp, regenedMana, enemy.hp, enemy.maxHp);
        resolveTurn("enemy", ability, regenedMana);
      }, 850);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, over]);

  function resolveTurn(who, ability, currentManaOverride) {
    const attackerChamp = who === "player" ? playerChamp : enemyChamp;
    const defenderChamp = who === "player" ? enemyChamp : playerChamp;
    const attackerState = who === "player" ? player : enemy;
    const defenderState = who === "player" ? enemy : player;
    const setAttacker = who === "player" ? setPlayer : setEnemy;
    const setDefender = who === "player" ? setEnemy : setPlayer;
    const currentMana = currentManaOverride !== undefined ? currentManaOverride : attackerState.mana;

    turnCountRef.current += 1;

    const result = computeResult(attackerChamp, defenderChamp, ability);
    const newMana = Math.max(0, currentMana - ability.cost);

    if (result.heal !== undefined) {
      setAttacker((s) => ({ ...s, mana: newMana, hp: Math.min(s.maxHp, s.hp + result.heal) }));
      pushLog(`${attackerChamp.name} used ${ability.name}! Restored ${result.heal} HP.`);
    } else if (result.shield !== undefined) {
      setAttacker((s) => ({ ...s, mana: newMana, shield: s.shield + result.shield }));
      pushLog(`${attackerChamp.name} used ${ability.name}! Gained a ${result.shield}-point shield.`);
    } else {
      setAttacker((s) => ({ ...s, mana: newMana }));
      setFlash(who === "player" ? "enemy" : "player");
      setTimeout(() => setFlash(null), 350);

      const wasVulnerable = defenderState.vulnerable;
      let finalDamage = result.damage;
      if (wasVulnerable) finalDamage = Math.round(finalDamage * 1.15);

      setDefender((s) => {
        let dmg = finalDamage;
        let shieldLeft = s.shield;
        if (shieldLeft > 0) {
          const absorbed = Math.min(shieldLeft, dmg);
          shieldLeft -= absorbed;
          dmg -= absorbed;
        }
        const newHp = Math.max(0, s.hp - dmg);
        const next = { ...s, shield: shieldLeft, hp: newHp, vulnerable: false };
        if (result.statusApplied === "stun") next.stunned = true;
        if (result.statusApplied === "slow") next.slowed = true;
        if (result.statusApplied === "root") next.vulnerable = true;
        return next;
      });

      let msg = `${attackerChamp.name} used ${ability.name}!` +
        (result.crit ? ` Critical hit!` : ``) +
        (wasVulnerable ? ` (rooted, +dmg)` : ``) +
        ` ${finalDamage} damage.`;
      if (result.statusApplied === "stun") msg += ` ${defenderChamp.name} is stunned!`;
      if (result.statusApplied === "slow") msg += ` ${defenderChamp.name} is slowed!`;
      if (result.statusApplied === "root") msg += ` ${defenderChamp.name} is rooted!`;
      pushLog(msg);
    }

    setTurn(who === "player" ? "enemy" : "player");
  }

  // Check for faint after HP updates
  useEffect(() => {
    if (over) return;
    if (enemy.hp <= 0) {
      setOver("player");
      pushLog(`${enemyChamp.name} has been defeated. Victory!`);
    } else if (player.hp <= 0) {
      setOver("enemy");
      pushLog(`${playerChamp.name} has been defeated. Defeat.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.hp, enemy.hp]);

  function handlePlayerAbility(ability) {
    if (turn !== "player" || over || player.stunned || ability.cost > player.mana) return;
    resolveTurn("player", ability);
  }

  return (
    <div className="arena">
      <div className="arena-field">
        <div className={`combatant enemy-combatant ${flash === "enemy" ? "hit-shake" : ""}`}>
          <HexPortrait champion={enemyChamp} size={92} />
        </div>
        <div className={`combatant player-combatant ${flash === "player" ? "hit-shake" : ""}`}>
          <HexPortrait champion={playerChamp} size={104} />
        </div>
        <div className="hex-bg" />
      </div>

      <div className="hud hud-enemy">
        <div className="hud-name-row">
          <span className="hud-name">{enemyChamp.name}</span>
          <span className="hud-class" style={{ color: CLASS_STYLE[enemyChamp.class].accent }}>{enemyChamp.class}</span>
        </div>
        <StatBar value={enemy.hp} max={enemy.maxHp} color={hpColor(enemy.hp / enemy.maxHp)} />
        <div className="hud-sub-row">
          <span>HP {enemy.hp}/{enemy.maxHp}</span>
          <span className="status-tags">
            {enemy.shield > 0 && <span className="shield-tag">🛡 {enemy.shield}</span>}
            {enemy.stunned && <span className="cond-tag cond-stun">STUN</span>}
            {enemy.slowed && <span className="cond-tag cond-slow">SLOW</span>}
            {enemy.vulnerable && <span className="cond-tag cond-root">ROOT</span>}
          </span>
        </div>
        <StatBar value={enemy.mana} max={MAX_MANA} color="#4FB8C8" />
      </div>

      <div className="hud hud-player">
        <div className="hud-name-row">
          <span className="hud-name">{playerChamp.name}</span>
          <span className="hud-class" style={{ color: CLASS_STYLE[playerChamp.class].accent }}>{playerChamp.class}</span>
        </div>
        <StatBar value={player.hp} max={player.maxHp} color={hpColor(player.hp / player.maxHp)} />
        <div className="hud-sub-row">
          <span>HP {player.hp}/{player.maxHp}</span>
          <span className="status-tags">
            {player.shield > 0 && <span className="shield-tag">🛡 {player.shield}</span>}
            {player.stunned && <span className="cond-tag cond-stun">STUN</span>}
            {player.slowed && <span className="cond-tag cond-slow">SLOW</span>}
            {player.vulnerable && <span className="cond-tag cond-root">ROOT</span>}
          </span>
        </div>
        <StatBar value={player.mana} max={MAX_MANA} color="#4FB8C8" />
      </div>

      <div className="battle-panel">
        <div className="log-box">
          {log.slice(-4).map((l, i) => (
            <div key={i} className="log-line">{l}</div>
          ))}
          <div ref={logEndRef} />
        </div>

        {!over ? (
          <div className="move-grid">
            {playerChamp.abilities.map((a) => {
              const disabled = turn !== "player" || player.stunned || a.cost > player.mana;
              return (
                <button
                  key={a.key}
                  className="move-btn"
                  disabled={disabled}
                  onClick={() => handlePlayerAbility(a)}
                  style={{ borderColor: disabled ? "rgba(240,230,210,0.15)" : TYPE_COLOR[a.type] }}
                >
                  <div className="move-btn-top">
                    <span className="move-key">{a.key}</span>
                    <span className="move-name">{a.name}</span>
                  </div>
                  <div className="move-btn-bottom">
                    <span style={{ color: TYPE_COLOR[a.type] }}>{TYPE_LABEL[a.type]}</span>
                    {a.effect && (
                      <span style={{ color: STATUS_COLOR[a.effect.type] }}>
                        {STATUS_LABEL[a.effect.type]} {Math.round(a.effect.chance * 100)}%
                      </span>
                    )}
                    <span>{a.cost} mana</span>
                  </div>
                </button>
              );
            })}
            <div className="turn-indicator">
              {player.stunned ? "You are stunned!" : turn === "player" ? "Your move" : "Opponent is acting…"}
            </div>
          </div>
        ) : (
          <div className="result-panel">
            <Trophy size={28} color={over === "player" ? "#F0C36B" : "#6b6357"} />
            <div className="result-title">{over === "player" ? "Victory!" : "Defeat"}</div>
            <div className="result-actions">
              <button className="result-btn" onClick={onExit}>Back to Select</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HISTORY TAB                                                         */
/* ------------------------------------------------------------------ */

function HistoryTab() {
  const [matches, setMatches] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const listing = await window.storage.list("match:", false);
      const keys = listing?.keys || [];
      const items = [];
      for (const k of keys) {
        try {
          const r = await window.storage.get(k, false);
          if (r?.value) items.push(JSON.parse(r.value));
        } catch (e) { /* skip unreadable */ }
      }
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
      setMatches(items);
    } catch (e) {
      setMatches([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function clearAll() {
    setBusy(true);
    try {
      const listing = await window.storage.list("match:", false);
      const keys = listing?.keys || [];
      for (const k of keys) {
        await window.storage.delete(k, false);
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (matches === null) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={22} />
        <span>Loading match history…</span>
      </div>
    );
  }

  const wins = matches.filter((m) => m.result === "player").length;
  const losses = matches.filter((m) => m.result === "enemy").length;

  return (
    <div className="history-tab">
      <div className="section-heading">
        <h2>Match History</h2>
        <p>Your battle record, stored locally to this browser.</p>
      </div>

      <div className="record-row">
        <div className="record-chip">
          <div className="record-value" style={{ color: "#3FB950" }}>{wins}</div>
          <div className="record-label">Wins</div>
        </div>
        <div className="record-chip">
          <div className="record-value" style={{ color: "#F85149" }}>{losses}</div>
          <div className="record-label">Losses</div>
        </div>
        <div className="record-chip">
          <div className="record-value" style={{ color: "#F0C36B" }}>
            {matches.length ? Math.round((wins / matches.length) * 100) : 0}%
          </div>
          <div className="record-label">Win Rate</div>
        </div>
        {matches.length > 0 && (
          <button className="clear-btn" onClick={clearAll} disabled={busy}>
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <Info size={20} />
          <p>No battles recorded yet. Fight in the Battle tab to build your record.</p>
        </div>
      ) : (
        <div className="match-list">
          {matches.map((m, i) => (
            <div key={i} className={`match-row ${m.result === "player" ? "match-win" : "match-loss"}`}>
              <div className="match-result-tag">{m.result === "player" ? "WIN" : "LOSS"}</div>
              <div className="match-info">
                <span className="match-vs">{m.player} <span className="vs-small">vs</span> {m.opponent}</span>
                <span className="match-meta">{m.turns} turns · {new Date(m.date).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* STYLES                                                               */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

* { box-sizing: border-box; }

.app {
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(76,131,140,0.15), transparent 60%),
    #090D14;
  color: #F0E6D2;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px;
  border-bottom: 1px solid rgba(200,170,110,0.25);
  background: linear-gradient(180deg, #0C121C, #090D14);
  flex-wrap: wrap;
  gap: 12px;
}

.brand { display: flex; align-items: center; gap: 10px; }
.brand-hex {
  width: 34px; height: 36px;
  background: linear-gradient(155deg, #F0C36B, #C8AA6E);
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  display: flex; align-items: center; justify-content: center;
}
.brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.brand-title { font-family: 'Cinzel', serif; font-weight: 700; font-size: 17px; letter-spacing: 2px; color: #F0E6D2; }
.brand-sub { font-size: 10px; letter-spacing: 2px; color: #8C8474; text-transform: uppercase; }

.tabs { display: flex; gap: 6px; }
.tab-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 3px;
  color: #A09B8C;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.tab-btn:hover { color: #F0E6D2; background: rgba(200,170,110,0.08); }
.tab-btn-active { color: #F0C36B; border-color: rgba(240,195,107,0.4); background: rgba(240,195,107,0.08); }

.main { flex: 1; padding: 26px 22px 40px; max-width: 980px; width: 100%; margin: 0 auto; }

.section-heading { margin-bottom: 22px; }
.section-heading h2 { font-family: 'Cinzel', serif; font-size: 21px; margin: 0 0 4px; color: #F0E6D2; letter-spacing: 0.5px; }
.section-heading p { margin: 0; color: #8C8474; font-size: 13px; }

/* Hex portrait */
.hex-portrait {
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* Roster */
.roster-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 14px; }
.roster-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(200,170,110,0.18);
  border-radius: 6px;
  padding: 16px 8px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.roster-card:hover { background: rgba(240,195,107,0.06); border-color: rgba(240,195,107,0.4); transform: translateY(-2px); }
.roster-card-name { font-weight: 600; font-size: 13px; }
.roster-card-class { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1px; }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(4,6,10,0.75);
  display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px;
}
.modal {
  background: #0F1620; border: 1px solid rgba(200,170,110,0.3);
  border-radius: 8px; padding: 26px; max-width: 460px; width: 100%;
  position: relative; max-height: 88vh; overflow-y: auto;
}
.modal-close {
  position: absolute; top: 14px; right: 14px; background: rgba(255,255,255,0.06);
  border: none; color: #A09B8C; width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.modal-head { display: flex; gap: 16px; align-items: center; margin-bottom: 18px; }
.modal-name { font-family: 'Cinzel', serif; font-size: 19px; font-weight: 700; }
.modal-title { font-size: 12px; color: #8C8474; margin: 2px 0 4px; }
.modal-class { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
.modal-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px; }
.stat-chip { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; padding: 8px; text-align: center; }
.stat-chip-value { font-family: 'Space Mono', monospace; font-size: 17px; font-weight: 700; }
.stat-chip-label { font-size: 9.5px; color: #8C8474; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
.modal-abilities { display: flex; flex-direction: column; gap: 8px; }
.ability-row { display: flex; gap: 10px; align-items: flex-start; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; padding: 9px 10px; }
.ability-key {
  width: 24px; height: 24px; flex-shrink: 0; border-radius: 4px; background: rgba(200,170,110,0.15);
  border: 1px solid rgba(200,170,110,0.4); display: flex; align-items: center; justify-content: center;
  font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: #F0C36B;
}
.ability-info { flex: 1; }
.ability-name-row { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
.ability-name { font-weight: 600; font-size: 13px; }
.ability-type { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
.ability-desc { font-size: 12px; color: #8C8474; margin-top: 2px; line-height: 1.4; }
.ability-status { font-size: 10.5px; margin-top: 4px; line-height: 1.4; font-weight: 600; }
.ability-cost { font-family: 'Space Mono', monospace; font-size: 10.5px; color: #4FB8C8; white-space: nowrap; align-self: center; }

/* Select tab */
.select-columns { display: flex; align-items: flex-start; justify-content: center; gap: 20px; margin-bottom: 26px; flex-wrap: wrap; }
.pick-col { background: rgba(255,255,255,0.02); border: 1px solid rgba(200,170,110,0.18); border-radius: 8px; padding: 18px; min-width: 260px; flex: 1; max-width: 340px; }
.pick-col-title { font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: #C8AA6E; margin-bottom: 12px; text-align: center; }
.pick-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.pick-item { background: transparent; border: none; padding: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
.pick-item:hover { background: rgba(240,195,107,0.1); }
.pick-random { margin-top: 12px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(79,184,200,0.1); border: 1px solid rgba(79,184,200,0.35); color: #4FB8C8; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: 600; }
.pick-preview { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 6px 0; }
.pick-preview-name { font-weight: 700; font-size: 15px; }
.pick-change { background: none; border: 1px solid rgba(240,230,210,0.25); color: #A09B8C; font-size: 11px; padding: 5px 12px; border-radius: 4px; cursor: pointer; }
.vs-mark { font-family: 'Cinzel', serif; font-size: 20px; color: #4a4438; align-self: center; padding-top: 40px; }

.start-btn {
  display: flex; align-items: center; gap: 8px; margin: 0 auto;
  background: linear-gradient(135deg, #F0C36B, #C8AA6E); color: #0A0E14;
  border: none; padding: 13px 28px; border-radius: 5px; font-weight: 700; font-size: 14px;
  cursor: pointer; letter-spacing: 0.5px;
}
.start-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* Arena */
.arena { display: flex; flex-direction: column; gap: 0; }
.arena-field {
  position: relative; height: 220px; border-radius: 8px 8px 0 0; overflow: hidden;
  background: linear-gradient(180deg, #101a26, #0a1119);
  border: 1px solid rgba(200,170,110,0.2); border-bottom: none;
  display: flex; align-items: flex-end;
}
.hex-bg {
  position: absolute; inset: 0; opacity: 0.07; pointer-events: none;
  background-image: repeating-linear-gradient(60deg, transparent 0 18px, #C8AA6E 18px 19px), repeating-linear-gradient(-60deg, transparent 0 18px, #C8AA6E 18px 19px);
}
.combatant { position: absolute; }
.enemy-combatant { top: 18px; right: 14%; }
.player-combatant { bottom: 18px; left: 14%; }
.hit-shake { animation: shake 0.35s ease; }
@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }

.hud {
  position: relative; margin-top: -190px; width: 240px; padding: 10px 12px;
  background: rgba(9,13,20,0.88); border: 1px solid rgba(200,170,110,0.3); border-radius: 6px;
  backdrop-filter: blur(2px);
}
.hud-enemy { align-self: flex-start; margin-left: 18px; }
.hud-player { align-self: flex-end; margin-left: auto; margin-right: 18px; margin-top: -60px; }
.hud-name-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
.hud-name { font-weight: 700; font-size: 13.5px; }
.hud-class { font-size: 9.5px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
.hud-sub-row { display: flex; justify-content: space-between; font-size: 10px; color: #8C8474; margin: 3px 0 6px; font-family: 'Space Mono', monospace; }
.shield-tag { color: #4FB8C8; }
.status-tags { display: flex; gap: 4px; align-items: center; }
.cond-tag { font-size: 8.5px; font-weight: 700; letter-spacing: 0.5px; padding: 1px 5px; border-radius: 3px; border: 1px solid; }
.cond-stun { color: #F0C36B; border-color: rgba(240,195,107,0.5); background: rgba(240,195,107,0.12); }
.cond-slow { color: #4FB8C8; border-color: rgba(79,184,200,0.5); background: rgba(79,184,200,0.12); }
.cond-root { color: #C061E8; border-color: rgba(192,97,232,0.5); background: rgba(192,97,232,0.12); }

.statbar-wrap { display: flex; flex-direction: column; gap: 2px; }
.statbar-track { height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
.statbar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }

.battle-panel {
  border: 1px solid rgba(200,170,110,0.3); border-top: 1px solid rgba(200,170,110,0.15);
  border-radius: 0 0 8px 8px; background: #0C121C; padding: 14px 16px 16px;
}
.log-box { min-height: 76px; padding: 10px 12px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; margin-bottom: 12px; font-size: 12.5px; line-height: 1.6; color: #D8CFBA; }
.log-line { margin: 0; }

.move-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; position: relative; }
.move-btn {
  background: rgba(255,255,255,0.03); border: 1.5px solid; border-radius: 6px; padding: 9px 11px;
  text-align: left; cursor: pointer; color: #F0E6D2; transition: all 0.12s ease;
}
.move-btn:hover:not(:disabled) { background: rgba(240,195,107,0.08); transform: translateY(-1px); }
.move-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.move-btn-top { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
.move-key { font-family: 'Space Mono', monospace; font-size: 10.5px; background: rgba(255,255,255,0.08); padding: 1px 6px; border-radius: 3px; }
.move-name { font-weight: 600; font-size: 13px; }
.move-btn-bottom { display: flex; justify-content: space-between; font-size: 10.5px; font-family: 'Space Mono', monospace; color: #8C8474; }
.turn-indicator { grid-column: 1 / -1; text-align: center; font-size: 11.5px; color: #8C8474; margin-top: 2px; letter-spacing: 0.5px; }

.result-panel { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 0; }
.result-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700; }
.result-actions { display: flex; gap: 10px; margin-top: 6px; }
.result-btn { background: linear-gradient(135deg, #F0C36B, #C8AA6E); color: #0A0E14; border: none; padding: 10px 22px; border-radius: 5px; font-weight: 700; font-size: 13px; cursor: pointer; }

/* History */
.record-row { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
.record-chip { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 10px 18px; text-align: center; min-width: 84px; }
.record-value { font-family: 'Space Mono', monospace; font-size: 20px; font-weight: 700; }
.record-label { font-size: 10px; color: #8C8474; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
.clear-btn { display: flex; align-items: center; gap: 6px; margin-left: auto; background: rgba(248,81,73,0.1); border: 1px solid rgba(248,81,73,0.3); color: #F85149; padding: 8px 14px; border-radius: 5px; font-size: 12px; cursor: pointer; }

.match-list { display: flex; flex-direction: column; gap: 8px; }
.match-row { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-left: 3px solid; border-radius: 5px; padding: 10px 14px; }
.match-win { border-left-color: #3FB950; }
.match-loss { border-left-color: #F85149; }
.match-result-tag { font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; width: 42px; }
.match-win .match-result-tag { color: #3FB950; }
.match-loss .match-result-tag { color: #F85149; }
.match-info { display: flex; flex-direction: column; gap: 2px; }
.match-vs { font-size: 13px; font-weight: 600; }
.vs-small { color: #8C8474; font-weight: 400; }
.match-meta { font-size: 11px; color: #8C8474; }

.empty-state, .loading-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 50px 20px; color: #8C8474; text-align: center; font-size: 13px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .hud { width: 46%; padding: 8px; }
  .arena-field { height: 190px; }
  .move-grid { grid-template-columns: 1fr; }
  .select-columns { flex-direction: column; align-items: center; }
  .vs-mark { padding-top: 0; }
}
`;