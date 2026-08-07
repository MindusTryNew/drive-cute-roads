// Modding-Kampagne: Lektionen, Übungsaufgaben (mit automatischer Prüfung)
// und Tests. Fortschritt liegt lokal.
import { parseMod, type Mod } from "./mods";
import type { PackType } from "./collectibles";

export type CheckResult = { ok: boolean; message: string };

export type Task = {
  prompt: string;
  hint: string;
  starter: string;
  check: (mod: Mod) => CheckResult;
};

export type Quiz = {
  question: string;
  options: string[];
  answer: number;
  explain: string;
};

export type Chapter = {
  id: string;
  title: string;
  goal: string;
  lesson: string[];
  code?: string;
  task: Task;
  quiz: Quiz[];
  reward: { coins: number; pack?: PackType };
};

const base = (kind: string, name: string, payload: string) => `{
  "format": "driftlab.mod",
  "version": 3,
  "kind": "${kind}",
  "id": "00000000-0000-0000-0000-000000000000",
  "name": "${name}",
  "author": "DeinNick",
  "description": "",
  "priority": 0,
  "payload": ${payload}
}`;

const ok = (message: string): CheckResult => ({ ok: true, message });
const no = (message: string): CheckResult => ({ ok: false, message });

export const CHAPTERS: Chapter[] = [
  {
    id: "basics",
    title: "1 · Grundlagen",
    goal: "Den Aufbau einer Mod-Datei verstehen und einen gültigen Mod schreiben.",
    lesson: [
      "Ein Mod ist eine JSON-Datei. Jede Datei hat immer denselben Rahmen (den „Envelope") und einen Inhalt (`payload`), der von der Art des Mods abhängt.",
      "Pflichtfelder im Envelope: `format` (immer \"driftlab.mod\"), `version` (3), `kind` (die Art), `id`, `name` (2–60 Zeichen), `author` (1–24 Zeichen), `payload`.",
      "Optional: `description` (max. 500 Zeichen) und `priority` (−100 bis 100 — kleinere Werte werden zuerst geladen).",
      "Es gibt diese Arten: car, map, part-pack, tuning-preset, skin, physics, weather, mission, collectible, sound und pack (mehrere Inhalte in einer Datei).",
      "Wichtig: Das Spiel prüft jede Datei streng. Fehlt ein Feld oder ist ein Wert außerhalb des erlaubten Bereichs, bekommst du die genaue Fehlerstelle angezeigt.",
    ],
    code: base("tuning-preset", "Mein erstes Preset", `{ "patch": { "topSpeed": 260 } }`),
    task: {
      prompt: "Schreibe einen gültigen Tuning-Preset-Mod mit dem Namen „Stadtflitzer" und einer Top-Speed von 180.",
      hint: "kind muss \"tuning-preset\" sein, payload.patch.topSpeed = 180.",
      starter: base("tuning-preset", "Stadtflitzer", `{ "patch": { "topSpeed": 0 } }`),
      check: (m) => {
        if (m.kind !== "tuning-preset") return no("kind muss \"tuning-preset\" sein.");
        if (m.name !== "Stadtflitzer") return no("Der Name muss genau „Stadtflitzer" sein.");
        if (m.payload.patch.topSpeed !== 180) return no("payload.patch.topSpeed muss 180 sein.");
        return ok("Perfekt — dein erster gültiger Mod!");
      },
    },
    quiz: [
      {
        question: "Welches Feld bestimmt, welche Art von Inhalt eine Mod-Datei enthält?",
        options: ["name", "kind", "format", "payload"],
        answer: 1,
        explain: "`kind` legt die Art fest — davon hängt ab, wie `payload` aussehen muss.",
      },
      {
        question: "Wie lang darf ein Mod-Name sein?",
        options: ["1–10 Zeichen", "2–60 Zeichen", "beliebig", "max. 500 Zeichen"],
        answer: 1,
        explain: "2 bis 60 Zeichen — kürzere oder längere Namen werden abgelehnt.",
      },
    ],
    reward: { coins: 1500 },
  },
  {
    id: "skins",
    title: "2 · Skins & Aussehen",
    goal: "Eine Lackierung als Mod bauen.",
    lesson: [
      "Ein Skin verändert das Aussehen eines Autos: Farben, Metallic-Anteil, Rauheit, Leuchten und optional ein Decal-Text.",
      "Felder: `primaryColor`, `secondaryColor` (Hex), `metalness` und `roughness` (0–1), `emissive` (Hex) mit `emissiveIntensity`, `decalText`, `targetBody`.",
      "Ein hoher Metallic-Wert mit niedriger Rauheit ergibt Chrom. Leuchtfarben brauchen `emissiveIntensity` über 0.",
    ],
    code: base("skin", "Chrome Racer", `{
    "primaryColor": "#d8d8e0",
    "secondaryColor": "#101018",
    "metalness": 0.95,
    "roughness": 0.08,
    "emissiveIntensity": 0,
    "targetBody": "any"
  }`),
    task: {
      prompt: "Baue einen Skin mit Metallic über 0.8 und Rauheit unter 0.2 (Chrom-Look).",
      hint: "kind = \"skin\", metalness > 0.8, roughness < 0.2.",
      starter: base("skin", "Mein Chrom-Skin", `{
    "primaryColor": "#cccccc",
    "secondaryColor": "#111111",
    "metalness": 0.5,
    "roughness": 0.5,
    "targetBody": "any"
  }`),
      check: (m) => {
        if (m.kind !== "skin") return no("kind muss \"skin\" sein.");
        if (m.payload.metalness <= 0.8) return no("metalness muss größer als 0.8 sein.");
        if (m.payload.roughness >= 0.2) return no("roughness muss kleiner als 0.2 sein.");
        return ok("Glänzend! Das ist ein echter Chrom-Look.");
      },
    },
    quiz: [
      {
        question: "Welcher Wert macht eine Lackierung spiegelnd?",
        options: ["roughness hoch", "metalness hoch, roughness niedrig", "emissive hoch", "decalText"],
        answer: 1,
        explain: "Viel Metall + wenig Rauheit = Spiegelung.",
      },
    ],
    reward: { coins: 2000, pack: "starter" },
  },
  {
    id: "physics",
    title: "3 · Physik & Tuning",
    goal: "Globale Fahrphysik über Multiplikatoren verändern.",
    lesson: [
      "Physik-Mods multiplizieren globale Werte: `gravity`, `friction`, `drag`, `drift`, `accel`, `topSpeed`, `grip`, `brake`, `steer`.",
      "1 = unverändert. Erlaubt ist 0.1 bis 10. Mehrere aktive Physik-Mods werden miteinander multipliziert.",
      "Tuning-Presets sind etwas anderes: Sie setzen konkrete Werte für ein Auto im Editor, statt global zu multiplizieren.",
      "Faustregel: Kleine Änderungen (0.8 – 1.3) fühlen sich gut an. Extremwerte machen das Fahren unkontrollierbar.",
    ],
    code: base("physics", "Mondgravitation", `{ "gravity": 0.3, "drift": 1.4 }`),
    task: {
      prompt: "Baue einen Physik-Mod, der die Schwerkraft halbiert (0.5) und den Grip leicht erhöht (1.2).",
      hint: "kind = \"physics\", gravity = 0.5, grip = 1.2.",
      starter: base("physics", "Leichte Schwerkraft", `{ "gravity": 1, "grip": 1 }`),
      check: (m) => {
        if (m.kind !== "physics") return no("kind muss \"physics\" sein.");
        if (m.payload.gravity !== 0.5) return no("gravity muss 0.5 sein.");
        if (m.payload.grip !== 1.2) return no("grip muss 1.2 sein.");
        return ok("Sauber — Mondfahrt mit gutem Grip.");
      },
    },
    quiz: [
      {
        question: "Was bedeutet der Wert 1 bei einem Physik-Multiplikator?",
        options: ["Aus", "Unverändert", "Doppelt", "Maximum"],
        answer: 1,
        explain: "1 lässt den Wert unverändert.",
      },
      {
        question: "Was passiert bei zwei aktiven Physik-Mods?",
        options: ["Der erste gewinnt", "Der letzte gewinnt", "Werte werden multipliziert", "Fehler"],
        answer: 2,
        explain: "Physik-Mods stapeln sich multiplikativ (mit harten Grenzen).",
      },
    ],
    reward: { coins: 2500 },
  },
  {
    id: "maps",
    title: "4 · Karten & Objekte",
    goal: "Die Welt mit eigenen Objekten erweitern.",
    lesson: [
      "Ein Map-Mod fügt Objekte zur bestehenden Welt hinzu. Der Ursprung (0,0) ist die Mitte, die Welt ist quadratisch um diesen Punkt.",
      "Objekttypen: `building` (x, z, w, d, h, color), `ramp` (x, z, length, width, angleDeg 5–45, rotationDeg, color), `checkpoint` (x, z, radius, color) und `prop` (x, z, shape, size, color).",
      "Tipp: Baue Objekte nicht mitten auf die Rennstrecke — sonst blockierst du sie.",
      "Im Map-Editor kannst du alles visuell setzen und danach als Mod exportieren.",
    ],
    code: base("map", "Rampen-Park", `{
    "objects": [
      { "type": "ramp", "x": 120, "z": 20, "length": 20, "width": 8, "angleDeg": 20, "color": "#ff8844" },
      { "type": "building", "x": 140, "z": 60, "w": 20, "d": 20, "h": 18, "color": "#3a4a6b" }
    ]
  }`),
    task: {
      prompt: "Baue einen Map-Mod mit mindestens 3 Objekten, davon mindestens einer Rampe.",
      hint: "kind = \"map\", payload.objects mit ≥ 3 Einträgen, einer mit type \"ramp\".",
      starter: base("map", "Mein Parcours", `{
    "objects": [
      { "type": "ramp", "x": 100, "z": 0, "length": 18, "width": 8, "angleDeg": 15, "color": "#ff8844" }
    ]
  }`),
      check: (m) => {
        if (m.kind !== "map") return no("kind muss \"map\" sein.");
        const objs = m.payload.objects;
        if (objs.length < 3) return no(`Mindestens 3 Objekte nötig — du hast ${objs.length}.`);
        if (!objs.some((o) => o.type === "ramp")) return no("Mindestens eine Rampe (type \"ramp\") fehlt.");
        return ok("Starker Parcours — bereit für die Testfahrt!");
      },
    },
    quiz: [
      {
        question: "Welcher Winkelbereich ist für Rampen erlaubt?",
        options: ["0–90 Grad", "5–45 Grad", "1–30 Grad", "beliebig"],
        answer: 1,
        explain: "angleDeg muss zwischen 5 und 45 liegen.",
      },
      {
        question: "Wo liegt der Ursprung der Weltkoordinaten?",
        options: ["In der Ecke unten links", "In der Mitte der Welt", "Am Startpunkt des Autos", "Am ersten Gebäude"],
        answer: 1,
        explain: "(0,0) ist die Mitte der Welt.",
      },
    ],
    reward: { coins: 3000, pack: "standard" },
  },
  {
    id: "content",
    title: "5 · Missionen & Sammelitems",
    goal: "Eigene Spielinhalte erstellen.",
    lesson: [
      "Missions-Mods enthalten eine Liste von Missionen mit `id`, `title`, `desc`, `goalKind` (distance, topSpeed, drift, airtime, collect), `goal` und `reward`.",
      "Item-Mods enthalten eine Liste von Sammelitems mit `id`, `name`, `desc`, `emoji` und `rarity`.",
      "Achte auf faire Belohnungen: Eine Mission über 2000 Meter sollte nicht 1 Million Coins geben.",
    ],
    code: base("mission", "Langstrecke", `{
    "missions": [
      { "id": "m-long", "title": "Marathon", "desc": "Fahre 10 km am Stück.", "goalKind": "distance", "goal": 10000, "reward": 5000 }
    ]
  }`),
    task: {
      prompt: "Baue einen Missions-Mod mit genau 2 Missionen, deren Belohnung jeweils höchstens 5000 Coins beträgt.",
      hint: "kind = \"mission\", payload.missions hat 2 Einträge, reward ≤ 5000.",
      starter: base("mission", "Mein Missions-Pack", `{
    "missions": [
      { "id": "m-1", "title": "Sprinter", "desc": "Erreiche 250 km/h.", "goalKind": "topSpeed", "goal": 250, "reward": 1200 }
    ]
  }`),
      check: (m) => {
        if (m.kind !== "mission") return no("kind muss \"mission\" sein.");
        const ms = m.payload.missions;
        if (ms.length !== 2) return no(`Genau 2 Missionen nötig — du hast ${ms.length}.`);
        if (ms.some((x) => x.reward > 5000)) return no("Keine Mission darf mehr als 5000 Coins geben.");
        return ok("Ausgewogen — genau so baut man gute Missionen.");
      },
    },
    quiz: [
      {
        question: "Welches Feld beschreibt, was eine Mission misst?",
        options: ["goal", "goalKind", "reward", "title"],
        answer: 1,
        explain: "`goalKind` legt die Art des Ziels fest, `goal` den Zielwert.",
      },
    ],
    reward: { coins: 3500, pack: "deluxe" },
  },
  {
    id: "packs",
    title: "6 · Packs: alles in einer Datei",
    goal: "Mehrere Inhalte zu einem Mod-Pack bündeln.",
    lesson: [
      "Ein Pack hat `kind: \"pack\"` und enthält unter `payload.mods` eine Liste vollständiger Einzel-Mods (1 bis 40 Stück).",
      "Jeder Eintrag in der Liste ist selbst ein kompletter Mod inklusive Envelope — nicht nur der payload.",
      "Beim Installieren wendet das Spiel alle enthaltenen Mods nacheinander an.",
      "Im Mod-Studio kannst du das im Reiter „📦 Pack" komplett ohne JSON zusammenklicken.",
    ],
    code: `{
  "format": "driftlab.mod",
  "version": 3,
  "kind": "pack",
  "id": "00000000-0000-0000-0000-000000000000",
  "name": "Mein Starter-Pack",
  "author": "DeinNick",
  "description": "Skin + Physik in einer Datei.",
  "priority": 0,
  "payload": {
    "mods": [
      ${base("skin", "Pack-Skin", `{ "primaryColor": "#ff2d55", "secondaryColor": "#111111", "metalness": 0.6, "roughness": 0.3, "targetBody": "any" }`).replace(/\n/g, "\n      ")},
      ${base("physics", "Pack-Physik", `{ "grip": 1.1 }`).replace(/\n/g, "\n      ")}
    ]
  }
}`,
    task: {
      prompt: "Baue ein Pack mit mindestens 2 unterschiedlichen Inhalts-Arten.",
      hint: "kind = \"pack\", payload.mods mit ≥ 2 Einträgen unterschiedlicher kinds.",
      starter: `{
  "format": "driftlab.mod",
  "version": 3,
  "kind": "pack",
  "id": "00000000-0000-0000-0000-000000000000",
  "name": "Mein Pack",
  "author": "DeinNick",
  "description": "",
  "priority": 0,
  "payload": {
    "mods": []
  }
}`,
      check: (m) => {
        if (m.kind !== "pack") return no("kind muss \"pack\" sein.");
        const kinds = new Set(m.payload.mods.map((x) => x.kind));
        if (m.payload.mods.length < 2) return no("Mindestens 2 Inhalte nötig.");
        if (kinds.size < 2) return no("Die Inhalte müssen unterschiedliche Arten haben.");
        return ok("Meisterhaft — du kannst jetzt komplette Content-Packs bauen!");
      },
    },
    quiz: [
      {
        question: "Wie viele Mods passen maximal in ein Pack?",
        options: ["5", "10", "40", "unbegrenzt"],
        answer: 2,
        explain: "1 bis 40 Einzel-Mods pro Pack.",
      },
      {
        question: "Was steht unter payload.mods?",
        options: ["nur payloads", "komplette Mods inkl. Envelope", "IDs anderer Mods", "Dateinamen"],
        answer: 1,
        explain: "Jeder Eintrag ist ein vollständiger Mod.",
      },
    ],
    reward: { coins: 6000, pack: "mythic" },
  },
];

