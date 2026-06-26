import { CARS, type CarKey } from "@/components/CarSelect";
import {
  type CustomCar,
  type Tuning,
  type Appearance,
  type PartRef,
  defaultTuning,
  defaultAppearance,
} from "./garage";

export type CarSpec = {
  id: string;
  name: string;
  tuning: Tuning;
  appearance: Appearance;
  parts: PartRef[];
};

export function presetToSpec(key: CarKey): CarSpec {
  const c = CARS[key];
  const tuning = defaultTuning();
  const appearance = defaultAppearance();
  appearance.primaryColor = c.color;

  if (key === "racer") {
    tuning.time0to100 = 2.6; tuning.topSpeed = 340; tuning.brakeDist = 28;
    tuning.weight = 1100; tuning.grip = 88; tuning.steerAngle = 36;
    appearance.bodyType = "racer"; appearance.spoiler = true; appearance.spoilerHeight = 0.6;
  } else if (key === "suv") {
    tuning.time0to100 = 7.8; tuning.topSpeed = 200; tuning.brakeDist = 44;
    tuning.weight = 2200; tuning.grip = 80; tuning.steerAngle = 28;
    appearance.bodyType = "suv";
  } else {
    tuning.time0to100 = 4.2; tuning.topSpeed = 260; tuning.brakeDist = 34;
    tuning.weight = 1400; tuning.grip = 72;
    appearance.bodyType = "roadster";
  }
  return { id: `preset:${key}`, name: c.name, tuning, appearance, parts: [] };
}

export function customToSpec(car: CustomCar): CarSpec {
  let tuning: Tuning = { ...car.tuning, gearRatios: [...car.tuning.gearRatios] };
  let appearance: Appearance = { ...car.appearance };
  for (const mod of car.mods) {
    if (!mod.enabled) continue;
    if (mod.patches.tuning) {
      const tAny = tuning as unknown as Record<string, unknown>;
      for (const [k, v] of Object.entries(mod.patches.tuning)) {
        if (k in tAny && typeof tAny[k] === "number") tAny[k] = v;
      }
    }
    if (mod.patches.appearance) {
      for (const [k, v] of Object.entries(mod.patches.appearance)) {
        (appearance as Record<string, unknown>)[k] = v;
      }
    }
  }
  return {
    id: car.id, name: car.name, tuning, appearance,
    parts: car.parts.filter((p) => p.enabled),
  };
}

// No hard caps — but guard against NaN/Infinity and friction >= 1 (would never decelerate).
const safe = (v: number, def: number) => (Number.isFinite(v) && v > 0 ? v : def);

export function physicsFromTuning(t: Tuning) {
  const top = safe(t.topSpeed, 240);
  const t100 = safe(t.time0to100, 5);
  const grip = Math.max(0, t.grip);
  const steer = safe(t.steerAngle, 30);

  const maxSpeed = top / 380;
  const accel = maxSpeed / Math.max(0.1, t100 * 60) * 1.6;
  const friction = Math.min(0.999, 0.95 + Math.min(grip, 200) / 100 * 0.025);
  const turnSpeed = 0.004 + Math.min(steer, 180) / 45 * 0.012 + Math.min(grip, 200) / 100 * 0.004;
  return { maxSpeed, accel, friction, turnSpeed, reverseFactor: 0.5 };
}
