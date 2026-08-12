// Admin-Bundles: vom Admin gebaute Pakete, online für alle Spieler.
import { supabase } from "@/integrations/supabase/client";
import type { PackType } from "./collectibles";
import { COLLECTIBLES_BY_ID, PACK_META } from "./collectibles";
import { rarityPrice } from "./bundle-shop";
import { PRESETS_BY_KEY, presetToCustomCar } from "./preset-cars";
import { saveCar } from "./garage";
import { addToCollection } from "./collection";
import { addPack } from "./inventory";
import { addCoins, addSlot, spendCoins } from "./coins";
import { grantPremiumDays } from "./premium-pass";
import { grantTempBoost } from "./active-effects";

export type Booster = { stat: "accel" | "topSpeed" | "grip" | "brake"; pct: number; seconds: number };

export type BundleContents = {
  presets: string[];
  items: string[];
  packs: PackType[];
  coins: number;
  slots: number;
  passDays: number;
  boosters: Booster[];
};

export type AdminBundle = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  contents: BundleContents;
  price: number;
  starts_at: string | null;
  ends_at: string | null;
  once_per_player: boolean;
  active: boolean;
};

export const EMPTY_CONTENTS: BundleContents = {
  presets: [], items: [], packs: [], coins: 0, slots: 0, passDays: 0, boosters: [],
};

export function normalizeContents(raw: unknown): BundleContents {
  const c = (raw ?? {}) as Partial<BundleContents>;
  return {
    presets: Array.isArray(c.presets) ? c.presets : [],
    items: Array.isArray(c.items) ? c.items : [],
    packs: Array.isArray(c.packs) ? c.packs : [],
    coins: Number(c.coins) || 0,
    slots: Number(c.slots) || 0,
    passDays: Number(c.passDays) || 0,
    boosters: Array.isArray(c.boosters) ? c.boosters : [],
  };
}

const PRESET_PRICE: Record<string, number> = {
  common: 1200, uncommon: 3500, rare: 9000, epic: 22000, legendary: 60000,
};
const PACK_PRICE: Record<PackType, number> = {
  starter: 800, standard: 2000, deluxe: 6000, mythic: 18000, ultra: 45000, celestial: 100000,
};

/** Rechnerischer Einzelwert aller Inhalte. */
export function bundleValue(c: BundleContents): number {
  let v = c.coins + c.slots * 8000 + c.passDays * 800;
  for (const k of c.presets) {
    const p = PRESETS_BY_KEY[k];
    if (p) v += PRESET_PRICE[p.rarity] ?? 2000;
  }
  for (const id of c.items) {
    const it = COLLECTIBLES_BY_ID[id];
    if (it) v += rarityPrice(it.rarity);
  }
  for (const p of c.packs) v += PACK_PRICE[p] ?? 1000;
  for (const b of c.boosters) v += Math.round(b.pct * b.seconds * 2);
  return v;
}

export function packLabel(p: PackType): string {
  return `${PACK_META[p].emoji} ${PACK_META[p].label}`;
}

/* --------------------------- Laden --------------------------- */

function isLive(b: AdminBundle): boolean {
  const now = Date.now();
  if (b.starts_at && new Date(b.starts_at).getTime() > now) return false;
  if (b.ends_at && new Date(b.ends_at).getTime() < now) return false;
  return b.active;
}

function mapRow(r: Record<string, unknown>): AdminBundle {
  return {
    id: String(r["id"]),
    title: String(r["title"] ?? ""),
    description: String(r["description"] ?? ""),
    emoji: String(r["emoji"] ?? "🎁"),
    contents: normalizeContents(r["contents"]),
    price: Number(r["price"]) || 0,
    starts_at: (r["starts_at"] as string | null) ?? null,
    ends_at: (r["ends_at"] as string | null) ?? null,
    once_per_player: Boolean(r["once_per_player"]),
    active: Boolean(r["active"]),
  };
}

/** Aktive, laufende Bundles für den Shop. */
export async function listLiveBundles(): Promise<AdminBundle[]> {
  const { data, error } = await supabase
    .from("custom_bundles")
    .select("id, title, description, emoji, contents, price, starts_at, ends_at, once_per_player, active")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) return [];
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>)).filter(isLive);
}

/* ------------------------- Kauf-Status ------------------------ */

const BOUGHT_KEY = "garage:adminBundlesBought";
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

export function boughtIds(): string[] {
  try {
    const raw = safeLS()?.getItem(BOUGHT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch { return []; }
}

function markBought(id: string) {
  const list = boughtIds();
  if (!list.includes(id)) list.push(id);
  safeLS()?.setItem(BOUGHT_KEY, JSON.stringify(list));
}

/** Kauft ein Admin-Bundle und schreibt alle Inhalte gut. */
export function buyAdminBundle(b: AdminBundle): { ok: boolean; message: string } {
  if (b.once_per_player && boughtIds().includes(b.id)) {
    return { ok: false, message: "Dieses Bundle kann nur einmal gekauft werden." };
  }
  if (!spendCoins(b.price)) {
    return { ok: false, message: `Nicht genug Coins (🪙 ${b.price.toLocaleString()} nötig).` };
  }

  const c = b.contents;
  for (let i = 0; i < c.slots; i++) addSlot();

  let slotFull = false;
  for (const key of c.presets) {
    const p = PRESETS_BY_KEY[key];
    if (!p) continue;
    try { saveCar(presetToCustomCar(p), false); } catch { slotFull = true; }
  }
  for (const id of c.items) addToCollection(id, 1);
  for (const p of c.packs) addPack(p);
  if (c.coins > 0) addCoins(c.coins);
  if (c.passDays > 0) grantPremiumDays(c.passDays);
  for (const bo of c.boosters) grantTempBoost(bo.stat, bo.pct, bo.seconds, b.id);

  markBought(b.id);
  return {
    ok: true,
    message: slotFull
      ? `${b.emoji} „${b.title}" gekauft — Garagen-Slots voll, Fahrzeuge teilweise nicht gutgeschrieben.`
      : `${b.emoji} „${b.title}" gekauft!`,
  };
}
