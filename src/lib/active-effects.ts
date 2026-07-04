// Aktive temporäre Effekte + Cooldowns für Katalog-Aktivierung.
import { COLLECTIBLES_BY_ID, RARITY_COOLDOWN_SEC, type Rarity } from "./collectibles";

type Stat = "accel" | "topSpeed" | "grip" | "brake";

export type ActiveEffect = {
  itemId: string;
  stat: Stat;
  pct: number;
  endsAt: number; // ms epoch
};

const ACTIVE_KEY = "garage:activeEffects";
const CD_KEY = "garage:effectCooldowns"; // itemId → endsAt

type ActiveList = ActiveEffect[];
type Cooldowns = Record<string, number>;
type Listener = () => void;
const listeners = new Set<Listener>();

const safeLS = () => typeof localStorage !== "undefined" ? localStorage : null;

function loadActive(): ActiveList {
  try {
    const raw = safeLS()?.getItem(ACTIVE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((e) => e && typeof e.endsAt === "number") : [];
  } catch { return []; }
}
function loadCd(): Cooldowns {
  try {
    const raw = safeLS()?.getItem(CD_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return typeof o === "object" && o ? o : {};
  } catch { return {}; }
}
function saveActive(l: ActiveList) { safeLS()?.setItem(ACTIVE_KEY, JSON.stringify(l)); }
function saveCd(c: Cooldowns) { safeLS()?.setItem(CD_KEY, JSON.stringify(c)); }
function emit() { for (const l of listeners) l(); }

/** Filtert abgelaufene Einträge automatisch weg. */
export function getActiveEffects(): ActiveEffect[] {
  const now = Date.now();
  const list = loadActive().filter((e) => e.endsAt > now);
  if (list.length !== loadActive().length) saveActive(list);
  return list;
}

export function getCooldowns(): Cooldowns {
  const now = Date.now();
  const cd = loadCd();
  let dirty = false;
  for (const k of Object.keys(cd)) {
    if (cd[k] <= now) { delete cd[k]; dirty = true; }
  }
  if (dirty) saveCd(cd);
  return cd;
}

export function cooldownRemaining(itemId: string): number {
  const cd = getCooldowns();
  const e = cd[itemId];
  return e ? Math.max(0, e - Date.now()) : 0;
}

/** Aktiviert ein Item, wenn Cooldown vorbei ist und Effekt-Typ passt (temp). */
export function activateItem(itemId: string): { ok: boolean; message: string } {
  const item = COLLECTIBLES_BY_ID[itemId];
  if (!item) return { ok: false, message: "Unbekanntes Item." };
  if (!item.effect || item.effect.kind !== "temp") return { ok: false, message: "Dieses Item ist nicht aktivierbar." };
  const remaining = cooldownRemaining(itemId);
  if (remaining > 0) return { ok: false, message: `Cooldown: ${Math.ceil(remaining / 1000)} s übrig.` };

  const endsAt = Date.now() + item.effect.seconds * 1000;
  const list = getActiveEffects();
  list.push({ itemId, stat: item.effect.stat, pct: item.effect.pct, endsAt });
  saveActive(list);

  const cdSec = RARITY_COOLDOWN_SEC[item.rarity as Rarity];
  const cd = getCooldowns();
  cd[itemId] = Date.now() + cdSec * 1000;
  saveCd(cd);

  emit();
  return { ok: true, message: `${item.name} aktiviert!` };
}

/** Aggregierte Temp-Bonus-Stats (%). */
export function getTempBonuses(): { accel: number; topSpeed: number; grip: number; brake: number } {
  const b = { accel: 0, topSpeed: 0, grip: 0, brake: 0 };
  for (const e of getActiveEffects()) b[e.stat] += e.pct;
  return b;
}

export function subscribeActiveEffects(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

// Tick-Emitter: benachrichtige Abonnenten alle 1 s, damit Cooldowns/Timer aktuell bleiben.
if (typeof window !== "undefined") {
  setInterval(() => emit(), 1000);
}
