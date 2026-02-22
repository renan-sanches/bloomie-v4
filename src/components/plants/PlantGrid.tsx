import { PlantCard } from "./PlantCard";
import type { Plant } from "@/types";

interface Props {
  plants: Plant[];
}

export function PlantGrid({ plants }: Props) {
  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <span className="text-6xl select-none">🌱</span>
        <p className="font-bold text-brand-carbon text-lg">Your jungle is empty</p>
        <p className="text-sm text-brand-carbon/60">
          Add your first plant to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {plants.map((p) => (
        <PlantCard key={p.id} plant={p} />
      ))}
    </div>
  );
}
