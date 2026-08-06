// Kompatibilitäts-Layer: Der frühere DevMode wurde durch das Admin-System
// ersetzt (src/lib/admin.ts). Bestehende Aufrufer lesen weiterhin hier.
import { isAdmin, subscribeAdmin } from "./admin";

export const DEVMODE_PRICE = 0;

export function isDevMode(): boolean {
  return isAdmin();
}

export function subscribeDevMode(cb: (on: boolean) => void): () => void {
  return subscribeAdmin(cb);
}
