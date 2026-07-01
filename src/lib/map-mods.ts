// Runtime-Injection installierter Map-Mods in die Three.js-Szene.
import * as THREE from "three";
import { getInstalledMapMods, type MapObject } from "./mods";
import type { WorldRefs, Building } from "./world";

/** Mountet aktivierte Map-Mods in die Szene. Fügt Kollisions-Boxen zu
 *  `world.buildings` hinzu, damit das Auto damit interagiert. */
export function mountMapMods(scene: THREE.Scene, world: WorldRefs, shadows: boolean): number {
  const mods = getInstalledMapMods().filter((m) => m.enabled);
  let count = 0;
  for (const mod of mods) {
    for (const obj of mod.objects) {
      spawnObject(scene, world, obj, shadows);
      count++;
    }
  }
  return count;
}

function spawnObject(scene: THREE.Scene, world: WorldRefs, o: MapObject, shadows: boolean) {
  switch (o.type) {
    case "building": {
      const mat = new THREE.MeshStandardMaterial({ color: o.color, roughness: 0.6 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(o.w, o.h, o.d), mat);
      mesh.position.set(o.x, o.h / 2, o.z);
      mesh.castShadow = shadows; mesh.receiveShadow = shadows;
      scene.add(mesh);
      const b: Building = { x: o.x, z: o.z, w: o.w, d: o.d };
      world.buildings.push(b);
      break;
    }
    case "ramp": {
      const mat = new THREE.MeshStandardMaterial({ color: o.color, roughness: 0.5 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(o.length, 0.4, o.width), mat);
      const rad = (o.angleDeg * Math.PI) / 180;
      mesh.rotation.set(0, (o.rotationDeg * Math.PI) / 180, -rad);
      const centerY = (o.length / 2) * Math.sin(rad);
      mesh.position.set(o.x, centerY, o.z);
      mesh.castShadow = shadows; mesh.receiveShadow = shadows;
      scene.add(mesh);
      break;
    }
    case "checkpoint": {
      const mat = new THREE.MeshBasicMaterial({ color: o.color, transparent: true, opacity: 0.35 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(o.radius, 0.3, 12, 40), mat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(o.x, 1, o.z);
      scene.add(ring);
      break;
    }
    case "prop": {
      const mat = new THREE.MeshStandardMaterial({ color: o.color, roughness: 0.7 });
      let geo: THREE.BufferGeometry;
      if (o.shape === "sphere") geo = new THREE.SphereGeometry(o.size, 16, 12);
      else if (o.shape === "cone") geo = new THREE.ConeGeometry(o.size, o.size * 2, 16);
      else if (o.shape === "cylinder") geo = new THREE.CylinderGeometry(o.size, o.size, o.size * 2, 16);
      else geo = new THREE.BoxGeometry(o.size, o.size, o.size);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(o.x, o.size, o.z);
      mesh.castShadow = shadows; mesh.receiveShadow = shadows;
      scene.add(mesh);
      break;
    }
  }
}
