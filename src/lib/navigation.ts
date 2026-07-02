// Ziel-State für das Navigationssystem der Minimap.
type Dest = { x: number; z: number } | null;
type Listener = (d: Dest) => void;

let dest: Dest = null;
const listeners = new Set<Listener>();

export function getDest(): Dest { return dest; }
export function setDest(d: Dest) {
  dest = d;
  for (const l of listeners) l(d);
}
export function clearDest() { setDest(null); }
export function subscribeDest(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
