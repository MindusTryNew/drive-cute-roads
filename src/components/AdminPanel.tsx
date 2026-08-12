import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  listCloudMissions,
  createCloudMission,
  setMissionActive,
  deleteCloudMission,
  listCloudSeriesAdmin,
  createCloudSeries,
  setSeriesActive,
  deleteCloudSeries,
  revokeAdmin,
  listRarities,
  createRarity,
  setRarityActive,
  deleteRarity,
  listCustomItems,
  createCustomItems,
  deleteCustomItem,
  listAdminBundles,
  createAdminBundle,
  setBundleActive,
  deleteAdminBundle,
  type CloudMissionRow,
  type CloudSeriesRow,
  type RarityRow,
  type ItemRow,
  type BundleRow,
  type NewItem,
} from "@/lib/admin";
import {
  COLLECTIBLES,
  RARITY_ORDER,
  RARITY_LABEL,
  RARITY_COLORS,
  PACK_META,
  PACK_TYPES,
  type PackType,
} from "@/lib/collectibles";
import { addCoins, setCoinsAbsolute } from "@/lib/coins";
import { addPack } from "@/lib/inventory";
import { refreshCloudSeries } from "@/lib/series";
import { loadCustomContent } from "@/lib/custom-content";
import { PRESETS } from "@/lib/preset-cars";
import { bundleValue, normalizeContents, type BundleContents, type Booster } from "@/lib/admin-bundles";

type Tab = "missions" | "series" | "rarities" | "items" | "bundles" | "coins";

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("missions");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-primary/50 bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Admin-Konsole</p>
            <h2 className="text-lg font-bold">Inhalte verwalten</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { revokeAdmin(); toast.info("Admin-Rechte lokal entfernt."); onClose(); }}
              className="rounded-lg border px-3 py-1.5 text-xs hover:border-destructive hover:text-destructive"
            >
              Abmelden
            </button>
            <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:border-primary">✕</button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 border-b px-5 py-2">
          {([
            ["missions", "🎯 Missionen"],
            ["series", "🗂️ Sammelserien"],
            ["rarities", "💎 Seltenheiten"],
            ["items", "🧪 Item-Generator"],
            ["bundles", "🎁 Bundles"],
            ["coins", "🪙 Coins"],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-full border px-3 py-1 text-xs ${tab === id ? "border-primary bg-primary/15" : "hover:border-primary"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "missions" && <MissionsTab />}
          {tab === "series" && <SeriesTab />}
          {tab === "rarities" && <RaritiesTab />}
          {tab === "items" && <ItemsTab />}
          {tab === "bundles" && <BundlesTab />}
          {tab === "coins" && <CoinsTab />}
        </div>
      </div>
    </div>
  );
}

function MissionsTab() {
  const [rows, setRows] = useState<CloudMissionRow[]>([]);
  const [title, setTitle] = useState("Neue Mission");
  const [desc, setDesc] = useState("");
  const [goalKind, setGoalKind] = useState("distance");
  const [goalValue, setGoalValue] = useState(2000);
  const [coins, setCoins] = useState(800);
  const [pack, setPack] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = () => { listCloudMissions().then(setRows).catch(() => setRows([])); };
  useEffect(load, []);

  const create = async () => {
    setBusy(true);
    try {
      await createCloudMission({ title, description: desc, goalKind, goalValue, coins, pack: pack || undefined });
      toast.success("Mission online gestellt — für alle Spieler sichtbar.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehlgeschlagen");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-background/50 p-4">
        <h3 className="mb-3 text-sm font-bold">Neue Mission erstellen</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Titel"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} className={inputCls} /></Field>
          <Field label="Beschreibung"><input value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={160} className={inputCls} /></Field>
          <Field label="Zieltyp">
            <select value={goalKind} onChange={(e) => setGoalKind(e.target.value)} className={inputCls}>
              <option value="distance">Distanz (m)</option>
              <option value="topSpeed">Top-Speed (km/h)</option>
              <option value="drift">Drift-Sekunden</option>
              <option value="airtime">Flugzeit (s)</option>
              <option value="collect">Items sammeln</option>
            </select>
          </Field>
          <Field label="Zielwert"><input type="number" value={goalValue} onChange={(e) => setGoalValue(Number(e.target.value) || 1)} className={inputCls} /></Field>
          <Field label="Coins"><input type="number" value={coins} onChange={(e) => setCoins(Number(e.target.value) || 0)} className={inputCls} /></Field>
          <Field label="Paket-Belohnung">
            <select value={pack} onChange={(e) => setPack(e.target.value)} className={inputCls}>
              <option value="">— keins —</option>
              {PACK_TYPES.map((p) => <option key={p} value={p}>{PACK_META[p].label}</option>)}
            </select>
          </Field>
        </div>
        <button onClick={create} disabled={busy} className={primaryBtn}>
          Online stellen
        </button>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold">Bestehende Missionen ({rows.length})</h3>
        {rows.length === 0 && <p className="text-xs text-muted-foreground">Noch keine Cloud-Missionen.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex-1">
              <p className="text-sm font-bold">{r.title}</p>
              <p className="text-[11px] text-muted-foreground">{r.description || "—"} · 🪙 {r.reward?.coins ?? 0}</p>
            </div>
            <button onClick={async () => { await setMissionActive(r.id, !r.active).catch(() => {}); load(); }}
              className={`rounded-full border px-2 py-1 text-[11px] ${r.active ? "border-primary bg-primary/15" : ""}`}>
              {r.active ? "Aktiv" : "Inaktiv"}
            </button>
            <button onClick={async () => { await deleteCloudMission(r.id).catch(() => {}); load(); }}
              className="rounded-full border px-2 py-1 text-[11px] text-destructive hover:border-destructive">Löschen</button>
          </div>
        ))}
      </section>
    </div>
  );
}

