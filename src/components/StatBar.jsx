import React from "react";

export default function StatBar({ value, max, color, label, sub }) {
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
