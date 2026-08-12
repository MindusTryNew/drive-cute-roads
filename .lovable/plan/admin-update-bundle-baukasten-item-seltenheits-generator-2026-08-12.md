# Admin-Update: Bundle-Baukasten, Item- & Seltenheits-Generator

Der Admin-Bereich bekommt drei neue Werkzeuge. Alles, was der Admin veröffentlicht, ist online und bei allen Spielern sichtbar.

## 1. Eigene Seltenheiten (voll integriert)

Editor mit: Name, Kürzel/ID, Farbe, Emoji, Cooldown für Aktiv-Effekte, Drop-Gewicht je Paket-Typ, Shop-Preis und Position in der Seltenheits-Leiter (für Crafting/Upgrades).

Selbst erstellte Seltenheiten verhalten sich überall wie eingebaute: Farbe im Katalog, eigene Filter-Chips, korrekte Preise im Bundle-Shop, eigene Drop-Chance beim Paketöffnen, Verwertungs- und Craft-Werte in der Werkbank.

## 2. Sammelitem-Generator

Zwei Modi in einem Tab:

- **Einzel-Editor**: Name, Emoji, Beschreibung, Seltenheit (inkl. eigener), Effekt (Coins / dauerhafter Bonus / temporärer Bonus / rein kosmetisch), optional einer Serie zuordnen.
- **Massen-Generator**: Thema angeben (Name-Präfix, Emoji-Vorrat, Beschreibungs-Vorlage), Anzahl (bis 200) und Seltenheits-Verteilung wählen; optional automatische Effekte je Seltenheit. Ergebnis erscheint als Vorschau-Liste, einzelne Einträge lassen sich nachbearbeiten oder löschen, danach „Veröffentlichen".
- Beim Massen-Generieren kann direkt eine Sammelserie mit Stufenbelohnungen (25/50/75/100 %) miterzeugt werden.

Cloud-Items tauchen im Katalog, in Paketen, in Fundort-Hinweisen, in der Wunschliste und in der Tauschbörse genauso auf wie eingebaute Items.

## 3. Bundle-Baukasten

Admin erstellt eigene Bundles, die neben den 4 rotierenden Tages-Bundles im Shop stehen. Inhalte frei kombinierbar:

- Fahrzeuge (Preset-Autos)
- Sammelitems (eingebaute und selbst erstellte)
- Sammelpakete
- Coins
- Garagen-Slots
- Premium-Pass-Tage
- Booster (temporärer Stat-Bonus mit Laufzeit)

Dazu: Titel, Beschreibung, Emoji, Preis (mit angezeigtem Rabatt gegenüber dem Einzelwert), Laufzeit (von/bis), Kaufbeschränkung (einmalig / mehrfach) und Aktiv-Schalter. Übersicht mit Bearbeiten, Deaktivieren und Löschen.

## Technische Umsetzung

**Datenbank (3 neue Tabellen, alle mit GRANTs + RLS: öffentliches Lesen aktiver Einträge, Schreiben nur für Admins über `is_admin(auth.uid())`)**

- `custom_rarities` — key, label, color, emoji, cooldown_sec, ladder_rank, price, pack_weights (jsonb), active
- `custom_collectibles` — item_key, name, emoji, description, rarity_key, effect (jsonb), series_key, active
- `custom_bundles` — title, description, emoji, contents (jsonb: cars/items/packs/coins/slots/passDays/boosters), price, starts_at, ends_at, once_per_player, active

Käufe bleiben client-/save-seitig wie bisher (Coins-Abzug + Gutschrift); `once_per_player` wird im Save-State vermerkt.

**Client**

- Neues Modul `src/lib/custom-content.ts`: lädt Cloud-Seltenheiten und Cloud-Items einmalig beim Start, hält eine Registry und benachrichtigt Abonnenten.
- Umstellung der harten `Record<Rarity, …>`-Maps in `collectibles.ts`, `bundle-shop.ts`, `crafting.ts`, `active-effects.ts` auf Lookup-Funktionen (`rarityColor(key)`, `rarityPrice(key)`, `rarityCooldown(key)`, `rarityLadder()`), damit unbekannte Cloud-Keys sauber funktionieren statt `undefined` zu liefern.
- `getAllCollectibles()` = eingebaute + Cloud-Items; Katalog, Pakete, Serien, Wunschliste, Trading und Fundort-Hinweise nutzen diese Quelle.
- Neues Modul `src/lib/admin-bundles.ts` für Laden/Erstellen/Bearbeiten und Einlösen von Admin-Bundles; `BundleShop.tsx` zeigt sie in einem eigenen Abschnitt „Admin-Bundles".
- `src/lib/admin.ts` bekommt CRUD für die drei neuen Tabellen; `AdminPanel.tsx` erhält die Tabs „Seltenheiten", „Item-Generator" und „Bundles".

**Nebenbei**: Der Hydration-Fehler der Coin-Anzeige in `CarSelect.tsx` wird behoben (Coins erst nach dem Mount rendern).
