import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Plant } from "@/types";

interface Props {
  plant: Plant;
}

const statusStyles: Record<Plant["status"], string> = {
  healthy: "bg-brand-green/10 text-brand-green border-brand-green/20",
  attention: "bg-amber-50 text-amber-600 border-amber-200",
  sick: "bg-red-50 text-red-500 border-red-200",
  propagating: "bg-purple-50 text-purple-600 border-purple-200",
  archived: "bg-brand-card text-brand-carbon/40 border-brand-card",
};

export function PlantCard({ plant }: Props) {
  return (
    <Link href={`/jungle/${plant.id}`} className="block">
      <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] overflow-hidden hover:scale-[1.02] transition-transform duration-200 cursor-pointer">
        <div className="aspect-square bg-[#2C3E2F] relative flex items-center justify-center">
          {plant.photoUrl ? (
            <img
              src={plant.photoUrl}
              alt={plant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-5xl select-none">🌿</span>
          )}
        </div>
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-brand-carbon text-sm leading-tight truncate">
                {plant.name}
              </p>
              <p className="text-xs text-brand-carbon/40 italic truncate">
                {plant.species || "Unknown species"}
              </p>
            </div>
            <Badge
              className={`text-xs rounded-[12px] shrink-0 border capitalize ${statusStyles[plant.status]}`}
            >
              {plant.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={plant.healthScore} className="h-2 flex-1" />
            <span className="text-xs font-bold text-brand-carbon shrink-0">
              {plant.healthScore}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
