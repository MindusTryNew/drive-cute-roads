import { useEffect, useState } from "react";
import { readState, claim, rewardForDay } from "@/lib/daily-streak";

export function DailyRewardDialog({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState(readState());
  const [justClaimed, setJustClaimed] = useState<{ day: number; label: string } | null>(null);

  useEffect(() => { setState(readState()); }, []);

  const doClaim = () => {
    const r = claim();
    if (r) { setJustClaimed({ day: r.day, label: r.reward.label }); setState(readState()); }
  };

  const day = state.nextDay;
  const preview = Array.from({ length: 7 }, (_, i) => day + i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border-2 border-primary bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Daily Streak</p>
            <h2 className="text-2xl font-bold">🔥 Tag {day}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg border px-3 py-1 text-sm hover:border-primary">✕</button>
        </div>

        {state.broken && !justClaimed && (
          <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Streak unterbrochen — beginne bei Tag 1 neu.
          </p>
        )}
        {state.hasShield && (
          <p className="mt-2 text-xs text-muted-foreground">🛡️ Streak-Schutz aktiv (rettet eine Pause).</p>
        )}

        {justClaimed ? (
          <div className="mt-6 rounded-xl border-2 border-primary bg-primary/10 p-5 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Erhalten</p>
            <p className="mt-1 text-3xl">{justClaimed.label}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border bg-background/40 p-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Heutige Belohnung</p>
            <p className="mt-1 text-2xl font-bold">{rewardForDay(day).label}</p>
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nächste 7 Tage</p>
          <div className="grid grid-cols-7 gap-1">
            {preview.map((d, i) => {
              const r = rewardForDay(d);
              const isToday = i === 0 && !justClaimed;
              return (
                <div key={d} className={`rounded-md border p-2 text-center ${isToday ? "border-primary bg-primary/10" : "border-border"}`}>
                  <p className="font-mono text-[9px] text-muted-foreground">T{d}</p>
                  <p className="text-lg">{r.kind === "coins" ? "🪙" : r.kind === "pack" ? "🎁" : "🏆"}</p>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={justClaimed ? onClose : doClaim}
          disabled={!justClaimed && !state.canClaim}
          className="mt-6 w-full rounded-xl border-2 border-primary bg-primary/20 py-3 font-bold hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {justClaimed ? "Weiter" : state.canClaim ? "Belohnung abholen" : "Heute bereits abgeholt"}
        </button>
      </div>
    </div>
  );
}
