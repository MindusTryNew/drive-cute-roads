Plan: Drift Lab „XXXL-Modding-Update" + Anniversary-Umbenennung

Das Spiel geht weiter. Dieses Update bringt ein stark erweitertes Modding-System, benennt das „Farewell"-Thema in „Anniversary" (2 Monate Drift Lab) um und behebt die Fehler rund um das nicht abholbare Geschenk.

---

## 1. Bugfix: Geschenk konnte nicht abgeholt werden

Befund aus dem Code:
- `claimFarewellGift()` in `src/lib/farewell-gift.ts` ruft `saveCar(...)` sechsmal auf. `saveCar` macht ein striktes `CustomCarSchema.parse()` — wirft es (oder wirft `crypto.randomUUID()` in älteren Browsern), bricht die Funktion mitten drin ab: es gibt keinen try/catch, kein Rollback und keine Fehlermeldung im UI. Der Button wirkt dann wirkungslos.
- Zusätzlich prüft die Garage über `getSlots()` nur beim Erstellen — nach dem Geschenk hat der Spieler mehr Autos als Plätze, was verwirrend wirkt und weitere Autos blockiert.

Maßnahmen:
- `claimFarewellGift()` (neu `claimAnniversaryGift()`) in try/catch kapseln, jeden einzelnen Schritt einzeln absichern, und ein Ergebnis-Objekt mit Zählern zurückgeben (`{ ok, cars, items, coins, errors[] }`).
- Fahrzeuge über eine eigene, tolerante ID-Erzeugung anlegen (Fallback statt `crypto.randomUUID()`), Namen auf 40 Zeichen begrenzen.
- Beim Einlösen automatisch genug Garagenplätze gutschreiben (kostenlos), damit die 6 Fahrzeuge hineinpassen.
- Claim-Flag erst setzen, wenn alle Schritte durch sind; teilweise fehlgeschlagene Claims können erneut ausgeführt werden.
- Im Dialog Fehler sichtbar machen (Toast mit konkreter Ursache statt stiller Abbruch).
- Bereits „claimed"-markierte Spieler, die nichts erhalten haben: einmaliger Reparatur-Check beim Start (prüft, ob die Anniversary-Autos in der Garage sind; wenn nicht, wird der Claim wieder freigegeben).

## 2. Bugfix: Hydration-Fehler in der Garage

`CarSelect.tsx` initialisiert `useState(getCoins())` u. Ä. direkt aus localStorage — der Server rendert 500, der Client 1000, React bricht die Hydration ab. Alle localStorage-abhängigen Startwerte (Coins, Slots, Autos, Claim-Status, News-Badge) werden auf einen neutralen Serverwert gesetzt und in `useEffect` nachgeladen.

## 3. Umbenennung Farewell → Anniversary

- Texte: „Danke, dass ihr dabei wart" → „2 Monate Drift Lab — danke, dass ihr dabei seid!" (Ausblick statt Abschied).
- `src/lib/farewell-gift.ts` → `src/lib/anniversary-gift.ts`, `FarewellGiftDialog.tsx` → `AnniversaryGiftDialog.tsx`.
- Button in der Garage: „🎁 Farewell" → „🎉 Anniversary".
- Preset-Autos: Tag/Namenssuffix „Farewell" → „Anniversary" (Keys bleiben stabil, damit bestehende Garagen nicht brechen).
- Items behalten ihre IDs (`fw-*`), bekommen aber neue Anzeigenamen/Beschreibungen im Anniversary-Ton.
- News-Feed (`src/lib/news.ts`): Farewell-Einträge ersetzen durch „Das Spiel geht weiter"-Ankündigung + Modding-Patchnotes.

## 4. XXXL-Modding-Update

Das Mod-Format wird auf **v3** erweitert (v2 bleibt lesbar, wird beim Import automatisch migriert).

