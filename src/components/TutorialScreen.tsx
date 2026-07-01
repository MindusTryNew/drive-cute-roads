import { useState } from "react";
import { Button } from "@/components/ui/button";

type Chapter = { id: string; title: string; body: JSX.Element };

const EXAMPLE_CAR = `{
  "format": "driftlab.mod",
  "version": 2,
  "kind": "car",
  "id": "00000000-0000-0000-0000-000000000001",
  "name": "Mini Hypercar",
  "author": "DeinNick",
  "description": "Kleiner, extrem schneller Prototyp.",
  "payload": {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "Mini Hypercar",
    "createdAt": 1700000000000,
    "tuning": {
      "time0to100": 1.8, "topSpeed": 480, "brakeDist": 22,
      "weight": 800, "weightDistFront": 45, "drive": "AWD",
      "gears": 7, "gearRatios": [3.6, 2.7, 2.0, 1.5, 1.15, 0.9, 0.7],
      "grip": 110, "steerAngle": 34, "handlingBias": 5, "suspension": 60
    },
    "appearance": {
      "bodyType": "racer", "primaryColor": "#ff2d55",
      "secondaryColor": "#0a0e1a", "wheelColor": "#111111",
      "wheelSize": 19, "spoiler": true, "spoilerHeight": 0.7, "glassTint": 0.6
    },
    "parts": [], "mods": []
  }
}`;

const EXAMPLE_MAP = `{
  "format": "driftlab.mod",
  "version": 2,
  "kind": "map",
  "id": "00000000-0000-0000-0000-000000000002",
  "name": "Ramp Park",
  "author": "DeinNick",
  "description": "Ein Rampen-Parkplatz östlich der Rennstrecke.",
  "payload": {
    "objects": [
      { "type": "ramp",     "x": 120, "z": 20,  "length": 20, "width": 8,  "angleDeg": 20, "color": "#ff8844" },
      { "type": "ramp",     "x": 160, "z": 20,  "length": 20, "width": 8,  "angleDeg": 25, "rotationDeg": 180, "color": "#44aaff" },
      { "type": "building", "x": 140, "z": 60,  "w": 20, "d": 20, "h": 18, "color": "#3a4a6b" },
      { "type": "prop",     "x": 100, "z": 40,  "shape": "cone",     "size": 2, "color": "#f6d96a" },
      { "type": "prop",     "x": 108, "z": 40,  "shape": "cone",     "size": 2, "color": "#f6d96a" },
      { "type": "checkpoint","x":140, "z": 0,   "radius": 6, "color": "#4ade80" }
    ]
  }
}`;

const EXAMPLE_PRESET = `{
  "format": "driftlab.mod",
  "version": 2,
  "kind": "tuning-preset",
  "id": "00000000-0000-0000-0000-000000000003",
  "name": "City Cruiser",
  "author": "DeinNick",
  "description": "Sanftes City-Setup mit langer Übersetzung.",
  "payload": {
    "patch": {
      "topSpeed": 180, "time0to100": 8.5, "brakeDist": 40,
      "gears": 5, "gearRatios": [3.2, 2.1, 1.5, 1.1, 0.8]
    }
  }
}`;

