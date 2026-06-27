// Quality presets + auto-detection.
export type QualityKey = "auto" | "low" | "med" | "high";

export type QualityPreset = {
  shadows: boolean;
  buildings: number;
  fogFar: number;
  fogNear: number;
  streetLights: boolean;
  pixelRatio: number;
  netHz: number;
  shadowMapSize: number;
};

export const PRESETS: Record<Exclude<QualityKey, "auto">, QualityPreset> = {
  low: { shadows: false, buildings: 30, fogFar: 240, fogNear: 80, streetLights: false, pixelRatio: 1, netHz: 8, shadowMapSize: 512 },
  med: { shadows: true, buildings: 70, fogFar: 360, fogNear: 120, streetLights: true, pixelRatio: 1.5, netHz: 12, shadowMapSize: 1024 },
  high: { shadows: true, buildings: 120, fogFar: 500, fogNear: 200, streetLights: true, pixelRatio: 2, netHz: 18, shadowMapSize: 2048 },
};

const KEY = "garage:quality";

export function getQualitySetting(): QualityKey {
  const v = (localStorage.getItem(KEY) as QualityKey | null) ?? "auto";
  return ["auto", "low", "med", "high"].includes(v) ? v : "auto";
}

export function setQualitySetting(q: QualityKey) {
  localStorage.setItem(KEY, q);
}

// Heuristic if user picked "auto" — based on devicePixelRatio + hardware concurrency hints.
export function detectAutoPreset(): Exclude<QualityKey, "auto"> {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  const cores = typeof navigator !== "undefined" ? (navigator.hardwareConcurrency ?? 4) : 4;
  const mem = typeof navigator !== "undefined" ? ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4) : 4;
  if (cores <= 4 || mem <= 2 || dpr <= 1) return "med";
  if (cores >= 8 && mem >= 8) return "high";
  return "med";
}

export function resolvePreset(q: QualityKey): { preset: QualityPreset; resolved: Exclude<QualityKey, "auto"> } {
  const resolved = q === "auto" ? detectAutoPreset() : q;
  return { preset: PRESETS[resolved], resolved };
}