/** Prüft eine Übungsaufgabe: erst JSON, dann Schema, dann Aufgabenlogik. */
export function checkTask(chapter: Chapter, raw: string): CheckResult {
  let json: unknown;
  try { json = JSON.parse(raw); }
  catch (e) { return no(`Kein gültiges JSON: ${e instanceof Error ? e.message : "Syntaxfehler"}`); }
  let mod: Mod;
  try { mod = parseMod(json); }
  catch (e) { return no(e instanceof Error ? e.message : "Mod ungültig."); }
  return chapter.task.check(mod);
}

/* ----------------------------- Fortschritt ---------------------------- */

const KEY = "garage:modCampaign";
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

export type Progress = {
  /** Kapitel-IDs mit gelöster Aufgabe. */
  tasks: string[];
  /** Kapitel-IDs mit bestandenem Test. */
  quizzes: string[];
  /** Kapitel-IDs, für die die Belohnung ausgezahlt wurde. */
  rewarded: string[];
};

export function getProgress(): Progress {
  try {
    const raw = safeLS()?.getItem(KEY);
    const p = raw ? JSON.parse(raw) : null;
    return {
      tasks: Array.isArray(p?.tasks) ? p.tasks : [],
      quizzes: Array.isArray(p?.quizzes) ? p.quizzes : [],
      rewarded: Array.isArray(p?.rewarded) ? p.rewarded : [],
    };
  } catch { return { tasks: [], quizzes: [], rewarded: [] }; }
}

export function saveProgress(p: Progress) {
  safeLS()?.setItem(KEY, JSON.stringify(p));
}

export function isChapterDone(p: Progress, id: string): boolean {
  return p.tasks.includes(id) && p.quizzes.includes(id);
}

export function isChapterUnlocked(p: Progress, index: number): boolean {
  if (index === 0) return true;
  return isChapterDone(p, CHAPTERS[index - 1].id);
}

export function campaignComplete(p: Progress): boolean {
  return CHAPTERS.every((c) => isChapterDone(p, c.id));
}
