import { useEffect, useState } from "react";
import { PACK_META, RARITY_COLORS, RARITY_LABEL, type PackType, type Collectible } from "@/lib/collectibles";

export function PackOpeningDialog({
  pack,
  items,
  onClose,
}: {
  pack: PackType;
  items: Collectible[];
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"shake" | "reveal">("shake");
  const [revealed, setRevealed] = useState(0);
  const meta = PACK_META[pack];

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 900);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== "reveal") return;
    const timers: number[] = [];
    for (let i = 0; i < items.length; i++) {
      timers.push(window.setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), i * 250));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase, items.length]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 bg-card p-6" style={{ borderColor: meta.color }}>
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold" style={{ color: meta.color }}>{meta.emoji} {meta.label}</h2>
        </div>

        {phase === "shake" && (
          <div className="flex items-center justify-center py-16">
            <div className="text-9xl animate-bounce" style={{ animation: "packShake 0.15s infinite alternate" }}>
              {meta.emoji}
            </div>
          </div>
        )}

        {phase === "reveal" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((it, i) => {
              const shown = i < revealed;
              const color = RARITY_COLORS[it.rarity];
              return (
                <div
                  key={i}
                  className={`rounded-lg border-2 p-3 text-center transition-all duration-500 ${shown ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
                  style={{
                    borderColor: color,
                    boxShadow: shown ? `0 0 20px ${color}66` : "none",
                    background: shown ? `linear-gradient(135deg, ${color}20, transparent)` : "transparent",
                  }}
                >
                  <div className="text-4xl">{it.emoji}</div>
                  <p className="mt-1 truncate text-sm font-bold">{it.name}</p>
                  <p className="text-[10px] font-mono uppercase" style={{ color }}>{RARITY_LABEL[it.rarity]}</p>
                  <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{it.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            disabled={phase !== "reveal" || revealed < items.length}
            className="rounded-lg border-2 border-primary bg-primary/10 px-5 py-2 font-mono text-sm hover:bg-primary/20 disabled:opacity-40"
          >
            Weiter
          </button>
        </div>
      </div>

      <style>{`
        @keyframes packShake {
          0% { transform: rotate(-6deg) scale(1); }
          100% { transform: rotate(6deg) scale(1.08); }
        }
      `}</style>
    </div>
  );
}
