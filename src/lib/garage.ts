import { z } from "zod";

export const BodyTypeSchema = z.enum(["roadster", "suv", "racer", "truck", "kompakt"]);
export const DriveSchema = z.enum(["FWD", "RWD", "AWD"]);

// No upper caps — fully experimental tuning allowed.
const pos = (min = 0.0001) => z.number().min(min);

export const TuningSchema = z.object({
  time0to100: pos(0.05),
  topSpeed: pos(1),
  brakeDist: pos(0.5),
  weight: pos(1),
  weightDistFront: z.number().min(0).max(100),
  drive: DriveSchema,
  gears: z.number().int().min(1).max(20),
  gearRatios: z.array(pos(0.05)).min(1).max(20),
  grip: pos(0),
  steerAngle: pos(0.1),
  handlingBias: z.number(),
  suspension: z.number().min(0),
});
export type Tuning = z.infer<typeof TuningSchema>;

export const AppearanceSchema = z.object({
  bodyType: BodyTypeSchema,
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  secondaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  wheelColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  wheelSize: z.number().min(10).max(40),
  spoiler: z.boolean(),
  spoilerHeight: z.number().min(0).max(1),
  glassTint: z.number().min(0).max(1),
});
export type Appearance = z.infer<typeof AppearanceSchema>;

export const PartRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.number().min(0.01).max(20),
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
    return z.array(CustomCarSchema).parse(JSON.parse(raw));
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
  car.id = crypto.randomUUID();
  car.createdAt = Date.now();
  return car;
}
