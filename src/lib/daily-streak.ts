// Daily-Login-Streak. Belohnungen wachsen mit der Serie, Loop bei Tag 30.
import { addCoins } from "./coins";
import type { PackType } from "./collectibles";
import { addPack } from "./inventory";
import { addToCollection } from "./collection";
import { PRESETS } from "./preset-cars";
import { presetToCustomCar } from "./preset-cars";
import { saveCar } from "./garage";
import { awardXp } from "./prestige";

const LAST_KEY = "garage:daily:last";
const STREAK_KEY = "garage:daily:streak";
const SHIELD_KEY = "garage:daily:shield";

const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

export type DailyReward =
  | { kind: "coins"; amount: number; label: string }
  | { kind: "pack"; packId: PackType; label: string }
  | { kind: "car"; presetKey: string; label: string };

function todayKey(): string { return new Date().toISOString().slice(0, 10); }
function daysBetween(a: string, b: string): number {
  const A = new Date(a + "T00:00:00").getTime();
  const B = new Date(b + "T00:00:00").getTime();
  return Math.round((B - A) / 86400000);
}

/** Belohnung für Tag N (1..30, danach loop). */
export function rewardForDay(day: number): DailyReward {
  const d = ((day - 1) % 30) + 1;
  if (d === 7)  return { kind: "pack", packId: "standard", label: "🎁 Standard-Bundle" };
  if (d === 14) return { kind: "pack", packId: "deluxe",   label: "🎁 Deluxe-Bundle" };
  if (d === 21) return { kind: "pack", packId: "mythic",   label: "🎁 Mythic-Bundle" };
  if (d === 30) {
    const pool = PRESETS.filter((p) => p.rarity === "legendary" || p.rarity === "epic");
    const idx = day % pool.length;
    return { kind: "car", presetKey: pool[idx].key, label: `🏆 ${pool[idx].name}` };
  }
  const table = [500, 1000, 2000, 3000, 5000, 8000];
  const base = table[Math.min(d - 1, 5)] ?? 1000 + d * 300;
  return { kind: "coins", amount: base, label: `🪙 ${base.toLocaleString()}` };
}

export type ClaimState = {
  streak: number;
  canClaim: boolean;
  claimedToday: boolean;
  broken: boolean;
  hasShield: boolean;
  nextDay: number;
};

export function readState(): ClaimState {
  const ls = safeLS();
  const last = ls?.getItem(LAST_KEY) ?? "";
  const streak = parseInt(ls?.getItem(STREAK_KEY) ?? "0", 10) || 0;
  const shield = ls?.getItem(SHIELD_KEY) === "1";
  const today = todayKey();
  if (!last) return { streak: 0, canClaim: true, claimedToday: false, broken: false, hasShield: shield, nextDay: 1 };
  const gap = daysBetween(last, today);
  if (gap === 0) return { streak, canClaim: false, claimedToday: true, broken: false, hasShield: shield, nextDay: streak };
  if (gap === 1) return { streak, canClaim: true, claimedToday: false, broken: false, hasShield: shield, nextDay: streak + 1 };
  // gap >= 2 → broken (Shield rettet einmalig)
  if (shield && gap === 2) {
    return { streak, canClaim: true, claimedToday: false, broken: false, hasShield: true, nextDay: streak + 1 };
  }
  return { streak: 0, canClaim: true, claimedToday: false, broken: true, hasShield: shield, nextDay: 1 };
}

/** Fordert die heutige Belohnung an. Gibt Belohnung + neuen Streak zurück. */
export function claim(): { reward: DailyReward; day: number } | null {
  const s = readState();
  if (!s.canClaim) return null;
  const ls = safeLS();
  const today = todayKey();
  const day = s.nextDay;

  // Shield konsumieren falls Rettung
  const last = ls?.getItem(LAST_KEY) ?? "";
  if (last && daysBetween(last, today) === 2 && s.hasShield) {
    ls?.removeItem(SHIELD_KEY);
  }

  ls?.setItem(LAST_KEY, today);
  ls?.setItem(STREAK_KEY, String(day));

  // Shield vergeben bei Tag 10 (einmalig pro Zyklus)
  if (day === 10) ls?.setItem(SHIELD_KEY, "1");

  const reward = rewardForDay(day);
  switch (reward.kind) {
    case "coins": addCoins(reward.amount); break;
    case "pack":  addPack(reward.packId); break;
    case "car": {
      const preset = PRESETS.find((p) => p.key === reward.presetKey);
      if (preset) {
        try { saveCar(presetToCustomCar(preset), false); }
        catch { addCoins(30000); /* Slot voll → Ersatz-Coins */ }
      }
      break;
    }
  }
  // Bonus: Item + XP proportional zum Tag
  addToCollection("common-1", 0); // no-op safe
  awardXp(100 + day * 10);

  return { reward, day };
}
