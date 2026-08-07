// Spieler-Tauschbörse: Angebote in der Cloud, Inhalte lokal verrechnet.
//
// Ablauf:
//  1. Ersteller legt an → sein Einsatz wird lokal sofort abgezogen (Treuhand).
//  2. Annehmender erfüllt eine der Anforderungen → wird lokal abgezogen,
//     der Einsatz des Erstellers wird ihm gutgeschrieben, das Angebot
//     bekommt Status "taken" und die Bezahlung als payout.
//  3. Ersteller holt seine Bezahlung später bei „Meine Angebote" ab.
import { supabase } from "@/integrations/supabase/client";
import { COLLECTIBLES_BY_ID, RARITY_LABEL, type Rarity } from "./collectibles";
import { addToCollection, getCollection, removeFromCollection } from "./collection";
import { addCoins, getCoins, spendCoins } from "./coins";
import { deleteCar, listCars, saveCar, type CustomCar } from "./garage";

/* ------------------------------- Typen -------------------------------- */

export type GivePart =
  | { kind: "coins"; amount: number }
  | { kind: "item"; id: string; count: number }
  | { kind: "car"; car: CustomCar };

export type WantOption =
  | { kind: "coins"; amount: number }
  | { kind: "item"; ids?: string[]; rarity?: Rarity; count: number }
  | {
      kind: "car";
      presetName?: string;
      minTop?: number;
      maxTop?: number;
      maxTime0to100?: number;
      minGrip?: number;
      body?: string;
    };

export type TradeOffer = {
  id: string;
  owner_id: string;
  owner_nick: string;
  give: GivePart[];
  want: WantOption[];
  note: string;
  status: "open" | "taken";
  taken_by: string | null;
  payout: GivePart[];
  payout_claimed: boolean;
  created_at: string;
};

/* ----------------------------- Beschreibung --------------------------- */

export function describeGive(p: GivePart): string {
  if (p.kind === "coins") return `🪙 ${p.amount.toLocaleString()}`;
  if (p.kind === "car") return `🚗 ${p.car.name} (${Math.round(p.car.tuning.topSpeed)} km/h)`;
  const it = COLLECTIBLES_BY_ID[p.id];
  return it ? `${it.emoji} ${it.name}${p.count > 1 ? ` ×${p.count}` : ""}` : `${p.id} ×${p.count}`;
}

export function describeWant(w: WantOption): string {
  if (w.kind === "coins") return `🪙 ${w.amount.toLocaleString()}`;
  if (w.kind === "item") {
    if (w.ids?.length) {
      const names = w.ids
        .map((id) => COLLECTIBLES_BY_ID[id])
        .filter(Boolean)
        .map((i) => `${i.emoji} ${i.name}`);
      return `${names.join(" oder ")}${w.count > 1 ? ` ×${w.count}` : ""}`;
    }
    return `${w.count}× beliebiges Item${w.rarity ? ` (${RARITY_LABEL[w.rarity]})` : ""}`;
  }
  const parts: string[] = [];
  if (w.presetName) parts.push(`Name enthält „${w.presetName}"`);
  if (w.minTop) parts.push(`≥ ${w.minTop} km/h`);
  if (w.maxTop) parts.push(`≤ ${w.maxTop} km/h`);
  if (w.maxTime0to100) parts.push(`0–100 ≤ ${w.maxTime0to100}s`);
  if (w.minGrip) parts.push(`Grip ≥ ${w.minGrip}`);
  if (w.body) parts.push(`Typ ${w.body}`);
  return `🚗 Fahrzeug${parts.length ? ` (${parts.join(", ")})` : ""}`;
}

/* -------------------------- Besitz / Erfüllung ------------------------ */

export function ownsGive(p: GivePart): boolean {
  if (p.kind === "coins") return getCoins() >= p.amount;
  if (p.kind === "car") return listCars().some((c) => c.id === p.car.id);
  return (getCollection()[p.id] ?? 0) >= p.count;
}

/** Findet lokale Autos, die eine Fahrzeug-Anforderung erfüllen. */
export function matchingCars(w: Extract<WantOption, { kind: "car" }>): CustomCar[] {
  return listCars().filter((c) => {
    if (w.presetName && !c.name.toLowerCase().includes(w.presetName.toLowerCase())) return false;
    if (w.minTop && c.tuning.topSpeed < w.minTop) return false;
    if (w.maxTop && c.tuning.topSpeed > w.maxTop) return false;
    if (w.maxTime0to100 && c.tuning.time0to100 > w.maxTime0to100) return false;
    if (w.minGrip && c.tuning.grip < w.minGrip) return false;
    if (w.body && c.appearance.bodyType !== w.body) return false;
    return true;
  });
}

/** Items, die eine Item-Anforderung erfüllen (mit ausreichender Stückzahl). */
export function matchingItems(w: Extract<WantOption, { kind: "item" }>): { id: string; count: number }[] {
  const counts = getCollection();
  return Object.entries(counts)
    .filter(([id, n]) => {
      if (n <= 0) return false;
      const it = COLLECTIBLES_BY_ID[id];
      if (!it) return false;
      if (w.ids?.length && !w.ids.includes(id)) return false;
      if (w.rarity && it.rarity !== w.rarity) return false;
      return n >= w.count;
    })
    .map(([id, n]) => ({ id, count: n }));
}

export function canFulfill(w: WantOption): boolean {
  if (w.kind === "coins") return getCoins() >= w.amount;
  if (w.kind === "car") return matchingCars(w).length > 0;
  return matchingItems(w).length > 0;
}

/* --------------------------- Lokale Buchungen ------------------------- */

