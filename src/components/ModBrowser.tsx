import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  listCloudMods,
  uploadCloudMod,
  bumpDownload,
  parseMod,
  parseModFile,
  applyMod,
  getInstalledMapMods,
  toggleMapMod,
  removeMapMod,
  type CloudMod,
  type Mod,
  type ModKind,
} from "@/lib/mods";

const TABS: { id: ModKind | "all" | "installed"; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "car", label: "Autos" },
  { id: "map", label: "Karten" },
  { id: "part-pack", label: "Parts" },
  { id: "tuning-preset", label: "Presets" },
  { id: "installed", label: "Installiert" },
];

const KIND_LABEL: Record<ModKind, string> = {
  car: "Auto",
  map: "Karte",
  "part-pack": "Parts",
  "tuning-preset": "Preset",
};

export function ModBrowser({ onBack, onOpenTutorial }: { onBack: () => void; onOpenTutorial: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [items, setItems] = useState<CloudMod[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Upload dialog
  const [uploadMod, setUploadMod] = useState<Mod | null>(null);
  const [nick, setNick] = useState(localStorage.getItem("garage:sellerNick") ?? "");
  const [desc, setDesc] = useState("");

  const refresh = async () => {
    setLoading(true); setErr(null);
    try {
      const kind = tab === "all" || tab === "installed" ? undefined : tab;
      setItems(await listCloudMods(kind, search));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== "installed") refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const install = async (m: CloudMod) => {
    setErr(null); setInfo(null);
    try {
      const parsed = parseMod(m.payload);
      const msg = await applyMod(parsed);
      await bumpDownload(m.id);
      setInfo(msg);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Installation fehlgeschlagen");
    }
  };

  const handleFileUpload = async (file: File) => {
    setErr(null); setInfo(null);
    try {
      const parsed = await parseModFile(file);
      setUploadMod(parsed);
      setDesc(parsed.description);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Datei ungültig");
    }
  };

  const confirmUpload = async () => {
    if (!uploadMod) return;
    const n = nick.trim();
    if (n.length < 2 || n.length > 24) { setErr("Nickname 2–24 Zeichen."); return; }
    try {
      await uploadCloudMod(uploadMod, n, desc);
      localStorage.setItem("garage:sellerNick", n);
      setInfo(`Mod „${uploadMod.name}" hochgeladen!`);
      setUploadMod(null); setDesc("");
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-y-auto">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}>← Garage</Button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Mod-Browser</p>
            <h1 className="text-xl font-bold">Community-Mods entdecken & teilen</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onOpenTutorial}>📘 Modding-Tutorial</Button>
          <label className="cursor-pointer">
            <input type="file" accept=".json,application/json" className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await handleFileUpload(f);
                e.target.value = "";
              }} />
            <span className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              + Mod hochladen
            </span>
          </label>
        </div>
      </header>

      {(err || info) && (
        <div className="px-6 pt-4">
          {err && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">{err}</div>}
          {info && <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm">{info}</div>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b bg-card/40 px-6 py-3">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-md border px-3 py-1.5 text-sm ${tab === t.id ? "border-primary bg-primary/10" : "border-border"}`}>
            {t.label}
          </button>
        ))}
        {tab !== "installed" && (
          <div className="ml-auto flex items-center gap-2">
            <Input placeholder="Suchen …" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-48" />
            <Button size="sm" variant="outline" onClick={refresh}>Suchen</Button>
          </div>
        )}
      </div>

      {tab === "installed" ? (
        <InstalledSection />
      ) : loading ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">Lade …</p>
      ) : items.length === 0 ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">Noch keine Mods in dieser Kategorie.</p>
      ) : (
        <div className="grid gap-4 px-6 py-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <article key={m.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{KIND_LABEL[m.kind]}</span>
                <span className="font-mono text-[10px] text-muted-foreground">↓ {m.downloads}</span>
              </div>
              <h3 className="mt-1 text-lg font-bold">{m.name}</h3>
              <p className="font-mono text-[10px] text-muted-foreground">von {m.author_nick}</p>
              {m.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{m.description}</p>}
              <Button size="sm" className="mt-3 w-full" onClick={() => install(m)}>Installieren</Button>
            </article>
          ))}
        </div>
      )}

      {uploadMod && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[min(480px,90vw)] rounded-2xl border bg-card p-6">
            <h3 className="text-lg font-bold">Mod hochladen</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Erkannt als <b>{KIND_LABEL[uploadMod.kind]}</b> — „{uploadMod.name}"
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs">Dein Nick (2–24)</Label>
                <Input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={24} />
              </div>
              <div>
                <Label className="text-xs">Beschreibung</Label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={3} />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setUploadMod(null)}>Abbrechen</Button>
              <Button className="flex-1" onClick={confirmUpload}>Hochladen</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function InstalledSection() {
  const [maps, setMaps] = useState(getInstalledMapMods());
  const refresh = () => setMaps(getInstalledMapMods());

  return (
    <div className="px-6 py-6">
      <h2 className="text-lg font-bold">Installierte Karten-Mods</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Werden beim nächsten Sim-Start in die Welt geladen. Toggle zum Ein-/Ausschalten.
      </p>
      {maps.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Keine Karten-Mods installiert.</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {maps.map((m) => (
            <div key={m.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{m.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    von {m.author} · {m.objects.length} Objekte
                  </p>
                </div>
                <span className={`rounded px-2 py-0.5 font-mono text-[10px] ${m.enabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {m.enabled ? "AN" : "AUS"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1"
                  onClick={() => { toggleMapMod(m.id); refresh(); }}>
                  {m.enabled ? "Deaktivieren" : "Aktivieren"}
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => { if (confirm(`„${m.name}" entfernen?`)) { removeMapMod(m.id); refresh(); } }}>
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
