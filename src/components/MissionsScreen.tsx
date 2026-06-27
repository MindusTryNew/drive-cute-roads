import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MISSIONS, setActiveMissionId, getActiveMissionId, getDone, getTotalDriveSec, type Mission } from "@/lib/missions";

const TYPE_LABEL: Record<Mission["type"], string> = {
  speed: "Speed",
  delivery: "Lieferung",
  time: "Spielzeit",
};

export function MissionsScreen({ onBack }: { onBack: () => void }) {
  const [active, setActive] = useState<string | null>(getActiveMissionId());
  const [done, setDone] = useState<string[]>(getDone());
  const total = getTotalDriveSec();

  useEffect(() => {
    setActive(getActiveMissionId());
    setDone(getDone());
  }, []);

  const choose = (id: string | null) => {
    setActiveMissionId(id);
    setActive(id);
  };

  return (
    <main className="relative h-screen w-screen overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}>← Garage</Button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Missionen</p>
            <h1 className="text-xl font-bold">Wähle deine nächste Herausforderung</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Gesamt-Fahrzeit</p>
          <p className="font-mono text-lg font-bold tabular-nums">{Math.floor(total / 60)} m {Math.floor(total % 60)} s</p>
        </div>
      </header>

      <div className="px-6 py-6">
        {active && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-4 py-3">
            <p className="text-sm">Aktive Mission: <b>{MISSIONS.find((m) => m.id === active)?.title}</b></p>
            <Button size="sm" variant="ghost" onClick={() => choose(null)}>Deaktivieren</Button>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MISSIONS.map((m) => {
            const isDone = done.includes(m.id);
            const isActive = active === m.id;
            return (
              <article key={m.id}
                className={`rounded-2xl border bg-card p-4 transition ${isActive ? "border-primary" : "border-border"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{TYPE_LABEL[m.type]}</span>
                  <span className="font-mono text-xs">🪙 {m.reward}</span>
                </div>
                <h3 className="mt-1 text-lg font-bold">{m.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                  {isDone ? (
                    <span className="font-mono text-xs text-primary">✓ Erledigt</span>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">offen</span>
                  )}
                  <Button size="sm" variant={isActive ? "outline" : "default"}
                    onClick={() => choose(isActive ? null : m.id)}>
                    {isActive ? "Aktiv" : "Auswählen"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-6 font-mono text-[10px] text-muted-foreground">
          Aktive Mission wird im Simulator angezeigt und automatisch verfolgt. Belohnungen werden gutgeschrieben sobald erreicht.
        </p>
      </div>
    </main>
  );
}
