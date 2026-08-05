import { useState } from "react";
import { toast } from "sonner";
import {
  hasClaimedAnniversaryGift,
  claimAnniversaryGift,
  ANNIVERSARY_PRESET_KEYS,
  ANNIVERSARY_ITEM_IDS,
  ANNIVERSARY_COIN_REWARD,
} from "@/lib/anniversary-gift";
import { PRESETS_BY_KEY } from "@/lib/preset-cars";
import { COLLECTIBLES_BY_ID } from "@/lib/collectibles";

export function AnniversaryGiftDialog({ onClose, onClaimed }: { onClose: () => void; onClaimed?: () => void }) {
  const [claimed, setClaimed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleClaim = () => {
    setErrors([]);
    try {
      const res = claimAnniversaryGift();
      if (res.ok) {
        setClaimed(true);
        onClaimed?.();
        toast.success(`🎉 Geschenk erhalten: ${res.cars} Autos, ${res.items} Items, ${res.coins.toLocaleString()} Coins!`);
      } else {
        setErrors(res.errors.length ? res.errors : ["Unbekannter Fehler beim Einlösen."]);
        toast.error(res.errors[0] ?? "Einlösen fehlgeschlagen.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unerwarteter Fehler";
      setErrors([msg]);
      toast.error(msg);
    }
  };

  const alreadyClaimed = claimed || hasClaimedAnniversaryGift();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-[min(640px,95vw)] max-h-[90vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Drift Lab · 2 Monate</p>
          <h2 className="mt-2 text-3xl font-bold">Happy Anniversary!</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Drift Lab wird zwei Monate alt — und es geht weiter! Danke an jeden, der Autos gebaut,
            Mods geteilt, Missionen gemeistert und Feedback gegeben hat. Zum Jubiläum gibt es das
            XXXL-Modding-Update und ein Geschenk für dich.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-center font-bold">Dein Jubiläums-Geschenk</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl">🚗</p>
              <p className="mt-1 text-lg font-bold">{ANNIVERSARY_PRESET_KEYS.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Autos</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl">🎁</p>
              <p className="mt-1 text-lg font-bold">{ANNIVERSARY_ITEM_IDS.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Items</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl">🪙</p>
              <p className="mt-1 text-lg font-bold">{ANNIVERSARY_COIN_REWARD.toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Coins</p>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Passende Garagenplätze werden automatisch gratis freigeschaltet.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="mb-2 text-sm font-bold">Enthaltene Fahrzeuge</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {ANNIVERSARY_PRESET_KEYS.map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: PRESETS_BY_KEY[k]?.primary ?? "#fff" }} />
                  {PRESETS_BY_KEY[k]?.name ?? k}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border p-4">
            <p className="mb-2 text-sm font-bold">Enthaltene Items</p>
            <div className="flex flex-wrap gap-1">
              {ANNIVERSARY_ITEM_IDS.map((id) => {
                const item = COLLECTIBLES_BY_ID[id];
                return (
                  <span key={id} title={item?.name ?? id} className="rounded border px-1.5 py-0.5 text-xs">
                    {item?.emoji ?? "🎁"}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {errors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        )}

        <div className="mt-8 flex justify-center gap-3">
          {!alreadyClaimed ? (
            <button
              onClick={handleClaim}
              className="rounded-lg bg-primary px-8 py-3 text-base font-bold text-primary-foreground shadow-lg"
              style={{ boxShadow: "var(--hud-glow)" }}
            >
              🎉 Geschenk einlösen
            </button>
          ) : (
            <button
              disabled
              className="rounded-lg border border-primary/50 bg-primary/10 px-8 py-3 text-base font-bold text-primary"
            >
              ✅ Bereits eingelöst
            </button>
          )}
          <button onClick={onClose} className="rounded-lg border px-6 py-3 text-sm hover:border-primary">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
