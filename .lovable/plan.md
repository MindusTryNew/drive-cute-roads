# Update: Sidebar-UI, Kampagne, Pack-Baukasten, 300 neue Items

## 1. Sidebar-Umbau (komplettes Hauptmenü)

Die Kopfzeile in `CarSelect` trägt aktuell 16+ Buttons in einer Reihe. Ersatz durch
eine einklappbare Seitenleiste (shadcn `Sidebar`, `collapsible="icon"`) mit Gruppen:

```text
FAHREN       Garage · Markt · Regionen · Map-Editor
SAMMELN      Inventar · Katalog · Serien · Werkbank · Wunschliste · Tauschbörse
FORTSCHRITT  Missionen · Prestige · Daily · Premium-Pass · Jubiläum
MODDING      Mod-Browser · Mod-Studio · Modding-Kampagne
SYSTEM       Bundles · News · Code · Konto · Admin
```

Schlanke Topbar mit Coin-Anzeige, Modus-Umschalter (Solo/Splitscreen/Online) und
Admin-Zugang. Auf Mobil klappt die Leiste zu Icons zusammen bzw. öffnet als Overlay;
der Trigger bleibt immer sichtbar. Alle bestehenden Panels bleiben funktional
unverändert, nur der Einstiegspunkt ändert sich. Nebenbei wird der Hydration-Fehler
der Coin-Anzeige behoben (Coins erst nach dem Mount lesen).

## 2. Kampagnen-UI (Modding-Kampagne)

`TutorialScreen` wird durch eine Kampagnen-Oberfläche auf Basis der bereits
gebauten Kapitel-Definitionen ersetzt:

- Kapitel-Übersicht mit Fortschrittsbalken, Sperren (Kapitel schalten nacheinander frei)
  und Belohnungsanzeige.
- Kapitelansicht in drei Schritten: **Lektion** (Text + Beispielcode) →
  **Übungsaufgabe** (Code-Editor mit Starter, „Prüfen"-Button, automatische Auswertung
  mit konkreter Fehlermeldung, Hinweis-Button) → **Test** (Multiple-Choice mit
  Auswertung und Erklärung).
- Abschluss vergibt Coins und ein Sammelpaket; komplette Kampagne gibt einen
  Bonus. Fortschritt wird lokal gespeichert und über das Save-System mitsynchronisiert.

## 3. Pack-Baukasten im Mod-Studio

Neuer Reiter „Pack" im Mod-Studio: beliebig viele gebaute Inhalte (Skin, Physik,
Wetter, Mission, Item, Sound, Tuning, Auto, Map) werden als Liste gesammelt,
umsortiert, bearbeitet, gelöscht und gemeinsam als ein Pack-Mod exportiert oder
direkt installiert. Bestehende Pack-Dateien lassen sich zum Weiterbearbeiten laden.

## 4. Zwei neue Seltenheiten + 300 neue Sammelitems

Neue Tiers oberhalb von „Himmlisch":

| Tier | Name | Farbe | Cooldown |
| --- | --- | --- | --- |
| interplanetary | Interplanetar | tiefes Violett-Türkis | 2 h |
| ultimate | Ultimativ | Gold-Rot mit Glow | 4 h |

Rarity-Reihenfolge, Farben, Labels, Cooldowns, Verwertungs-/Aufwertungswerte in der
Werkbank, Drop-Gewichte der Sammelpakete und die Serien-Rarity-Leiter werden auf die
neuen Tiers erweitert.

300 neue Items mit eigenen Namen in neuen Themenserien (je ~25–35 Items), u. a.:
Essen & Getränke, Autoklassiker, Wetter & Himmel, Werkzeug & Garage, Weltraum-Missionen,
Meer & Küste, Städte der Welt, Musik & Sound, Fabelwesen, Rennsport-Trophäen,
Jahreszeiten, Elektronik. Ein Teil bekommt eigene, handgeschriebene Effekte
(statt nur der generischen Kurve) — z. B. Coin-Regen, mehrere Stats gleichzeitig,
sehr lange Temp-Boosts bei den beiden neuen Tiers. Die neuen Serien sind auch als
Sammelserien mit Stufenbelohnungen verfügbar.

## 5. Besseres Filter-System im Katalog

Bei nun über 1000 Items:

- Filterleiste in Gruppen: Seltenheit (Mehrfachauswahl), Status (gefunden/fehlt/Duplikate),
  Effekt-Art, Themenserie (Dropdown), Wunschliste.
- Sortierung: Standard, Seltenheit auf/ab, Name A–Z, Anzahl besessen, zuletzt gefunden.
- Aktive Filter als entfernbare Chips + „Alle zurücksetzen".
- Virtuelles/paginiertes Nachladen des Grids, damit das Scrollen flüssig bleibt.
- Item-Detail zeigt zusätzlich Fundort-Hinweis und Wunschlisten-Schalter.

## Technische Hinweise

- Neue/geänderte Dateien: `AppSidebar.tsx`, `ModCampaign.tsx` (ersetzt `TutorialScreen`),
  Pack-Tab in `ModStudio.tsx`, `collectibles-extra.ts` (300 Items + 2 Tiers),
  Erweiterung von `collectibles.ts`, `crafting.ts`, `series.ts`, `inventory.ts`
  (Drop-Gewichte), Umbau von `CarSelect.tsx` und `CollectionCatalog.tsx`,
  Routing-Anpassung in `src/routes/index.tsx`.
- Keine Datenbankänderungen nötig; Kampagnenfortschritt und Filterzustand liegen lokal.
