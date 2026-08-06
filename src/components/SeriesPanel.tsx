import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSeries, progressOf, claimTier, refreshCloudSeries, subscribeSeries } from "@/lib/series";
import { COLLECTIBLES_BY_ID } from "@/lib/collectibles";
import { subscribeCollection } from "@/lib/collection";

export function SeriesPanel({ onClose }: { onClose: () => void }) {
  const [, tick] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    void refreshCloudSeries();
    const a = subscribeSeries(() => tick((n) => n + 1));
    const b = subscribeCollection(() => tick((n) => n + 1));
    return () => { a(); b(); };
  }, []);

  const series = getSeries();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Sammelserien</p>
            <h2 className="text-lg font-bold">🗂️ Serien &amp; Belohnungen</h2>
          </div>
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:border-primary">✕</button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {series.map((s) => {
            const p = progressOf(s);
            const open = openId === s.id;
            return (
              <div key={s.id} className="rounded-xl border bg-background/40 p-4">
                <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpenId(open ? null : s.id)}>
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold">
                      {s.name}
                      {s.source === "cloud" && <span className="ml-2 rounded-full border border-accent/50 px-1.5 py-0.5 text-[9px] text-accent">Community</span>}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{s.desc}</span>
                  </span>
                  <span className="font-mono text-xs tabular-nums">{p.owned}/{p.total} · {p.pct}%</span>
                </button>

                <div className="mt-2 h-2 overflow-hidden rounded-full border bg-card/60">
                  <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${p.pct}%` }} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {s.tiers.map((t) => {
                    const claimable = p.claimable.some((c) => c.pct === t.pct);
                    const reached = p.pct >= t.pct;
                    return (
                      <button
                        key={t.pct}
                        disabled={!claimable}
                        onClick={() => {
                          const res = claimTier(s, t);
                          if (res.ok) toast.success(res.message);
                          else toast.error(res.message);
                          tick((n) => n + 1);
                        }}
                        className={`rounded-full border px-3 py-1 font-mono text-[11px] ${
                          claimable ? "border-primary bg-primary/20 hover:bg-primary/30"
                          : reached ? "opacity-50" : "opacity-40"
                        }`}
                      >
                        {t.pct}% · {t.label} · 🪙 {t.coins.toLocaleString()}{claimable ? " ✦" : reached ? " ✓" : ""}
                      </button>
                    );
                  })}
                </div>

                {open && (
                  <div className="mt-3 flex flex-wrap gap-1 border-t pt-3">
                    {s.itemIds.map((id) => {
                      const item = COLLECTIBLES_BY_ID[id];
                      return (
                        <span key={id} className="rounded-full border px-2 py-0.5 text-[11px]">
                          {item ? `${item.emoji} ${item.name}` : id}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
