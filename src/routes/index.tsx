import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CarSelect, type GarageSelection, type Mode as PickMode } from "@/components/CarSelect";
import { CarBuilder } from "@/components/CarBuilder";
import { Simulator } from "@/components/Simulator";
import { Lobby } from "@/components/Lobby";
import { Market } from "@/components/Market";
import { MissionsScreen } from "@/components/MissionsScreen";
import { ModBrowser } from "@/components/ModBrowser";
import { TutorialScreen } from "@/components/TutorialScreen";
import { MapEditor } from "@/components/MapEditor";
import { Inventory } from "@/components/Inventory";
import { CollectionCatalog } from "@/components/CollectionCatalog";
import { presetToSpec, customToSpec, type CarSpec } from "@/lib/car-spec";
import type { CustomCar } from "@/lib/garage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Drift Lab — 3D Auto Simulator" },
      { name: "description", content: "Bau eigene Autos, fahre Missionen, handle auf dem Markt, entdecke Community-Mods." },
    ],
  }),
  component: Index,
});

type View =
  | { kind: "garage" }
  | { kind: "builder"; car: CustomCar | null }
  | { kind: "market" }
  | { kind: "missions" }
  | { kind: "mods" }
  | { kind: "tutorial" }
  | { kind: "map-editor" }
  | { kind: "pick-p2"; spec1: CarSpec }
  | { kind: "lobby"; spec: CarSpec }
  | { kind: "sim-solo"; spec: CarSpec }
  | { kind: "sim-split"; spec1: CarSpec; spec2: CarSpec }
  | { kind: "sim-online"; spec: CarSpec; room: string; name: string };

function specOf(sel: GarageSelection): CarSpec {
  return sel.kind === "preset" ? presetToSpec(sel.key) : customToSpec(sel.car);
}

function Index() {
  const [view, setView] = useState<View>({ kind: "garage" });
  const [mode, setMode] = useState<PickMode>("solo");

  if (view.kind === "sim-solo") {
    return <Simulator spec={view.spec} mode={{ kind: "solo" }} onExit={() => setView({ kind: "garage" })} />;
  }
  if (view.kind === "sim-split") {
    return <Simulator spec={view.spec1} mode={{ kind: "split", spec2: view.spec2 }} onExit={() => setView({ kind: "garage" })} />;
  }
  if (view.kind === "sim-online") {
    return <Simulator spec={view.spec} mode={{ kind: "online", room: view.room, name: view.name }} onExit={() => setView({ kind: "garage" })} />;
  }
  if (view.kind === "lobby") {
    return (
      <Lobby
        onCancel={() => setView({ kind: "garage" })}
        onJoin={(room, name) => setView({ kind: "sim-online", spec: view.spec, room, name })}
      />
    );
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
  if (view.kind === "market") {
    return <Market onBack={() => setView({ kind: "garage" })} />;
  }
  if (view.kind === "missions") {
    return <MissionsScreen onBack={() => setView({ kind: "garage" })} />;
  }
  if (view.kind === "mods") {
    return <ModBrowser onBack={() => setView({ kind: "garage" })} onOpenTutorial={() => setView({ kind: "tutorial" })} />;
  }
  if (view.kind === "tutorial") {
    return <TutorialScreen onBack={() => setView({ kind: "mods" })} />;
  }
  if (view.kind === "map-editor") {
    return <MapEditor onBack={() => setView({ kind: "garage" })} />;
  }
  if (view.kind === "pick-p2") {
    return (
      <CarSelect
        mode="solo"
        onModeChange={() => {}}
        headline="Wähle das Auto von Spieler 2"
        onSelect={(sel) => setView({ kind: "sim-split", spec1: view.spec1, spec2: specOf(sel) })}
        onBuildNew={() => {}}
        onEdit={() => {}}
        hideBuildActions
      />
    );
  }

  return (
    <CarSelect
      mode={mode}
      onModeChange={setMode}
      onOpenMarket={() => setView({ kind: "market" })}
      onOpenMissions={() => setView({ kind: "missions" })}
      onOpenMods={() => setView({ kind: "mods" })}
      onOpenTutorial={() => setView({ kind: "tutorial" })}
      onOpenMapEditor={() => setView({ kind: "map-editor" })}
      onSelect={(sel) => {
        const spec = specOf(sel);
        if (mode === "solo") setView({ kind: "sim-solo", spec });
        else if (mode === "split") setView({ kind: "pick-p2", spec1: spec });
        else setView({ kind: "lobby", spec });
      }}
      onBuildNew={() => setView({ kind: "builder", car: null })}
      onEdit={(car) => setView({ kind: "builder", car })}
    />
  );
}
