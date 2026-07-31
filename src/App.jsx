import React, { useState } from "react";
import { History, Shield, Swords } from "lucide-react";
import { SpriteProvider } from "./context/SpriteContext";
import BattleTab from "./components/BattleTab";
import HistoryTab from "./components/HistoryTab";
import RosterTab from "./components/RosterTab";
import "./index.css";

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button className={`tab-btn ${active ? "tab-btn-active" : ""}`} onClick={onClick}>
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState("battle");

  return (
    <SpriteProvider>
      <div className="app">
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
    </SpriteProvider>
  );
}
