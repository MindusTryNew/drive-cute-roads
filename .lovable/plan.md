
# Custom Car Builder + Mod-System

Ziel: Nutzer können eigene Autos mit Profi-Tuning bauen, sie über JSON-Mod-Pakete teilen und eigene 3D-Teile (GLB) hochladen. Limit: 3 neue Autos pro Tag, lokal im Browser.

## Umfang

### 1. Garage erweitern (`CarSelect.tsx`)
- Bestehende 3 Werks-Autos bleiben
- Neuer Bereich „Meine Autos" zeigt selbst erstellte Autos aus `localStorage`
- Button „+ Neues Auto bauen" (deaktiviert mit Countdown, wenn Tageslimit erreicht)
- Button „Mod importieren" (JSON-Datei einlesen)
- Pro Auto: Bearbeiten / Exportieren (JSON) / Löschen

### 2. Car-Builder (neu: `CarBuilder.tsx`)
Profi-Sliders mit Live-3D-Preview (rotierende Kamera, gleiches Three.js-Setup wie Simulator):

**Performance**
- 0–100 km/h (2.0–12.0 s)
- Top Speed (120–400 km/h)
- Bremsweg 100–0 (25–60 m)
- Gewicht (800–2500 kg)
- Gewichtsverteilung vorne/hinten (30/70 – 70/30)
- Antrieb (FWD / RWD / AWD)
- Getriebe: Anzahl Gänge (4–8) + Übersetzungen pro Gang

**Handling**
- Grip (0–100)
- Lenkwinkel (15–45°)
- Untersteuern ↔ Übersteuern Bias (−100 … +100)
- Federung Härte (0–100)

**Optik**
- Karosserie-Typ (Roadster / SUV / Hypercar / Truck / Kompakt)
- Primärfarbe + Sekundärfarbe (Color-Picker)
- Felgenfarbe, Felgengröße
- Spoiler an/aus + Höhe
- Glas-Tönung

Validierung mit `zod`. Werte werden in die Physik-Konstanten des Simulators als `maxSpeed`, `accel`, `turnSpeed`, `friction` umgerechnet.

### 3. Daten-Layer (`src/lib/garage.ts`)
- Schema `CustomCar` (zod) mit `id`, `name`, `createdAt`, `tuning`, `appearance`, `mods[]`
- `localStorage` Keys: `garage:cars`, `garage:dailyLimit` (`{ date: "YYYY-MM-DD", count: number }`)
- API: `listCars()`, `saveCar()`, `deleteCar()`, `canCreateToday()`, `remainingToday()`, `exportCar(id)`, `importCarJson(file)`
- Limit-Logik: pro Kalendertag max. 3 **neue** Autos; Bearbeiten zählt nicht
- Hinweis im UI: „Limit ist nur lokal — kann durch Browser-Cache-Reset umgangen werden."

### 4. Mod-System
**JSON-Mod-Pakete**
- Format: `{ version: 1, type: "mod", name, author, target: "any"|carId, patches: { tuning?, appearance? }, parts?: AssetRef[] }`
- Mods werden auf ein Auto angewendet (Patches überschreiben Werte additiv/multiplikativ je Feld-Typ)
- Mod-Manager im Builder: Liste installierter Mods, an/aus toggeln, entfernen
- Export: Download als `<carname>.car.json`; Auto + Mods in einer Datei

**Eigene 3D-Teile (GLB-Upload)**
- File-Input akzeptiert `.glb`/`.gltf` (max. 5 MB)
- In `IndexedDB` als Blob gespeichert (zu groß für localStorage)
- Pro Teil: Position (x/y/z), Rotation, Skalierung — Sliders im Builder
- Im Simulator lädt `GLTFLoader` die Teile und hängt sie an die `carGroup`
- Hinweis: kein Cloud-Sync, nur lokal

### 5. Simulator-Integration (`Simulator.tsx`)
- Akzeptiert jetzt `car: CarKey | CustomCar`
- Physik-Konstanten aus Tuning umgerechnet (deterministische Formeln, z. B. `accel` aus 0–100-Zeit)
- Karosserie-Geometrie nach `bodyType` (vorhandene Box-Geo erweitert um Roadster/Truck/Kompakt)
- Custom GLB-Parts werden nach Erstellung der `carGroup` geladen und positioniert

### 6. Routing
- `src/routes/index.tsx` State erweitert: `view: "garage" | "builder" | "sim"`
- Builder ist Vollbild mit Header („Zurück zur Garage" + „Speichern")

## Technisches

- Neue Dateien: `src/components/CarBuilder.tsx`, `src/lib/garage.ts`, `src/lib/mods.ts`, `src/lib/parts-store.ts` (IndexedDB-Wrapper, ~30 Zeilen, kein extra Package)
- Edits: `CarSelect.tsx`, `Simulator.tsx`, `routes/index.tsx`
- shadcn-Komponenten: `slider`, `input`, `label`, `button`, `card`, `tabs`, `dialog` (alle bereits da)
- `zod` bereits installiert
- Three.js `GLTFLoader` ist im `three`-Package enthalten — keine neuen Dependencies

## Out of scope (bewusst weggelassen)
- Cloud-Sync, Multi-Device, Login (Nutzerwunsch: rein lokal)
- Community-Marketplace für Mods (nur manueller JSON-Import/Export)
- Server-seitiges Limit (lokal reicht laut Nutzer)
- Sound-/Auspuff-Modding (kann später dazu)
