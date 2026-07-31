import React, { useCallback, useEffect, useState } from "react";
import { Info, Loader2, Trash2 } from "lucide-react";
import { api } from "../lib/api";

export default function HistoryTab() {
  const [matches, setMatches] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const items = await api.listMatches();
      const normalized = (items || []).sort((a, b) => new Date(b.playedAt || b.date || 0) - new Date(a.playedAt || a.date || 0));
      setMatches(normalized);
    } catch {
      setMatches([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function clearAll() {
    setBusy(true);
    try {
      await api.clearMatches();
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

  const wins = matches.filter((match) => match.result === "player").length;
  const losses = matches.filter((match) => match.result === "enemy").length;

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
          {matches.map((match, index) => (
            <div key={index} className={`match-row ${match.result === "player" ? "match-win" : "match-loss"}`}>
              <div className="match-result-tag">{match.result === "player" ? "WIN" : "LOSS"}</div>
              <div className="match-info">
                <span className="match-vs">{match.player} <span className="vs-small">vs</span> {match.opponent}</span>
                <span className="match-meta">{match.turns} turns · {new Date(match.playedAt || match.date || 0).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
