import * as THREE from "three";
import { REGIONS } from "./regions";

export type Building = { x: number; z: number; w: number; d: number };
export type WorldRefs = {
  buildings: Building[];
  streetLights: THREE.PointLight[];
  groundHeightAt: (x: number, z: number) => number;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  ground: THREE.Mesh;
  fog: THREE.Fog;
  WORLD_SIZE: number;
  outerR: number;
  innerR: number;
  roadsZ: number[];
  roadsX: number[];
};

const WORLD_SIZE = 1800; // 5x größer als vorher (800²=640k → 1800²=3.24M ≈ 5x)

// Region-basierte Höhenfunktion. Jede Region hat eine eigene Signatur.
function heightAt(x: number, z: number): number {
  // Offroad (NE): x>300, z<-300 — bestehende Hügel (skaliert)
  if (x > 300 && z < -300) {
    const dx = (x - 300) / 300;
    const dz = (-z - 300) / 300;
    const fade = Math.min(1, Math.min(dx, dz), Math.min((900 - x) / 100, (900 + z) / 100));
    const h = Math.sin(x * 0.06) * 3 + Math.cos(z * 0.05) * 3.2 + Math.sin((x + z) * 0.03) * 4;
    return Math.max(0, h * Math.max(0, fade));
  }
  // Hügelland (NW): x<-300, z<-300 — sanfte grosse Wellen
  if (x < -300 && z < -300) {
    const fade = Math.min(1, Math.min((x + 900) / 100, (-z - 300) / 100, (-300 - x) / 100, (900 + z) / 100));
    const h = Math.sin(x * 0.02) * 8 + Math.cos(z * 0.025) * 7 + Math.sin((x - z) * 0.015) * 5;
    return Math.max(0, h * Math.max(0, fade));
  }
  // Täler (SW): x<-300, z>300 — tiefe Senken (negativ, aber ground bleibt bei 0 -> nur Hügelränder)
  if (x < -300 && z > 300) {
    const fade = Math.min(1, Math.min((x + 900) / 100, (z - 300) / 100, (-300 - x) / 100, (900 - z) / 100));
    // Rand-Hügel (Bergkämme)
    const dEdge = Math.min(Math.abs(x + 600), Math.abs(z - 600));
    const ridge = Math.max(0, 8 - dEdge * 0.03) * fade;
    return ridge;
  }
  // Stunt-Park (SE): x>300, z>300 — flach mit Erhebungen unter den Rampen (später als Props)
  if (x > 300 && z > 300) return 0;
  // Strand (S): |x|<300, z>300 — sanfte Dünen
  if (Math.abs(x) <= 300 && z > 300) {
    const fade = Math.min(1, (z - 300) / 100, (900 - z) / 100);
    return Math.max(0, Math.sin(x * 0.04) * 1.2 * fade + Math.cos(z * 0.03) * 0.8 * fade);
  }
  return 0;
}

export type WorldOptions = { buildingCount?: number; shadows?: boolean; fogNear?: number; fogFar?: number; streetLights?: boolean; shadowMapSize?: number };

