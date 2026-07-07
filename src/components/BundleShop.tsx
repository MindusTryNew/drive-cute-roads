import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getTodayBundles, isBought, markBought, msUntilReset, type BundleContent } from "@/lib/bundle-shop";
import { PRESETS_BY_KEY, presetToCustomCar } from "@/lib/preset-cars";
import { COLLECTIBLES_BY_ID, RARITY_COLORS, RARITY_LABEL } from "@/lib/collectibles";
import { getCoins, spendCoins, subscribeCoins } from "@/lib/coins";
import { saveCar } from "@/lib/garage";
import { addToCollection } from "@/lib/collection";

export function BundleShop({ onBack }: { onBack: () => void }) {
  const [bundles] = useState<[BundleContent, BundleContent]>(getTodayBundles());
  const [coins, setCoins] = useState(getCoins());
  const [bought, setBought] = useState<[boolean, boolean]>([isBought(0), isBought(1)]);
  const [countdown, setCountdown] = useState(msUntilReset());

  useEffect(() => {
    const u = subscribeCoins(setCoins);
    const t = window.setInterval(() => setCountdown(msUntilReset()), 1000);
    return () => { u(); window.clearInterval(t); };
  }, []);

  const buy = (slot: 0 | 1) => {
    if (bought[slot]) return;
    const b = bundles[slot];
    if (!spendCoins(b.price)) { toast.error(`Nicht genug Coins (🪙 ${b.price} nötig).`); return; }
    for (const key of b.presetKeys) {
      const p = PRESETS_BY_KEY[key];
      if (!p) continue;
      const car = presetToCustomCar(p);
      try { saveCar(car, false); } catch { /* Slot voll: als Toast melden */ toast.error("Garagen-Slot voll! Kaufe mehr Slots."); return; }
    }
    for (const id of b.collectibleIds) addToCollection(id, 1);
    markBought(slot);
    const next: [boolean, boolean] = [...bought] as [boolean, boolean];
    next[slot] = true;
    setBought(next);
    toast.success(`🎁 Bundle ${slot + 1} gekauft — ${b.presetKeys.length} Autos + ${b.collectibleIds.length} Items!`);
  };

  const fmt = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  return (
    <main className="h-screen w-screen overflow-y-auto overscroll-contain p-6 pb-32">
      <div className="mx-auto max-w-5xl pb-16">
        <header className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Bundle-Shop</p>
            <h1 className="text-3xl font-bold">🎁 Tägliche Bundles</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Neue Bundles in <span className="font-mono tabular-nums text-primary">{fmt(countdown)}</span> ·
              &nbsp;🪙 <span className="font-mono tabular-nums">{coins}</span>
            </p>
          </div>
          <button onClick={onBack} className="rounded-lg border px-4 py-2 text-sm hover:border-primary">← Zurück</button>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {bundles.map((b, i) => (
            <BundleCard
              key={i}
              slot={i as 0 | 1}
              bundle={b}
              premium={i === 1}
              bought={bought[i]}
              canAfford={coins >= b.price}
              onBuy={() => buy(i as 0 | 1)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function BundleCard({
  slot, bundle, premium, bought, canAfford, onBuy,
}: {
  slot: 0 | 1; bundle: BundleContent; premium: boolean; bought: boolean; canAfford: boolean; onBuy: () => void;
}) {
  return (
    <div className={`rounded-2xl border-2 bg-card p-5 ${premium ? "border-primary" : "border-border"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {premium ? "Premium-Bundle" : "Standard-Bundle"}
          </p>
          <h2 className="text-2xl font-bold">Bundle #{slot + 1}</h2>
        </div>
        <div className="rounded-lg bg-primary/10 px-3 py-1 font-mono text-lg font-bold text-primary tabular-nums">
          🪙 {bundle.price.toLocaleString()}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {bundle.presetKeys.length} Auto{bundle.presetKeys.length > 1 ? "s" : ""}
        </p>
        <div className="space-y-2">
          {bundle.presetKeys.map((k) => {
            const p = PRESETS_BY_KEY[k];
            if (!p) return null;
            return (
              <div key={k} className="flex items-center gap-3 rounded-lg border bg-background/40 p-2">
                <div className="h-8 w-8 rounded" style={{ background: p.primary, boxShadow: `0 0 12px ${p.primary}88` }} />
                <div className="flex-1">
                  <p className="text-sm font-bold">{p.name}</p>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">{p.body} · {p.drive} · {p.top} km/h</p>
                </div>
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase"
                  style={{ background: `${RARITY_COLORS[p.rarity]}22`, color: RARITY_COLORS[p.rarity] }}
                >
                  {RARITY_LABEL[p.rarity]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {bundle.collectibleIds.length} Sammelitem{bundle.collectibleIds.length > 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap gap-1">
          {bundle.collectibleIds.map((id, idx) => {
            const it = COLLECTIBLES_BY_ID[id];
            if (!it) return null;
            return (
              <div
                key={idx}
                title={`${it.name} — ${RARITY_LABEL[it.rarity]}`}
                className="flex h-10 w-10 items-center justify-center rounded border text-lg"
                style={{ borderColor: RARITY_COLORS[it.rarity], background: `${RARITY_COLORS[it.rarity]}18` }}
              >
                {it.emoji}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onBuy}
        disabled={bought || !canAfford}
        className="mt-5 w-full rounded-xl border-2 border-primary bg-primary/10 py-3 font-bold hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {bought ? "✅ Heute gekauft" : canAfford ? `Für 🪙 ${bundle.price.toLocaleString()} kaufen` : `Nicht genug Coins`}
      </button>
    </div>
  );
}
