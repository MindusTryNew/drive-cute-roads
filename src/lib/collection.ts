// Gefundene Sammelitems (Katalog). Speichert Item-ID → Anzahl.
const KEY = "garage:collection";
type Counts = Record<string, number>;
type Listener = (counts: Counts) => void;
const listeners = new Set<Listener>();
const safeLS = () => typeof localStorage !== "undefined" ? localStorage : null;

export function getCollection(): Counts {
  try {
    const raw = safeLS()?.getItem(KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return typeof obj === "object" && obj ? obj : {};
  } catch {
    return {};
  }
}

function save(c: Counts) {
  safeLS()?.setItem(KEY, JSON.stringify(c));
  for (const l of listeners) l({ ...c });
}

export function addToCollection(id: string, n = 1) {
  const c = getCollection();
  const wasNew = !c[id];
  c[id] = (c[id] ?? 0) + n;
  save(c);
  if (n > 0) {
    // XP: neues Item = 40 XP, Duplikat = 8 XP
    import("./prestige").then(({ awardXp }) => awardXp(wasNew ? 40 : 8 * n));
  }
}

/** Ersetzt die komplette Collection (für Cloud-Sync). */
export function replaceCollection(c: Counts) {
  save({ ...c });
}

export function has(id: string): boolean {
  return (getCollection()[id] ?? 0) > 0;
}

export function uniqueCount(): number {
  return Object.keys(getCollection()).length;
}

export function subscribeCollection(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
