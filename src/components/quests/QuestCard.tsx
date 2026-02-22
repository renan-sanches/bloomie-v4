"use client";
import { Droplets, Sprout, Scissors, RefreshCw, Archive, Stethoscope, FileText, Wind, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Quest, CareType } from "@/types";

const careIcons: Record<CareType, React.ReactNode> = {
  water: <Droplets size={18} className="text-blue-400" />,
  mist: <Wind size={18} className="text-teal-400" />,
  fertilize: <Sprout size={18} className="text-amber-500" />,
  prune: <Scissors size={18} className="text-brand-carbon/50" />,
  rotate: <RefreshCw size={18} className="text-brand-carbon/50" />,
  repot: <Archive size={18} className="text-brand-carbon/50" />,
  diagnose: <Stethoscope size={18} className="text-rose-400" />,
  note: <FileText size={18} className="text-purple-400" />,
};

const careLabels: Record<CareType, string> = {
  water: "Water",
  mist: "Mist",
  fertilize: "Fertilize",
  prune: "Prune",
  rotate: "Rotate",
  repot: "Repot",
  diagnose: "Check Health",
  note: "Log Note",
};

interface Props {
  quest: Quest;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
}

export function QuestCard({ quest, onComplete, onSnooze }: Props) {
  const isOverdue = quest.dueDate < new Date().toISOString().split("T")[0];

  return (
    <div className={`bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-4 flex items-center gap-3 ${isOverdue ? "border border-rose-200" : ""}`}>
      <div className="p-2.5 bg-brand-card rounded-[12px] shrink-0">
        {careIcons[quest.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-brand-carbon truncate">
          {quest.plantName}
        </p>
        <p className="text-xs text-brand-carbon/50 capitalize">
          {careLabels[quest.type]}
          {" · "}
          <span className={isOverdue ? "text-rose-500 font-semibold" : ""}>
            {isOverdue ? "Overdue" : quest.dueDate}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Star size={12} className="text-amber-400 fill-amber-400" />
        <span className="text-xs font-bold text-amber-500">{quest.xpReward}</span>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="rounded-[12px] text-xs h-8 px-3 border-brand-card text-brand-carbon/60"
          onClick={() => onSnooze(quest.id)}
        >
          Snooze
        </Button>
        <Button
          size="sm"
          className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[12px] text-xs h-8 px-3"
          onClick={() => onComplete(quest.id)}
        >
          Done ✓
        </Button>
      </div>
    </div>
  );
}
