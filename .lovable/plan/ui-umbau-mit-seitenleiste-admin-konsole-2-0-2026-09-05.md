# UI-Umbau mit Seitenleiste + Admin-Konsole 2.0

## 1. Neues Hauptmenü mit fester Seitenleiste

Statt der überfüllten Kopfzeile mit 16 Knöpfen gibt es links eine feste Leiste mit gruppierten Bereichen:

- **Fahren**: Garage, Modus (Solo / Split / Online), Regionen
- **Fortschritt**: Missionen, Kampagne, Sammelserien, Prestige, Tagesbelohnung
- **Sammeln**: Katalog, Inventar, Werkbank, Tauschbörse, Wunschliste
- **Handel**: Bundle-Shop, Automarkt, Premium-Pass
- **Werkstatt**: Auto bauen, Mods, Mod-Studio, Karten-Editor
- **Sonstiges**: News (mit Zähler), Konto, Code einlösen, Admin

Oben in der Leiste: Coins, Garagenplätze, Prestige-Level, Premium-Status. Auf schmalen Bildschirmen klappt die Leiste über einen Menü-Knopf auf und legt sich über den Inhalt. Der ausgewählte Bereich ist farbig markiert.

Rechts bleibt die Fahrzeugauswahl als Hauptinhalt (Karten mit Werten, eigene Autos, Platz kaufen).

## 2. Einheitliche Optik für alle großen Fenster

Katalog, Bundle-Shop, Tauschbörse, Mod-Studio, Missionen, Werkbank, Admin bekommen denselben Rahmen: gleiche Kopfzeile (Titel + Untertitel + Schließen), gleiche Reiter-Leiste, gleiche Karten, Abstände und Knopf-Stile — über eine gemeinsame Panel-Komponente statt individueller Markup-Varianten. Alle Farben laufen weiterhin über die Design-Tokens.

## 3. Admin-Konsole überarbeitet

Die Konsole wird von einem schmalen Dialog zu einem Vollbild-Arbeitsbereich mit eigener Reiter-Spalte: Missionen, Serien, **Seltenheiten**, **Items**, **Kisten**, Bundles, Coins.

**Seltenheiten** (bestehend, wird aufgeräumt): Live-Vorschau des Farbchips, Prüfung auf doppelte Kürzel, Bearbeiten statt nur Anlegen/Löschen, Sortierung über die Rangstufe per Auf/Ab-Knöpfen.

**Kisten-Werkstatt (neu)**: Admin legt eigene Paket-Typen an mit
- Name, Emoji, Beschreibung, Preis im Shop
- Anzahl Items pro Öffnung (Min/Max)
- Chancen je Seltenheit (Schieberegler, Summe wird auf 100 % normalisiert, mit Vorschau „so oft kommt X“)
- Garantie-Regel (z. B. mindestens 1 Item ab Seltenheit Y)
- Fundchance in der offenen Welt
- Aktiv-Schalter, Laufzeit optional

Diese Kisten erscheinen im Inventar, im Bundle-Shop, als Missionsbelohnung, in Admin-Bundles und als Fundstück in der Welt — genau wie die eingebauten Pakete. Die Öffnungs-Animation nutzt Farbe und Emoji der Kiste.

**Items / Bundles**: bestehende Generatoren bleiben, bekommen aber Bearbeiten-Funktion, Suchfeld, Seltenheits-Filter und eine bessere Vorschau-Liste.

**Fehlerbehebungen**: Anlegen scheitert bisher still, wenn man nicht angemeldet ist oder das Kürzel doppelt ist — künftig klare Meldungen. Nach dem Speichern werden die Inhalte sofort neu geladen, sodass neue Seltenheiten/Items/Kisten ohne Neuladen überall auftauchen.

## Technische Umsetzung

- Neue Tabelle `custom_packs` (key, label, emoji, description, price, min_items, max_items, rarity_weights jsonb, guarantee jsonb, world_chance, active) mit GRANTs und denselben RLS-Regeln wie die anderen Admin-Tabellen: öffentliches Lesen aktiver Zeilen, Schreiben nur über `is_admin(auth.uid())`.
- `src/lib/collectibles.ts`: `registerRuntimePack()` analog zu `registerRuntimeRarity`, damit `PACK_TYPES`/`PACK_META`/Drop-Tabellen Cloud-Kisten enthalten; alle harten `Record<PackType, …>`-Maps in `inventory.ts`, `bundle-shop.ts`, `admin-bundles.ts`, `find-hints.ts`, `missions.ts` auf Lookup-Funktionen mit Fallback umstellen.
- `src/lib/custom-content.ts` lädt zusätzlich `custom_packs` und meldet Änderungen an Abonnenten; `AdminPanel` ruft nach jedem Speichern `loadCustomContent(true)`.
- `src/lib/admin.ts`: CRUD für `custom_packs` plus Update-Funktionen für Seltenheiten/Items/Bundles.
- Neue Komponenten `src/components/ui/Sidebar`-Layout (`AppShell`) und `Panel` (Kopf/Reiter/Body) in `src/components/shell/`; `CarSelect.tsx` wird darauf umgebaut, die Dialoge nutzen `Panel`.
- Hydration-Fehler der Coin-/Statuswerte in `CarSelect.tsx` beheben: gespeicherte Werte erst nach dem Mount rendern (Platzhalter beim ersten Rendern).
