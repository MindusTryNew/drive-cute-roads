import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  isPremiumActive,
  getPassState,
  getPaidUntil,
  buyPremiumWeeks,
  claimWeeklyBundle,
  canClaimWeeklyBundle,
  formatRemaining,
  WEEKLY_COST,
  COIN_BOOST,
  XP_BOOST,
  activatePremiumDebug,
} from "@/lib/premium-pass";
import { getCoins, subscribeCoins } from "@/lib/coins";
import { isDevMode } from "@/lib/devmode";

export function PremiumPassPanel({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState(false);
  const [paidUntil, setPaidUntil] = useState<number | null>(null);
  const [coins, setCoins] = useState(getCoins());
  const [canClaim, setCanClaim] = useState(false);
  const [dev, setDev] = useState(isDevMode());

  const refresh = () => {
    setActive(isPremiumActive());
    setPaidUntil(getPaidUntil());
    setCanClaim(canClaimWeeklyBundle());
  };

  useEffect(() => {
    refresh();
    const un = subscribeCoins(setCoins);
    const id = window.setInterval(refresh, 1000);
    return () => { un(); window.clearInterval(id); };
  }, []);

  const remainingMs = paidUntil ? Math.max(0, paidUntil - Date.now()) : 0;

  const buy = (weeks: number) => {
    const res = buyPremiumWeeks(weeks);
    if (res.ok) {
      toast.success(`Premium-Pass um ${weeks} Woche(n) verlängert!`);
      refresh();
    } else {
      toast.error(res.reason ?? "Kauf fehlgeschlagen");
    }
  };

  const claim = () => {
    const res = claimWeeklyBundle();
    if (res.ok) {
      toast.success("🎁 Wöchentliches Standard-Paket erhalten!");
      refresh();
    } else {
      toast.error(res.reason ?? "Fehler");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-[min(520px,95vw)] max-h-[90vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Premium</p>
            <h2 className="text-2xl font-bold">Drift Lab Premium Pass</h2>
          </div>
          <button onClick={onClose} className="rounded-lg border px-3 py-1 text-sm hover:border-primary">✕</button>
        </div>

        <div className={`mt-4 rounded-xl border px-4 py-3 ${active ? "border-primary/50 bg-primary/10" : "border-muted bg-muted/30"}`}>
          <p className="font-bold">{active ? "✅ Aktiv" : "⏸ Inaktiv"}</p>
          {active && paidUntil && (
            <p className="mt-1 text-sm text-muted-foreground">Noch gültig: <b>{formatRemaining(remainingMs)}</b></p>
          )}
          {!active && <p className="mt-1 text-sm text-muted-foreground">Kaufe eine Woche für 🪙 {WEEKLY_COST.toLocaleString()}.</p>}
        </div>

        <div className="mt-5 space-y-2 text-sm">
          <p className="font-bold">Boni, solange der Pass aktiv ist:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>+{Math.round((COIN_BOOST - 1) * 100)} % Coins aus Missionen, Verkauf & Items</li>
            <li>+{Math.round((XP_BOOST - 1) * 100)} % Prestige-XP</li>
            <li>Ein kostenloses Standard-Paket pro Woche</li>
            <li>Exklusives Premium-Badge im Profil</li>
          </ul>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => buy(1)}
            disabled={coins < WEEKLY_COST}
            className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            1 Woche · 🪙 {WEEKLY_COST.toLocaleString()}
          </button>
          <button
            onClick={() => buy(4)}
            disabled={coins < WEEKLY_COST * 4}
            className="rounded-lg border border-primary/60 bg-primary/10 px-4 py-3 text-sm font-medium hover:bg-primary/20 disabled:opacity-40"
          >
            4 Wochen · 🪙 {(WEEKLY_COST * 4).toLocaleString()}
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-dashed p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">🎁 Wöchentliches Paket</p>
              <p className="text-xs text-muted-foreground">{canClaim ? "Bereit zum Abholen" : "Bereits diese Woche beansprucht"}</p>
            </div>
            <button
              onClick={claim}
              disabled={!canClaim}
              className="rounded-lg border px-3 py-1.5 text-xs hover:border-primary disabled:opacity-40"
            >
              Abholen
            </button>
          </div>
        </div>

        {dev && (
          <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">⚡ DevMode</p>
            <button
              onClick={() => { activatePremiumDebug(1); toast.success("Premium Pass (Debug) aktiviert"); refresh(); }}
              className="mt-2 rounded border border-primary/40 px-2 py-1 text-xs hover:bg-primary/10"
            >
              Pass gratis aktivieren
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