function withdraw(p: GivePart): boolean {
  if (p.kind === "coins") return spendCoins(p.amount);
  if (p.kind === "car") { deleteCar(p.car.id); return true; }
  if ((getCollection()[p.id] ?? 0) < p.count) return false;
  removeFromCollection(p.id, p.count);
  return true;
}

export function deposit(p: GivePart) {
  if (p.kind === "coins") { addCoins(p.amount); return; }
  if (p.kind === "car") {
    try { saveCar({ ...p.car, id: crypto.randomUUID(), createdAt: Date.now() }, false); }
    catch { /* Slot voll — Auto geht verloren, Nutzer wird gewarnt */ }
    return;
  }
  addToCollection(p.id, p.count);
}

/* ------------------------------ Cloud-API ----------------------------- */

type Row = {
  id: string; owner_id: string; owner_nick: string; give: unknown; want: unknown;
  note: string; status: string; taken_by: string | null; payout: unknown;
  payout_claimed: boolean; created_at: string;
};

function toOffer(r: Row): TradeOffer {
  return {
    id: r.id,
    owner_id: r.owner_id,
    owner_nick: r.owner_nick,
    give: Array.isArray(r.give) ? (r.give as GivePart[]) : [],
    want: Array.isArray(r.want) ? (r.want as WantOption[]) : [],
    note: r.note ?? "",
    status: r.status === "taken" ? "taken" : "open",
    taken_by: r.taken_by,
    payout: Array.isArray(r.payout) ? (r.payout as GivePart[]) : [],
    payout_claimed: !!r.payout_claimed,
    created_at: r.created_at,
  };
}

export async function fetchOffers(): Promise<TradeOffer[]> {
  const { data, error } = await supabase
    .from("trade_offers")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return (data as Row[]).map(toOffer);
}

export async function fetchMyOffers(userId: string): Promise<TradeOffer[]> {
  const { data, error } = await supabase
    .from("trade_offers")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return (data as Row[]).map(toOffer);
}

export async function createOffer(input: {
  nick: string; give: GivePart[]; want: WantOption[]; note: string;
}): Promise<{ ok: boolean; message: string }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Bitte zuerst mit Konto anmelden." };
  if (input.give.length === 0) return { ok: false, message: "Du musst etwas anbieten." };
  if (input.want.length === 0) return { ok: false, message: "Du musst etwas verlangen." };
  for (const g of input.give) {
    if (!ownsGive(g)) return { ok: false, message: `Nicht im Besitz: ${describeGive(g)}` };
  }

  const withdrawn: GivePart[] = [];
  for (const g of input.give) {
    if (!withdraw(g)) {
      for (const w of withdrawn) deposit(w);
      return { ok: false, message: `Konnte ${describeGive(g)} nicht reservieren.` };
    }
    withdrawn.push(g);
  }

  const { error } = await supabase.from("trade_offers").insert({
    owner_id: auth.user.id,
    owner_nick: input.nick.slice(0, 24) || "anon",
    give: input.give as unknown as never,
    want: input.want as unknown as never,
    note: input.note.slice(0, 300),
  });
  if (error) {
    for (const w of withdrawn) deposit(w);
    return { ok: false, message: `Fehler: ${error.message}` };
  }
  return { ok: true, message: "Angebot erstellt — dein Einsatz liegt in der Treuhand." };
}

/** Nimmt ein Angebot an: zahlt `payWith` und erhält den Einsatz des Erstellers. */
export async function acceptOffer(
  offer: TradeOffer,
  payWith: GivePart[],
): Promise<{ ok: boolean; message: string }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Bitte zuerst mit Konto anmelden." };
  if (auth.user.id === offer.owner_id) return { ok: false, message: "Eigene Angebote kannst du nicht annehmen." };
  for (const p of payWith) {
    if (!ownsGive(p)) return { ok: false, message: `Nicht im Besitz: ${describeGive(p)}` };
  }

  // Erst Angebot sperren — verhindert Doppelannahme.
  const { data, error } = await supabase
    .from("trade_offers")
    .update({ status: "taken", taken_by: auth.user.id, payout: payWith as unknown as never })
    .eq("id", offer.id)
    .eq("status", "open")
    .select("id");
  if (error) return { ok: false, message: `Fehler: ${error.message}` };
  if (!data || data.length === 0) return { ok: false, message: "Angebot ist nicht mehr verfügbar." };

  for (const p of payWith) withdraw(p);
  for (const g of offer.give) deposit(g);
  return { ok: true, message: "Tausch abgeschlossen!" };
}

/** Zieht ein eigenes offenes Angebot zurück und erstattet den Einsatz. */
export async function cancelOffer(offer: TradeOffer): Promise<{ ok: boolean; message: string }> {
  const { error } = await supabase.from("trade_offers").delete().eq("id", offer.id).eq("status", "open");
  if (error) return { ok: false, message: `Fehler: ${error.message}` };
  for (const g of offer.give) deposit(g);
  return { ok: true, message: "Angebot zurückgezogen — Einsatz erstattet." };
}

/** Holt die Bezahlung eines angenommenen eigenen Angebots ab. */
export async function claimPayout(offer: TradeOffer): Promise<{ ok: boolean; message: string }> {
  if (offer.payout_claimed) return { ok: false, message: "Bereits abgeholt." };
  const { error } = await supabase
    .from("trade_offers")
    .update({ payout_claimed: true })
    .eq("id", offer.id)
    .eq("payout_claimed", false);
  if (error) return { ok: false, message: `Fehler: ${error.message}` };
  for (const p of offer.payout) deposit(p);
  return { ok: true, message: `Erhalten: ${offer.payout.map(describeGive).join(", ")}` };
}
