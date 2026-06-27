// Local coin wallet — no auth, persists in localStorage.
const KEY = "garage:coins";
const SLOTS_KEY = "garage:slots";
const STARTING_COINS = 500;
const STARTING_SLOTS = 1;

type Listener = (coins: number) => void;
const listeners = new Set<Listener>();

export function getCoins(): number {
  const raw = localStorage.getItem(KEY);
  if (raw === null) {
    localStorage.setItem(KEY, String(STARTING_COINS));
    return STARTING_COINS;
  }
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : STARTING_COINS;
}

function setCoins(n: number) {
  localStorage.setItem(KEY, String(Math.max(0, Math.round(n))));
  for (const l of listeners) l(getCoins());
}

export function addCoins(amount: number) {
  setCoins(getCoins() + amount);
}

export function spendCoins(amount: number): boolean {
  const c = getCoins();
  if (c < amount) return false;
  setCoins(c - amount);
  return true;
}

export function subscribeCoins(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ---- garage slots ----
export function getSlots(): number {
  const raw = localStorage.getItem(SLOTS_KEY);
  if (raw === null) {
    localStorage.setItem(SLOTS_KEY, String(STARTING_SLOTS));
    return STARTING_SLOTS;
  }
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : STARTING_SLOTS;
}

export function addSlot() {
  localStorage.setItem(SLOTS_KEY, String(getSlots() + 1));
}

export function nextSlotPrice(): number {
  const s = getSlots();
  // Slot 2 = 5000, Slot 3 = 12000, Slot 4 = 20000, Slot 5+ progressively
  if (s === 1) return 5000;
  if (s === 2) return 12000;
  return 12000 + (s - 2) * 8000;
}
