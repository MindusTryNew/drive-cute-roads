// Tägliches Bundle-Shop-System. Deterministisch pro Tag (Seed = YYYY-MM-DD).
import { PRESETS } from "./preset-cars";
import type { Rarity, Collectible } from "./collectibles";
import { COLLECTIBLES } from "./collectibles";

export type BundleContent = {
  presetKeys: string[];   // 1-3
  collectibleIds: string[]; // 2-5
  price: number;
};

const BY_RARITY: Record<Rarity, Collectible[]> = {
  common: [], uncommon: [], rare: [], epic: [], legendary: [],
  mythical: [], cosmic: [], celestial: [],
};
for (const c of COLLECTIBLES) BY_RARITY[c.rarity].push(c);

function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromDate(date: string, slot: number): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) { h ^= date.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h ^ (slot * 2654435761)) >>> 0;
}

const RARITY_PRICE: Record<Rarity, number> = {
  common: 150, uncommon: 350, rare: 900, epic: 2500,
  legendary: 8000, mythical: 20000, cosmic: 50000, celestial: 120000,
};

const PRESET_PRICE: Record<PresetDef["rarity"], number> = {
  common: 1200, uncommon: 3500, rare: 9000, epic: 22000, legendary: 60000,
};

type PresetDef = (typeof PRESETS)[number];

function pickRarity(r: () => number, tier: "low" | "mid" | "high"): Rarity {
  const roll = r();
  if (tier === "low") {
    if (roll < 0.70) return "common";
    if (roll < 0.92) return "uncommon";
    if (roll < 0.99) return "rare";
    return "epic";
  }
  if (tier === "mid") {
    if (roll < 0.30) return "uncommon";
    if (roll < 0.70) return "rare";
    if (roll < 0.92) return "epic";
    if (roll < 0.99) return "legendary";
    return "mythical";
  }
  // high
  if (roll < 0.25) return "rare";
  if (roll < 0.55) return "epic";
  if (roll < 0.82) return "legendary";
  if (roll < 0.95) return "mythical";
  if (roll < 0.995) return "cosmic";
  return "celestial";
}

function pickPresetTier(r: () => number, tier: "low" | "high"): PresetDef["rarity"] {
  const roll = r();
  if (tier === "low") {
    if (roll < 0.55) return "common";
    if (roll < 0.85) return "uncommon";
    if (roll < 0.98) return "rare";
    return "epic";
  }
  if (roll < 0.20) return "uncommon";
  if (roll < 0.55) return "rare";
  if (roll < 0.88) return "epic";
  return "legendary";
}

function buildBundle(date: string, slot: 0 | 1): BundleContent {
  const r = mulberry(seedFromDate(date, slot));
  const isPremium = slot === 1;
  const presetCount = isPremium ? 3 : (r() < 0.5 ? 1 : 2);
  const collCount = isPremium ? 5 : (2 + Math.floor(r() * 3));

  const presetKeys: string[] = [];
  const presetRarity = isPremium ? "high" : "low";
  const pool = [...PRESETS];
  for (let i = 0; i < presetCount && pool.length > 0; i++) {
    const targetTier = pickPresetTier(r, presetRarity);
    // Sortiere Kandidaten nach Nähe zur Ziel-Rarität; wenn nichts passt, nimm alles.
    const filtered = pool.filter((p) => p.rarity === targetTier);
    const cand = filtered.length ? filtered : pool;
    const p = cand[Math.floor(r() * cand.length)];
    presetKeys.push(p.key);
    pool.splice(pool.indexOf(p), 1);
  }

  const collIds: string[] = [];
  const tier = isPremium ? "high" : (r() < 0.5 ? "low" : "mid");
  for (let i = 0; i < collCount; i++) {
    const rar = pickRarity(r, tier);
    const list = BY_RARITY[rar];
    const pick = list.length ? list[Math.floor(r() * list.length)] : BY_RARITY.common[0];
    collIds.push(pick.id);
  }

  // Preis-Kalkulation + 20-40% Rabatt gegenüber Einzelwert.
  const cars = presetKeys.reduce((s, k) => {
    const p = PRESETS.find((x) => x.key === k)!;
    return s + PRESET_PRICE[p.rarity];
  }, 0);
  const items = collIds.reduce((s, id) => {
    const c = COLLECTIBLES.find((x) => x.id === id)!;
    return s + RARITY_PRICE[c.rarity];
  }, 0);
  const raw = cars + items;
  const discount = isPremium ? 0.65 : 0.75; // 25% / 35% Ersparnis
  const price = Math.max(500, Math.round((raw * discount) / 100) * 100);

  return { presetKeys, collectibleIds: collIds, price };
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getTodayBundles(): [BundleContent, BundleContent] {
  const d = todayKey();
  return [buildBundle(d, 0), buildBundle(d, 1)];
}

const BOUGHT_KEY = "garage:bundlesBought";
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

type BoughtState = { date: string; slots: number[] };

function readBought(): BoughtState {
  const ls = safeLS();
  const raw = ls?.getItem(BOUGHT_KEY);
  const today = todayKey();
  if (!raw) return { date: today, slots: [] };
  try {
    const p = JSON.parse(raw) as BoughtState;
    if (p.date !== today) return { date: today, slots: [] };
    return p;
  } catch { return { date: today, slots: [] }; }
}

export function isBought(slot: 0 | 1): boolean {
  return readBought().slots.includes(slot);
}

export function markBought(slot: 0 | 1) {
  const b = readBought();
  if (!b.slots.includes(slot)) b.slots.push(slot);
  safeLS()?.setItem(BOUGHT_KEY, JSON.stringify(b));
}

export function msUntilReset(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
