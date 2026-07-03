// Missions-Katalog + Rotation. Alle 2 Minuten wechselt der aktive Pool.
import { addCoins } from "./coins";
import { addPack } from "./inventory";
import type { PackType } from "./collectibles";

export type MissionType = "speed" | "delivery" | "time";

export type Mission = {
  id: string;
  type: MissionType;
  title: string;
  desc: string;
  reward: number;
  packReward?: PackType;
  targetSpeed?: number;
  targetTimeSec?: number;
  totalSeconds?: number;
  deliveryDistance?: number;
  deliveryLimitSec?: number;
};

// Deutlich größerer Pool — die 2-Min-Rotation wählt zufällig 3 Aufgaben daraus.
export const MISSIONS: Mission[] = [
  // Speed-Varianten
  { id: "spd-80",  type: "speed", title: "Schneller Start",  desc: "Erreiche 80 km/h in unter 5 s.",   reward: 60,  targetSpeed: 80,  targetTimeSec: 5 },
  { id: "spd-100", type: "speed", title: "Standard-Sprint",  desc: "Erreiche 100 km/h in unter 6 s.",  reward: 80,  targetSpeed: 100, targetTimeSec: 6 },
  { id: "spd-150", type: "speed", title: "Landstraßen-Test", desc: "Erreiche 150 km/h in unter 8 s.",  reward: 120, targetSpeed: 150, targetTimeSec: 8 },
  { id: "spd-200", type: "speed", title: "Doppelter Sprint", desc: "Erreiche 200 km/h in unter 10 s.", reward: 150, packReward: "starter", targetSpeed: 200, targetTimeSec: 10 },
  { id: "spd-250", type: "speed", title: "Autobahn-Kick",    desc: "Erreiche 250 km/h in unter 14 s.", reward: 200, packReward: "starter", targetSpeed: 250, targetTimeSec: 14 },
  { id: "spd-300", type: "speed", title: "Top-Lauf",         desc: "Erreiche 300 km/h in unter 18 s.", reward: 250, packReward: "standard", targetSpeed: 300, targetTimeSec: 18 },
  { id: "spd-400", type: "speed", title: "Hypercar-Test",    desc: "Erreiche 400 km/h in unter 25 s.", reward: 400, packReward: "deluxe", targetSpeed: 400, targetTimeSec: 25 },
  { id: "spd-500", type: "speed", title: "Über die Schallmauer", desc: "Erreiche 500 km/h in unter 30 s.", reward: 600, packReward: "mythic", targetSpeed: 500, targetTimeSec: 30 },

  // Delivery-Varianten
  { id: "del-mini",  type: "delivery", title: "Blitz-Kurier",    desc: "Kurze Lieferung — hol das gelbe Paket ab und liefer es beim grünen Marker.", reward: 90,  deliveryDistance: 50,  deliveryLimitSec: 45 },
  { id: "del-short", type: "delivery", title: "Express-Paket",   desc: "Standard-Lieferung durch die Stadt.",     reward: 120, deliveryDistance: 80,  deliveryLimitSec: 60 },
  { id: "del-mid",   type: "delivery", title: "Mittelstrecke",   desc: "Etwas längere Route — Zeit im Blick behalten.", reward: 180, packReward: "starter", deliveryDistance: 140, deliveryLimitSec: 90 },
  { id: "del-long",  type: "delivery", title: "Quer über die Map", desc: "Lange Lieferung in 2 Minuten.",         reward: 250, packReward: "standard", deliveryDistance: 220, deliveryLimitSec: 120 },
  { id: "del-marathon", type: "delivery", title: "Fern-Fracht",  desc: "Extrem lange Strecke — plane deine Route.", reward: 400, packReward: "deluxe", deliveryDistance: 320, deliveryLimitSec: 180 },

  // Time-Driven
  { id: "tm-2",   type: "time", title: "Warmfahren",       desc: "Fahre insgesamt 2 Minuten.",  reward: 40,   totalSeconds: 2 * 60 },
  { id: "tm-5",   type: "time", title: "Aufwärmrunde",     desc: "Fahre insgesamt 5 Minuten.",  reward: 100,  totalSeconds: 5 * 60 },
  { id: "tm-15",  type: "time", title: "Viertelstunde",    desc: "Fahre insgesamt 15 Minuten.", reward: 220,  packReward: "starter", totalSeconds: 15 * 60 },
  { id: "tm-30",  type: "time", title: "Halbe Stunde Drift", desc: "Fahre insgesamt 30 Minuten.", reward: 400, packReward: "standard", totalSeconds: 30 * 60 },
  { id: "tm-60",  type: "time", title: "Eine Stunde",      desc: "Fahre insgesamt 1 Stunde.",   reward: 800,  packReward: "deluxe", totalSeconds: 60 * 60 },
  { id: "tm-120", type: "time", title: "Marathon",         desc: "Fahre insgesamt 2 Stunden.",  reward: 1500, packReward: "mythic", totalSeconds: 120 * 60 },
  { id: "tm-300", type: "time", title: "Ultra-Marathon",   desc: "Fahre insgesamt 5 Stunden.",  reward: 4000, packReward: "mythic", totalSeconds: 300 * 60 },
];

const ACTIVE_KEY = "garage:activeMission";
const DONE_KEY = "garage:doneMissions";
const TIME_TOTAL_KEY = "garage:totalDriveSec";

/* -------------- Rotation (alle 120 s neuer 3er-Pool) -------------- */
export const ROTATION_INTERVAL_SEC = 120;

function seededPick<T>(arr: T[], seed: number, count: number): T[] {
  // deterministischer Zufall (mulberry32) aus Seed
  let s = (seed + 1) >>> 0;
  const rng = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pool = [...arr];
  const out: T[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function getRotationSeed(now = Date.now()): number {
  return Math.floor(now / (ROTATION_INTERVAL_SEC * 1000));
}

export function getCurrentRotation(now = Date.now()): Mission[] {
  return seededPick(MISSIONS, getRotationSeed(now), 3);
}

/** Sekunden bis zur nächsten Rotation. */
export function secondsUntilNextRotation(now = Date.now()): number {
  const period = ROTATION_INTERVAL_SEC * 1000;
  return Math.ceil((period - (now % period)) / 1000);
}

/* -------------- Active / Done / Progress -------------- */

export function getActiveMissionId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}
export function setActiveMissionId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}
export function getActiveMission(): Mission | null {
  const id = getActiveMissionId();
  if (!id) return null;
  return MISSIONS.find((m) => m.id === id) ?? null;
}

export function getDone(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function isDone(id: string): boolean {
  return getDone().includes(id);
}
export function completeMission(id: string) {
  const done = getDone();
  if (done.includes(id)) return;
  done.push(id);
  localStorage.setItem(DONE_KEY, JSON.stringify(done));
  const m = MISSIONS.find((x) => x.id === id);
  if (m) {
    addCoins(m.reward);
    if (m.packReward) addPack(m.packReward);
  }
  if (getActiveMissionId() === id) setActiveMissionId(null);
}

export function getTotalDriveSec(): number {
  const n = parseFloat(localStorage.getItem(TIME_TOTAL_KEY) ?? "0");
  return Number.isFinite(n) ? n : 0;
}
export function addDriveSec(sec: number) {
  if (sec <= 0) return;
  localStorage.setItem(TIME_TOTAL_KEY, String(getTotalDriveSec() + sec));
}
