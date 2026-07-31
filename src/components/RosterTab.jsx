import React, { useRef, useState } from "react";
import { CLASS_STYLE } from "../data/champions";
import { CHAMPIONS } from "../data/champions";
import HexPortrait from "./HexPortrait";
import { X, Upload } from "lucide-react";
import { useSpriteContext } from "../context/SpriteContext";
import { STATUS_COLOR, STATUS_DESC, STATUS_LABEL, TYPE_COLOR, TYPE_LABEL } from "../data/champions";
import { api } from "../lib/api";

function StatChip({ label, value, color }) {
  return (
    <div className="stat-chip">
      <div className="stat-chip-value" style={{ color }}>{value}</div>
      <div className="stat-chip-label">{label}</div>
    </div>
  );
}

export default function RosterTab() {
  const [detail, setDetail] = useState(null);

  return (
    <div className="roster-tab">
      <div className="section-heading">
        <h2>Champion Roster</h2>
        <p>Ten champions, six classes. Tap a portrait for full stats and abilities.</p>
      </div>
      <div className="roster-grid">
        {CHAMPIONS.map((champion) => (
          <button key={champion.id} className="roster-card" onClick={() => setDetail(champion)}>
            <HexPortrait champion={champion} size={64} />
            <div className="roster-card-name">{champion.name}</div>
            <div className="roster-card-class" style={{ color: CLASS_STYLE[champion.class].accent }}>{champion.class}</div>
          </button>
        ))}
      </div>
      {detail && <ChampionModal champion={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function ChampionModal({ champion, onClose }) {
  const style = CLASS_STYLE[champion.class];
  const { sprites, setSprite, clearSprite } = useSpriteContext();
  const fileRef = useRef(null);
  const hasCustom = Boolean(sprites[champion.id]);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = reader.result;
      try {
        await api.saveSprite(champion.id, dataUri);
        await setSprite(champion.id, dataUri);
      } catch (error) {
        console.error("Failed to save sprite", error);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="modal-head">
          <HexPortrait champion={champion} size={88} />
          <div>
            <div className="modal-name">{champion.name}</div>
            <div className="modal-title">{champion.title}</div>
            <div className="modal-class" style={{ color: style.accent }}>{champion.class}</div>
          </div>
        </div>
        <div className="sprite-controls">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          <button className="sprite-btn" onClick={() => fileRef.current?.click()}>
            <Upload size={13} /> Upload your own art
          </button>
          {hasCustom && (
            <button className="sprite-btn sprite-btn-ghost" onClick={() => clearSprite(champion.id)}>
              Remove custom art
            </button>
          )}
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
          {champion.abilities.map((ability) => (
            <div className="ability-row" key={ability.key}>
              <div className="ability-key">{ability.key}</div>
              <div className="ability-info">
                <div className="ability-name-row">
                  <span className="ability-name">{ability.name}</span>
                  <span className="ability-type" style={{ color: TYPE_COLOR[ability.type] }}>{TYPE_LABEL[ability.type]}</span>
                </div>
                <div className="ability-desc">{ability.desc}</div>
                {ability.effect && (
                  <div className="ability-status" style={{ color: STATUS_COLOR[ability.effect.type] }}>
                    {STATUS_LABEL[ability.effect.type]} ({Math.round(ability.effect.chance * 100)}% chance) — {STATUS_DESC[ability.effect.type]}
                  </div>
                )}
              </div>
              <div className="ability-cost">{ability.cost} mana</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
