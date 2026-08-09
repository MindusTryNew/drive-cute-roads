import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  applyMod,
  downloadMod,
  makeId,
  parseMod,
  type Mod,
} from "@/lib/mods";

type StudioKind = "skin" | "physics" | "weather" | "mission" | "collectible" | "sound" | "tuning-preset";

const KINDS: { id: StudioKind; label: string; icon: string; hint: string }[] = [
  { id: "skin", label: "Skin", icon: "🎨", hint: "Lackierung mit Metallic, Rauheit und Leuchten." },
  { id: "physics", label: "Physik", icon: "🧪", hint: "Globale Multiplikatoren für Fahrverhalten." },
  { id: "weather", label: "Wetter/Zeit", icon: "🌦️", hint: "Tageszeit fixieren, Nebel und Himmel anpassen." },
  { id: "mission", label: "Mission", icon: "🎯", hint: "Eigene Mission mit Ziel und Belohnung." },
  { id: "collectible", label: "Item", icon: "🎁", hint: "Eigenes Sammelitem mit Seltenheit." },
  { id: "sound", label: "Sound", icon: "🔊", hint: "Eigene Motor-/Reifen-Sounds per URL." },
  { id: "tuning-preset", label: "Tuning-Preset", icon: "⚙️", hint: "Tuning-Werte als Vorlage." },
];

const num = (v: string, def: number) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
};

