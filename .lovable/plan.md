## 1. Bundle-Shop Scroll-Bug

`src/components/BundleShop.tsx`: `<main>` nutzt `min-h-screen overflow-y-auto`. Auf Mobil greift der Scroll-Container nicht sauber (Höhe unbegrenzt → äußeres `<html>` scrollt, aber der Header-Layout-Wrapper blockt). Fix:

- `<main>` → `h-screen w-screen overflow-y-auto overscroll-contain`
- Unteres Padding erhöhen (`pb-24`), damit die letzte Karte über dem Mobile-Safe-Area sichtbar bleibt.
- Karten-Grid: `gap-6` beibehalten, aber `md:grid-cols-2` → auf Mobil bleibt es einspaltig (schon so), nur Container-Höhe muss stimmen.

## 2. DevMode → Coins-Panel

In `src/components/CarSelect.tsx` neben dem bestehenden DevMode-Button einen neuen Bereich einblenden, nur wenn `isDevMode() === true`:

```
⚡ DevMode aktiv
[+1 000] [+10 000] [+100 000] [+1 000 000]  🪙 Coins geben
[Reset auf 500]
```

Verwendet vorhandene `addCoins()` / `setCoinsAbsolute()` aus `src/lib/coins.ts`. Kein neues State-System.

## 3. Langzeitmotivation — „Prestige & tägliche Streaks"

Zwei ineinandergreifende Systeme, die Spieler über Wochen binden:

### A) Daily-Login-Streak
- Neue Datei `src/lib/daily-streak.ts`: speichert `lastClaimDate` + `streak` in LocalStorage.
- Beim Öffnen der Garage einmal pro Tag ein Popup „🔥 Tag N — Belohnung abholen".
- Belohnungsleiter (Loop bei Tag 30):
  - Tag 1–6: 500 · 1 000 · 2 000 · 3 000 · 5 000 · 8 000 Coins
  - Tag 7: 🎁 gratis Standard-Bundle
  - Tag 14: 🎁 Premium-Bundle
  - Tag 30: 1 zufälliges Legendary-Preset + 15 000 Coins
- Streak bricht nach >48 h Pause; „Streak-Schutz"-Token einmalig bei Tag 10 vergeben.

### B) Prestige-Level (endlos)
- Neue Datei `src/lib/prestige.ts` + kleines Panel in `CarSelect`.
- XP-Quellen: Missionen abschließen (+XP je Belohnungsstufe), Sammelitems finden (+XP nach Rarity), Bundles kaufen, Regionen freischalten.
- Levelkurve: `xpForLevel(n) = 500 * n^1.6` → nahezu endlos, Level 100+ realistisch nach dutzenden Stunden.
- Jeder Level-Up: +250 Coins + 1 Prestige-Punkt.
- Prestige-Punkte im neuen Panel „✨ Prestige" ausgeben für dauerhafte Boni (stapelbar bis Rang 5):
  - Coin-Multiplikator +5 %/Rang
  - Sammelpaket-Drop-Chance +0,2 %/Rang
  - Garagen-Slot-Preisrabatt −10 %/Rang
  - XP-Boost +10 %/Rang
- Speichert Rang je Kategorie in LocalStorage; über `save-sync` automatisch in Cloud synchronisiert (Keys folgen `garage:*`-Konvention).

### Integration
- `src/lib/missions.ts` und `src/lib/collection.ts` bekommen kleine `awardXp()`-Aufrufe an bestehenden Belohnungspunkten.
- Coin-Multiplikator wird in `addCoins()`-Aufrufsites nicht überall angewendet — stattdessen neue Helper-Funktion `awardCoins(base)` in `prestige.ts`, die multipliziert. Bestehende `addCoins`-Direktnutzung bleibt für UI-Refunds (Verkauf etc.) unverändert.
- Drop-Chance-Bonus wird in `Simulator.tsx` beim World-Pickup-Roll addiert.

## Neue/geänderte Dateien
- **Neu:** `src/lib/daily-streak.ts`, `src/lib/prestige.ts`, `src/components/DailyRewardDialog.tsx`, `src/components/PrestigePanel.tsx`
- **Geändert:** `src/components/BundleShop.tsx` (Scroll-Fix), `src/components/CarSelect.tsx` (DevMode-Coin-Buttons, Prestige-Button, Daily-Dialog), `src/lib/missions.ts` + `src/lib/collection.ts` (XP-Hooks), `src/components/Simulator.tsx` (Drop-Chance-Bonus)

Keine DB-Migration, keine neuen Packages.