function SeriesTab() {
  const [rows, setRows] = useState<CloudSeriesRow[]>([]);
  const [name, setName] = useState("Meine Serie");
  const [desc, setDesc] = useState("");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => { listCloudSeriesAdmin().then(setRows).catch(() => setRows([])); };
  useEffect(load, []);

  const results = search.trim()
    ? COLLECTIBLES.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 40)
    : [];

  const create = async () => {
    if (picked.length < 2) { toast.error("Mindestens 2 Items wählen."); return; }
    setBusy(true);
    try {
      const base = picked.length * 60;
      await createCloudSeries({
        name, description: desc, itemIds: picked,
        tiers: [
          { pct: 25, coins: Math.round(base * 0.5), label: "Sammler" },
          { pct: 50, coins: Math.round(base * 1.0), label: "Kenner" },
          { pct: 75, coins: Math.round(base * 1.8), label: "Experte" },
          { pct: 100, coins: Math.round(base * 3.5), label: "Meister" },
        ],
      });
      toast.success("Sammelserie online — für alle Spieler sichtbar.");
      setPicked([]);
      await refreshCloudSeries();
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehlgeschlagen");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-background/50 p-4">
        <h3 className="mb-3 text-sm font-bold">Neue Sammelserie</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputCls} /></Field>
          <Field label="Beschreibung"><input value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={200} className={inputCls} /></Field>
        </div>
        <Field label="Items suchen und hinzufügen">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Item-Name" className={inputCls} />
        </Field>
        {results.length > 0 && (
          <div className="mt-2 flex max-h-40 flex-wrap gap-1 overflow-y-auto">
            {results.map((c) => (
              <button key={c.id} onClick={() => setPicked((p) => (p.includes(c.id) ? p : [...p, c.id]))}
                className="rounded-full border px-2 py-1 text-[11px] hover:border-primary">
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        )}
        {picked.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {picked.map((id) => (
              <button key={id} onClick={() => setPicked((p) => p.filter((x) => x !== id))}
                className="rounded-full border border-primary bg-primary/10 px-2 py-1 text-[11px]">
                {id} ✕
              </button>
            ))}
          </div>
        )}
        <button onClick={create} disabled={busy} className={primaryBtn}>
          Serie online stellen ({picked.length} Items)
        </button>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold">Bestehende Serien ({rows.length})</h3>
        {rows.length === 0 && <p className="text-xs text-muted-foreground">Noch keine Cloud-Serien.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex-1">
              <p className="text-sm font-bold">{r.name}</p>
              <p className="text-[11px] text-muted-foreground">{(r.item_ids ?? []).length} Items</p>
            </div>
            <button onClick={async () => { await setSeriesActive(r.id, !r.active).catch(() => {}); await refreshCloudSeries(); load(); }}
              className={`rounded-full border px-2 py-1 text-[11px] ${r.active ? "border-primary bg-primary/15" : ""}`}>
              {r.active ? "Aktiv" : "Inaktiv"}
            </button>
            <button onClick={async () => { await deleteCloudSeries(r.id).catch(() => {}); await refreshCloudSeries(); load(); }}
              className="rounded-full border px-2 py-1 text-[11px] text-destructive hover:border-destructive">Löschen</button>
          </div>
        ))}
      </section>
    </div>
  );
}

