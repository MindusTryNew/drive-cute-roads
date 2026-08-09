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
import { getFindHint } from "@/lib/find-hints";
import { getWishlist, toggleWish, subscribeWishlist } from "@/lib/wishlist";
import { SeriesPanel } from "@/components/SeriesPanel";
import { CraftingPanel } from "@/components/CraftingPanel";

type Status = "all" | "found" | "missing" | "dupes";
type EffectFilter = "all" | "coins" | "perm" | "temp" | "cosmetic";
type SortKey = "default" | "rarity-desc" | "rarity-asc" | "name" | "owned";

const PAGE = 240;

function fmtTime(sec: number): string {
  if (sec < 60) return `${Math.ceil(sec)} s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}:${String(Math.ceil(sec % 60)).padStart(2, "0")} min`;
  return `${Math.floor(sec / 3600)} h ${Math.floor((sec % 3600) / 60)} min`;
}

const ALL_SERIES = Array.from(new Set(COLLECTIBLES.map((c) => c.series).filter(Boolean) as string[])).sort();

export function CollectionCatalog({ onBack }: { onBack: () => void }) {
  const [counts, setCounts] = useState(getCollection());
  const [wish, setWish] = useState<string[]>([]);
  const [rarities, setRarities] = useState<Rarity[]>([]);
  const [status, setStatus] = useState<Status>("all");
  const [effectFilter, setEffectFilter] = useState<EffectFilter>("all");
  const [series, setSeries] = useState<string>("all");
  const [onlyWished, setOnlyWished] = useState(false);
  const [sort, setSort] = useState<SortKey>("default");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Collectible | null>(null);
  const [, tick] = useState(0);
  const [showSeries, setShowSeries] = useState(false);
  const [showCraft, setShowCraft] = useState(false);

  useEffect(() => subscribeCollection(setCounts), []);
  useEffect(() => subscribeActiveEffects(() => tick((n) => n + 1)), []);
  useEffect(() => {
    setWish(getWishlist());
    return subscribeWishlist(setWish);
  }, []);

  const foundCount = Object.keys(counts).filter((id) => counts[id] > 0).length;
  const pct = Math.round((foundCount / TOTAL_COUNT) * 100);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = COLLECTIBLES.filter((c) => {
      const n = counts[c.id] ?? 0;
      const found = n > 0;
      if (status === "found" && !found) return false;
      if (status === "missing" && found) return false;
      if (status === "dupes" && n < 2) return false;
      if (rarities.length > 0 && !rarities.includes(c.rarity)) return false;
      if (effectFilter !== "all" && (!c.effect || c.effect.kind !== effectFilter)) return false;
      if (series !== "all" && c.series !== series) return false;
      if (onlyWished && !wish.includes(c.id)) return false;
      if (term && !c.name.toLowerCase().includes(term) && !c.desc.toLowerCase().includes(term)) return false;
      return true;
    });
    const rIdx = (c: Collectible) => RARITY_ORDER.indexOf(c.rarity);
    if (sort === "rarity-desc") list.sort((a, b) => rIdx(b) - rIdx(a));
    else if (sort === "rarity-asc") list.sort((a, b) => rIdx(a) - rIdx(b));
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "de"));
    else if (sort === "owned") list.sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
    return list;
  }, [counts, rarities, status, effectFilter, series, onlyWished, wish, search, sort]);

  useEffect(() => { setLimit(PAGE); }, [rarities, status, effectFilter, series, onlyWished, search, sort]);

  const activeList = getActiveEffects();
  const visible = filtered.slice(0, limit);

  const toggleRarity = (r: Rarity) =>
    setRarities((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const chips: { label: string; clear: () => void }[] = [
    ...rarities.map((r) => ({ label: RARITY_LABEL[r], clear: () => toggleRarity(r) })),
    ...(status !== "all" ? [{ label: { found: "Gefunden", missing: "Fehlt", dupes: "Duplikate" }[status], clear: () => setStatus("all") }] : []),
    ...(effectFilter !== "all" ? [{ label: `Effekt: ${effectFilter}`, clear: () => setEffectFilter("all") }] : []),
    ...(series !== "all" ? [{ label: series, clear: () => setSeries("all") }] : []),
    ...(onlyWished ? [{ label: "Wunschliste", clear: () => setOnlyWished(false) }] : []),
    ...(search ? [{ label: `„${search}"`, clear: () => setSearch("") }] : []),
  ];

  const resetAll = () => {
    setRarities([]); setStatus("all"); setEffectFilter("all");
    setSeries("all"); setOnlyWished(false); setSearch(""); setSort("default");
  };

  const effectFilters: { id: EffectFilter; label: string }[] = [
    { id: "all", label: "Alle Effekte" },
    { id: "coins", label: "🪙 Coins" },
    { id: "perm", label: "♾️ Dauerhaft" },
    { id: "temp", label: "⏱️ Temporär" },
    { id: "cosmetic", label: "🎨 Cosmetic" },
  ];
  const statusFilters: { id: Status; label: string }[] = [
    { id: "all", label: `Alle (${TOTAL_COUNT})` },
    { id: "found", label: `Gefunden (${foundCount})` },
    { id: "missing", label: `Fehlt (${TOTAL_COUNT - foundCount})` },
    { id: "dupes", label: "Duplikate" },
  ];

  return (
    <main className="flex h-screen flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden p-4 md:p-6">
        <header className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold md:text-2xl">📖 Sammel-Katalog</h1>
            <p className="text-xs text-muted-foreground md:text-sm">{foundCount} / {TOTAL_COUNT} entdeckt · {pct}%</p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <button onClick={() => setShowSeries(true)} className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-1.5 text-sm hover:bg-accent/20">🗂️ Serien</button>
            <button onClick={() => setShowCraft(true)} className="rounded-lg border px-3 py-1.5 text-sm hover:border-primary">⚗️ Werkbank</button>
            <button onClick={onBack} className="rounded-lg border px-3 py-1.5 text-sm hover:border-primary">← Zurück</button>
          </div>
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

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="🔍 Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[160px] flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <select value={series} onChange={(e) => setSeries(e.target.value)}
            className="rounded-lg border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary">
            <option value="all">Alle Serien</option>
            {ALL_SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary">
            <option value="default">Sortierung: Standard</option>
            <option value="rarity-desc">Seltenheit ↓</option>
            <option value="rarity-asc">Seltenheit ↑</option>
            <option value="name">Name A–Z</option>
            <option value="owned">Besitz</option>
          </select>
          <button onClick={() => setOnlyWished((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${onlyWished ? "border-accent bg-accent/20" : "hover:border-accent"}`}>
            ⭐ Wunschliste ({wish.length})
          </button>
        </div>

        <div className="mb-2 flex flex-wrap gap-1.5">
          {statusFilters.map((f) => (
            <button key={f.id} onClick={() => setStatus(f.id)}
              className={`rounded-full border px-2.5 py-1 font-mono text-[11px] ${status === f.id ? "border-primary bg-primary/20" : "hover:border-primary"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {RARITY_ORDER.map((r) => {
            const on = rarities.includes(r);
            return (
              <button key={r} onClick={() => toggleRarity(r)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[11px] ${on ? "bg-primary/10" : "hover:border-primary"}`}
                style={on ? { borderColor: RARITY_COLORS[r], color: RARITY_COLORS[r] } : undefined}>
                {RARITY_LABEL[r]}
              </button>
            );
          })}
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {effectFilters.map((f) => (
            <button key={f.id} onClick={() => setEffectFilter(f.id)}
              className={`rounded-full border px-2.5 py-1 font-mono text-[11px] ${effectFilter === f.id ? "border-accent bg-accent/20" : "hover:border-accent"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {chips.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground">Aktiv:</span>
            {chips.map((c, i) => (
              <button key={i} onClick={c.clear} className="rounded-full border border-primary/50 bg-primary/10 px-2 py-0.5 hover:bg-primary/20">
                {c.label} ✕
              </button>
            ))}
            <button onClick={resetAll} className="rounded-full border px-2 py-0.5 hover:border-destructive">Alle zurücksetzen</button>
          </div>
        )}

        <p className="mb-2 font-mono text-[11px] text-muted-foreground">{filtered.length} Treffer</p>

        <div className="flex-1 overflow-y-auto pr-1" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
            {visible.map((c) => {
              const n = counts[c.id] ?? 0;
              const found = n > 0;
              const color = RARITY_COLORS[c.rarity];
              const isTemp = c.effect?.kind === "temp";
              const cdMs = isTemp ? cooldownRemaining(c.id) : 0;
              const wished = wish.includes(c.id);
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
                  {wished && <div className="absolute left-0.5 top-0.5 text-[10px]">⭐</div>}
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
          {limit < filtered.length && (
            <button onClick={() => setLimit((l) => l + PAGE)}
              className="mx-auto mt-4 block rounded-lg border px-4 py-2 text-sm hover:border-primary">
              Weitere {Math.min(PAGE, filtered.length - limit)} laden
            </button>
          )}
        </div>
      </div>

      {selected && (
        <ItemDetailDialog
          item={selected}
          owned={counts[selected.id] ?? 0}
          wished={wish.includes(selected.id)}
          onToggleWish={() => {
            const added = toggleWish(selected.id);
            toast.success(added ? "Zur Wunschliste hinzugefügt." : "Von der Wunschliste entfernt.");
          }}
          onClose={() => setSelected(null)}
          onActivate={() => {
            const res = activateItem(selected.id);
            if (res.ok) toast.success(res.message);
            else toast.error(res.message);
            tick((n) => n + 1);
          }}
        />
      )}
      {showSeries && <SeriesPanel onClose={() => setShowSeries(false)} />}
      {showCraft && <CraftingPanel onClose={() => setShowCraft(false)} />}
    </main>
  );
}

function ItemDetailDialog({
  item,
  owned,
  wished,
  onToggleWish,
  onClose,
  onActivate,
}: {
  item: Collectible;
  owned: number;
  wished: boolean;
  onToggleWish: () => void;
  onClose: () => void;
  onActivate: () => void;
}) {
  const color = RARITY_COLORS[item.rarity];
  const found = owned > 0;
  const isTemp = item.effect?.kind === "temp";
  const cdMs = isTemp ? cooldownRemaining(item.id) : 0;
  const rarityCd = RARITY_COOLDOWN_SEC[item.rarity];
  const hint = getFindHint(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border-2 bg-card p-5"
        style={{ borderColor: color, boxShadow: `0 20px 60px -20px ${color}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-6xl">{found ? item.emoji : "❓"}</div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest" style={{ color }}>{RARITY_LABEL[item.rarity]}</p>
          <h3 className="text-xl font-bold">{found ? item.name : "Unbekannt"}</h3>
          {item.series && <p className="font-mono text-[10px] text-muted-foreground">{item.series}</p>}
          <p className="mt-2 text-sm text-muted-foreground">{found ? item.desc : "Finde dieses Item um es zu entsperren."}</p>
          {found && owned > 1 && <p className="mt-1 font-mono text-xs">Besitz: ×{owned}</p>}
        </div>

        <div className="mt-4 rounded-lg border bg-background/50 p-3 text-xs">
          <p className="mb-1 font-mono uppercase tracking-widest text-muted-foreground">Fundort-Hinweis</p>
          <p>{found ? hint.precise : hint.vague}</p>
        </div>

        <button onClick={onToggleWish}
          className={`mt-3 w-full rounded-lg border px-4 py-2 text-sm ${wished ? "border-accent bg-accent/20" : "hover:border-accent"}`}>
          {wished ? "⭐ Auf der Wunschliste" : "☆ Auf Wunschliste setzen"}
        </button>

        {found && isTemp && (
          <div className="mt-3 rounded-lg border bg-background/50 p-3 text-center">
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
