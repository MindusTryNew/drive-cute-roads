// Mod-Format v2 — exakte Erkennung + Anwendung von Mods (Auto, Karte, Parts, Preset).
// Alle Mods werden per Zod strikt validiert, damit der Inhalt beim Anwenden
// sofort korrekt eingefügt werden kann und keine kaputten Daten in Spielsysteme
// gelangen.

import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  CustomCarSchema,
  TuningSchema,
  saveCar,
  type CustomCar,
  type Tuning,
} from "./garage";

const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

/* --------------------------------------------------------------------- */
/* Payload-Schemata                                                       */
/* --------------------------------------------------------------------- */

// Map-Mod: fügt Objekte zur Welt hinzu (relative zu Welt-Koordinaten).
export const MapObjectSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("building"),
    x: z.number(), z: z.number(),
    w: z.number().min(1).max(200),
    d: z.number().min(1).max(200),
    h: z.number().min(1).max(200),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#5b6d8f"),
  }),
  z.object({
    type: z.literal("ramp"),
    x: z.number(), z: z.number(),
    length: z.number().min(2).max(80).default(12),
    width: z.number().min(2).max(30).default(6),
    angleDeg: z.number().min(5).max(45).default(15),
    rotationDeg: z.number().default(0),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#c94f4f"),
  }),
  z.object({
    type: z.literal("checkpoint"),
    x: z.number(), z: z.number(),
    radius: z.number().min(1).max(30).default(4),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#4ade80"),
  }),
  z.object({
    type: z.literal("prop"),
    x: z.number(), z: z.number(),
    shape: z.enum(["box", "sphere", "cone", "cylinder"]),
    size: z.number().min(0.2).max(40).default(2),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#8899aa"),
  }),
]);
export type MapObject = z.infer<typeof MapObjectSchema>;

export const MapPayloadSchema = z.object({
  objects: z.array(MapObjectSchema).min(1).max(500),
});

// Part-Pack: verweist auf bereits in IndexedDB liegende Parts oder embedded
// base64 (embedded wird beim Anwenden dekodiert und in IndexedDB gespeichert).
export const PartPackPayloadSchema = z.object({
  parts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    scale: z.number().min(0.01).max(50).default(1),
    // optionales base64 des GLB
    glbBase64: z.string().optional(),
  })).min(1).max(20),
});

// Tuning-Preset: patcht Werte im Auto-Builder.
export const TuningPresetPayloadSchema = z.object({
  patch: TuningSchema.partial(),
});

/* ---------------------------- v3 Payloads ----------------------------- */

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);

// Skin: Lackierung/Material-Overrides für Autos.
export const SkinPayloadSchema = z.object({
  primaryColor: hex,
  secondaryColor: hex.optional(),
  wheelColor: hex.optional(),
  metalness: z.number().min(0).max(1).default(0.5),
  roughness: z.number().min(0).max(1).default(0.4),
  emissive: hex.optional(),
  emissiveIntensity: z.number().min(0).max(4).default(0),
  decalText: z.string().max(12).optional(),
  targetBody: z.enum(["any", "roadster", "suv", "racer", "truck", "kompakt"]).default("any"),
});
export type SkinPayload = z.infer<typeof SkinPayloadSchema>;

// Physik-Mod: globale Multiplikatoren (geklemmt, damit nichts einfriert).
const mult = (def = 1) => z.number().min(0.1).max(10).default(def);
export const PhysicsPayloadSchema = z.object({
  gravity: mult(),
  friction: mult(),
  drag: mult(),
  drift: mult(),
  accel: mult(),
  topSpeed: mult(),
  grip: mult(),
  brake: mult(),
  steer: mult(),
});
export type PhysicsPayload = z.infer<typeof PhysicsPayloadSchema>;

// Wetter/Zeit-Mod.
export const WeatherPayloadSchema = z.object({
  fixedTime: z.number().min(0).max(1).nullable().default(null),
  fogNear: z.number().min(1).max(4000).default(60),
  fogFar: z.number().min(2).max(8000).default(900),
  fogColor: hex.optional(),
  skyColor: hex.optional(),
  cycleSpeed: z.number().min(0).max(10).default(1),
});
export type WeatherPayload = z.infer<typeof WeatherPayloadSchema>;

// Missions-Mod: eigene Missionen.
export const MissionPayloadSchema = z.object({
  missions: z.array(z.object({
    id: z.string().min(1).max(40),
    title: z.string().min(2).max(60),
    desc: z.string().max(160).default(""),
    goalKind: z.enum(["distance", "topSpeed", "drift", "airtime", "collect"]),
    goal: z.number().min(1).max(1_000_000),
    reward: z.number().min(1).max(100_000).default(500),
  })).min(1).max(50),
});
export type MissionPayload = z.infer<typeof MissionPayloadSchema>;

