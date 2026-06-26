import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CarSpec } from "@/lib/car-spec";
import { physicsFromTuning } from "@/lib/car-spec";
import { buildCarGroup, getWheels } from "@/lib/car-renderer";
import { getPart } from "@/lib/parts-store";
import { buildWorld, type WorldRefs } from "@/lib/world";
import { applyDayNight, formatTime, dayPhase } from "@/lib/day-night";
import { joinRoom, type Pose, type RoomHandle } from "@/lib/multiplayer";

type Mode =
  | { kind: "solo" }
  | { kind: "split"; spec2: CarSpec }
  | { kind: "online"; room: string; name: string };

type Controls = {
  fwd: string[]; back: string[]; left: string[]; right: string[]; brake: string[];
};

const P1: Controls = { fwd: ["w","arrowup"], back: ["s","arrowdown"], left: ["a","arrowleft"], right: ["d","arrowright"], brake: [" "] };
const P2: Controls = { fwd: ["i"], back: ["k"], left: ["j"], right: ["l"], brake: ["u"] };

export function Simulator({
  spec,
  mode,
  onExit,
}: {
  spec: CarSpec;
  mode: Mode;
  onExit: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const [speed, setSpeed] = useState(0);
  const [speed2, setSpeed2] = useState(0);
  const [gear, setGear] = useState("N");
  const [clockText, setClockText] = useState("12:00");
  const [playerCount, setPlayerCount] = useState(1);

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const camera2 = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.autoClear = false;
    mount.appendChild(renderer.domElement);

    const world: WorldRefs = buildWorld(scene);

    // Player 1
    const p1 = createPlayer(spec, scene);
    p1.group.position.set(world.outerR + (world.innerR - world.outerR) / -2 + 60, 0, 0);
    p1.group.rotation.y = Math.PI / 2;

    // Player 2 (split)
    let p2: PlayerRefs | null = null;
    if (mode.kind === "split") {
      p2 = createPlayer(mode.spec2, scene);
      p2.group.position.set(60, 0, 8);
      p2.group.rotation.y = Math.PI / 2;
    }

    // Online remotes
    const remotes = new Map<string, RemoteCar>();
    let room: RoomHandle | null = null;
    if (mode.kind === "online") {
      const selfId = crypto.randomUUID();
      room = joinRoom(mode.room, selfId, mode.name, spec.appearance.primaryColor);
      room.onPose((p) => {
        let r = remotes.get(p.id);
        if (!r) {
          const g = buildCarGroup({ ...spec.appearance, primaryColor: p.color });
          scene.add(g);
          const label = makeLabel(p.name);
          g.add(label);
          r = { group: g, target: { x: p.x, z: p.z, ry: p.ry }, label };
          remotes.set(p.id, r);
          setPlayerCount(1 + remotes.size);
        }
        r.target.x = p.x; r.target.z = p.z; r.target.ry = p.ry;
      });
      room.onLeave((id) => {
        const r = remotes.get(id);
        if (r) { scene.remove(r.group); remotes.delete(id); setPlayerCount(1 + remotes.size); }
      });
    }

    // Custom GLB parts on player 1
    const loader = new GLTFLoader();
    for (const part of spec.parts) {
      (async () => {
        const blob = await getPart(part.id);
        if (!blob) return;
        const buf = await blob.arrayBuffer();
        loader.parse(buf, "", (gltf) => {
          const obj = gltf.scene;
          obj.position.set(...part.position);
          obj.rotation.set(...part.rotation);
          obj.scale.setScalar(part.scale);
          obj.traverse((m) => { if ((m as THREE.Mesh).isMesh) (m as THREE.Mesh).castShadow = true; });
          p1.group.add(obj);
        }, () => {});
      })();
    }

    // Controls
    const keys: Record<string, boolean> = {};
    const onDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const onUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      const split = mode.kind === "split";
      camera.aspect = (split ? w / 2 : w) / h;
      camera2.aspect = camera.aspect;
      camera.updateProjectionMatrix();
      camera2.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    onResize();

    const phys1 = physicsFromTuning(spec.tuning);
    const phys2 = mode.kind === "split" ? physicsFromTuning(mode.spec2.tuning) : phys1;
    const bias1 = spec.tuning.handlingBias / 100;
    const bias2 = mode.kind === "split" ? mode.spec2.tuning.handlingBias / 100 : 0;

    const clock = new THREE.Clock();
    let hudT = 0;
    let netT = 0;
    let raf = 0;

    const updatePlayer = (p: PlayerRefs, ctrls: Controls, phys: ReturnType<typeof physicsFromTuning>, bias: number) => {
      const fwd = ctrls.fwd.some((k) => keys[k]);
      const back = ctrls.back.some((k) => keys[k]);
      const left = ctrls.left.some((k) => keys[k]);
      const right = ctrls.right.some((k) => keys[k]);
      const brake = ctrls.brake.some((k) => keys[k]);

      if (fwd) p.velocity += phys.accel;
      if (back) p.velocity -= phys.accel * 0.7;
      if (brake) p.velocity *= 0.92;
      p.velocity *= phys.friction;
      p.velocity = Math.max(-phys.maxSpeed * phys.reverseFactor, Math.min(phys.maxSpeed, p.velocity));

      const turning = Math.min(1, Math.abs(p.velocity) / 0.1);
      const turn = phys.turnSpeed * (1 + bias * 0.5);
      if (left) p.group.rotation.y += turn * turning * Math.sign(p.velocity || 1);
      if (right) p.group.rotation.y -= turn * turning * Math.sign(p.velocity || 1);

      const nextX = p.group.position.x + Math.sin(p.group.rotation.y) * p.velocity;
      const nextZ = p.group.position.z + Math.cos(p.group.rotation.y) * p.velocity;

      let blocked = false;
      const carR = 1.5;
      for (const b of world.buildings) {
        if (Math.abs(nextX - b.x) < b.w / 2 + carR && Math.abs(nextZ - b.z) < b.d / 2 + carR) {
          blocked = true; break;
        }
      }
      // World bounds
      const lim = world.WORLD_SIZE / 2 - 5;
      if (Math.abs(nextX) > lim || Math.abs(nextZ) > lim) blocked = true;

      if (blocked) p.velocity *= -0.35;
      else { p.group.position.x = nextX; p.group.position.z = nextZ; }

      // Follow ground (offroad)
      const h = world.groundHeightAt(p.group.position.x, p.group.position.z);
      p.group.position.y = h;

      p.wheels.forEach((w) => { w.rotation.x += p.velocity * 0.8; });
    };

    const followCam = (cam: THREE.PerspectiveCamera, p: PlayerRefs) => {
      const off = new THREE.Vector3(
        -Math.sin(p.group.rotation.y) * 9, 5, -Math.cos(p.group.rotation.y) * 9,
      );
      const target = p.group.position.clone().add(off);
      cam.position.lerp(target, 0.1);
      cam.lookAt(p.group.position.x, p.group.position.y + 1, p.group.position.z);
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const elapsed = clock.elapsedTime;

      applyDayNight(scene, world, elapsed);
      // Headlights brighter at night
      const phase = dayPhase(elapsed);
      const night = phase < 0.27 || phase > 0.78 ? 1 : 0;
      p1.headlight.intensity = 1.5 + night * 4;
      if (p2) p2.headlight.intensity = 1.5 + night * 4;

      updatePlayer(p1, P1, phys1, bias1);
      if (p2) updatePlayer(p2, P2, phys2, bias2);

      // Interpolate remotes
      for (const r of remotes.values()) {
        r.group.position.x += (r.target.x - r.group.position.x) * 0.2;
        r.group.position.z += (r.target.z - r.group.position.z) * 0.2;
        r.group.position.y = world.groundHeightAt(r.group.position.x, r.group.position.z);
        let dr = r.target.ry - r.group.rotation.y;
        while (dr > Math.PI) dr -= Math.PI * 2;
        while (dr < -Math.PI) dr += Math.PI * 2;
        r.group.rotation.y += dr * 0.2;
      }

      // Broadcast self pose
      if (room) {
        netT += dt;
        if (netT > 0.066) {
          netT = 0;
          room.send({
            id: room.selfId,
            name: mode.kind === "online" ? mode.name : "",
            color: spec.appearance.primaryColor,
            x: p1.group.position.x,
            z: p1.group.position.z,
            ry: p1.group.rotation.y,
            speed: Math.abs(p1.velocity),
          } as Pose);
        }
      }

      // HUD
      hudT += dt;
      if (hudT > 0.08) {
        hudT = 0;
        setSpeed(Math.round(Math.abs(p1.velocity) * 380));
        if (p2) setSpeed2(Math.round(Math.abs(p2.velocity) * 380));
        const kmh = Math.abs(p1.velocity) * 380;
        const g = spec.tuning.gears;
        const top = spec.tuning.topSpeed;
        const gIdx = Math.min(g, Math.max(1, Math.ceil((kmh / Math.max(1, top)) * g)));
        setGear(p1.velocity > 0.02 ? String(gIdx) : p1.velocity < -0.02 ? "R" : "N");
        setClockText(formatTime(phase));
      }

      drawMinimap();

      // Render — split if needed
      renderer.clear();
      const w = mount.clientWidth, h = mount.clientHeight;
      if (mode.kind === "split" && p2) {
        followCam(camera, p1);
        followCam(camera2, p2);
        renderer.setScissorTest(true);
        renderer.setViewport(0, 0, w / 2, h);
        renderer.setScissor(0, 0, w / 2, h);
        renderer.render(scene, camera);
        renderer.setViewport(w / 2, 0, w / 2, h);
        renderer.setScissor(w / 2, 0, w / 2, h);
        renderer.render(scene, camera2);
        renderer.setScissorTest(false);
      } else {
        followCam(camera, p1);
        renderer.setViewport(0, 0, w, h);
        renderer.render(scene, camera);
      }
    };

    // Minimap
    const mmCanvas = minimapRef.current;
    const mmCtx = mmCanvas?.getContext("2d") ?? null;
    const MM_SIZE = 180;
    const scale = MM_SIZE / world.WORLD_SIZE;
    if (mmCanvas) { mmCanvas.width = MM_SIZE; mmCanvas.height = MM_SIZE; }

    const drawMinimap = () => {
      if (!mmCtx) return;
      const ctx = mmCtx;
      const cx = MM_SIZE / 2, cy = MM_SIZE / 2;
      ctx.clearRect(0, 0, MM_SIZE, MM_SIZE);
      ctx.fillStyle = "#0d1220";
      ctx.fillRect(0, 0, MM_SIZE, MM_SIZE);

      // Offroad zone (NE in world == x>0, z<0 → on minimap that's right/top)
      ctx.fillStyle = "#2d2a1a";
      ctx.fillRect(cx + 60 * scale, cy - 400 * scale, MM_SIZE, 340 * scale);

      // Roads
      ctx.strokeStyle = "#3a4458";
      ctx.lineWidth = 1.5;
      for (const z of world.roadsZ) {
        ctx.beginPath();
        ctx.moveTo(0, cy + z * scale);
        ctx.lineTo(MM_SIZE, cy + z * scale);
        ctx.stroke();
      }
      for (const x of world.roadsX) {
        ctx.beginPath();
        ctx.moveTo(cx + x * scale, 0);
        ctx.lineTo(cx + x * scale, MM_SIZE);
        ctx.stroke();
      }
      // Track
      ctx.strokeStyle = "#5a6478";
      ctx.lineWidth = (world.outerR - world.innerR) * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, ((world.outerR + world.innerR) / 2) * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Buildings
      ctx.fillStyle = "#6b7a99";
      for (const b of world.buildings) {
        ctx.fillRect(cx + b.x * scale - (b.w * scale) / 2, cy + b.z * scale - (b.d * scale) / 2, Math.max(1, b.w * scale), Math.max(1, b.d * scale));
      }

      // Remote players
      ctx.fillStyle = "#fff";
      for (const r of remotes.values()) {
        ctx.fillRect(cx + r.group.position.x * scale - 2, cy + r.group.position.z * scale - 2, 4, 4);
      }
      // Player 2
      if (p2) {
        ctx.fillStyle = "#5b8def";
        ctx.fillRect(cx + p2.group.position.x * scale - 3, cy + p2.group.position.z * scale - 3, 6, 6);
      }
      // Player 1
      const px = cx + p1.group.position.x * scale;
      const py = cy + p1.group.position.z * scale;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-p1.group.rotation.y);
      ctx.fillStyle = spec.appearance.primaryColor;
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, MM_SIZE - 1, MM_SIZE - 1);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("resize", onResize);
      room?.destroy();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [spec, mode]);

  const isSplit = mode.kind === "split";

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />
      {isSplit && (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/20" />
      )}

      <div className="pointer-events-none absolute inset-0 p-6">
        <div className="flex items-start justify-between">
          <button
            onClick={onExit}
            className="pointer-events-auto rounded-lg border bg-card/80 px-4 py-2 font-mono text-xs uppercase tracking-widest backdrop-blur-md hover:border-primary"
          >
            ← Garage
          </button>

          <div className="flex items-start gap-3">
            <div className="rounded-lg border bg-card/80 px-3 py-2 backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Uhrzeit</p>
              <p className="font-mono text-xl font-bold tabular-nums">{clockText}</p>
            </div>
            {mode.kind === "online" && (
              <div className="rounded-lg border bg-card/80 px-3 py-2 backdrop-blur-md">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Raum {mode.room}</p>
                <p className="font-mono text-xl font-bold">{playerCount} 👥</p>
              </div>
            )}
            <div className="rounded-2xl border bg-card/80 p-2 backdrop-blur-md" style={{ boxShadow: "var(--hud-glow)" }}>
              <canvas ref={minimapRef} className="block rounded-xl" style={{ width: 180, height: 180 }} />
              <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Map</p>
            </div>
          </div>
        </div>

        {/* Player 1 HUD (bottom-left) */}
        <div className="absolute bottom-6 left-6 flex items-end gap-6">
          <div className="rounded-2xl border bg-card/80 px-6 py-4 backdrop-blur-md" style={{ boxShadow: "var(--hud-glow)" }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">P1 km/h</p>
            <p className="font-mono text-5xl font-bold tabular-nums" style={{ color: spec.appearance.primaryColor }}>{String(speed).padStart(3, "0")}</p>
          </div>
          <div className="rounded-2xl border bg-card/80 px-5 py-4 backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Gear</p>
            <p className="font-mono text-3xl font-bold">{gear}</p>
          </div>
        </div>

        {/* Player 2 HUD (bottom-right in split) */}
        {isSplit && mode.kind === "split" && (
          <div className="absolute bottom-6 right-6 rounded-2xl border bg-card/80 px-6 py-4 backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">P2 km/h</p>
            <p className="font-mono text-5xl font-bold tabular-nums" style={{ color: mode.spec2.appearance.primaryColor }}>{String(speed2).padStart(3, "0")}</p>
          </div>
        )}

        {!isSplit && (
          <div className="absolute bottom-6 right-6 rounded-lg border bg-card/80 px-4 py-3 font-mono text-[11px] backdrop-blur-md">
            <p className="text-muted-foreground">CONTROLS</p>
            <p className="mt-1">WASD / ↑↓←→ — Fahren</p>
            <p>SPACE — Bremse</p>
          </div>
        )}
        {isSplit && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 rounded-lg border bg-card/80 px-4 py-2 font-mono text-[10px] backdrop-blur-md">
            <p>P1: WASD / SPACE &nbsp;·&nbsp; P2: IJKL / U</p>
          </div>
        )}
      </div>
    </div>
  );
}

type PlayerRefs = {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  headlight: THREE.SpotLight;
  velocity: number;
};

function createPlayer(spec: CarSpec, scene: THREE.Scene): PlayerRefs {
  const group = buildCarGroup(spec.appearance);
  const wheels = getWheels(group);
  const hl = new THREE.SpotLight(0xfff1c2, 1.5, 40, Math.PI / 5, 0.4);
  hl.position.set(0, 1, 2.2);
  hl.target.position.set(0, 0, 10);
  group.add(hl); group.add(hl.target);
  scene.add(group);
  return { group, wheels, headlight: hl, velocity: 0 };
}

type RemoteCar = {
  group: THREE.Group;
  target: { x: number; z: number; ry: number };
  label: THREE.Sprite;
};

function makeLabel(text: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(13,18,32,0.85)";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text.slice(0, 16), 128, 32);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(4, 1, 1);
  sp.position.y = 3;
  return sp;
}
