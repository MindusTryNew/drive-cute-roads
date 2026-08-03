// Statischer News-Feed für das Spiel. Datum-basiert, damit neue Einträge oben erscheinen.
export type NewsType = "info" | "update" | "event";

export type NewsItem = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  body: string;
  type: NewsType;
};

export const NEWS: NewsItem[] = [
  {
    id: "farewell-2026",
    date: "2026-01-15",
    title: "Drift Lab v2.0 – Farewell-Update",
    type: "update",
    body:
      "Das finale große Update ist da! Es enthält eine stark verbesserte Minimap, den Premium-Pass, einen aufgewerteten Map-Editor, ein News-System und ein riesiges Dankeschön-Geschenk. Viel Spaß beim Entdecken!",
  },
  {
    id: "gift-live",
    date: "2026-01-15",
    title: "Großes Dankeschön-Geschenk",
    type: "event",
    body:
      "Zum Abschluss der Entwicklung schenken wir dir 6 exklusive Autos, 20 brandneue Sammelitems und 40.000 Coins. Öffne das Geschenk in der Garage – es ist einmalig pro Spieler verfügbar.",
  },
  {
    id: "premium-pass",
    date: "2026-01-15",
    title: "Premium-Pass jetzt verfügbar",
    type: "update",
    body:
      "Mit dem Premium-Pass zahlst du jede Woche 5.000 Coins und erhältst dafür +20 % Coins, +20 % XP und ein kostenloses Standard-Paket pro Woche.",
  },
  {
    id: "editor-v2",
    date: "2026-01-15",
    title: "Map-Editor 2.0",
    type: "update",
    body:
      "Der Editor unterstützt jetzt Undo/Redo, Snap-Grid, Objekt-Liste, Tastenkürzel und eine direkte Testfahrt aus dem Editor heraus.",
  },
  {
    id: "minimap-v2",
    date: "2026-01-15",
    title: "Minimap-Upgrade",
    type: "update",
    body:
      "Die Minimap zeigt jetzt Regionen, Missions-Marker, Welt-Pakete, einen Fahrzeug-Trail und lässt sich per Mausrad mit korrektem Ankerpunkt zoomen.",
  },
  {
    id: "community",
    date: "2026-01-10",
    title: "Danke an die Community",
    type: "info",
    body:
      "Wir möchten uns bei allen Spielern bedanken, die Autos gebaut, Mods geteilt, Missionen gemeistert und Feedback gegeben haben. Drift Lab ist durch euch erst zu dem geworden, was es heute ist.",
  },
];

const READ_KEY = "garage:newsRead";
const safeLS = () => (typeof localStorage !== "undefined" ? localStorage : null);

export function getReadIds(): string[] {
  try {
    return JSON.parse(safeLS()?.getItem(READ_KEY) ?? "[]");
  } catch { return []; }
}

export function markRead(id: string) {
  const list = getReadIds();
  if (!list.includes(id)) list.push(id);
  safeLS()?.setItem(READ_KEY, JSON.stringify(list));
}

export function hasUnread(): boolean {
  const read = new Set(getReadIds());
  return NEWS.some((n) => !read.has(n.id));
}

export function unreadCount(): number {
  const read = new Set(getReadIds());
  return NEWS.filter((n) => !read.has(n.id)).length;
}
