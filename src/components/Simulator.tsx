import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CarSpec } from "@/lib/car-spec";
import { physicsFromTuning } from "@/lib/car-spec";
import { buildCarGroup, getWheels } from "@/lib/car-renderer";
import { getPart } from "@/lib/parts-store";

export function Simulator({ spec, onExit }: { spec: CarSpec; onExit: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const [speed, setSpeed] = useState(0);
  const [gear, setGear] = useState("N");

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0d1220");
    scene.fog = new THREE.Fog("#0d1220", 80, 220);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x8899ff, 0x222233, 0.6));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.1);
    sun.position.set(60, 80, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -120; sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -120;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    for (let i = 0; i < 60; i++) {
      const g = new THREE.Mesh(
        new THREE.CircleGeometry(2 + Math.random() * 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x3d5a3d, roughness: 1 }),
      );
      g.rotation.x = -Math.PI / 2;
      g.position.set((Math.random() - 0.5) * 300, 0.01, (Math.random() - 0.5) * 300);
      ground.add(g);
    }

    // Track
    const trackShape = new THREE.Shape();
    const outerR = 60, innerR = 45;
    trackShape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
    trackShape.holes.push(hole);
    const track = new THREE.Mesh(
      new THREE.ShapeGeometry(trackShape, 64),
      new THREE.MeshStandardMaterial({ color: 0x1a1d28, roughness: 0.7 }),
    );
    track.rotation.x = -Math.PI / 2;
    track.position.y = 0.02;
    track.receiveShadow = true;
    scene.add(track);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf6d96a });
    const midR = (outerR + innerR) / 2;
    const segs = 48;
    for (let i = 0; i < segs; i++) {
      if (i % 2) continue;
      const a = (i / segs) * Math.PI * 2;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.5), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.rotation.z = -a + Math.PI / 2;
      dash.position.set(Math.cos(a) * midR, 0.03, Math.sin(a) * midR);
      scene.add(dash);
    }

    // Buildings
    const bldMat = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
    const colors = [0x3a4a6b, 0x5b6d8f, 0x2f3a52, 0x6b5b8f, 0x8f5b6d];
    const buildings: { x: number; z: number; w: number; d: number }[] = [];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const r = 95 + Math.random() * 30;
      const h = 6 + Math.random() * 22;
      const w = 6 + Math.random() * 8;
      const d = 6 + Math.random() * 8;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bldMat(colors[i % colors.length]));
      const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
      b.position.set(x, h / 2, z);
      b.castShadow = true; b.receiveShadow = true;
      scene.add(b);
      buildings.push({ x, z, w, d });
    }

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = Math.random() * 35;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2), new THREE.MeshStandardMaterial({ color: 0x5a3a2a }));
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 8), new THREE.MeshStandardMaterial({ color: 0x3d6b3d }));
      leaves.position.y = 3;
      const tree = new THREE.Group();
      tree.add(trunk); tree.add(leaves);
      tree.position.set(Math.cos(a) * r, 1, Math.sin(a) * r);
      tree.castShadow = true;
      scene.add(tree);
    }

    // Car
    const carGroup = buildCarGroup(spec.appearance);
    const wheels = getWheels(carGroup);

    const hl = new THREE.SpotLight(0xfff1c2, 2, 30, Math.PI / 5, 0.4);
    hl.position.set(0, 1, 2.2);
    hl.target.position.set(0, 0, 10);
    carGroup.add(hl); carGroup.add(hl.target);

    carGroup.position.set(midR, 0, 0);
    carGroup.rotation.y = Math.PI / 2;
    scene.add(carGroup);

    // Custom GLB parts
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
          carGroup.add(obj);
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
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Physics derived from tuning
    const phys = physicsFromTuning(spec.tuning);
    const handlingBias = spec.tuning.handlingBias / 100; // -1..1
    let velocity = 0;
    let speedUpdT = 0;

    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      const fwd = keys["w"] || keys["arrowup"];
      const back = keys["s"] || keys["arrowdown"];
      const left = keys["a"] || keys["arrowleft"];
      const right = keys["d"] || keys["arrowright"];
      const brake = keys[" "];

      if (fwd) velocity += phys.accel;
      if (back) velocity -= phys.accel * 0.7;
      if (brake) velocity *= 0.92;
      velocity *= phys.friction;
      velocity = Math.max(-phys.maxSpeed * phys.reverseFactor, Math.min(phys.maxSpeed, velocity));

      const turning = Math.min(1, Math.abs(velocity) / 0.1);
      // handlingBias > 0 sharpens turn-in (oversteer), < 0 dulls it (understeer)
      const turn = phys.turnSpeed * (1 + handlingBias * 0.5);
      if (left) carGroup.rotation.y += turn * turning * Math.sign(velocity || 1);
      if (right) carGroup.rotation.y -= turn * turning * Math.sign(velocity || 1);

      const nextX = carGroup.position.x + Math.sin(carGroup.rotation.y) * velocity;
      const nextZ = carGroup.position.z + Math.cos(carGroup.rotation.y) * velocity;

      const carR = 1.5;
      let blocked = false;
      for (const b of buildings) {
        const hx = b.w / 2 + carR;
        const hz = b.d / 2 + carR;
        if (Math.abs(nextX - b.x) < hx && Math.abs(nextZ - b.z) < hz) { blocked = true; break; }
      }
      if (blocked) velocity *= -0.35;
      else { carGroup.position.x = nextX; carGroup.position.z = nextZ; }

      wheels.forEach((w) => { w.rotation.x += velocity * 0.8; });

      const camOffset = new THREE.Vector3(
        -Math.sin(carGroup.rotation.y) * 9,
        5,
        -Math.cos(carGroup.rotation.y) * 9,
      );
      const target = carGroup.position.clone().add(camOffset);
      camera.position.lerp(target, 0.1);
      camera.lookAt(carGroup.position.x, carGroup.position.y + 1, carGroup.position.z);

      speedUpdT += dt;
      if (speedUpdT > 0.08) {
        speedUpdT = 0;
        const kmh = Math.round(Math.abs(velocity) * 380);
        setSpeed(kmh);
        const g = spec.tuning.gears;
        const top = spec.tuning.topSpeed;
        const gIdx = Math.min(g, Math.max(1, Math.ceil((kmh / top) * g)));
        setGear(velocity > 0.02 ? String(gIdx) : velocity < -0.02 ? "R" : "N");
      }

      drawMinimap();
      renderer.render(scene, camera);
    };

    const mmCanvas = minimapRef.current;
    const mmCtx = mmCanvas?.getContext("2d") ?? null;
    const MM_SIZE = 180;
    const WORLD = 260;
    const scale = MM_SIZE / WORLD;
    if (mmCanvas) { mmCanvas.width = MM_SIZE; mmCanvas.height = MM_SIZE; }

    const drawMinimap = () => {
      if (!mmCtx) return;
      const ctx = mmCtx;
      const cx = MM_SIZE / 2, cy = MM_SIZE / 2;
      ctx.clearRect(0, 0, MM_SIZE, MM_SIZE);
      ctx.fillStyle = "#0d1220";
      ctx.fillRect(0, 0, MM_SIZE, MM_SIZE);
      ctx.strokeStyle = "#3a4458";
      ctx.lineWidth = (outerR - innerR) * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, ((outerR + innerR) / 2) * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#6b7a99";
      for (const b of buildings) {
        ctx.fillRect(cx + b.x * scale - (b.w * scale) / 2, cy + b.z * scale - (b.d * scale) / 2, b.w * scale, b.d * scale);
      }
      const px = cx + carGroup.position.x * scale;
      const py = cy + carGroup.position.z * scale;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-carGroup.rotation.y);
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
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [spec]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 p-6">
        <div className="flex items-start justify-between">
          <button
            onClick={onExit}
            className="pointer-events-auto rounded-lg border bg-card/80 px-4 py-2 font-mono text-xs uppercase tracking-widest backdrop-blur-md hover:border-primary"
          >
            ← Garage
          </button>

          <div className="flex items-start gap-3">
            <div className="rounded-2xl border bg-card/80 p-2 backdrop-blur-md" style={{ boxShadow: "var(--hud-glow)" }}>
              <canvas ref={minimapRef} className="block rounded-xl" style={{ width: 180, height: 180 }} />
              <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Map</p>
            </div>
            <div className="rounded-lg border bg-card/80 px-4 py-2 text-right backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Vehicle</p>
              <p className="font-bold" style={{ color: spec.appearance.primaryColor }}>{spec.name}</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 flex items-end gap-6">
          <div className="rounded-2xl border bg-card/80 px-6 py-4 backdrop-blur-md" style={{ boxShadow: "var(--hud-glow)" }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">km/h</p>
            <p className="font-mono text-5xl font-bold tabular-nums" style={{ color: spec.appearance.primaryColor }}>{String(speed).padStart(3, "0")}</p>
          </div>
          <div className="rounded-2xl border bg-card/80 px-5 py-4 backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Gear</p>
            <p className="font-mono text-3xl font-bold">{gear}</p>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 rounded-lg border bg-card/80 px-4 py-3 font-mono text-[11px] backdrop-blur-md">
          <p className="text-muted-foreground">CONTROLS</p>
          <p className="mt-1">W / ↑ — Gas</p>
          <p>S / ↓ — Rückwärts</p>
          <p>A D / ← → — Lenken</p>
          <p>SPACE — Bremse</p>
        </div>
      </div>
    </div>
  );
}
