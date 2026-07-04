// Aggregation permanenter Boni aus Sammelitems + aktive Temp-Effekte.
import { COLLECTIBLES_BY_ID } from "./collectibles";
import { getCollection, subscribeCollection } from "./collection";
import { getTempBonuses, subscribeActiveEffects } from "./active-effects";

export type BonusStats = { accel: number; topSpeed: number; grip: number; brake: number };

export function getPermBonuses(): BonusStats {
  const counts = getCollection();
  const b: BonusStats = { accel: 0, topSpeed: 0, grip: 0, brake: 0 };
  for (const [id, n] of Object.entries(counts)) {
    const item = COLLECTIBLES_BY_ID[id];
    if (!item || !item.effect || item.effect.kind !== "perm") continue;
    b[item.effect.stat] += item.effect.pct * n;
  }
  const t = getTempBonuses();
  b.accel += t.accel;
  b.topSpeed += t.topSpeed;
  b.grip += t.grip;
  b.brake += t.brake;
  return b;
}

export function subscribePermBonuses(cb: (b: BonusStats) => void): () => void {
  const un1 = subscribeCollection(() => cb(getPermBonuses()));
  const un2 = subscribeActiveEffects(() => cb(getPermBonuses()));
  return () => { un1(); un2(); };
}