/* ======================= Seltenheiten ========================= */

function RaritiesTab() {
  const [rows, setRows] = useState<RarityRow[]>([]);
  const [key, setKey] = useState("mystic");
  const [label, setLabel] = useState("Mystisch");
  const [color, setColor] = useState("#22d3ee");
  const [emoji, setEmoji] = useState("💠");
  const [cooldown, setCooldown] = useState(1800);
  const [rank, setRank] = useState(1050);
  const [price, setPrice] = useState(90000);
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(PACK_TYPES.map((p) => [p, 0])),
  );
  const [busy, setBusy] = useState(false);

  const load = () => { listRarities().then(setRows).catch(() => setRows([])); };
  useEffect(load, []);

  const create = async () => {
    const k = key.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (k.length < 2) { toast.error("Kürzel zu kurz (nur a-z, 0-9, -)."); return; }
    setBusy(true);
    try {
      await createRarity({
        key: k, label: label.trim() || k, color, emoji,
        cooldown_sec: Math.max(5, cooldown), ladder_rank: rank, price: Math.max(1, price),
        pack_weights: weights,
      });
      toast.success(`Seltenheit „${label}" ist online.`);
      await loadCustomContent(true);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehlgeschlagen");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-background/50 p-4">
        <h3 className="mb-3 text-sm font-bold">Neue Seltenheit</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Kürzel (ID)"><input value={key} onChange={(e) => setKey(e.target.value)} className={inputCls} /></Field>
          <Field label="Anzeigename"><input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} /></Field>
          <Field label="Emoji"><input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className={inputCls} /></Field>
          <Field label="Farbe">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-full rounded-md border bg-background" />
          </Field>
          <Field label="Cooldown (Sek.)"><input type="number" value={cooldown} onChange={(e) => setCooldown(Number(e.target.value) || 0)} className={inputCls} /></Field>
          <Field label="Rang in der Leiter"><input type="number" value={rank} onChange={(e) => setRank(Number(e.target.value) || 0)} className={inputCls} /></Field>
          <Field label="Shop-Wert (🪙)"><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} className={inputCls} /></Field>
        </div>
        <p className="mt-3 mb-1 text-[11px] text-muted-foreground">Drop-Gewicht je Paket (0 = kommt dort nicht vor)</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {PACK_TYPES.map((p) => (
            <label key={p} className="flex items-center gap-2 text-[11px]">
              <span className="w-28 truncate">{PACK_META[p].emoji} {PACK_META[p].label}</span>
              <input type="number" step="0.1" value={weights[p] ?? 0}
                onChange={(e) => setWeights((w) => ({ ...w, [p]: Number(e.target.value) || 0 }))}
                className="h-8 w-20 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary" />
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-lg border px-3 py-1 text-xs" style={{ borderColor: color, color }}>
            {emoji} {label || key}
          </span>
          <button onClick={create} disabled={busy} className={primaryBtn}>Seltenheit online stellen</button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold">Eigene Seltenheiten ({rows.length})</h3>
        {rows.length === 0 && <p className="text-xs text-muted-foreground">Noch keine eigenen Seltenheiten.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-lg border p-3">
            <span className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: r.color, color: r.color }}>
              {r.emoji} {r.label}
            </span>
            <p className="flex-1 text-[11px] text-muted-foreground">
              {r.key} · Rang {r.ladder_rank} · 🪙 {r.price.toLocaleString()} · CD {r.cooldown_sec}s
            </p>
            <button onClick={async () => { await setRarityActive(r.id, !r.active).catch(() => {}); await loadCustomContent(true); load(); }}
              className={`rounded-full border px-2 py-1 text-[11px] ${r.active ? "border-primary bg-primary/15" : ""}`}>
              {r.active ? "Aktiv" : "Inaktiv"}
            </button>
            <button onClick={async () => { await deleteRarity(r.id).catch(() => {}); load(); }}
              className="rounded-full border px-2 py-1 text-[11px] text-destructive hover:border-destructive">Löschen</button>
          </div>
        ))}
      </section>
    </div>
  );
}

