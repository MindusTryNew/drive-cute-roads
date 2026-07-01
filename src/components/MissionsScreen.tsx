import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MISSIONS,
  setActiveMissionId,
  getActiveMissionId,
  getDone,
  getTotalDriveSec,
  getCurrentRotation,
  secondsUntilNextRotation,
  type Mission,
} from "@/lib/missions";

const TYPE_LABEL: Record<Mission["type"], string> = {
  speed: "Speed",
  delivery: "Lieferung",
  time: "Spielzeit",
};

export function MissionsScreen({ onBack }: { onBack: () => void }) {
  const [active, setActive] = useState<string | null>(getActiveMissionId());
  const [done, setDone] = useState<string[]>(getDone());
  const [rotation, setRotation] = useState<Mission[]>(getCurrentRotation());
  const [countdown, setCountdown] = useState(secondsUntilNextRotation());
  const total = getTotalDriveSec();

  useEffect(() => {
    setActive(getActiveMissionId());
    setDone(getDone());
    const id = setInterval(() => {
      setCountdown(secondsUntilNextRotation());
      setRotation(getCurrentRotation());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const choose = (id: string | null) => {
    setActiveMissionId(id);
    setActive(id);
  };

  const m = Math.floor(countdown / 60);
  const s = countdown % 60;
  const rotationIds = new Set(rotation.map((r) => r.id));

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
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Rotation in</p>
            <p className="font-mono text-lg font-bold tabular-nums">{m}:{String(s).padStart(2, "0")}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Gesamt-Fahrzeit</p>
            <p className="font-mono text-lg font-bold tabular-nums">{Math.floor(total / 60)} m {Math.floor(total % 60)} s</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        {active && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-4 py-3">
            <p className="text-sm">Aktive Mission: <b>{MISSIONS.find((m) => m.id === active)?.title}</b></p>
            <Button size="sm" variant="ghost" onClick={() => choose(null)}>Deaktivieren</Button>
          </div>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">🎯 Aktuelle Rotation (wechselt alle 2 Min)</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {rotation.map((mm) => {
              const isDone = done.includes(mm.id);
              const isActive = active === mm.id;
              return (
                <article key={mm.id}
                  className={`rounded-2xl border bg-card p-4 transition ${isActive ? "border-primary" : "border-primary/40"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{TYPE_LABEL[mm.type]}</span>
                    <span className="font-mono text-xs">🪙 {mm.reward}</span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold">{mm.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{mm.desc}</p>
                  <div className="mt-4 flex items-center justify-between">
                    {isDone
                      ? <span className="font-mono text-xs text-primary">✓ Erledigt</span>
                      : <span className="font-mono text-xs text-muted-foreground">offen</span>}
                    <Button size="sm" variant={isActive ? "outline" : "default"}
                      onClick={() => choose(isActive ? null : mm.id)}>
                      {isActive ? "Aktiv" : "Auswählen"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Alle Missionen</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MISSIONS.map((mm) => {
              const isDone = done.includes(mm.id);
              const isActive = active === mm.id;
              const inRotation = rotationIds.has(mm.id);
              return (
                <article key={mm.id}
                  className={`rounded-2xl border bg-card p-4 transition ${isActive ? "border-primary" : "border-border"} ${!inRotation ? "opacity-70" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {TYPE_LABEL[mm.type]}{inRotation ? " · IN ROTATION" : ""}
                    </span>
                    <span className="font-mono text-xs">🪙 {mm.reward}</span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold">{mm.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{mm.desc}</p>
                  <div className="mt-4 flex items-center justify-between">
                    {isDone
                      ? <span className="font-mono text-xs text-primary">✓ Erledigt</span>
                      : <span className="font-mono text-xs text-muted-foreground">offen</span>}
                    <Button size="sm" variant={isActive ? "outline" : "default"}
                      onClick={() => choose(isActive ? null : mm.id)}>
                      {isActive ? "Aktiv" : "Auswählen"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
