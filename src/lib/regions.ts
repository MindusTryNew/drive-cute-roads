// 6 Regionen der erweiterten Welt. Freischaltbar mit Coins.
export type RegionId = "stadt" | "offroad" | "huegel" | "taeler" | "stunt" | "strand";

export type Region = {
  id: RegionId;
  name: string;
  emoji: string;
  desc: string;
  price: number;
  // Achsen-parallele Bounds im Welt-Raum.
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  spawn: { x: number; z: number };
  color: string;
};

// Weltgröße = 1800, halb = 900. Zentrum (Stadt) ± 300.
export const REGIONS: Region[] = [
  {
    id: "stadt", name: "Stadt", emoji: "🏙️",
    desc: "Wolkenkratzer, Rennring & Straßennetz. Freigeschaltet.",
    price: 0,
    bounds: { minX: -300, maxX: 300, minZ: -300, maxZ: 300 },
    spawn: { x: 80, z: 0 }, color: "#5b8def",
  },
  {
    id: "offroad", name: "Offroad", emoji: "🌲",
    desc: "Wald & Hügel im Nordosten mit Bäumen und Steinen.",
    price: 3000,
    bounds: { minX: 300, maxX: 900, minZ: -900, maxZ: -300 },
    spawn: { x: 550, z: -550 }, color: "#4ade80",
  },
  {
    id: "huegel", name: "Hügelland", emoji: "⛰️",
    desc: "Sanfte, weitläufige Wellen im Nordwesten mit Serpentinen.",
    price: 6000,
    bounds: { minX: -900, maxX: -300, minZ: -900, maxZ: -300 },
    spawn: { x: -550, z: -550 }, color: "#c084fc",
  },
  {
    id: "taeler", name: "Täler", emoji: "🏞️",
    desc: "Tiefe Senken, Fluss und Brücken im Südwesten.",
    price: 10000,
    bounds: { minX: -900, maxX: -300, minZ: 300, maxZ: 900 },
    spawn: { x: -550, z: 550 }, color: "#22d3ee",
  },
  {
    id: "stunt", name: "Stunt-Park", emoji: "🎢",
    desc: "Rampen, Loops, Halfpipes im Südosten — für Adrenalin.",
    price: 15000,
    bounds: { minX: 300, maxX: 900, minZ: 300, maxZ: 900 },
    spawn: { x: 550, z: 550 }, color: "#f6d96a",
  },
  {
    id: "strand", name: "Strand", emoji: "🏖️",
    desc: "Sanddünen und Meer im Süden — flach und schnell.",
    price: 20000,
    bounds: { minX: -300, maxX: 300, minZ: 300, maxZ: 900 },
    spawn: { x: 0, z: 550 }, color: "#fda4af",
  },
];

export const REGIONS_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r])) as Record<RegionId, Region>;

const KEY = "garage:unlockedRegions";
const DEFAULTS: RegionId[] = ["stadt"];
type Listener = (ids: RegionId[]) => void;
const listeners = new Set<Listener>();
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

export function getUnlocked(): RegionId[] {
  const ls = safeLS();
  if (!ls) return DEFAULTS;
  try {
    const raw = ls.getItem(KEY);
    if (!raw) return DEFAULTS;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return DEFAULTS;
    const ok = arr.filter((x): x is RegionId => REGIONS.some((r) => r.id === x));
    if (!ok.includes("stadt")) ok.push("stadt");
    return ok;
  } catch {
    return DEFAULTS;
  }
}

export function isUnlocked(id: RegionId): boolean {
  return getUnlocked().includes(id);
}

export function unlockRegion(id: RegionId) {
  const cur = getUnlocked();
  if (cur.includes(id)) return;
  cur.push(id);
  safeLS()?.setItem(KEY, JSON.stringify(cur));
  for (const l of listeners) l([...cur]);
}

export function subscribeRegions(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Region an einer Weltposition (oder null wenn Übergangs-/Straßenzone). */
export function regionAt(x: number, z: number): RegionId | null {
  for (const r of REGIONS) {
    if (x >= r.bounds.minX && x <= r.bounds.maxX && z >= r.bounds.minZ && z <= r.bounds.maxZ) return r.id;
  }
  return null;
}

const ACTIVE_KEY = "garage:activeRegion";
export function getActiveRegion(): RegionId {
  const ls = safeLS();
  const v = ls?.getItem(ACTIVE_KEY);
  if (v && REGIONS.some((r) => r.id === v)) return v as RegionId;
  return "stadt";
}
export function setActiveRegion(id: RegionId) {
  safeLS()?.setItem(ACTIVE_KEY, id);
}
