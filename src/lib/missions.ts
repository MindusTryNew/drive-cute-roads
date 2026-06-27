// Static mission catalogue. Progress + active mission stored in localStorage.
import { addCoins } from "./coins";

export type MissionType = "speed" | "delivery" | "time";

export type Mission = {
  id: string;
  type: MissionType;
  title: string;
  desc: string;
  reward: number;
  // Type-specific config:
  targetSpeed?: number;      // speed: km/h target
  targetTimeSec?: number;    // speed: seconds to reach target
  totalSeconds?: number;     // time: seconds of driving needed
  deliveryDistance?: number; // delivery: spawn pickup/drop apart (meters)
  deliveryLimitSec?: number; // delivery: time limit
};

export const MISSIONS: Mission[] = [
  { id: "spd-100", type: "speed", title: "Schneller Spurt", desc: "Erreiche 100 km/h in unter 6 s.", reward: 80, targetSpeed: 100, targetTimeSec: 6 },
  { id: "spd-200", type: "speed", title: "Doppelter Sprint", desc: "Erreiche 200 km/h in unter 10 s.", reward: 150, targetSpeed: 200, targetTimeSec: 10 },
  { id: "spd-300", type: "speed", title: "Top-Lauf", desc: "Erreiche 300 km/h in unter 18 s.", reward: 250, targetSpeed: 300, targetTimeSec: 18 },
  { id: "del-short", type: "delivery", title: "Express-Paket", desc: "Hole das gelbe Paket ab und liefere es zum grünen Marker.", reward: 120, deliveryDistance: 80, deliveryLimitSec: 60 },
  { id: "del-long", type: "delivery", title: "Quer durch die Stadt", desc: "Lange Lieferung — quer über die Map in 2 Minuten.", reward: 250, deliveryDistance: 220, deliveryLimitSec: 120 },
  { id: "tm-5", type: "time", title: "Aufwärmrunde", desc: "Fahre insgesamt 5 Minuten.", reward: 100, totalSeconds: 5 * 60 },
  { id: "tm-30", type: "time", title: "Halbe Stunde Drift", desc: "Fahre insgesamt 30 Minuten.", reward: 400, totalSeconds: 30 * 60 },
  { id: "tm-120", type: "time", title: "Marathon", desc: "Fahre insgesamt 2 Stunden.", reward: 1500, totalSeconds: 120 * 60 },
];

const ACTIVE_KEY = "garage:activeMission";
const DONE_KEY = "garage:doneMissions";
const TIME_TOTAL_KEY = "garage:totalDriveSec";

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
  if (m) addCoins(m.reward);
  if (getActiveMissionId() === id) setActiveMissionId(null);
}

// Total drive seconds (cumulative — used by time missions and stats)
export function getTotalDriveSec(): number {
  const n = parseFloat(localStorage.getItem(TIME_TOTAL_KEY) ?? "0");
  return Number.isFinite(n) ? n : 0;
}
export function addDriveSec(sec: number) {
  if (sec <= 0) return;
  localStorage.setItem(TIME_TOTAL_KEY, String(getTotalDriveSec() + sec));
}
