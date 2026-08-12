// Crafting: Duplikate verwerten (Coins) und 5 gleiche Seltenheiten upgraden.
import {
  COLLECTIBLES,
  COLLECTIBLES_BY_ID,
  RARITY_ORDER,
  type Collectible,
  type Rarity,
} from "./collectibles";
import { getCollection, addToCollection, removeFromCollection } from "./collection";
import { addCoins } from "./coins";

export const SCRAP_VALUE: Record<Rarity, number> = {
  common: 25,
  uncommon: 60,
  rare: 150,
  epic: 400,
  legendary: 1200,
  mythical: 3000,
  cosmic: 8000,
  celestial: 20000,
  interplanetary: 55000,
  ultimate: 150000,
};

/** Verwertungswert für eine vom Admin erstellte Seltenheit registrieren. */
export function registerRuntimeScrapValue(key: string, value: number): void {
  SCRAP_VALUE[key as Rarity] = value;
}

export function scrapValue(key: string): number {
  return SCRAP_VALUE[key as Rarity] ?? 25;
}

/** Anzahl Duplikate (alles über 1 Stück) pro Seltenheit. */
export function duplicatesByRarity(): Record<Rarity, number> {
  const counts = getCollection();
  const out = Object.fromEntries(RARITY_ORDER.map((r) => [r, 0])) as Record<Rarity, number>;
  for (const [id, n] of Object.entries(counts)) {
    const item = COLLECTIBLES_BY_ID[id];
    if (!item || n <= 1) continue;
    out[item.rarity] += n - 1;
  }
  return out;
}

/** Verwertet alle Duplikate einer Seltenheit gegen Coins. */
export function scrapDuplicates(rarity: Rarity): { ok: boolean; message: string } {
  const counts = getCollection();
  let scrapped = 0;
  for (const [id, n] of Object.entries(counts)) {
    const item = COLLECTIBLES_BY_ID[id];
    if (!item || item.rarity !== rarity || n <= 1) continue;
    const extra = n - 1;
    removeFromCollection(id, extra);
    scrapped += extra;
  }
  if (scrapped === 0) return { ok: false, message: "Keine Duplikate dieser Seltenheit." };
  const coins = scrapped * SCRAP_VALUE[rarity];
  addCoins(coins);
  return { ok: true, message: `${scrapped} Duplikate verwertet: +🪙 ${coins.toLocaleString()}` };
}

export const UPGRADE_COST = 5;

/** 5 Duplikate einer Seltenheit → 1 zufälliges Item der nächsthöheren. */
export function upgradeDuplicates(rarity: Rarity): { ok: boolean; message: string; item?: Collectible } {
  const idx = RARITY_ORDER.indexOf(rarity);
  if (idx < 0 || idx >= RARITY_ORDER.length - 1) {
    return { ok: false, message: "Ultimativ lässt sich nicht weiter aufwerten." };
  }
  if (duplicatesByRarity()[rarity] < UPGRADE_COST) {
    return { ok: false, message: `${UPGRADE_COST} Duplikate nötig.` };
  }

  const counts = getCollection();
  let need = UPGRADE_COST;
  for (const [id, n] of Object.entries(counts)) {
    if (need <= 0) break;
    const item = COLLECTIBLES_BY_ID[id];
    if (!item || item.rarity !== rarity || n <= 1) continue;
    const take = Math.min(need, n - 1);
    removeFromCollection(id, take);
    need -= take;
  }

  const target = RARITY_ORDER[idx + 1];
  const pool = COLLECTIBLES.filter((c) => c.rarity === target);
  const item = pool[Math.floor(Math.random() * pool.length)];
  addToCollection(item.id);
  return { ok: true, message: `Aufgewertet: ${item.emoji} ${item.name}`, item };
}
