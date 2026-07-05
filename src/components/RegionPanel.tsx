import { useEffect, useState } from "react";
import { toast } from "sonner";
import { REGIONS, type RegionId, getUnlocked, unlockRegion, subscribeRegions, getActiveRegion, setActiveRegion } from "@/lib/regions";
import { getCoins, spendCoins, subscribeCoins } from "@/lib/coins";

export function RegionPanel({ onClose }: { onClose: () => void }) {
  const [unlocked, setUnlocked] = useState<RegionId[]>(getUnlocked());
  const [active, setActive] = useState<RegionId>(getActiveRegion());
  const [coins, setCoins] = useState(getCoins());

  useEffect(() => {
    const u1 = subscribeRegions(setUnlocked);
    const u2 = subscribeCoins(setCoins);
    return () => { u1(); u2(); };
  }, []);

  const buy = (id: RegionId, price: number) => {
    if (!spendCoins(price)) { toast.error(`Nicht genug Coins (🪙 ${price} nötig).`); return; }
    unlockRegion(id);
    toast.success(`✅ Region freigeschaltet!`);
  };

  const chooseActive = (id: RegionId) => {
    setActiveRegion(id);
    setActive(id);
    toast.success(`🚗 Startpunkt gesetzt — Region wird beim nächsten Start geladen.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">🗺️ Regionen</h2>
            <p className="text-xs text-muted-foreground">Freischalten & Startpunkt wählen · 🪙 {coins.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-xl leading-none opacity-60 hover:opacity-100">×</button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {REGIONS.map((r) => {
            const isOn = unlocked.includes(r.id);
            const isActive = active === r.id;
            return (
              <div
                key={r.id}
                className={`rounded-xl border-2 p-4 ${isActive ? "border-primary bg-primary/5" : "border-border"}`}
                style={{ boxShadow: isActive ? `0 0 30px ${r.color}44` : undefined }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{r.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold">{r.name}</h3>
                    <p className="font-mono text-[9px] uppercase text-muted-foreground">
                      {isOn ? "Freigeschaltet" : `Sperre — 🪙 ${r.price.toLocaleString()}`}
                    </p>
                  </div>
                  <div className="h-6 w-6 rounded-full" style={{ background: r.color }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{r.desc}</p>
                <div className="mt-3 flex gap-2">
                  {isOn ? (
                    <button
                      onClick={() => chooseActive(r.id)}
                      disabled={isActive}
                      className="flex-1 rounded-lg border-2 border-primary bg-primary/10 py-1.5 text-sm font-bold hover:bg-primary/20 disabled:opacity-40"
                    >
                      {isActive ? "✓ Aktiver Startpunkt" : "Startpunkt setzen"}
                    </button>
                  ) : (
                    <button
                      onClick={() => buy(r.id, r.price)}
                      disabled={coins < r.price}
                      className="flex-1 rounded-lg border py-1.5 text-sm hover:border-primary disabled:opacity-40"
                    >
                      Freischalten (🪙 {r.price.toLocaleString()})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
