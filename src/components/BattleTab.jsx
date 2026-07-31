import React, { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { CHAMPIONS } from "../data/champions";
import HexPortrait from "./HexPortrait";
import BattleArena from "./BattleArena";

export default function BattleTab() {
  const [phase, setPhase] = useState("select");
  const [playerChamp, setPlayerChamp] = useState(null);
  const [enemyChamp, setEnemyChamp] = useState(null);

  function randomizeEnemy() {
    const pool = CHAMPIONS.filter((champion) => champion.id !== playerChamp?.id);
    setEnemyChamp(pool[Math.floor(Math.random() * pool.length)]);
  }

  if (phase === "battle" && playerChamp && enemyChamp) {
    return (
      <BattleArena
        playerChamp={playerChamp}
        enemyChamp={enemyChamp}
        onExit={() => setPhase("select")}
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
        <PickColumn title="Your Champion" picked={playerChamp} onPick={setPlayerChamp} exclude={enemyChamp?.id} />
        <div className="vs-mark">VS</div>
        <PickColumn
          title="Opponent"
          picked={enemyChamp}
          onPick={setEnemyChamp}
          exclude={playerChamp?.id}
          onRandom={playerChamp ? randomizeEnemy : null}
        />
      </div>

      <button className="start-btn" disabled={!playerChamp || !enemyChamp} onClick={() => setPhase("battle")}>
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
            {CHAMPIONS.filter((champion) => champion.id !== exclude).map((champion) => (
              <button key={champion.id} className="pick-item" onClick={() => onPick(champion)} title={champion.name}>
                <HexPortrait champion={champion} size={48} />
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

