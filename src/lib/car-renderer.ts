import * as THREE from "three";
import type { Appearance } from "./garage";

// Builds a THREE.Group representing the car body + wheels for a given appearance.
// Used by both the live builder preview and the simulator.
export function buildCarGroup(a: Appearance): THREE.Group {
  const group = new THREE.Group();

  const primary = new THREE.Color(a.primaryColor);
  const secondary = new THREE.Color(a.secondaryColor);
  const wheelCol = new THREE.Color(a.wheelColor);

  // Body dimensions by type
  let bw = 2, bh = 0.7, bl = 4.2, cabinH = 0.6, cabinW = 1.8, cabinL = 2.2, cabinZ = -0.2;
  let ride = 0.45; // wheel radius
  switch (a.bodyType) {
    case "racer":
      bw = 2.1; bh = 0.55; bl = 4.4; cabinH = 0.5; cabinW = 1.7; cabinL = 1.8; ride = 0.42;
      break;
    case "suv":
      bw = 2.1; bh = 1.0; bl = 4.5; cabinH = 0.95; cabinW = 1.95; cabinL = 2.5; ride = 0.55;
      break;
    case "truck":
      bw = 2.3; bh = 1.1; bl = 5.4; cabinH = 1.2; cabinW = 2.1; cabinL = 1.8; cabinZ = 0.6; ride = 0.6;
      break;
    case "kompakt":
      bw = 1.8; bh = 0.8; bl = 3.6; cabinH = 0.8; cabinW = 1.65; cabinL = 1.9; ride = 0.4;
      break;
    case "roadster":
    default:
      break;
  }

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(bw, bh, bl),
    new THREE.MeshStandardMaterial({ color: primary, roughness: 0.4, metalness: 0.6 }),
  );
  body.position.y = ride + bh / 2;
  body.castShadow = true;
  group.add(body);

  // Lower skirt (secondary color)
  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(bw + 0.05, 0.2, bl - 0.2),
    new THREE.MeshStandardMaterial({ color: secondary, roughness: 0.7 }),
  );
  skirt.position.y = ride;
  group.add(skirt);

  // Cabin / glass — using glassTint to mix between secondary and dark
  const glassDark = new THREE.Color(0x0a0e1a).lerp(secondary, 1 - a.glassTint);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(cabinW, cabinH, cabinL),
    new THREE.MeshStandardMaterial({ color: glassDark, roughness: 0.2, metalness: 0.8 }),
  );
  cabin.position.set(0, ride + bh + cabinH / 2 + 0.05, cabinZ);
  cabin.castShadow = true;
  group.add(cabin);

  // Truck bed
  if (a.bodyType === "truck") {
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(bw - 0.1, 0.5, 2.4),
      new THREE.MeshStandardMaterial({ color: primary.clone().multiplyScalar(0.8), roughness: 0.6 }),
    );
    bed.position.set(0, ride + bh + 0.25, -1.3);
    group.add(bed);
  }

  // Spoiler
  if (a.spoiler) {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(bw + 0.2, 0.08, 0.4),
      new THREE.MeshStandardMaterial({ color: primary, roughness: 0.5 }),
    );
    wing.position.set(0, ride + bh + 0.4 + a.spoilerHeight * 0.6, -bl / 2 + 0.2);
    group.add(wing);
    const sl = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.3 + a.spoilerHeight * 0.5, 0.4),
      new THREE.MeshStandardMaterial({ color: secondary }),
    );
    sl.position.set(bw / 2 - 0.2, ride + bh + 0.2 + a.spoilerHeight * 0.3, -bl / 2 + 0.2);
    group.add(sl);
    const sr = sl.clone();
    sr.position.x = -sr.position.x;
    group.add(sr);
  }

  // Wheels — wheelSize 14..22 → radius 0.4..0.55
  const r = 0.35 + (a.wheelSize - 14) * 0.02;
  const wheelGeo = new THREE.CylinderGeometry(r, r, 0.35, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: wheelCol, roughness: 0.9 });
  const wp: [number, number, number][] = [
    [-bw / 2 + 0.1, r, bl / 2 - 1.0],
    [bw / 2 - 0.1, r, bl / 2 - 1.0],
    [-bw / 2 + 0.1, r, -bl / 2 + 1.0],
    [bw / 2 - 0.1, r, -bl / 2 + 1.0],
  ];
  for (const p of wp) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(...p);
    w.castShadow = true;
    w.userData.isWheel = true;
    group.add(w);
  }

  return group;
}

export function getWheels(group: THREE.Group): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  group.traverse((o) => { if (o.userData.isWheel) out.push(o as THREE.Mesh); });
  return out;
}
