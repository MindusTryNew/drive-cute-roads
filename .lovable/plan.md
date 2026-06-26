
# Erweiterung: Unlimited Tuning, Big Map, Tag/Nacht, Multiplayer

## 1. Tuning ohne Limits (`CarBuilder.tsx`, `garage.ts`)
- Slider-`max` auf extreme Werte angehoben (Topspeed bis 10.000 km/h, 0-100 bis 0.1s, Bremse bis 5m, Gewicht 10-50.000 kg, Grip 0-500, Lenkwinkel bis 180°).
- Zusätzlich Zahleneingabe (`<Input type="number">`) neben jedem Slider — Slider ist nur Komfort, Wert kann frei darüber hinaus eingetippt werden.
- Zod-Schema: untere Grenzen bleiben (>0), obere Caps entfernt.
- Hinweisbanner: „Experimentell — Werte über Empfehlung können das Auto unkontrollierbar machen."
- `physicsFromTuning` bleibt formelbasiert (kein Hard-Clamp), nur numerische Sicherung gegen `NaN`/Negativ.

## 2. Map-Erweiterung (`Simulator.tsx` → neu: `src/lib/world.ts`)
World wird aus `Simulator.tsx` ausgelagert in `buildWorld(scene)`:
- **4× Fläche**: Ground 800×800, Fog auf 400 verschoben.
- **Straßennetz**: Grid aus 6 horizontalen + 6 vertikalen Asphalt-Streifen (BoxGeometry, dunkelgrau) mit gelben Mittellinien; bestehender Rundkurs bleibt als Race-Track in der Mitte.
- **Kreuzungen**: an jedem Schnittpunkt Asphalt-Quadrat + 4 weiße Zebrastreifen-Plates.
- **Offroad-/Hügel-Zone** (Nordost-Viertel): Plane mit Vertex-Displacement (Perlin-ähnlich via Sinus-Summen, deterministisch), Material sandbraun, eigene Kollisions-Heightmap. Auto „sackt" auf Bodenhöhe via Sample-Funktion `groundHeightAt(x,z)`.
- Mehr Gebäude (60 statt 18), entlang der Straßen verteilt; Tankstellen-Boxen, ein paar Brücken-Rampen am Übergang Stadt↔Offroad.
- Minimap: Skala auf neue Weltgröße angepasst, Straßen als hellgraue Linien gezeichnet.

## 3. Tag/Nacht-Zyklus (`src/lib/day-night.ts` + `Simulator.tsx`)
- 120 s = 1 voller Zyklus, `t = (clock.elapsedTime % 120) / 120`.
- Sonnen-Position auf Kreisbahn (Azimuth + Höhe), unter Horizont → Mond (HemisphereLight kühlt ein).
- Farb-LUT für 5 Phasen (Dawn / Day / Dusk / Night / DeepNight): `scene.background`, `scene.fog.color`, `sun.color`, `sun.intensity`, Hemilight-Farben werden interpoliert.
- Nachts: Scheinwerfer des Autos automatisch heller (SpotLight intensity 2→5), Straßenlaternen entlang der Straßen leuchten (kleine PointLights an Lampenmasten, nur nachts aktiv für Perf).
- HUD: kleine Uhr oben (z. B. „14:30").

## 4. Multiplayer — Lokal & Online
Hauptmenü-Modus-Wahl in `CarSelect.tsx`: **Solo / Split-Screen / Online**.

### 4a. Split-Screen (`Simulator.tsx`)
- Zweiter `carGroup` + zweite `PerspectiveCamera`.
- Renderer mit `setScissorTest`, zwei Viewports nebeneinander (vertikal geteilt).
- Spieler 1: WASD + Space. Spieler 2: Pfeiltasten + RShift.
- Beide HUDs (Speed/Gear/Minimap) gespiegelt pro Hälfte.
- Auto-Auswahl: Builder-Flow wählt zwei Autos hintereinander.

### 4b. Online (Lovable Cloud + Supabase Realtime Broadcast)
- **Cloud aktivieren** (falls noch nicht): Hinweis ans User, dass Online-MP Lovable Cloud benötigt.
- Keine DB-Tabelle nötig — nur Realtime-Broadcast-Channel pro Raum.
- Neuer Screen `Lobby.tsx`: Raum-Code eingeben/erstellen (6-stellig, zufällig), Nickname.
- Channel-Name `room:<code>`. Jeder Client sendet ~15 Hz `{playerId, x, z, ry, speed, name, color}` via `channel.send({type:'broadcast', event:'pose', payload})`.
- Empfänger hält `Map<playerId, RemoteCar>`; Remote-Autos werden mit gleichem `buildCarGroup` (Default-Spec, eigene Farbe) gerendert und per Lerp interpoliert.
- Keine Kollision zwischen Spielern (nur visuell), kein Server-State, kein Anti-Cheat — bewusst leichtgewichtig.
- Spielername schwebt über Auto (CSS2DRenderer oder Sprite).
- Disconnect: `channel.on('presence', ...)` zum Aufräumen.

## 5. Routing & State (`src/routes/index.tsx`)
View erweitert: `garage | builder | sim | splitsim | lobby | onlinesim`. Mode-Auswahl im Garage-Header (Tabs „Solo / 2-Player / Online").

## Technisches
- Neue Dateien: `src/lib/world.ts`, `src/lib/day-night.ts`, `src/lib/multiplayer.ts`, `src/components/Lobby.tsx`, `src/components/SplitSimulator.tsx` (oder Flag in `Simulator.tsx`).
- Geänderte Dateien: `Simulator.tsx`, `CarBuilder.tsx`, `CarSelect.tsx`, `garage.ts`, `routes/index.tsx`, `car-spec.ts` (Zod-Caps lösen).
- Dependencies: keine neuen — Supabase-Client kommt mit Lovable Cloud, Three.js hat alles.
- Lovable Cloud wird im selben Schritt aktiviert (nur Realtime, keine Tabellen).

## Out of scope
- Persistente Online-Räume, Chat, Voice, Server-Physik, Anti-Cheat.
- Spieler-vs-Spieler-Kollision (nur visuell).
- Wetter (Regen/Schnee) — kann später dazu.
- Verkehr (KI-Autos).
