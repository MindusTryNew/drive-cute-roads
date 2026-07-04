// Local coin wallet — no auth, persists in localStorage. SSR-safe.
const KEY = "garage:coins";
const SLOTS_KEY = "garage:slots";
const STARTING_COINS = 500;
const STARTING_SLOTS = 1;

type Listener = (coins: number) => void;
const listeners = new Set<Listener>();
const safeLS = () => typeof localStorage !== "undefined" ? localStorage : null;

export function getCoins(): number {
  const ls = safeLS();
  if (!ls) return STARTING_COINS;
  const raw = ls.getItem(KEY);
  if (raw === null) {
    ls.setItem(KEY, String(STARTING_COINS));
    return STARTING_COINS;
  }
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : STARTING_COINS;
}

function setCoinsRaw(n: number) {
  safeLS()?.setItem(KEY, String(Math.max(0, Math.round(n))));
  for (const l of listeners) l(getCoins());
}

export function addCoins(amount: number) {
  setCoinsRaw(getCoins() + amount);
}

export function spendCoins(amount: number): boolean {
  const c = getCoins();
  if (c < amount) return false;
  setCoinsRaw(c - amount);
  return true;
}

/** Für Cloud-Sync — überschreibt lokalen Wert. */
export function setCoinsAbsolute(n: number) {
  setCoinsRaw(n);
}

export function subscribeCoins(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

// ---- garage slots ----
export function getSlots(): number {
  const ls = safeLS();
  if (!ls) return STARTING_SLOTS;
  const raw = ls.getItem(SLOTS_KEY);
  if (raw === null) {
    ls.setItem(SLOTS_KEY, String(STARTING_SLOTS));
    return STARTING_SLOTS;
  }
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : STARTING_SLOTS;
}

export function addSlot() {
  safeLS()?.setItem(SLOTS_KEY, String(getSlots() + 1));
}

export function nextSlotPrice(): number {
  const s = getSlots();
  if (s === 1) return 5000;
  if (s === 2) return 12000;
  return 12000 + (s - 2) * 8000;
}
