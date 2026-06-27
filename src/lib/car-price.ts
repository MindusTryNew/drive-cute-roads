import type { Tuning, Appearance } from "@/lib/garage";

// Coin cost to save/create a car. Heavier in features = more coins.
// No hard cap — absurd setups can easily cost 10k+ coins.
export function priceForCar(tuning: Tuning, appearance: Appearance): number {
  const topSpeedFactor = Math.max(0, tuning.topSpeed) / 10;
  const accelFactor = Math.max(0, 12 - Math.min(12, tuning.time0to100)) * 50;
  const gripFactor = Math.max(0, tuning.grip) * 3;
  const lightweight = Math.max(0, 2000 - Math.min(2000, tuning.weight)) * 0.05;
  const brakes = Math.max(0, 60 - Math.min(60, tuning.brakeDist)) * 4;
  const extras = (appearance.spoiler ? 100 : 0) + appearance.wheelSize * 4;
  const total = 200 + topSpeedFactor + accelFactor + gripFactor + lightweight + brakes + extras;
  return Math.round(total);
}
