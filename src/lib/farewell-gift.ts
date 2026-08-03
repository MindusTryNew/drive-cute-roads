// Einmaliges Farewell-Geschenk: 6 Autos, 20 Sammelitems, 40.000 Coins.
import { saveCar } from "./garage";
import { addToCollection } from "./collection";
import { addCoins } from "./coins";
import { PRESETS_BY_KEY, presetToCustomCar } from "./preset-cars";

const CLAIMED_KEY = "garage:farewellGiftClaimed";
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

export const FAREWELL_PRESET_KEYS = [
  "farewell-aurora",
  "farewell-monolith",
  "farewell-vortex",
  "farewell-drift",
  "farewell-offroad",
  "farewell-beach",
];

export const FAREWELL_ITEM_IDS = [
  "fw-thankyou",
  "fw-devteam",
  "fw-community",
  "fw-roadster",
  "fw-suv",
  "fw-racer",
  "fw-city",
  "fw-offroad",
  "fw-hills",
  "fw-valley",
  "fw-stunt",
  "fw-beach",
  "fw-coins",
  "fw-garage",
  "fw-market",
  "fw-mods",
  "fw-missions",
  "fw-prestige",
  "fw-daily",
  "fw-legends",
];

export const FAREWELL_COIN_REWARD = 40000;

export function hasClaimedFarewellGift(): boolean {
  try {
    return safeLS()?.getItem(CLAIMED_KEY) === "1";
  } catch { return false; }
}

export function claimFarewellGift(): { ok: boolean; reason?: string } {
  if (hasClaimedFarewellGift()) return { ok: false, reason: "Bereits eingelöst." };

  for (const key of FAREWELL_PRESET_KEYS) {
    const def = PRESETS_BY_KEY[key];
    if (def) saveCar(presetToCustomCar(def), false);
  }

  for (const id of FAREWELL_ITEM_IDS) {
    addToCollection(id, 1);
  }

  addCoins(FAREWELL_COIN_REWARD);
  safeLS()?.setItem(CLAIMED_KEY, "1");
  return { ok: true };
}
