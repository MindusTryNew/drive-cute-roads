// Sammelserien: eingebaute Serien + vom Admin erstellte Cloud-Serien.
import { BUILTIN_SERIES, type SeriesTier } from "./collectibles-themed";
import { EXTRA_SERIES } from "./collectibles-extra";
import { getCollection } from "./collection";
import { addCoins } from "./coins";
import { addPack } from "./inventory";
import { supabase } from "@/integrations/supabase/client";

export type Series = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  itemIds: string[];
  tiers: SeriesTier[];
  source: "builtin" | "cloud";
};

const CLAIM_KEY = "garage:seriesClaims";
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

const listeners = new Set<() => void>();
export function subscribeSeries(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
const emit = () => { for (const l of listeners) l(); };

let cloudCache: Series[] = [];

export function getSeries(): Series[] {
  const builtin: Series[] = [...BUILTIN_SERIES, ...EXTRA_SERIES].map((s) => ({ ...s, source: "builtin" as const }));
  return [...builtin, ...cloudCache];
}

/** Lädt Admin-Serien aus der Cloud (still bei Fehlern). */
export async function refreshCloudSeries(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("collection_series")
      .select("id, name, description, item_ids, tiers, active")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    cloudCache = (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      emoji: "🗂️",
      desc: r.description ?? "",
      itemIds: Array.isArray(r.item_ids) ? (r.item_ids as string[]) : [],
      tiers: Array.isArray(r.tiers) ? (r.tiers as unknown as SeriesTier[]) : [],
      source: "cloud" as const,
    }));
    emit();
  } catch {
    /* offline → nur eingebaute Serien */
  }
}

export type SeriesProgress = {
  owned: number;
  total: number;
  pct: number;
  nextTier: SeriesTier | null;
  claimable: SeriesTier[];
};

export function progressOf(s: Series): SeriesProgress {
  const counts = getCollection();
  const total = s.itemIds.length;
  const owned = s.itemIds.filter((id) => (counts[id] ?? 0) > 0).length;
  const pct = total === 0 ? 0 : Math.round((owned / total) * 100);
  const claimed = getClaims()[s.id] ?? [];
  const claimable = s.tiers.filter((t) => pct >= t.pct && !claimed.includes(t.pct));
  const nextTier = s.tiers.find((t) => pct < t.pct) ?? null;
  return { owned, total, pct, nextTier, claimable };
}

function getClaims(): Record<string, number[]> {
  try { return JSON.parse(safeLS()?.getItem(CLAIM_KEY) ?? "{}"); }
  catch { return {}; }
}

function setClaims(c: Record<string, number[]>) {
  safeLS()?.setItem(CLAIM_KEY, JSON.stringify(c));
  emit();
}

export function claimTier(s: Series, tier: SeriesTier): { ok: boolean; message: string } {
  const p = progressOf(s);
  if (p.pct < tier.pct) return { ok: false, message: `Erst ${tier.pct}% der Serie sammeln.` };
  const claims = getClaims();
  const list = claims[s.id] ?? [];
  if (list.includes(tier.pct)) return { ok: false, message: "Stufe bereits abgeholt." };

  addCoins(tier.coins);
  // Ab 75 % gibt es zusätzlich ein Paket.
  if (tier.pct >= 100) addPack("celestial");
  else if (tier.pct >= 75) addPack("ultra");
  else if (tier.pct >= 50) addPack("mythic");

  claims[s.id] = [...list, tier.pct];
  setClaims(claims);
  return { ok: true, message: `${tier.label} freigeschaltet: +🪙 ${tier.coins.toLocaleString()}` };
}
