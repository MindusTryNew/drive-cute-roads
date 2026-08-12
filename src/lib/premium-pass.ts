// Premium-Pass: wöchentliche Coin-Zahlung für dauerhafte Boni.
import { addCoins, spendCoins } from "./coins";
import { addPack } from "./inventory";

const PASS_KEY = "garage:premiumPass";
const BUNDLE_CLAIM_KEY = "garage:premiumBundleClaim";

export const WEEKLY_COST = 5000;
export const COIN_BOOST = 1.2;
export const XP_BOOST = 1.2;

export type PassState = {
  active: boolean;
  startedAt: number;
  paidUntil: number;
  weeklyCost: number;
};

const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

function now() { return Date.now(); }

function msInWeeks(weeks: number) { return weeks * 7 * 24 * 60 * 60 * 1000; }

/** Pass-Laufzeit um Tage verlängern (z. B. aus einem Admin-Bundle). */
export function grantPremiumDays(days: number) {
  const ls = safeLS();
  const n = now();
  let paidUntil = n;
  try {
    const raw = ls?.getItem(PASS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as PassState;
      if (p.paidUntil > n) paidUntil = p.paidUntil;
    }
  } catch { /* ignore */ }
  ls?.setItem(PASS_KEY, JSON.stringify({
    active: true,
    startedAt: n,
    paidUntil: paidUntil + days * 24 * 60 * 60 * 1000,
    weeklyCost: WEEKLY_COST,
  }));
}

export function getPassState(): PassState | null {
  try {
    const raw = safeLS()?.getItem(PASS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PassState;
    if (!p.active || p.paidUntil < now()) return null;
    return p;
  } catch { return null; }
}

export function isPremiumActive(): boolean {
  return getPassState() !== null;
}

export function premiumCoinMultiplier(): number {
  return isPremiumActive() ? COIN_BOOST : 1;
}

export function premiumXpMultiplier(): number {
  return isPremiumActive() ? XP_BOOST : 1;
}

/** Kauft oder verlängert den Pass um `weeks` Wochen. */
export function buyPremiumWeeks(weeks: number): { ok: boolean; reason?: string } {
  const cost = weeks * WEEKLY_COST;
  if (!spendCoins(cost)) return { ok: false, reason: `Nicht genug Coins (🪙 ${cost.toLocaleString()} nötig).` };

  const ls = safeLS();
  const current = getPassState();
  const baseStart = current ? current.startedAt : now();
  const basePaidUntil = current ? current.paidUntil : now();
  const next: PassState = {
    active: true,
    startedAt: baseStart,
    paidUntil: basePaidUntil + msInWeeks(weeks),
    weeklyCost: WEEKLY_COST,
  };
  ls?.setItem(PASS_KEY, JSON.stringify(next));
  return { ok: true };
}

export function formatRemaining(ms: number): string {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return `${days}d ${hours}h`;
}

export function getPaidUntil(): number | null {
  return getPassState()?.paidUntil ?? null;
}

/** Wann wurde das wöchentliche Bundle zuletzt beansprucht? */
export function getLastBundleClaim(): number {
  try {
    const raw = safeLS()?.getItem(BUNDLE_CLAIM_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

function startOfWeek(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

export function canClaimWeeklyBundle(): boolean {
  if (!isPremiumActive()) return false;
  return startOfWeek(now()) > getLastBundleClaim();
}

export function claimWeeklyBundle(): { ok: boolean; reason?: string } {
  if (!isPremiumActive()) return { ok: false, reason: "Premium-Pass nicht aktiv." };
  if (!canClaimWeeklyBundle()) return { ok: false, reason: "Diese Woche bereits beansprucht." };
  addPack("standard");
  safeLS()?.setItem(BUNDLE_CLAIM_KEY, String(startOfWeek(now())));
  return { ok: true };
}

/** Debug / DevMode: Pass gratis aktivieren. */
export function activatePremiumDebug(weeks = 1) {
  const ls = safeLS();
  const n = now();
  ls?.setItem(PASS_KEY, JSON.stringify({ active: true, startedAt: n, paidUntil: n + msInWeeks(weeks), weeklyCost: WEEKLY_COST }));
}