// Kollektions-Mod: eigene Sammelitems.
export const CollectiblePayloadSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1).max(40),
    name: z.string().min(1).max(48),
    desc: z.string().max(160).default(""),
    emoji: z.string().min(1).max(4).default("🎁"),
    rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary", "mythical", "cosmic", "celestial"]).default("rare"),
  })).min(1).max(200),
});
export type CollectiblePayload = z.infer<typeof CollectiblePayloadSchema>;

// Sound-Mod: Motor-/Reifen-Sounds (Data-URL oder https-URL).
const soundSrc = z.string().max(2_000_000).refine(
  (s) => s.startsWith("data:audio/") || s.startsWith("https://"),
  "Sound muss eine data:audio/…- oder https://-URL sein",
);
export const SoundPayloadSchema = z.object({
  engine: soundSrc.optional(),
  tires: soundSrc.optional(),
  horn: soundSrc.optional(),
  volume: z.number().min(0).max(1).default(0.6),
  pitchBase: z.number().min(0.2).max(3).default(1),
});
export type SoundPayload = z.infer<typeof SoundPayloadSchema>;

/* --------------------------------------------------------------------- */
/* Envelope                                                               */
/* --------------------------------------------------------------------- */

const envelope = <K extends string, P extends z.ZodTypeAny>(kind: K, payload: P) =>
  z.object({
    format: z.literal("driftlab.mod"),
    version: z.union([z.literal(2), z.literal(3)]),
    kind: z.literal(kind),
    id: z.string(),
    name: z.string().min(2).max(60),
    author: z.string().min(1).max(24).default("anon"),
    description: z.string().max(500).default(""),
    /** Ladereihenfolge — kleinere Werte zuerst. */
    priority: z.number().int().min(-100).max(100).default(0),
    payload,
  });

export const SingleModSchema = z.discriminatedUnion("kind", [
  envelope("car", CustomCarSchema),
  envelope("map", MapPayloadSchema),
  envelope("part-pack", PartPackPayloadSchema),
  envelope("tuning-preset", TuningPresetPayloadSchema),
  envelope("skin", SkinPayloadSchema),
  envelope("physics", PhysicsPayloadSchema),
  envelope("weather", WeatherPayloadSchema),
  envelope("mission", MissionPayloadSchema),
  envelope("collectible", CollectiblePayloadSchema),
  envelope("sound", SoundPayloadSchema),
]);
export type SingleMod = z.infer<typeof SingleModSchema>;

// Mod-Pack: bündelt mehrere Mods in einer Datei.
export const PackSchema = z.object({
  format: z.literal("driftlab.mod"),
  version: z.literal(3),
  kind: z.literal("pack"),
  id: z.string(),
  name: z.string().min(2).max(60),
  author: z.string().min(1).max(24).default("anon"),
  description: z.string().max(500).default(""),
  priority: z.number().int().min(-100).max(100).default(0),
  payload: z.object({
    mods: z.array(SingleModSchema).min(1).max(40),
  }),
});

export const ModSchema = z.union([SingleModSchema, PackSchema]);
export type Mod = z.infer<typeof ModSchema>;
export type ModKind = Mod["kind"];


/* --------------------------------------------------------------------- */
/* Parser + Legacy-Konvertierung                                          */
/* --------------------------------------------------------------------- */

/** Parst einen Mod aus einem beliebigen JSON-Wert.
 *  - Erkennt Format v2 und v3 direkt (v2 wird transparent migriert).
 *  - Konvertiert Legacy-Formate: `{ car: {...} }`, `{ version:1, type:"car", car:{...} }`
 *    und ein blankes CustomCar-Objekt werden automatisch als Car-Mod verpackt.
 *  - Wirft mit lesbarer Fehlermeldung falls unbekannt.
 */
export function parseMod(input: unknown): Mod {
  const direct = ModSchema.safeParse(input);
  if (direct.success) return direct.data;

  // Legacy-Erkennung
  const obj = input as Record<string, unknown> | null;
  if (obj && typeof obj === "object") {
    const legacyCar =
      (obj.type === "car" && obj.car) ||
      obj.car ||
      (typeof obj.tuning === "object" && obj.tuning ? obj : null);
    if (legacyCar) {
      const parsed = CustomCarSchema.safeParse(legacyCar);
      if (parsed.success) return wrapCarMod(parsed.data);
      throw new Error(`Ungültige Auto-Daten: ${humanizeIssues(parsed.error.issues)}`);
    }
  }

  throw new Error(
    `Kein gültiger Drift-Lab-Mod (Format v2/v3). ${humanizeIssues(direct.error.issues)}`,
  );
}

