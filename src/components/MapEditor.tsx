import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { toast } from "sonner";
import { applyMod, downloadMod, type MapObject, type Mod } from "@/lib/mods";

type Tool = "building" | "ramp" | "checkpoint" | "prop" | "select";

const defaultFor = (tool: Exclude<Tool, "select">, x: number, z: number): MapObject => {
  switch (tool) {
    case "building": return { type: "building", x, z, w: 10, d: 10, h: 15, color: "#5b6d8f" };
    case "ramp":     return { type: "ramp", x, z, length: 12, width: 6, angleDeg: 18, rotationDeg: 0, color: "#c94f4f" };
    case "checkpoint": return { type: "checkpoint", x, z, radius: 4, color: "#4ade80" };
    case "prop":     return { type: "prop", x, z, shape: "box", size: 2, color: "#8899aa" };
  }
};

export function MapEditor({ onBack }: { onBack: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("building");
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [mapName, setMapName] = useState("Meine Karte");
  const [author, setAuthor] = useState("anon");
  const objectsRef = useRef(objects);
  objectsRef.current = objects;
  const toolRef = useRef(tool);
  toolRef.current = tool;

  // Three.js scene
  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0d1220");
    const cam = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 3000);
    cam.position.set(120, 140, 120);
    cam.lookAt(0, 0, 0);
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(r.domElement);

    scene.add(new THREE.HemisphereLight(0x8899ff, 0x222233, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(80, 120, 40);
    scene.add(sun);

    const grid = new THREE.GridHelper(800, 40, 0x3a4458, 0x1a2030);
    scene.add(grid);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(800, 800),
      new THREE.MeshStandardMaterial({ color: 0x1c2230, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);

    // Kamera-Steuerung — Rechts-Drag zum Orbit, Wheel-Zoom
    let orbiting = false;
    let panning = false;
    let last = { x: 0, y: 0 };
    let target = new THREE.Vector3(0, 0, 0);
    let radius = cam.position.distanceTo(target);
    let phi = Math.atan2(cam.position.y, Math.sqrt(cam.position.x ** 2 + cam.position.z ** 2));
    let theta = Math.atan2(cam.position.x, cam.position.z);

    const applyCam = () => {
      cam.position.set(
        target.x + radius * Math.cos(phi) * Math.sin(theta),
        target.y + radius * Math.sin(phi),
        target.z + radius * Math.cos(phi) * Math.cos(theta),
      );
      cam.lookAt(target);
    };
    applyCam();

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { orbiting = true; last = { x: e.clientX, y: e.clientY }; }
      else if (e.button === 1) { panning = true; last = { x: e.clientX, y: e.clientY }; e.preventDefault(); }
    };
    const onMouseUp = () => { orbiting = false; panning = false; };
    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      if (orbiting) {
        theta -= dx * 0.005;
        phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi + dy * 0.005));
        applyCam();
      } else if (panning) {
        const s = radius * 0.0015;
        target.x -= Math.cos(theta) * dx * s;
        target.z += Math.sin(theta) * dx * s;
        target.x += Math.sin(theta) * dy * s * 0.3;
        target.z += Math.cos(theta) * dy * s * 0.3;
        applyCam();
      }
      last = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(20, Math.min(800, radius * (1 + Math.sign(e.deltaY) * 0.1)));
      applyCam();
    };
    const onContext = (e: MouseEvent) => e.preventDefault();

    // Klick platziert Objekt (Raycast auf Ground)
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const rect = r.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, cam);
      const hits = raycaster.intersectObject(ground, false);
      if (!hits.length) return;
      const p = hits[0].point;
      const t = toolRef.current;
      if (t === "select") {
        // Klick auf existierendes Objekt
        const hitObj = raycaster.intersectObjects(objectsGroup.children, false)[0];
        if (hitObj) {
          const idx = objectsGroup.children.indexOf(hitObj.object);
          setSelected(idx);
        } else setSelected(null);
        return;
      }
      const obj = defaultFor(t, Math.round(p.x), Math.round(p.z));
      setObjects((os) => {
        const next = [...os, obj];
        setSelected(next.length - 1);
        return next;
      });
    };

    r.domElement.addEventListener("mousedown", onMouseDown);
    r.domElement.addEventListener("click", onClick);
    r.domElement.addEventListener("contextmenu", onContext);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    r.domElement.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      cam.aspect = mount.clientWidth / mount.clientHeight;
      cam.updateProjectionMatrix();
      r.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    const rebuild = () => {
      while (objectsGroup.children.length) objectsGroup.remove(objectsGroup.children[0]);
      objectsRef.current.forEach((o) => {
        const m = buildMesh(o);
        objectsGroup.add(m);
      });
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      rebuild();
      r.render(scene, cam);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      r.domElement.removeEventListener("mousedown", onMouseDown);
      r.domElement.removeEventListener("click", onClick);
      r.domElement.removeEventListener("contextmenu", onContext);
      r.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      r.dispose();
      if (r.domElement.parentNode === mount) mount.removeChild(r.domElement);
    };
  }, []);

  const patchSelected = (patch: Partial<MapObject>) => {
    if (selected === null) return;
    setObjects((os) => os.map((o, i) => (i === selected ? ({ ...o, ...patch } as MapObject) : o)));
  };
  const removeSelected = () => {
    if (selected === null) return;
    setObjects((os) => os.filter((_, i) => i !== selected));
    setSelected(null);
  };

  const buildMod = (): Mod => ({
    format: "driftlab.mod",
    version: 2,
    kind: "map",
    id: crypto.randomUUID(),
    name: mapName.trim() || "Meine Karte",
    author: author.trim() || "anon",
    description: `Erstellt im Map-Editor · ${objects.length} Objekte`,
    payload: { objects },
  });

  const install = () => {
    if (!objects.length) return toast.error("Noch keine Objekte platziert.");
    applyMod(buildMod()).then((msg) => toast.success(msg));
  };
  const exportMod = () => {
    if (!objects.length) return toast.error("Noch keine Objekte platziert.");
    downloadMod(buildMod());
    toast.success("Als .mod.json gespeichert — hochladbar im Mod-Browser.");
  };

  const sel = selected !== null ? objects[selected] : null;
  const tools: { id: Tool; label: string; icon: string }[] = useMemo(() => [
    { id: "building",   label: "Gebäude",     icon: "🏢" },
    { id: "ramp",       label: "Rampe",       icon: "📐" },
    { id: "checkpoint", label: "Checkpoint",  icon: "🎯" },
    { id: "prop",       label: "Prop",        icon: "📦" },
    { id: "select",     label: "Auswählen",   icon: "☝️" },
  ], []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Toolbar */}
      <div className="pointer-events-none absolute inset-0 flex">
        <aside className="pointer-events-auto flex w-72 flex-col gap-3 border-r bg-card/80 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="rounded-lg border px-3 py-1.5 text-xs hover:border-primary">← Zurück</button>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Map-Editor</p>
          </div>

          <input
            value={mapName} onChange={(e) => setMapName(e.target.value)}
            className="rounded-lg border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
            placeholder="Kartenname"
          />
          <input
            value={author} onChange={(e) => setAuthor(e.target.value)}
            className="rounded-lg border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
            placeholder="Autor"
          />

          <div className="mt-2">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Werkzeuge</p>
            <div className="grid grid-cols-2 gap-2">
              {tools.map((t) => (
                <button key={t.id} onClick={() => setTool(t.id)}
                  className={`rounded-lg border px-2 py-2 text-left text-xs transition ${tool === t.id ? "border-primary bg-primary/10" : "hover:border-primary/50"}`}>
                  <span className="mr-1">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
            <p className="mt-2 font-mono text-[9px] text-muted-foreground">
              Linksklick platziert · Rechts-Drag: rotieren · Mittel-Drag: verschieben · Wheel: zoomen
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <p className="font-mono text-[10px] text-muted-foreground">{objects.length} Objekt(e)</p>
            <button onClick={install}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              🗺️ In Welt installieren
            </button>
            <button onClick={exportMod}
              className="rounded-lg border px-3 py-2 text-sm hover:border-primary">
              💾 Als Mod exportieren
            </button>
            <button onClick={() => { if (confirm("Alle Objekte löschen?")) { setObjects([]); setSelected(null); } }}
              className="rounded-lg border border-destructive/40 px-3 py-2 text-xs text-destructive hover:bg-destructive/10">
              Alles löschen
            </button>
          </div>
        </aside>

        {/* Object Inspector */}
        {sel && (
          <aside className="pointer-events-auto ml-auto w-72 border-l bg-card/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Eigenschaften</p>
              <button onClick={removeSelected} className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive">✕</button>
            </div>
            <p className="mt-1 font-bold capitalize">{sel.type}</p>

            <div className="mt-4 space-y-2 text-xs">
              <NumField label="X" value={sel.x} onChange={(v) => patchSelected({ x: v } as Partial<MapObject>)} />
              <NumField label="Z" value={sel.z} onChange={(v) => patchSelected({ z: v } as Partial<MapObject>)} />
              {sel.type === "building" && (<>
                <NumField label="Breite (W)" value={sel.w} onChange={(v) => patchSelected({ w: v } as Partial<MapObject>)} min={1} max={200} />
                <NumField label="Tiefe (D)" value={sel.d} onChange={(v) => patchSelected({ d: v } as Partial<MapObject>)} min={1} max={200} />
                <NumField label="Höhe (H)" value={sel.h} onChange={(v) => patchSelected({ h: v } as Partial<MapObject>)} min={1} max={200} />
              </>)}
              {sel.type === "ramp" && (<>
                <NumField label="Länge" value={sel.length} onChange={(v) => patchSelected({ length: v } as Partial<MapObject>)} min={2} max={80} />
                <NumField label="Breite" value={sel.width} onChange={(v) => patchSelected({ width: v } as Partial<MapObject>)} min={2} max={30} />
                <NumField label="Winkel°" value={sel.angleDeg} onChange={(v) => patchSelected({ angleDeg: v } as Partial<MapObject>)} min={5} max={45} />
                <NumField label="Rot°" value={sel.rotationDeg} onChange={(v) => patchSelected({ rotationDeg: v } as Partial<MapObject>)} min={-180} max={180} />
              </>)}
              {sel.type === "checkpoint" && (
                <NumField label="Radius" value={sel.radius} onChange={(v) => patchSelected({ radius: v } as Partial<MapObject>)} min={1} max={30} />
              )}
              {sel.type === "prop" && (
                <NumField label="Größe" value={sel.size} onChange={(v) => patchSelected({ size: v } as Partial<MapObject>)} min={0.2} max={40} />
              )}
              <div>
                <label className="mb-1 block font-mono text-[10px] text-muted-foreground">Farbe</label>
                <input type="color" value={sel.color}
                  onChange={(e) => patchSelected({ color: e.target.value } as Partial<MapObject>)}
                  className="h-8 w-full cursor-pointer rounded-md border bg-background" />
              </div>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}

function NumField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] text-muted-foreground">{label}</label>
      <input type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-md border bg-background px-2 py-1 outline-none focus:border-primary" />
    </div>
  );
}

function buildMesh(o: MapObject): THREE.Object3D {
  const color = new THREE.Color(o.color);
  if (o.type === "building") {
    const m = new THREE.Mesh(new THREE.BoxGeometry(o.w, o.h, o.d), new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
    m.position.set(o.x, o.h / 2, o.z);
    return m;
  }
  if (o.type === "ramp") {
    const rad = (o.angleDeg * Math.PI) / 180;
    const height = Math.tan(rad) * o.length;
    const geo = new THREE.BoxGeometry(o.width, height, o.length);
    // Schrägen: verschiebe obere Vertices für Rampe
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0 && pos.getZ(i) < 0) pos.setY(i, -height / 2);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
    m.position.set(o.x, height / 2, o.z);
    m.rotation.y = (o.rotationDeg * Math.PI) / 180;
    return m;
  }
  if (o.type === "checkpoint") {
    const geo = new THREE.TorusGeometry(o.radius, 0.4, 8, 24);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 }));
    m.position.set(o.x, 1.5, o.z);
    m.rotation.x = Math.PI / 2;
    return m;
  }
  // prop
  let geo: THREE.BufferGeometry;
  if (o.shape === "sphere") geo = new THREE.SphereGeometry(o.size, 16, 12);
  else if (o.shape === "cone") geo = new THREE.ConeGeometry(o.size, o.size * 2, 16);
  else if (o.shape === "cylinder") geo = new THREE.CylinderGeometry(o.size, o.size, o.size * 2, 16);
  else geo = new THREE.BoxGeometry(o.size, o.size, o.size);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
  m.position.set(o.x, o.size, o.z);
  return m;
}
