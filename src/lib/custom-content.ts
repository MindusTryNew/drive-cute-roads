// Admin-Inhalte aus der Cloud: eigene Seltenheiten + eigene Sammelitems.
// Wird beim Start einmal geladen und in die globalen Registries eingespielt.
import { supabase } from "@/integrations/supabase/client";
import {
  registerRuntimeRarity,
  registerRuntimeItems,
  type Collectible,
  type Effect,
  type PackType,
  type Rarity,
} from "./collectibles";
import { registerRuntimeRarityPrice, refreshBundlePools } from "./bundle-shop";
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

let loaded = false;
let rarities: CustomRarityRow[] = [];
let items: CustomItemRow[] = [];

const listeners = new Set<() => void>();
export function subscribeCustomContent(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
const emit = () => { for (const l of listeners) l(); };

export function getCustomRarities(): CustomRarityRow[] { return [...rarities]; }
export function getCustomItems(): CustomItemRow[] { return [...items]; }

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

/** Lädt Admin-Seltenheiten und -Items (still bei Fehlern) und registriert sie. */
export async function loadCustomContent(force = false): Promise<void> {
  if (loaded && !force) return;
  loaded = true;
  try {
    const [rar, itm] = await Promise.all([
      supabase.from("custom_rarities")
        .select("id, key, label, color, emoji, cooldown_sec, ladder_rank, price, pack_weights, active")
        .eq("active", true).order("ladder_rank", { ascending: true }).limit(100),
      supabase.from("custom_collectibles")
        .select("id, item_key, name, emoji, description, rarity_key, effect, series_key, active")
        .eq("active", true).order("created_at", { ascending: true }).limit(2000),
    ]);
    rarities = (rar.data ?? []) as unknown as CustomRarityRow[];
    items = (itm.data ?? []) as unknown as CustomItemRow[];
    for (const r of rarities) applyRarity(r);
    registerRuntimeItems(items.map(toCollectible));
    refreshBundlePools();
    emit();
  } catch {
    /* offline → nur eingebaute Inhalte */
  }
}
