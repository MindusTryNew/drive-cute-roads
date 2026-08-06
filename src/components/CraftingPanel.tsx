import { useState } from "react";
import { toast } from "sonner";
import { RARITY_COLORS, RARITY_LABEL, RARITY_ORDER, type Rarity } from "@/lib/collectibles";
import { duplicatesByRarity, scrapDuplicates, upgradeDuplicates, SCRAP_VALUE, UPGRADE_COST } from "@/lib/crafting";

export function CraftingPanel({ onClose }: { onClose: () => void }) {
  const [, tick] = useState(0);
  const dupes = duplicatesByRarity();
  const totalDupes = RARITY_ORDER.reduce((a, r) => a + dupes[r], 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Werkbank</p>
            <h2 className="text-lg font-bold">⚗️ Duplikate verwerten &amp; aufwerten</h2>
          </div>
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:border-primary">✕</button>
        </header>

        <div className="flex-1 space-y-2 overflow-y-auto p-5">
          <p className="text-xs text-muted-foreground">
            Du hast {totalDupes} Duplikate. Verwerten bringt Coins, {UPGRADE_COST} Duplikate ergeben ein Item der nächsthöheren Seltenheit.
          </p>
          {RARITY_ORDER.map((r: Rarity) => {
            const n = dupes[r];
            const canUpgrade = n >= UPGRADE_COST && r !== "celestial";
            return (
              <div key={r} className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: n > 0 ? RARITY_COLORS[r] + "66" : undefined }}>
                <span className="w-28 font-mono text-xs" style={{ color: RARITY_COLORS[r] }}>{RARITY_LABEL[r]}</span>
                <span className="flex-1 font-mono text-xs tabular-nums">×{n}</span>
                <button
                  disabled={n === 0}
                  onClick={() => { const res = scrapDuplicates(r); res.ok ? toast.success(res.message) : toast.error(res.message); tick((x) => x + 1); }}
                  className="rounded-full border px-2.5 py-1 text-[11px] hover:border-primary disabled:opacity-30"
                >
                  Verwerten (🪙 {SCRAP_VALUE[r].toLocaleString()}/St.)
                </button>
                <button
                  disabled={!canUpgrade}
                  onClick={() => { const res = upgradeDuplicates(r); res.ok ? toast.success(res.message) : toast.error(res.message); tick((x) => x + 1); }}
                  className="rounded-full border px-2.5 py-1 text-[11px] hover:border-accent disabled:opacity-30"
                >
                  ⬆ Aufwerten ({UPGRADE_COST})
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
