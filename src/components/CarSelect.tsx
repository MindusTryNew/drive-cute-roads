import { useEffect, useState } from "react";
import {
  listCars,
  deleteCar,
  remainingToday,
  DAILY_LIMIT,
  importCarFromFile,
  saveCar,
  downloadCar,
  type CustomCar,
} from "@/lib/garage";
import { getCoins, subscribeCoins, getSlots, nextSlotPrice, spendCoins, addSlot } from "@/lib/coins";

export type CarKey = "roadster" | "suv" | "racer";
export type Mode = "solo" | "split" | "online";

export const CARS: Record<CarKey, {
  name: string; tag: string; color: string; accent: string;
  stats: { speed: number; grip: number; accel: number }; desc: string;
}> = {
  roadster: {
    name: "Aurora GT", tag: "Cabrio · Tour", color: "#e8c547", accent: "oklch(0.78 0.18 75)",
    stats: { speed: 7, grip: 6, accel: 6 }, desc: "Eleganter Roadster mit balanciertem Fahrwerk.",
  },
  suv: {
    name: "Monolith X", tag: "SUV · Allwetter", color: "#5b8def", accent: "oklch(0.7 0.2 250)",
    stats: { speed: 5, grip: 9, accel: 4 }, desc: "Massives SUV mit hoher Traktion und Stabilität.",
  },
  racer: {
    name: "Vortex R1", tag: "Hypercar · Track", color: "#ef4f5b", accent: "oklch(0.7 0.2 25)",
    stats: { speed: 10, grip: 8, accel: 10 }, desc: "Aggressives Hypercar für maximale Performance.",
  },
};

export type GarageSelection =
  | { kind: "preset"; key: CarKey }
  | { kind: "custom"; car: CustomCar };

