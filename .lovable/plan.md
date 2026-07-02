## Bugfixes

**1. Missionen zahlen keine Coins.**
Root Cause: `completeMission` ruft `addCoins()` synchron, aber `setMissionState({ progress: 1 })` und `activeMission = null` laufen in derselben Frame. In seltenen Fällen wird `completeMission` mehrfach ausgelöst, bevor `activeMission` genullt ist — der zweite Aufruf bricht wegen `done.includes(id)` ab, aber der erste hätte laut Logs die Coins gegeben. Tatsächliches Problem: **`getActiveMission()` wird nur beim Sim-Start einmal ausgewertet** (Closure-Variable `activeMission`). Wenn im Missions-Screen eine Mission gewählt wird während der Sim läuft → nichts. Und: `addCoins` gibt zwar `coins` weiter, aber der HUD im Garage-Screen liest sie nur beim Mount, ohne Subscribe → Nutzer sieht keine Änderung und denkt „keine Coins".
Fix:
- `Simulator`: `activeMission` bei jedem Frame aus `getActiveMissionId()` neu lesen (leichte Lookup), damit Mission-Wechsel greift; nach Completion einen Toast „+X 🪙" einblenden, damit die Auszahlung sichtbar ist.
- `CarSelect` und alle Screens, die Coins anzeigen, per `subscribeCoins` re-rendern.

**2. Gangschaltung — nur visuell, nicht technisch.**
Wunsch: Motor/Beschleunigung soll nicht mehr an Gangwechsel gekoppelt sein (verursacht Hänger). Gang-Anzeige bleibt als reines UI-Element.
Fix in `Simulator.tsx`:
- Entferne Downshift-Freeze-Effekt und den 2.5-s-Fallback-Loop. Beschleunigung nutzt nur `physicsFromTuning` (accel + friction + maxSpeed), keine ratio-basierten Kappungen.
- Für die HUD-Anzeige: `visualGear = 1 + count(shifts.filter(s => kmh >= s))`, `nextShift = shifts[visualGear-1] ?? null`. Kein Effekt auf Physik.
- `shiftSpeeds` bleibt bestehen für die Anzeige und Builder-Preview.

## Content

**3. Map-Editor (internes Tool).**
Neue Route `/map-editor` erreichbar über Button „🗺️ Map-Editor" im Mod-Browser und in `CarSelect`.
- 3D-Viewport (three.js) mit Draufsicht + freier Kamera. Grid + Grundfläche identisch zur Welt.
- Toolbar: **Gebäude · Rampe · Hügel · Straßensegment · Checkpoint**. Klick auf Grundfläche platziert Objekt, Drag zum Verschieben, Rechts-Panel für `position/rotation/scale/color`.
- Speichern → erzeugt ein v2-Mod `{kind:"map", payload:{objects:[...]}}` und ruft `applyMod()` (lokal installieren) + optional „In Mod-Browser hochladen".
- Laden bestehender Map-Mods aus `installedMapMods` als Bearbeitungs-Basis.
- Nutzt bereits vorhandenes `mountMapMods` (world.ts), kein neuer Runtime-Code.

**4. Tuning.**
Kurze Klärung vor der Umsetzung: siehe Frage unten. Grund-Update:
- CarBuilder-Tuning-Sektion um Presets („Straße", „Rennstrecke", „Drift", „Offroad") + „Auf Standard zurücksetzen" ergänzen.
- Live-0-100- und Bremsweg-Simulation im Builder (headless run gegen `physicsFromTuning`), damit Werte spürbar werden.

**5. Navigationssystem für die Minimap.**
- „Ziel setzen" per Rechtsklick auf die Minimap → speichert Weltkoordinate.
- Auf der Minimap: pulsierender Ziel-Pin + gestrichelte Linie vom Auto zum Ziel; Distanzlabel.
- In der 3D-Welt: schwebender Ziel-Beacon (Beam) + kleine Richtungspfeil-HUD-Anzeige „↖ 240 m".
- Bei aktiver Delivery-Mission wird der jeweils aktuelle Pickup/Drop automatisch als Navigationsziel gesetzt.

**6. DevMode.**
- Neuer localStorage-Flag `garage:devMode` (bool). Freischaltung durch:
  - Kauf für 50.000 🪙 (Button „🛠️ DevMode freischalten" in `CarSelect`, sichtbar solange nicht aktiv).
  - Einlösen des Codes `D3VM0DE999XXX` (siehe Punkt 7).
- Effekte wenn aktiv:
  - CarBuilder ignoriert Coin-Kosten und Slot-Limit.
  - Keine Marktgebühr, keine Tageslimits.
  - Neuer „Dev"-Tab im HUD des Simulators: FPS/Kamera-Cheats, Teleport zum Cursor auf Minimap, unbegrenzte Beschleunigung, Debug-Overlays (Kollisionsboxen, Shift-Schwellen).
  - Coins können im DevMode-Panel gesetzt werden.

**7. Premium-Codes.**
- Neue Datei `src/lib/premium-codes.ts` mit statischem Katalog:
  ```
  D3VM0DE999XXX → unlockDevMode
  ```
  (Katalog erweiterbar; jeder Code hat `reward: "devmode" | { coins: number } | { slot: 1 } | ...`.)
- Speicherung eingelöster Codes in `localStorage["garage:redeemed"]`. Jeder Code **nur einmal** einlösbar pro Browser.
- UI: neuer Button „🎁 Code einlösen" in `CarSelect` öffnet Dialog mit Input + Toast bei Erfolg/„bereits eingelöst"/„ungültig".

## Technische Details

**Neue Files:**
- `src/routes/map-editor.tsx`
- `src/components/MapEditor.tsx` (three.js Viewport + Tools)
- `src/lib/premium-codes.ts`
- `src/lib/devmode.ts` (Flag + Subscribe)
- `src/lib/navigation.ts` (Ziel-State + Subscribe)
- `src/components/RedeemCodeDialog.tsx`
- `src/components/DevPanel.tsx`

**Editierte Files:**
- `src/components/Simulator.tsx` (Mission-Refresh, Gang nur visuell, Nav-Beacon, DevPanel-Hook, Minimap-Ziel-Klick)
- `src/components/MissionsScreen.tsx` (Toast bei Reward — optional, primär im Sim)
- `src/components/CarSelect.tsx` (Coins-Subscribe, Buttons für DevMode-Kauf, Code einlösen, Map-Editor)
- `src/components/CarBuilder.tsx` (DevMode-Bypass, Tuning-Presets, Live-Simulation)
- `src/components/ModBrowser.tsx` (Link zum Map-Editor)
- `src/lib/car-spec.ts` (`shiftSpeeds` bleibt, keine Physik-Nutzung mehr im Sim)
- `src/routes/index.tsx` (Route für Map-Editor View)

**Keine Migration nötig.** Alles lokal (localStorage) — Codes sind clientseitig, entsprechend keine Anti-Cheat-Härtung.

## Klärungsfrage

Was genau soll unter „Tuning" erweitert werden — nur die genannten Presets + Live-Simulation im Builder, oder soll DevMode zusätzlich einen In-Sim-Tuning-Slider (während der Fahrt Werte ändern) bekommen?

## Out of Scope
- Server-seitige Code-Validierung / Rate-Limit (Codes sind rein lokal).
- Kollaborativer Map-Editor.
- Wegfindung mit A* — die Navigation ist eine Luftlinien-Anzeige, keine Routenberechnung.
