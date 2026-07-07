// Endloses Prestige-/XP-System für Langzeit-Motivation.
import { addCoins } from "./coins";
import { toast } from "sonner";

const XP_KEY = "garage:prestige:xp";
const LEVEL_KEY = "garage:prestige:level";
const POINTS_KEY = "garage:prestige:points";
const RANKS_KEY = "garage:prestige:ranks";

export type PrestigeTrack = "coinBoost" | "dropBoost" | "slotDiscount" | "xpBoost";

export const TRACKS: { id: PrestigeTrack; label: string; desc: string; emoji: string; maxRank: number }[] = [
  { id: "coinBoost",    label: "Reichtum",       desc: "+5 % Coin-Belohnung pro Rang",           emoji: "🪙", maxRank: 5 },
  { id: "dropBoost",    label: "Glücksfinder",   desc: "+0,2 % Sammelpaket-Drop-Chance pro Rang", emoji: "🎁", maxRank: 5 },
  { id: "slotDiscount", label: "Baumeister",     desc: "−10 % Garagen-Slot-Preis pro Rang",       emoji: "🏗️", maxRank: 5 },
  { id: "xpBoost",      label: "Gelehrter",      desc: "+10 % XP pro Rang",                       emoji: "📘", maxRank: 5 },
];

type Ranks = Record<PrestigeTrack, number>;

const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);
type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => { for (const l of listeners) l(); };

export function subscribePrestige(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function getXp(): number {
  const n = parseFloat(safeLS()?.getItem(XP_KEY) ?? "0");
  return Number.isFinite(n) ? n : 0;
}
export function getLevel(): number {
  const n = parseInt(safeLS()?.getItem(LEVEL_KEY) ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}
export function getPoints(): number {
  const n = parseInt(safeLS()?.getItem(POINTS_KEY) ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}
export function getRanks(): Ranks {
  try {
    const raw = safeLS()?.getItem(RANKS_KEY);
    const base: Ranks = { coinBoost: 0, dropBoost: 0, slotDiscount: 0, xpBoost: 0 };
    if (!raw) return base;
    return { ...base, ...JSON.parse(raw) };
  } catch { return { coinBoost: 0, dropBoost: 0, slotDiscount: 0, xpBoost: 0 }; }
}

function saveRanks(r: Ranks) { safeLS()?.setItem(RANKS_KEY, JSON.stringify(r)); emit(); }

/** XP-Kurve: XP nötig, um von Level n auf n+1 zu kommen. */
export function xpForLevel(n: number): number {
  return Math.floor(500 * Math.pow(n, 1.6));
}

/** XP-Fortschritt im aktuellen Level [current, needed]. */
export function levelProgress(): { current: number; needed: number; level: number } {
  const level = getLevel();
  const xp = getXp();
  let acc = 0;
  for (let l = 1; l < level; l++) acc += xpForLevel(l);
  return { current: Math.max(0, Math.floor(xp - acc)), needed: xpForLevel(level), level };
}

/** Fügt XP hinzu — respektiert xpBoost-Rang. Löst Level-Ups aus (Coins + Prestige-Punkte). */
export function awardXp(base: number) {
  if (base <= 0) return;
  const ranks = getRanks();
  const mult = 1 + ranks.xpBoost * 0.10;
  const gained = base * mult;
  const newXp = getXp() + gained;
  safeLS()?.setItem(XP_KEY, String(newXp));

  let level = getLevel();
  let acc = 0;
  for (let l = 1; l <= level; l++) acc += xpForLevel(l);
  let levelUps = 0;
  while (newXp >= acc) {
    level++;
    levelUps++;
    acc += xpForLevel(level);
  }
  if (levelUps > 0) {
    safeLS()?.setItem(LEVEL_KEY, String(level));
    safeLS()?.setItem(POINTS_KEY, String(getPoints() + levelUps));
    addCoins(250 * levelUps);
    toast.success(`⭐ Level ${level}! +${levelUps} Prestige-Punkt${levelUps > 1 ? "e" : ""} · +${250 * levelUps} 🪙`);
  }
  emit();
}

/** Basis-Coin-Belohnung mit coinBoost-Multiplikator. */
export function awardCoins(base: number) {
  const mult = 1 + getRanks().coinBoost * 0.05;
  addCoins(Math.round(base * mult));
}

export function coinMultiplier(): number { return 1 + getRanks().coinBoost * 0.05; }
export function dropChanceBonus(): number { return getRanks().dropBoost * 0.002; }
export function slotDiscount(): number { return getRanks().slotDiscount * 0.10; }

export function spendPoint(track: PrestigeTrack): { ok: boolean; reason?: string } {
  const p = getPoints();
  if (p <= 0) return { ok: false, reason: "Keine Prestige-Punkte." };
  const ranks = getRanks();
  const def = TRACKS.find((t) => t.id === track)!;
  if (ranks[track] >= def.maxRank) return { ok: false, reason: "Maximaler Rang erreicht." };
  ranks[track]++;
  safeLS()?.setItem(POINTS_KEY, String(p - 1));
  saveRanks(ranks);
  return { ok: true };
}
