import React from "react";
import { useSpriteContext } from "../context/SpriteContext";
import { CLASS_STYLE } from "../data/champions";

export default function HexPortrait({ champion, size = 76, dimmed = false, selected = false }) {
  const { sprites } = useSpriteContext();
  const sprite = sprites[champion.id] || champion.sprite || null;
  const style = CLASS_STYLE[champion.class];
  const Icon = style.icon;

  return (
    <div
      className="hex-portrait"
      style={{
        width: size,
        height: size * 1.06,
        background: sprite ? "#11161f" : `linear-gradient(155deg, ${style.grad[0]}, ${style.grad[1]})`,
        opacity: dimmed ? 0.35 : 1,
        boxShadow: selected ? `0 0 0 3px #F0E6D2, 0 0 18px ${style.accent}` : "0 0 0 2px rgba(240,230,210,0.25)",
      }}
    >
      {sprite ? (
        <img src={sprite} alt={champion.name} className="hex-portrait-img" />
      ) : (
        <Icon size={size * 0.42} color="#0A0E14" strokeWidth={2.25} />
      )}
    </div>
  );
}
