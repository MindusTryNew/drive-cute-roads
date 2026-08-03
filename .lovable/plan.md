Plan: Finales Update „Drift Lab v2.0 – Farewell“

Ziel: Das Spiel bekommt fünf letzte, gut spielbare Systeme, die das Erlebnis abrunden, und wir verabschieden uns mit einer großen Belohnung. Gleichzeitig wird der bekannte SSR-Runtime-Fehler „localStorage is not defined“ behoben.

```text
Garage (CarSelect)
├── News-Button → NewsPanel
├── Premium-Pass-Button → PremiumPassPanel
└── Farewell-Geschenk-Modal (einmalig)

Simulator
└── Erweiterte Minimap (Zoom, POIs, Trail, Zielsetzung)

MapEditor
└── Mehr Werkzeuge, Undo/Redo, Snap, Test-Drive
```

---

## 1. SSR-Fix: localStorage während Server-Rendering schützen

Befund: Mehrere `src/lib/*.ts`-Module greifen ungeschützt auf `localStorage` zu. Beim SSR existiert `localStorage` nicht, daher bricht React beim Hydratieren ab.

Betroffene Dateien (aus `rg localStorage`):
- `src/lib/garage.ts` (Zeilen 122, 131, 156, 169)
- `src/lib/mods.ts` (Zeilen 201, 208, 213, 243)
- `src/lib/devmode.ts` (Zeilen 9, 12, 13)
- `src/lib/perf.ts` (Zeilen 24, 29)
- `src/lib/missions.ts` (Zeilen 115, 118, 119, 129, 141, 152, 157)
- `src/lib/premium-codes.ts` (Zeilen 19, 26)
- `src/lib/market.ts` (Zeilen 61, 64)
- `src/components/ModBrowser.tsx` (Zeilen 47, 96)

Maßnahme:
- In jeder betroffenen Datei einen `safeLS()`-Helper einführen: `const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);`
- Alle direkten `localStorage.getItem/setItem/removeItem`-Aufrufe durch `safeLS()?.getItem(...)` etc. ersetzen.
- Bei `useState(localStorage.getItem(...))` in `ModBrowser.tsx` den Wert in `useEffect` nachhydratieren oder `typeof localStorage !== "undefined" ? ... : ""` verwenden.
- Dateien, die bereits `safeLS()` haben (`coins.ts`, `inventory.ts`, `collection.ts`, `regions.ts`, `prestige.ts`, `daily-streak.ts`, `active-effects.ts`, `bundle-shop.ts`, `save-sync.ts`), bleiben unverändert.

---

## 2. Stark verbesserte Minimap

Aktuell: 200 px runde Canvas-Minimap, Kopie im Vollbildmodus ist nur ein hochskaliertes Pixelbild.

Neu:
- Separate, hochauflösende Vollbild-Minimap (`MiniMap.tsx` oder inline in `Simulator.tsx`), die denselben World-Status live neu rendert.
- Quadratisches Minimap-Widget statt Kreis (mehr nutzbarer Raum, weiterhin rund abrundbar möglich).
- Zoom per Mausrad mit korrektem Ankerpunkt (kein abruptes Springen; Formel aus Wheel-Zoom-Knowledge).
- Zusätzliche POI-Overlays:
  - Aktiver Missions-Marker (gelb/grün) mit Distanz-Label.
  - Welt-Paket-Beacons (Farbe je Pakettyp).
  - Region-Namen (Stadt, Offroad, Hügel, Tal, Stunt, Strand).
  - Eigener Fahrzeug-Trail (letzte ~60 Positionen).
- Klick auf die Vollbild-Minimap setzt ein Navigations-Ziel (wiederverwendet `setDest` aus `src/lib/navigation.ts`).
- Tastenkürzel `M` öffnet/schließt Vollbild-Minimap.

Technisch:
- `drawMinimap(ctx, opts)` in eine eigene Funktion auslagern, die sowohl Widget als auch Vollbild bedient.
- `MM_SIZE` auf 320 px erhöhen; Vollbild-Canvas auf `min(90vw,90vh)` mit `devicePixelRatio` skalieren.

---

## 3. Premium-Pass (wöchentliche Coin-Zahlung)

Konzept: Ein optionaler In-Game-Pass, der jede Woche Coins kostet und dafür dauerhafte Boni gibt.

Speicher (`src/lib/premium-pass.ts`):
- `pass_state` in localStorage: `{ active: boolean; startedAt: number; paidUntil: number; weeklyCost: number }`.
- Standardkosten: 5 000 Coins/Woche.
- Boni, solange aktiv:
  - +20 % Coins aus allen Quellen (Missionen, Verkauf, Items).
  - +20 % XP für Prestige.
  - Einmal pro Woche ein kostenloser Standard-Bundle im Bundle-Shop.
  - Exklusives „Premium“-Badge im Profil.

Integration:
- `src/lib/coins.ts`: `addCoins` prüft Pass-Status und multipliziert den Zugewinn mit `1.2`, falls aktiv.
- `src/lib/prestige.ts`: `awardXp` prüft Pass-Status und gibt `1.2`-fache XP.
- UI in `CarSelect.tsx`: neuer Button „Premium Pass“ neben „Daily“. Öffnet `PremiumPassPanel.tsx`.
- Im Panel: Status anzeigen, „Woche verlängern“-Button (prüft `spendCoins(cost)`), Info zu Boni.
- Wenn `paidUntil` in der Vergangenheit liegt, werden Boni pausiert; der Spieler kann erneut zahlen.

---

## 4. Map-Editor-Verbesserung

Aktuell: Grundlegende Platzierung, keine Undo/Redo, kein Snap, kein Test-Drive.

