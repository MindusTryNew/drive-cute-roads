import * as THREE from "three";
import type { WorldRefs } from "./world";

// 120 s = 1 full day. t in [0, 1) where 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset.
export const CYCLE_SECONDS = 120;

export function dayPhase(elapsed: number): number {
  return ((elapsed / CYCLE_SECONDS) % 1 + 1) % 1;
}

export function formatTime(t: number): string {
  const totalMin = Math.floor(t * 24 * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type Stop = {
  t: number;
  bg: number;
  fog: number;
  sun: number;       // sun color
  sunI: number;      // intensity
  hemiSky: number;
  hemiGround: number;
  hemiI: number;
};

const STOPS: Stop[] = [
  // midnight
  { t: 0.0,  bg: 0x05060d, fog: 0x05060d, sun: 0x6b7a99, sunI: 0.05, hemiSky: 0x111833, hemiGround: 0x05060d, hemiI: 0.3 },
  // pre-dawn
  { t: 0.20, bg: 0x14182a, fog: 0x14182a, sun: 0x6b7a99, sunI: 0.1,  hemiSky: 0x223055, hemiGround: 0x0a0e1a, hemiI: 0.45 },
  // sunrise
  { t: 0.27, bg: 0xf2a172, fog: 0xc88a6b, sun: 0xffb070, sunI: 0.9,  hemiSky: 0xffc899, hemiGround: 0x4a3a2a, hemiI: 0.7 },
  // morning
  { t: 0.35, bg: 0x9ec5e6, fog: 0xa8c8e0, sun: 0xfff1d6, sunI: 1.1,  hemiSky: 0x8899ff, hemiGround: 0x556677, hemiI: 0.7 },
  // noon
  { t: 0.5,  bg: 0x6fa3d6, fog: 0x9fc0e0, sun: 0xffffff, sunI: 1.3,  hemiSky: 0x88aaff, hemiGround: 0x556677, hemiI: 0.75 },
  // afternoon
  { t: 0.65, bg: 0x8ab0d0, fog: 0xa8c0d6, sun: 0xfff1d6, sunI: 1.15, hemiSky: 0x88aaff, hemiGround: 0x556677, hemiI: 0.7 },
  // sunset
  { t: 0.75, bg: 0xe28253, fog: 0xb86a4a, sun: 0xff8050, sunI: 0.9,  hemiSky: 0xff9966, hemiGround: 0x3a2a1a, hemiI: 0.6 },
  // dusk
  { t: 0.82, bg: 0x2a2848, fog: 0x1f2338, sun: 0x556699, sunI: 0.2,  hemiSky: 0x334466, hemiGround: 0x0a0e1a, hemiI: 0.4 },
  // night
  { t: 0.9,  bg: 0x0a0e1d, fog: 0x0a0e1d, sun: 0x6b7a99, sunI: 0.08, hemiSky: 0x1a2244, hemiGround: 0x05060d, hemiI: 0.35 },
  { t: 1.0,  bg: 0x05060d, fog: 0x05060d, sun: 0x6b7a99, sunI: 0.05, hemiSky: 0x111833, hemiGround: 0x05060d, hemiI: 0.3 },
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(lerp(ar, br, t)) << 16) | (Math.round(lerp(ag, bg, t)) << 8) | Math.round(lerp(ab, bb, t));
}

function sample(t: number): Stop {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i], b = STOPS[i + 1];
    if (t >= a.t && t <= b.t) {
      const k = (t - a.t) / (b.t - a.t || 1);
      return {
        t,
        bg: lerpColor(a.bg, b.bg, k),
        fog: lerpColor(a.fog, b.fog, k),
        sun: lerpColor(a.sun, b.sun, k),
        sunI: lerp(a.sunI, b.sunI, k),
        hemiSky: lerpColor(a.hemiSky, b.hemiSky, k),
        hemiGround: lerpColor(a.hemiGround, b.hemiGround, k),
        hemiI: lerp(a.hemiI, b.hemiI, k),
      };
    }
  }
  return STOPS[0];
}

export function applyDayNight(scene: THREE.Scene, w: WorldRefs, elapsed: number) {
  const t = dayPhase(elapsed);
  const s = sample(t);
  (scene.background as THREE.Color).setHex(s.bg);
  w.fog.color.setHex(s.fog);
  w.sun.color.setHex(s.sun);
  w.sun.intensity = s.sunI;
  // Sun position arc
  const angle = (t - 0.25) * Math.PI * 2; // 0.25 sunrise → angle 0
  const rad = 200;
  w.sun.position.set(Math.cos(angle) * rad, Math.max(10, Math.sin(angle) * 180), 40);
  w.hemi.color.setHex(s.hemiSky);
  w.hemi.groundColor.setHex(s.hemiGround);
  w.hemi.intensity = s.hemiI;

  // Street lights on at night
  const nightI = t < 0.27 || t > 0.78 ? 2.5 : 0;
  for (const l of w.streetLights) l.intensity = nightI;
  return { phase: t };
}
