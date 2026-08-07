# Update: Seitenleiste, Mod-Kampagne, Bundles & Tauschbörse

## 1. UI-Umbau auf Seitenleiste

Die Kopfzeile im Hauptmenü platzt (16+ Buttons in einer Reihe). Ersatz durch eine
einklappbare Seitenleiste mit Gruppen:

```text
FAHREN      Garage · Markt · Regionen · Map-Editor
SAMMELN     Inventar · Katalog · Serien · Werkbank · Wunschliste · Tauschbörse
FORTSCHRITT Missionen · Prestige · Daily · Premium-Pass · Jubiläum
MODDING     Mod-Browser · Mod-Studio · Modding-Kampagne
SYSTEM      Bundles · News · Code · Konto · Admin
```

Coins-Anzeige und Admin-Feld wandern in eine schlanke Topbar. Auf Mobil
klappt die Leiste zu Icons zusammen bzw. öffnet als Overlay. Alle Panels
bleiben funktional identisch, nur der Einstiegspunkt ändert sich.
Nebenbei wird der Hydration-Fehler bei der Coin-Anzeige behoben
(Coins erst nach dem Mount lesen).

## 2. Bundles: 4 rotierende Größen

Statt der bisherigen Tagesangebote gibt es vier feste Bundle-Slots, die
täglich neu bestückt werden (deterministisch pro Tag):

| Bundle | Inhalt (ca.) | Preisniveau |
| --- | --- | --- |
| Klein | 1 Auto, 2 Items | günstig, niedrige Seltenheiten |
| Mittel | 1–2 Autos, 3 Items | mittel |
| Groß | 2 Autos, 4 Items, 1 Paket | hoch |
| Riesig | 3 Autos, 6 Items, 2 Pakete | Endgame-Preis |

Jedes Bundle zeigt Ersparnis gegenüber Einzelpreis, ist einmal pro Tag
kaufbar und hat einen Countdown bis zur nächsten Rotation.

## 3. Pack-Baukasten im Mod-Studio

Das Studio kann bisher nur einen Inhalt pro Datei erzeugen. Neu:
ein Reiter „Pack", in dem beliebig viele gebaute Inhalte (Skin, Physik,
Wetter, Mission, Item, Sound, Tuning, Auto, Map) als Liste gesammelt,
umsortiert, bearbeitet, gelöscht und gemeinsam als ein Bundle-Mod
exportiert oder direkt installiert werden. Bestehende Pack-Dateien
lassen sich zum Weiterbearbeiten laden.

## 4. Modding-Kampagne (neues Tutorial)

Ersetzt das statische Tutorial durch eine Kampagne mit 6 Kapiteln,
jeweils Lektion → Übungsaufgabe → Test:

1. Grundlagen: Was ist ein Mod, Formataufbau
2. Skins & Aussehen
3. Physik & Tuning
4. Karten & Objekte
5. Missionen & Sammelitems
6. Packs: mehrere Inhalte in einer Datei

- **Übungsaufgaben**: Aufgabe im Studio/Editor lösen, das Spiel prüft das
  Ergebnis automatisch (z. B. „Baue einen Skin mit Metallic > 0.8").
- **Tests**: Multiple-Choice- und Fehler-finden-Fragen mit Auswertung.
- Fortschritt wird gespeichert, Kapitel schalten nacheinander frei,
  Abschluss gibt Coins und ein Sammelpaket; komplette Kampagne gibt
  den Titel „Modder" plus Belohnung.

## 5. Sammel- & Tauschsystem (aus der PDF)

### Wunschliste
Items im Katalog als „gesucht" markieren; eigene Wunschliste mit Filter,
sichtbar für andere Spieler in der Tauschbörse.

### Fundort-Hinweise
Jedes Sammelitem bekommt einen Hinweistext (Region, Missionstyp, Paketart,
Bedingung), angezeigt im Katalog — grob für unentdeckte, präziser für
bereits gefundene Items.

### Crafting & Upgrades (Ausbau der Werkbank)
Zusätzlich zu Verwerten/Aufwerten: Rezepte für Spezialkombinationen
(z. B. mehrere Items derselben Themenserie → exklusives Serien-Item) und
Item-Upgrades mit Stufen, die Boni verstärken.

### Tauschbörse
Cloud-basiert (Konto erforderlich), Angebote von Spielern erstellt:

- **Gesucht** kann sein: konkretes Item, Seltenheit, Kategorie, mehrere
  Alternativen; konkretes Fahrzeug oder Fahrzeug-Anforderungen
  (min/max Top-Speed, min/max Leistung, Klasse/Typ); Coins.
- **Geboten** dieselben Inhaltstypen, mehrere Alternativen möglich
  („50.000 Coins ODER Auto mit ≥ 600 PS").
- Angebote durchsuchen/filtern, annehmen, eigene zurückziehen.
  Beim Annehmen prüft das Spiel serverseitig Besitz und Anforderungen und
  führt den Tausch atomar aus (Item/Auto/Coins wechseln den Besitzer).
- Duplikate lassen sich direkt aus Katalog/Inventar heraus anbieten.

## Technische Hinweise

- Neue Tabellen im Backend: `trade_offers` (Angebot, Anforderungen,
  Angebotsinhalte, Status, Ersteller) und `wishlists`, jeweils mit RLS
  (jeder liest offene Angebote, nur Ersteller ändert/löscht) und Grants.
  Tauschabwicklung über eine Server-Function mit Besitzprüfung.
- Wunschliste und Kampagnenfortschritt zusätzlich lokal, Sync über das
  bestehende Save-System.
- Neue Frontend-Module: `AppSidebar`, `TradeBoard`, `WishlistPanel`,
  `ModCampaign` (+ Aufgaben-/Testdefinitionen), Pack-Tab in `ModStudio`,
  Überarbeitung von `bundle-shop.ts` auf 4 Größen, Fundort-Feld in den
  Collectible-Definitionen.
