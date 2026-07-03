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

const safe = (v: number, def: number) => (Number.isFinite(v) && v > 0 ? v : def);

export function physicsFromTuning(t: Tuning) {
  // Permanente Boni aus gefundenen Sammelitems einrechnen (mult. Modifier).
  // Lazy import verhindert Zirkelabhängigkeit + SSR.
  let bonus = { accel: 0, topSpeed: 0, grip: 0, brake: 0 };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./perm-bonuses") as typeof import("./perm-bonuses");
    bonus = mod.getPermBonuses();
  } catch { /* ok during SSR */ }

  const top = safe(t.topSpeed, 240) * (1 + bonus.topSpeed / 100);
  const t100 = safe(t.time0to100, 5) / (1 + bonus.accel / 100);
  const grip = Math.max(0, t.grip) * (1 + bonus.grip / 100);
  const steer = safe(t.steerAngle, 30);

  const maxSpeed = top / 380; // Welt-Einheiten pro Frame
  // --- Drag-Modell: v_next = v·(1−drag) + accel·throttle
  //     Steady-State bei throttle=1: v = accel / drag = maxSpeed → accel = drag·maxSpeed.
  //     Kalibrierung: erreiche 100 km/h in t100 Sekunden (bei 60 FPS).
  const framesTo100 = Math.max(1, t100 * 60);
  const ratio100 = Math.min(0.98, Math.max(0.05, 100 / top));
  const drag = 1 - Math.pow(1 - ratio100, 1 / framesTo100);
  const accel = drag * maxSpeed;

  // Lenkrate (basisrate — Sim dämpft geschwindigkeitsabhängig)
  const turnSpeed = 0.0032 + Math.min(steer, 180) / 45 * 0.010 + Math.min(grip, 200) / 100 * 0.0025;

  // Bremse: Basis 0.08 pro Frame · Bremse-Modifier durch Grip + brake-Bonus.
  const brakeBonus = 1 + bonus.brake / 100;

  return { maxSpeed, accel, drag, turnSpeed, reverseFactor: 0.4, brakeBonus };
}


/** Berechnet die km/h-Schaltschwellen für jeden Gang.
 *  Garantien:
 *   1. streng monoton steigend (min. +15 km/h Spreizung)
 *   2. letzter Eintrag = topSpeed
 *   3. keine NaN/Infinity
 */
export function shiftSpeeds(t: Tuning): number[] {
  const top = safe(t.topSpeed, 240);
  const raw = t.gearRatios.slice(0, t.gears).filter((r) => Number.isFinite(r) && r > 0);
  if (raw.length === 0) return [Math.round(top)];

  // Sortiere Ratios absteigend (G1 = höchste = niedrigste Endgeschw.)
  const sorted = [...raw].sort((a, b) => b - a);
  const minRatio = sorted[sorted.length - 1];
  const base = sorted.map((r) => top * (minRatio / Math.max(0.001, r)));

  // Mindest-Spreizung erzwingen (verhindert doppelte / eng liegende Schwellen).
  const MIN_STEP = 15;
  for (let i = 1; i < base.length; i++) {
    if (base[i] < base[i - 1] + MIN_STEP) base[i] = base[i - 1] + MIN_STEP;
  }
  // Letzter Gang MUSS Top-Speed erreichen — dehnt/skaliert unteres Ende bei Bedarf.
  if (base.length >= 1) base[base.length - 1] = Math.max(base[base.length - 1], top);

  return base.map((v) => Math.round(v));
}

export function distributeRatios(gears: number, maxRatio = 3.5, minRatio = 0.7): number[] {
  if (gears <= 1) return [minRatio];
  const out: number[] = [];
  for (let i = 0; i < gears; i++) {
    const t = i / (gears - 1);
    out.push(Math.round((maxRatio + (minRatio - maxRatio) * t) * 100) / 100);
  }
  return out;
}
