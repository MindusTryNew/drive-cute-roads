import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CarSelect, type GarageSelection } from "@/components/CarSelect";
import { CarBuilder } from "@/components/CarBuilder";
import { Simulator } from "@/components/Simulator";
import { presetToSpec, customToSpec, type CarSpec } from "@/lib/car-spec";
import type { CustomCar } from "@/lib/garage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Drift Lab — 3D Auto Simulator" },
      { name: "description", content: "Wähle dein Auto, bau dein eigenes mit Profi-Tuning und Mods, fahre durch eine 3D-Map." },
    ],
  }),
  component: Index,
});

type View =
  | { kind: "garage" }
  | { kind: "builder"; car: CustomCar | null }
  | { kind: "sim"; spec: CarSpec };

function Index() {
  const [view, setView] = useState<View>({ kind: "garage" });

  const handleSelect = (sel: GarageSelection) => {
    const spec = sel.kind === "preset" ? presetToSpec(sel.key) : customToSpec(sel.car);
    setView({ kind: "sim", spec });
  };

  if (view.kind === "sim") {
    return <Simulator spec={view.spec} onExit={() => setView({ kind: "garage" })} />;
  }
  if (view.kind === "builder") {
    return (
      <CarBuilder
        initial={view.car}
        onCancel={() => setView({ kind: "garage" })}
        onSaved={() => setView({ kind: "garage" })}
      />
    );
  }
  return (
    <CarSelect
      onSelect={handleSelect}
      onBuildNew={() => setView({ kind: "builder", car: null })}
      onEdit={(car) => setView({ kind: "builder", car })}
    />
  );
}
