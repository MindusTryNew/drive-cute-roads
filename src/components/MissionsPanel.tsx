import { useEffect, useState } from "react";
import type { Mission } from "@/lib/missions";
import { secondsUntilNextRotation } from "@/lib/missions";

export function MissionsPanel({
  mission,
  progress,
  statusText,
}: {
  mission: Mission;
  progress: number;
  statusText: string;
}) {
  const [countdown, setCountdown] = useState(secondsUntilNextRotation());

  useEffect(() => {
    const id = setInterval(() => setCountdown(secondsUntilNextRotation()), 1000);
    return () => clearInterval(id);
  }, []);

  const m = Math.floor(countdown / 60);
  const s = countdown % 60;

  return (
    <div className="pointer-events-none absolute left-6 top-24 max-w-[300px] rounded-xl border bg-card/80 px-4 py-3 backdrop-blur-md">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Mission · {mission.reward} 🪙</p>
      <p className="mt-1 text-sm font-bold leading-tight">{mission.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{mission.desc}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/60">
        <div className="h-full rounded-full bg-primary transition-[width] duration-200"
             style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }} />
      </div>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">{statusText}</p>
      <p className="mt-1 font-mono text-[9px] text-muted-foreground/70">
        Neue Missionen in {m}:{String(s).padStart(2, "0")}
      </p>
    </div>
  );
}
