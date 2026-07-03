import { useEffect, useState } from "react";
import { COLLECTIBLES, RARITY_COLORS, RARITY_LABEL, TOTAL_COUNT, type Rarity } from "@/lib/collectibles";
import { getCollection, subscribeCollection } from "@/lib/collection";

type Filter = "all" | Rarity | "found" | "missing";

export function CollectionCatalog({ onBack }: { onBack: () => void }) {
  const [counts, setCounts] = useState(getCollection());
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => subscribeCollection(setCounts), []);

  const foundIds = Object.keys(counts).filter((id) => counts[id] > 0);
  const foundCount = foundIds.length;
  const pct = Math.round((foundCount / TOTAL_COUNT) * 100);

  const filtered = COLLECTIBLES.filter((c) => {
    const found = (counts[c.id] ?? 0) > 0;
    if (filter === "all") return true;
    if (filter === "found") return found;
    if (filter === "missing") return !found;
    return c.rarity === filter;
  });

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: `Alle (${TOTAL_COUNT})` },
    { id: "found", label: `Gefunden (${foundCount})` },
    { id: "missing", label: `Fehlt (${TOTAL_COUNT - foundCount})` },
    { id: "common", label: "Gewöhnlich" },
    { id: "uncommon", label: "Ungewöhnlich" },
    { id: "rare", label: "Selten" },
    { id: "epic", label: "Episch" },
    { id: "legendary", label: "Legendär" },
  ];

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📖 Sammel-Katalog</h1>
            <p className="text-sm text-muted-foreground">{foundCount} / {TOTAL_COUNT} entdeckt · {pct}%</p>
          </div>
          <button onClick={onBack} className="rounded-lg border px-4 py-2 text-sm hover:border-primary">← Zurück</button>
        </header>

        <div className="mb-4 h-2 overflow-hidden rounded-full border bg-card/60">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${pct}%` }} />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1 font-mono text-xs ${filter === f.id ? "border-primary bg-primary/20" : "hover:border-primary"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {filtered.map((c) => {
            const n = counts[c.id] ?? 0;
            const found = n > 0;
            const color = RARITY_COLORS[c.rarity];
            return (
              <div
                key={c.id}
                title={`${c.name} — ${RARITY_LABEL[c.rarity]}\n${c.desc}`}
                className="group relative aspect-square rounded-lg border-2 p-1 text-center transition-transform hover:scale-105"
                style={{
                  borderColor: found ? color : "#333",
                  background: found ? `linear-gradient(135deg, ${color}15, transparent)` : "rgba(0,0,0,0.4)",
                }}
              >
                <div className={`flex h-full flex-col items-center justify-center gap-1 ${found ? "" : "opacity-25 grayscale"}`}>
                  <div className="text-3xl">{found ? c.emoji : "❓"}</div>
                  <p className="line-clamp-1 text-[9px] font-bold">{found ? c.name : "???"}</p>
                </div>
                {n > 1 && (
                  <div className="absolute right-0.5 top-0.5 rounded-full bg-black/70 px-1.5 py-0.5 font-mono text-[9px]">×{n}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
