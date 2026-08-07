// Fundort-Hinweise für Sammelitems. Deterministisch aus Item-ID abgeleitet,
// damit jeder Spieler denselben Hinweis sieht — ohne 700 Texte zu pflegen.
import { RARITY_ORDER, type Collectible, type Rarity } from "./collectibles";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const PLACES = [
  "in der Innenstadt zwischen den Hochhäusern",
  "auf der großen Rennstrecke",
  "in der Offroad-Zone im Nordosten",
  "im Hügelland",
  "in den Tälern im Süden",
  "in der Stunt-Arena",
  "am Strandabschnitt",
  "auf den langen Verbindungsstraßen",
];

const CONDITIONS = [
  "Chance steigt bei Fahrten über 5 Minuten.",
  "Häufiger nach langen Drifts.",
  "Taucht vor allem nachts auf.",
  "Erscheint eher bei hohem Tempo (über 200 km/h).",
  "Wird oft nach großen Sprüngen gefunden.",
  "Bevorzugt tagsüber zu finden.",
];

const RARITY_SOURCE: Record<Rarity, string[]> = {
  common: ["Fund in der Open World", "Starter-Paket", "Missionsbelohnung"],
  uncommon: ["Fund in der Open World", "Standard-Paket", "Missionsbelohnung"],
  rare: ["Standard-Paket", "Deluxe-Paket", "Bundle-Shop"],
  epic: ["Deluxe-Paket", "Bundle-Shop", "Werkbank-Aufwertung"],
  legendary: ["Mythic-Paket", "Werkbank-Aufwertung", "Serien-Belohnung"],
  mythical: ["Mythic-Paket", "Ultra-Paket", "Serien-Belohnung"],
  cosmic: ["Ultra-Paket", "Himmlisches Paket", "Werkbank-Aufwertung"],
  celestial: ["Himmlisches Paket", "Serien-Belohnung"],
};

export type FindHint = {
  /** Grober Hinweis (für noch nicht gefundene Items). */
  vague: string;
  /** Genauer Hinweis (für bereits gefundene Items). */
  precise: string;
  sources: string[];
};

export function getFindHint(item: Collectible): FindHint {
  const h = hash(item.id);
  const place = PLACES[h % PLACES.length];
  const cond = CONDITIONS[(h >> 5) % CONDITIONS.length];
  const rarityIdx = RARITY_ORDER.indexOf(item.rarity);
  const pool = RARITY_SOURCE[item.rarity];
  const sources = [pool[h % pool.length], pool[(h >> 3) % pool.length]]
    .filter((v, i, a) => a.indexOf(v) === i);

  const vague = rarityIdx <= 2
    ? "Kann fast überall in der Open World gefunden werden."
    : rarityIdx <= 4
      ? `Wird meist ${place} oder in besseren Paketen gefunden.`
      : "Extrem selten — fast nur über hochwertige Pakete oder Serien-Belohnungen.";

  const precise = `Fundort: ${place}. ${cond} Quellen: ${sources.join(", ")}.`;

  return { vague, precise, sources };
}
