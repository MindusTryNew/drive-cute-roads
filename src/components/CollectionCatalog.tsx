import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  COLLECTIBLES,
  RARITY_COLORS,
  RARITY_LABEL,
  RARITY_ORDER,
  RARITY_COOLDOWN_SEC,
  TOTAL_COUNT,
  type Rarity,
  type Collectible,
} from "@/lib/collectibles";
import { getCollection, subscribeCollection } from "@/lib/collection";
import { activateItem, cooldownRemaining, subscribeActiveEffects, getActiveEffects } from "@/lib/active-effects";

type Filter = "all" | Rarity | "found" | "missing";
type EffectFilter = "all" | "coins" | "perm" | "temp" | "cosmetic";

function fmtTime(sec: number): string {
  if (sec < 60) return `${Math.ceil(sec)} s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}:${String(Math.ceil(sec % 60)).padStart(2, "0")} min`;
  return `${Math.floor(sec / 3600)} h ${Math.floor((sec % 3600) / 60)} min`;
}

export function CollectionCatalog({ onBack }: { onBack: () => void }) {
  const [counts, setCounts] = useState(getCollection());
  const [filter, setFilter] = useState<Filter>("all");
  const [effectFilter, setEffectFilter] = useState<EffectFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Collectible | null>(null);
  const [, tick] = useState(0);

  useEffect(() => subscribeCollection(setCounts), []);
  useEffect(() => subscribeActiveEffects(() => tick((n) => n + 1)), []);

  const foundIds = Object.keys(counts).filter((id) => counts[id] > 0);
  const foundCount = foundIds.length;
  const pct = Math.round((foundCount / TOTAL_COUNT) * 100);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return COLLECTIBLES.filter((c) => {
      const found = (counts[c.id] ?? 0) > 0;
      if (filter === "found" && !found) return false;
      if (filter === "missing" && found) return false;
      if (filter !== "all" && filter !== "found" && filter !== "missing" && c.rarity !== filter) return false;
      if (effectFilter !== "all") {
        if (!c.effect || c.effect.kind !== effectFilter) return false;
      }
      if (term && !c.name.toLowerCase().includes(term) && !c.desc.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [counts, filter, effectFilter, search]);

  const activeList = getActiveEffects();

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: `Alle (${TOTAL_COUNT})` },
    { id: "found", label: `Gefunden (${foundCount})` },
    { id: "missing", label: `Fehlt (${TOTAL_COUNT - foundCount})` },
    ...RARITY_ORDER.map((r) => ({ id: r as Filter, label: RARITY_LABEL[r] })),
  ];
  const effectFilters: { id: EffectFilter; label: string }[] = [
    { id: "all", label: "Alle Effekte" },
    { id: "coins", label: "🪙 Coins" },
    { id: "perm", label: "♾️ Dauerhaft" },
    { id: "temp", label: "⏱️ Temporär" },
    { id: "cosmetic", label: "🎨 Cosmetic" },
  ];

  return (
    <main className="flex h-screen flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden p-4 md:p-6">
        <header className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold md:text-2xl">📖 Sammel-Katalog</h1>
            <p className="text-xs text-muted-foreground md:text-sm">{foundCount} / {TOTAL_COUNT} entdeckt · {pct}%</p>
          </div>
          <button onClick={onBack} className="rounded-lg border px-3 py-1.5 text-sm hover:border-primary">← Zurück</button>
        </header>

        <div className="mb-3 h-2 overflow-hidden rounded-full border bg-card/60">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${pct}%` }} />
        </div>

        {activeList.length > 0 && (
          <div className="mb-3 rounded-lg border border-primary/40 bg-primary/5 p-2 text-xs">
            <p className="mb-1 font-mono uppercase tracking-widest text-primary">Aktive Buffs</p>
            <div className="flex flex-wrap gap-2">
              {activeList.map((e, i) => {
                const remaining = Math.max(0, (e.endsAt - Date.now()) / 1000);
                return (
                  <span key={i} className="rounded-full bg-primary/15 px-2 py-0.5 font-mono">
                    +{e.pct}% {e.stat} · {fmtTime(remaining)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-2 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="🔍 Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[140px] rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[11px] ${filter === f.id ? "border-primary bg-primary/20" : "hover:border-primary"}`}
              style={filter === f.id && RARITY_ORDER.includes(f.id as Rarity) ? { borderColor: RARITY_COLORS[f.id as Rarity], color: RARITY_COLORS[f.id as Rarity] } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {effectFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setEffectFilter(f.id)}
              className={`rounded-full border px-2.5 py-1 font-mono text-[11px] ${effectFilter === f.id ? "border-accent bg-accent/20" : "hover:border-accent"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-1" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
            {filtered.map((c) => {
              const n = counts[c.id] ?? 0;
              const found = n > 0;
              const color = RARITY_COLORS[c.rarity];
              const isTemp = c.effect?.kind === "temp";
              const cdMs = isTemp ? cooldownRemaining(c.id) : 0;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="group relative aspect-square rounded-lg border-2 p-1 text-center transition-transform hover:scale-105"
                  style={{
                    borderColor: found ? color : "#333",
                    background: found ? `linear-gradient(135deg, ${color}20, transparent)` : "rgba(0,0,0,0.4)",
                  }}
                >
                  <div className={`flex h-full flex-col items-center justify-center gap-1 ${found ? "" : "opacity-25 grayscale"}`}>
                    <div className="text-3xl">{found ? c.emoji : "❓"}</div>
                    <p className="line-clamp-1 text-[9px] font-bold">{found ? c.name : "???"}</p>
                  </div>
                  {n > 1 && (
                    <div className="absolute right-0.5 top-0.5 rounded-full bg-black/70 px-1.5 py-0.5 font-mono text-[9px]">×{n}</div>
                  )}
                  {found && isTemp && cdMs > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/70 font-mono text-[10px] text-white">
                      {fmtTime(cdMs / 1000)}
                    </div>
                  )}
                  {found && isTemp && cdMs <= 0 && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-primary/90 px-1.5 py-0.5 font-mono text-[8px] text-primary-foreground">
                      ⚡ AKTIV
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="mt-8 text-center text-sm text-muted-foreground">Keine Items — Filter zurücksetzen.</p>
          )}
        </div>
      </div>

      {selected && (
        <ItemDetailDialog
          item={selected}
          owned={counts[selected.id] ?? 0}
          onClose={() => setSelected(null)}
          onActivate={() => {
            const res = activateItem(selected.id);
            if (res.ok) toast.success(res.message);
            else toast.error(res.message);
            tick((n) => n + 1);
          }}
        />
      )}
    </main>
  );
}

function ItemDetailDialog({
  item,
  owned,
  onClose,
  onActivate,
}: {
  item: Collectible;
  owned: number;
  onClose: () => void;
  onActivate: () => void;
}) {
  const color = RARITY_COLORS[item.rarity];
  const found = owned > 0;
  const isTemp = item.effect?.kind === "temp";
  const cdMs = isTemp ? cooldownRemaining(item.id) : 0;
  const rarityCd = RARITY_COOLDOWN_SEC[item.rarity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border-2 bg-card p-5"
        style={{ borderColor: color, boxShadow: `0 20px 60px -20px ${color}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-6xl">{found ? item.emoji : "❓"}</div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest" style={{ color }}>{RARITY_LABEL[item.rarity]}</p>
          <h3 className="text-xl font-bold">{found ? item.name : "Unbekannt"}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{found ? item.desc : "Finde dieses Item um es zu entsperren."}</p>
          {found && owned > 1 && <p className="mt-1 font-mono text-xs">Besitz: ×{owned}</p>}
        </div>

        {found && isTemp && (
          <div className="mt-4 rounded-lg border bg-background/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Cooldown pro Aktivierung: {fmtTime(rarityCd)}</p>
            {cdMs > 0 ? (
              <button disabled className="mt-2 w-full rounded-lg border bg-muted px-4 py-2 text-sm opacity-60">
                Cooldown: {fmtTime(cdMs / 1000)}
              </button>
            ) : (
              <button
                onClick={onActivate}
                className="mt-2 w-full rounded-lg border-2 px-4 py-2 text-sm font-bold hover:bg-primary/10"
                style={{ borderColor: color, color }}
              >
                ⚡ Aktivieren
              </button>
            )}
          </div>
        )}

        <button onClick={onClose} className="mt-4 w-full rounded-lg border px-4 py-2 text-sm hover:border-primary">
          Schließen
        </button>
      </div>
    </div>
  );
}