/* ==================== Sammelitem-Generator ==================== */

type Draft = NewItem;

const EFFECT_KINDS = ["none", "coins", "perm", "temp", "cosmetic"] as const;
type EffectKind = (typeof EFFECT_KINDS)[number];
const STATS = ["accel", "topSpeed", "grip", "brake"] as const;

function slug(s: string): string {
  return s.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function autoEffect(rarityIndex: number, total: number): Record<string, unknown> {
  const t = total <= 1 ? 0 : rarityIndex / (total - 1);
  if (t < 0.34) return { kind: "coins", amount: Math.round(50 + t * 900) };
  if (t < 0.7) return { kind: "temp", stat: STATS[rarityIndex % STATS.length], pct: Math.round(4 + t * 12), seconds: 30 + Math.round(t * 90) };
  return { kind: "perm", stat: STATS[rarityIndex % STATS.length], pct: Math.max(1, Math.round(t * 4)) };
}

function ItemsTab() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [rows, setRows] = useState<ItemRow[]>([]);
  const load = () => { listCustomItems().then(setRows).catch(() => setRows([])); };
  useEffect(load, []);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {([["single", "✏️ Einzeln"], ["bulk", "⚙️ Massen-Generator"]] as [typeof mode, string][]).map(([id, l]) => (
          <button key={id} onClick={() => setMode(id)}
            className={`rounded-full border px-3 py-1 text-xs ${mode === id ? "border-primary bg-primary/15" : "hover:border-primary"}`}>
            {l}
          </button>
        ))}
      </div>

      {mode === "single" ? <SingleItemForm onDone={load} /> : <BulkGenerator onDone={load} />}

      <section className="space-y-2">
        <h3 className="text-sm font-bold">Eigene Items ({rows.length})</h3>
        {rows.length === 0 && <p className="text-xs text-muted-foreground">Noch keine eigenen Sammelitems.</p>}
        <div className="grid gap-1 md:grid-cols-2">
          {rows.slice(0, 200).map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-lg border p-2">
              <span className="text-lg">{r.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{r.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{r.rarity_key} · {r.item_key}</p>
              </div>
              <button onClick={async () => { await deleteCustomItem(r.id).catch(() => {}); load(); }}
                className="rounded-full border px-2 py-0.5 text-[10px] text-destructive hover:border-destructive">✕</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RaritySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {RARITY_ORDER.map((r) => (
        <option key={r} value={r}>{RARITY_LABEL[r] ?? r}</option>
      ))}
    </select>
  );
}

function SingleItemForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("Mein Item");
  const [emoji, setEmoji] = useState("✨");
  const [desc, setDesc] = useState("");
  const [rarity, setRarity] = useState<string>("rare");
  const [kind, setKind] = useState<EffectKind>("coins");
  const [amount, setAmount] = useState(500);
  const [stat, setStat] = useState<(typeof STATS)[number]>("topSpeed");
  const [pct, setPct] = useState(5);
  const [seconds, setSeconds] = useState(60);
  const [seriesKey, setSeriesKey] = useState("");
  const [busy, setBusy] = useState(false);

  const effect = (): Record<string, unknown> => {
    if (kind === "coins") return { kind: "coins", amount };
    if (kind === "perm") return { kind: "perm", stat, pct };
    if (kind === "temp") return { kind: "temp", stat, pct, seconds };
    if (kind === "cosmetic") return { kind: "cosmetic" };
    return {};
  };

  const create = async () => {
    const key = `adm-${slug(name)}-${Math.random().toString(36).slice(2, 6)}`;
    setBusy(true);
    try {
      await createCustomItems([{
        item_key: key, name: name.trim(), emoji, description: desc,
        rarity_key: rarity, effect: effect(), series_key: seriesKey.trim() || null,
      }]);
      toast.success(`${emoji} ${name} ist online.`);
      await loadCustomContent(true);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehlgeschlagen");
    } finally { setBusy(false); }
  };

  return (
    <section className="rounded-xl border bg-background/50 p-4">
      <h3 className="mb-3 text-sm font-bold">Einzelnes Sammelitem</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputCls} /></Field>
        <Field label="Emoji"><input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className={inputCls} /></Field>
        <Field label="Seltenheit"><RaritySelect value={rarity} onChange={setRarity} /></Field>
        <Field label="Beschreibung"><input value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={160} className={inputCls} /></Field>
        <Field label="Serien-Schlüssel (optional)"><input value={seriesKey} onChange={(e) => setSeriesKey(e.target.value)} className={inputCls} /></Field>
        <Field label="Effekt">
          <select value={kind} onChange={(e) => setKind(e.target.value as EffectKind)} className={inputCls}>
            <option value="none">Kein Effekt</option>
            <option value="coins">Coins</option>
            <option value="perm">Dauerhafter Bonus</option>
            <option value="temp">Temporärer Bonus</option>
            <option value="cosmetic">Nur Deko</option>
          </select>
        </Field>
        {kind === "coins" && (
          <Field label="Coins"><input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} className={inputCls} /></Field>
        )}
        {(kind === "perm" || kind === "temp") && (
          <>
            <Field label="Wert">
              <select value={stat} onChange={(e) => setStat(e.target.value as typeof stat)} className={inputCls}>
                <option value="accel">Beschleunigung</option>
                <option value="topSpeed">Top-Speed</option>
                <option value="grip">Grip</option>
                <option value="brake">Bremse</option>
              </select>
            </Field>
            <Field label="Bonus (%)"><input type="number" value={pct} onChange={(e) => setPct(Number(e.target.value) || 0)} className={inputCls} /></Field>
          </>
        )}
        {kind === "temp" && (
          <Field label="Dauer (Sek.)"><input type="number" value={seconds} onChange={(e) => setSeconds(Number(e.target.value) || 0)} className={inputCls} /></Field>
        )}
      </div>
      <button onClick={create} disabled={busy} className={primaryBtn}>Item online stellen</button>
    </section>
  );
}

