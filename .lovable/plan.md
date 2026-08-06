# Sammel- & Admin-Update

## 1. Mods mit mehreren Inhalten (Multi-Content-Mods)

Ein Mod kann künftig mehrere Content-Teile gleichzeitig enthalten — z. B. Karte + Auto + Skin + Mission + Sammelitems in einer Datei.

- Neuer Mod-Typ `bundle` mit einer Liste von Content-Teilen; jeder Teil behält seinen eigenen Typ und Payload.
- Mod-Studio: Teile einzeln hinzufügen, bearbeiten, entfernen und in einer Datei exportieren.
- Mod-Browser: zeigt alle Teile eines Mods, jeder Teil einzeln aktivierbar/deaktivierbar, Konflikte pro Teil markiert.
- Alte Mods (Einzel-Typ) bleiben weiterhin ladbar.

## 2. 250 neue Sammelitems

Neue Themenserien mit passenden Namen, Emojis und Beschreibungen, verteilt über alle Seltenheiten:

- Tiere (Wald, Meer, Exoten, Fabelwesen)
- Essen & Getränke (Fast Food, Süßes, Küchen der Welt)
- Retro-Games & Arcade
- Weltraum & Wissenschaft
- Musik & Instrumente
- Werkzeug/Garage-Kuriositäten
- Wetter & Natur

Die Items werden in die bestehenden Pakete eingemischt und sind auch in der Open-World findbar.

## 3. Sammelserien mit Stufenbelohnungen

- Jede Serie bündelt eine feste Item-Liste (z. B. „Tierwelt", „Küche der Welt").
- Belohnungsstufen bei 25 %, 50 %, 75 % und 100 % — Coins, Pakete, Perma-Boni.
- Neuer Reiter „Serien" im Katalog: Fortschrittsbalken, fehlende Items, abholbare Belohnungen.
- Belohnungen sind einmalig pro Serie und Stufe, Fortschritt wird mit dem Cloud-Save synchronisiert.

## 4. Admin-System statt DevMode

- DevMode wird vollständig entfernt (auch der 50.000-Coins-Kauf); vorhandene DevMode-Funktionen (Coins geben usw.) wandern ins Admin-Panel.
- Freischaltung über Code `DLA2026QXE` im Konto-/Einstellungsmenü. Der Code verknüpft den angemeldeten Account dauerhaft mit der Admin-Rolle (serverseitig geprüft, nicht nur im Browser).
- Admin-Panel mit:
  - Coins/Slots vergeben (nur für den eigenen Account)
  - Sammelserien-Editor: Serie anlegen, Items auswählen, Stufenbelohnungen setzen, veröffentlichen
  - Missions-Editor: Titel, Ziel, Typ, Belohnung, Laufzeit; veröffentlichen
  - Übersicht über veröffentlichte Serien/Missionen mit Bearbeiten/Deaktivieren
- Veröffentlichte Serien und Missionen sind **online für alle Spieler** sichtbar und werden neben den eingebauten Inhalten geladen.

## 5. Mehr rund ums Sammeln

- **Duplikate tauschen:** überzählige Items gegen Coins oder Sammel-Fragmente eintauschen.
- **Craften/Upgraden:** 5 Duplikate einer Seltenheit → 1 zufälliges Item der nächsthöheren Stufe.
- **Wunschliste & Fundort-Hinweise:** Items markieren; Anzeige, aus welchem Paket bzw. welcher Region sie am wahrscheinlichsten stammen.
- **Tauschbörse (Spieler-Marktplatz für Content):**
  - Spieler erstellen Angebote: „Ich gebe X" (Sammelitem, Auto, Coins) und „Ich will Y".
  - Anforderungen frei definierbar: bestimmte Sammelitems/Seltenheiten, Coins-Betrag, konkrete Fahrzeuge oder Fahrzeug-Kriterien (Mindest-Topspeed, Beschleunigung, Leistung, Handling).
  - Angebotsliste mit Filtern, Prüfung ob man die Anforderungen erfüllt, Ein-Klick-Tausch.
  - Serverseitige Prüfung beim Abschluss, damit Angebote nicht doppelt eingelöst werden.

## Technische Umsetzung

- **Datenbank (neu):** `admin_users` (Rolle per Code), `collection_series` (Admin-Serien + Stufen), `custom_missions`, `trade_offers` (Angebot, Anforderungen als JSON, Status, Anbieter) — alle mit RLS: öffentliches Lesen für aktive Einträge, Schreiben nur für Admins bzw. den jeweiligen Anbieter.
- **Server-Funktionen:** Code-Einlösung/Admin-Prüfung, Serien/Missionen veröffentlichen, Tausch abschließen (atomar mit Anforderungsprüfung).
- **Client:** `src/lib/collectibles.ts` um 250 Items erweitert; neue Module `series.ts`, `admin.ts`, `trading.ts`, `duplicates.ts`; `devmode.ts` entfällt und alle Verwendungen (CarSelect, Simulator, PremiumPassPanel) werden umgestellt.
- **UI:** neuer Serien-Tab im Katalog, `AdminPanel.tsx`, `TradeHub.tsx`, Duplikat-/Craft-Bereich im Katalog.
- Nebenbei: Hydration-Fehler der Coin-Anzeige in `CarSelect.tsx` wird behoben.
