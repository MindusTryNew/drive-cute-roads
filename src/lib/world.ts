import * as THREE from "three";

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

const WORLD_SIZE = 800;

// Deterministic hill height for offroad zone (NE quadrant: x>80, z<-80)
function hill(x: number, z: number): number {
  if (x < 60 || z > -60) return 0;
  // distance fade
  const dx = (x - 60) / 200;
  const dz = (-z - 60) / 200;
  const fade = Math.min(1, Math.min(dx, dz));
  const h =
    Math.sin(x * 0.08) * 2 +
    Math.cos(z * 0.06) * 2.2 +
    Math.sin((x + z) * 0.04) * 3 +
    Math.cos((x - z) * 0.05) * 1.6;
  return Math.max(0, h * fade);
}

export function buildWorld(scene: THREE.Scene): WorldRefs {
  scene.background = new THREE.Color("#0d1220");
  const fog = new THREE.Fog("#0d1220", 200, 500);
  scene.fog = fog;

  const hemi = new THREE.HemisphereLight(0x8899ff, 0x222233, 0.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.1);
  sun.position.set(60, 80, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = 250;
  sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
  sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
  sun.shadow.camera.far = 500;
  scene.add(sun);
  scene.add(sun.target);

  // Ground — segmented plane with hill displacement in NE quadrant
  const groundGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 120, 120);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i); // plane local Y == world Z after rotation
    const h = hill(x, -y);
    pos.setZ(i, h);
  }
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Race track ring
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

  // Road grid
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x1f2330, roughness: 0.85 });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf6d96a });
  const roadW = 8;
  const roadsX = [-300, -180, -90, 90, 180, 300]; // vertical roads at these X
  const roadsZ = [-300, -180, -90, 90, 180, 300]; // horizontal roads at these Z
  const reach = WORLD_SIZE / 2 - 20;

  for (const z of roadsZ) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(reach * 2, roadW), roadMat);
    r.rotation.x = -Math.PI / 2;
    r.position.set(0, 0.06, z);
    r.receiveShadow = true;
    scene.add(r);
    // dashes
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

  // Intersections (zebra crossings)
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

  // Buildings — placed in city blocks (avoiding roads + center track + offroad zone)
  const bldMat = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
  const colors = [0x3a4a6b, 0x5b6d8f, 0x2f3a52, 0x6b5b8f, 0x8f5b6d, 0x4a6b5b, 0x6b6b3a];
  const buildings: Building[] = [];
  const rng = mulberry32(1337);

  for (let i = 0; i < 120; i++) {
    const x = (rng() - 0.5) * (WORLD_SIZE - 60);
    const z = (rng() - 0.5) * (WORLD_SIZE - 60);
    // Skip if inside offroad zone
    if (x > 60 && z < -60) continue;
    // Skip if inside race track ring
    if (Math.sqrt(x * x + z * z) < outerR + 6) continue;
    // Skip if on a road
    if (roadsX.some((rx) => Math.abs(x - rx) < roadW)) continue;
    if (roadsZ.some((rz) => Math.abs(z - rz) < roadW)) continue;

    const h = 6 + rng() * 30;
    const w = 6 + rng() * 10;
    const d = 6 + rng() * 10;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bldMat(colors[i % colors.length]));
    b.position.set(x, h / 2, z);
    b.castShadow = true; b.receiveShadow = true;
    scene.add(b);
    buildings.push({ x, z, w, d });
  }

  // Trees in offroad zone
  for (let i = 0; i < 80; i++) {
    const x = 80 + rng() * 280;
    const z = -80 - rng() * 280;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x5a3a2a }),
    );
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d6b3d }),
    );
    leaves.position.y = 3.5;
    const tree = new THREE.Group();
    tree.add(trunk); tree.add(leaves);
    const y = hill(x, z);
    tree.position.set(x, y + 1.2, z);
    tree.castShadow = true;
    scene.add(tree);
  }

  // Street lights along main roads
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
  for (const z of roadsZ) {
    for (let x = -reach; x <= reach; x += 60) addLamp(x, z + roadW / 2 + 1);
  }
  for (const x of roadsX) {
    for (let z = -reach; z <= reach; z += 60) addLamp(x + roadW / 2 + 1, z);
  }

  return {
    buildings,
    streetLights,
    groundHeightAt: (x, z) => hill(x, z),
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
