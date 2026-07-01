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

/* --------------------------------------------------------------------- */
/* Envelope                                                               */
/* --------------------------------------------------------------------- */

export const ModSchema = z.discriminatedUnion("kind", [
  z.object({
    format: z.literal("driftlab.mod"),
    version: z.literal(2),
    kind: z.literal("car"),
    id: z.string(),
    name: z.string().min(2).max(60),
    author: z.string().min(1).max(24).default("anon"),
    description: z.string().max(500).default(""),
    payload: CustomCarSchema,
  }),
  z.object({
    format: z.literal("driftlab.mod"),
    version: z.literal(2),
    kind: z.literal("map"),
    id: z.string(),
    name: z.string().min(2).max(60),
    author: z.string().min(1).max(24).default("anon"),
    description: z.string().max(500).default(""),
    payload: MapPayloadSchema,
  }),
  z.object({
    format: z.literal("driftlab.mod"),
    version: z.literal(2),
    kind: z.literal("part-pack"),
    id: z.string(),
    name: z.string().min(2).max(60),
    author: z.string().min(1).max(24).default("anon"),
    description: z.string().max(500).default(""),
    payload: PartPackPayloadSchema,
  }),
  z.object({
    format: z.literal("driftlab.mod"),
    version: z.literal(2),
    kind: z.literal("tuning-preset"),
    id: z.string(),
    name: z.string().min(2).max(60),
    author: z.string().min(1).max(24).default("anon"),
    description: z.string().max(500).default(""),
    payload: TuningPresetPayloadSchema,
  }),
]);
export type Mod = z.infer<typeof ModSchema>;
export type ModKind = Mod["kind"];

/* --------------------------------------------------------------------- */
/* Parser + Legacy-Konvertierung                                          */
/* --------------------------------------------------------------------- */

/** Parst einen Mod aus einem beliebigen JSON-Wert.
 *  - Erkennt Format v2 direkt.
 *  - Konvertiert Legacy-Formate: `{ car: {...} }`, `{ version:1, type:"car", car:{...} }`
 *    und ein blankes CustomCar-Objekt werden automatisch als Car-Mod verpackt.
 *  - Wirft mit klarer Fehlermeldung falls unbekannt.
 */
export function parseMod(input: unknown): Mod {
  // 1) direktes v2 Envelope?
  const v2 = ModSchema.safeParse(input);
  if (v2.success) return v2.data;

  // 2) Legacy-Erkennung
  const obj = input as Record<string, unknown> | null;
  if (obj && typeof obj === "object") {
    // { version:1, type:"car", car:{...} }
    const legacyCar =
      (obj.type === "car" && obj.car) ||
      // { car: {...} }
      obj.car ||
      // blankes CustomCar
      (typeof obj.tuning === "object" && obj.tuning ? obj : null);
    if (legacyCar) {
      const parsed = CustomCarSchema.safeParse(legacyCar);
      if (parsed.success) {
        return wrapCarMod(parsed.data);
      }
      throw new Error(`Ungültige Auto-Daten: ${parsed.error.issues[0]?.message ?? "Schema-Fehler"}`);
    }
  }

  const err = v2.error.issues[0];
  throw new Error(
    `Kein gültiger Drift-Lab-Mod (Format v2). Fehler bei "${err?.path.join(".") || "root"}": ${err?.message}`,
  );
}

export function wrapCarMod(car: CustomCar, author = "anon"): Mod {
  return {
    format: "driftlab.mod",
    version: 2,
    kind: "car",
    id: crypto.randomUUID(),
    name: car.name,
    author,
    description: "",
    payload: car,
  };
}

/* --------------------------------------------------------------------- */
/* Anwendung                                                              */
/* --------------------------------------------------------------------- */

const INSTALLED_MAP_KEY = "mods:installedMapMods";
const INSTALLED_PRESET_KEY = "mods:installedPresets";

export type InstalledMapMod = {
  id: string;
  name: string;
  author: string;
  enabled: boolean;
  objects: MapObject[];
};

export type InstalledPreset = {
  id: string;
  name: string;
  patch: Partial<Tuning>;
};

export function getInstalledMapMods(): InstalledMapMod[] {
  try {
    return JSON.parse(localStorage.getItem(INSTALLED_MAP_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function setInstalledMapMods(mods: InstalledMapMod[]) {
  localStorage.setItem(INSTALLED_MAP_KEY, JSON.stringify(mods));
}

export function getInstalledPresets(): InstalledPreset[] {
  try {
    return JSON.parse(localStorage.getItem(INSTALLED_PRESET_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Wendet einen validierten Mod an — Router pro `kind`. Gibt eine
 *  User-lesbare Meldung zurück. */
export async function applyMod(mod: Mod): Promise<string> {
  switch (mod.kind) {
    case "car": {
      const car: CustomCar = { ...mod.payload, id: crypto.randomUUID(), createdAt: Date.now() };
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
      localStorage.setItem(INSTALLED_PRESET_KEY, JSON.stringify(list));
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