function BulkGenerator({ onDone }: { onDone: () => void }) {
  const [theme, setTheme] = useState("Sternenflotte");
  const [emojis, setEmojis] = useState("🚀🛰️🪐⭐🌙☄️");
  const [template, setTemplate] = useState("{name} — aus der Serie {theme}.");
  const [count, setCount] = useState(24);
  const [rarities, setRarities] = useState<string[]>(["common", "uncommon", "rare", "epic", "legendary"]);
  const [withEffects, setWithEffects] = useState(true);
  const [makeSeries, setMakeSeries] = useState(true);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);

  const seriesKey = useMemo(() => `adm-${slug(theme)}`, [theme]);

  const generate = () => {
    const pool = Array.from(emojis).filter((c) => c.trim().length > 0);
    const rs = rarities.length ? rarities : ["common"];
    const n = Math.max(1, Math.min(200, count));
    const out: Draft[] = [];
    for (let i = 0; i < n; i++) {
      const rIdx = Math.floor((i / n) * rs.length);
      const rarity = rs[Math.min(rs.length - 1, rIdx)];
      const emoji = pool.length ? pool[i % pool.length] : "✨";
      const name = `${theme} ${romanOrNumber(i + 1)}`;
      out.push({
        item_key: `${seriesKey}-${i + 1}-${Math.random().toString(36).slice(2, 5)}`,
        name,
        emoji,
        description: template.replace("{name}", name).replace("{theme}", theme),
        rarity_key: rarity,
        effect: withEffects ? autoEffect(Math.min(rs.length - 1, rIdx), rs.length) : {},
        series_key: makeSeries ? seriesKey : null,
      });
    }
    setDrafts(out);
  };

  const publish = async () => {
    if (drafts.length === 0) return;
    setBusy(true);
    try {
      await createCustomItems(drafts);
      if (makeSeries && drafts.length >= 2) {
        const base = drafts.length * 60;
        await createCloudSeries({
          name: theme,
          description: `Generierte Serie „${theme}" mit ${drafts.length} Items.`,
          itemIds: drafts.map((d) => d.item_key),
          tiers: [
            { pct: 25, coins: Math.round(base * 0.5), label: "Sammler" },
            { pct: 50, coins: Math.round(base * 1.0), label: "Kenner" },
            { pct: 75, coins: Math.round(base * 1.8), label: "Experte" },
            { pct: 100, coins: Math.round(base * 3.5), label: "Meister" },
          ],
        });
        await refreshCloudSeries();
      }
      toast.success(`${drafts.length} Items online gestellt.`);
      setDrafts([]);
      await loadCustomContent(true);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehlgeschlagen");
    } finally { setBusy(false); }
  };

  return (
    <section className="rounded-xl border bg-background/50 p-4">
      <h3 className="mb-3 text-sm font-bold">Massen-Generator</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Thema / Namens-Präfix"><input value={theme} onChange={(e) => setTheme(e.target.value)} className={inputCls} /></Field>
        <Field label="Emoji-Vorrat"><input value={emojis} onChange={(e) => setEmojis(e.target.value)} className={inputCls} /></Field>
        <Field label="Anzahl (max. 200)"><input type="number" value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} className={inputCls} /></Field>
      </div>
      <Field label="Beschreibungs-Vorlage ({name}, {theme})">
        <input value={template} onChange={(e) => setTemplate(e.target.value)} className={inputCls} />
      </Field>
      <p className="mt-3 mb-1 text-[11px] text-muted-foreground">Seltenheiten (aufsteigend verteilt)</p>
      <div className="flex flex-wrap gap-1">
        {RARITY_ORDER.map((r) => {
          const on = rarities.includes(r);
          return (
            <button key={r} onClick={() => setRarities((p) => (on ? p.filter((x) => x !== r) : [...p, r]))}
              className={`rounded-full border px-2 py-1 text-[11px] ${on ? "bg-primary/15" : ""}`}
              style={on ? { borderColor: RARITY_COLORS[r], color: RARITY_COLORS[r] } : undefined}>
              {RARITY_LABEL[r] ?? r}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={withEffects} onChange={(e) => setWithEffects(e.target.checked)} /> Effekte automatisch vergeben
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={makeSeries} onChange={(e) => setMakeSeries(e.target.checked)} /> Sammelserie mit Stufenbelohnungen anlegen
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={generate} className="rounded-lg border px-4 py-2 text-sm hover:border-primary">Vorschau erzeugen</button>
        <button onClick={publish} disabled={busy || drafts.length === 0} className={primaryBtn}>
          {drafts.length} Items veröffentlichen
        </button>
      </div>

      {drafts.length > 0 && (
        <div className="mt-4 grid max-h-64 gap-1 overflow-y-auto md:grid-cols-2">
          {drafts.map((d, i) => (
            <div key={d.item_key} className="flex items-center gap-2 rounded-lg border p-2"
              style={{ borderColor: RARITY_COLORS[d.rarity_key as never] ?? undefined }}>
              <span className="text-lg">{d.emoji}</span>
              <input value={d.name}
                onChange={(e) => setDrafts((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
              <span className="text-[10px] text-muted-foreground">{RARITY_LABEL[d.rarity_key as never] ?? d.rarity_key}</span>
              <button onClick={() => setDrafts((p) => p.filter((_, j) => j !== i))}
                className="rounded-full border px-2 text-[10px] text-destructive">✕</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function romanOrNumber(n: number): string {
  return String(n).padStart(2, "0");
}

/* ========================= Bundles ============================ */

function BundlesTab() {
  const [rows, setRows] = useState<BundleRow[]>([]);
  const [title, setTitle] = useState("Mega-Bundle");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [price, setPrice] = useState(25000);
  const [once, setOnce] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [contents, setContents] = useState<BundleContents>({
    presets: [], items: [], packs: [], coins: 0, slots: 0, passDays: 0, boosters: [],
  });
  const [carSearch, setCarSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => { listAdminBundles().then(setRows).catch(() => setRows([])); };
  useEffect(load, []);

  const carResults = carSearch.trim()
    ? PRESETS.filter((p) => p.name.toLowerCase().includes(carSearch.trim().toLowerCase())).slice(0, 20)
    : [];
  const itemResults = itemSearch.trim()
    ? COLLECTIBLES.filter((c) => c.name.toLowerCase().includes(itemSearch.trim().toLowerCase())).slice(0, 30)
    : [];

  const value = bundleValue(contents);

  const create = async () => {
    setBusy(true);
    try {
      await createAdminBundle({
        title, description: desc, emoji,
        contents: contents as unknown as Record<string, unknown>,
        price: Math.max(0, price),
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        once_per_player: once,
      });
      toast.success(`${emoji} Bundle „${title}" ist im Shop.`);
      setContents({ presets: [], items: [], packs: [], coins: 0, slots: 0, passDays: 0, boosters: [] });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehlgeschlagen");
    } finally { setBusy(false); }
  };

  const upd = (patch: Partial<BundleContents>) => setContents((c) => ({ ...c, ...patch }));

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-background/50 p-4">
        <h3 className="mb-3 text-sm font-bold">Neues Bundle bauen</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Titel"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} className={inputCls} /></Field>
          <Field label="Emoji"><input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className={inputCls} /></Field>
          <Field label="Preis (🪙)"><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} className={inputCls} /></Field>
          <Field label="Beschreibung"><input value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={200} className={inputCls} /></Field>
          <Field label="Start (optional)"><input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} /></Field>
          <Field label="Ende (optional)"><input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} /></Field>
          <Field label="Coins"><input type="number" value={contents.coins} onChange={(e) => upd({ coins: Number(e.target.value) || 0 })} className={inputCls} /></Field>
          <Field label="Garagen-Slots"><input type="number" value={contents.slots} onChange={(e) => upd({ slots: Number(e.target.value) || 0 })} className={inputCls} /></Field>
          <Field label="Premium-Pass (Tage)"><input type="number" value={contents.passDays} onChange={(e) => upd({ passDays: Number(e.target.value) || 0 })} className={inputCls} /></Field>
        </div>

        <label className="mt-2 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={once} onChange={(e) => setOnce(e.target.checked)} /> Nur einmal pro Spieler kaufbar
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Field label="Fahrzeuge suchen">
              <input value={carSearch} onChange={(e) => setCarSearch(e.target.value)} placeholder="🔍 Auto-Name" className={inputCls} />
            </Field>
            <div className="mt-1 flex max-h-32 flex-wrap gap-1 overflow-y-auto">
              {carResults.map((p) => (
                <button key={p.key} onClick={() => upd({ presets: [...contents.presets, p.key] })}
                  className="rounded-full border px-2 py-1 text-[11px] hover:border-primary">🚗 {p.name}</button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {contents.presets.map((k, i) => (
                <button key={`${k}-${i}`} onClick={() => upd({ presets: contents.presets.filter((_, j) => j !== i) })}
                  className="rounded-full border border-primary bg-primary/10 px-2 py-1 text-[11px]">{k} ✕</button>
              ))}
            </div>
          </div>

          <div>
            <Field label="Sammelitems suchen">
              <input value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} placeholder="🔍 Item-Name" className={inputCls} />
            </Field>
            <div className="mt-1 flex max-h-32 flex-wrap gap-1 overflow-y-auto">
              {itemResults.map((c) => (
                <button key={c.id} onClick={() => upd({ items: [...contents.items, c.id] })}
                  className="rounded-full border px-2 py-1 text-[11px] hover:border-primary">{c.emoji} {c.name}</button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {contents.items.map((id, i) => (
                <button key={`${id}-${i}`} onClick={() => upd({ items: contents.items.filter((_, j) => j !== i) })}
                  className="rounded-full border border-primary bg-primary/10 px-2 py-1 text-[11px]">{id} ✕</button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 mb-1 text-[11px] text-muted-foreground">Sammelpakete</p>
        <div className="flex flex-wrap gap-1">
          {PACK_TYPES.map((p) => (
            <button key={p} onClick={() => upd({ packs: [...contents.packs, p as PackType] })}
              className="rounded-full border px-2 py-1 text-[11px] hover:border-primary">
              {PACK_META[p].emoji} {PACK_META[p].label} +
            </button>
          ))}
        </div>
        {contents.packs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {contents.packs.map((p, i) => (
              <button key={`${p}-${i}`} onClick={() => upd({ packs: contents.packs.filter((_, j) => j !== i) })}
                className="rounded-full border border-primary bg-primary/10 px-2 py-1 text-[11px]">
                {PACK_META[p].emoji} ✕
              </button>
            ))}
          </div>
        )}

        <BoosterEditor boosters={contents.boosters} onChange={(b) => upd({ boosters: b })} />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Einzelwert: 🪙 {value.toLocaleString()} · Rabatt: {value > 0 ? Math.max(0, Math.round((1 - price / value) * 100)) : 0} %
          </p>
          <button onClick={create} disabled={busy} className={primaryBtn}>Bundle veröffentlichen</button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold">Bestehende Bundles ({rows.length})</h3>
        {rows.length === 0 && <p className="text-xs text-muted-foreground">Noch keine Admin-Bundles.</p>}
        {rows.map((r) => {
          const c = normalizeContents(r.contents);
          return (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border p-3">
              <span className="text-lg">{r.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  🪙 {r.price.toLocaleString()} · {c.presets.length} Autos · {c.items.length} Items · {c.packs.length} Pakete
                  {c.coins > 0 && ` · +${c.coins.toLocaleString()} Coins`}
                  {c.slots > 0 && ` · +${c.slots} Slots`}
                  {c.passDays > 0 && ` · ${c.passDays} Pass-Tage`}
                  {c.boosters.length > 0 && ` · ${c.boosters.length} Booster`}
                </p>
              </div>
              <button onClick={async () => { await setBundleActive(r.id, !r.active).catch(() => {}); load(); }}
                className={`rounded-full border px-2 py-1 text-[11px] ${r.active ? "border-primary bg-primary/15" : ""}`}>
                {r.active ? "Aktiv" : "Inaktiv"}
              </button>
              <button onClick={async () => { await deleteAdminBundle(r.id).catch(() => {}); load(); }}
                className="rounded-full border px-2 py-1 text-[11px] text-destructive hover:border-destructive">Löschen</button>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function BoosterEditor({ boosters, onChange }: { boosters: Booster[]; onChange: (b: Booster[]) => void }) {
  const [stat, setStat] = useState<Booster["stat"]>("topSpeed");
  const [pct, setPct] = useState(10);
  const [seconds, setSeconds] = useState(300);

  return (
    <div className="mt-4">
      <p className="mb-1 text-[11px] text-muted-foreground">Booster</p>
      <div className="flex flex-wrap items-end gap-2">
        <select value={stat} onChange={(e) => setStat(e.target.value as Booster["stat"])} className="h-9 rounded-md border bg-background px-2 text-sm">
          <option value="accel">Beschleunigung</option>
          <option value="topSpeed">Top-Speed</option>
          <option value="grip">Grip</option>
          <option value="brake">Bremse</option>
        </select>
        <input type="number" value={pct} onChange={(e) => setPct(Number(e.target.value) || 0)}
          className="h-9 w-20 rounded-md border bg-background px-2 text-sm" placeholder="%" />
        <input type="number" value={seconds} onChange={(e) => setSeconds(Number(e.target.value) || 0)}
          className="h-9 w-24 rounded-md border bg-background px-2 text-sm" placeholder="Sek." />
        <button onClick={() => onChange([...boosters, { stat, pct, seconds }])}
          className="rounded-lg border px-3 py-1.5 text-xs hover:border-primary">+ Booster</button>
      </div>
      {boosters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {boosters.map((b, i) => (
            <button key={i} onClick={() => onChange(boosters.filter((_, j) => j !== i))}
              className="rounded-full border border-primary bg-primary/10 px-2 py-1 text-[11px]">
              {b.stat} +{b.pct}% / {b.seconds}s ✕
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CoinsTab() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Coins und Pakete für Tests vergeben (nur lokal).</p>
      <div className="flex flex-wrap gap-2">
        {[1000, 10000, 100000, 1000000].map((n) => (
          <button key={n} onClick={() => { addCoins(n); toast.success(`+${n.toLocaleString()} 🪙`); }}
            className="rounded-lg border border-primary/40 px-3 py-1.5 font-mono text-xs hover:bg-primary/10">
            +{n.toLocaleString()}
          </button>
        ))}
        <button onClick={() => { setCoinsAbsolute(500); toast.info("Coins auf 500 zurückgesetzt"); }}
          className="rounded-lg border border-destructive/40 px-3 py-1.5 font-mono text-xs text-destructive hover:bg-destructive/10">
          Reset (500)
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {PACK_TYPES.map((p) => (
          <button key={p} onClick={() => { addPack(p); toast.success(`${PACK_META[p].label} erhalten`); }}
            className="rounded-lg border px-3 py-1.5 text-xs hover:border-primary">
            {PACK_META[p].emoji} {PACK_META[p].label}
          </button>
        ))}
      </div>
    </div>
  );
}

const inputCls = "h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus:border-primary";
const primaryBtn = "mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
