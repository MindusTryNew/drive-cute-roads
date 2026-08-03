import { useState } from "react";
import { toast } from "sonner";
import {
  hasClaimedFarewellGift,
  claimFarewellGift,
  FAREWELL_PRESET_KEYS,
  FAREWELL_ITEM_IDS,
  FAREWELL_COIN_REWARD,
} from "@/lib/farewell-gift";
import { PRESETS_BY_KEY } from "@/lib/preset-cars";
import { COLLECTIBLES_BY_ID } from "@/lib/collectibles";

export function FarewellGiftDialog({ onClose }: { onClose: () => void }) {
  const [claimed, setClaimed] = useState(hasClaimedFarewellGift());

  const handleClaim = () => {
    const res = claimFarewellGift();
    if (res.ok) {
      setClaimed(true);
      toast.success("🎁 Dankeschön-Geschenk eingelöst!");
    } else {
      toast.error(res.reason ?? "Fehler");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-[min(640px,95vw)] max-h-[90vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Drift Lab v2.0</p>
          <h2 className="mt-2 text-3xl font-bold">Danke, dass ihr dabei wart!</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Dies ist das letzte große Update von Drift Lab. Wir möchten uns bei jedem Spieler bedanken,
            der Autos gebaut, Mods geteilt, Missionen gemeistert und uns Feedback gegeben hat.
            Ihr habt dieses Spiel zu dem gemacht, was es heute ist.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-center font-bold">Euer einmaliges Farewell-Geschenk</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl">🚗</p>
              <p className="mt-1 text-lg font-bold">{FAREWELL_PRESET_KEYS.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Autos</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl">🎁</p>
              <p className="mt-1 text-lg font-bold">{FAREWELL_ITEM_IDS.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Items</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl">🪙</p>
              <p className="mt-1 text-lg font-bold">{FAREWELL_COIN_REWARD.toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Coins</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="mb-2 text-sm font-bold">Enthaltene Fahrzeuge</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {FAREWELL_PRESET_KEYS.map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: PRESETS_BY_KEY[k]?.primary ?? "#fff" }} />
                  {PRESETS_BY_KEY[k]?.name ?? k}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border p-4">
            <p className="mb-2 text-sm font-bold">Enthaltene Items (Auswahl)</p>
            <div className="flex flex-wrap gap-1">
              {FAREWELL_ITEM_IDS.map((id) => {
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

        <div className="mt-8 flex justify-center gap-3">
          {!claimed ? (
            <button
              onClick={handleClaim}
              className="rounded-lg bg-primary px-8 py-3 text-base font-bold text-primary-foreground shadow-lg"
              style={{ boxShadow: "var(--hud-glow)" }}
            >
              🎁 Geschenk einlösen
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
