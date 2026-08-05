// Anwendung aktiver v3-Runtime-Mods auf Physik, Wetter, Sound, Missionen und Items.
import {
  getRuntimeMods,
  type PhysicsPayload,
  type WeatherPayload,
  type SkinPayload,
  type SoundPayload,
  type MissionPayload,
  type CollectiblePayload,
} from "./mods";

export type PhysicsMultipliers = PhysicsPayload;

export const NEUTRAL_PHYSICS: PhysicsMultipliers = {
  gravity: 1, friction: 1, drag: 1, drift: 1,
  accel: 1, topSpeed: 1, grip: 1, brake: 1, steer: 1,
};

const clampMul = (n: unknown, def = 1) =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(10, Math.max(0.1, n)) : def;

/** Kombiniert alle aktiven Physik-Mods multiplikativ (mit harten Grenzen). */
export function getPhysicsMultipliers(): PhysicsMultipliers {
  const out: PhysicsMultipliers = { ...NEUTRAL_PHYSICS };
  for (const m of getRuntimeMods()) {
    if (!m.enabled || m.kind !== "physics") continue;
    const p = m.payload as Partial<PhysicsPayload>;
    for (const k of Object.keys(out) as (keyof PhysicsMultipliers)[]) {
      out[k] = Math.min(10, Math.max(0.1, out[k] * clampMul(p[k])));
    }
  }
  return out;
}

/** Letzter aktiver Wetter-Mod gewinnt. */
export function getWeatherMod(): WeatherPayload | null {
  let found: WeatherPayload | null = null;
  for (const m of getRuntimeMods()) {
    if (m.enabled && m.kind === "weather") found = m.payload as WeatherPayload;
  }
  return found;
}

/** Letzter aktiver Sound-Mod gewinnt. */
export function getSoundMod(): SoundPayload | null {
  let found: SoundPayload | null = null;
  for (const m of getRuntimeMods()) {
    if (m.enabled && m.kind === "sound") found = m.payload as SoundPayload;
  }
  return found;
}

export type InstalledSkin = { id: string; name: string; skin: SkinPayload };

export function getSkins(): InstalledSkin[] {
  return getRuntimeMods()
    .filter((m) => m.enabled && m.kind === "skin")
    .map((m) => ({ id: m.id, name: m.name, skin: m.payload as SkinPayload }));
}

export type ModMission = MissionPayload["missions"][number] & { source: string };

export function getModMissions(): ModMission[] {
  const out: ModMission[] = [];
  for (const m of getRuntimeMods()) {
    if (!m.enabled || m.kind !== "mission") continue;
    for (const mi of (m.payload as MissionPayload).missions) out.push({ ...mi, source: m.name });
  }
  return out;
}

export type ModCollectible = CollectiblePayload["items"][number] & { source: string };

export function getModCollectibles(): ModCollectible[] {
  const out: ModCollectible[] = [];
  for (const m of getRuntimeMods()) {
    if (!m.enabled || m.kind !== "collectible") continue;
    for (const it of (m.payload as CollectiblePayload).items) out.push({ ...it, source: m.name });
  }
  return out;
}

/** Schreibt die Physik-Multiplikatoren in einen globalen Cache, den
 *  `physicsFromTuning` synchron (und SSR-sicher) lesen kann. */
export function syncPhysicsGlobal() {
  (globalThis as { __modPhysics?: PhysicsMultipliers }).__modPhysics = getPhysicsMultipliers();
}

export function readPhysicsGlobal(): PhysicsMultipliers {
  return (globalThis as { __modPhysics?: PhysicsMultipliers }).__modPhysics ?? NEUTRAL_PHYSICS;
}
