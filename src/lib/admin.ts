// Admin-System (ersetzt den alten DevMode). Freischaltung per Code.
import { supabase } from "@/integrations/supabase/client";

export const ADMIN_CODE = "DLA2026QXE";
const KEY = "garage:admin";
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

type Listener = (on: boolean) => void;
const listeners = new Set<Listener>();

export function isAdmin(): boolean {
  return safeLS()?.getItem(KEY) === "1";
}

function setAdmin(on: boolean) {
  const ls = safeLS();
  if (!ls) return;
  if (on) ls.setItem(KEY, "1");
  else ls.removeItem(KEY);
  for (const l of listeners) l(on);
}

export function subscribeAdmin(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function revokeAdmin() {
  setAdmin(false);
}

/** Prüft den Code, schaltet lokal frei und verknüpft — falls angemeldet —
 *  das Konto dauerhaft mit Admin-Rechten (für Cloud-Inhalte). */
export async function unlockAdmin(input: string): Promise<{ ok: boolean; message: string }> {
  const code = input.trim().toUpperCase();
  if (code !== ADMIN_CODE) return { ok: false, message: "Ungültiger Admin-Code." };
  setAdmin(true);

  try {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (uid) {
      await supabase.from("admin_users").upsert({ user_id: uid }, { onConflict: "user_id" });
      return { ok: true, message: "Admin freigeschaltet — Cloud-Inhalte aktiv." };
    }
  } catch { /* offline / nicht angemeldet */ }

  return { ok: true, message: "Admin lokal freigeschaltet. Für Cloud-Inhalte bitte anmelden." };
}

/* ------------------------- Cloud-CRUD -------------------------- */

export type CloudMissionRow = {
  id: string;
  title: string;
  description: string;
  goal: { kind: string; value: number };
  reward: { coins: number; pack?: string };
  active: boolean;
};

export async function listCloudMissions(): Promise<CloudMissionRow[]> {
  const { data, error } = await supabase
    .from("custom_missions")
    .select("id, title, description, goal, reward, active")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as CloudMissionRow[];
}

export async function createCloudMission(m: {
  title: string; description: string; goalKind: string; goalValue: number; coins: number; pack?: string;
}): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("Bitte zuerst mit dem Konto anmelden.");
  const { error } = await supabase.from("custom_missions").insert({
    author_id: uid,
    title: m.title,
    description: m.description,
    goal: { kind: m.goalKind, value: m.goalValue },
    reward: m.pack ? { coins: m.coins, pack: m.pack } : { coins: m.coins },
    active: true,
  });
  if (error) throw error;
}

export async function setMissionActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("custom_missions").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteCloudMission(id: string): Promise<void> {
  const { error } = await supabase.from("custom_missions").delete().eq("id", id);
  if (error) throw error;
}

export type CloudSeriesRow = {
  id: string;
  name: string;
  description: string;
  item_ids: string[];
  tiers: { pct: number; coins: number; label: string }[];
  active: boolean;
};

export async function listCloudSeriesAdmin(): Promise<CloudSeriesRow[]> {
  const { data, error } = await supabase
    .from("collection_series")
    .select("id, name, description, item_ids, tiers, active")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as CloudSeriesRow[];
}

export async function createCloudSeries(s: {
  name: string; description: string; itemIds: string[];
  tiers: { pct: number; coins: number; label: string }[];
}): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("Bitte zuerst mit dem Konto anmelden.");
  const { error } = await supabase.from("collection_series").insert({
    author_id: uid,
    name: s.name,
    description: s.description,
    item_ids: s.itemIds,
    tiers: s.tiers,
    active: true,
  });
  if (error) throw error;
}

export async function setSeriesActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("collection_series").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteCloudSeries(id: string): Promise<void> {
  const { error } = await supabase.from("collection_series").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------- Seltenheiten (Admin) --------------------- */

async function requireUid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("Bitte zuerst mit dem Konto anmelden.");
  return uid;
}

export type RarityRow = {
  id: string;
  key: string;
  label: string;
  color: string;
  emoji: string;
  cooldown_sec: number;
  ladder_rank: number;
  price: number;
  pack_weights: Record<string, number>;
  active: boolean;
};

export async function listRarities(): Promise<RarityRow[]> {
  const { data, error } = await supabase
    .from("custom_rarities")
    .select("id, key, label, color, emoji, cooldown_sec, ladder_rank, price, pack_weights, active")
    .order("ladder_rank", { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as RarityRow[];
}

export async function createRarity(r: Omit<RarityRow, "id" | "active">): Promise<void> {
  const uid = await requireUid();
  const { error } = await supabase.from("custom_rarities").insert({ ...r, pack_weights: r.pack_weights as never, author_id: uid, active: true });
  if (error) throw error;
}

export async function setRarityActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("custom_rarities").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteRarity(id: string): Promise<void> {
  const { error } = await supabase.from("custom_rarities").delete().eq("id", id);
  if (error) throw error;
}

/* --------------------- Sammelitems (Admin) --------------------- */

export type ItemRow = {
  id: string;
  item_key: string;
  name: string;
  emoji: string;
  description: string;
  rarity_key: string;
  effect: Record<string, unknown>;
  series_key: string | null;
  active: boolean;
};

export type NewItem = Omit<ItemRow, "id" | "active">;

export async function listCustomItems(): Promise<ItemRow[]> {
  const { data, error } = await supabase
    .from("custom_collectibles")
    .select("id, item_key, name, emoji, description, rarity_key, effect, series_key, active")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as ItemRow[];
}

export async function createCustomItems(items: NewItem[]): Promise<void> {
  const uid = await requireUid();
  const rows = items.map((i) => ({ ...i, effect: i.effect as never, author_id: uid, active: true }));
  const { error } = await supabase.from("custom_collectibles").insert(rows);
  if (error) throw error;
}

export async function deleteCustomItem(id: string): Promise<void> {
  const { error } = await supabase.from("custom_collectibles").delete().eq("id", id);
  if (error) throw error;
}

/* ----------------------- Bundles (Admin) ----------------------- */

export type BundleRow = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  contents: Record<string, unknown>;
  price: number;
  starts_at: string | null;
  ends_at: string | null;
  once_per_player: boolean;
  active: boolean;
};

export async function listAdminBundles(): Promise<BundleRow[]> {
  const { data, error } = await supabase
    .from("custom_bundles")
    .select("id, title, description, emoji, contents, price, starts_at, ends_at, once_per_player, active")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as BundleRow[];
}

export async function createAdminBundle(b: Omit<BundleRow, "id" | "active">): Promise<void> {
  const uid = await requireUid();
  const { error } = await supabase.from("custom_bundles").insert({ ...b, contents: b.contents as never, author_id: uid, active: true });
  if (error) throw error;
}

export async function setBundleActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("custom_bundles").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteAdminBundle(id: string): Promise<void> {
  const { error } = await supabase.from("custom_bundles").delete().eq("id", id);
  if (error) throw error;
}
