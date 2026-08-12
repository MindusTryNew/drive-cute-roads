import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getTodayBundles, isBought, markBought, msUntilReset,
  BUNDLE_META, type BundleContent, type BundleSize,
} from "@/lib/bundle-shop";
import { PRESETS_BY_KEY, presetToCustomCar } from "@/lib/preset-cars";
import { COLLECTIBLES_BY_ID, RARITY_COLORS, RARITY_LABEL, PACK_META } from "@/lib/collectibles";
import { getCoins, spendCoins, subscribeCoins } from "@/lib/coins";
import { saveCar } from "@/lib/garage";
import { addToCollection } from "@/lib/collection";
import { addPack } from "@/lib/inventory";

export function BundleShop({ onBack }: { onBack: () => void }) {
  const [bundles] = useState<BundleContent[]>(() => getTodayBundles());
  const [coins, setCoins] = useState(0);
  const [bought, setBought] = useState<BundleSize[]>([]);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    setCoins(getCoins());
    setBought(bundles.filter((b) => isBought(b.size)).map((b) => b.size));
    setCountdown(msUntilReset());
    const u = subscribeCoins(setCoins);
    const t = window.setInterval(() => setCountdown(msUntilReset()), 1000);
    return () => { u(); window.clearInterval(t); };
  }, [bundles]);

  const buy = (b: BundleContent) => {
    if (bought.includes(b.size)) return;
    if (!spendCoins(b.price)) { toast.error(`Nicht genug Coins (🪙 ${b.price.toLocaleString()} nötig).`); return; }
    for (const key of b.presetKeys) {
      const p = PRESETS_BY_KEY[key];
      if (!p) continue;
      try { saveCar(presetToCustomCar(p), false); }
      catch { toast.error("Garagen-Slot voll! Kaufe mehr Slots — restliche Inhalte werden trotzdem gutgeschrieben."); }
    }
    for (const id of b.collectibleIds) addToCollection(id, 1);
    for (const p of b.packs) addPack(p);
    markBought(b.size);
    setBought((prev) => [...prev, b.size]);
    toast.success(`${BUNDLE_META[b.size].emoji} Bundle „${BUNDLE_META[b.size].label}" gekauft!`);
  };

  const fmt = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  return (
    <main className="h-screen w-screen overflow-y-auto overscroll-contain p-6 pb-32">
      <div className="mx-auto max-w-6xl pb-16">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Bundle-Shop</p>
            <h1 className="text-3xl font-bold">🎁 Tägliche Bundles</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Rotation in <span className="font-mono tabular-nums text-primary">{fmt(countdown)}</span> ·
              &nbsp;🪙 <span className="font-mono tabular-nums">{coins.toLocaleString()}</span>
            </p>
          </div>
          <button onClick={onBack} className="shrink-0 rounded-lg border px-4 py-2 text-sm hover:border-primary">← Zurück</button>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {bundles.map((b) => (
            <BundleCard
              key={b.size}
              bundle={b}
              bought={bought.includes(b.size)}
              canAfford={coins >= b.price}
              onBuy={() => buy(b)}
            />
          ))}
        </div>

        <AdminBundleSection coins={coins} />
      </div>

    </main>
  );
}

function BundleCard({
  bundle, bought, canAfford, onBuy,
}: { bundle: BundleContent; bought: boolean; canAfford: boolean; onBuy: () => void }) {
  const meta = BUNDLE_META[bundle.size];
  const save = Math.max(0, Math.round((1 - bundle.price / Math.max(1, bundle.rawValue)) * 100));
  const highlight = bundle.size === "huge" || bundle.size === "large";

  return (
    <div className={`flex flex-col rounded-2xl border-2 bg-card p-5 ${highlight ? "border-primary" : "border-border"}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Bundle</p>
          <h2 className="truncate text-2xl font-bold">{meta.emoji} {meta.label}</h2>
        </div>
        <span className="shrink-0 rounded bg-primary/15 px-2 py-1 font-mono text-[10px] font-bold text-primary">−{save}%</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{meta.desc}</p>

      <div className="mt-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {bundle.presetKeys.length} Fahrzeug{bundle.presetKeys.length > 1 ? "e" : ""}
        </p>
        <div className="space-y-2">
          {bundle.presetKeys.map((k) => {
            const p = PRESETS_BY_KEY[k];
            if (!p) return null;
            return (
              <div key={k} className="flex items-center gap-2 rounded-lg border bg-background/40 p-2">
                <div className="h-7 w-7 shrink-0 rounded" style={{ background: p.primary, boxShadow: `0 0 12px ${p.primary}88` }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{p.name}</p>
                  <p className="truncate font-mono text-[10px] uppercase text-muted-foreground">{p.body} · {p.top} km/h</p>
                </div>
                <span className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase"
                  style={{ background: `${RARITY_COLORS[p.rarity]}22`, color: RARITY_COLORS[p.rarity] }}>
                  {RARITY_LABEL[p.rarity]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {bundle.collectibleIds.length} Sammelitems
        </p>
        <div className="flex flex-wrap gap-1">
          {bundle.collectibleIds.map((id, idx) => {
            const it = COLLECTIBLES_BY_ID[id];
            if (!it) return null;
            return (
              <div key={idx} title={`${it.name} — ${RARITY_LABEL[it.rarity]}`}
                className="flex h-9 w-9 items-center justify-center rounded border text-lg"
                style={{ borderColor: RARITY_COLORS[it.rarity], background: `${RARITY_COLORS[it.rarity]}18` }}>
                {it.emoji}
              </div>
            );
          })}
        </div>
      </div>

      {bundle.packs.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Sammelpakete</p>
          <div className="flex flex-wrap gap-1">
            {bundle.packs.map((p, i) => (
              <span key={i} className="rounded-lg border px-2 py-1 text-xs"
                style={{ borderColor: PACK_META[p].color, color: PACK_META[p].color }}>
                {PACK_META[p].emoji} {PACK_META[p].label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-5">
        <p className="text-center font-mono text-[10px] text-muted-foreground line-through">
          🪙 {bundle.rawValue.toLocaleString()}
        </p>
        <button onClick={onBuy} disabled={bought || !canAfford}
          className="mt-1 w-full rounded-xl border-2 border-primary bg-primary/10 py-3 font-bold hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40">
          {bought ? "✅ Heute gekauft" : canAfford ? `🪙 ${bundle.price.toLocaleString()}` : "Nicht genug Coins"}
        </button>
      </div>
    </div>
  );
}
