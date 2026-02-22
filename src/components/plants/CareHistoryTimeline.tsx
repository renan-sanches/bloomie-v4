import type { CareHistoryEntry, CareType } from "@/types";
import {
  Droplets,
  Sprout,
  Scissors,
  RefreshCw,
  Archive,
  Stethoscope,
  FileText,
  Wind,
} from "lucide-react";

const careIcons: Record<CareType, React.ReactNode> = {
  water: <Droplets size={16} className="text-blue-400" />,
  mist: <Wind size={16} className="text-teal-400" />,
  fertilize: <Sprout size={16} className="text-amber-500" />,
  prune: <Scissors size={16} className="text-brand-carbon/50" />,
  rotate: <RefreshCw size={16} className="text-brand-carbon/50" />,
  repot: <Archive size={16} className="text-brand-carbon/50" />,
  diagnose: <Stethoscope size={16} className="text-rose-400" />,
  note: <FileText size={16} className="text-purple-400" />,
};

const careLabels: Record<CareType, string> = {
  water: "Watered",
  mist: "Misted",
  fertilize: "Fertilized",
  prune: "Pruned",
  rotate: "Rotated",
  repot: "Repotted",
  diagnose: "Diagnosed",
  note: "Note",
};

interface Props {
  entries: CareHistoryEntry[];
}

export function CareHistoryTimeline({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-brand-carbon/40 py-6 text-center">
        No care history yet. Start caring for your plant!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-3 items-start">
          <div className="mt-0.5 p-2 bg-brand-card rounded-[12px] shrink-0">
            {careIcons[entry.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-brand-carbon">
                {careLabels[entry.type]}
              </span>
              <span className="text-xs text-brand-carbon/40 shrink-0">
                {new Date(entry.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year:
                    new Date(entry.timestamp).getFullYear() !==
                    new Date().getFullYear()
                      ? "numeric"
                      : undefined,
                })}
              </span>
            </div>
            {entry.note && (
              <p className="text-sm text-brand-carbon/60 mt-0.5 leading-snug">
                {entry.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
