// Aggregation permanenter Boni aus gefundenen Sammelitems (jedes Exemplar zählt).
import { COLLECTIBLES_BY_ID } from "./collectibles";
import { getCollection, subscribeCollection } from "./collection";

export type BonusStats = { accel: number; topSpeed: number; grip: number; brake: number };

export function getPermBonuses(): BonusStats {
  const counts = getCollection();
  const b: BonusStats = { accel: 0, topSpeed: 0, grip: 0, brake: 0 };
  for (const [id, n] of Object.entries(counts)) {
    const item = COLLECTIBLES_BY_ID[id];
    if (!item || !item.effect || item.effect.kind !== "perm") continue;
    b[item.effect.stat] += item.effect.pct * n;
  }
  return b;
}

export function subscribePermBonuses(cb: (b: BonusStats) => void): () => void {
  return subscribeCollection(() => cb(getPermBonuses()));
}
