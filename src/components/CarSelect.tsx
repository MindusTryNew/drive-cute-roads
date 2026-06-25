import { useState } from "react";

export type CarKey = "roadster" | "suv" | "racer";

export const CARS: Record<CarKey, {
  name: string;
  tag: string;
  color: string;
  accent: string;
  stats: { speed: number; grip: number; accel: number };
  desc: string;
}> = {
  roadster: {
    name: "Aurora GT",
    tag: "Cabrio · Tour",
    color: "#e8c547",
    accent: "oklch(0.78 0.18 75)",
    stats: { speed: 7, grip: 6, accel: 6 },
    desc: "Eleganter Roadster mit balanciertem Fahrwerk.",
  },
  suv: {
    name: "Monolith X",
    tag: "SUV · Allwetter",
    color: "#5b8def",
    accent: "oklch(0.7 0.2 250)",
    stats: { speed: 5, grip: 9, accel: 4 },
    desc: "Massives SUV mit hoher Traktion und Stabilität.",
  },
  racer: {
    name: "Vortex R1",
    tag: "Hypercar · Track",
    color: "#ef4f5b",
    accent: "oklch(0.7 0.2 25)",
    stats: { speed: 10, grip: 8, accel: 10 },
    desc: "Aggressives Hypercar für maximale Performance.",
  },
};

export function CarSelect({ onSelect }: { onSelect: (c: CarKey) => void }) {
  const [hover, setHover] = useState<CarKey>("roadster");
  const keys = Object.keys(CARS) as CarKey[];

  return (
    <main className="relative h-screen w-screen overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 opacity-30"
           style={{ backgroundImage: "linear-gradient(oklch(1 0 0 / 0.06) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.06) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", boxShadow: "var(--hud-glow)" }} />
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Drift Lab v1.0</p>
              <h1 className="text-xl font-bold">Garage</h1>
            </div>
          </div>
          <p className="font-mono text-xs text-muted-foreground">WASD / ↑ ↓ ← → · Leertaste = Bremse</p>
        </header>

        <section className="mt-12">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Wähle dein Fahrzeug.</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">Drei Charaktere, drei Fahrgefühle. Steig ein und teste sie auf der Strecke.</p>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {keys.map((k) => {
            const car = CARS[k];
            const active = hover === k;
            return (
              <button
                key={k}
                onMouseEnter={() => setHover(k)}
                onFocus={() => setHover(k)}
                onClick={() => onSelect(k)}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 text-left backdrop-blur-md transition-all hover:-translate-y-1"
                style={{
                  borderColor: active ? car.accent : "var(--border)",
                  boxShadow: active ? `0 20px 60px -20px ${car.accent}` : undefined,
                }}
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-40 blur-3xl transition-opacity group-hover:opacity-70"
                     style={{ background: car.accent }} />

                <div className="relative">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{car.tag}</p>
                  <h3 className="mt-1 text-2xl font-bold">{car.name}</h3>

                  <div className="my-6 flex h-32 items-center justify-center">
                    <CarSilhouette type={k} color={car.color} />
                  </div>

                  <p className="text-sm text-muted-foreground">{car.desc}</p>

                  <dl className="mt-5 space-y-2">
                    <Stat label="Speed" value={car.stats.speed} color={car.accent} />
                    <Stat label="Grip" value={car.stats.grip} color={car.accent} />
                    <Stat label="Accel" value={car.stats.accel} color={car.accent} />
                  </dl>

                  <div className="mt-6 flex items-center justify-between font-mono text-xs uppercase tracking-widest">
                    <span className="text-muted-foreground">Auswählen</span>
                    <span style={{ color: car.accent }}>→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        <footer className="mt-auto pt-12 font-mono text-xs text-muted-foreground">
          © Drift Lab — Klicke auf ein Auto zum Starten
        </footer>
      </div>
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <dt className="w-14 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="flex flex-1 gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full"
                style={{ background: i < value ? color : "oklch(1 0 0 / 0.08)" }} />
        ))}
      </dd>
    </div>
  );
}

function CarSilhouette({ type, color }: { type: CarKey; color: string }) {
  if (type === "suv") {
    return (
      <svg viewBox="0 0 200 100" className="h-full w-auto" style={{ filter: `drop-shadow(0 10px 20px ${color}66)` }}>
        <path d="M20 70 L30 45 L70 35 L130 35 L160 50 L180 55 L185 75 L20 75 Z" fill={color} />
        <path d="M70 40 L80 50 L130 50 L135 40 Z" fill="#0a0e1a" opacity="0.7" />
        <circle cx="55" cy="78" r="12" fill="#0a0e1a" />
        <circle cx="150" cy="78" r="12" fill="#0a0e1a" />
      </svg>
    );
  }
  if (type === "racer") {
    return (
      <svg viewBox="0 0 200 100" className="h-full w-auto" style={{ filter: `drop-shadow(0 10px 20px ${color}66)` }}>
        <path d="M10 75 L40 55 L80 48 L140 50 L180 60 L190 75 L10 75 Z" fill={color} />
        <path d="M70 55 L90 48 L130 50 L140 58 Z" fill="#0a0e1a" opacity="0.8" />
        <rect x="160" y="40" width="25" height="6" fill={color} />
        <circle cx="50" cy="78" r="10" fill="#0a0e1a" />
        <circle cx="155" cy="78" r="10" fill="#0a0e1a" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 100" className="h-full w-auto" style={{ filter: `drop-shadow(0 10px 20px ${color}66)` }}>
      <path d="M15 72 L35 55 L75 45 L130 45 L165 55 L185 72 L15 72 Z" fill={color} />
      <path d="M70 50 L85 45 L130 45 L140 52 Z" fill="#0a0e1a" opacity="0.7" />
      <circle cx="55" cy="75" r="11" fill="#0a0e1a" />
      <circle cx="150" cy="75" r="11" fill="#0a0e1a" />
    </svg>
  );
}
