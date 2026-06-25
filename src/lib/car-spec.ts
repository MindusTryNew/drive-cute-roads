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

// Convert a built-in preset to a CarSpec (so the Simulator only deals with one shape).
export function presetToSpec(key: CarKey): CarSpec {
  const c = CARS[key];
  const tuning = defaultTuning();
  const appearance = defaultAppearance();
  appearance.primaryColor = c.color;

  if (key === "racer") {
    tuning.time0to100 = 2.6;
    tuning.topSpeed = 340;
    tuning.brakeDist = 28;
    tuning.weight = 1100;
    tuning.grip = 88;
    tuning.steerAngle = 36;
    appearance.bodyType = "racer";
    appearance.spoiler = true;
    appearance.spoilerHeight = 0.6;
  } else if (key === "suv") {
    tuning.time0to100 = 7.8;
    tuning.topSpeed = 200;
    tuning.brakeDist = 44;
    tuning.weight = 2200;
    tuning.grip = 80;
    tuning.steerAngle = 28;
    appearance.bodyType = "suv";
  } else {
    tuning.time0to100 = 4.2;
    tuning.topSpeed = 260;
    tuning.brakeDist = 34;
    tuning.weight = 1400;
    tuning.grip = 72;
    appearance.bodyType = "roadster";
  }

  return {
    id: `preset:${key}`,
    name: c.name,
    tuning,
    appearance,
    parts: [],
  };
}

export function customToSpec(car: CustomCar): CarSpec {
  // Apply enabled mods on top of base tuning/appearance.
  let tuning: Tuning = { ...car.tuning, gearRatios: [...car.tuning.gearRatios] };
  let appearance: Appearance = { ...car.appearance };
  for (const mod of car.mods) {
    if (!mod.enabled) continue;
    if (mod.patches.tuning) {
      for (const [k, v] of Object.entries(mod.patches.tuning)) {
        if (k in tuning && typeof (tuning as Record<string, unknown>)[k] === "number") {
          (tuning as Record<string, number>)[k] = v;
        }
      }
    }
    if (mod.patches.appearance) {
      for (const [k, v] of Object.entries(mod.patches.appearance)) {
        (appearance as Record<string, unknown>)[k] = v;
      }
    }
  }
  return {
    id: car.id,
    name: car.name,
    tuning,
    appearance,
    parts: car.parts.filter((p) => p.enabled),
  };
}

// Convert tuning into runtime physics constants used by the Simulator.
export function physicsFromTuning(t: Tuning) {
  const maxSpeed = t.topSpeed / 380;                                  // velocity units
  const accel = maxSpeed / Math.max(1, t.time0to100 * 60) * 1.6;       // ~time-to-100 feel
  const friction = 0.97 + (t.grip / 100) * 0.025;
  const turnSpeed = 0.006 + (t.steerAngle / 45) * 0.012 + (t.grip / 100) * 0.004;
  const reverseFactor = 0.5;
  return { maxSpeed, accel, friction, turnSpeed, reverseFactor };
}