/** Übersetzt Zod-Fehler in verständliche deutsche Sätze. */
export function humanizeIssues(issues: z.ZodIssue[]): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const i of issues.slice(0, 40)) {
    const path = i.path.filter((p: string | number) => typeof p !== "number").join(".") || "root";

    const line = `Feld „${path}": ${i.message}`;
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
    if (out.length >= 4) break;
  }
  return out.join(" · ");
}

export function wrapCarMod(car: CustomCar, author = "anon"): Mod {
  return {
    format: "driftlab.mod",
    version: 3,
    kind: "car",
    id: makeId(),
    name: car.name,
    author,
    description: "",
    priority: 0,
    payload: car,
  };
}

/** UUID mit Fallback für Browser ohne `crypto.randomUUID`. */
export function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch { /* ignore */ }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}


/* --------------------------------------------------------------------- */
/* Anwendung                                                              */
/* --------------------------------------------------------------------- */

const INSTALLED_MAP_KEY = "mods:installedMapMods";
const INSTALLED_PRESET_KEY = "mods:installedPresets";
/** Generische Registry für alle v3-Runtime-Mods. */
const INSTALLED_V3_KEY = "mods:installedV3";

export type InstalledMapMod = {
  id: string;
  name: string;
  author: string;
  enabled: boolean;
  priority?: number;
  objects: MapObject[];
};

export type InstalledPreset = {
  id: string;
  name: string;
  patch: Partial<Tuning>;
};

/** Ein installierter Runtime-Mod (Skin, Physik, Wetter, Mission, Item, Sound). */
export type InstalledRuntimeMod = {
  id: string;
  kind: "skin" | "physics" | "weather" | "mission" | "collectible" | "sound";
  name: string;
  author: string;
  enabled: boolean;
  priority: number;
  installedAt: number;
  payload: unknown;
};

