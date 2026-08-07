// Bundle-Shop: 4 rotierende Bundle-Größen (Klein, Mittel, Groß, Riesig).
// Inhalte sind deterministisch pro Tag (Seed = YYYY-MM-DD + Slot).
import { PRESETS } from "./preset-cars";
import type { Rarity, Collectible, PackType } from "./collectibles";
import { COLLECTIBLES } from "./collectibles";

export type BundleSize = "small" | "medium" | "large" | "huge";

export const BUNDLE_SIZES: BundleSize[] = ["small", "medium", "large", "huge"];

export const BUNDLE_META: Record<BundleSize, {
  label: string; emoji: string; desc: string; discount: number;
}> = {
  small:  { label: "Klein",  emoji: "📦", desc: "Kleiner Einstieg — ein Auto und zwei Items.", discount: 0.8 },
  medium: { label: "Mittel", emoji: "🎁", desc: "Solides Paket mit mehr Auswahl.",            discount: 0.75 },
  large:  { label: "Groß",   emoji: "🏆", desc: "Dickes Paket inklusive Sammelpaket.",         discount: 0.68 },
  huge:   { label: "Riesig", emoji: "💠", desc: "Endgame-Bundle mit maximalem Inhalt.",        discount: 0.6 },
};

export type BundleContent = {
  size: BundleSize;
  presetKeys: string[];
  collectibleIds: string[];
  packs: PackType[];
  price: number;
  rawValue: number;
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

type PresetDef = (typeof PRESETS)[number];

const PRESET_PRICE: Record<PresetDef["rarity"], number> = {
  common: 1200, uncommon: 3500, rare: 9000, epic: 22000, legendary: 60000,
};

const PACK_PRICE: Record<PackType, number> = {
  starter: 800, standard: 2000, deluxe: 6000,
  mythic: 18000, ultra: 45000, celestial: 100000,
};

type Tier = "low" | "mid" | "high" | "top";

const RARITY_TABLE: Record<Tier, Rarity[]> = {
  low:  ["common", "common", "common", "uncommon", "uncommon", "rare"],
  mid:  ["common", "uncommon", "uncommon", "rare", "rare", "epic"],
  high: ["uncommon", "rare", "rare", "epic", "epic", "legendary"],
  top:  ["rare", "epic", "epic", "legendary", "legendary", "mythical", "cosmic"],
};

const PRESET_TABLE: Record<Tier, PresetDef["rarity"][]> = {
  low:  ["common", "common", "uncommon"],
  mid:  ["common", "uncommon", "uncommon", "rare"],
  high: ["uncommon", "rare", "rare", "epic"],
  top:  ["rare", "epic", "epic", "legendary"],
};

const RECIPE: Record<BundleSize, { presets: number; items: number; packs: PackType[]; tier: Tier }> = {
  small:  { presets: 1, items: 2, packs: [],                      tier: "low" },
  medium: { presets: 2, items: 3, packs: ["starter"],             tier: "mid" },
  large:  { presets: 2, items: 4, packs: ["deluxe"],              tier: "high" },
  huge:   { presets: 3, items: 6, packs: ["ultra", "mythic"],     tier: "top" },
};

function buildBundle(date: string, size: BundleSize): BundleContent {
  const slot = BUNDLE_SIZES.indexOf(size);
  const r = mulberry(seedFromDate(date, slot));
  const recipe = RECIPE[size];

  const presetKeys: string[] = [];
  const pool = [...PRESETS];
  for (let i = 0; i < recipe.presets && pool.length > 0; i++) {
    const table = PRESET_TABLE[recipe.tier];
    const target = table[Math.floor(r() * table.length)];
    const filtered = pool.filter((p) => p.rarity === target);
    const cand = filtered.length ? filtered : pool;
    const p = cand[Math.floor(r() * cand.length)];
    presetKeys.push(p.key);
    pool.splice(pool.indexOf(p), 1);
  }

  const collectibleIds: string[] = [];
  for (let i = 0; i < recipe.items; i++) {
    const table = RARITY_TABLE[recipe.tier];
    const rar = table[Math.floor(r() * table.length)];
    const list = BY_RARITY[rar].length ? BY_RARITY[rar] : BY_RARITY.common;
    collectibleIds.push(list[Math.floor(r() * list.length)].id);
  }

  const cars = presetKeys.reduce((s, k) => {
    const p = PRESETS.find((x) => x.key === k);
    return s + (p ? PRESET_PRICE[p.rarity] : 0);
  }, 0);
  const items = collectibleIds.reduce((s, id) => {
    const c = COLLECTIBLES.find((x) => x.id === id);
    return s + (c ? RARITY_PRICE[c.rarity] : 0);
  }, 0);
  const packs = recipe.packs.reduce((s, p) => s + PACK_PRICE[p], 0);

  const rawValue = cars + items + packs;
  const price = Math.max(400, Math.round((rawValue * BUNDLE_META[size].discount) / 100) * 100);

  return { size, presetKeys, collectibleIds, packs: recipe.packs, price, rawValue };
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getTodayBundles(): BundleContent[] {
  const d = todayKey();
  return BUNDLE_SIZES.map((s) => buildBundle(d, s));
}

const BOUGHT_KEY = "garage:bundlesBought";
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

type BoughtState = { date: string; sizes: string[] };

function readBought(): BoughtState {
  const today = todayKey();
  try {
    const raw = safeLS()?.getItem(BOUGHT_KEY);
    if (!raw) return { date: today, sizes: [] };
    const p = JSON.parse(raw) as Partial<BoughtState>;
    if (p.date !== today || !Array.isArray(p.sizes)) return { date: today, sizes: [] };
    return { date: today, sizes: p.sizes };
  } catch { return { date: today, sizes: [] }; }
}

export function isBought(size: BundleSize): boolean {
  return readBought().sizes.includes(size);
}

export function markBought(size: BundleSize) {
  const b = readBought();
  if (!b.sizes.includes(size)) b.sizes.push(size);
  safeLS()?.setItem(BOUGHT_KEY, JSON.stringify(b));
}

export function msUntilReset(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
