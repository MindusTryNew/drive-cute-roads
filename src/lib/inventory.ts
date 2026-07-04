// Paket-Inventar (localStorage). Speichert nur die Pakettypen als String-Array.
import { PACK_TYPES, type PackType } from "./collectibles";

const KEY = "garage:inventory";
type Listener = (packs: PackType[]) => void;
const listeners = new Set<Listener>();

const safeLS = () => typeof localStorage !== "undefined" ? localStorage : null;
const isPack = (x: unknown): x is PackType => typeof x === "string" && (PACK_TYPES as string[]).includes(x);

export function getInventory(): PackType[] {
  try {
    const raw = safeLS()?.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(isPack) : [];
  } catch {
    return [];
  }
}

function save(list: PackType[]) {
  safeLS()?.setItem(KEY, JSON.stringify(list));
  for (const l of listeners) l([...list]);
}

export function addPack(p: PackType) {
  const list = getInventory();
  list.push(p);
  save(list);
}

export function consumePack(p: PackType): boolean {
  const list = getInventory();
  const i = list.indexOf(p);
  if (i < 0) return false;
  list.splice(i, 1);
  save(list);
  return true;
}

export function subscribeInventory(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
