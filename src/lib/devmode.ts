// DevMode-Flag mit einfachem Pub-Sub.
const KEY = "garage:devMode";
type Listener = (on: boolean) => void;
const listeners = new Set<Listener>();

export const DEVMODE_PRICE = 50000;

export function isDevMode(): boolean {
  return localStorage.getItem(KEY) === "1";
}
export function setDevMode(on: boolean) {
  if (on) localStorage.setItem(KEY, "1");
  else localStorage.removeItem(KEY);
  for (const l of listeners) l(on);
}
export function subscribeDevMode(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
