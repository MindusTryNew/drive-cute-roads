// Einmal-einlösbare Premium-Codes (rein lokal — kein Anti-Cheat).
import { addCoins, addSlot } from "./coins";

const REDEEMED_KEY = "garage:redeemed";
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

export type CodeReward =
  | { kind: "coins"; amount: number }
  | { kind: "slot" };

type CodeDef = { code: string; label: string; reward: CodeReward };

const CATALOG: CodeDef[] = [
  { code: "DRIFT5000", label: "5 000 Coins", reward: { kind: "coins", amount: 5000 } },
  { code: "GARAGEPLUS", label: "Extra Garagenplatz", reward: { kind: "slot" } },
];


function getRedeemed(): string[] {
  try { return JSON.parse(safeLS()?.getItem(REDEEMED_KEY) ?? "[]"); }
  catch { return []; }
}
function markRedeemed(code: string) {
  const list = getRedeemed();
  if (!list.includes(code)) {
    list.push(code);
    safeLS()?.setItem(REDEEMED_KEY, JSON.stringify(list));
  }
}

export function redeemCode(input: string): { ok: true; label: string } | { ok: false; reason: string } {
  const code = input.trim().toUpperCase();
  if (!code) return { ok: false, reason: "Kein Code eingegeben." };
  const def = CATALOG.find((c) => c.code.toUpperCase() === code);
  if (!def) return { ok: false, reason: "Ungültiger Code." };
  if (getRedeemed().includes(def.code)) return { ok: false, reason: "Dieser Code wurde bereits eingelöst." };

  switch (def.reward.kind) {
    case "devmode": setDevMode(true); break;
    case "coins": addCoins(def.reward.amount); break;
    case "slot": addSlot(); break;
  }
  markRedeemed(def.code);
  return { ok: true, label: def.label };
}
