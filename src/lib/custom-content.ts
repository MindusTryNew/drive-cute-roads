// Admin-Inhalte aus der Cloud: eigene Seltenheiten, Sammelitems und Kisten.
// Wird beim Start einmal geladen und in die globalen Registries eingespielt.
import { supabase } from "@/integrations/supabase/client";
import {
  registerRuntimeRarity,
  registerRuntimeItems,
  registerRuntimePack,
  type Collectible,
  type Effect,
  type PackType,
  type Rarity,
} from "./collectibles";
import { registerRuntimeRarityPrice, registerRuntimePackPrice, refreshBundlePools } from "./bundle-shop";
import { registerRuntimeScrapValue } from "./crafting";

export type CustomRarityRow = {
  id: string;
  key: string;
  label: string;
  color: string;
  emoji: string;
  cooldown_sec: number;
  ladder_rank: number;
  price: number;
  pack_weights: Partial<Record<PackType, number>>;
  active: boolean;
};

export type CustomItemRow = {
  id: string;
  item_key: string;
  name: string;
  emoji: string;
  description: string;
  rarity_key: string;
  effect: Effect | Record<string, never>;
  series_key: string | null;
  active: boolean;
};

export type CustomPackRow = {
  id: string;
  key: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
  price: number;
  min_items: number;
  max_items: number;
  rarity_weights: Record<string, number>;
  guarantee: { rarity?: string } | Record<string, never>;
  world_chance: number;
  active: boolean;
};

let loaded = false;
let rarities: CustomRarityRow[] = [];
let items: CustomItemRow[] = [];
let packs: CustomPackRow[] = [];

const listeners = new Set<() => void>();
export function subscribeCustomContent(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
const emit = () => { for (const l of listeners) l(); };

export function getCustomRarities(): CustomRarityRow[] { return [...rarities]; }
export function getCustomItems(): CustomItemRow[] { return [...items]; }
export function getCustomPacks(): CustomPackRow[] { return [...packs]; }

function toCollectible(r: CustomItemRow): Collectible {
  const eff = r.effect && typeof r.effect === "object" && "kind" in r.effect
    ? (r.effect as Effect)
    : undefined;
  return {
    id: r.item_key,
    name: r.name,
    desc: r.description,
    rarity: r.rarity_key as Rarity,
    emoji: r.emoji,
    effect: eff,
    series: r.series_key ?? undefined,
  };
}

function applyRarity(r: CustomRarityRow) {
  registerRuntimeRarity({
    key: r.key,
    label: r.label,
    color: r.color,
    cooldownSec: r.cooldown_sec,
    ladderRank: r.ladder_rank,
    packWeights: r.pack_weights ?? {},
  });
  registerRuntimeRarityPrice(r.key, r.price);
  registerRuntimeScrapValue(r.key, Math.max(10, Math.round(r.price * 0.2)));
}

function applyPack(p: CustomPackRow) {
  const g = (p.guarantee ?? {}) as { rarity?: string };
  registerRuntimePack({
    key: p.key,
    label: p.label,
    emoji: p.emoji,
    color: p.color,
    description: p.description,
    price: p.price,
    minItems: p.min_items,
    maxItems: p.max_items,
    rarityWeights: p.rarity_weights ?? {},
    guarantee: (g.rarity as Rarity) ?? null,
    worldChance: Number(p.world_chance) || 0,
  });
  registerRuntimePackPrice(p.key, p.price);
}

/** Lädt Admin-Seltenheiten, -Items und -Kisten (still bei Fehlern) und registriert sie. */
export async function loadCustomContent(force = false): Promise<void> {
  if (loaded && !force) return;
  loaded = true;
  try {
    const [rar, itm, pks] = await Promise.all([
      supabase.from("custom_rarities")
        .select("id, key, label, color, emoji, cooldown_sec, ladder_rank, price, pack_weights, active")
        .eq("active", true).order("ladder_rank", { ascending: true }).limit(100),
      supabase.from("custom_collectibles")
        .select("id, item_key, name, emoji, description, rarity_key, effect, series_key, active")
        .eq("active", true).order("created_at", { ascending: true }).limit(2000),
      supabase.from("custom_packs")
        .select("id, key, label, emoji, color, description, price, min_items, max_items, rarity_weights, guarantee, world_chance, active")
        .eq("active", true).order("price", { ascending: true }).limit(100),
    ]);
    rarities = (rar.data ?? []) as unknown as CustomRarityRow[];
    items = (itm.data ?? []) as unknown as CustomItemRow[];
    packs = (pks.data ?? []) as unknown as CustomPackRow[];
    for (const r of rarities) applyRarity(r);
    registerRuntimeItems(items.map(toCollectible));
    for (const p of packs) applyPack(p);
    refreshBundlePools();
    emit();
  } catch {
    /* offline → nur eingebaute Inhalte */
  }
}
