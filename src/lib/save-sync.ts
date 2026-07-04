// Cloud-Sync für Spielstand — verpackt localStorage-Werte in ein JSON-Blob.
import { supabase } from "@/integrations/supabase/client";
import { getCoins, setCoinsAbsolute } from "./coins";
import { getCollection, replaceCollection } from "./collection";
import { getInventory } from "./inventory";
import { PACK_TYPES, type PackType } from "./collectibles";

const LS_KEYS_TO_SYNC = [
  "garage:coins",
  "garage:slots",
  "garage:collection",
  "garage:inventory",
  "garage:doneMissions",
  "garage:totalDriveSec",
  "garage:activeMission",
  "garage:effectCooldowns",
  "garage:devMode",
  "garage:redeemedCodes",
  "garage:cars",
];

type Snapshot = {
  version: 2;
  savedAt: string;
  coins: number;
  collection: Record<string, number>;
  inventory: PackType[];
  raw: Record<string, string>;
};

function collectSnapshot(): Snapshot {
  const raw: Record<string, string> = {};
  if (typeof localStorage !== "undefined") {
    for (const k of LS_KEYS_TO_SYNC) {
      const v = localStorage.getItem(k);
      if (v !== null) raw[k] = v;
    }
  }
  return {
    version: 2,
    savedAt: new Date().toISOString(),
    coins: getCoins(),
    collection: getCollection(),
    inventory: getInventory(),
    raw,
  };
}

function applySnapshot(snap: Snapshot) {
  if (typeof localStorage !== "undefined" && snap.raw) {
    for (const [k, v] of Object.entries(snap.raw)) {
      try { localStorage.setItem(k, v); } catch { /* ignore */ }
    }
  }
  if (typeof snap.coins === "number") setCoinsAbsolute(snap.coins);
  if (snap.collection && typeof snap.collection === "object") replaceCollection(snap.collection);
  // Inventory wird über raw geladen und benötigt ein Reload für Subscribers — signalisieren wir mit einem Event.
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cloud-sync-applied"));
}

export async function syncUp(): Promise<{ ok: boolean; error?: string }> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) return { ok: false, error: "Nicht eingeloggt." };
  const snap = collectSnapshot();
  const { error } = await supabase
    .from("save_states")
    .upsert({ user_id: uid, data: JSON.parse(JSON.stringify(snap)) }, { onConflict: "user_id" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function syncDown(): Promise<{ ok: boolean; error?: string; empty?: boolean }> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) return { ok: false, error: "Nicht eingeloggt." };
  const { data, error } = await supabase
    .from("save_states")
    .select("data")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: true, empty: true };
  const snap = data.data as unknown as Snapshot;
  if (!snap || typeof snap !== "object") return { ok: false, error: "Ungültiger Spielstand." };
  // Filter Inventory-Keys für Sicherheit
  if (Array.isArray(snap.inventory)) {
    snap.inventory = snap.inventory.filter((p) => (PACK_TYPES as string[]).includes(p as string)) as PackType[];
  }
  applySnapshot(snap);
  return { ok: true };
}
