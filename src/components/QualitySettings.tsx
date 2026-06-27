import { useEffect, useState } from "react";
import { getQualitySetting, setQualitySetting, type QualityKey } from "@/lib/perf";

export function QualitySettings({ fps, onClose }: { fps: number; onClose: () => void }) {
  const [q, setQ] = useState<QualityKey>("auto");
  useEffect(() => { setQ(getQualitySetting()); }, []);
  const pick = (k: QualityKey) => {
    setQ(k);
    setQualitySetting(k);
  };

  const opts: { id: QualityKey; label: string; desc: string }[] = [
    { id: "auto", label: "Auto", desc: "Wählt passendes Preset (CPU / DPR)" },
    { id: "low", label: "Low", desc: "Keine Schatten · wenige Gebäude · 1× Pixel" },
    { id: "med", label: "Medium", desc: "Schatten · 70 Gebäude · 1.5× Pixel" },
    { id: "high", label: "High", desc: "Alle Effekte · 120 Gebäude · 2× Pixel" },
  ];

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[min(420px,90vw)] rounded-2xl border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Grafik / Performance</h3>
          <p className="font-mono text-xs text-muted-foreground">{fps} FPS</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Änderung greift beim nächsten Sim-Start. Aktuell: <b>{q}</b>
        </p>
        <div className="mt-4 space-y-2">
          {opts.map((o) => (
            <button key={o.id}
              onClick={() => pick(o.id)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                q === o.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}>
              <p className="font-bold">{o.label}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{o.desc}</p>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground">
          Schließen
        </button>
      </div>
    </div>
  );
}
