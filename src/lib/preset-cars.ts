// 25 vorgefertigte Autos für den Bundle-Shop.
import type { CustomCar } from "./garage";
import { defaultTuning, defaultAppearance } from "./garage";

type BodyType = "roadster" | "suv" | "racer" | "truck" | "kompakt";

type PresetDef = {
  key: string;
  name: string;
  body: BodyType;
  primary: string;
  secondary?: string;
  wheel?: string;
  wheelSize?: number;
  spoiler?: boolean;
  spoilerHeight?: number;
  glassTint?: number;
  top: number;
  time0to100: number;
  weight: number;
  grip: number;
  brakeDist: number;
  drive: "FWD" | "RWD" | "AWD";
  gears?: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  tag?: string;
};

export const PRESETS: PresetDef[] = [
  // common (5)
  { key: "hatch-city",  name: "City Sprint",     body: "kompakt", primary: "#4ade80", top: 170, time0to100: 9.5, weight: 1050, grip: 68, brakeDist: 40, drive: "FWD", rarity: "common", tag: "Stadt-Flitzer" },
  { key: "sedan-comm",  name: "Comet Sedan",     body: "roadster", primary: "#94a3b8", top: 200, time0to100: 8.2, weight: 1450, grip: 70, brakeDist: 42, drive: "FWD", rarity: "common" },
  { key: "van-work",    name: "Worker Van",      body: "truck",  primary: "#a3a3a3", top: 150, time0to100: 12.0, weight: 2100, grip: 65, brakeDist: 48, drive: "RWD", rarity: "common" },
  { key: "hatch-eco",   name: "Eco Compact",     body: "kompakt", primary: "#fbbf24", top: 160, time0to100: 10.5, weight: 1000, grip: 66, brakeDist: 41, drive: "FWD", rarity: "common" },
  { key: "roadster-b",  name: "Breeze Roadster", body: "roadster", primary: "#38bdf8", top: 210, time0to100: 7.5, weight: 1300, grip: 72, brakeDist: 40, drive: "RWD", rarity: "common" },

  // uncommon (6)
  { key: "suv-tour",    name: "Tourer XL",       body: "suv",    primary: "#0ea5e9", top: 190, time0to100: 8.9, weight: 2000, grip: 82, brakeDist: 44, drive: "AWD", rarity: "uncommon" },
  { key: "racer-club",  name: "Club Racer",      body: "racer",  primary: "#ef4444", spoiler: true, spoilerHeight: 0.45, top: 245, time0to100: 5.5, weight: 1250, grip: 82, brakeDist: 34, drive: "RWD", rarity: "uncommon" },
  { key: "muscle-jr",   name: "Junior Muscle",   body: "roadster", primary: "#dc2626", secondary: "#111", top: 230, time0to100: 5.9, weight: 1600, grip: 74, brakeDist: 38, drive: "RWD", rarity: "uncommon" },
  { key: "hatch-hot",   name: "Hot Hatch",       body: "kompakt", primary: "#f97316", spoiler: true, spoilerHeight: 0.3, top: 220, time0to100: 6.4, weight: 1200, grip: 78, brakeDist: 36, drive: "FWD", rarity: "uncommon" },
  { key: "coupe-gt",    name: "Nightshade GT",   body: "roadster", primary: "#312e81", top: 250, time0to100: 5.4, weight: 1500, grip: 78, brakeDist: 36, drive: "AWD", rarity: "uncommon" },
  { key: "suv-adv",     name: "Adventure 4x4",   body: "suv",    primary: "#65a30d", wheelSize: 22, top: 175, time0to100: 9.2, weight: 2200, grip: 85, brakeDist: 46, drive: "AWD", rarity: "uncommon" },

  // rare (6)
  { key: "racer-street", name: "Street Assassin", body: "racer",  primary: "#f43f5e", spoiler: true, spoilerHeight: 0.5, top: 275, time0to100: 4.6, weight: 1200, grip: 86, brakeDist: 32, drive: "RWD", rarity: "rare" },
  { key: "gt-carbon",   name: "Carbon GT",       body: "roadster", primary: "#1e293b", secondary: "#f59e0b", top: 290, time0to100: 4.2, weight: 1350, grip: 84, brakeDist: 32, drive: "AWD", rarity: "rare" },
  { key: "suv-perf",    name: "Alpine Sport SUV",body: "suv",    primary: "#10b981", top: 240, time0to100: 5.6, weight: 2100, grip: 88, brakeDist: 38, drive: "AWD", rarity: "rare" },
  { key: "muscle-v8",   name: "Thunderbird V8",  body: "roadster", primary: "#7c2d12", top: 285, time0to100: 4.1, weight: 1700, grip: 78, brakeDist: 36, drive: "RWD", rarity: "rare" },
  { key: "truck-perf",  name: "Raptor RT",       body: "truck",  primary: "#0891b2", wheelSize: 26, top: 200, time0to100: 6.0, weight: 2500, grip: 82, brakeDist: 44, drive: "AWD", rarity: "rare" },
  { key: "roadster-pr", name: "Prestige Roadster", body: "roadster", primary: "#a21caf", spoiler: true, spoilerHeight: 0.35, top: 280, time0to100: 4.3, weight: 1400, grip: 82, brakeDist: 34, drive: "RWD", rarity: "rare" },

  // epic (5)
  { key: "racer-cup",   name: "Cup Series R",    body: "racer",  primary: "#fbbf24", spoiler: true, spoilerHeight: 0.7, top: 315, time0to100: 3.4, weight: 1150, grip: 92, brakeDist: 28, drive: "RWD", rarity: "epic" },
  { key: "hyper-blade", name: "Blade Hypercar",  body: "racer",  primary: "#0f172a", secondary: "#e11d48", spoiler: true, spoilerHeight: 0.6, top: 335, time0to100: 3.0, weight: 1200, grip: 90, brakeDist: 28, drive: "AWD", rarity: "epic" },
  { key: "gt-r",        name: "Skyline R",       body: "roadster", primary: "#0284c7", spoiler: true, spoilerHeight: 0.4, top: 320, time0to100: 3.3, weight: 1550, grip: 90, brakeDist: 30, drive: "AWD", rarity: "epic" },
  { key: "muscle-elite", name: "Elite Muscle GT500", body: "roadster", primary: "#111111", secondary: "#f97316", top: 320, time0to100: 3.5, weight: 1650, grip: 84, brakeDist: 32, drive: "RWD", rarity: "epic" },
  { key: "suv-hyper",   name: "Urus HP",         body: "suv",    primary: "#f59e0b", top: 300, time0to100: 3.6, weight: 2200, grip: 90, brakeDist: 34, drive: "AWD", rarity: "epic" },

  // legendary (3)
  { key: "hyper-veyr",  name: "Vayron Legend",   body: "racer",  primary: "#0ea5e9", secondary: "#000", spoiler: true, spoilerHeight: 0.55, top: 380, time0to100: 2.5, weight: 1900, grip: 92, brakeDist: 28, drive: "AWD", rarity: "legendary" },
  { key: "hyper-ev",    name: "Voltron X",       body: "racer",  primary: "#22d3ee", spoiler: true, spoilerHeight: 0.6, top: 360, time0to100: 2.1, weight: 2100, grip: 94, brakeDist: 26, drive: "AWD", rarity: "legendary" },
  { key: "hyper-god",   name: "Aeon Prototype",  body: "racer",  primary: "#fef3c7", secondary: "#7c2d12", spoiler: true, spoilerHeight: 0.7, top: 400, time0to100: 1.9, weight: 1050, grip: 96, brakeDist: 24, drive: "AWD", rarity: "legendary" },
];

export const PRESETS_BY_KEY = Object.fromEntries(PRESETS.map((p) => [p.key, p])) as Record<string, PresetDef>;

export function presetToCustomCar(p: PresetDef): CustomCar {
  const tuning = defaultTuning();
  tuning.topSpeed = p.top;
  tuning.time0to100 = p.time0to100;
  tuning.weight = p.weight;
  tuning.grip = p.grip;
  tuning.brakeDist = p.brakeDist;
  tuning.drive = p.drive;
  if (p.gears) tuning.gears = p.gears;

  const appearance = defaultAppearance();
  appearance.bodyType = p.body;
  appearance.primaryColor = p.primary;
  if (p.secondary) appearance.secondaryColor = p.secondary;
  if (p.wheel) appearance.wheelColor = p.wheel;
  if (p.wheelSize) appearance.wheelSize = p.wheelSize;
  if (p.spoiler) appearance.spoiler = true;
  if (p.spoilerHeight !== undefined) appearance.spoilerHeight = p.spoilerHeight;
  if (p.glassTint !== undefined) appearance.glassTint = p.glassTint;

  return {
    id: crypto.randomUUID(),
    name: p.name,
    createdAt: Date.now(),
    tuning,
    appearance,
    parts: [],
    mods: [],
  };
}
