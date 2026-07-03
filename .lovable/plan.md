## Bugfix: Autos beschleunigen nicht bis Top-Speed

**Root Cause (nachgerechnet in `physicsFromTuning`):**
Das Physik-Modell nutzt multiplikative Reibung: `v += accel; v *= friction`. Endgeschwindigkeit ist dann `accel / (1 - friction)` — nicht `maxSpeed`. Ergebnis mit aktuellen Werten:

| Auto        | topSpeed | Terminal aus Formel | = km/h  |
|-------------|----------|---------------------|---------|
| Aurora GT   | 260      | 0.00434 / 0.0412    | **40**  |
| Monolith X  | 200      | 0.00180 / 0.038     | **18**  |
| Vortex R1   | 340      | 0.00918 / 0.0348    | **99**  |

Die von den Nutzern gemeldeten Grenzwerte matchen exakt. `gearRatios` sind unbeteiligt (Gänge sind seit letztem Update rein visuell).

**Fix in `src/lib/car-spec.ts` (`physicsFromTuning`):**
- Umbau auf Drag-Modell: `drag = accel / maxSpeed` → Terminal = `maxSpeed` per Konstruktion.
- `accel` wird so kalibriert, dass `v(t) = vmax·(1 − e^(−drag·t·60))` bei `t = t100` exakt 100 km/h erreicht: `accel = -ln(1 - 100/topSpeed) · maxSpeed / (t100·60)` (mit Clamp für `topSpeed ≤ 100`).
- Rückgabe erhält neues Feld `drag` statt `friction`. `Simulator.updatePlayer` wechselt Zeile 292/297 auf `v += (accel·throttle - drag·v) ; v -= brake·v·0.08`. Downforce bleibt als leichte Zusatzreibung, aber additiv über `drag`, sodass Terminal ≤ maxSpeed statt darunter.
- `reverseFactor` bleibt.

**Verifikation:** Anschließend im Simulator jeweils Aurora / Monolith / Vortex Vollgas fahren und HUD-km/h gegen `topSpeed` prüfen (Toleranz ±3 km/h).

---

## Sammel-Update (Collectibles-System)

**Datenmodell (rein lokal, `localStorage`):**
- `src/lib/collectibles.ts` — Katalog aus **150+ Items** in Rarity-Tiers:
  - `common` (60), `uncommon` (45), `rare` (30), `epic` (12), `legendary` (5).
  - Jedes Item: `{ id, name, desc, rarity, emoji, effect?: Effect }`.
  - `Effect` = `{ kind: "coins", amount } | { kind: "perm", stat: "accel"|"topSpeed"|"grip"|"brake", pct } | { kind: "temp", stat, pct, seconds } | { kind: "cosmetic" }`.
- **4 Paket-Typen** mit unterschiedlicher Größe & Drop-Verteilung:
  - `starter` (3 Items, 90 % common/uncommon)
  - `standard` (5 Items, +rare Chance)
  - `deluxe` (8 Items, garantiert 1 rare, epic möglich)
  - `mythic` (12 Items, garantiert 1 epic, legendary möglich)
- `inventoryStore` (Pakete) & `collectionStore` (gefundene Items). Beide mit `subscribe()`-Pattern wie `coins.ts`.
- Permanente Effekte werden in `src/lib/perm-bonuses.ts` aggregiert und in `physicsFromTuning` als multiplikativer Modifier eingerechnet (kompatibel zum Drag-Fix oben). Temporäre Effekte laufen als Timer im Simulator und werden im HUD als aktive Buffs angezeigt.

**Erhalt von Paketen:**
1. **Missions-Belohnung:** Ausgewählte Missionen (spd-200, spd-300, spd-400, spd-500, del-long, del-marathon, tm-30, tm-60, tm-120, tm-300) geben zusätzlich zum Coin-Reward ein Paket. Skaliert mit Schwierigkeit (starter → mythic). Verdrahtung in `missions.ts` (`completeMission`) und Toast im Simulator.
2. **Open-World-Drop:** In `Simulator.tsx` alle ~2 s Ticker, der bei Bewegung mit **1.2 % Chance** einen schwebenden Paket-Beacon in 40–120 m Umkreis spawnt (Typ nach gewichteter Verteilung: 70 % starter, 22 % standard, 7 % deluxe, 1 % mythic). Beim Durchfahren → Toast + Sound + Inventory-Add. Maximal 3 offene Beacons gleichzeitig.

**UI-Komponenten (neu):**
- `src/components/Inventory.tsx` — Grid der Pakete, Öffnen-Button pro Paket.
- `src/components/PackOpeningDialog.tsx` — Öffnungs-Animation:
  - Phase 1 (0.6 s): Paket zittert/skaliert (`animate-scale-in`, custom `shake`).
  - Phase 2: Item-Karten flippen einzeln auf (0.3 s versetzt), Rarity-Glow farbig.
  - Phase 3: „Zum Katalog" / „Weiter"-Buttons.
- `src/components/CollectionCatalog.tsx` — Katalog aller 150+ Items, Filter (Alle/Rarity/Effekt-Typ/Gefunden/Fehlt), Fortschrittsbalken „X / 156", Silhouetten für unbekannte Items.
- Buttons „🎒 Inventar" und „📖 Katalog" in `CarSelect.tsx` (Garage-Header).

**Mobile-Tastensteuerung:**
- `src/components/MobileControls.tsx` — On-Screen-Overlay, nur sichtbar bei `useIsMobile()` oder Touch-Device-Detection:
  - Links: Steuerkreuz (◀ ▶) für Lenken.
  - Rechts: Runde Buttons ⛽ (Gas), 🅱 (Bremse), ⏪ (Rückwärts).
  - Kleine Buttons oben rechts: 📷 (Kamera), 🎯 (Nav-Ziel abbrechen), 🎒 (Inventar-Quick-Open).
  - Buttons setzen dieselben `keys[...]`-Flags wie Tastatur (`ArrowUp`, `ArrowLeft` etc.), damit `updatePlayer` unverändert bleibt.
  - Feedback: haptisches `navigator.vibrate(15)` bei Tap (falls verfügbar).

## Technische Details

**Neue Files:**
- `src/lib/collectibles.ts` (Katalog, 150+ Items, Paket-Roll-Funktion mit gewichtetem RNG)
- `src/lib/inventory.ts` (Pakete-Store)
- `src/lib/collection.ts` (Gefundene-Items-Store)
- `src/lib/perm-bonuses.ts` (Aggregation permanenter Effekte)
- `src/components/Inventory.tsx`
- `src/components/PackOpeningDialog.tsx`
- `src/components/CollectionCatalog.tsx`
- `src/components/MobileControls.tsx`

**Editierte Files:**
- `src/lib/car-spec.ts` — Drag-Modell, Bonus-Integration.
- `src/components/Simulator.tsx` — neue Physik-Formel, Open-World-Paket-Spawner + Pickup-Trigger, aktive-Buffs-HUD, `MobileControls` einbinden.
- `src/lib/missions.ts` — Paket-Reward-Field, Vergabe bei Completion.
- `src/components/MissionsPanel.tsx` / `MissionsScreen.tsx` — Paket-Icon an Missionen anzeigen.
- `src/components/CarSelect.tsx` — Buttons Inventar/Katalog.

Keine DB-Migration nötig — alles lokal.

## Out of Scope
- Server-Sync / Cloud-Save der Sammlung.
- Handel/Verschenken zwischen Spielern.
- Cosmetic-Items als 3D-Anbauteile (Katalogeintrag reicht — Farbe/Sticker-Effekt später).
