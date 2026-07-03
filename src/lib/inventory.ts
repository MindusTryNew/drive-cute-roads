// Paket-Inventar (localStorage). Speichert nur die Pakettypen als String-Array.
import type { PackType } from "./collectibles";

const KEY = "garage:inventory";
type Listener = (packs: PackType[]) => void;
const listeners = new Set<Listener>();

export function getInventory(): PackType[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is PackType =>
      x === "starter" || x === "standard" || x === "deluxe" || x === "mythic"
    ) : [];
  } catch {
    return [];
  }
}

function save(list: PackType[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  for (const l of listeners) l([...list]);
}

export function addPack(p: PackType) {
  const list = getInventory();
  list.push(p);
  save(list);
}

/** Entfernt genau eine Instanz des Typs (für „Öffnen"). */
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
  return () => listeners.delete(cb);
}
