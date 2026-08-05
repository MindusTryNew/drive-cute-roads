// Einmaliges Anniversary-Geschenk (2 Monate Drift Lab):
// 6 Autos, 20 Sammelitems, 40.000 Coins — mit robustem Claim + Reparatur.
import { saveCar, listCars } from "./garage";
import { addToCollection } from "./collection";
import { addCoins, getSlots, addSlot } from "./coins";
import { PRESETS_BY_KEY, presetToCustomCar } from "./preset-cars";

const CLAIMED_KEY = "garage:anniversaryGiftClaimed";
const LEGACY_KEY = "garage:farewellGiftClaimed";
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

export const ANNIVERSARY_PRESET_KEYS = [
  "farewell-aurora",
  "farewell-monolith",
  "farewell-vortex",
  "farewell-drift",
  "farewell-offroad",
  "farewell-beach",
];

export const ANNIVERSARY_ITEM_IDS = [
  "fw-thankyou", "fw-devteam", "fw-community", "fw-roadster", "fw-suv",
  "fw-racer", "fw-city", "fw-offroad", "fw-hills", "fw-valley",
  "fw-stunt", "fw-beach", "fw-coins", "fw-garage", "fw-market",
  "fw-mods", "fw-missions", "fw-prestige", "fw-daily", "fw-legends",
];

export const ANNIVERSARY_COIN_REWARD = 40000;

export type ClaimResult = {
  ok: boolean;
  cars: number;
  items: number;
  coins: number;
  errors: string[];
};

function anniversaryCarNames(): string[] {
  return ANNIVERSARY_PRESET_KEYS
    .map((k) => PRESETS_BY_KEY[k]?.name)
    .filter((n): n is string => Boolean(n));
}

export function hasClaimedAnniversaryGift(): boolean {
  try {
    const ls = safeLS();
    if (!ls) return true; // SSR: Button ausblenden, Client entscheidet neu
    if (ls.getItem(CLAIMED_KEY) === "1") return true;
    // Reparatur: altes Farewell-Flag zählt nur, wenn die Autos wirklich da sind.
    if (ls.getItem(LEGACY_KEY) === "1") {
      if (giftLooksDelivered()) {
        ls.setItem(CLAIMED_KEY, "1");
        return true;
      }
      // Fehlgeschlagener Claim → Geschenk wieder freigeben.
      ls.removeItem(LEGACY_KEY);
      return false;
    }
    return false;
  } catch {
    return false;
  }
}

/** Prüft, ob die Geschenk-Fahrzeuge tatsächlich in der Garage liegen. */
export function giftLooksDelivered(): boolean {
  try {
    const names = new Set(listCars().map((c) => c.name));
    const expected = anniversaryCarNames();
    if (!expected.length) return false;
    return expected.every((n) => names.has(n));
  } catch {
    return false;
  }
}

export function claimAnniversaryGift(): ClaimResult {
  const res: ClaimResult = { ok: false, cars: 0, items: 0, coins: 0, errors: [] };
  if (hasClaimedAnniversaryGift()) {
    res.errors.push("Geschenk wurde bereits eingelöst.");
    return res;
  }

  const existing = new Set(listCars().map((c) => c.name));

  for (const key of ANNIVERSARY_PRESET_KEYS) {
    try {
      const def = PRESETS_BY_KEY[key];
      if (!def) { res.errors.push(`Fahrzeug „${key}" nicht gefunden.`); continue; }
      if (existing.has(def.name)) { res.cars++; continue; }
      const car = presetToCustomCar(def);
      car.name = car.name.slice(0, 40);
      saveCar(car, false);
      res.cars++;
    } catch (e) {
      res.errors.push(`Fahrzeug „${key}": ${e instanceof Error ? e.message : "Fehler"}`);
    }
  }

  // Genug Garagenplätze gratis dazugeben, damit die Autos nutzbar bleiben.
  try {
    const needed = listCars().length;
    let guard = 0;
    while (getSlots() < needed && guard++ < 100) addSlot();
  } catch { /* nicht kritisch */ }

  for (const id of ANNIVERSARY_ITEM_IDS) {
    try {
      addToCollection(id, 1);
      res.items++;
    } catch (e) {
      res.errors.push(`Item „${id}": ${e instanceof Error ? e.message : "Fehler"}`);
    }
  }

  try {
    addCoins(ANNIVERSARY_COIN_REWARD);
    res.coins = ANNIVERSARY_COIN_REWARD;
  } catch (e) {
    res.errors.push(`Coins: ${e instanceof Error ? e.message : "Fehler"}`);
  }

  // Nur als eingelöst markieren, wenn Autos + Coins angekommen sind.
  res.ok = res.cars === ANNIVERSARY_PRESET_KEYS.length && res.coins > 0;
  if (res.ok) {
    safeLS()?.setItem(CLAIMED_KEY, "1");
    safeLS()?.setItem(LEGACY_KEY, "1");
  }
  return res;
}