export function ModStudio({ onBack }: { onBack: () => void }) {
  const [kind, setKind] = useState<StudioKind>("skin");
  const [tab, setTab] = useState<"single" | "pack">("single");
  const [pack, setPack] = useState<Mod[]>([]);
  const [packName, setPackName] = useState("Mein Pack");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [name, setName] = useState("Mein Mod");
  const [author, setAuthor] = useState("anon");
  const [desc, setDesc] = useState("");

  // skin
  const [primary, setPrimary] = useState("#5b8def");
  const [secondary, setSecondary] = useState("#0a0e1a");
  const [metalness, setMetalness] = useState(0.5);
  const [roughness, setRoughness] = useState(0.4);
  const [emissive, setEmissive] = useState("#000000");
  const [emissiveI, setEmissiveI] = useState(0);
  const [decal, setDecal] = useState("");

  // physics
  const [phys, setPhys] = useState({
    gravity: 1, friction: 1, drag: 1, drift: 1, accel: 1, topSpeed: 1, grip: 1, brake: 1, steer: 1,
  });

  // weather
  const [fixedTime, setFixedTime] = useState<number | null>(null);
  const [fogNear, setFogNear] = useState(60);
  const [fogFar, setFogFar] = useState(900);
  const [fogColor, setFogColor] = useState("#0a0e1a");
  const [cycleSpeed, setCycleSpeed] = useState(1);

  // mission
  const [mTitle, setMTitle] = useState("Meine Mission");
  const [mGoalKind, setMGoalKind] = useState<"distance" | "topSpeed" | "drift" | "airtime" | "collect">("distance");
  const [mGoal, setMGoal] = useState(2000);
  const [mReward, setMReward] = useState(800);

  // collectible
  const [cName, setCName] = useState("Mein Item");
  const [cEmoji, setCEmoji] = useState("💎");
  const [cRarity, setCRarity] = useState("rare");

  // sound
  const [sEngine, setSEngine] = useState("");
  const [sTires, setSTires] = useState("");
  const [sVolume, setSVolume] = useState(0.6);

  // tuning-preset
  const [tTop, setTTop] = useState(300);
  const [tAccel, setTAccel] = useState(3.5);
  const [tGrip, setTGrip] = useState(85);

  const buildPayload = (): Record<string, unknown> => {
    switch (kind) {
      case "skin":
        return {
          primaryColor: primary, secondaryColor: secondary,
          metalness, roughness,
          emissive: emissive === "#000000" ? undefined : emissive,
          emissiveIntensity: emissiveI,
          decalText: decal || undefined,
          targetBody: "any",
        };
      case "physics":
        return { ...phys };
      case "weather":
        return { fixedTime, fogNear, fogFar, fogColor, cycleSpeed };
      case "mission":
        return {
          missions: [{
            id: `m-${makeId().slice(0, 8)}`,
            title: mTitle, desc, goalKind: mGoalKind, goal: mGoal, reward: mReward,
          }],
        };
      case "collectible":
        return {
          items: [{ id: `c-${makeId().slice(0, 8)}`, name: cName, desc, emoji: cEmoji, rarity: cRarity }],
        };
      case "sound":
        return {
          engine: sEngine || undefined,
          tires: sTires || undefined,
          volume: sVolume,
          pitchBase: 1,
        };
      case "tuning-preset":
        return { patch: { topSpeed: tTop, time0to100: tAccel, grip: tGrip } };
    }
  };

  const build = (): Mod => parseMod({
    format: "driftlab.mod",
    version: 3,
    kind,
    id: makeId(),
    name: name.trim() || "Mein Mod",
    author: author.trim() || "anon",
    description: desc.slice(0, 500),
    priority: 0,
    payload: buildPayload(),
  });

  const addToPack = () => {
    try {
      const m = build();
      setPack((prev) => {
        if (editIndex !== null) {
          const next = [...prev];
          next[editIndex] = m;
          return next;
        }
        if (prev.length >= 40) { toast.error("Maximal 40 Inhalte pro Pack."); return prev; }
        return [...prev, m];
      });
      toast.success(editIndex !== null ? "Inhalt aktualisiert." : `„${m.name}" zum Pack hinzugefügt.`);
      setEditIndex(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mod ungültig");
    }
  };

  const buildPack = (): Mod => parseMod({
    format: "driftlab.mod",
    version: 3,
    kind: "pack",
    id: makeId(),
    name: packName.trim() || "Mein Pack",
    author: author.trim() || "anon",
    description: `Pack mit ${pack.length} Inhalten.`.slice(0, 500),
    priority: 0,
    payload: { mods: pack },
  });

  const movePack = (i: number, dir: -1 | 1) => {
    setPack((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const loadPackFile = async (file: File) => {
    try {
      const mod = parseMod(JSON.parse(await file.text()));
      if (mod.kind !== "pack") { toast.error("Das ist kein Pack-Mod."); return; }
      setPack(mod.payload.mods as Mod[]);
      setPackName(mod.name);
      setTab("pack");
      toast.success(`Pack „${mod.name}" geladen.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Datei ungültig");
    }
  };

  const installPack = async () => {
    try { toast.success(await applyMod(buildPack())); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Pack ungültig"); }
  };

  const exportPack = () => {
    try { downloadMod(buildPack()); toast.success("Pack exportiert."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Pack ungültig"); }
  };

  const install = async () => {
    try {
      toast.success(await applyMod(build()));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mod ungültig");
    }
  };

  const exportFile = () => {
    try {
      downloadMod(build());
      toast.success("Als .mod.json exportiert.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mod ungültig");
    }
  };

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <Label className="text-xs">{label}</Label>
      {node}
    </div>
  );

  const slider = (label: string, value: number, set: (n: number) => void, min: number, max: number, step = 0.05) => (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(num(e.target.value, value))} className="w-full accent-primary" />
    </div>
  );

  return (
    <main className="h-screen w-screen overflow-y-auto">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}>← Zurück</Button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Mod-Studio</p>
            <h1 className="text-xl font-bold">Mods bauen ohne JSON zu schreiben</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === "single" ? (
            <>
              <Button variant="secondary" onClick={addToPack}>
                {editIndex !== null ? "💾 Im Pack speichern" : "➕ Zum Pack"}
              </Button>
              <Button variant="outline" onClick={exportFile}>⬇️ Exportieren</Button>
              <Button onClick={install}>✅ Installieren</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={exportPack} disabled={pack.length === 0}>⬇️ Pack exportieren</Button>
              <Button onClick={installPack} disabled={pack.length === 0}>✅ Pack installieren</Button>
            </>
          )}
        </div>
      </header>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <button onClick={() => setTab("single")}
              className={`rounded-lg border px-3 py-2 text-sm ${tab === "single" ? "border-primary bg-primary/10" : ""}`}>
              Einzel-Mod
            </button>
            <button onClick={() => setTab("pack")}
              className={`rounded-lg border px-3 py-2 text-sm ${tab === "pack" ? "border-primary bg-primary/10" : ""}`}>
              📦 Pack ({pack.length})
            </button>
          </div>
          {tab === "single" && KINDS.map((k) => (
            <button key={k.id} onClick={() => setKind(k.id)}
              className={`w-full rounded-xl border p-3 text-left ${kind === k.id ? "border-primary bg-primary/10" : ""}`}>
              <p className="font-bold">{k.icon} {k.label}</p>
              <p className="text-[11px] text-muted-foreground">{k.hint}</p>
            </button>
          ))}
        </aside>

        {tab === "pack" ? (
          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <div className="grid gap-3 md:grid-cols-2">
              {field("Pack-Name", <Input value={packName} onChange={(e) => setPackName(e.target.value)} maxLength={60} />)}
              {field("Pack-Datei laden", (
                <label className="flex h-9 cursor-pointer items-center rounded-md border px-3 text-sm hover:border-primary">
                  📂 .mod.json auswählen
                  <input type="file" accept=".json,application/json" className="hidden"
                    onChange={async (e) => { const f = e.target.files?.[0]; if (f) await loadPackFile(f); e.target.value = ""; }} />
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Baue Inhalte im Reiter „Einzel-Mod" und klicke oben auf „➕ Zum Pack". Reihenfolge = Ladereihenfolge.
            </p>
            {pack.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Noch keine Inhalte im Pack.
              </div>
            ) : (
              <ul className="space-y-2">
                {pack.map((m, i) => (
                  <li key={`${m.id}-${i}`} className="flex flex-wrap items-center gap-2 rounded-xl border bg-background p-3">
                    <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                    <span className="flex-1 min-w-0 truncate">
                      <b>{m.name}</b> <span className="font-mono text-[11px] text-muted-foreground">{m.kind}</span>
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => movePack(i, -1)} disabled={i === 0}>↑</Button>
                    <Button size="sm" variant="ghost" onClick={() => movePack(i, 1)} disabled={i === pack.length - 1}>↓</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditIndex(i); setName(m.name); setKind((KINDS.find((k) => k.id === m.kind)?.id ?? "skin")); setTab("single"); toast.info("Baue den Inhalt neu und speichere ihn im Pack."); }}>
                      Bearbeiten
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPack((p) => p.filter((_, j) => j !== i))}>✕</Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="rounded-xl border bg-background p-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Vorschau (JSON)</p>
              <pre className="max-h-52 overflow-auto text-[11px]">{JSON.stringify({ kind: "pack", mods: pack.map((m) => ({ kind: m.kind, name: m.name })) }, null, 2)}</pre>
            </div>
          </section>
        ) : (
        <section className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {field("Name", <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />)}
            {field("Autor", <Input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={24} />)}
          </div>
          {field("Beschreibung", <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} maxLength={500} />)}

          <div className="border-t pt-4">
            {kind === "skin" && (
              <div className="grid gap-4 md:grid-cols-2">
                {field("Primärfarbe", <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-9 w-full rounded border bg-transparent" />)}
                {field("Sekundärfarbe", <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="h-9 w-full rounded border bg-transparent" />)}
                {slider("Metallic", metalness, setMetalness, 0, 1)}
                {slider("Rauheit", roughness, setRoughness, 0, 1)}
                {field("Leuchtfarbe", <input type="color" value={emissive} onChange={(e) => setEmissive(e.target.value)} className="h-9 w-full rounded border bg-transparent" />)}
                {slider("Leuchtstärke", emissiveI, setEmissiveI, 0, 4, 0.1)}
                {field("Decal-Text (max. 12)", <Input value={decal} onChange={(e) => setDecal(e.target.value)} maxLength={12} />)}
              </div>
            )}

            {kind === "physics" && (
              <div className="grid gap-4 md:grid-cols-3">
                {(Object.keys(phys) as (keyof typeof phys)[]).map((k) =>
                  slider(k, phys[k], (n) => setPhys({ ...phys, [k]: n }), 0.1, 5, 0.05),
                )}
                <p className="md:col-span-3 text-xs text-muted-foreground">
                  Werte sind Multiplikatoren (1 = unverändert) und werden auf 0.1–10 begrenzt.
                </p>
              </div>
            )}

            {kind === "weather" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tageszeit fixieren</span>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={fixedTime !== null}
                        onChange={(e) => setFixedTime(e.target.checked ? 0.5 : null)} />
                      <span className="font-mono">{fixedTime === null ? "Zyklus" : fixedTime.toFixed(2)}</span>
                    </label>
                  </div>
                  {fixedTime !== null && (
                    <input type="range" min={0} max={0.99} step={0.01} value={fixedTime}
                      onChange={(e) => setFixedTime(num(e.target.value, 0.5))} className="w-full accent-primary" />
                  )}
                </div>
                {slider("Zyklus-Geschwindigkeit", cycleSpeed, setCycleSpeed, 0, 5, 0.1)}
                {slider("Nebel nah", fogNear, setFogNear, 1, 500, 1)}
                {slider("Nebel fern", fogFar, setFogFar, 50, 4000, 10)}
                {field("Nebelfarbe", <input type="color" value={fogColor} onChange={(e) => setFogColor(e.target.value)} className="h-9 w-full rounded border bg-transparent" />)}
              </div>
            )}

            {kind === "mission" && (
              <div className="grid gap-3 md:grid-cols-2">
                {field("Titel", <Input value={mTitle} onChange={(e) => setMTitle(e.target.value)} maxLength={60} />)}
                {field("Zieltyp", (
                  <select value={mGoalKind} onChange={(e) => setMGoalKind(e.target.value as typeof mGoalKind)}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                    <option value="distance">Distanz (m)</option>
                    <option value="topSpeed">Höchstgeschwindigkeit (km/h)</option>
                    <option value="drift">Drift-Sekunden</option>
                    <option value="airtime">Flugzeit (s)</option>
                    <option value="collect">Items sammeln</option>
                  </select>
                ))}
                {field("Zielwert", <Input type="number" value={mGoal} onChange={(e) => setMGoal(num(e.target.value, 1))} />)}
                {field("Belohnung (Coins)", <Input type="number" value={mReward} onChange={(e) => setMReward(num(e.target.value, 100))} />)}
              </div>
            )}

            {kind === "collectible" && (
              <div className="grid gap-3 md:grid-cols-3">
                {field("Item-Name", <Input value={cName} onChange={(e) => setCName(e.target.value)} maxLength={48} />)}
                {field("Emoji", <Input value={cEmoji} onChange={(e) => setCEmoji(e.target.value)} maxLength={4} />)}
                {field("Seltenheit", (
                  <select value={cRarity} onChange={(e) => setCRarity(e.target.value)}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                    {["common", "uncommon", "rare", "epic", "legendary", "mythical", "cosmic", "celestial"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ))}
              </div>
            )}

            {kind === "sound" && (
              <div className="grid gap-3">
                {field("Motor-Sound (https:// oder data:audio/…)", <Input value={sEngine} onChange={(e) => setSEngine(e.target.value)} />)}
                {field("Reifen-Sound", <Input value={sTires} onChange={(e) => setSTires(e.target.value)} />)}
                {slider("Lautstärke", sVolume, setSVolume, 0, 1)}
              </div>
            )}

            {kind === "tuning-preset" && (
              <div className="grid gap-3 md:grid-cols-3">
                {field("Top-Speed (km/h)", <Input type="number" value={tTop} onChange={(e) => setTTop(num(e.target.value, 240))} />)}
                {field("0–100 (s)", <Input type="number" step="0.1" value={tAccel} onChange={(e) => setTAccel(num(e.target.value, 4))} />)}
                {field("Grip", <Input type="number" value={tGrip} onChange={(e) => setTGrip(num(e.target.value, 70))} />)}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-background p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Vorschau (JSON)</p>
            <pre className="max-h-52 overflow-auto text-[11px]">{JSON.stringify(buildPayload(), null, 2)}</pre>
          </div>
        </section>
        )}
      </div>
    </main>
  );
}
