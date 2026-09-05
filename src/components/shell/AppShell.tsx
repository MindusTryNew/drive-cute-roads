import { useState, type ReactNode } from "react";

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  badge?: string | number;
  highlight?: boolean;
  hidden?: boolean;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

/** Feste Seitenleiste (Desktop) bzw. ausklappbares Menü (Mobil). */
export function AppShell({
  groups,
  status,
  footer,
  children,
}: {
  groups: NavGroup[];
  status?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <div className="flex items-center gap-3">
        <div
          className="h-9 w-9 shrink-0 rounded-lg"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", boxShadow: "var(--hud-glow)" }}
        />
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Drift Lab</p>
          <p className="truncate text-sm font-bold">Hauptmenü</p>
        </div>
      </div>

      {status}

      {groups.map((g) => {
        const items = g.items.filter((i) => !i.hidden);
        if (items.length === 0) return null;
        return (
          <div key={g.title} className="space-y-1">
            <p className="px-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{g.title}</p>
            {items.map((i) => (
              <button
                key={i.id}
                onClick={() => { setOpen(false); i.onClick(); }}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  i.highlight
                    ? "border-primary/60 bg-primary/10 hover:bg-primary/20"
                    : "border-transparent hover:border-primary/40 hover:bg-card"
                }`}
              >
                <span className="w-5 text-center">{i.icon}</span>
                <span className="flex-1 truncate">{i.label}</span>
                {i.badge !== undefined && i.badge !== "" && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {i.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        );
      })}

      {footer && <div className="mt-auto pt-2">{footer}</div>}
    </nav>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="hidden w-64 shrink-0 border-r bg-card/40 backdrop-blur-md md:block">{nav}</aside>

      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 border-r bg-card backdrop-blur-md">{nav}</aside>
        </div>
      )}

      <div className="relative flex-1 overflow-y-auto">
        <button
          onClick={() => setOpen(true)}
          className="fixed left-3 top-3 z-40 rounded-lg border bg-card px-3 py-2 text-sm md:hidden"
          aria-label="Menü öffnen"
        >
          ☰ Menü
        </button>
        {children}
      </div>
    </div>
  );
}
