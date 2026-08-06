import { useEffect, useState } from "react";
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
  type CloudMissionRow,
  type CloudSeriesRow,
} from "@/lib/admin";
import { COLLECTIBLES } from "@/lib/collectibles";
import { addCoins, setCoinsAbsolute } from "@/lib/coins";
import { addPack } from "@/lib/inventory";
import { PACK_META, PACK_TYPES } from "@/lib/collectibles";
import { refreshCloudSeries } from "@/lib/series";

type Tab = "missions" | "series" | "coins";

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("missions");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-primary/50 bg-card"
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

        <div className="flex gap-2 border-b px-5 py-2">
          {([["missions", "🎯 Missionen"], ["series", "🗂️ Sammelserien"], ["coins", "🪙 Coins"]] as [Tab, string][]).map(([id, label]) => (
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
        <button onClick={create} disabled={busy} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
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
        <button onClick={create} disabled={busy} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
