import { useEffect, useState } from "react";
import { getInventory, consumePack, subscribeInventory } from "@/lib/inventory";
import { PACK_META, rollPack, type PackType, type Collectible } from "@/lib/collectibles";
import { addToCollection } from "@/lib/collection";
import { addCoins } from "@/lib/coins";
import { PackOpeningDialog } from "@/components/PackOpeningDialog";

export function Inventory({ onBack }: { onBack: () => void }) {
  const [packs, setPacks] = useState<PackType[]>(getInventory());
  const [opening, setOpening] = useState<{ pack: PackType; items: Collectible[] } | null>(null);

  useEffect(() => subscribeInventory(setPacks), []);

  const counts: Record<PackType, number> = { starter: 0, standard: 0, deluxe: 0, mythic: 0 };
  packs.forEach((p) => counts[p]++);

  const openOne = (p: PackType) => {
    if (!consumePack(p)) return;
    const items = rollPack(p);
    for (const it of items) {
      addToCollection(it.id);
      if (it.effect?.kind === "coins") addCoins(it.effect.amount);
    }
    setOpening({ pack: p, items });
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🎒 Inventar</h1>
            <p className="text-sm text-muted-foreground">{packs.length} Paket(e) — öffne sie und sammle Items.</p>
          </div>
          <button onClick={onBack} className="rounded-lg border px-4 py-2 text-sm hover:border-primary">← Zurück</button>
        </header>

        {packs.length === 0 && (
          <div className="rounded-xl border bg-card/60 p-8 text-center text-muted-foreground">
            <p className="text-lg">Noch keine Pakete.</p>
            <p className="mt-2 text-sm">Schließe Missionen ab oder finde sie in der Open-World (1.2 % Chance).</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(counts) as PackType[]).filter((p) => counts[p] > 0).map((p) => {
            const meta = PACK_META[p];
            return (
              <div key={p} className="rounded-xl border bg-card/70 p-5" style={{ borderColor: meta.color + "55" }}>
                <div className="flex items-center gap-3">
                  <div className="text-5xl">{meta.emoji}</div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold" style={{ color: meta.color }}>{meta.label}</h2>
                    <p className="text-xs text-muted-foreground">{meta.desc}</p>
                  </div>
                  <div className="rounded-full border px-3 py-1 font-mono text-sm">×{counts[p]}</div>
                </div>
                <button
                  onClick={() => openOne(p)}
                  className="mt-4 w-full rounded-lg border-2 py-2 font-mono text-sm hover:bg-primary/10 hover:border-primary transition-colors"
                  style={{ borderColor: meta.color }}
                >
                  Öffnen
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {opening && (
        <PackOpeningDialog
          pack={opening.pack}
          items={opening.items}
          onClose={() => setOpening(null)}
        />
      )}
    </main>
  );
}