export function buildWorld(scene: THREE.Scene, opts: WorldOptions = {}): WorldRefs {
  const buildingCount = opts.buildingCount ?? 200;
  const shadows = opts.shadows ?? true;
  const fogNear = opts.fogNear ?? 300;
  const fogFar = opts.fogFar ?? 900;
  const enableStreetLights = opts.streetLights ?? true;
  const shadowMapSize = opts.shadowMapSize ?? 2048;

  scene.background = new THREE.Color("#0d1220");
  const fog = new THREE.Fog("#0d1220", fogNear, fogFar);
  scene.fog = fog;

  const hemi = new THREE.HemisphereLight(0x8899ff, 0x222233, 0.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.1);
  sun.position.set(60, 80, 40);
  sun.castShadow = shadows;
  sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  const s = 400;
  sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
  sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
  sun.shadow.camera.far = 1000;
  scene.add(sun);
  scene.add(sun.target);

  // Ground — segmented plane mit region-basiertem Displacement
  const groundGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 200, 200);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, heightAt(x, -y));
  }
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = shadows;
  scene.add(ground);

  // Region-Farbmarker (transparente Overlays)
  for (const r of REGIONS) {
    if (r.id === "stadt") continue;
    const w = r.bounds.maxX - r.bounds.minX;
    const d = r.bounds.maxZ - r.bounds.minZ;
    const cx = (r.bounds.maxX + r.bounds.minX) / 2;
    const cz = (r.bounds.maxZ + r.bounds.minZ) / 2;
    const mat = new THREE.MeshBasicMaterial({
      color: r.color,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
    });
    const tint = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    tint.rotation.x = -Math.PI / 2;
    tint.position.set(cx, 0.15, cz);
    scene.add(tint);
  }

  // Rennstrecke — Ring in Stadt-Zentrum
  const outerR = 60, innerR = 45;
  const trackShape = new THREE.Shape();
  trackShape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
  trackShape.holes.push(hole);
  const track = new THREE.Mesh(
    new THREE.ShapeGeometry(trackShape, 64),
    new THREE.MeshStandardMaterial({ color: 0x1a1d28, roughness: 0.7 }),
  );
  track.rotation.x = -Math.PI / 2;
  track.position.y = 0.05;
  track.receiveShadow = true;
  scene.add(track);

  // Straßen-Grid — deutlich mehr Straßen für die größere Welt
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x1f2330, roughness: 0.85 });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf6d96a });
  const roadW = 8;
  const roadsX = [-750, -600, -450, -300, -180, -90, 90, 180, 300, 450, 600, 750];
  const roadsZ = [-750, -600, -450, -300, -180, -90, 90, 180, 300, 450, 600, 750];
  const reach = WORLD_SIZE / 2 - 20;

  for (const z of roadsZ) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(reach * 2, roadW), roadMat);
    r.rotation.x = -Math.PI / 2;
    r.position.set(0, 0.06, z);
    r.receiveShadow = true;
    scene.add(r);
    for (let x = -reach; x <= reach; x += 12) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.3), lineMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(x, 0.07, z);
      scene.add(d);
    }
  }
  for (const x of roadsX) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(roadW, reach * 2), roadMat);
    r.rotation.x = -Math.PI / 2;
    r.position.set(x, 0.06, 0);
    r.receiveShadow = true;
    scene.add(r);
    for (let z = -reach; z <= reach; z += 12) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 4), lineMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(x, 0.07, z);
      scene.add(d);
    }
  }

  // Kreuzungen
  for (const x of roadsX) {
    for (const z of roadsZ) {
      const sq = new THREE.Mesh(
        new THREE.PlaneGeometry(roadW + 2, roadW + 2),
        new THREE.MeshStandardMaterial({ color: 0x252a38, roughness: 0.8 }),
      );
      sq.rotation.x = -Math.PI / 2;
      sq.position.set(x, 0.08, z);
      scene.add(sq);
    }
  }

  // Stadt-Gebäude (nur innerhalb Stadt-Bounds)
  const bldMat = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
  const colors = [0x3a4a6b, 0x5b6d8f, 0x2f3a52, 0x6b5b8f, 0x8f5b6d, 0x4a6b5b, 0x6b6b3a];
  const buildings: Building[] = [];
  const rng = mulberry32(1337);

  let attempts = 0;
  while (buildings.length < buildingCount && attempts < buildingCount * 6) {
    attempts++;
    const x = (rng() - 0.5) * 560;
    const z = (rng() - 0.5) * 560;
    if (Math.sqrt(x * x + z * z) < outerR + 6) continue;
    if (roadsX.some((rx) => Math.abs(x - rx) < roadW)) continue;
    if (roadsZ.some((rz) => Math.abs(z - rz) < roadW)) continue;

    const h = 6 + rng() * 40;
    const w = 6 + rng() * 12;
    const d = 6 + rng() * 12;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bldMat(colors[buildings.length % colors.length]));
    b.position.set(x, h / 2, z);
    b.castShadow = shadows; b.receiveShadow = shadows;
    scene.add(b);
    buildings.push({ x, z, w, d });
  }

  // ---- Offroad-Region: viele Bäume + Felsen ----
  for (let i = 0; i < 200; i++) {
    const x = 320 + rng() * 560;
    const z = -880 + rng() * 560;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2.5), new THREE.MeshStandardMaterial({ color: 0x5a3a2a }));
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.5, 6, 8), new THREE.MeshStandardMaterial({ color: 0x3d6b3d }));
    leaves.position.y = 3.5;
    const tree = new THREE.Group();
    tree.add(trunk); tree.add(leaves);
    const y = heightAt(x, z);
    tree.position.set(x, y + 1.2, z);
    tree.castShadow = shadows;
    scene.add(tree);
  }
  for (let i = 0; i < 40; i++) {
    const x = 320 + rng() * 560;
    const z = -880 + rng() * 560;
    const rockSize = 1.5 + rng() * 3;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rockSize, 0),
      new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.9 }),
    );
    const y = heightAt(x, z);
    rock.position.set(x, y + rockSize * 0.4, z);
    rock.castShadow = shadows;
    scene.add(rock);
    buildings.push({ x, z, w: rockSize * 2, d: rockSize * 2 });
  }

  // ---- Hügelland: Serpentinen-Pfad + Steinsäulen ----
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 0.9 });
  for (let i = 0; i < 40; i++) {
    const t = i / 40;
    const x = -600 + Math.sin(t * Math.PI * 3) * 200;
    const z = -880 + t * 560;
    const seg = new THREE.Mesh(new THREE.PlaneGeometry(6, 20), pathMat);
    seg.rotation.x = -Math.PI / 2;
    seg.position.set(x, heightAt(x, z) + 0.05, z);
    scene.add(seg);
  }
  for (let i = 0; i < 30; i++) {
    const x = -880 + rng() * 560;
    const z = -880 + rng() * 560;
    const h = 4 + rng() * 6;
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.6, h),
      new THREE.MeshStandardMaterial({ color: 0x7a6f5c, roughness: 0.85 }),
    );
    pillar.position.set(x, heightAt(x, z) + h / 2, z);
    pillar.castShadow = shadows;
    scene.add(pillar);
    buildings.push({ x, z, w: 3, d: 3 });
  }

  // ---- Täler: Fluss + Brücken ----
  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.8,
  });
  const river = new THREE.Mesh(new THREE.PlaneGeometry(500, 30), riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.set(-600, 0.1, 600);
  scene.add(river);
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7 });
  for (const bx of [-700, -600, -500]) {
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 40), bridgeMat);
    bridge.position.set(bx, 0.7, 600);
    bridge.castShadow = shadows; bridge.receiveShadow = shadows;
    scene.add(bridge);
  }

  // ---- Stunt-Park: Rampen, Loops, Boxen ----
  const rampMat = new THREE.MeshStandardMaterial({ color: 0xf6d96a, roughness: 0.5 });
  for (let i = 0; i < 15; i++) {
    const x = 320 + rng() * 560;
    const z = 320 + rng() * 560;
    const len = 20 + rng() * 20;
    const ang = 15 + rng() * 25;
    const rad = (ang * Math.PI) / 180;
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, 8), rampMat);
    ramp.rotation.set(0, rng() * Math.PI * 2, -rad);
    ramp.position.set(x, (len / 2) * Math.sin(rad), z);
    ramp.castShadow = shadows; ramp.receiveShadow = shadows;
    scene.add(ramp);
  }
  // Loops
  const loopMat = new THREE.MeshStandardMaterial({ color: 0xff6ec7, roughness: 0.4, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const x = 400 + i * 180;
    const z = 400 + rng() * 200;
    const loop = new THREE.Mesh(new THREE.TorusGeometry(12, 2, 12, 32), loopMat);
    loop.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    loop.position.set(x, 12, z);
    loop.castShadow = shadows;
    scene.add(loop);
  }
  // Halfpipes (offene Halbzylinder)
  const hpMat = new THREE.MeshStandardMaterial({ color: 0x5b8def, roughness: 0.5, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const x = 500 + rng() * 300;
    const z = 500 + rng() * 300;
    const hp = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 25, 24, 1, true, 0, Math.PI),
      hpMat,
    );
    hp.rotation.set(Math.PI / 2, 0, 0);
    hp.position.set(x, 4, z);
    scene.add(hp);
  }

  // ---- Strand: Palmen + Meer am Rand ----
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({ color: 0xf6d996, roughness: 0.9 }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, 0.12, 600);
  scene.add(sand);
  // Meer (jenseits des Strandes)
  const seaMat = new THREE.MeshStandardMaterial({
    color: 0x0e7490, roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.85,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 100), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, 0.14, 950);
  scene.add(sea);
  for (let i = 0; i < 30; i++) {
    const x = -280 + rng() * 560;
    const z = 320 + rng() * 500;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 5),
      new THREE.MeshStandardMaterial({ color: 0x6a4a2a }),
    );
    trunk.position.y = 2.5;
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x4d9a4d, roughness: 0.8 }),
    );
    leaves.position.y = 5.5;
    leaves.scale.set(1.3, 0.6, 1.3);
    const palm = new THREE.Group();
    palm.add(trunk); palm.add(leaves);
    palm.position.set(x, heightAt(x, z), z);
    palm.castShadow = shadows;
    scene.add(palm);
  }

  // ---- Straßenlaternen entlang der Hauptstraßen ----
  const streetLights: THREE.PointLight[] = [];
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x222a38, roughness: 0.8 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  const addLamp = (x: number, z: number) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 5), lampMat);
    pole.position.set(x, 2.5, z);
    scene.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), bulbMat);
    bulb.position.set(x, 5, z);
    scene.add(bulb);
    const light = new THREE.PointLight(0xffe9a8, 0, 30, 2);
    light.position.set(x, 5, z);
    scene.add(light);
    streetLights.push(light);
  };
  if (enableStreetLights) {
    // Nur innerhalb Stadt-Grid (performance)
    for (const z of roadsZ.filter((z) => Math.abs(z) <= 300)) {
      for (let x = -300; x <= 300; x += 60) addLamp(x, z + roadW / 2 + 1);
    }
    for (const x of roadsX.filter((x) => Math.abs(x) <= 300)) {
      for (let z = -300; z <= 300; z += 60) addLamp(x + roadW / 2 + 1, z);
    }
  }

  return {
    buildings,
    streetLights,
    groundHeightAt: (x, z) => heightAt(x, z),
    sun,
    hemi,
    ground,
    fog,
    WORLD_SIZE,
    outerR,
    innerR,
    roadsZ,
    roadsX,
  };
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
