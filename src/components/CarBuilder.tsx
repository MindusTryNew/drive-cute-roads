import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  type CustomCar,
  type Tuning,
  type Appearance,
  type PartRef,
  emptyCar,
  saveCar,
  remainingToday,
  canCreateToday,
  downloadCar,
} from "@/lib/garage";
import { savePart, getPart, deletePart } from "@/lib/parts-store";
import { buildCarGroup } from "@/lib/car-renderer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CarBuilder({
  initial,
  onCancel,
  onSaved,
}: {
  initial: CustomCar | null; // null = new car
  onCancel: () => void;
  onSaved: (car: CustomCar) => void;
}) {
  const isNew = initial === null;
  const [car, setCar] = useState<CustomCar>(() => initial ?? emptyCar());
  const [error, setError] = useState<string | null>(null);
  const remaining = useMemo(() => remainingToday(), []);

  const mountRef = useRef<HTMLDivElement>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);

  // Live 3D preview --------------------------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#15192a");
    const cam = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(r.domElement);

    scene.add(new THREE.HemisphereLight(0x8899ff, 0x222233, 0.8));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1);
    sun.position.set(5, 8, 5);
    scene.add(sun);

    const grid = new THREE.GridHelper(20, 20, 0x3a4458, 0x222a3a);
    scene.add(grid);

    const onResize = () => {
      cam.aspect = mount.clientWidth / mount.clientHeight;
      cam.updateProjectionMatrix();
      r.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    let t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.005;
      cam.position.set(Math.cos(t) * 7, 3.2, Math.sin(t) * 7);
      cam.lookAt(0, 1, 0);
      r.render(scene, cam);
    };
    animate();

    // Initial car group
    const g = buildCarGroup(car.appearance);
    carGroupRef.current = g;
    scene.add(g);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      r.dispose();
      mount.removeChild(r.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild car geometry when appearance changes
  useEffect(() => {
    if (!carGroupRef.current) return;
    const parent = carGroupRef.current.parent;
    if (!parent) return;
    parent.remove(carGroupRef.current);
    const g = buildCarGroup(car.appearance);
    parent.add(g);
    carGroupRef.current = g;
  }, [car.appearance]);

  // Helpers ----------------------------------------------------------------
  const patchTuning = (k: keyof Tuning, v: Tuning[keyof Tuning]) =>
    setCar((c) => ({ ...c, tuning: { ...c.tuning, [k]: v } }));
  const patchAppearance = <K extends keyof Appearance>(k: K, v: Appearance[K]) =>
    setCar((c) => ({ ...c, appearance: { ...c.appearance, [k]: v } }));

  const handleSave = () => {
    setError(null);
    if (isNew && !canCreateToday()) {
      setError(`Tageslimit erreicht (${0} übrig). Komm morgen wieder oder bearbeite vorhandene Autos.`);
      return;
    }
    try {
      saveCar(car, isNew);
      onSaved(car);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    }
  };

  // GLB upload -------------------------------------------------------------
  const handlePartUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("GLB-Datei zu groß (max 5 MB).");
      return;
    }
    const id = crypto.randomUUID();
    await savePart(id, file);
    const part: PartRef = {
      id,
      name: file.name.replace(/\.(glb|gltf)$/i, ""),
      enabled: true,
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: 1,
    };
    setCar((c) => ({ ...c, parts: [...c.parts, part] }));
  };

  const updatePart = (id: string, patch: Partial<PartRef>) =>
    setCar((c) => ({ ...c, parts: c.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const removePart = async (id: string) => {
    await deletePart(id).catch(() => {});
    setCar((c) => ({ ...c, parts: c.parts.filter((p) => p.id !== id) }));
  };

  return (
    <main className="relative h-screen w-screen overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onCancel}>← Garage</Button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {isNew ? "Neues Auto" : "Bearbeiten"} · {remaining} / 3 heute übrig
            </p>
            <Input
              value={car.name}
              onChange={(e) => setCar((c) => ({ ...c, name: e.target.value }))}
              className="h-8 w-72 border-0 bg-transparent px-0 text-xl font-bold focus-visible:ring-0"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" onClick={() => downloadCar(car)}>Export .car.json</Button>
          )}
          <Button onClick={handleSave}>Speichern</Button>
        </div>
      </header>

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr_420px]">
        {/* Live preview */}
        <div
          ref={mountRef}
          className="h-[420px] overflow-hidden rounded-2xl border bg-card"
          style={{ boxShadow: "var(--hud-glow)" }}
        />

        {/* Quick stats */}
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">Übersicht</h3>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="0–100 km/h" value={`${car.tuning.time0to100.toFixed(1)} s`} />
            <Stat label="Top Speed" value={`${Math.round(car.tuning.topSpeed)} km/h`} />
            <Stat label="Bremsweg" value={`${Math.round(car.tuning.brakeDist)} m`} />
            <Stat label="Gewicht" value={`${Math.round(car.tuning.weight)} kg`} />
            <Stat label="Antrieb" value={car.tuning.drive} />
            <Stat label="Gänge" value={String(car.tuning.gears)} />
          </div>
          <p className="mt-4 font-mono text-[10px] text-muted-foreground">
            Hinweis: Tageslimit ist lokal im Browser gespeichert.
          </p>
        </div>
      </div>

      <div className="grid gap-6 px-6 pb-12 lg:grid-cols-3">
        {/* Performance */}
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="mb-4 text-lg font-bold">Performance</h3>
          <SliderRow label="0–100 km/h (s)" min={2} max={12} step={0.1}
            value={car.tuning.time0to100} onChange={(v) => patchTuning("time0to100", v)} />
          <SliderRow label="Top Speed (km/h)" min={120} max={400} step={5}
            value={car.tuning.topSpeed} onChange={(v) => patchTuning("topSpeed", v)} />
          <SliderRow label="Bremsweg 100–0 (m)" min={25} max={60} step={1}
            value={car.tuning.brakeDist} onChange={(v) => patchTuning("brakeDist", v)} />
          <SliderRow label="Gewicht (kg)" min={800} max={2500} step={25}
            value={car.tuning.weight} onChange={(v) => patchTuning("weight", v)} />
          <SliderRow label="Gewicht vorne (%)" min={30} max={70} step={1}
            value={car.tuning.weightDistFront} onChange={(v) => patchTuning("weightDistFront", v)} />
          <div className="mt-4">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Antrieb</Label>
            <div className="mt-2 flex gap-2">
              {(["FWD", "RWD", "AWD"] as const).map((d) => (
                <button key={d}
                  onClick={() => patchTuning("drive", d)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${car.tuning.drive === d ? "border-primary bg-primary/10" : "border-border"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Getriebe + Handling */}
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="mb-4 text-lg font-bold">Getriebe & Handling</h3>
          <SliderRow label="Anzahl Gänge" min={4} max={8} step={1}
            value={car.tuning.gears}
            onChange={(v) => {
              const gears = Math.round(v);
              const ratios = [...car.tuning.gearRatios];
              while (ratios.length < gears) ratios.push(Math.max(0.4, (ratios.at(-1) ?? 1) - 0.2));
              while (ratios.length > gears) ratios.pop();
              setCar((c) => ({ ...c, tuning: { ...c.tuning, gears, gearRatios: ratios } }));
            }} />
          <div className="mt-2 space-y-2">
            {car.tuning.gearRatios.slice(0, car.tuning.gears).map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-10 font-mono text-[10px] text-muted-foreground">G{i + 1}</span>
                <Slider min={0.3} max={5} step={0.05} value={[r]}
                  onValueChange={([v]) => {
                    const next = [...car.tuning.gearRatios];
                    next[i] = v;
                    setCar((c) => ({ ...c, tuning: { ...c.tuning, gearRatios: next } }));
                  }} />
                <span className="w-12 text-right font-mono text-xs">{r.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t pt-4">
            <SliderRow label="Grip" min={0} max={100} step={1}
              value={car.tuning.grip} onChange={(v) => patchTuning("grip", v)} />
            <SliderRow label="Lenkwinkel (°)" min={15} max={45} step={1}
              value={car.tuning.steerAngle} onChange={(v) => patchTuning("steerAngle", v)} />
            <SliderRow label="Untersteuern ← → Übersteuern" min={-100} max={100} step={1}
              value={car.tuning.handlingBias} onChange={(v) => patchTuning("handlingBias", v)} />
            <SliderRow label="Federung Härte" min={0} max={100} step={1}
              value={car.tuning.suspension} onChange={(v) => patchTuning("suspension", v)} />
          </div>
        </section>

        {/* Optik */}
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="mb-4 text-lg font-bold">Optik</h3>
          <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Karosserie</Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["roadster", "racer", "suv", "truck", "kompakt"] as const).map((b) => (
              <button key={b}
                onClick={() => patchAppearance("bodyType", b)}
                className={`rounded-md border px-2 py-2 text-xs capitalize ${car.appearance.bodyType === b ? "border-primary bg-primary/10" : "border-border"}`}>
                {b}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <ColorRow label="Primär" value={car.appearance.primaryColor}
              onChange={(v) => patchAppearance("primaryColor", v)} />
            <ColorRow label="Sekundär" value={car.appearance.secondaryColor}
              onChange={(v) => patchAppearance("secondaryColor", v)} />
            <ColorRow label="Felgen" value={car.appearance.wheelColor}
              onChange={(v) => patchAppearance("wheelColor", v)} />
          </div>

          <div className="mt-4">
            <SliderRow label="Felgengröße (Zoll)" min={14} max={22} step={1}
              value={car.appearance.wheelSize} onChange={(v) => patchAppearance("wheelSize", v)} />
            <SliderRow label="Glas-Tönung" min={0} max={1} step={0.05}
              value={car.appearance.glassTint} onChange={(v) => patchAppearance("glassTint", v)} />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Label>Spoiler</Label>
            <button
              onClick={() => patchAppearance("spoiler", !car.appearance.spoiler)}
              className={`rounded-full px-4 py-1 text-xs font-medium ${car.appearance.spoiler ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              {car.appearance.spoiler ? "An" : "Aus"}
            </button>
          </div>
          {car.appearance.spoiler && (
            <SliderRow label="Spoiler-Höhe" min={0} max={1} step={0.05}
              value={car.appearance.spoilerHeight} onChange={(v) => patchAppearance("spoilerHeight", v)} />
          )}
        </section>
      </div>

      {/* Mods + Parts */}
      <div className="grid gap-6 px-6 pb-16 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">3D-Teile (GLB)</h3>
            <label className="cursor-pointer rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm hover:bg-primary/20">
              + Upload
              <input
                type="file"
                accept=".glb,.gltf,model/gltf-binary"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await handlePartUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {car.parts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Teile. Lade ein .glb hoch, um eigene 3D-Mods anzubringen.</p>
          ) : (
            <div className="space-y-4">
              {car.parts.map((p) => (
                <div key={p.id} className="rounded-lg border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Input value={p.name} onChange={(e) => updatePart(p.id, { name: e.target.value })} className="h-8 w-48" />
                    <div className="flex items-center gap-2">
                      <button onClick={() => updatePart(p.id, { enabled: !p.enabled })}
                        className={`rounded-full px-3 py-1 text-xs ${p.enabled ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                        {p.enabled ? "An" : "Aus"}
                      </button>
                      <button onClick={() => removePart(p.id)} className="text-xs text-destructive hover:underline">Entfernen</button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    {(["X", "Y", "Z"] as const).map((axis, i) => (
                      <div key={axis}>
                        <span className="font-mono text-[10px] text-muted-foreground">Pos {axis}</span>
                        <Slider min={-3} max={3} step={0.05} value={[p.position[i]]}
                          onValueChange={([v]) => {
                            const next = [...p.position] as [number, number, number];
                            next[i] = v;
                            updatePart(p.id, { position: next });
                          }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <span className="font-mono text-[10px] text-muted-foreground">Skalierung {p.scale.toFixed(2)}×</span>
                    <Slider min={0.05} max={5} step={0.05} value={[p.scale]}
                      onValueChange={([v]) => updatePart(p.id, { scale: v })} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 font-mono text-[10px] text-muted-foreground">
            Teile werden lokal in IndexedDB gespeichert (max 5 MB pro Datei).
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h3 className="mb-4 text-lg font-bold">Mods</h3>
          {car.mods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Mods werden über Import von <code className="font-mono">.car.json</code> in der Garage hinzugefügt.
              Sie überschreiben Tuning- oder Optik-Werte.
            </p>
          ) : (
            <ul className="space-y-2">
              {car.mods.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border bg-background/40 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    {m.author && <p className="font-mono text-[10px] text-muted-foreground">von {m.author}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCar((c) => ({ ...c, mods: c.mods.map((x) => x.id === m.id ? { ...x, enabled: !x.enabled } : x) }))}
                      className={`rounded-full px-3 py-1 text-xs ${m.enabled ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      {m.enabled ? "Aktiv" : "Aus"}
                    </button>
                    <button onClick={() => setCar((c) => ({ ...c, mods: c.mods.filter((x) => x.id !== m.id) }))}
                      className="text-xs text-destructive hover:underline">Entfernen</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold tabular-nums">{value}</p>
    </div>
  );
}

function SliderRow({ label, min, max, step, value, onChange }: {
  label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
        <span className="font-mono text-xs tabular-nums">{value.toFixed(step >= 1 ? 0 : 2)}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} className="mt-1.5" />
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border bg-transparent" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 font-mono text-xs" />
      </div>
    </div>
  );
}

// Re-export helper used by Simulator to fetch GLB blobs
export async function loadPartIntoScene(
  part: PartRef,
  parent: THREE.Group,
  loader: GLTFLoader,
): Promise<void> {
  const blob = await getPart(part.id);
  if (!blob) return;
  const buf = await blob.arrayBuffer();
  await new Promise<void>((resolve) => {
    loader.parse(buf, "", (gltf) => {
      const obj = gltf.scene;
      obj.position.set(...part.position);
      obj.rotation.set(...part.rotation);
      obj.scale.setScalar(part.scale);
      obj.traverse((m) => {
        if ((m as THREE.Mesh).isMesh) {
          (m as THREE.Mesh).castShadow = true;
        }
      });
      parent.add(obj);
      resolve();
    }, () => resolve());
  });
}
