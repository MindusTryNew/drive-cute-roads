import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TRACKS, getLevel, getPoints, getRanks, levelProgress, spendPoint, subscribePrestige, type PrestigeTrack } from "@/lib/prestige";

export function PrestigePanel({ onClose }: { onClose: () => void }) {
  const [, force] = useState(0);
  useEffect(() => subscribePrestige(() => force((n) => n + 1)), []);

  const ranks = getRanks();
  const points = getPoints();
  const level = getLevel();
  const prog = levelProgress();

  const buy = (t: PrestigeTrack) => {
    const r = spendPoint(t);
    if (r.ok) toast.success("Rang erhöht!");
    else toast.error(r.reason ?? "Fehler");
  };

  const pct = Math.min(100, (prog.current / prog.needed) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border-2 border-primary bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Prestige</p>
            <h2 className="text-2xl font-bold">✨ Level {level}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg border px-3 py-1 text-sm hover:border-primary">✕</button>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>XP {prog.current.toLocaleString()} / {prog.needed.toLocaleString()}</span>
            <span>Nächstes Level {level + 1}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-background/60">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border bg-background/40 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Verfügbare Punkte</span>
          <span className="font-mono text-2xl font-bold tabular-nums text-primary">{points}</span>
        </div>

        <div className="mt-5 space-y-3">
          {TRACKS.map((t) => {
            const rank = ranks[t.id];
            const maxed = rank >= t.maxRank;
            return (
              <div key={t.id} className="rounded-xl border bg-background/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.emoji}</span>
                    <div>
                      <p className="text-sm font-bold">{t.label}</p>
                      <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Rang</p>
                    <p className="font-mono text-lg font-bold tabular-nums">{rank}/{t.maxRank}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: t.maxRank }).map((_, i) => (
                    <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < rank ? "var(--primary)" : "oklch(1 0 0 / 0.08)" }} />
                  ))}
                </div>
                <button
                  onClick={() => buy(t.id)}
                  disabled={maxed || points <= 0}
                  className="mt-2 w-full rounded-lg border border-primary/60 bg-primary/10 py-1.5 text-xs font-bold hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {maxed ? "Max. Rang" : "Rang erhöhen (1 Punkt)"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          XP erhältst du für Missionen, Sammelitems, Bundles & Regionen.
        </p>
      </div>
    </div>
  );
}