export function CarSelect({
  onSelect,
  onBuildNew,
  onEdit,
  onOpenMarket,
  onOpenMissions,
  onOpenMods,
  onOpenTutorial,
  mode = "solo",
  onModeChange,
  headline,
  hideBuildActions = false,
}: {
  onSelect: (sel: GarageSelection) => void;
  onBuildNew: () => void;
  onEdit: (car: CustomCar) => void;
  onOpenMarket?: () => void;
  onOpenMissions?: () => void;
  onOpenMods?: () => void;
  onOpenTutorial?: () => void;
  mode?: Mode;
  onModeChange?: (m: Mode) => void;
  headline?: string;
  hideBuildActions?: boolean;
}) {
  const [hover, setHover] = useState<CarKey>("roadster");
  const [customCars, setCustomCars] = useState<CustomCar[]>([]);
  const [remaining, setRemaining] = useState(DAILY_LIMIT);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState(getCoins());
  const [slots, setSlots] = useState(getSlots());

  useEffect(() => {
    setCustomCars(listCars());
    setRemaining(remainingToday());
    const un = subscribeCoins(setCoins);
    return () => { un(); };
  }, []);

  const refresh = () => {
    setCustomCars(listCars());
    setRemaining(remainingToday());
    setSlots(getSlots());
    setCoins(getCoins());
  };

  const buySlot = () => {
    const p = nextSlotPrice();
    if (!spendCoins(p)) { setError(`Nicht genug Coins (🪙 ${p} nötig).`); return; }
    addSlot();
    refresh();
  };

  const handleImport = async (file: File) => {
    setError(null);
    try {
      const car = await importCarFromFile(file);
      saveCar(car, false);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import fehlgeschlagen");
    }
  };

  const keys = Object.keys(CARS) as CarKey[];
  const modes: { id: Mode; label: string; desc: string }[] = [
    { id: "solo", label: "Solo", desc: "Allein fahren" },
    { id: "split", label: "2-Player Split", desc: "Geteilter Bildschirm" },
    { id: "online", label: "Online", desc: "Raum mit Freunden" },
  ];

  return (
    <main className="relative h-screen w-screen overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 opacity-30"
           style={{ backgroundImage: "linear-gradient(oklch(1 0 0 / 0.06) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.06) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", boxShadow: "var(--hud-glow)" }} />
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Drift Lab v2.0</p>
              <h1 className="text-xl font-bold">Garage</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenMissions && (
              <button onClick={onOpenMissions}
                className="rounded-lg border px-3 py-1.5 text-sm hover:border-primary">Missionen</button>
            )}
            {onOpenMods && (
              <button onClick={onOpenMods}
                className="rounded-lg border px-3 py-1.5 text-sm hover:border-primary">Mods</button>
            )}
            {onOpenTutorial && (
              <button onClick={onOpenTutorial}
                className="rounded-lg border px-3 py-1.5 text-sm hover:border-primary">📘 Tutorial</button>
            )}
            {onOpenMarket && (
              <button onClick={onOpenMarket}
                className="rounded-lg border px-3 py-1.5 text-sm hover:border-primary">Markt</button>
            )}
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
              <span>🪙</span>
              <span className="font-mono text-sm tabular-nums">{coins}</span>
            </div>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{headline ?? "Wähle dein Fahrzeug."}</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">Drei Werks-Charaktere — oder bau dein eigenes Auto im Profi-Editor.</p>
        </section>

        {onModeChange && (
          <section className="mt-8">
            <div className="flex flex-wrap gap-2">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onModeChange(m.id)}
                  className={`rounded-xl border px-5 py-3 text-left transition ${
                    mode === m.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-bold">{m.label}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{m.desc}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {keys.map((k) => {
            const car = CARS[k];
            const active = hover === k;
            return (
              <button
                key={k}
                onMouseEnter={() => setHover(k)}
                onFocus={() => setHover(k)}
                onClick={() => onSelect({ kind: "preset", key: k })}
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
                </div>
              </button>
            );
          })}
        </section>

        {!hideBuildActions && (
          <section className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Meine Autos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Garage: <b>{customCars.length}/{slots}</b> Plätze belegt ·{" "}
                  {remaining > 0
                    ? `${remaining}/${DAILY_LIMIT} neue Autos heute übrig`
                    : "Tageslimit erreicht"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={buySlot}
                  className="rounded-lg border px-4 py-2 text-sm hover:border-primary disabled:opacity-40"
                  disabled={coins < nextSlotPrice()}
                  title={`Neuer Slot kostet 🪙 ${nextSlotPrice()}`}
                >
                  + Garagen-Slot (🪙 {nextSlotPrice()})
                </button>
                <label className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:border-primary">
                  Mod / Auto importieren
                  <input type="file" accept=".json,application/json" className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) await handleImport(f);
                      e.target.value = "";
                    }} />
                </label>
                <button
                  onClick={onBuildNew}
                  disabled={remaining <= 0 || customCars.length >= slots}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
                  style={{ boxShadow: remaining > 0 && customCars.length < slots ? "var(--hud-glow)" : undefined }}
                >
                  + Neues Auto bauen
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {customCars.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed bg-card/40 p-10 text-center">
                <p className="text-muted-foreground">Noch keine eigenen Autos. Klick „+ Neues Auto bauen" um zu starten.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {customCars.map((c) => (
                  <div key={c.id} className="rounded-2xl border bg-card p-5"
                       style={{ borderColor: c.appearance.primaryColor + "55" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground capitalize">{c.appearance.bodyType}</p>
                        <h3 className="mt-1 text-xl font-bold">{c.name}</h3>
                      </div>
                      <div className="h-8 w-8 rounded-full" style={{ background: c.appearance.primaryColor, boxShadow: `0 0 24px ${c.appearance.primaryColor}88` }} />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <Mini label="Top" value={`${Math.round(c.tuning.topSpeed)} km/h`} />
                      <Mini label="0–100" value={`${c.tuning.time0to100.toFixed(1)} s`} />
                      <Mini label="Grip" value={String(Math.round(c.tuning.grip))} />
                      <Mini label="Antrieb" value={c.tuning.drive} />
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => onSelect({ kind: "custom", car: c })}
                        className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                        Fahren
                      </button>
                      <button onClick={() => onEdit(c)}
                        className="rounded-md border px-3 py-2 text-xs hover:border-primary">Bearbeiten</button>
                      <button onClick={() => downloadCar(c)}
                        className="rounded-md border px-3 py-2 text-xs hover:border-primary">Export</button>
                      <button onClick={() => { if (confirm(`„${c.name}" wirklich löschen?`)) { deleteCar(c.id); refresh(); } }}
                        className="rounded-md border border-destructive/40 px-3 py-2 text-xs text-destructive hover:bg-destructive/10">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="mt-auto pt-12 font-mono text-xs text-muted-foreground">
          © Drift Lab — Mod-Sharing über .car.json
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

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background/40 px-2 py-1.5">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-bold tabular-nums">{value}</p>
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
