// DevMode-Flag mit einfachem Pub-Sub.
const KEY = "garage:devMode";
type Listener = (on: boolean) => void;
const listeners = new Set<Listener>();
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

export const DEVMODE_PRICE = 50000;

export function isDevMode(): boolean {
  return safeLS()?.getItem(KEY) === "1";
}
export function setDevMode(on: boolean) {
  const ls = safeLS();
  if (!ls) return;
  if (on) ls.setItem(KEY, "1");
  else ls.removeItem(KEY);
  for (const l of listeners) l(on);
}
export function subscribeDevMode(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
