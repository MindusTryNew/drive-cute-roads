import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CarSelect, type CarKey } from "@/components/CarSelect";
import { Simulator } from "@/components/Simulator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Drift Lab — 3D Auto Simulator" },
      { name: "description", content: "Wähle dein Auto und fahre durch eine moderne 3D-Map." },
    ],
  }),
  component: Index,
});

function Index() {
  const [car, setCar] = useState<CarKey | null>(null);
  return car ? (
    <Simulator car={car} onExit={() => setCar(null)} />
  ) : (
    <CarSelect onSelect={setCar} />
  );
}
