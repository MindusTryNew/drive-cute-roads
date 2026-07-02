import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { toast } from "sonner";
import type { CarSpec } from "@/lib/car-spec";
import { physicsFromTuning, shiftSpeeds } from "@/lib/car-spec";
import { buildCarGroup, getWheels } from "@/lib/car-renderer";
import { getPart } from "@/lib/parts-store";
import { buildWorld, type WorldRefs } from "@/lib/world";
import { applyDayNight, formatTime, dayPhase } from "@/lib/day-night";
import { joinRoom, type Pose, type RoomHandle } from "@/lib/multiplayer";
import { getQualitySetting, resolvePreset } from "@/lib/perf";
import {
  getActiveMission,
  getActiveMissionId,
  setActiveMissionId,
  completeMission,
  addDriveSec,
  getRotationSeed,
  MISSIONS,
  type Mission,
} from "@/lib/missions";
import { mountMapMods } from "@/lib/map-mods";
import { isDevMode, subscribeDevMode } from "@/lib/devmode";
import { getDest, setDest, subscribeDest } from "@/lib/navigation";
import { QualitySettings } from "@/components/QualitySettings";
import { MissionsPanel } from "@/components/MissionsPanel";

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
  const [nextShift, setNextShift] = useState<number | null>(null);
  const [clockText, setClockText] = useState("12:00");
  const [playerCount, setPlayerCount] = useState(1);
  const [fps, setFps] = useState(60);
  const [showSettings, setShowSettings] = useState(false);
  const [missionState, setMissionState] = useState<{ mission: Mission; progress: number; status: string } | null>(null);
  const [rotationToast, setRotationToast] = useState<string | null>(null);
  const [headingUp, setHeadingUp] = useState(true);
  const [mapZoom, setMapZoom] = useState(1); // 0.5, 1, 2

  useEffect(() => {
    const mount = mountRef.current!;
    const { preset } = resolvePreset(getQualitySetting());
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const camera2 = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = preset.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.autoClear = false;
    mount.appendChild(renderer.domElement);

    const world: WorldRefs = buildWorld(scene, {
      buildingCount: preset.buildings,
      shadows: preset.shadows,
      fogNear: preset.fogNear,
      fogFar: preset.fogFar,
      streetLights: preset.streetLights,
      shadowMapSize: preset.shadowMapSize,
    });

    // Map-Mods (installiert) in die Szene mounten
    mountMapMods(scene, world, preset.shadows);

    const p1 = createPlayer(spec, scene, preset.shadows);
    p1.group.position.set(60, 0, 0);
    p1.group.rotation.y = Math.PI / 2;

    let p2: PlayerRefs | null = null;
    if (mode.kind === "split") {
      p2 = createPlayer(mode.spec2, scene, preset.shadows);
      p2.group.position.set(60, 0, 8);
      p2.group.rotation.y = Math.PI / 2;
    }

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
          r = { group: g, name: p.name, color: p.color, target: { x: p.x, z: p.z, ry: p.ry }, label };
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
          obj.traverse((m) => { if ((m as THREE.Mesh).isMesh) (m as THREE.Mesh).castShadow = preset.shadows; });
          p1.group.add(obj);
        }, () => {});
      })();
    }

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
    const shifts1 = shiftSpeeds(spec.tuning);

    // --- Rein visuelle Gang-Anzeige (keine Physik-Kopplung mehr) ---
    let visualGear = 1;

    // ---- Mission setup ----
    let activeMissionId: string | null = getActiveMissionId();
    let activeMission: Mission | null = getActiveMission();
    let speedAttempt: { running: boolean; t: number } = { running: false, t: 0 };
    let pickupMarker: THREE.Mesh | null = null;
    let dropMarker: THREE.Mesh | null = null;
    let pickupPos = new THREE.Vector3();
    let dropPos = new THREE.Vector3();
    let deliveryStage: "pickup" | "drop" = "pickup";
    let deliveryTimeLeft = 0;
    let timeProgress = 0;
    let lastRotationSeed = getRotationSeed();
    let devOn = isDevMode();
    const unDev = subscribeDevMode((v) => { devOn = v; });

    // Navigation-Beacon
    let navBeacon: THREE.Group | null = null;
    let navDest: { x: number; z: number } | null = getDest();
    const setBeacon = (d: { x: number; z: number } | null) => {
      navDest = d;
      if (navBeacon) { scene.remove(navBeacon); navBeacon = null; }
      if (d) {
        navBeacon = new THREE.Group();
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(3, 0.4, 8, 32),
          new THREE.MeshBasicMaterial({ color: 0x5b8def }),
        );
        ring.rotation.x = Math.PI / 2;
        navBeacon.add(ring);
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 40, 12, 1, true),
          new THREE.MeshBasicMaterial({ color: 0x5b8def, transparent: true, opacity: 0.3, side: THREE.DoubleSide }),
        );
        beam.position.y = 20;
        navBeacon.add(beam);
        navBeacon.position.set(d.x, 0, d.z);
        scene.add(navBeacon);
      }
    };
    setBeacon(navDest);
    const unNav = subscribeDest(setBeacon);

    const randInRing = (minR: number, maxR: number) => {
      for (let i = 0; i < 30; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r = minR + Math.random() * (maxR - minR);
        const x = Math.cos(ang) * r;
        const z = Math.sin(ang) * r;
        if (x > 60 && z < -60) continue;
        return new THREE.Vector3(x, 0.5, z);
      }
      return new THREE.Vector3(80, 0.5, 0);
    };

    const spawnDeliveryMarkers = (m: Mission) => {
      const dist = m.deliveryDistance ?? 80;
      pickupPos = randInRing(20, 100);
      const ang = Math.random() * Math.PI * 2;
      dropPos = pickupPos.clone().add(new THREE.Vector3(Math.cos(ang) * dist, 0, Math.sin(ang) * dist));
      const lim = world.WORLD_SIZE / 2 - 20;
      dropPos.x = Math.max(-lim, Math.min(lim, dropPos.x));
      dropPos.z = Math.max(-lim, Math.min(lim, dropPos.z));
      if (dropPos.x > 60 && dropPos.z < -60) { dropPos.x = -dropPos.x; }

      pickupMarker = makeMarker(0xf6d96a);
      pickupMarker.position.copy(pickupPos);
      scene.add(pickupMarker);
      dropMarker = makeMarker(0x4ade80);
      dropMarker.position.copy(dropPos);
      scene.add(dropMarker);
      deliveryStage = "pickup";
      deliveryTimeLeft = m.deliveryLimitSec ?? 60;
      setDest({ x: pickupPos.x, z: pickupPos.z });
    };

    if (activeMission?.type === "delivery") spawnDeliveryMarkers(activeMission);

    type Inputs = { steer: number; steerTarget: number; throttle: number; brake: number };
    const in1: Inputs = { steer: 0, steerTarget: 0, throttle: 0, brake: 0 };
    const in2: Inputs = { steer: 0, steerTarget: 0, throttle: 0, brake: 0 };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const clock = new THREE.Clock();
    let hudT = 0;
    let netT = 0;
    let fpsT = 0;
    let fpsCount = 0;
    let raf = 0;

    const netInterval = 1 / preset.netHz;
    const heartbeatLast = { t: 0 };

    const updatePlayer = (
      p: PlayerRefs,
      ctrls: Controls,
      phys: ReturnType<typeof physicsFromTuning>,
      bias: number,
      input: Inputs,
      dt: number,
    ) => {
      const fwd = ctrls.fwd.some((k) => keys[k]);
      const back = ctrls.back.some((k) => keys[k]);
      const left = ctrls.left.some((k) => keys[k]);
      const right = ctrls.right.some((k) => keys[k]);
      const brake = ctrls.brake.some((k) => keys[k]);

      // 2-stufiges Lenk-Lerp (Input → Target → Applied) für Analog-Gefühl
      const targetThrottle = fwd ? 1 : back ? -0.7 : 0;
      const targetSteerRaw = left ? 1 : right ? -1 : 0;
      const targetBrake = brake ? 1 : 0;

      // Throttle-Easing: exponentielle Kurve statt linear
      input.throttle = lerp(input.throttle, targetThrottle, Math.min(1, dt * 6));
      const throttleCurve = Math.sign(input.throttle) * Math.pow(Math.abs(input.throttle), 1.4);

      input.brake = lerp(input.brake, targetBrake, Math.min(1, dt * 14));
      input.steerTarget = lerp(input.steerTarget, targetSteerRaw, Math.min(1, dt * 6));
      input.steer = lerp(input.steer, input.steerTarget, Math.min(1, dt * 8));

      // Physik
      p.velocity += phys.accel * throttleCurve;
      p.velocity *= 1 - input.brake * 0.08;

      // Downforce: bei hoher Geschwindigkeit steigt die Reibung (bremst sanft)
      const speedRatio = Math.min(1, Math.abs(p.velocity) / Math.max(0.0001, phys.maxSpeed));
      const downforce = speedRatio > 0.6 ? 0.005 * (speedRatio - 0.6) : 0;
      p.velocity *= Math.min(0.9995, phys.friction + downforce);

      p.velocity = Math.max(-phys.maxSpeed * phys.reverseFactor, Math.min(phys.maxSpeed, p.velocity));

      // High-Speed-Lenk-Dämpfung: bei Vmax nur noch ~15 % Einschlag
      const turnDamp = 1 - Math.min(0.85, Math.pow(speedRatio, 1.4) * 0.9);
      const turn = phys.turnSpeed * (1 + bias * 0.5) * turnDamp;
      const dirSign = Math.sign(p.velocity || 1);
      const turning = Math.min(1, Math.abs(p.velocity) / 0.08);

      // Yaw-Änderung pro Frame deckeln (Rollstabilisation)
      const rawYaw = input.steer * turn * turning * dirSign;
      const maxYawPerFrame = 0.03;
      const yaw = Math.max(-maxYawPerFrame, Math.min(maxYawPerFrame, rawYaw));
      p.group.rotation.y += yaw;

      const nextX = p.group.position.x + Math.sin(p.group.rotation.y) * p.velocity;
      const nextZ = p.group.position.z + Math.cos(p.group.rotation.y) * p.velocity;

      let blocked = false;
      const carR = 1.5;
      for (const b of world.buildings) {
        if (Math.abs(nextX - b.x) < b.w / 2 + carR && Math.abs(nextZ - b.z) < b.d / 2 + carR) {
          blocked = true; break;
        }
      }
      const lim = world.WORLD_SIZE / 2 - 5;
      if (Math.abs(nextX) > lim || Math.abs(nextZ) > lim) blocked = true;

      if (blocked) p.velocity *= -0.3;
      else { p.group.position.x = nextX; p.group.position.z = nextZ; }

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
      const dt = Math.min(0.05, clock.getDelta());
      const elapsed = clock.elapsedTime;

      applyDayNight(scene, world, elapsed);
      const phase = dayPhase(elapsed);
      const night = phase < 0.27 || phase > 0.78 ? 1 : 0;
      p1.headlight.intensity = 1.5 + night * 4;
      if (p2) p2.headlight.intensity = 1.5 + night * 4;

      updatePlayer(p1, P1, phys1, bias1, in1, dt);
      if (p2) updatePlayer(p2, P2, phys2, bias2, in2, dt);

      for (const r of remotes.values()) {
        r.group.position.x += (r.target.x - r.group.position.x) * 0.2;
        r.group.position.z += (r.target.z - r.group.position.z) * 0.2;
        r.group.position.y = world.groundHeightAt(r.group.position.x, r.group.position.z);
        let dr = r.target.ry - r.group.rotation.y;
        while (dr > Math.PI) dr -= Math.PI * 2;
        while (dr < -Math.PI) dr += Math.PI * 2;
        r.group.rotation.y += dr * 0.2;
      }

      const kmh1 = Math.abs(p1.velocity) * 380;
      if (kmh1 > 1) addDriveSec(dt);

      // --- Rein visuelle Gang-Anzeige (keine Physik-Kappung mehr) ---
      // Nächster Gang = 1 + Anzahl bereits überschrittener Schwellen (ohne die letzte).
      let g = 1;
      for (let i = 0; i < shifts1.length - 1; i++) {
        if (kmh1 >= shifts1[i]) g = i + 2;
      }
      visualGear = g;

      // --- Missions-Rotation-Check ---
      const seed = getRotationSeed();
      if (seed !== lastRotationSeed) {
        lastRotationSeed = seed;
        setRotationToast("🎯 3 neue Missionen verfügbar!");
        setTimeout(() => setRotationToast(null), 4000);
      }

      // Aktive Mission jeden Frame neu einlesen — reagiert auf Wechsel aus dem Missionen-Menü.
      const curId = getActiveMissionId();
      if (curId !== activeMissionId) {
        activeMissionId = curId;
        activeMission = curId ? (MISSIONS.find((m) => m.id === curId) ?? null) : null;
        speedAttempt = { running: false, t: 0 };
        timeProgress = 0;
        if (pickupMarker) { scene.remove(pickupMarker); pickupMarker = null; }
        if (dropMarker) { scene.remove(dropMarker); dropMarker = null; }
        if (activeMission?.type === "delivery") spawnDeliveryMarkers(activeMission);
      }

      if (activeMission) {
        if (activeMission.type === "speed") {
          const target = activeMission.targetSpeed ?? 100;
          const limit = activeMission.targetTimeSec ?? 10;
          if (!speedAttempt.running && in1.throttle > 0.5 && kmh1 < 5) {
            speedAttempt = { running: true, t: 0 };
          }
          if (speedAttempt.running) {
            speedAttempt.t += dt;
            if (kmh1 >= target && speedAttempt.t <= limit) {
              const reward = activeMission.reward;
              completeMission(activeMission.id);
              toast.success(`✅ ${activeMission.title} — +${reward} 🪙`);
              setMissionState({ mission: activeMission, progress: 1, status: `Geschafft in ${speedAttempt.t.toFixed(2)} s! · +${reward} 🪙` });
              activeMission = null; activeMissionId = null;
            } else if (speedAttempt.t > limit) {
              speedAttempt = { running: false, t: 0 };
            } else {
              setMissionState({
                mission: activeMission,
                progress: Math.min(1, kmh1 / target),
                status: `${kmh1.toFixed(0)} / ${target} km/h · ${(limit - speedAttempt.t).toFixed(1)} s übrig`,
              });
            }
          } else {
            setMissionState({
              mission: activeMission,
              progress: 0,
              status: `Stehen bleiben & Gas geben — Ziel ${target} km/h in ${limit} s`,
            });
          }
        } else if (activeMission.type === "time") {
          const need = activeMission.totalSeconds ?? 300;
          timeProgress += kmh1 > 1 ? dt : 0;
          if (timeProgress >= need) {
            const reward = activeMission.reward;
            completeMission(activeMission.id);
            toast.success(`✅ ${activeMission.title} — +${reward} 🪙`);
            setMissionState({ mission: activeMission, progress: 1, status: `Geschafft! · +${reward} 🪙` });
            activeMission = null; activeMissionId = null;
          } else {
            setMissionState({
              mission: activeMission,
              progress: timeProgress / need,
              status: `${Math.floor(timeProgress / 60)}m ${Math.floor(timeProgress % 60)}s / ${Math.floor(need / 60)}m`,
            });
          }
        } else if (activeMission.type === "delivery") {
          deliveryTimeLeft -= dt;
          const carPos = p1.group.position;
          const goal = deliveryStage === "pickup" ? pickupPos : dropPos;
          const dx = carPos.x - goal.x;
          const dz = carPos.z - goal.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (deliveryStage === "pickup" && dist < 4) {
            deliveryStage = "drop";
            if (pickupMarker) { scene.remove(pickupMarker); pickupMarker = null; }
            setDest({ x: dropPos.x, z: dropPos.z });
          } else if (deliveryStage === "drop" && dist < 4) {
            const reward = activeMission.reward;
            completeMission(activeMission.id);
            toast.success(`✅ ${activeMission.title} — +${reward} 🪙`);
            if (dropMarker) { scene.remove(dropMarker); dropMarker = null; }
            setMissionState({ mission: activeMission, progress: 1, status: `Lieferung abgeschlossen! · +${reward} 🪙` });
            activeMission = null; activeMissionId = null;
          } else if (deliveryTimeLeft <= 0) {
            if (pickupMarker) { scene.remove(pickupMarker); pickupMarker = null; }
            if (dropMarker) { scene.remove(dropMarker); dropMarker = null; }
            spawnDeliveryMarkers(activeMission);
            setMissionState({ mission: activeMission, progress: 0, status: "Zeit abgelaufen — neuer Versuch" });
          } else {
            setMissionState({
              mission: activeMission,
              progress: deliveryStage === "pickup" ? 0.25 : 0.65,
              status: `${deliveryStage === "pickup" ? "Zum gelben Paket" : "Zum grünen Drop"} · ${dist.toFixed(0)} m · ${deliveryTimeLeft.toFixed(0)} s`,
            });
          }
          if (pickupMarker) pickupMarker.position.y = 0.5 + Math.sin(elapsed * 4) * 0.3;
          if (dropMarker) dropMarker.position.y = 0.5 + Math.sin(elapsed * 4 + 1) * 0.3;
        }
      } else if (missionState !== null && elapsed - heartbeatLast.t > 4) {
        heartbeatLast.t = elapsed;
        setMissionState(null);
      }

      if (room) {
        netT += dt;
        if (netT > netInterval) {
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

      fpsCount++;
      fpsT += dt;
      if (fpsT > 1) { setFps(Math.round(fpsCount / fpsT)); fpsT = 0; fpsCount = 0; }

      hudT += dt;
      if (hudT > 0.08) {
        hudT = 0;
        setSpeed(Math.round(kmh1));
        if (p2) setSpeed2(Math.round(Math.abs(p2.velocity) * 380));
        const next = visualGear <= shifts1.length ? shifts1[visualGear - 1] : null;
        setNextShift(next);
        setGear(p1.velocity > 0.02 ? String(visualGear) : p1.velocity < -0.02 ? "R" : "N");
        setClockText(formatTime(phase));
      }

      // Nav-Beacon: sanft pulsieren + rotieren
      if (navBeacon) {
        navBeacon.rotation.y += dt * 1.2;
        navBeacon.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.08);
      }
      // DevMode: unbegrenzte Beschleunigung — verdoppelt Vmax-Cap
      if (devOn) {
        p1.velocity = Math.max(-2, Math.min(2, p1.velocity * 1.001));
      }

      drawMinimap();

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

    // --- Verbesserte Minimap: Kompass, Zoom, Heading-Up, Icons ---
    const mmCanvas = minimapRef.current;
    const mmCtx = mmCanvas?.getContext("2d") ?? null;
    const MM_SIZE = 200;
    if (mmCanvas) { mmCanvas.width = MM_SIZE; mmCanvas.height = MM_SIZE; }

    const drawMinimap = () => {
      if (!mmCtx) return;
      const ctx = mmCtx;
      const cx = MM_SIZE / 2, cy = MM_SIZE / 2;
      const scale = (MM_SIZE / world.WORLD_SIZE) * mapZoom;

      ctx.clearRect(0, 0, MM_SIZE, MM_SIZE);
      ctx.fillStyle = "#0d1220";
      ctx.beginPath(); ctx.arc(cx, cy, MM_SIZE / 2 - 2, 0, Math.PI * 2); ctx.fill();

      ctx.save();
      // Clip innerhalb Kreis
      ctx.beginPath(); ctx.arc(cx, cy, MM_SIZE / 2 - 4, 0, Math.PI * 2); ctx.clip();

      // Heading-up: rotiere Welt um Fahrer
      const rot = headingUp ? -p1.group.rotation.y : 0;
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.translate(-p1.group.position.x * scale, -p1.group.position.z * scale);

      // Offroad-Zone (Hügel) mit Konturen-Fill
      ctx.fillStyle = "#2d3520";
      ctx.fillRect(60 * scale, -400 * scale, 340 * scale, 340 * scale);
      // Höhenlinien
      ctx.strokeStyle = "rgba(120,160,90,0.25)";
      ctx.lineWidth = 0.5;
      for (let r = 20; r < 200; r += 30) {
        ctx.beginPath();
        ctx.arc(200 * scale, -200 * scale, r * scale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Straßen — dickere Hauptstraßen
      ctx.strokeStyle = "#3a4458";
      for (const z of world.roadsZ) {
        ctx.lineWidth = Math.abs(z) < 100 ? 3 : 1.8;
        ctx.beginPath();
        ctx.moveTo(-world.WORLD_SIZE * scale, z * scale);
        ctx.lineTo(world.WORLD_SIZE * scale, z * scale);
        ctx.stroke();
      }
      for (const x of world.roadsX) {
        ctx.lineWidth = Math.abs(x) < 100 ? 3 : 1.8;
        ctx.beginPath();
        ctx.moveTo(x * scale, -world.WORLD_SIZE * scale);
        ctx.lineTo(x * scale, world.WORLD_SIZE * scale);
        ctx.stroke();
      }
      // Kreuzungen
      ctx.fillStyle = "#4a5468";
      for (const x of world.roadsX) {
        for (const z of world.roadsZ) {
          ctx.fillRect(x * scale - 3, z * scale - 3, 6, 6);
        }
      }

      // Track-Ring
      ctx.strokeStyle = "#7a8498";
      ctx.lineWidth = (world.outerR - world.innerR) * scale;
      ctx.beginPath();
      ctx.arc(0, 0, ((world.outerR + world.innerR) / 2) * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Gebäude
      ctx.fillStyle = "#6b7a99";
      for (const b of world.buildings) {
        ctx.fillRect(b.x * scale - (b.w * scale) / 2, b.z * scale - (b.d * scale) / 2, Math.max(1, b.w * scale), Math.max(1, b.d * scale));
      }

      // Missions-Marker mit Pin + Distanz
      const drawPin = (x: number, z: number, color: string, label?: string) => {
        ctx.save();
        // gegenrotieren damit Pin aufrecht bleibt
        ctx.translate(x * scale, z * scale);
        ctx.rotate(-rot);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, -4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-3, -2); ctx.lineTo(3, -2); ctx.lineTo(0, 4); ctx.closePath();
        ctx.fill();
        if (label) {
          ctx.fillStyle = "#fff";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(label, 0, -12);
        }
        ctx.restore();
      };

      const distTo = (v: THREE.Vector3) => {
        const dx = v.x - p1.group.position.x, dz = v.z - p1.group.position.z;
        return Math.round(Math.sqrt(dx * dx + dz * dz));
      };

      if (pickupMarker) drawPin(pickupPos.x, pickupPos.z, "#f6d96a", `${distTo(pickupPos)}m`);
      if (dropMarker) drawPin(dropPos.x, dropPos.z, "#4ade80", `${distTo(dropPos)}m`);

      // Remote Spieler-Dreiecke mit Farbe
      for (const r of remotes.values()) {
        ctx.save();
        ctx.translate(r.group.position.x * scale, r.group.position.z * scale);
        ctx.rotate(-r.group.rotation.y);
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(3.5, 4); ctx.lineTo(-3.5, 4); ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      if (p2) {
        ctx.save();
        ctx.translate(p2.group.position.x * scale, p2.group.position.z * scale);
        ctx.rotate(-p2.group.rotation.y);
        ctx.fillStyle = mode.kind === "split" ? mode.spec2.appearance.primaryColor : "#5b8def";
        ctx.beginPath();
        ctx.moveTo(0, -6); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Eigenes Dreieck (im Zentrum wenn heading-up, sonst world-space)
      ctx.save();
      ctx.translate(p1.group.position.x * scale, p1.group.position.z * scale);
      ctx.rotate(-p1.group.rotation.y);
      ctx.fillStyle = spec.appearance.primaryColor;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();

      ctx.restore(); // Ende Clip

      // Kompass-Ring mit Grad-Marken
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, MM_SIZE / 2 - 2, 0, Math.PI * 2); ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.strokeStyle = i === 0 ? "#f6d96a" : "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.moveTo(0, -(MM_SIZE / 2 - 2));
        ctx.lineTo(0, -(MM_SIZE / 2 - 6));
        ctx.stroke();
      }
      ctx.restore();

      // North-Indicator
      const northRot = headingUp ? -p1.group.rotation.y : 0;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(northRot);
      ctx.fillStyle = "#f6d96a";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("N", 0, -(MM_SIZE / 2 - 14));
      ctx.restore();
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("resize", onResize);
      room?.destroy();
      unDev();
      unNav();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, mode, headingUp, mapZoom]);

  const isSplit = mode.kind === "split";

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />
      {isSplit && (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/20" />
      )}

      <div className="pointer-events-none absolute inset-0 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              className="pointer-events-auto rounded-lg border bg-card/80 px-4 py-2 font-mono text-xs uppercase tracking-widest backdrop-blur-md hover:border-primary"
            >
              ← Garage
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="pointer-events-auto rounded-lg border bg-card/80 px-3 py-2 font-mono text-xs uppercase tracking-widest backdrop-blur-md hover:border-primary"
              title="Grafik / Performance"
            >
              ⚙ {fps} fps
            </button>
          </div>

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
              <canvas ref={minimapRef} className="block rounded-full" style={{ width: 200, height: 200 }} />
              <div className="mt-1 flex items-center justify-between gap-1 px-1">
                <button onClick={() => setHeadingUp((v) => !v)}
                  className="pointer-events-auto rounded border px-1.5 py-0.5 font-mono text-[9px] hover:border-primary">
                  {headingUp ? "HDG↑" : "N↑"}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => setMapZoom((z) => Math.max(0.5, z / 2))}
                    className="pointer-events-auto rounded border px-1.5 py-0.5 font-mono text-[9px] hover:border-primary">−</button>
                  <button onClick={() => setMapZoom((z) => Math.min(4, z * 2))}
                    className="pointer-events-auto rounded border px-1.5 py-0.5 font-mono text-[9px] hover:border-primary">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {missionState && (
          <MissionsPanel mission={missionState.mission} progress={missionState.progress} statusText={missionState.status} />
        )}

        {rotationToast && (
          <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-primary/60 bg-primary/20 px-5 py-2 font-mono text-sm backdrop-blur-md">
            {rotationToast}
          </div>
        )}

        <div className="absolute bottom-6 left-6 flex items-end gap-4">
          <div className="rounded-2xl border bg-card/80 px-6 py-4 backdrop-blur-md" style={{ boxShadow: "var(--hud-glow)" }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">P1 km/h</p>
            <p className="font-mono text-5xl font-bold tabular-nums" style={{ color: spec.appearance.primaryColor }}>{String(speed).padStart(3, "0")}</p>
          </div>
          <div className="rounded-2xl border bg-card/80 px-5 py-4 backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Gear</p>
            <p className="font-mono text-3xl font-bold">{gear}</p>
            {nextShift !== null && (
              <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">→ {nextShift} km/h</p>
            )}
          </div>
        </div>

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

      {showSettings && <QualitySettings fps={fps} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

type PlayerRefs = {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  headlight: THREE.SpotLight;
  velocity: number;
};

function createPlayer(spec: CarSpec, scene: THREE.Scene, shadows: boolean): PlayerRefs {
  const group = buildCarGroup(spec.appearance);
  if (shadows) {
    group.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) {
        (m as THREE.Mesh).castShadow = true;
        (m as THREE.Mesh).receiveShadow = true;
      }
    });
  }
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
  name: string;
  color: string;
  target: { x: number; z: number; ry: number };
  label: THREE.Sprite;
};

function makeMarker(color: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
  const m = new THREE.Mesh(geo, mat);
  return m;
}

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
