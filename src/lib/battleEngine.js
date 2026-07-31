import { MAX_MANA } from "../data/champions";

export function computeResult(attacker, defender, ability) {
  if (ability.type === "heal") {
    return { heal: Math.round(ability.power * (0.6 + attacker.ap / 220)) };
  }
  if (ability.type === "shield") {
    return { shield: Math.round(ability.power * (0.6 + (attacker.ap + attacker.atk) / 260)) };
  }

  let raw;
  if (ability.type === "physical") raw = ability.power * (0.55 + attacker.atk / 110);
  else if (ability.type === "magic") raw = ability.power * (0.55 + attacker.ap / 110);
  else raw = ability.power * 0.85;

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

export function chooseEnemyMove(champion, mana, hp, maxHp) {
  const affordable = champion.abilities.filter((ability) => ability.cost <= mana);
  if (affordable.length === 0) {
    return champion.abilities.reduce((best, current) => (current.cost < best.cost ? current : best));
  }

  const support = affordable.find((ability) => ability.type === "heal" || ability.type === "shield");
  if (hp / maxHp < 0.35 && support && Math.random() < 0.7) return support;

  const damaging = affordable.filter((ability) => ["physical", "magic", "true"].includes(ability.type));
  if (damaging.length) {
    damaging.sort((a, b) => b.power - a.power);
    return Math.random() < 0.55 ? damaging[0] : damaging[Math.floor(Math.random() * damaging.length)];
  }

  return affordable[Math.floor(Math.random() * affordable.length)];
}

export function freshBattler(champ) {
  return { hp: champ.hp, maxHp: champ.hp, mana: MAX_MANA, shield: 0, stunned: false, slowed: false, vulnerable: false };
}

export function hpColor(pct) {
  if (pct > 0.5) return "#3FB950";
  if (pct > 0.2) return "#E3B341";
  return "#F85149";
}
