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
