// Wunschliste: lokal gespeichert, optional in die Cloud gespiegelt,
// damit andere Spieler sehen, welche Items gesucht werden.
import { supabase } from "@/integrations/supabase/client";

const KEY = "garage:wishlist";
type Listener = (ids: string[]) => void;
const listeners = new Set<Listener>();
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

export function getWishlist(): string[] {
  try {
    const raw = safeLS()?.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}

function save(ids: string[]) {
  safeLS()?.setItem(KEY, JSON.stringify(ids));
  for (const l of listeners) l([...ids]);
  void pushToCloud(ids);
}

export function isWished(id: string): boolean {
  return getWishlist().includes(id);
}

export function toggleWish(id: string): boolean {
  const list = getWishlist();
  const idx = list.indexOf(id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(id);
  save(list);
  return idx < 0;
}

export function clearWishlist() {
  save([]);
}

export function subscribeWishlist(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

async function pushToCloud(ids: string[]) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    const nick = (user.email ?? "anon").split("@")[0].slice(0, 24);
    await supabase.from("wishlists").upsert({ user_id: user.id, nick, item_ids: ids });
  } catch { /* offline ist ok */ }
}

export type CloudWishlist = { user_id: string; nick: string; item_ids: string[] };

export async function fetchWishlists(): Promise<CloudWishlist[]> {
  const { data, error } = await supabase
    .from("wishlists")
    .select("user_id, nick, item_ids")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data.map((r) => ({
    user_id: r.user_id,
    nick: r.nick,
    item_ids: Array.isArray(r.item_ids) ? (r.item_ids as string[]) : [],
  }));
}

/** Lädt die eigene Wunschliste aus der Cloud in den lokalen Speicher. */
export async function pullFromCloud(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const { data: row } = await supabase
    .from("wishlists").select("item_ids").eq("user_id", data.user.id).maybeSingle();
  if (!row) return false;
  const ids = Array.isArray(row.item_ids) ? (row.item_ids as string[]) : [];
  safeLS()?.setItem(KEY, JSON.stringify(ids));
  for (const l of listeners) l([...ids]);
  return true;
}
