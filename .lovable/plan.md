# Plan: Coin-Wirtschaft, Missionen, Markt & Performance

## 1. Performance / Lag-Fix (Smart + manuelle Settings)

**Auto-Detection (`src/lib/perf.ts`):** Misst FPS in den ersten 3 Sek, wählt Quality-Preset (Low/Med/High). Speichert in localStorage.
- **Low:** keine Schatten, 30 Gebäude, Fog-Distanz 200, kein Streetlight-PointLight (nur Emissive), Pixelratio 1.
- **Med:** Schatten nur Auto, 70 Gebäude, Fog 300, 10 PointLights, Pixelratio 1.5.
- **High:** alle Schatten, 120 Gebäude, Fog 400, alle Lights, Pixelratio 2.
**Quality-UI:** Settings-Button im Sim-HUD → Modal mit Auto/Low/Med/High + FPS-Anzeige.
**Optimierungen in `world.ts`/`Simulator.tsx`:** Frustum-Culling für ferne Gebäude (Distance > Fog), Hügel-Mesh in 1 BufferGeometry (statt N Meshes), Lights nur in Nacht aktivieren, `renderer.shadowMap` toggle nach Preset, MP-Updates auf 10 Hz drosseln (statt 30).

## 2. Coin-System (Balanced)

**Storage (`src/lib/coins.ts`):** localStorage `garage:coins` (Start: 500). Funktionen: `getCoins`, `addCoins`, `spendCoins`, `transactionLog`.
**HUD:** Coin-Counter oben rechts in Garage + Simulator.
**Garagen-Plätze:** Start 1 Slot frei. Slot 2 = 5.000, Slot 3 = 12.000, Slot 4+ = +8.000 progressiv. Wenn voll → "Slot kaufen"-Button im Garage-Header.

## 3. Auto-Erstellen kostet Coins (leistungsabhängig)

**Formel (`src/lib/car-price.ts`):**
```
base = 200
power = max(0, (350 - topSpeed_target) wird invertiert) → topSpeedFactor = topSpeed / 10
accelFactor = max(0, (12 - t100) * 50)
gripFactor = grip * 3
weightPenalty = max(0, (2000 - weight)) * 0.05  // leichter = teurer
extras = spoiler ? 100 : 0
total = round(base + topSpeedFactor + accelFactor + gripFactor + weightPenalty + extras)
```
- 0–100 km/h Standard-Auto (~250 km/h, 5s, grip 70): ~600 Coins
- Hypercar (400 km/h, 2.5s, grip 95): ~2.000 Coins
- Absurd (10.000 km/h, 0.1s): ~10.000+ Coins (kein hard cap)

**UI in CarBuilder:** Live-Preis-Anzeige neben „Speichern". Wenn Coins < Preis → Button disabled + Hint. Tageslimit BLEIBT (3/Tag) zusätzlich.

## 4. Getriebe-Details (Shift-RPM-Anzeige)

**In `CarBuilder.tsx` Getriebe-Sektion:** Pro Gang zusätzlich zur Ratio die berechnete **Schaltgeschwindigkeit (km/h)** anzeigen:
```
shiftSpeed[i] = topSpeed * (ratios[i] / ratios[0])  // grobe Annäherung
```
Tabelle: `G1: 0.85 → schaltet bei 65 km/h`. Auto-Verteil-Button („Gänge gleichmäßig").
**Im Simulator:** HUD zeigt aktuellen Gang + nächste Shift-Speed. Auto-Schaltung nutzt diese Tabelle.

## 5. Sanfteres Handling

**`car-spec.ts` `physicsFromTuning`:**
- Lenkung: Smoothing-Faktor 0.15 (lerp), statt direktem turnSpeed-Set.
- Grip-Kurve sanfter: `friction = 0.92 + min(grip,150)/150 * 0.07` (war 0.025).
- Untersteuern bei Hoch-Speed: `effectiveTurn = turnSpeed * (1 - speed/maxSpeed * 0.4)`.
- Reverse-Faktor 0.4 (war 0.5) für besseres Manövrieren.

**`Simulator.tsx` Input-Loop:** Lenk-Input über Lerp glätten, Throttle/Brake mit easing (nicht instant 0→1).

## 6. Missionen (Speed / Delivery / Time-Driven)

**Tabelle (Cloud, RLS public read, INSERT für eingeloggte — aber wir haben keinen Login):** → Missionen sind **statisch in Code** (`src/lib/missions.ts`), Progress lokal in localStorage.

**Typen:**
- **Speed-Challenge:** „Erreiche 200 km/h in unter 6 s" → Belohnung 80 Coins.
- **Delivery:** Spawn Pickup-Marker (gelbe Säule) + Drop-Marker (grüne) auf der Map. Fahre hin, Timer läuft. → 100–250 Coins.
- **Time-Driven:** „Fahre 5 Min insgesamt" / „Erreiche 1h Gesamtzeit" → Cumulative Counter. → 50–500 Coins.

**HUD:** Missions-Panel links oben (collapsible) mit aktiver Mission + Progress-Bar. Mission-Auswahl im Garage-Screen („Missionen"-Tab).

## 7. Öffentlicher Markt (Lovable Cloud)

**Migration:** Tabelle `public.market_cars`:
```sql
id uuid pk, seller_nick text, car_json jsonb, price int, listed_at timestamptz,
times_purchased int default 0
```
RLS: `SELECT TO anon` erlaubt (öffentlich browsebar). `INSERT TO anon` erlaubt mit CHECK `length(seller_nick) between 2 and 20 AND price between 100 and 1000000 AND jsonb_typeof(car_json)='object'`. Kein UPDATE/DELETE für anon (Listings bleiben).

**Server-Fn `market.functions.ts`:** `listCars(limit, offset)`, `publishCar(carJson, price, nick)` (deduct 10% Marktgebühr von Coins lokal vor publish), `buyCar(id)` (deduct full price lokal, addCar zur Garage).

**UI:** Neuer „Markt"-Tab in `CarSelect.tsx`. Grid mit Auto-Preview-Thumb (rendere Mini-Canvas), Preis, Verkäufer-Nick. Buttons: „Kaufen" / Eigenes Auto → „Verkaufen" Dialog (Preis-Input, zeigt Gebühr).

**Markt-Gebühr:** 10% des Listing-Preises sofort beim Inserieren abgezogen.

## Technische Details

**Neue Files:** `src/lib/perf.ts`, `src/lib/coins.ts`, `src/lib/car-price.ts`, `src/lib/missions.ts`, `src/lib/market.functions.ts`, `src/components/MissionsPanel.tsx`, `src/components/Market.tsx`, `src/components/QualitySettings.tsx`, `src/components/SlotPurchase.tsx`.

**Editierte Files:** `CarBuilder.tsx` (Preis-Anzeige, Schaltspeed-Tabelle), `CarSelect.tsx` (Coins-HUD, Slots, Markt-Tab, Missionen-Tab), `Simulator.tsx` (Quality, Mission-Tracking, sanfteres Input, Shift-Speed-HUD, MP-Drosselung), `car-spec.ts` (smooth physics), `garage.ts` (maxSlots, coin-charge auf save), `world.ts` (preset-aware), `routes/index.tsx` (Markt-View).

**Keine neuen Dependencies.**

## Out of Scope
- Login/Auth für Markt (anon-Nicks reichen wie besprochen)
- Edit/Delete von Markt-Listings
- Mission-Leaderboards
- Achievements/Trophies
- Soundeffekte