Neue Mod-Typen:
- **Sound-Mod**: eigene Motor-/Reifen-Sounds (Base64 oder URL), pro Auto zuweisbar.
- **Skin-Mod**: Lackierungen/Decals inkl. Farbverläufe, Metallic/Roughness, Nummern-Decals.
- **Physik-Mod**: globale Regeln (Gravitation, Reibung, Luftwiderstand, Drift-Faktor) für den eigenen Spielstand.
- **Missions-Mod**: eigene Missionen (Ziel, Belohnung, Dauer) im Missions-Pool.
- **Kollektions-Mod**: eigene Sammelitems mit Seltenheit/Emoji/Effekt.
- **Wetter/Zeit-Mod**: Tageszeit fixieren, Nebeldichte, Himmelsfarben.
- **Mod-Pack**: Bündel mehrerer Mods in einer Datei mit Abhängigkeiten.

Neue Modding-Funktionen:
- **Mod-Manager-UI** (ersetzt/erweitert `ModBrowser.tsx`): installierte Mods sortierbar (Ladereihenfolge), Ein/Aus-Schalter, Konflikt-Erkennung (zwei Mods patchen denselben Wert), Detail-Ansicht mit Inhaltsvorschau.
- **Mod-Validierung mit lesbaren Fehlern**: Zod-Fehler werden in Klartext übersetzt („Feld `topSpeed` muss eine Zahl > 0 sein") statt Roh-JSON.
- **Live-Reload**: Mod aktivieren/deaktivieren, ohne die Garage zu verlassen; Map-Mods werden beim nächsten Simulator-Start gemountet.
- **Mod-Studio**: In-Game-Editor für Auto-, Tuning-, Skin- und Missions-Mods (Formular statt JSON schreiben), Export als `.mod.json`.
- **Map-Editor → Mod-Export**: gebaute Karten direkt als Map-Mod exportieren und im Browser veröffentlichen.
- **Import per Drag & Drop** einer `.mod.json`/`.modpack.json` auf das Fenster.
- **Mod-Bewertungen & Downloads** im Online-Browser (Sterne + Zähler, über die vorhandene Cloud-Tabelle).
- **Mod-Sandbox-Limits**: Größenlimits, maximale Objektzahl, Werte-Klemmung, damit kaputte Mods das Spiel nicht einfrieren.
- **Modding-Dokumentation** direkt im Spiel: Referenz aller v3-Felder mit Beispiel-JSON zum Kopieren.

## 5. Technische Details

Geändert:
- `src/lib/mods.ts` (v3-Schemata, Migration v2→v3, Ladereihenfolge, Konflikte)
- `src/lib/map-mods.ts` (Skin-/Wetter-/Physik-Anwendung)
- `src/lib/car-spec.ts` (Physik-Mod-Hooks)
- `src/lib/missions.ts` (Missions-Mods im Pool)
- `src/lib/collectibles.ts` (Mod-Items, Anniversary-Texte)
- `src/lib/preset-cars.ts` (Anniversary-Namen)
- `src/lib/news.ts` (neuer Feed)
- `src/components/ModBrowser.tsx` (Mod-Manager)
- `src/components/CarSelect.tsx` (Hydration-Fix, Anniversary-Button, Mod-Studio-Einstieg)
- `src/components/MapEditor.tsx` (Export als Map-Mod)
- `src/components/Simulator.tsx` (Sound-/Wetter-/Physik-Mods anwenden)

Neu:
- `src/lib/anniversary-gift.ts` (ersetzt `farewell-gift.ts`, mit Reparatur-Logik)
- `src/lib/mod-runtime.ts` (Anwendung aktiver Mods auf Physik/Wetter/Sound)
- `src/lib/mod-errors.ts` (lesbare Validierungsfehler)
- `src/components/AnniversaryGiftDialog.tsx`
- `src/components/ModStudio.tsx`
- `src/components/ModDocs.tsx`

Keine neuen npm-Pakete nötig. Datenbank-Änderung nur, falls Bewertungen gewünscht sind (Tabelle `mod_ratings` mit Zugriffsregeln: jeder darf lesen, angemeldete Nutzer je Mod eine Bewertung schreiben).

## 6. Validierung

- Typecheck und Build fehlerfrei.
- Anniversary-Geschenk in frischem Profil einlösen → 6 Autos, 20 Items, 40.000 Coins, genügend Garagenplätze.
- Profil mit fälschlich gesetztem Claim-Flag → Reparatur gibt Geschenk frei.
- Kein Hydration-Fehler mehr in der Konsole.
- Je einen Mod pro neuem Typ importieren, aktivieren, im Spiel prüfen.
