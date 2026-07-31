import React, { useCallback, useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";
import { CHAMPIONS, CLASS_STYLE, MAX_MANA, MANA_REGEN, STATUS_COLOR, STATUS_LABEL, TYPE_COLOR, TYPE_LABEL } from "../data/champions";
import { chooseEnemyMove, computeResult, freshBattler, hpColor } from "../lib/battleEngine";
import { storage } from "../storage";
import HexPortrait from "./HexPortrait";
import StatBar from "./StatBar";

export default function BattleArena({ playerChamp, enemyChamp, onExit }) {
  const [player, setPlayer] = useState(() => freshBattler(playerChamp));
  const [enemy, setEnemy] = useState(() => freshBattler(enemyChamp));
  const [turn, setTurn] = useState(playerChamp.speed >= enemyChamp.speed ? "player" : "enemy");
  const [log, setLog] = useState([`A wild battle begins! ${playerChamp.name} vs ${enemyChamp.name}.`]);
  const [over, setOver] = useState(null);
  const [flash, setFlash] = useState(null);
  const savedRef = useRef(false);
  const logEndRef = useRef(null);
  const turnCountRef = useRef(0);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const pushLog = useCallback((message) => {
    setLog((current) => [...current, message]);
  }, []);

  const saveMatch = useCallback(async (result) => {
    if (savedRef.current) return;
    savedRef.current = true;
    try {
      const id = `match:${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await storage.set(id, JSON.stringify({
        date: new Date().toISOString(),
        player: playerChamp.name,
        opponent: enemyChamp.name,
        result,
        turns: turnCountRef.current,
      }));
    } catch (error) {
      console.error("Failed to save match", error);
    }
  }, [enemyChamp.name, playerChamp.name]);

  useEffect(() => {
    if (over) saveMatch(over);
  }, [over, saveMatch]);

  useEffect(() => {
    if (over) return;

    const isPlayerTurn = turn === "player";
    const state = isPlayerTurn ? player : enemy;
    const champion = isPlayerTurn ? playerChamp : enemyChamp;
    const setState = isPlayerTurn ? setPlayer : setEnemy;
    const regenAmount = state.slowed ? Math.round(MANA_REGEN / 2) : MANA_REGEN;
    const regenedMana = Math.min(MAX_MANA, state.mana + regenAmount);

    if (state.stunned) {
      const timer = setTimeout(() => {
        pushLog(`${champion.name} is stunned and can't act!`);
        setState((current) => ({ ...current, stunned: false, slowed: false, mana: regenedMana }));
        setTurn(isPlayerTurn ? "enemy" : "player");
      }, 750);
      return () => clearTimeout(timer);
    }

    setState((current) => ({ ...current, mana: regenedMana, slowed: false }));

    if (!isPlayerTurn) {
      const timer = setTimeout(() => {
        const ability = chooseEnemyMove(enemyChamp, regenedMana, enemy.hp, enemy.maxHp);
        resolveTurn("enemy", ability, regenedMana);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [turn, over, player, enemy, playerChamp, enemyChamp, pushLog]);

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
      setAttacker((current) => ({ ...current, mana: newMana, hp: Math.min(current.maxHp, current.hp + result.heal) }));
      pushLog(`${attackerChamp.name} used ${ability.name}! Restored ${result.heal} HP.`);
    } else if (result.shield !== undefined) {
      setAttacker((current) => ({ ...current, mana: newMana, shield: current.shield + result.shield }));
      pushLog(`${attackerChamp.name} used ${ability.name}! Gained a ${result.shield}-point shield.`);
    } else {
      setAttacker((current) => ({ ...current, mana: newMana }));
      setFlash(who === "player" ? "enemy" : "player");
      setTimeout(() => setFlash(null), 350);

      const wasVulnerable = defenderState.vulnerable;
      let finalDamage = result.damage;
      if (wasVulnerable) finalDamage = Math.round(finalDamage * 1.15);

      setDefender((current) => {
        let damage = finalDamage;
        let shieldLeft = current.shield;
        if (shieldLeft > 0) {
          const absorbed = Math.min(shieldLeft, damage);
          shieldLeft -= absorbed;
          damage -= absorbed;
        }
        const next = { ...current, shield: shieldLeft, hp: Math.max(0, current.hp - damage), vulnerable: false };
        if (result.statusApplied === "stun") next.stunned = true;
        if (result.statusApplied === "slow") next.slowed = true;
        if (result.statusApplied === "root") next.vulnerable = true;
        return next;
      });

      let message = `${attackerChamp.name} used ${ability.name}!`;
      if (result.crit) message += " Critical hit!";
      if (wasVulnerable) message += " (rooted, +dmg)";
      message += ` ${finalDamage} damage.`;
      if (result.statusApplied === "stun") message += ` ${defenderChamp.name} is stunned!`;
      if (result.statusApplied === "slow") message += ` ${defenderChamp.name} is slowed!`;
      if (result.statusApplied === "root") message += ` ${defenderChamp.name} is rooted!`;
      pushLog(message);
    }

    setTurn(who === "player" ? "enemy" : "player");
  }

  useEffect(() => {
    if (over) return;
    if (enemy.hp <= 0) {
      setOver("player");
      pushLog(`${enemyChamp.name} has been defeated. Victory!`);
    } else if (player.hp <= 0) {
      setOver("enemy");
      pushLog(`${playerChamp.name} has been defeated. Defeat.`);
    }
  }, [enemy.hp, player.hp, over, enemyChamp.name, playerChamp.name, pushLog]);

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
          {log.slice(-4).map((message, index) => (
            <div key={index} className="log-line">{message}</div>
          ))}
          <div ref={logEndRef} />
        </div>

        {!over ? (
          <div className="move-grid">
            {playerChamp.abilities.map((ability) => {
              const disabled = turn !== "player" || player.stunned || ability.cost > player.mana;
              return (
                <button key={ability.key} className="move-btn" disabled={disabled} onClick={() => handlePlayerAbility(ability)} style={{ borderColor: disabled ? "rgba(240,230,210,0.15)" : TYPE_COLOR[ability.type] }}>
                  <div className="move-btn-top">
                    <span className="move-key">{ability.key}</span>
                    <span className="move-name">{ability.name}</span>
                  </div>
                  <div className="move-btn-bottom">
                    <span style={{ color: TYPE_COLOR[ability.type] }}>{TYPE_LABEL[ability.type]}</span>
                    {ability.effect && (
                      <span style={{ color: STATUS_COLOR[ability.effect.type] }}>
                        {STATUS_LABEL[ability.effect.type]} {Math.round(ability.effect.chance * 100)}%
                      </span>
                    )}
                    <span>{ability.cost} mana</span>
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
