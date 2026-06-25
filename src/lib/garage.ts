import { z } from "zod";

export const BodyTypeSchema = z.enum(["roadster", "suv", "racer", "truck", "kompakt"]);
export const DriveSchema = z.enum(["FWD", "RWD", "AWD"]);

export const TuningSchema = z.object({
  time0to100: z.number().min(2).max(12),       // seconds
  topSpeed: z.number().min(120).max(400),       // km/h
  brakeDist: z.number().min(25).max(60),        // m (100-0)
  weight: z.number().min(800).max(2500),        // kg
  weightDistFront: z.number().min(30).max(70),  // % front
  drive: DriveSchema,
  gears: z.number().int().min(4).max(8),
  gearRatios: z.array(z.number().min(0.3).max(5)).min(4).max(8),
  grip: z.number().min(0).max(100),
  steerAngle: z.number().min(15).max(45),
  handlingBias: z.number().min(-100).max(100),  // - understeer, + oversteer
  suspension: z.number().min(0).max(100),
});
export type Tuning = z.infer<typeof TuningSchema>;

export const AppearanceSchema = z.object({
  bodyType: BodyTypeSchema,
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  secondaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  wheelColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  wheelSize: z.number().min(14).max(22),
  spoiler: z.boolean(),
  spoilerHeight: z.number().min(0).max(1),
  glassTint: z.number().min(0).max(1),
});
export type Appearance = z.infer<typeof AppearanceSchema>;

export const PartRefSchema = z.object({
  id: z.string(),            // IndexedDB key
  name: z.string(),
  enabled: z.boolean(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.number().min(0.05).max(5),
});
export type PartRef = z.infer<typeof PartRefSchema>;

export const ModSchema = z.object({
  id: z.string(),
  name: z.string(),
  author: z.string().optional(),
  enabled: z.boolean(),
  patches: z.object({
    tuning: z.record(z.string(), z.number()).optional(),
    appearance: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  }),
});
export type Mod = z.infer<typeof ModSchema>;

export const CustomCarSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(40),
  createdAt: z.number(),
  tuning: TuningSchema,
  appearance: AppearanceSchema,
  parts: z.array(PartRefSchema).default([]),
  mods: z.array(ModSchema).default([]),
});
export type CustomCar = z.infer<typeof CustomCarSchema>;

const CARS_KEY = "garage:cars";
const LIMIT_KEY = "garage:dailyLimit";
const DAILY_MAX = 3;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultTuning(): Tuning {
  return {
    time0to100: 4.5,
    topSpeed: 240,
    brakeDist: 38,
    weight: 1500,
    weightDistFront: 50,
    drive: "AWD",
    gears: 6,
    gearRatios: [3.5, 2.3, 1.6, 1.2, 0.9, 0.7],
    grip: 70,
    steerAngle: 30,
    handlingBias: 0,
    suspension: 50,
  };
}

export function defaultAppearance(): Appearance {
  return {
    bodyType: "roadster",
    primaryColor: "#5b8def",
    secondaryColor: "#0a0e1a",
    wheelColor: "#1a1a1a",
    wheelSize: 18,
    spoiler: false,
    spoilerHeight: 0.3,
    glassTint: 0.7,
  };
}

export function emptyCar(name = "Neues Auto"): CustomCar {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    tuning: defaultTuning(),
    appearance: defaultAppearance(),
    parts: [],
    mods: [],
  };
}

export function listCars(): CustomCar[] {
  try {
    const raw = localStorage.getItem(CARS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return z.array(CustomCarSchema).parse(arr);
  } catch {
    return [];
  }
}

function writeCars(cars: CustomCar[]) {
  localStorage.setItem(CARS_KEY, JSON.stringify(cars));
}

export function saveCar(car: CustomCar, isNew: boolean) {
  const parsed = CustomCarSchema.parse(car);
  const cars = listCars();
  const idx = cars.findIndex((c) => c.id === parsed.id);
  if (idx >= 0) cars[idx] = parsed;
  else cars.push(parsed);
  writeCars(cars);
  if (isNew) bumpDaily();
}

export function deleteCar(id: string) {
  writeCars(listCars().filter((c) => c.id !== id));
}

export function getCar(id: string): CustomCar | null {
  return listCars().find((c) => c.id === id) ?? null;
}

type DailyState = { date: string; count: number };

function readDaily(): DailyState {
  try {
    const raw = localStorage.getItem(LIMIT_KEY);
    if (!raw) return { date: today(), count: 0 };
    const v = JSON.parse(raw) as DailyState;
    if (v.date !== today()) return { date: today(), count: 0 };
    return v;
  } catch {
    return { date: today(), count: 0 };
  }
}

function bumpDaily() {
  const s = readDaily();
  s.count += 1;
  localStorage.setItem(LIMIT_KEY, JSON.stringify(s));
}

export function remainingToday(): number {
  return Math.max(0, DAILY_MAX - readDaily().count);
}

export function canCreateToday(): boolean {
  return remainingToday() > 0;
}

export const DAILY_LIMIT = DAILY_MAX;

export function exportCarJson(car: CustomCar): string {
  return JSON.stringify({ version: 1, type: "car", car }, null, 2);
}

export function downloadCar(car: CustomCar) {
  const blob = new Blob([exportCarJson(car)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${car.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.car.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importCarFromFile(file: File): Promise<CustomCar> {
  const text = await file.text();
  const obj = JSON.parse(text);
  const car = CustomCarSchema.parse(obj.car ?? obj);
  // assign fresh id to avoid collisions
  car.id = crypto.randomUUID();
  car.createdAt = Date.now();
  return car;
}