export function getInstalledMapMods(): InstalledMapMod[] {
  try {
    return JSON.parse(safeLS()?.getItem(INSTALLED_MAP_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function setInstalledMapMods(mods: InstalledMapMod[]) {
  safeLS()?.setItem(INSTALLED_MAP_KEY, JSON.stringify(mods));
}

export function getInstalledPresets(): InstalledPreset[] {
  try {
    return JSON.parse(safeLS()?.getItem(INSTALLED_PRESET_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function setInstalledPresets(list: InstalledPreset[]) {
  safeLS()?.setItem(INSTALLED_PRESET_KEY, JSON.stringify(list));
}

/** Alle v3-Runtime-Mods, sortiert nach Ladereihenfolge (priority, dann Zeit). */
export function getRuntimeMods(): InstalledRuntimeMod[] {
  try {
    const list: InstalledRuntimeMod[] = JSON.parse(safeLS()?.getItem(INSTALLED_V3_KEY) ?? "[]");
    return list.sort((a, b) => (a.priority - b.priority) || (a.installedAt - b.installedAt));
  } catch {
    return [];
  }
}

export function setRuntimeMods(list: InstalledRuntimeMod[]) {
  safeLS()?.setItem(INSTALLED_V3_KEY, JSON.stringify(list));
  for (const l of runtimeListeners) l();
}

const runtimeListeners = new Set<() => void>();
export function subscribeRuntimeMods(cb: () => void): () => void {
  runtimeListeners.add(cb);
  return () => { runtimeListeners.delete(cb); };
}

export function toggleRuntimeMod(id: string) {
  setRuntimeMods(getRuntimeMods().map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
}

export function removeRuntimeMod(id: string) {
  setRuntimeMods(getRuntimeMods().filter((m) => m.id !== id));
}

export function moveRuntimeMod(id: string, dir: -1 | 1) {
  const list = getRuntimeMods();
  const i = list.findIndex((m) => m.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  setRuntimeMods(list.map((m, idx) => ({ ...m, priority: idx })));
}

/** Findet Konflikte: mehrere aktive Mods desselben exklusiven Typs. */
export function findConflicts(): string[] {
  const active = getRuntimeMods().filter((m) => m.enabled);
  const out: string[] = [];
  for (const kind of ["physics", "weather", "sound"] as const) {
    const hits = active.filter((m) => m.kind === kind);
    if (hits.length > 1) {
      out.push(
        `${hits.length} aktive ${kind}-Mods (${hits.map((h) => h.name).join(", ")}) — der letzte in der Liste gewinnt.`,
      );
    }
  }
  return out;
}

function installRuntime(mod: SingleMod, kind: InstalledRuntimeMod["kind"]) {
  const list = getRuntimeMods();
  const filtered = list.filter((m) => m.id !== mod.id);
  filtered.push({
    id: mod.id,
    kind,
    name: mod.name,
    author: mod.author,
    enabled: true,
    priority: mod.priority ?? filtered.length,
    installedAt: Date.now(),
    payload: mod.payload,
  });
  setRuntimeMods(filtered);
}

/** Wendet einen validierten Mod an — Router pro `kind`. Gibt eine
 *  User-lesbare Meldung zurück. */
export async function applyMod(mod: Mod): Promise<string> {
  if (mod.kind === "pack") {
    const msgs: string[] = [];
    for (const sub of mod.payload.mods) msgs.push(await applyMod(sub));
    return `Mod-Pack „${mod.name}" installiert (${msgs.length} Mods).`;
  }
  switch (mod.kind) {
    case "car": {
      const car: CustomCar = { ...mod.payload, id: makeId(), createdAt: Date.now() };
      saveCar(car, false);
      return `Auto „${car.name}" in die Garage übernommen.`;
    }
    case "skin":
      installRuntime(mod, "skin");
      return `Skin „${mod.name}" installiert — im Auto-Editor auswählbar.`;
    case "physics":
      installRuntime(mod, "physics");
      return `Physik-Mod „${mod.name}" aktiviert.`;
    case "weather":
      installRuntime(mod, "weather");
      return `Wetter-Mod „${mod.name}" aktiviert.`;
    case "mission":
      installRuntime(mod, "mission");
      return `Missions-Mod „${mod.name}" installiert (${mod.payload.missions.length} Missionen).`;
    case "collectible":
      installRuntime(mod, "collectible");
      return `Item-Mod „${mod.name}" installiert (${mod.payload.items.length} Items).`;
    case "sound":
      installRuntime(mod, "sound");
      return `Sound-Mod „${mod.name}" aktiviert.`;

      saveCar(car, false);
      return `Auto „${car.name}" in die Garage übernommen.`;
    }
    case "map": {
      const list = getInstalledMapMods();
      list.push({
        id: mod.id,
        name: mod.name,
        author: mod.author,
        enabled: true,
        objects: mod.payload.objects,
      });
      setInstalledMapMods(list);
      return `Kartenerweiterung „${mod.name}" installiert (${mod.payload.objects.length} Objekte). Beim nächsten Sim-Start aktiv.`;
    }
    case "tuning-preset": {
      const list = getInstalledPresets();
      list.push({ id: mod.id, name: mod.name, patch: mod.payload.patch });
      safeLS()?.setItem(INSTALLED_PRESET_KEY, JSON.stringify(list));
      return `Tuning-Preset „${mod.name}" gespeichert — im Auto-Editor auswählbar.`;
    }
    case "part-pack": {
      // Embedded base64 → IndexedDB
      const { savePart } = await import("./parts-store");
      let stored = 0;
      for (const p of mod.payload.parts) {
        if (p.glbBase64) {
          const bin = atob(p.glbBase64);
          const buf = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
          await savePart(p.id, new Blob([buf], { type: "model/gltf-binary" }));
          stored++;
        }
      }
      return `Parts-Pack „${mod.name}" — ${stored}/${mod.payload.parts.length} Parts installiert.`;
    }
  }
}

export function removeMapMod(id: string) {
  setInstalledMapMods(getInstalledMapMods().filter((m) => m.id !== id));
}

export function toggleMapMod(id: string) {
  setInstalledMapMods(
    getInstalledMapMods().map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
  );
}

/* --------------------------------------------------------------------- */
/* Cloud (öffentlicher Mod-Browser)                                       */
/* --------------------------------------------------------------------- */

export type CloudMod = {
  id: string;
  author_nick: string;
  kind: ModKind;
  name: string;
  description: string;
  payload: unknown;
  downloads: number;
  uploaded_at: string;
};

export async function listCloudMods(kind?: ModKind, search?: string): Promise<CloudMod[]> {
  let q = supabase
    .from("mods")
    .select("id, author_nick, kind, name, description, payload, downloads, uploaded_at")
    .order("uploaded_at", { ascending: false })
    .limit(80);
  if (kind) q = q.eq("kind", kind);
  if (search && search.trim()) q = q.ilike("name", `%${search.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CloudMod[];
}

export async function uploadCloudMod(mod: Mod, authorNick: string, description: string): Promise<void> {
  const { error } = await supabase.from("mods").insert({
    author_nick: authorNick.trim(),
    kind: mod.kind,
    name: mod.name,
    description: description.slice(0, 500),
    payload: mod,
  });
  if (error) throw error;
}

export async function bumpDownload(id: string): Promise<void> {
  try { await supabase.rpc("increment_mod_download", { _id: id }); } catch { /* ignore */ }
}

/* --------------------------------------------------------------------- */
/* Export-Helper                                                          */
/* --------------------------------------------------------------------- */

export function serializeMod(mod: Mod): string {
  return JSON.stringify(mod, null, 2);
}

export function downloadMod(mod: Mod) {
  const blob = new Blob([serializeMod(mod)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${mod.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.${mod.kind}.mod.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseModFile(file: File): Promise<Mod> {
  const txt = await file.text();
  const obj = JSON.parse(txt);
  return parseMod(obj);
}
