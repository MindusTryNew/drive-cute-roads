## Ziel
Modding-System runderneuern (Auto-Mods + Karten-Mods mit exakter Erkennung/Anwendung), Mod-Browser, Getriebe-Bug endgültig fixen, High-Speed-Handling deutlich sanfter/realistischer, Modding-Tutorial, bessere Minimap, alle 2 Min neue Missionen.

## 1. Modding — Format v2 (exakt & erweiterbar)

Neues Modul `src/lib/mods.ts` mit klarem, validiertem JSON-Format via Zod:

```json
{
  "format": "driftlab.mod",
  "version": 2,
  "kind": "car" | "map" | "part-pack" | "tuning-preset",
  "id": "uuid", "name": "...", "author": "...", "description": "...",
  "payload": { /* kind-spezifisch */ }
}
```

- **kind=car** → payload = vollständiger `CustomCar` (bestehendes Schema).
- **kind=map** → payload = `MapExtension`: Liste von Objekten (`building | ramp | hill | roadSegment | checkpoint`) mit `position/rotation/scale/color`.
- **kind=part-pack** → Liste von Parts (GLB als base64 embedded oder URL).
- **kind=tuning-preset** → Patches für Tuning-Werte.

**Erkennung/Anwendung:**
- `parseMod(json)` → validiert per Zod, gibt typisierten Mod zurück oder wirft mit klarem Fehlertext (Zeile/Feld).
- `applyMod(mod)` → Router pro `kind`: Car → in Garage speichern, Map → in `installedMapMods` (localStorage) + Live-Injection in `world.ts` via neuer `mountMapMods(scene)` API, Part-Pack → in IndexedDB (`parts-store.ts`), Preset → in Preset-Liste im Builder.
- Legacy v1 (bisherige `.car.json`) wird automatisch in v2 konvertiert.

## 2. Mod-Browser (Cloud, öffentlich)

Neue Tabelle `public.mods` mit RLS (analog `market_cars`):
- Felder: `id, author_nick, kind, name, description, payload jsonb, downloads int, uploaded_at`
- `SELECT TO anon` offen, `INSERT TO anon` mit CHECK auf `kind` und Payload-Struktur, kein UPDATE/DELETE.

Neue Komponente `src/components/ModBrowser.tsx`:
- Tabs: **Alle / Autos / Karten / Parts / Presets**
- Suche + Sortierung (neueste/beliebteste)
- „Installieren" (→ `applyMod`), „Hochladen"-Dialog (Datei-Upload + Nick + Beschreibung)
- Lokaler Tab „Meine Mods" zeigt installierte Mods mit Deaktivieren/Löschen

Server-Fns `src/lib/mods.functions.ts`: `listMods(kind?, search?)`, `uploadMod(payload)`, `incrementDownload(id)`.

Zugang: neuer Button „Mods" im Hauptmenü (`CarSelect.tsx`), führt zu `ModBrowser`.

## 3. Getriebe-Bug endgültig lösen

Root Cause: Auto-Shift arbeitet **rein geschwindigkeitsbasiert** — wenn Reibung/Widerstand die Beschleunigung unterhalb der berechneten Shift-Schwelle abschneidet, bleibt das Auto ewig im niedrigen Gang.

