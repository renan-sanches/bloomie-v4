"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuests } from "@/hooks/use-quests";
import { QuestCard } from "@/components/quests/QuestCard";
import { setQuest } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Quest } from "@/types";

export const dynamic = "force-dynamic";

export default function QuestsPage() {
  const { user } = useAuth();
  const { overdue, todayQuests, upcoming, loading } = useQuests(user?.uid);

  const completeQuest = async (questId: string) => {
    if (!user) return;
    await setQuest(user.uid, questId, { status: "completed" });
  };

  const snoozeQuest = async (questId: string) => {
    if (!user) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await setQuest(user.uid, questId, {
      status: "snoozed",
      snoozedUntil: tomorrow.toISOString().split("T")[0],
    });
  };

  const Section = ({
    title,
    quests,
    accentClass = "text-brand-carbon/60",
  }: {
    title: string;
    quests: Quest[];
    accentClass?: string;
  }) => {
    if (quests.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className={`text-xs font-bold uppercase tracking-widest mb-3 ${accentClass}`}>
          {title} <span className="opacity-60">({quests.length})</span>
        </h2>
        <div className="flex flex-col gap-3">
          {quests.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              onComplete={completeQuest}
              onSnooze={snoozeQuest}
            />
          ))}
        </div>
      </div>
    );
  };

  const allEmpty = overdue.length === 0 && todayQuests.length === 0 && upcoming.length === 0;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-brand-carbon mb-6">
        Quest Log
      </h1>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-[32px]" />
          ))}
        </div>
      ) : allEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <span className="text-6xl select-none">🎉</span>
          <p className="font-bold text-brand-carbon text-xl">All caught up!</p>
          <p className="text-sm text-brand-carbon/60">
            No quests pending right now.
          </p>
        </div>
      ) : (
        <>
          <Section title="Overdue" quests={overdue} accentClass="text-rose-500" />
          <Section title="Today" quests={todayQuests} accentClass="text-brand-green" />
          <Section title="Upcoming" quests={upcoming} />
        </>
      )}
    </div>
  );
}
