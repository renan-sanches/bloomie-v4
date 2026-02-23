"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuests } from "@/hooks/use-quests";
import { usePlants } from "@/hooks/use-plants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Download, Link as LinkIcon, Calendar, UmbrellaOff } from "lucide-react";
import type { Quest, CareType } from "@/types";


// ─── ICS Helpers ─────────────────────────────────────────────────────────────

function generateICS(
  events: Array<{ title: string; startDate: string; description?: string }>
): string {
  const formatDate = (iso: string) => iso.replace(/-/g, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bloomie//Plant Care Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${crypto.randomUUID()}`,
      `DTSTART;VALUE=DATE:${formatDate(event.startDate)}`,
      `DTEND;VALUE=DATE:${formatDate(event.startDate)}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description}` : "",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

function downloadICS(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Care Type Helpers ────────────────────────────────────────────────────────

const CARE_DOT_COLOR: Record<CareType, string> = {
  water: "bg-blue-400",
  fertilize: "bg-amber-400",
  mist: "bg-teal-400",
  prune: "bg-green-500",
  repot: "bg-purple-400",
  rotate: "bg-gray-400",
  diagnose: "bg-red-400",
  note: "bg-zinc-400",
};

const CARE_ICON: Record<CareType, string> = {
  water: "💧",
  fertilize: "🌱",
  mist: "💨",
  prune: "✂️",
  repot: "🪴",
  rotate: "🔄",
  diagnose: "🔍",
  note: "📝",
};

const CARE_LABEL: Record<CareType, string> = {
  water: "Water",
  fertilize: "Fertilize",
  mist: "Mist",
  prune: "Prune",
  repot: "Repot",
  rotate: "Rotate",
  diagnose: "Diagnose",
  note: "Note",
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function toISO(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user } = useAuth();
  const { overdue, todayQuests, upcoming, loading: questsLoading } = useQuests(user?.uid);
  const { plants, loading: plantsLoading } = usePlants(user?.uid);

  // Flatten all quests into one array
  const allQuests: Quest[] = useMemo(
    () => [...overdue, ...todayQuests, ...upcoming],
    [overdue, todayQuests, upcoming]
  );

  // ── Calendar state ──
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // ── Export state ──
  const [exportPlantId, setExportPlantId] = useState<string>("");
  const [sitterCopied, setSitterCopied] = useState(false);

  // ── Vacation state ──
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");

  // ── Derived calendar values ──
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const today = new Date().toISOString().split("T")[0];

  // Build quest map: ISO date → Quest[]
  const questsByDate = useMemo(() => {
    const map: Record<string, Quest[]> = {};
    for (const q of allQuests) {
      if (!map[q.dueDate]) map[q.dueDate] = [];
      map[q.dueDate].push(q);
    }
    return map;
  }, [allQuests]);

  // Build calendar grid (6 rows x 7 cols)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; iso: string | null }> = [];

    // Leading empty cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ day: null, iso: null });
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, iso: toISO(year, month, d) });
    }
    // Trailing empty cells to fill 6 rows (42 cells)
    while (cells.length < 42) {
      cells.push({ day: null, iso: null });
    }
    return cells;
  }, [year, month]);

  // Quests for the selected day
  const selectedDayQuests: Quest[] = selectedDay
    ? (questsByDate[selectedDay] ?? [])
    : [];

  // Format selected day for display
  const selectedDayLabel = useMemo(() => {
    if (!selectedDay) return "";
    const [y, m, d] = selectedDay.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [selectedDay]);

  // ── Navigation ──
  function prevMonth() {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
    setSelectedDay(null);
  }

  // ── ICS Export ──
  function handleExportAll() {
    const events = allQuests.map((q) => ({
      title: `${CARE_LABEL[q.type]} ${q.plantName}`,
      startDate: q.dueDate,
      description: `Care type: ${q.type} | XP: ${q.xpReward}`,
    }));
    const content = generateICS(events);
    downloadICS("bloomie-full-jungle.ics", content);
  }

  function handleExportPlant() {
    if (!exportPlantId) return;
    const plant = plants.find((p) => p.id === exportPlantId);
    if (!plant) return;
    const events = allQuests
      .filter((q) => q.plantId === exportPlantId)
      .map((q) => ({
        title: `${CARE_LABEL[q.type]} ${q.plantName}`,
        startDate: q.dueDate,
        description: `Care type: ${q.type} | XP: ${q.xpReward}`,
      }));
    const content = generateICS(events);
    downloadICS(`bloomie-${plant.name.toLowerCase().replace(/\s+/g, "-")}.ics`, content);
  }

  function handleCopySitterLink() {
    const displayName = user?.displayName ?? "Your plant parent";
    const plantLines = plants
      .map((p) => {
        const nextQuest = allQuests.find((q) => q.plantId === p.id);
        const nextDate = nextQuest ? nextQuest.dueDate : p.nextWaterDate;
        return `• ${p.name} — next care: ${nextDate}`;
      })
      .join("\n");

    const text = `🌿 Plant sitter instructions for ${displayName}'s jungle:\n${plantLines}`;
    navigator.clipboard.writeText(text).then(() => {
      setSitterCopied(true);
      setTimeout(() => setSitterCopied(false), 2500);
    });
  }

  // ── Loading state ──
  const loading = questsLoading || plantsLoading;

  return (
    <div className="p-6 max-w-3xl mx-auto pb-28">
      {/* Page Header */}
      <h1 className="text-3xl font-extrabold text-brand-carbon mb-6 flex items-center gap-2">
        <Calendar size={28} className="text-brand-green" />
        Care Calendar
      </h1>

      {/* ── Calendar Card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5 mb-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevMonth}
            className="rounded-[16px]"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </Button>
          <span className="text-base font-bold text-brand-carbon">
            {MONTH_NAMES[month]} {year}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="rounded-[16px]"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((name) => (
            <div
              key={name}
              className="text-center text-[10px] font-bold uppercase tracking-widest text-brand-carbon/40 py-1"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-[12px] bg-brand-card/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5">
            {calendarCells.map((cell, idx) => {
              if (!cell.day || !cell.iso) {
                return <div key={idx} className="aspect-square" />;
              }

              const isToday = cell.iso === today;
              const isSelected = cell.iso === selectedDay;
              const dayQuests = questsByDate[cell.iso] ?? [];

              // Unique care types for dots
              const uniqueTypes = Array.from(new Set(dayQuests.map((q) => q.type)));

              return (
                <button
                  key={idx}
                  onClick={() =>
                    setSelectedDay((prev) => (prev === cell.iso ? null : cell.iso))
                  }
                  className={[
                    "aspect-square flex flex-col items-center justify-start pt-1.5 rounded-[12px] transition-all text-sm font-semibold relative",
                    isToday
                      ? "bg-brand-green text-white"
                      : isSelected
                      ? "bg-brand-card border-2 border-brand-green text-brand-carbon"
                      : "hover:bg-brand-card/60 text-brand-carbon",
                  ].join(" ")}
                >
                  <span className="text-xs leading-none">{cell.day}</span>
                  {uniqueTypes.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full px-0.5">
                      {uniqueTypes.slice(0, 3).map((type) => (
                        <span
                          key={type}
                          className={`w-1.5 h-1.5 rounded-full ${CARE_DOT_COLOR[type]} ${isToday ? "opacity-80" : ""}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Day Detail Panel ───────────────────────────────────────────────── */}
      {selectedDay && (
        <div className="bg-brand-card rounded-[32px] p-5 mb-4">
          <h2 className="text-sm font-bold text-brand-carbon mb-3">
            Care for {selectedDayLabel}
          </h2>

          {selectedDayQuests.length === 0 ? (
            <p className="text-sm text-brand-carbon/60">
              Nothing scheduled — enjoy a plant-free day 🌿
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedDayQuests.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between bg-white rounded-[16px] px-4 py-2.5 shadow-[0px_2px_12px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">
                      {CARE_ICON[q.type]}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-brand-carbon leading-none">
                        {q.plantName}
                      </p>
                      <p className="text-xs text-brand-carbon/50 mt-0.5">
                        {CARE_LABEL[q.type]}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-brand-purple/20 text-brand-carbon text-xs rounded-[12px] border-0 font-semibold">
                    +{q.xpReward} XP
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Section: Export + Vacation ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Export Card */}
        <div className="flex-1 bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Download size={18} className="text-brand-green" />
            <h2 className="text-sm font-bold text-brand-carbon">Export</h2>
          </div>

          {/* Full Jungle Export */}
          <div className="mb-4">
            <p className="text-xs text-brand-carbon/50 mb-2 font-semibold uppercase tracking-wide">
              Full Jungle
            </p>
            <Button
              onClick={handleExportAll}
              disabled={allQuests.length === 0}
              className="w-full bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] gap-2"
            >
              <Download size={16} />
              Export All Quests (.ics)
            </Button>
          </div>

          {/* By Plant Export */}
          <div className="mb-4">
            <p className="text-xs text-brand-carbon/50 mb-2 font-semibold uppercase tracking-wide">
              By Plant
            </p>
            <div className="flex gap-2">
              <select
                value={exportPlantId}
                onChange={(e) => setExportPlantId(e.target.value)}
                className="flex-1 border border-brand-card rounded-[12px] px-3 py-2 text-sm text-brand-carbon bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              >
                <option value="">Select a plant…</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleExportPlant}
                disabled={!exportPlantId}
                variant="outline"
                className="rounded-[16px] border-brand-card gap-2 shrink-0"
              >
                <Download size={14} />
                Export
              </Button>
            </div>
          </div>

          {/* Shareable Sitter Link */}
          <div>
            <p className="text-xs text-brand-carbon/50 mb-2 font-semibold uppercase tracking-wide">
              Shareable Sitter Link
            </p>
            <Button
              onClick={handleCopySitterLink}
              variant="outline"
              className="w-full rounded-[16px] border-brand-card gap-2"
            >
              <LinkIcon size={16} />
              {sitterCopied ? "Copied!" : "Copy Sitter Instructions"}
            </Button>
            {sitterCopied && (
              <p className="text-xs text-brand-green mt-1.5 font-medium text-center">
                Sitter text copied to clipboard
              </p>
            )}
          </div>
        </div>

        {/* Vacation Mode Card */}
        <div className="flex-1 bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <UmbrellaOff size={18} className="text-brand-orange" />
            <h2 className="text-sm font-bold text-brand-carbon">Vacation Mode</h2>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-brand-carbon">
                Enable vacation mode
              </p>
              <p className="text-xs text-brand-carbon/50 mt-0.5">
                Quests won&apos;t count toward your streak
              </p>
            </div>
            <Switch
              checked={vacationMode}
              onCheckedChange={setVacationMode}
            />
          </div>

          {vacationMode && (
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-brand-carbon/60 mb-1 block uppercase tracking-wide">
                  Start Date
                </label>
                <input
                  type="date"
                  value={vacationStart}
                  onChange={(e) => setVacationStart(e.target.value)}
                  className="w-full border border-brand-card rounded-[12px] px-3 py-2 text-sm text-brand-carbon bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-carbon/60 mb-1 block uppercase tracking-wide">
                  End Date
                </label>
                <input
                  type="date"
                  value={vacationEnd}
                  onChange={(e) => setVacationEnd(e.target.value)}
                  min={vacationStart}
                  className="w-full border border-brand-card rounded-[12px] px-3 py-2 text-sm text-brand-carbon bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>

              {vacationStart && vacationEnd && vacationEnd >= vacationStart ? (
                <div className="flex items-center gap-2 bg-brand-green/10 rounded-[12px] px-3 py-2">
                  <span className="text-brand-green text-sm font-bold">Vacation set</span>
                  <Badge className="bg-brand-green text-white border-0 rounded-[12px] text-xs">
                    {vacationStart} → {vacationEnd}
                  </Badge>
                </div>
              ) : (
                vacationMode && (
                  <p className="text-xs text-brand-carbon/40 italic">
                    Pick a start and end date to activate vacation mode.
                  </p>
                )
              )}

              <p className="text-xs text-brand-carbon/50">
                Plants will be on vacation mode. Quests during this period won&apos;t count toward your streak.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