function download(name: string, txt: string) {
  const blob = new Blob([txt], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-background/60 p-3 font-mono text-[11px] leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

const CHAPTERS: Chapter[] = [
  {
    id: "intro",
    title: "1. Was ist ein Mod?",
    body: (
      <div className="space-y-3 text-sm">
        <p>Ein <b>Mod</b> ist eine JSON-Datei mit dem Format <code>driftlab.mod</code> Version 2. Es gibt vier Arten:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><b>car</b> — ein komplettes Auto (Tuning, Aussehen, Parts, Sub-Mods).</li>
          <li><b>map</b> — Objekte, die zusätzlich zur Welt gespawnt werden (Rampen, Gebäude, Props, Checkpoints).</li>
          <li><b>part-pack</b> — externe 3D-Modelle (GLB, base64-encoded), die im Auto-Editor als Parts nutzbar sind.</li>
          <li><b>tuning-preset</b> — vorgefertigte Tuning-Werte, die im Auto-Builder ausgewählt werden können.</li>
        </ul>
        <p>Alle Mods werden <b>strikt validiert</b>. Wenn ein Feld fehlt oder falsch ist, zeigt das Spiel die genaue Fehlerstelle an.</p>
      </div>
    ),
  },
  {
    id: "first-car",
    title: "2. Dein erstes Auto-Mod",
    body: (
      <div className="space-y-3 text-sm">
        <ol className="ml-5 list-decimal space-y-2">
          <li>Öffne die <b>Garage</b> → „+ Neues Auto bauen".</li>
          <li>Stelle Tuning + Aussehen ein und speichere.</li>
          <li>Klick in der Garage bei deinem Auto auf <b>Export</b>. Du erhältst eine <code>.car.json</code>.</li>
          <li>Wandle die Datei in Format v2 um (siehe nächstes Kapitel) und lade sie im <b>Mod-Browser</b> hoch.</li>
        </ol>
        <p>Legacy-Exporte (<code>{"{ car: {...} }"}</code>) werden beim Import automatisch in v2 konvertiert — du kannst also auch alte Dateien einfach hochladen.</p>
      </div>
    ),
  },
  {
    id: "format",
    title: "3. Format v2 im Detail",
    body: (
      <div className="space-y-3 text-sm">
        <p>Jeder Mod hat diese Grundstruktur:</p>
        <Code>{`{
  "format": "driftlab.mod",
  "version": 2,
  "kind": "car" | "map" | "part-pack" | "tuning-preset",
  "id": "<uuid>",
  "name": "<2-60 Zeichen>",
  "author": "<1-24 Zeichen>",
  "description": "<optional, max 500>",
  "payload": { /* je nach kind */ }
}`}</Code>
        <p><b>Beispiel: Car-Mod</b> (kompletter Payload):</p>
        <Code>{EXAMPLE_CAR}</Code>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => download("mini-hypercar.car.mod.json", EXAMPLE_CAR)}>Beispiel herunterladen</Button>
        </div>
      </div>
    ),
  },
  {
    id: "map",
    title: "4. Karten-Erweiterungen",
    body: (
      <div className="space-y-3 text-sm">
        <p>Die Welt ist <b>800 × 800 Meter</b>. Ursprung (0, 0) ist die Mitte, die Rennstrecke liegt zentriert. Straßen liegen bei X/Z = ±90, ±180, ±300. Die Offroad-/Hügel-Zone befindet sich im Nordost-Quadranten (X &gt; 60, Z &lt; −60).</p>
        <p>Ein Map-Mod fügt Objekte hinzu. Objekttypen:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><b>building</b> — Box mit Kollision. Felder: <code>x, z, w, d, h, color</code>.</li>
          <li><b>ramp</b> — Sprungrampe. Felder: <code>x, z, length, width, angleDeg (5–45), rotationDeg, color</code>.</li>
          <li><b>checkpoint</b> — Ring-Marker. Felder: <code>x, z, radius, color</code>.</li>
          <li><b>prop</b> — Dekoration. Felder: <code>x, z, shape ("box" | "sphere" | "cone" | "cylinder"), size, color</code>.</li>
        </ul>
        <p><b>Beispiel: Rampen-Park</b></p>
        <Code>{EXAMPLE_MAP}</Code>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => download("ramp-park.map.mod.json", EXAMPLE_MAP)}>Beispiel herunterladen</Button>
        </div>
        <p className="text-xs text-muted-foreground">Tipp: Vermeide Objekte innerhalb der Rennstrecken-Ring (Radius ~60 vom Zentrum), sonst blockierst du sie.</p>
      </div>
    ),
  },
  {
    id: "parts",
    title: "5. Parts (GLB-Modelle)",
    body: (
      <div className="space-y-3 text-sm">
        <p>Parts sind externe 3D-Modelle im GLB-Format, die dem Auto angehängt werden können (Spoiler, Motorhauben-Scoops, Custom-Karosserien).</p>
        <p><b>So packst du Parts in einen Mod:</b></p>
        <ol className="ml-5 list-decimal space-y-2">
          <li>Konvertiere dein GLB in base64 (z.B. mit <code>base64 -w0 datei.glb</code>).</li>
          <li>Füge es unter <code>payload.parts[i].glbBase64</code> ein.</li>
        </ol>
        <Code>{`{
  "format": "driftlab.mod", "version": 2, "kind": "part-pack",
  "id": "<uuid>", "name": "Wide-Body Kit", "author": "DeinNick",
  "description": "",
  "payload": {
    "parts": [
      { "id": "widebody-front", "name": "Front-Fender", "scale": 1.0, "glbBase64": "<...>" }
    ]
  }
}`}</Code>
        <p className="text-xs text-muted-foreground">Best Practice: Halte Parts &lt; 500 KB — große base64-Strings blähen das Cloud-JSON auf.</p>
      </div>
    ),
  },
  {
    id: "presets",
    title: "6. Tuning-Presets",
    body: (
      <div className="space-y-3 text-sm">
        <p>Ein Preset patcht nur einzelne Tuning-Werte — alle nicht angegebenen Felder bleiben Standard.</p>
        <Code>{EXAMPLE_PRESET}</Code>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => download("city-cruiser.preset.mod.json", EXAMPLE_PRESET)}>Beispiel herunterladen</Button>
        </div>
      </div>
    ),
  },
  {
    id: "publish",
    title: "7. Veröffentlichen",
    body: (
      <div className="space-y-3 text-sm">
        <ol className="ml-5 list-decimal space-y-2">
          <li>Öffne den <b>Mod-Browser</b> und klick <b>„+ Mod hochladen"</b>.</li>
          <li>Wähle deine <code>.mod.json</code>-Datei — das Spiel erkennt Typ und Name automatisch.</li>
          <li>Gib deinen Nick (2–24 Zeichen) und optional eine Beschreibung ein.</li>
          <li>„Hochladen" — sofort für alle Spieler sichtbar.</li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Community-Regeln: keine beleidigenden Namen/Beschreibungen, keine kopierten Assets ohne Erlaubnis, keine Mods die andere Spieler stören sollen. Uploads können nicht bearbeitet werden — überprüfe deine Datei vor dem Upload.
        </p>
      </div>
    ),
  },
];

export function TutorialScreen({ onBack }: { onBack: () => void }) {
  const [active, setActive] = useState(0);
  const c = CHAPTERS[active];

  return (
    <main className="relative h-screen w-screen overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}>← Zurück</Button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Modding-Tutorial</p>
            <h1 className="text-xl font-bold">Autos, Karten & Parts selbst bauen</h1>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[220px,1fr]">
        <nav className="space-y-1">
          {CHAPTERS.map((ch, i) => (
            <button key={ch.id}
              onClick={() => setActive(i)}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm ${i === active ? "border-primary bg-primary/10" : "border-border"}`}>
              {ch.title}
            </button>
          ))}
        </nav>
        <article className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-2xl font-bold">{c.title}</h2>
          {c.body}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" disabled={active === 0} onClick={() => setActive(active - 1)}>← Vorheriges</Button>
            <Button disabled={active === CHAPTERS.length - 1} onClick={() => setActive(active + 1)}>Nächstes →</Button>
          </div>
        </article>
      </div>
    </main>
  );
}