Fix in `Simulator.tsx` + `car-spec.ts`:
- **Zeit- & Beschleunigungs-basierter Upshift-Fallback:** Wenn im aktuellen Gang länger als `2.5 s` bei ≥95% der Ziel-Shift-Speed **oder** wenn dv/dt < `0.5 km/h/s` → nächster Gang.
- **Minimum-Shift-Spreizung:** In `shiftSpeeds()` erzwingen, dass jeder Wert mindestens 15 km/h über dem vorherigen liegt; sonst hochskalieren.
- **Letzter Gang = Top-Speed sichern:** Letzter Eintrag wird auf `topSpeed` gesetzt (auch bei degenerierten Ratios).
- **Debug-HUD** (nur wenn Quality-Settings „Debug" an): zeigt aktuelle Shift-Schwellen als Liste.

## 4. Sanfteres High-Speed-Handling (realistisch)

`car-spec.ts` `physicsFromTuning` + Input-Loop in `Simulator.tsx`:
- **Speed-abhängige Lenk-Dämpfung (stark):** `effectiveTurn = turnSpeed * (1 - min(0.85, (speed/maxSpeed)^1.4 * 0.9))` — bei Vmax nur noch ~15% Lenkeinschlag.
- **Lenkung Lerp-Faktor verringern:** von 0.15 auf 0.08 (weichere Eingabe).
- **Downforce-Simulation:** ab 60% maxSpeed steigende Reibung `friction += 0.005 * (speedRatio-0.6)`.
- **Trägheit auf Lenkinput:** zweistufiges Lerp (Input → target → applied) für „Analog-Gefühl".
- **Rollstabilisation:** kein plötzliches Ausbrechen — Yaw-Änderung pro Frame auf `0.03 rad` gedeckelt.
- **Throttle-Easing:** exponentielle Kurve (`throttle^1.5`) statt linear, glattere Beschleunigungs-Rampe.

## 5. Modding-Tutorial (umfangreich)

Neue Route `src/routes/tutorial.tsx` mit Kapiteln (Tab-Nav):
1. **Was ist ein Mod?** — Übersicht der 4 Kinds.
2. **Dein erstes Auto-Mod** — Schritt-für-Schritt: Builder öffnen, Export, JSON-Struktur erklärt, Upload.
3. **JSON-Format v2** — vollständige Schema-Referenz mit Beispielen für jedes Feld.
4. **Karten-Erweiterungen** — Koordinatensystem der Welt (WORLD_SIZE, Straßen, Hügel), Objekt-Typen, Live-Beispiel („Rampen-Rennstrecke").
5. **Parts (GLB)** — wie externe 3D-Modelle einbinden, Größen-Skalierung, Best-Practices.
6. **Veröffentlichen** — Upload-Flow im Mod-Browser, Nick, Beschreibung, Community-Regeln.
7. **Beispiel-Downloads** — 3 Musterdateien direkt herunterladbar (mini-hypercar.json, ramp-park.json, low-cost-preset.json).

Erreichbar über „Modding-Tutorial"-Button im Mod-Browser und im Hauptmenü.

## 6. Realistischere Minimap

`Simulator.tsx` `drawMinimap`:
- **Rotierbar mit Fahrtrichtung** (Toggle im HUD: North-Up / Heading-Up).
- **Zoom-Level** (3 Stufen, +/- Buttons).
- **North-Indicator** (kleines „N" mit Pfeil oben).
- **Icons statt Punkte:** Auto = Dreieck mit Farbe des Autos, Missions-Marker = kleine gelbe/grüne Pins mit Distanz-Label, Multiplayer-Spieler = farbige Dreiecke mit Nick.
- **Straßen-Rendering verbessert:** dickere Hauptstraßen, dünnere Nebenstraßen, Kreuzungen als kleine Quadrate.
- **Kompass-Ring** außen mit Grad-Marken.
- **Höhenlinien** für die Hügel-Zone (leichter Konturen-Fill).

## 7. Rotierende Missionen (alle 2 Min)

`src/lib/missions.ts` erweitern:
- Neue Funktion `getCurrentRotation()` gibt 3 aktive Missionen basierend auf `Math.floor(Date.now() / 120000)` als Seed zurück (deterministisch, alle Clients sehen dasselbe).
- Alte Aktive-Mission bleibt bis Abschluss, aber Auswahl-Pool rotiert.
- `MissionsPanel.tsx` zeigt Countdown „Neue Missionen in 1:23".
- Bei Rotation Toast: „🎯 3 neue Missionen verfügbar".
- Mission-Pool auf ~20 Varianten erweitert (Speed/Delivery/Time + neue Sub-Varianten mit unterschiedlichen Zielen).

## Technische Details

**Neue Files:**
- `src/lib/mods.ts` (Format v2, Parser, Applier)
- `src/lib/mods.functions.ts` (Cloud-Server-Fns)
- `src/lib/map-mods.ts` (Runtime-Injection in Scene)
- `src/components/ModBrowser.tsx`
- `src/routes/tutorial.tsx`
- 3 Beispiel-Mod-Dateien unter `public/mods/`

**Editierte Files:**
- `src/lib/car-spec.ts` (Shift-Fix, Handling)
- `src/lib/missions.ts` (Rotation, Pool-Erweiterung)
- `src/components/Simulator.tsx` (Shift-Fallback, Handling-Loop, Minimap-Rewrite, Rotation-Toast)
- `src/components/MissionsPanel.tsx` (Countdown)
- `src/components/CarSelect.tsx` (Mods-Button, Tutorial-Button)
- `src/lib/world.ts` (Mount-Point für Map-Mods)
- `src/lib/garage.ts` (Import-Path für v2)
- `src/routes/index.tsx` (Views für Mods/Tutorial)

**Migration:** `public.mods` Tabelle mit RLS + GRANTs.

**Keine neuen Dependencies.**

## Out of Scope
- Mod-Signaturen/Verifizierung
- Kommentare/Ratings im Mod-Browser
- Live-Editor für Karten-Mods (bleibt JSON-basiert, Tutorial erklärt es)
- Versionierung/Updates von hochgeladenen Mods
- Skript-Mods (nur Daten, kein Custom-Code aus Sicherheitsgründen)
