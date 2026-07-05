
## Ziel
Großes Content- und Fix-Update: mehr Sammelitems, funktionierendes Konto, Daily-Bundle-Shop mit 25 neuen Autos, 6 freischaltbare Regionen und eine Vollbild-Minimap.

## 1. Account-System reparieren (Registrierung/Login schlägt fehl)
- `AccountMenu.tsx` prüft aktuell nur "email + password nicht leer". Ursache der Fehler ist meist Auto-Confirm aus + fehlender Redirect + Passwort-HIBP.
- Fix:
  - `auto_confirm_email = true` per `configure_auth` setzen (Sofort-Login ohne Mail-Bestätigung, für Spiel gewünscht).
  - Passwort clientseitig prüfen (min. 6 Zeichen, keine Leerzeichen), E-Mail per Zod validieren.
  - Konkrete Fehlermeldungen anzeigen (invalid_credentials, user_already_exists, weak_password…).
  - Nach Signup automatisch einloggen falls Session direkt zurückkommt; sonst klarer Hinweis.
  - Toaster-Feedback klarer, kleiner Auto-Sync alle 60 s wenn eingeloggt.

## 2. 150 neue Sammelitems (Total ~600)
- In `collectibles.ts` einen zusätzlichen Generator-Block anhängen: 6 neue Themen-Serien à 25 Items (Aurora Borealis, Deep Sea, Chrome Wings, Neon Circuit, Volcanic, Storm).
- Verteilt auf bestehende Seltenheiten (common → celestial) mit passenden Effekten (bereits vorhandene Kategorien: perm accel/topSpeed/grip/brake, temp boosts, coins).
- Keine neuen Seltenheiten/Boxen — die Zahl 600+ bleibt in der bestehenden UI (`CollectionCatalog`) filterbar.

## 3. 25 neue vorgefertigte Autos + Daily-Bundle-Shop
- `src/lib/preset-cars.ts` (neu): 25 vorgefertigte Autos (Name, Body-Type, Farben, Tuning-Basis, Rarity-Preisklasse) — deterministische Definition.
- `src/lib/bundle-shop.ts` (neu):
  - Täglich (Datum-basiert, Seed = YYYY-MM-DD) werden 2 Bundles gerollt.
  - Jedes Bundle enthält: 1–3 Preset-Autos + 2–5 Sammelitems, Preis skaliert nach Inhalt/Seltenheit (5 000 – 60 000 Coins).
  - Kauf: 1× pro Tag pro Bundle, Coins abziehen, Autos in Garage übernehmen (`garage.ts`), Sammelitems in Collection (`collection.ts`).
- `src/components/BundleShop.tsx` (neu): zwei Karten mit Inhalt, Preis, Countdown bis Reset (Mitternacht lokal), Kaufbutton.
- Einstieg im Header von `CarSelect.tsx` neben Inventory/Catalog.

## 4. Massive Map-Erweiterung – 6 Regionen (Map ~5× größer)
- `WORLD_SIZE` von 800 → 1800 (~5× Fläche). Fog & Draw-Distance nachziehen, Building-Count skalieren.
- 6 Regionen als Quadranten/Sektoren um Zentrum:
  1. **Stadt** (Default, freigeschaltet) – aktuelles Grid + Wolkenkratzer.
  2. **Offroad** – bestehende Hügel, erweitert.
  3. **Hügel** – sanfte, große Wellen (neue Höhenfunktion), Serpentinen-Straße.
  4. **Täler** – tiefe Senken, Brücken, Fluss (blaue Ebene).
  5. **Stunt-Park** – Rampen, Loops, Halfpipes (Boxen/Torus in `world.ts`).
  6. **Strand** – flach, gelber Sand, Palmen (Cone+Cylinder), Meer am Rand.
- `src/lib/regions.ts` (neu): Definition (id, name, price, unlocked-default, spawnPoint, bounds), Freischalt-State in `localStorage`, Coin-Kauf, `has(id)` helper.
- `world.ts` erweitert: pro Region eigener Builder (heightfield + Props + Kollisions-Boxen), gated durch unlocked-Liste.
- `CarSelect.tsx`: Region-Auswahl-Panel mit Preis & 🔒/✅.

## 5. Vollbild-Minimap
- Bestehende Minimap in `Simulator.tsx` bekommt Tap/Click → Fullscreen-Overlay.
- Overlay:
  - Pausiert Physik-Loop (bereits vorhandenes pause-Flag im Simulator nutzen/ergänzen).
  - Zeigt große Canvas-Karte mit Auto-Marker, Regionen, Nav-Ziel.
  - Klick/Tap auf Karte setzt Navi-Ziel (`navigation.ts` `setDest`).
  - Kleines **×** oben rechts (48 × 48 px, Touch-freundlich) schließt & entpaust.
  - Escape-Taste ebenfalls schließt.

## Technische Details
- Neue Dateien: `src/lib/preset-cars.ts`, `src/lib/bundle-shop.ts`, `src/lib/regions.ts`, `src/components/BundleShop.tsx`, `src/components/FullscreenMap.tsx`.
- Geänderte Dateien: `src/lib/collectibles.ts` (+150), `src/lib/world.ts` (Größe + Regionen), `src/components/Simulator.tsx` (Fullscreen-Map, Pause, Region-Spawn), `src/components/CarSelect.tsx` (Header-Buttons, Region-Panel), `src/components/AccountMenu.tsx` (Validierung + Fehler), plus `supabase configure_auth` Aufruf für Auto-Confirm.
- Keine DB-Migration nötig; bestehende `save_states`-Tabelle bleibt.
- Region-Freischaltung, Bundle-Käufe & Fortschritt werden im bestehenden `save-sync` mit synchronisiert (LocalStorage-Keys automatisch mit exportiert).

## Out of scope
- Neue Sammel-Seltenheiten oder Boxen.
- Multiplayer/Regionen-Chat.
- Regenerative Bundles unter Tages-Reset (nur 1×/Tag).