Neu:
- Undo/Redo-Stack für Objekt-Liste (`useRef` mit `past`/`future`).
- Tastenkürzel:
  - `Strg+Z` / `Strg+Y`.
  - `Entf` löscht selektiertes Objekt.
  - `D` dupliziert selektiertes Objekt.
- Snap-Grid-Toggle (z. B. 5 m Raster) für präzise Platzierung.
- Objekt-Liste im linken Panel: alle Objekte auflisten, selektieren, hoch/runter verschieben, löschen.
- Farb-Presets und eigene Farbeingabe.
- „Testfahrt“-Button: speichert die aktuelle Karte temporär als Map-Mod (`src/lib/mods.ts`), startet den Simulator im Solo-Modus mit einem Standard-Auto und wendet die Map-Mod an. Rückkehr zum Editor nach Beenden.
- Bessere Kamera-Steuerung: Wheel-Zoom mit korrektem Ankerpunkt (Wheel-Zoom-Knowledge).

Dateien:
- `src/components/MapEditor.tsx` erweitern.
- Optional `src/lib/map-editor-state.ts` für Undo/Redo/Snap-Logik.

---

## 5. News-System

Konzept: Spieler können aktuelle Nachrichten direkt in der Garage lesen.

Umsetzung:
- `src/lib/news.ts`: Statischer, datumsbasierter Feed mit Einträgen (Titel, Datum, Body, Typ: `info` | `update` | `event`).
- `src/components/NewsPanel.tsx`: Scrollbare Liste mit Markierung ungelesener Einträge; gelesene IDs werden in localStorage gespeichert.
- Eintrag in `CarSelect.tsx`: Button „News“ mit Badge, wenn ungelesene Einträge vorhanden.
- Inhalt: Patchnotes, Event-Ankündigungen, Hinweis auf das Farewell-Geschenk.

Optional später: Migration auf Supabase-Tabelle `news`, falls nachträglich News ohne Deploy geändert werden sollen. Für das finale Update reicht der statische Feed.

---

## 6. Farewell-Geschenk & Dankesnachricht

Konzept: Einmaliges Modal beim ersten Start nach dem Update. Es enthält einen langen Dankes-Text an die Spieler und schaltet eine große Belohnung frei.

Belohnung:
- 6 exklusive Voreinstellungs-Autos (z. B. „Aurora Finale“, „Monolith Legacy“, „Vortex Omega“, „Drift-Legende“, „Offroad-König“, „Strand-Cruiser“).
- 20 neue Sammelitems (eine „Farewell“-Serie in `src/lib/collectibles.ts`).
- 40 000 Coins.

Umsetzung:
- `src/lib/farewell-gift.ts`: Verwaltet den Claim-Status (`garage:farewellGiftClaimed`).
- `src/components/FarewellGiftDialog.tsx`: Vollbild-Dialog mit Dankes-Text, „Geschenk annehmen“-Button.
- `src/lib/preset-cars.ts`: 6 neue Autos hinzufügen.
- `src/lib/collectibles.ts`: 20 neue Items in einer neuen Serie (z. B. `farewell-*`) hinzufügen.
- `CarSelect.tsx`: Beim Mount prüfen, ob Geschenk offen ist, und Dialog anzeigen. Beim Annehmen:
  - Autos in Garage speichern (`saveCar`).
  - Items zur Collection hinzufügen (`addToCollection` für jedes Item).
  - `addCoins(40000)`.
  - Status auf claimed setzen.

---

## 7. Abhängigkeiten / keine neuen Pakete

Alle Features lassen sich mit bestehenden Abhängigkeiten umsetzen (React, Three.js, Zod, Supabase-Client). Keine neuen npm-Pakete nötig.

---

## 8. Test & Validierung

- Build (`bun run build` bzw. automatischer Build) muss fehlerfrei durchlaufen.
- SSR-Runtime-Fehler darf nicht mehr auftreten (lokaler `curl http://localhost:8080/` sollte keinen Hydration-Fehler zeigen).
- Manuelle Checks:
  - Premium-Pass kaufen, Mission abschließen → Coin-Boost sichtbar.
  - Map-Editor: Objekt platzieren, Undo, Snap, Testfahrt starten.
  - News-Panel öffnen, Eintrag lesen, Badge verschwindet.
  - Farewell-Geschenk annehmen → Garage/Coins/Collection aktualisieren.
  - Minimap: Zoom, Vollbild, Missions-Marker sichtbar.

---

## 9. Dateien, die geändert/erstellt werden

Geändert:
- `src/lib/garage.ts`
- `src/lib/mods.ts`
- `src/lib/devmode.ts`
- `src/lib/perf.ts`
- `src/lib/missions.ts`
- `src/lib/premium-codes.ts`
- `src/lib/market.ts`
- `src/lib/coins.ts` (Coin-Boost)
- `src/lib/prestige.ts` (XP-Boost)
- `src/lib/preset-cars.ts` (+6 Autos)
- `src/lib/collectibles.ts` (+20 Items)
- `src/components/ModBrowser.tsx`
- `src/components/Simulator.tsx` (Minimap)
- `src/components/MapEditor.tsx`
- `src/components/CarSelect.tsx` (Buttons für News, Premium, Farewell)

Neu:
- `src/lib/premium-pass.ts`
- `src/lib/news.ts`
- `src/lib/farewell-gift.ts`
- `src/components/PremiumPassPanel.tsx`
- `src/components/NewsPanel.tsx`
- `src/components/FarewellGiftDialog.tsx`
- Optional `src/lib/map-editor-state.ts`

---

Liegt der Plan so in Ordnung? Dann implementiere ich ihn Schritt für Schritt.